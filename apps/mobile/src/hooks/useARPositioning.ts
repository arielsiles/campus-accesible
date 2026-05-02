// FR-1302: AR positioning calculations — bearing → screen position
import { useMemo } from "react";

/** Approximate horizontal field of view of a typical phone camera (degrees) */
const FOV_DEGREES = 60;
const HALF_FOV = FOV_DEGREES / 2;

export interface ARMarker {
  id: string;
  /** GPS coordinates of the POI */
  latitude: number;
  longitude: number;
  /** Free-form data for the marker (passed through) */
  data?: unknown;
}

export interface PositionedMarker<T = unknown> {
  id: string;
  data: T;
  /** Distance to the marker in meters */
  distanceM: number;
  /** Bearing from user to marker (0-360, 0 = North) */
  bearing: number;
  /**
   * Relative angle vs current device heading, in degrees.
   * 0 means dead center, negative = left, positive = right.
   */
  relativeAngle: number;
  /** Whether the marker is within the camera field of view */
  inFov: boolean;
  /** Horizontal screen position 0..1 (when inFov=true) */
  screenX: number;
  /** Suggested marker size in dp (closer = bigger) */
  size: number;
  /** Suggested opacity 0.3..1 (closer = more opaque) */
  opacity: number;
}

const EARTH_RADIUS_M = 6_371_000;

/**
 * FR-1302: Compute bearing in degrees from one coordinate to another.
 * Result: 0 = North, 90 = East, 180 = South, 270 = West.
 */
export function bearingBetween(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Haversine distance in meters between two GPS points.
 */
export function haversineMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Normalize an angle delta to the (-180, 180] range.
 */
export function normalizeAngleDiff(diffDeg: number): number {
  let d = diffDeg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * FR-1302: Compute a marker's screen position given user position, heading
 * and the marker GPS coordinates.
 *
 * - relativeAngle in [-180, 180] (negative = left, positive = right)
 * - inFov is true when |relativeAngle| <= 30
 * - screenX maps -30 to 0, +30 to 1, otherwise clamped
 * - size: 60dp at 0m, 20dp at 800m+
 * - opacity: 1 at 0m, 0.3 at 500m+
 */
export function positionMarker<T = unknown>(
  marker: ARMarker & { data: T },
  userLat: number,
  userLng: number,
  deviceHeading: number
): PositionedMarker<T> {
  const distanceM = haversineMeters(
    userLat,
    userLng,
    marker.latitude,
    marker.longitude
  );
  const bearing = bearingBetween(
    userLat,
    userLng,
    marker.latitude,
    marker.longitude
  );
  const relativeAngle = normalizeAngleDiff(bearing - deviceHeading);
  const inFov = Math.abs(relativeAngle) <= HALF_FOV;
  const screenX = inFov
    ? (relativeAngle + HALF_FOV) / FOV_DEGREES
    : relativeAngle < 0
      ? 0
      : 1;
  const size = Math.max(20, 60 - distanceM / 20);
  const opacity = Math.max(0.3, 1 - distanceM / 500);

  return {
    id: marker.id,
    data: marker.data,
    distanceM,
    bearing,
    relativeAngle,
    inFov,
    screenX,
    size,
    opacity,
  };
}

/**
 * FR-1302: Hook that computes screen positions for a list of markers.
 * Returns memoized results that update when user position or heading changes.
 */
export function useARPositioning<T = unknown>(
  markers: Array<ARMarker & { data: T }>,
  userLat: number | null,
  userLng: number | null,
  deviceHeading: number
): PositionedMarker<T>[] {
  return useMemo(() => {
    if (userLat == null || userLng == null) return [];
    return markers
      .map((m) => positionMarker(m, userLat, userLng, deviceHeading))
      .sort((a, b) => a.distanceM - b.distanceM);
  }, [markers, userLat, userLng, deviceHeading]);
}
