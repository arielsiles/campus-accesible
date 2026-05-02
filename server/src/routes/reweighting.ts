// FR-1502: Manual re-weighting trigger endpoint (admin only)
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { recomputeEdgeWeights } from "../services/edgeReweightingService";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

export const reweightingRoutes = new Hono();

// FR-1502: POST /api/admin/reweight — admin triggers global re-weighting
reweightingRoutes.post(
  "/admin/reweight",
  requireAuth(),
  requireRole("admin"),
  async (c) => {
    const result = await recomputeEdgeWeights(prisma);
    return c.json(result);
  }
);

// GET /api/admin/metrics — list segment metrics for monitoring
reweightingRoutes.get(
  "/admin/metrics",
  requireAuth(),
  requireRole("admin", "reviewer"),
  async (c) => {
    const limit = Math.min(100, Number(c.req.query("limit") ?? "50"));
    const metrics = await prisma.segmentMetrics.findMany({
      orderBy: { usageCount: "desc" },
      take: limit,
    });
    return c.json(metrics);
  }
);
