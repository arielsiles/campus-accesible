// FR-207, FR-405, FR-1401, FR-1402, FR-1406: Route calculation endpoint
// Extended in Fase 14 to accept arbitrary GPS origin/destination via
// nearest-waypoint resolution and approach legs.
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { calculateRoute } from "../services/routingService";
import type { RoutingProfile } from "../services/profileWeights";
import {
  findNearestNode,
  bearingDeg,
} from "../services/nearestNodeService";
import { calculateOsmRoute } from "../services/osmRoutingService";
import type { ApproachLeg, RouteSource } from "@campus-gps/shared-types";

const prisma = new PrismaClient();

export const calculateRoutes = new Hono();

const routeCalculationSchema = z.object({
  // EITHER waypointId
  origin: z.string().optional(),
  destination: z.string().optional(),
  // OR coordinates
  fromLat: z.number().min(-90).max(90).optional(),
  fromLng: z.number().min(-180).max(180).optional(),
  toLat: z.number().min(-90).max(90).optional(),
  toLng: z.number().min(-180).max(180).optional(),
  toName: z.string().max(200).optional(), // free-form destination name
  profile: z
    .enum(["standard", "visual_disability", "reduced_mobility", "deaf", "easy_read"])
    .optional()
    .default("standard"),
});

const APPROACH_THRESHOLD_M = 5; // distances <= this are considered "on the node"
const MAX_APPROACH_M = 500; // beyond this, refuse to attach an approach leg

function cardinalDirection(deg: number): string {
  if (deg < 22.5) return "norte";
  if (deg < 67.5) return "noreste";
  if (deg < 112.5) return "este";
  if (deg < 157.5) return "sureste";
  if (deg < 202.5) return "sur";
  if (deg < 247.5) return "suroeste";
  if (deg < 292.5) return "oeste";
  if (deg < 337.5) return "noroeste";
  return "norte";
}

// POST /api/routes/calculate
calculateRoutes.post("/routes/calculate", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      400
    );
  }

  const parsed = routeCalculationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
        },
      },
      400
    );
  }

  const data = parsed.data;
  const approachLegs: ApproachLeg[] = [];

  // FR-1401: Resolve origin — either waypointId or GPS coords
  let originWaypointId = data.origin;
  if (!originWaypointId && data.fromLat != null && data.fromLng != null) {
    const nearest = await findNearestNode(
      prisma,
      data.fromLat,
      data.fromLng,
      MAX_APPROACH_M
    );
    if (!nearest) {
      return c.json(
        {
          error: {
            code: "NO_NEARBY_NODE",
            message: `No hay waypoints registrados a menos de ${MAX_APPROACH_M}m de tu ubicacion.`,
          },
        },
        404
      );
    }
    originWaypointId = nearest.waypointId;

    // FR-1406: Add start approach leg if user is far from the nearest node
    if (nearest.distanceM > APPROACH_THRESHOLD_M) {
      approachLegs.push({
        position: "start",
        fromCoords: [data.fromLng, data.fromLat],
        toCoords: [nearest.longitude, nearest.latitude],
        distanceM: Math.round(nearest.distanceM),
        bearingDeg: Math.round(nearest.bearingDeg),
        instructionText: `Avanza ${Math.round(nearest.distanceM)} metros hacia el ${cardinalDirection(nearest.bearingDeg)} hasta el inicio de la ruta`,
      });
    }
  }

  if (!originWaypointId) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Se requiere `origin` (waypointId) o `fromLat`/`fromLng`",
        },
      },
      400
    );
  }

  // FR-1402: Resolve destination — either waypointId or GPS coords
  let destinationWaypointId = data.destination;
  let endApproach: ApproachLeg | null = null;
  if (!destinationWaypointId && data.toLat != null && data.toLng != null) {
    const nearest = await findNearestNode(
      prisma,
      data.toLat,
      data.toLng,
      MAX_APPROACH_M
    );
    if (!nearest) {
      return c.json(
        {
          error: {
            code: "NO_NEARBY_NODE",
            message: `El destino esta a mas de ${MAX_APPROACH_M}m de cualquier waypoint registrado.`,
          },
        },
        404
      );
    }
    destinationWaypointId = nearest.waypointId;
    if (nearest.distanceM > APPROACH_THRESHOLD_M) {
      // Bearing reversed: from nearest node TO destination
      const reverseBearing = bearingDeg(
        nearest.latitude,
        nearest.longitude,
        data.toLat,
        data.toLng
      );
      endApproach = {
        position: "end",
        fromCoords: [nearest.longitude, nearest.latitude],
        toCoords: [data.toLng, data.toLat],
        distanceM: Math.round(nearest.distanceM),
        bearingDeg: Math.round(reverseBearing),
        instructionText: `Has llegado al final de la ruta mapeada. ${data.toName ?? "El destino"} esta a ${Math.round(nearest.distanceM)} metros al ${cardinalDirection(reverseBearing)}`,
      };
    }
  }

  if (!destinationWaypointId) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Se requiere `destination` (waypointId) o `toLat`/`toLng`",
        },
      },
      400
    );
  }

  // Calculate route on the existing graph (same logic as before)
  const result = await calculateRoute(
    prisma,
    originWaypointId,
    destinationWaypointId,
    data.profile as RoutingProfile
  );

  if (!result.success) {
    const statusCode =
      result.error.code === "SAME_ORIGIN_DESTINATION" ||
      result.error.code === "VALIDATION_ERROR"
        ? 400
        : 404;
    return c.json({ error: result.error }, statusCode);
  }

  if (endApproach) approachLegs.push(endApproach);

  // FR-1406, FR-1407: Enrich result with approach legs and source indicator
  const enrichedRoute = {
    ...result.route,
    approachLegs: approachLegs.length > 0 ? approachLegs : undefined,
    source: "graph" as const,
    totalDistance:
      result.route.totalDistance +
      approachLegs.reduce((sum, l) => sum + l.distanceM, 0),
  };

  return c.json({ route: enrichedRoute });
});

// FR-1404: POST /api/routes/calculate-osm
// Pure OSM-based routing for areas without registered waypoints.
const osmCalcSchema = z.object({
  fromLat: z.number().min(-90).max(90),
  fromLng: z.number().min(-180).max(180),
  toLat: z.number().min(-90).max(90),
  toLng: z.number().min(-180).max(180),
  toName: z.string().max(200).optional(),
  profile: z
    .enum(["standard", "visual_disability", "reduced_mobility", "deaf", "easy_read"])
    .optional()
    .default("standard"),
});

calculateRoutes.post("/routes/calculate-osm", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = osmCalcSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
        },
      },
      400
    );
  }

  const result = await calculateOsmRoute(
    parsed.data.fromLat,
    parsed.data.fromLng,
    parsed.data.toLat,
    parsed.data.toLng,
    parsed.data.profile
  );

  if (!result) {
    return c.json(
      {
        error: {
          code: "NO_OSM_ROUTE",
          message:
            "No se encontro ruta peatonal en OSM para esta zona. Datos OSM incompletos o muy lejos.",
        },
      },
      404
    );
  }

  return c.json({
    route: result,
    source: "osm" as RouteSource,
  });
});
