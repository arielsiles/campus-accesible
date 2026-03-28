// FR-505: Push notification subscription endpoints
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { isValidExpoPushToken } from "../services/notificationService";

const prisma = new PrismaClient();

export const notificationRoutes = new Hono();

const subscribeSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
  pushToken: z.string().min(1, "pushToken is required"),
  segmentIds: z.array(z.string()).min(1, "At least one segmentId required").max(50),
});

const unsubscribeSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
  segmentIds: z.array(z.string()).optional(),
});

// POST /api/notifications/subscribe — Subscribe to segment notifications [FR-505]
notificationRoutes.post("/notifications/subscribe", async (c) => {
  const rawBody = await c.req.json().catch(() => null);
  if (!rawBody) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      400
    );
  }

  const parsed = subscribeSchema.safeParse(rawBody);
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

  if (!isValidExpoPushToken(parsed.data.pushToken)) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid Expo push token format" } },
      400
    );
  }

  // Upsert subscriptions (no duplicates)
  let created = 0;
  for (const segmentId of parsed.data.segmentIds) {
    try {
      await prisma.pushSubscription.upsert({
        where: {
          deviceId_segmentId: {
            deviceId: parsed.data.deviceId,
            segmentId,
          },
        },
        update: { pushToken: parsed.data.pushToken },
        create: {
          deviceId: parsed.data.deviceId,
          pushToken: parsed.data.pushToken,
          segmentId,
        },
      });
      created++;
    } catch {
      // Segment may not exist — skip
    }
  }

  return c.json({ subscriptions: created });
});

// DELETE /api/notifications/unsubscribe — Remove subscriptions [FR-505]
notificationRoutes.delete("/notifications/unsubscribe", async (c) => {
  const rawBody = await c.req.json().catch(() => null);
  if (!rawBody) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      400
    );
  }

  const parsed = unsubscribeSchema.safeParse(rawBody);
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

  const where: Record<string, unknown> = {
    deviceId: parsed.data.deviceId,
  };

  if (parsed.data.segmentIds) {
    where.segmentId = { in: parsed.data.segmentIds };
  }

  const result = await prisma.pushSubscription.deleteMany({ where });

  return c.json({ removed: result.count });
});
