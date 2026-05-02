// FR-1102: Vision API endpoint with rate limiting and budget cap
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import {
  describeImage,
  getCurrentMonthUsage,
  recordUsage,
  recordError,
  VisionError,
  type AccessibilityProfile,
} from "../services/visionService";
import { buildVisionContext } from "../services/visionContextService";
import { rateLimit } from "../middleware/rateLimitMiddleware";

const prisma = new PrismaClient();

const VISION_MONTHLY_BUDGET_USD = Number(
  process.env.VISION_MONTHLY_BUDGET_USD ?? "20"
);

const visionRoutes = new Hono();

const requestSchema = z.object({
  image: z.string().min(100, "Imagen vacia o invalida"), // base64
  mediaType: z.enum(["image/jpeg", "image/png"]).default("image/jpeg"),
  profile: z
    .enum(["standard", "visual_disability", "reduced_mobility", "deaf", "easy_read"])
    .default("standard"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  context: z.string().max(2000).optional(),
});

// FR-1102: POST /api/vision/describe
visionRoutes.post(
  "/vision/describe",
  // Rate limit: 5 requests per minute per identity
  rateLimit({
    maxRequests: 5,
    windowSeconds: 60,
    endpoint: "vision:describe:1m",
  }),
  // Rate limit: 100 requests per hour per identity
  rateLimit({
    maxRequests: 100,
    windowSeconds: 3600,
    endpoint: "vision:describe:1h",
  }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body) {
      return c.json(
        { error: { code: "INVALID_BODY", message: "JSON invalido" } },
        400
      );
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.errors[0].message,
          },
        },
        400
      );
    }

    // Validate image size (~base64 decode = 75% of length)
    const approxBytes = Math.floor((parsed.data.image.length * 3) / 4);
    if (approxBytes > 2 * 1024 * 1024) {
      return c.json(
        {
          error: {
            code: "IMAGE_TOO_LARGE",
            message: "La imagen excede 2MB. Usa una resolucion menor.",
          },
        },
        400
      );
    }

    // NFR-1101: Budget cap check
    const usage = await getCurrentMonthUsage(prisma);
    if (usage.totalUsd >= VISION_MONTHLY_BUDGET_USD) {
      return c.json(
        {
          error: {
            code: "VISION_BUDGET_EXCEEDED",
            message: `El servicio de vision IA alcanzo el limite mensual ($${VISION_MONTHLY_BUDGET_USD}). Volvera a estar disponible el primer dia del proximo mes.`,
          },
        },
        503
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return c.json(
        {
          error: {
            code: "VISION_UNAVAILABLE",
            message: "El servicio de vision no esta configurado en el servidor.",
          },
        },
        503
      );
    }

    try {
      // FR-1103: Enrich context with nearby waypoints / incidents / segment
      const enrichedContext = await buildVisionContext(
        prisma,
        parsed.data.latitude,
        parsed.data.longitude
      );
      const fullContext = [parsed.data.context, enrichedContext.contextText]
        .filter(Boolean)
        .join("\n\n");

      const result = await describeImage({
        imageBase64: parsed.data.image,
        mediaType: parsed.data.mediaType,
        profile: parsed.data.profile as AccessibilityProfile,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        context: fullContext || undefined,
      });

      // NFR-1101: Track cost
      if (result.costUsd && result.costUsd > 0) {
        await recordUsage(prisma, result.costUsd);
      }

      // Don't expose costUsd to client
      const { costUsd: _cost, inputTokens: _in, outputTokens: _out, ...publicResult } = result;
      return c.json(publicResult);
    } catch (err) {
      await recordError(prisma);
      if (err instanceof VisionError) {
        return c.json(
          { error: { code: err.code, message: err.message } },
          503
        );
      }
      const message = err instanceof Error ? err.message : "Error en analisis";
      return c.json(
        {
          error: {
            code: "VISION_ERROR",
            message: `No se pudo analizar la imagen: ${message}`,
          },
        },
        500
      );
    }
  }
);

// FR-1102: GET /api/vision/usage — current month usage stats (admin/debug)
visionRoutes.get("/vision/usage", async (c) => {
  const usage = await getCurrentMonthUsage(prisma);
  return c.json({
    month: usage.month,
    totalUsd: Number(usage.totalUsd.toFixed(4)),
    totalCalls: usage.totalCalls,
    budgetUsd: VISION_MONTHLY_BUDGET_USD,
    remainingUsd: Number(
      Math.max(0, VISION_MONTHLY_BUDGET_USD - usage.totalUsd).toFixed(4)
    ),
    percentUsed: Number(
      ((usage.totalUsd / VISION_MONTHLY_BUDGET_USD) * 100).toFixed(2)
    ),
  });
});

export { visionRoutes };
