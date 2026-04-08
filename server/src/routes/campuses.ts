// FR-902: Campus CRUD routes
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

const campusRoutes = new Hono();

const createCampusSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  centerLng: z.number().min(-180).max(180),
  centerLat: z.number().min(-90).max(90),
  boundingBox: z.object({
    minLng: z.number(),
    minLat: z.number(),
    maxLng: z.number(),
    maxLat: z.number(),
  }),
  imageUrl: z.string().url().optional(),
});

// GET /api/campuses — public list
campusRoutes.get("/campuses", async (c) => {
  const campuses = await prisma.campus.findMany({
    include: {
      _count: { select: { routes: { where: { status: "published" } } } },
    },
    orderBy: { name: "asc" },
  });

  const result = campuses.map((campus) => ({
    id: campus.id,
    name: campus.name,
    description: campus.description,
    centerLng: campus.centerLng,
    centerLat: campus.centerLat,
    boundingBox: campus.boundingBox,
    imageUrl: campus.imageUrl,
    routeCount: campus._count.routes,
    createdAt: campus.createdAt.toISOString(),
  }));

  return c.json(result);
});

// GET /api/campuses/:id — single campus detail
campusRoutes.get("/campuses/:id", async (c) => {
  const campus = await prisma.campus.findUnique({
    where: { id: c.req.param("id") },
    include: {
      _count: { select: { routes: { where: { status: "published" } } } },
    },
  });

  if (!campus) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Campus no encontrado" } },
      404
    );
  }

  return c.json({
    id: campus.id,
    name: campus.name,
    description: campus.description,
    centerLng: campus.centerLng,
    centerLat: campus.centerLat,
    boundingBox: campus.boundingBox,
    imageUrl: campus.imageUrl,
    routeCount: campus._count.routes,
    createdAt: campus.createdAt.toISOString(),
  });
});

// POST /api/campuses — admin only
campusRoutes.post("/campuses", requireAuth(), requireRole("admin"), async (c) => {
  const body = await c.req.json();
  const parsed = createCampusSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
      400
    );
  }

  const campus = await prisma.campus.create({ data: parsed.data });

  return c.json(
    {
      id: campus.id,
      name: campus.name,
      description: campus.description,
      centerLng: campus.centerLng,
      centerLat: campus.centerLat,
      boundingBox: campus.boundingBox,
      imageUrl: campus.imageUrl,
      createdAt: campus.createdAt.toISOString(),
    },
    201
  );
});

// FR-905: GET /api/campuses/:id/stats — campus statistics
campusRoutes.get("/campuses/:id/stats", async (c) => {
  const campusId = c.req.param("id");

  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  if (!campus) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Campus no encontrado" } },
      404
    );
  }

  const [publishedRoutes, totalWaypoints, totalSegments, activeIncidents, resolvedIncidents, pendingRoutes] =
    await Promise.all([
      prisma.route.count({ where: { campusId, status: "published" } }),
      prisma.waypoint.count({ where: { route: { campusId } } }),
      prisma.routeSegment.count({ where: { route: { campusId } } }),
      prisma.incident.count({
        where: {
          segment: { route: { campusId } },
          status: { in: ["pending", "validated"] },
        },
      }),
      prisma.incident.count({
        where: { segment: { route: { campusId } }, status: "resolved" },
      }),
      prisma.route.count({ where: { campusId, status: "pending_review" } }),
    ]);

  // Accessibility coverage: segments with at least surfaceType + riskLevel filled
  const segmentsWithData = await prisma.routeSegment.count({
    where: {
      route: { campusId },
      pathWidth: { gt: 0 },
    },
  });
  const coveragePercent =
    totalSegments > 0 ? Math.round((segmentsWithData / totalSegments) * 100) : 0;

  return c.json({
    campusId,
    publishedRoutes,
    totalWaypoints,
    totalSegments,
    accessibilityCoverage: coveragePercent,
    activeIncidents,
    resolvedIncidents,
    pendingRoutes,
  });
});

export { campusRoutes };
