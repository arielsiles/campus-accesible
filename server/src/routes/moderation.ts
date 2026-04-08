// FR-904: Route moderation workflow
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/authMiddleware";
import { buildGraph } from "../services/graphBuilder";

const prisma = new PrismaClient();

const moderationRoutes = new Hono();

// GET /api/moderation/pending — list routes pending review (reviewer+)
moderationRoutes.get(
  "/moderation/pending",
  requireAuth(),
  requireRole("reviewer", "admin"),
  async (c) => {
    const routes = await prisma.route.findMany({
      where: { status: "pending_review" },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { waypoints: true, segments: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return c.json(
      routes.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        creator: r.creator,
        waypointCount: r._count.waypoints,
        segmentCount: r._count.segments,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  }
);

const reviewSchema = z.object({
  action: z.enum(["approved", "changes_requested", "rejected"]),
  comment: z.string().optional(),
});

// POST /api/moderation/routes/:id/review — review a route (reviewer+)
moderationRoutes.post(
  "/moderation/routes/:id/review",
  requireAuth(),
  requireRole("reviewer", "admin"),
  async (c) => {
    const routeId = c.req.param("id");
    const body = await c.req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
        400
      );
    }

    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      return c.json(
        { error: { code: "NOT_FOUND", message: "Ruta no encontrada" } },
        404
      );
    }

    if (route.status !== "pending_review") {
      return c.json(
        {
          error: {
            code: "INVALID_STATUS",
            message: `La ruta no está pendiente de revisión (estado actual: ${route.status})`,
          },
        },
        400
      );
    }

    const user = c.get("user");
    const { action, comment } = parsed.data;

    // Map review action to route status
    const statusMap: Record<string, string> = {
      approved: "published",
      changes_requested: "changes_requested",
      rejected: "rejected",
    };
    const newStatus = statusMap[action];

    // Create review record + update route status in transaction
    const [review, updatedRoute] = await prisma.$transaction([
      prisma.routeReview.create({
        data: {
          routeId,
          reviewerId: user.sub,
          action: action as "approved" | "changes_requested" | "rejected",
          comment: comment ?? null,
        },
      }),
      prisma.route.update({
        where: { id: routeId },
        data: { status: newStatus as "published" | "changes_requested" | "rejected" },
      }),
    ]);

    // FR-904: Rebuild graph when route is published
    if (newStatus === "published") {
      await buildGraph(prisma);
    }

    return c.json({
      review: {
        id: review.id,
        action: review.action,
        comment: review.comment,
      },
      route: {
        id: updatedRoute.id,
        name: updatedRoute.name,
        status: updatedRoute.status,
      },
    });
  }
);

export { moderationRoutes };
