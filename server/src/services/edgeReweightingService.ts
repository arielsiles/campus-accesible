// FR-1502: Re-weight graph edges based on accumulated SegmentMetrics
import type { PrismaClient } from "@prisma/client";

/** Bound the weight adjustment to ±30% so a few users can't break routing */
const MAX_ADJUSTMENT = 0.3;
const MIN_USAGE_FOR_ADJUSTMENT = 5;

export interface ReweightResult {
  segmentsAdjusted: number;
  edgesUpdated: number;
}

/**
 * FR-1502: Apply re-weighting to graph edges.
 * - Popularity (high usage) → slightly lower weight (preferred)
 * - High off-route rate → higher weight (problematic)
 * - Negative feedback → higher weight
 * - Adjustments are bounded to ±30%
 */
export async function recomputeEdgeWeights(
  prisma: PrismaClient
): Promise<ReweightResult> {
  const allMetrics = await prisma.segmentMetrics.findMany({
    where: { usageCount: { gte: MIN_USAGE_FOR_ADJUSTMENT } },
  });

  let segmentsAdjusted = 0;
  let edgesUpdated = 0;

  // Compute global usage stats for normalization
  const usageCounts = allMetrics.map((m) => m.usageCount).sort((a, b) => a - b);
  const medianUsage =
    usageCounts.length > 0
      ? usageCounts[Math.floor(usageCounts.length / 2)]
      : 1;

  for (const metric of allMetrics) {
    const adjustment = computeAdjustment(metric, medianUsage);
    if (adjustment === 0) continue;

    // Multiplier: 1 - adjustment means lower weight, 1 + adjustment means higher
    const multiplier = 1 + adjustment;

    // Update all GraphEdges that use this segment
    const edges = await prisma.graphEdge.findMany({
      where: { segmentId: metric.segmentId },
    });

    for (const edge of edges) {
      // Compute base weight from distance only as fallback baseline
      const baseWeight = edge.distance;
      const newWeight = Math.max(1, baseWeight * multiplier);
      await prisma.graphEdge.update({
        where: { id: edge.id },
        data: { weight: newWeight },
      });
      edgesUpdated++;
    }

    if (edges.length > 0) segmentsAdjusted++;
  }

  return { segmentsAdjusted, edgesUpdated };
}

function computeAdjustment(
  metric: {
    usageCount: number;
    offRouteRate: number;
    feedbackScoreAvg: number;
    feedbackCount: number;
  },
  medianUsage: number
): number {
  let adjustment = 0;

  // Popularity boost: log-scaled, max -0.10
  if (metric.usageCount > medianUsage) {
    adjustment -= Math.min(
      0.1,
      Math.log(metric.usageCount / medianUsage) * 0.05
    );
  }

  // Off-route penalty: max +0.20
  if (metric.offRouteRate > 0.3) {
    adjustment += Math.min(0.2, metric.offRouteRate * 0.5);
  }

  // Feedback influence (only if we have signal)
  if (metric.feedbackCount >= 3) {
    if (metric.feedbackScoreAvg < 1.8) {
      adjustment += 0.15; // bad feedback, prefer alternatives
    } else if (metric.feedbackScoreAvg > 2.5) {
      adjustment -= 0.05; // good feedback
    }
  }

  // Bound to ±MAX_ADJUSTMENT
  return Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, adjustment));
}
