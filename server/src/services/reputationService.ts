// FR-1508: Contributor reputation system
import type { PrismaClient } from "@prisma/client";

export type ReputationEvent =
  | "route_approved"
  | "route_rejected"
  | "incident_validated"
  | "incident_confirmed";

const POINTS: Record<ReputationEvent, number> = {
  route_approved: 10,
  route_rejected: -5,
  incident_validated: 5,
  incident_confirmed: 1,
};

/**
 * FR-1508: Add reputation points to a user and update level if threshold crossed.
 */
export async function addReputation(
  prisma: PrismaClient,
  userId: string,
  event: ReputationEvent
): Promise<{ reputation: number; level: "bronze" | "silver" | "gold" }> {
  const points = POINTS[event];
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { reputation: { increment: points } },
    select: { reputation: true },
  });

  const newLevel = computeLevel(updated.reputation);

  await prisma.user.update({
    where: { id: userId },
    data: { level: newLevel },
  });

  return { reputation: updated.reputation, level: newLevel };
}

export function computeLevel(reputation: number): "bronze" | "silver" | "gold" {
  if (reputation >= 500) return "gold";
  if (reputation >= 100) return "silver";
  return "bronze";
}
