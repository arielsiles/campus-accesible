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

  // FR-206: Accent + case-insensitive partial match using Postgres `unaccent`
  // Searches in name and description, max 10 results
  const waypoints = await prisma.$queryRaw<Array<{
    waypointId: string;
    name: string;
    description: string;
    waypointType: string;
    latitude: number;
    longitude: number;
    transportType: string | null;
    transportLines: string[];
  }>>`
    SELECT waypoint_id AS "waypointId", name, description,
           waypoint_type AS "waypointType", latitude, longitude,
           transport_type AS "transportType", transport_lines AS "transportLines"
    FROM waypoints
    WHERE unaccent(name) ILIKE unaccent(${"%" + query + "%"})
       OR unaccent(description) ILIKE unaccent(${"%" + query + "%"})
    ORDER BY name ASC
    LIMIT 10
  `;

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
