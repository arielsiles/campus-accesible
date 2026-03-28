// FR-506: Segment management endpoints (block/unblock)
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export const segmentRoutes = new Hono();

const blockSegmentSchema = z.object({
  blocked: z.boolean(),
  reason: z.string().optional(),
});

// PATCH /api/segments/:id/block — Block or unblock a segment [FR-506]
segmentRoutes.patch("/segments/:id/block", async (c) => {
  const id = c.req.param("id");

  const rawBody = await c.req.json().catch(() => null);
  if (!rawBody) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      400
    );
  }

  const parsed = blockSegmentSchema.safeParse(rawBody);
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

  const existing = await prisma.routeSegment.findUnique({ where: { id } });
  if (!existing) {
    return c.json(
      { error: { code: "NOT_FOUND", message: `Segment '${id}' not found` } },
      404
    );
  }

  const segment = await prisma.routeSegment.update({
    where: { id },
    data: {
      temporarilyBlocked: parsed.data.blocked,
      blockReason: parsed.data.blocked ? (parsed.data.reason ?? null) : null,
    },
    select: {
      id: true,
      segmentId: true,
      name: true,
      temporarilyBlocked: true,
      blockReason: true,
    },
  });

  return c.json({ segment });
});
