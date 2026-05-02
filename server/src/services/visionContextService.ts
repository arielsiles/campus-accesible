// FR-1103: Build navigation context for vision API prompts
import type { PrismaClient } from "@prisma/client";

const NEARBY_WAYPOINT_RADIUS_M = 100;
const NEARBY_INCIDENT_RADIUS_M = 200;
const MAX_NEARBY_WAYPOINTS = 5;
const MAX_NEARBY_INCIDENTS = 3;

interface NearbyWaypoint {
  name: string;
  type: string;
  distanceM: number;
  bearing: string;
}

interface NearbyIncident {
  type: string;
  title: string;
  distanceM: number;
  status: string;
}

export interface VisionContext {
  /** Human-readable text appended to the system prompt */
  contextText: string;
  /** Raw context data (for logging/telemetry) */
  data: {
    nearbyWaypoints: NearbyWaypoint[];
    nearbyIncidents: NearbyIncident[];
    currentSegment?: {
      name: string;
      surface: string;
      riskLevel: string;
    };
  };
}

const EMPTY_CONTEXT: VisionContext = {
  contextText: "",
  data: { nearbyWaypoints: [], nearbyIncidents: [] },
};

/**
 * FR-1103: Build a contextual text describing the user's surroundings
 * to help the vision AI give navigation-relevant descriptions.
 */
export async function buildVisionContext(
  prisma: PrismaClient,
  latitude?: number,
  longitude?: number
): Promise<VisionContext> {
  if (latitude == null || longitude == null) {
    return EMPTY_CONTEXT;
  }

  // Find nearby waypoints (Haversine via raw SQL)
  const nearbyWaypoints = await findNearbyWaypoints(
    prisma,
    latitude,
    longitude,
    NEARBY_WAYPOINT_RADIUS_M
  );

  const nearbyIncidents = await findNearbyIncidents(
    prisma,
    latitude,
    longitude,
    NEARBY_INCIDENT_RADIUS_M
  );

  const currentSegment = await findCurrentSegment(
    prisma,
    latitude,
    longitude
  );

  const lines: string[] = [];
  if (nearbyWaypoints.length > 0) {
    lines.push("Puntos cercanos registrados:");
    for (const wp of nearbyWaypoints) {
      lines.push(
        `  - ${wp.name} (${wp.type}) a ${Math.round(wp.distanceM)}m al ${wp.bearing}`
      );
    }
  }

  if (nearbyIncidents.length > 0) {
    lines.push("\nIncidencias activas en la zona:");
    for (const inc of nearbyIncidents) {
      lines.push(
        `  - ${inc.title} [${inc.type}] a ${Math.round(inc.distanceM)}m`
      );
    }
  }

  if (currentSegment) {
    lines.push(
      `\nSegmento actual: "${currentSegment.name}", superficie: ${currentSegment.surface}, riesgo: ${currentSegment.riskLevel}`
    );
  }

  return {
    contextText: lines.join("\n"),
    data: { nearbyWaypoints, nearbyIncidents, currentSegment },
  };
}

/**
 * Compute compass bearing from origin to target as cardinal direction.
 */
function bearingCardinal(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const angleDeg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  if (angleDeg < 22.5) return "norte";
  if (angleDeg < 67.5) return "noreste";
  if (angleDeg < 112.5) return "este";
  if (angleDeg < 157.5) return "sureste";
  if (angleDeg < 202.5) return "sur";
  if (angleDeg < 247.5) return "suroeste";
  if (angleDeg < 292.5) return "oeste";
  if (angleDeg < 337.5) return "noroeste";
  return "norte";
}

async function findNearbyWaypoints(
  prisma: PrismaClient,
  lat: number,
  lng: number,
  radiusM: number
): Promise<NearbyWaypoint[]> {
  // Use Haversine formula in raw SQL for performance
  const rows = await prisma.$queryRaw<
    Array<{
      name: string;
      waypointType: string;
      latitude: number;
      longitude: number;
      distance: number;
    }>
  >`
    SELECT name, waypoint_type AS "waypointType", latitude, longitude,
      (6371000 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        ))
      )) AS distance
    FROM waypoints
    WHERE (6371000 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        ))
      )) <= ${radiusM}
    ORDER BY distance ASC
    LIMIT ${MAX_NEARBY_WAYPOINTS}
  `;

  return rows.map((r) => ({
    name: r.name,
    type: r.waypointType,
    distanceM: Number(r.distance),
    bearing: bearingCardinal(lat, lng, r.latitude, r.longitude),
  }));
}

async function findNearbyIncidents(
  prisma: PrismaClient,
  lat: number,
  lng: number,
  radiusM: number
): Promise<NearbyIncident[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      title: string;
      type: string;
      status: string;
      distance: number;
    }>
  >`
    SELECT title, type::text AS type, status::text AS status,
      (6371000 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        ))
      )) AS distance
    FROM incidents
    WHERE status IN ('pending', 'validated')
      AND (6371000 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${lat})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(latitude))
        ))
      )) <= ${radiusM}
    ORDER BY distance ASC
    LIMIT ${MAX_NEARBY_INCIDENTS}
  `;

  return rows.map((r) => ({
    title: r.title,
    type: r.type,
    status: r.status,
    distanceM: Number(r.distance),
  }));
}

/**
 * Find the route segment whose midpoint is closest to the user (within 50m).
 * Returns null if user is not on any known segment.
 */
async function findCurrentSegment(
  prisma: PrismaClient,
  lat: number,
  lng: number
): Promise<{ name: string; surface: string; riskLevel: string } | null> {
  // Heuristic: look for segments whose endpoints (waypoints) are nearby.
  // A more accurate solution would use PostGIS line distance, but Haversine is enough.
  const rows = await prisma.$queryRaw<
    Array<{
      name: string;
      surface: string;
      riskLevel: string;
    }>
  >`
    SELECT s.name, s.surface_type::text AS surface, s.risk_level::text AS "riskLevel"
    FROM route_segments s
    JOIN graph_edges e ON e.segment_id = s.id
    JOIN waypoints w ON w.id IN (e.from_waypoint_id, e.to_waypoint_id)
    WHERE (6371000 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${lat})) * cos(radians(w.latitude)) *
          cos(radians(w.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(w.latitude))
        ))
      )) <= 50
    LIMIT 1
  `;

  return rows[0] ?? null;
}
