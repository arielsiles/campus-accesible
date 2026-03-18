// FR-203: Snap-to-route service
// Projects GPS position to the nearest point on the active route

const EARTH_RADIUS_M = 6_371_000;
const OFF_ROUTE_THRESHOLD_M = 30; // NFR-203: configurable threshold

/**
 * Convert degrees to radians
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Haversine distance in meters between two [lng, lat] coordinates
 */
export function haversineDistance(
  a: [number, number],
  b: [number, number]
): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLng * sinDLng;

  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Project a point onto a line segment, returning the closest point on the segment.
 * All coordinates are [lng, lat].
 */
export function projectPointToSegment(
  point: [number, number],
  segStart: [number, number],
  segEnd: [number, number]
): [number, number] {
  const [px, py] = point;
  const [ax, ay] = segStart;
  const [bx, by] = segEnd;

  const dx = bx - ax;
  const dy = by - ay;

  // Degenerate segment (single point)
  if (dx === 0 && dy === 0) return segStart;

  // Parameterized position on the segment (0..1)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));

  return [ax + t * dx, ay + t * dy];
}

export interface SnapResult {
  snappedPosition: [number, number]; // [lng, lat] on the route
  isOnRoute: boolean; // within threshold
  distanceToRoute: number; // meters from GPS to snapped point
  segmentIndex: number; // which segment the user is on
  progressAlongSegment: number; // 0..1 within the segment
}

/**
 * Snap a GPS position to the nearest point on a route defined by segment coordinates.
 *
 * @param gpsPosition - Current [lng, lat] from GPS
 * @param segments - Array of LineString coordinate arrays (each segment is [lng, lat][])
 * @param threshold - Off-route distance threshold in meters (default 30)
 */
export function snapToRoute(
  gpsPosition: [number, number],
  segments: [number, number][][],
  threshold: number = OFF_ROUTE_THRESHOLD_M
): SnapResult {
  let bestDistance = Infinity;
  let bestPoint: [number, number] = gpsPosition;
  let bestSegmentIndex = 0;
  let bestProgress = 0;

  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const coords = segments[segIdx];
    for (let i = 0; i < coords.length - 1; i++) {
      const projected = projectPointToSegment(
        gpsPosition,
        coords[i],
        coords[i + 1]
      );
      const distance = haversineDistance(gpsPosition, projected);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestPoint = projected;
        bestSegmentIndex = segIdx;

        // Calculate progress within this sub-segment
        const segLength = haversineDistance(coords[i], coords[i + 1]);
        const progressDist = haversineDistance(coords[i], projected);
        bestProgress = segLength > 0 ? progressDist / segLength : 0;
      }
    }
  }

  return {
    snappedPosition: bestPoint,
    isOnRoute: bestDistance <= threshold,
    distanceToRoute: bestDistance,
    segmentIndex: bestSegmentIndex,
    progressAlongSegment: bestProgress,
  };
}
