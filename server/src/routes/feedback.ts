// FR-1505: Post-navigation feedback endpoint
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const feedbackSchema = z.object({
  rating: z.enum(["good", "ok", "bad"]),
  comment: z.string().max(500).optional(),
  segmentIds: z.array(z.string()).max(50),
  profile: z
    .enum(["standard", "visual_disability", "reduced_mobility", "deaf", "easy_read"])
    .default("standard"),
});

export const feedbackRoutes = new Hono();

const RATING_TO_SCORE: Record<string, number> = {
  bad: 1,
  ok: 2,
  good: 3,
};

// FR-1505, FR-1506: POST /api/feedback/route — submit route feedback
feedbackRoutes.post("/feedback/route", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
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

  await prisma.routeFeedback.create({
    data: {
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      segmentIds: parsed.data.segmentIds,
      profile: parsed.data.profile,
    },
  });

  // FR-1506: Update segment metrics' feedback aggregate
  const score = RATING_TO_SCORE[parsed.data.rating];
  for (const segmentId of parsed.data.segmentIds) {
    const existing = await prisma.segmentMetrics.findUnique({
      where: { segmentId },
    });
    const oldCount = existing?.feedbackCount ?? 0;
    const oldAvg = existing?.feedbackScoreAvg ?? 0;
    const newCount = oldCount + 1;
    const newAvg = (oldAvg * oldCount + score) / newCount;

    await prisma.segmentMetrics.upsert({
      where: { segmentId },
      create: {
        segmentId,
        feedbackCount: 1,
        feedbackScoreAvg: score,
      },
      update: {
        feedbackCount: newCount,
        feedbackScoreAvg: newAvg,
      },
    });
  }

  return c.json({ accepted: true });
});
