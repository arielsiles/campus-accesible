// FR-007: Routes endpoints — GET /api/routes, GET /api/routes/:id
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const routeRoutes = new Hono();

// GET /api/routes — list all routes
routeRoutes.get("/routes", async (c) => {
  const routes = await prisma.route.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return c.json(routes);
});

// GET /api/routes/:id — get route with waypoints and segments
routeRoutes.get("/routes/:id", async (c) => {
  const { id } = c.req.param();

  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      waypoints: { orderBy: { order: "asc" } },
      segments: { orderBy: { order: "asc" } },
    },
  });

  if (!route) {
    return c.json(
      { error: { code: "NOT_FOUND", message: `Route '${id}' not found` } },
      404
    );
  }

  // FR-006: Transform to GeoJSON FeatureCollection
  const geojson = {
    type: "FeatureCollection" as const,
    properties: {
      id: route.id,
      name: route.name,
      description: route.description,
    },
    features: [
      // Waypoint features (Point)
      ...route.waypoints.map((wp) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [wp.longitude, wp.latitude],
        },
        properties: {
          featureType: "waypoint",
          waypointId: wp.waypointId,
          name: wp.name,
          description: wp.description,
          waypointType: wp.waypointType,
          order: wp.order,
        },
      })),
      // Segment features (LineString) — built from consecutive waypoints
      ...route.segments.map((seg, i) => {
        const startWp = route.waypoints[i];
        const endWp = route.waypoints[i + 1];
        const coordinates =
          startWp && endWp
            ? [
                [startWp.longitude, startWp.latitude],
                [endWp.longitude, endWp.latitude],
              ]
            : [];

        return {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates,
          },
          properties: {
            featureType: "route-segment",
            segmentId: seg.segmentId,
            name: seg.name,
            surfaceType: seg.surfaceType,
            elevationChange: seg.elevationChange,
            riskLevel: seg.riskLevel,
            order: seg.order,
          },
        };
      }),
    ],
  };

  return c.json(geojson);
});
