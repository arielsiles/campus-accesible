// FR-201: Build route graph from existing waypoints and segments
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_WEIGHT_FACTORS,
  type WeightFactors,
} from "@campus-gps/shared-types";

const EARTH_RADIUS_M = 6_371_000;

/**
 * Calculate distance in meters between two [lng, lat] coordinates using Haversine formula
 */
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate edge weight from distance, elevation change, and risk level.
 * Higher weight = harder to traverse (accessibility-aware).
 */
export function calculateWeight(
  distance: number,
  elevationChange: number,
  riskLevel: string,
  factors: WeightFactors = DEFAULT_WEIGHT_FACTORS
): number {
  const elevationPenalty =
    Math.abs(elevationChange) * factors.elevationPenalty;
  const riskMultiplier = factors.riskPenalty[riskLevel] ?? 1.0;

  return (distance + elevationPenalty) * riskMultiplier;
}

/**
 * Build the route graph from all routes, waypoints, and segments in the database.
 * Creates GraphEdge records connecting consecutive waypoints in each route.
 */
export async function buildGraph(
  prisma: PrismaClient,
  factors: WeightFactors = DEFAULT_WEIGHT_FACTORS
): Promise<{ nodesCount: number; edgesCount: number }> {
  // Clear existing graph edges
  await prisma.graphEdge.deleteMany();

  // Load all routes with waypoints and segments ordered
  const routes = await prisma.route.findMany({
    include: {
      waypoints: { orderBy: { orderIndex: "asc" } },
      segments: { orderBy: { orderIndex: "asc" } },
    },
  });

  let edgesCreated = 0;
  const seenNodes = new Set<string>();

  for (const route of routes) {
    const { waypoints, segments } = route;

    // Each segment at index i connects waypoint[i] to waypoint[i+1]
    for (let i = 0; i < segments.length; i++) {
      const fromWp = waypoints[i];
      const toWp = waypoints[i + 1];
      const segment = segments[i];

      if (!fromWp || !toWp) continue;

      seenNodes.add(fromWp.id);
      seenNodes.add(toWp.id);

      const distance = haversineDistance(
        [fromWp.longitude, fromWp.latitude],
        [toWp.longitude, toWp.latitude]
      );

      const weight = calculateWeight(
        distance,
        segment.elevationChange,
        segment.riskLevel,
        factors
      );

      // Create forward edge (skip if duplicate pair exists)
      try {
        await prisma.graphEdge.create({
          data: {
            fromWaypointId: fromWp.id,
            toWaypointId: toWp.id,
            segmentId: segment.id,
            distance,
            weight,
            bidirectional: true,
          },
        });
        edgesCreated++;
      } catch {
        // Unique constraint violation — edge already exists (shared waypoints across routes)
      }

      // Create reverse edge for bidirectional traversal
      try {
        await prisma.graphEdge.create({
          data: {
            fromWaypointId: toWp.id,
            toWaypointId: fromWp.id,
            segmentId: segment.id,
            distance,
            weight,
            bidirectional: true,
          },
        });
        edgesCreated++;
      } catch {
        // Unique constraint violation — reverse edge already exists
      }
    }
  }

  return { nodesCount: seenNodes.size, edgesCount: edgesCreated };
}
