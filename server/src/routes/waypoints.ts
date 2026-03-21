// FR-206: Waypoint search endpoint
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export const waypointRoutes = new Hono();

const searchSchema = z.object({
  q: z.string().min(2, "Query must be at least 2 characters"),
});

// GET /api/waypoints/search?q=medicina
waypointRoutes.get("/waypoints/search", async (c) => {
  const parsed = searchSchema.safeParse({ q: c.req.query("q") });

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

  const query = parsed.data.q;

  // FR-206: Case-insensitive partial match, max 10 results
  const waypoints = await prisma.waypoint.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  const results = waypoints.map((wp) => ({
    waypointId: wp.waypointId,
    name: wp.name,
    description: wp.description,
    waypointType: wp.waypointType,
    coordinates: [wp.longitude, wp.latitude] as [number, number],
    ...(wp.transportType && {
      transportInfo: {
        transportType: wp.transportType,
        lines: wp.transportLines,
      },
    }),
  }));

  return c.json(results);
});
