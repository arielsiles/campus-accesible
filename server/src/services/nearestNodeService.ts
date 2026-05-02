// FR-1403: Find the nearest registered waypoint to arbitrary GPS coordinates
import type { PrismaClient } from "@prisma/client";

export interface NearestNodeResult {
  waypointId: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  bearingDeg: number;
}

const EARTH_RADIUS_M = 6_371_000;

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

export function bearingDeg(
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
 * FR-1403: Find the registered waypoint closest to (lat, lng).
 * Uses linear scan on Postgres — fine up to ~5000 waypoints. For larger
 * graphs, consider a k-d tree or PostGIS.
 *
 * @param maxDistanceM if provided, returns null when no waypoint is within
 *                     this distance.
 */
export async function findNearestNode(
  prisma: PrismaClient,
  lat: number,
  lng: number,
  maxDistanceM?: number
): Promise<NearestNodeResult | null> {
  const rows = await prisma.$queryRaw<
    Array<{
      waypointId: string;
      name: string;
      latitude: number;
      longitude: number;
      distance: number;
    }>
  >`
    SELECT waypoint_id AS "waypointId", name, latitude, longitude,
      (6371000 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        ))
      )) AS distance
    FROM waypoints
    ORDER BY distance ASC
    LIMIT 1
  `;

  const top = rows[0];
  if (!top) return null;
  if (maxDistanceM != null && top.distance > maxDistanceM) return null;

  return {
    waypointId: top.waypointId,
    name: top.name,
    latitude: top.latitude,
    longitude: top.longitude,
    distanceM: Number(top.distance),
    bearingDeg: bearingDeg(lat, lng, top.latitude, top.longitude),
  };
}
