// FR-501, FR-502: Incident CRUD endpoints
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { validateIncident } from "../services/incidentValidator";
import {
  blockSegmentForIncident,
  unblockSegmentForIncident,
} from "../services/routeUpdateService";
import { notifySegmentSubscribers } from "../services/notificationService";

const prisma = new PrismaClient();

export const incidentRoutes = new Hono();

// --- Zod Schemas ---

const incidentTypes = [
  "obras",
  "obstaculo_temporal",
  "superficie_danada",
  "ascensor_averiado",
  "rampa_bloqueada",
  "otro",
] as const;

const incidentStatuses = ["pending", "validated", "rejected", "resolved"] as const;

const createIncidentSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
  type: z.enum(incidentTypes, { message: "Invalid incident type" }),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  segmentId: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

const incidentFilterSchema = z.object({
  status: z.enum(incidentStatuses).optional(),
  type: z.enum(incidentTypes).optional(),
  segmentId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(10).max(5000).default(500),
});

const updateStatusSchema = z.object({
  status: z.enum(incidentStatuses, { message: "Invalid status" }),
  reason: z.string().optional(),
});

// --- Rate Limiting ---

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(deviceId: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await prisma.incident.count({
    where: { deviceId, createdAt: { gte: since } },
  });
  return count < RATE_LIMIT_MAX;
}

// --- Helpers ---

function parseBody(body: unknown) {
  if (!body) {
    return {
      ok: false as const,
      error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
    };
  }
  return { ok: true as const, body };
}

// --- Endpoints ---

