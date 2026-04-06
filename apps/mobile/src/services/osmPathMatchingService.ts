// FR-804: Match recorded GPS track segments to OSM footways
import { fetchOsmFootways, mapOsmSurface } from "./osmService";
import type { OsmFootway } from "./osmService";
import { haversineDistance } from "./snapToRouteService";

const MATCH_THRESHOLD_M = 15; // Match if average distance to OSM footway < 15m

export interface PathMatchResult {
  matched: boolean;
  osmFootwayId?: number;
  coordinates: [number, number][];
  surfaceType?: string;
  footwayName?: string;
  averageDistance: number;
}

/**
 * FR-804: Find the closest OSM footway to a segment and return matched coords
 */
export async function matchSegmentToOsmPath(
  segmentCoords: [number, number][]
): Promise<PathMatchResult> {
  if (segmentCoords.length < 2) {
    return { matched: false, coordinates: segmentCoords, averageDistance: Infinity };
  }

  // Use midpoint of segment to fetch nearby footways
  const midIdx = Math.floor(segmentCoords.length / 2);
  const [midLng, midLat] = segmentCoords[midIdx];

  const footways = await fetchOsmFootways(midLat, midLng, 200);

  if (footways.length === 0) {
    return { matched: false, coordinates: segmentCoords, averageDistance: Infinity };
  }

  // Find footway with lowest average distance to our segment
  let bestFootway: OsmFootway | null = null;
  let bestAvgDist = Infinity;

  for (const footway of footways) {
    const avgDist = averageDistanceToFootway(segmentCoords, footway.coordinates);
    if (avgDist < bestAvgDist) {
      bestAvgDist = avgDist;
      bestFootway = footway;
    }
  }

  if (!bestFootway || bestAvgDist > MATCH_THRESHOLD_M) {
    return { matched: false, coordinates: segmentCoords, averageDistance: bestAvgDist };
  }

  // Extract the portion of the footway that covers our segment
  const matchedCoords = extractRelevantPortion(
    bestFootway.coordinates,
    segmentCoords[0],
    segmentCoords[segmentCoords.length - 1]
  );

  return {
    matched: true,
    osmFootwayId: bestFootway.id,
    coordinates: matchedCoords,
    surfaceType: bestFootway.surface ? mapOsmSurface(bestFootway.surface) : undefined,
    footwayName: bestFootway.name,
    averageDistance: Math.round(bestAvgDist),
  };
}

/**
 * Calculate average distance from segment points to nearest footway point
 */
function averageDistanceToFootway(
  segmentCoords: [number, number][],
  footwayCoords: [number, number][]
): number {
  if (segmentCoords.length === 0 || footwayCoords.length === 0) return Infinity;

  let totalDist = 0;
  // Sample every 3rd point for performance
  const step = Math.max(1, Math.floor(segmentCoords.length / 10));

  let sampled = 0;
  for (let i = 0; i < segmentCoords.length; i += step) {
    let minDist = Infinity;
    for (const fwCoord of footwayCoords) {
      const d = haversineDistance(segmentCoords[i], fwCoord);
      if (d < minDist) minDist = d;
    }
    totalDist += minDist;
    sampled++;
  }

  return sampled > 0 ? totalDist / sampled : Infinity;
}

/**
 * Extract portion of footway between start and end of our segment
 */
function extractRelevantPortion(
  footwayCoords: [number, number][],
  segStart: [number, number],
  segEnd: [number, number]
): [number, number][] {
  // Find closest footway points to segment start and end
  let startIdx = 0;
  let endIdx = footwayCoords.length - 1;
  let minStartDist = Infinity;
  let minEndDist = Infinity;

  for (let i = 0; i < footwayCoords.length; i++) {
    const dStart = haversineDistance(footwayCoords[i], segStart);
    const dEnd = haversineDistance(footwayCoords[i], segEnd);

    if (dStart < minStartDist) {
      minStartDist = dStart;
      startIdx = i;
    }
    if (dEnd < minEndDist) {
      minEndDist = dEnd;
      endIdx = i;
    }
  }

  // Ensure correct order
  if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];

  // Include start/end of our segment for continuity
  return [
    segStart,
    ...footwayCoords.slice(startIdx, endIdx + 1),
    segEnd,
  ];
}
