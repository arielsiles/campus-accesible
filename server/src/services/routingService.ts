// FR-207: Route calculation orchestration service
import { PrismaClient } from "@prisma/client";
import { findShortestPath } from "@campus-gps/routing-engine";
import type { GraphEdgeInput } from "@campus-gps/routing-engine";
import type {
  CalculatedRoute,
  WaypointSummary,
  NavigationInstruction,
} from "@campus-gps/shared-types";
import { haversineDistance } from "./graphBuilder";

const WALKING_SPEED_MS = 4000 / 3600; // 4 km/h in m/s

/**
 * Calculate angle between two coordinate pairs (bearing in degrees 0-360)
 */
function calculateBearing(
  from: [number, number],
  to: [number, number]
): number {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;

  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Determine turn action based on bearing change
 */
function getTurnAction(
  prevBearing: number,
  currentBearing: number
): NavigationInstruction["action"] {
  let diff = currentBearing - prevBearing;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  if (Math.abs(diff) < 20) return "continue";
  if (diff >= 20 && diff < 60) return "slight_right";
  if (diff >= 60) return "turn_right";
  if (diff <= -20 && diff > -60) return "slight_left";
  return "turn_left";
}

/**
 * Generate turn-by-turn instructions from waypoint sequence
 */
function generateInstructions(
  waypoints: WaypointSummary[],
  transportData: Map<string, { transportType: string; lines: string[] }>
): NavigationInstruction[] {
  if (waypoints.length < 2) return [];

  const instructions: NavigationInstruction[] = [];
  let prevBearing: number | null = null;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const distance = haversineDistance(from.coordinates, to.coordinates);
    const bearing = calculateBearing(from.coordinates, to.coordinates);

    let action: NavigationInstruction["action"];
    if (i === 0) {
      action = "start";
    } else {
      action = getTurnAction(prevBearing!, bearing);
    }

    // FR-205: Include transport info in description
    const transport = transportData.get(to.waypointId);
    let description: string;

    if (i === 0) {
      description = `Sal de ${from.name} y camina hacia ${to.name}`;
    } else if (action === "continue") {
      description = `Continúa recto hasta ${to.name}`;
    } else {
      const direction =
        action === "turn_left" || action === "slight_left"
          ? "a la izquierda"
          : "a la derecha";
      description = `Gira ${direction} hacia ${to.name}`;
    }

    if (transport) {
      const typeLabel =
        transport.transportType === "metro"
          ? "línea"
          : transport.transportType === "bus"
            ? "líneas"
            : "";
      description += ` (${typeLabel} ${transport.lines.join(", ")})`;
    }

    instructions.push({
      action,
      distance: Math.round(distance),
      waypointName: to.name,
      waypointType: to.waypointType,
      description,
      bearing: Math.round(bearing),
    });

    prevBearing = bearing;
  }

  // Add arrival instruction
  const last = waypoints[waypoints.length - 1];
  const transport = transportData.get(last.waypointId);
  let arrivalDesc = `Has llegado a tu destino: ${last.name}`;
  if (transport) {
    arrivalDesc += ` (${transport.transportType === "metro" ? "línea" : "líneas"} ${transport.lines.join(", ")})`;
  }

  instructions.push({
    action: "arrive",
    distance: 0,
    waypointName: last.name,
    waypointType: last.waypointType,
    description: arrivalDesc,
    bearing: 0,
  });

  return instructions;
}

export interface RouteCalculationError {
  code: "WAYPOINT_NOT_FOUND" | "SAME_ORIGIN_DESTINATION" | "NO_ROUTE_FOUND";
  message: string;
}

export type RouteCalculationResult =
  | { success: true; route: CalculatedRoute }
  | { success: false; error: RouteCalculationError };

/**
 * Calculate optimal route between two waypoints.
 */
