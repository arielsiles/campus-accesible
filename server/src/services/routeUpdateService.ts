// FR-506: Route update service — block/unblock segments based on incidents
import { PrismaClient } from "@prisma/client";

// Incident types that should trigger automatic segment blocking
const BLOCKING_INCIDENT_TYPES = ["obras", "rampa_bloqueada", "ascensor_averiado"];

/**
 * FR-506: Check if an incident type should block its segment
 */
export function isBlockingType(type: string): boolean {
  return BLOCKING_INCIDENT_TYPES.includes(type);
}

/**
 * FR-506: Block a segment linked to a validated blocking incident
 */
export async function blockSegmentForIncident(
  prisma: PrismaClient,
  incidentId: string
): Promise<boolean> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
  });

  if (!incident || !incident.segmentId) return false;
  if (!isBlockingType(incident.type)) return false;

  await prisma.routeSegment.update({
    where: { id: incident.segmentId },
    data: {
      temporarilyBlocked: true,
      blockReason: `Incidencia: ${incident.title}`,
    },
  });

  return true;
}

/**
 * FR-506: Unblock a segment when its incident is resolved
 * Only unblocks if no other active blocking incidents remain on the segment
 */
export async function unblockSegmentForIncident(
  prisma: PrismaClient,
  incidentId: string
): Promise<boolean> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
  });

  if (!incident || !incident.segmentId) return false;

  // Check if there are other active blocking incidents on this segment
  const otherBlockingIncidents = await prisma.incident.count({
    where: {
      segmentId: incident.segmentId,
      id: { not: incidentId },
      status: "validated",
      type: { in: ["obras", "rampa_bloqueada", "ascensor_averiado"] },
    },
  });

  if (otherBlockingIncidents > 0) return false;

  await prisma.routeSegment.update({
    where: { id: incident.segmentId },
    data: {
      temporarilyBlocked: false,
      blockReason: null,
    },
  });

  return true;
}

export const routeUpdateService = {
  isBlockingType,
  blockSegmentForIncident,
  unblockSegmentForIncident,
};