// POST /api/incidents — Create a new incident [FR-501]
incidentRoutes.post("/incidents", async (c) => {
  const rawBody = await c.req.json().catch(() => null);
  const bodyResult = parseBody(rawBody);
  if (!bodyResult.ok) {
    return c.json({ error: bodyResult.error }, 400);
  }

  const parsed = createIncidentSchema.safeParse(bodyResult.body);
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

  // NFR-503: Rate limiting
  const allowed = await checkRateLimit(parsed.data.deviceId);
  if (!allowed) {
    return c.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Maximum 5 incidents per hour per device",
        },
      },
      429
    );
  }

  // FR-503: Validate incident with AI (or template fallback)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const validation = await validateIncident(
    {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    },
    apiKey
  );

  // Auto-reject high-confidence spam
  const autoStatus =
    !validation.plausible && validation.confidence > 0.8
      ? "rejected"
      : "pending";

  // FR-1504: Community validation — check for nearby existing incident of same type
  const NEARBY_RADIUS_M = 20;
  const nearbyExisting = await prisma.$queryRaw<
    Array<{ id: string; confirmCount: number; status: string }>
  >`
    SELECT id, confirm_count AS "confirmCount", status::text AS status
    FROM incidents
    WHERE type::text = ${parsed.data.type}
      AND status IN ('pending', 'validated')
      AND (6371000 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(${parsed.data.latitude})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${parsed.data.longitude})) +
          sin(radians(${parsed.data.latitude})) * sin(radians(latitude))
        ))
      )) <= ${NEARBY_RADIUS_M}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (nearbyExisting.length > 0) {
    const existing = nearbyExisting[0];
    // Same device cannot inflate the count
    const alreadyConfirmed = await prisma.incidentConfirm.findUnique({
      where: {
        incidentId_deviceId: {
          incidentId: existing.id,
          deviceId: parsed.data.deviceId,
        },
      },
    });

    if (!alreadyConfirmed) {
      const newConfirmCount = existing.confirmCount + 1;
      const shouldAutoValidate =
        existing.status === "pending" && newConfirmCount >= 3;

      await prisma.$transaction([
        prisma.incidentConfirm.create({
          data: {
            incidentId: existing.id,
            deviceId: parsed.data.deviceId,
          },
        }),
        prisma.incident.update({
          where: { id: existing.id },
          data: {
            confirmCount: newConfirmCount,
            lastConfirmedAt: new Date(),
            ...(shouldAutoValidate && { status: "validated" as const }),
          },
        }),
      ]);
    }

    const updated = await prisma.incident.findUnique({
      where: { id: existing.id },
    });
    return c.json(
      {
        incident: updated,
        deduplicated: true,
        message: alreadyConfirmed
          ? "Ya habias reportado esta incidencia."
          : "Esta incidencia ya estaba reportada. Hemos sumado tu confirmacion.",
      },
      200
    );
  }

  const incident = await prisma.incident.create({
    data: {
      deviceId: parsed.data.deviceId,
      type: parsed.data.type,
      status: autoStatus as "pending" | "rejected",
      title: parsed.data.title,
      description: parsed.data.description,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      segmentId: parsed.data.segmentId ?? null,
      photoUrl: parsed.data.photoUrl ?? null,
      aiValidation: validation.plausible,
      aiConfidence: validation.confidence,
      aiReason: validation.reason,
      validationSource: validation.source,
      confirmCount: 1,
    },
  });

  return c.json({ incident }, 201);
});

// GET /api/incidents — List incidents with filters [FR-501]
incidentRoutes.get("/incidents", async (c) => {
  const parsed = incidentFilterSchema.safeParse({
    status: c.req.query("status"),
    type: c.req.query("type"),
    segmentId: c.req.query("segmentId"),
    limit: c.req.query("limit"),
    offset: c.req.query("offset"),
  });

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

  const { status, type, segmentId, limit, offset } = parsed.data;

  const where = {
    ...(status && { status }),
    ...(type && { type }),
    ...(segmentId && { segmentId }),
  };

  const [incidents, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        description: true,
        latitude: true,
        longitude: true,
        segmentId: true,
        createdAt: true,
      },
    }),
    prisma.incident.count({ where }),
  ]);

  return c.json({ incidents, total });
});

// GET /api/incidents/near — Nearby incidents [FR-502]
// Must be defined BEFORE /incidents/:id to avoid route conflict
incidentRoutes.get("/incidents/near", async (c) => {
  const parsed = nearbySchema.safeParse({
    lat: c.req.query("lat"),
    lng: c.req.query("lng"),
    radius: c.req.query("radius"),
  });

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

  const { lat, lng, radius } = parsed.data;

  // Bounding box filter + Haversine distance in JS
  // ~0.009 degrees per km at Madrid's latitude
  const degPerMeter = 1 / 111320;
  const latDelta = radius * degPerMeter;
  const lngDelta = radius * degPerMeter / Math.cos((lat * Math.PI) / 180);

  const candidates = await prisma.incident.findMany({
    where: {
      status: { in: ["pending", "validated"] },
      latitude: { gte: lat - latDelta, lte: lat + latDelta },
      longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
    },
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      description: true,
      latitude: true,
      longitude: true,
      segmentId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Haversine filter for precise radius
  const incidents = candidates.filter((inc) => {
    const dLat = ((inc.latitude - lat) * Math.PI) / 180;
    const dLng = ((inc.longitude - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((inc.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= radius;
  });

  return c.json({ incidents });
});

// GET /api/incidents/:id — Incident detail [FR-501]
incidentRoutes.get("/incidents/:id", async (c) => {
  const id = c.req.param("id");

  const incident = await prisma.incident.findUnique({ where: { id } });

  if (!incident) {
    return c.json(
      { error: { code: "NOT_FOUND", message: `Incident '${id}' not found` } },
      404
    );
  }

  return c.json({ incident });
});

// PATCH /api/incidents/:id/status — Update incident status [FR-501]
incidentRoutes.patch("/incidents/:id/status", async (c) => {
  const id = c.req.param("id");

  const rawBody = await c.req.json().catch(() => null);
  const bodyResult = parseBody(rawBody);
  if (!bodyResult.ok) {
    return c.json({ error: bodyResult.error }, 400);
  }

  const parsed = updateStatusSchema.safeParse(bodyResult.body);
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

  const existing = await prisma.incident.findUnique({ where: { id } });
  if (!existing) {
    return c.json(
      { error: { code: "NOT_FOUND", message: `Incident '${id}' not found` } },
      404
    );
  }

  const updateData: Record<string, unknown> = {
    status: parsed.data.status,
  };

  if (parsed.data.status === "resolved") {
    updateData.resolvedAt = new Date();
  }

  if (parsed.data.reason) {
    updateData.aiReason = parsed.data.reason;
    updateData.validationSource = "admin";
  }

  const incident = await prisma.incident.update({
    where: { id },
    data: updateData,
  });

  // FR-506: Auto-block/unblock segment based on status change
  if (parsed.data.status === "validated") {
    await blockSegmentForIncident(prisma, id);

    // FR-505: Notify subscribers of the affected segment
    if (incident.segmentId) {
      await notifySegmentSubscribers(prisma, incident.segmentId, {
        title: incident.title,
        type: incident.type,
        id: incident.id,
      });
    }
  } else if (parsed.data.status === "resolved") {
    await unblockSegmentForIncident(prisma, id);
  }

  return c.json({ incident });
});