export async function calculateRoute(
  prisma: PrismaClient,
  originWaypointId: string,
  destinationWaypointId: string
): Promise<RouteCalculationResult> {
  // Validate same origin/destination
  if (originWaypointId === destinationWaypointId) {
    return {
      success: false,
      error: {
        code: "SAME_ORIGIN_DESTINATION",
        message: "El origen y el destino son el mismo waypoint",
      },
    };
  }

  // Find origin and destination waypoints
  const [originWp, destWp] = await Promise.all([
    prisma.waypoint.findUnique({ where: { waypointId: originWaypointId } }),
    prisma.waypoint.findUnique({ where: { waypointId: destinationWaypointId } }),
  ]);

  if (!originWp) {
    return {
      success: false,
      error: {
        code: "WAYPOINT_NOT_FOUND",
        message: `Waypoint de origen '${originWaypointId}' no encontrado`,
      },
    };
  }

  if (!destWp) {
    return {
      success: false,
      error: {
        code: "WAYPOINT_NOT_FOUND",
        message: `Waypoint de destino '${destinationWaypointId}' no encontrado`,
      },
    };
  }

  // Load graph edges
  const graphEdges = await prisma.graphEdge.findMany({
    include: { fromWaypoint: true, toWaypoint: true },
  });

  const edges: GraphEdgeInput[] = graphEdges.map((e) => ({
    id: e.id,
    fromWaypointId: e.fromWaypoint.waypointId,
    toWaypointId: e.toWaypoint.waypointId,
    distance: e.distance,
    weight: e.weight,
  }));

  // Run Dijkstra
  const pathResult = findShortestPath(
    edges,
    originWaypointId,
    destinationWaypointId
  );

  if (!pathResult.found) {
    return {
      success: false,
      error: {
        code: "NO_ROUTE_FOUND",
        message: `No se encontró ruta entre '${originWaypointId}' y '${destinationWaypointId}'`,
      },
    };
  }

  // Resolve waypoints in path order
  const allWaypoints = await prisma.waypoint.findMany({
    where: { waypointId: { in: pathResult.path } },
  });

  const waypointMap = new Map(allWaypoints.map((w) => [w.waypointId, w]));

  // Build transport data map
  const transportData = new Map<
    string,
    { transportType: string; lines: string[] }
  >();
  for (const wp of allWaypoints) {
    if (wp.transportType) {
      transportData.set(wp.waypointId, {
        transportType: wp.transportType,
        lines: wp.transportLines,
      });
    }
  }

  // Ordered waypoint summaries
  const waypointSummaries: WaypointSummary[] = pathResult.path
    .map((wpId) => {
      const wp = waypointMap.get(wpId);
      if (!wp) return null;
      return {
        waypointId: wp.waypointId,
        name: wp.name,
        waypointType: wp.waypointType,
        coordinates: [wp.longitude, wp.latitude] as [number, number],
        ...(wp.transportType && {
          transportInfo: {
            transportType: wp.transportType,
            lines: wp.transportLines,
          },
        }),
      };
    })
    .filter((w): w is WaypointSummary => w !== null);

  // Filter out co-located bridge waypoints (same coordinates, different IDs)
  // These are artifacts of cross-route graph bridges and should not generate instructions
  const filteredWaypoints = waypointSummaries.filter((wp, idx) => {
    if (idx === 0) return true;
    const prev = waypointSummaries[idx - 1];
    const sameLocation =
      Math.abs(wp.coordinates[0] - prev.coordinates[0]) < 0.0001 &&
      Math.abs(wp.coordinates[1] - prev.coordinates[1]) < 0.0001;
    return !sameLocation;
  });

  // Generate instructions
  const instructions = generateInstructions(filteredWaypoints, transportData);

  // Build GeoJSON
  const segments = await prisma.routeSegment.findMany({
    where: {
      id: {
        in: pathResult.edges
          .map((e) => {
            const graphEdge = graphEdges.find((ge) => ge.id === e.id);
            return graphEdge?.segmentId;
          })
          .filter((id): id is string => id !== null && id !== undefined),
      },
    },
  });

  const geojson = {
    type: "FeatureCollection" as const,
    properties: {
      id: `calc-${originWaypointId}-${destinationWaypointId}`,
      name: `${waypointSummaries[0]?.name} → ${waypointSummaries[waypointSummaries.length - 1]?.name}`,
      description: "Ruta calculada",
    },
    features: [
      ...waypointSummaries.map((wp) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: wp.coordinates,
        },
        properties: {
          featureType: "waypoint" as const,
          waypointId: wp.waypointId,
          name: wp.name,
          description: "",
          waypointType: wp.waypointType,
        },
      })),
      ...segments.map((seg) => ({
        type: "Feature" as const,
        geometry: JSON.parse(seg.geometryGeoJson),
        properties: {
          featureType: "route-segment" as const,
          segmentId: seg.segmentId,
          name: seg.name,
          surfaceType: seg.surfaceType,
          elevationChange: seg.elevationChange,
          riskLevel: seg.riskLevel,
          // FR-304: Detailed risk assessment
          ...(seg.riskDescription && { riskDescription: seg.riskDescription }),
          ...(seg.riskFactors.length > 0 && { riskFactors: seg.riskFactors }),
          ...(seg.audioDescription && { audioDescription: seg.audioDescription }),
        },
      })),
    ],
  };

  const totalDistance = pathResult.totalDistance;
  const estimatedTime = Math.round(totalDistance / WALKING_SPEED_MS);

  return {
    success: true,
    route: {
      origin: filteredWaypoints[0],
      destination: filteredWaypoints[filteredWaypoints.length - 1],
      totalDistance: Math.round(totalDistance),
      estimatedTime,
      waypoints: filteredWaypoints,
      instructions,
      geojson,
    },
  };
}
