// FR-1501, FR-1506: GPS telemetry — anonymous traces + incremental metrics
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TRACE_TTL_HOURS = 24;

const tracePointSchema = z.object({
  segmentId: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timestamp: z.number(), // epoch ms
});

const batchSchema = z.object({
  profile: z
    .enum(["standard", "visual_disability", "reduced_mobility", "deaf", "easy_read"])
    .default("standard"),
  points: z.array(tracePointSchema).min(1).max(200),
  /** Aggregate stats from this navigation segment (optional) */
  segmentSummary: z
    .object({
      segmentId: z.string(),
      traversalTimeS: z.number().min(0),
      offRouteSeconds: z.number().min(0).optional().default(0),
    })
    .array()
    .optional(),
});

export const telemetryRoutes = new Hono();

// FR-1501: POST /api/telemetry/traces — submit a batch of anonymized GPS traces
telemetryRoutes.post("/telemetry/traces", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
        },
      },
      400
    );
  }

  const { profile, points, segmentSummary } = parsed.data;
  const expiresAt = new Date(Date.now() + TRACE_TTL_HOURS * 60 * 60 * 1000);

  // Insert anonymized trace points (no userId / deviceId stored)
  await prisma.gpsTrace.createMany({
    data: points.map((p) => ({
      segmentId: p.segmentId ?? null,
      latitude: p.latitude,
      longitude: p.longitude,
      timestamp: new Date(p.timestamp),
      profile,
      expiresAt,
    })),
    skipDuplicates: true,
  });

  // FR-1506: Incremental metric aggregation per segment
  if (segmentSummary && segmentSummary.length > 0) {
    for (const s of segmentSummary) {
      const existing = await prisma.segmentMetrics.findUnique({
        where: { segmentId: s.segmentId },
      });
      const newCount = (existing?.usageCount ?? 0) + 1;
      const oldAvg = existing?.avgTraversalTimeS ?? 0;
      const newAvg =
        ((oldAvg * (newCount - 1)) + s.traversalTimeS) / newCount;
      const offRouteIncrement = s.offRouteSeconds > 0 ? 1 : 0;
      const newOffRouteRate =
        ((existing?.offRouteRate ?? 0) * (newCount - 1) + offRouteIncrement) /
        newCount;

      await prisma.segmentMetrics.upsert({
        where: { segmentId: s.segmentId },
        create: {
          segmentId: s.segmentId,
          usageCount: 1,
          avgTraversalTimeS: s.traversalTimeS,
          offRouteRate: offRouteIncrement,
          lastUsedAt: new Date(),
        },
        update: {
          usageCount: newCount,
          avgTraversalTimeS: newAvg,
          offRouteRate: newOffRouteRate,
          lastUsedAt: new Date(),
        },
      });
    }
  }

  return c.json({ accepted: points.length, expiresAt: expiresAt.toISOString() });
});

// Internal cleanup endpoint — could be called by cron later
telemetryRoutes.delete("/telemetry/expired", async (c) => {
  const result = await prisma.gpsTrace.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return c.json({ deleted: result.count });
});
