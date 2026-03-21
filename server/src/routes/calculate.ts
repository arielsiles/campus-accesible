// FR-207: Route calculation endpoint
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { calculateRoute } from "../services/routingService";

const prisma = new PrismaClient();

export const calculateRoutes = new Hono();

const routeCalculationSchema = z.object({
  origin: z.string().min(1, "origin is required"),
  destination: z.string().min(1, "destination is required"),
});

// POST /api/routes/calculate
calculateRoutes.post("/routes/calculate", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      400
    );
  }

  const parsed = routeCalculationSchema.safeParse(body);
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

  const result = await calculateRoute(
    prisma,
    parsed.data.origin,
    parsed.data.destination
  );

  if (!result.success) {
    const statusCode =
      result.error.code === "SAME_ORIGIN_DESTINATION" ||
      result.error.code === "VALIDATION_ERROR"
        ? 400
        : 404;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ route: result.route });
});
