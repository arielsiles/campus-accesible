// FR-705, FR-904: Route management endpoints — POST, PUT, DELETE
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import {
  validateRouteData,
  createRoute,
  deleteRoute,
} from "../services/routeCreationService";
import type { RouteFeatureCollection } from "../services/routeCreationService";
import { verifyToken } from "../services/authService";

const prisma = new PrismaClient();

export const routeManagementRoutes = new Hono();

// POST /api/routes — Create a new route [FR-705, FR-904]
routeManagementRoutes.post("/routes", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      400
    );
  }

  const errors = validateRouteData(body);
  if (errors.length > 0) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: errors.map((e) => e.message).join(", "),
          details: errors,
        },
      },
      400
    );
  }

  // FR-904: Determine route status based on user role
  let creatorId: string | undefined;
  let status: "published" | "pending_review" = "published"; // default for anonymous/admin

  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = await verifyToken(authHeader.slice(7));
      creatorId = payload.sub;
      // Contributors' routes need review; admin routes auto-publish
      if (payload.role === "contributor") {
        status = "pending_review";
      }
    } catch {
      // Invalid token — proceed as anonymous (published for backward compat)
    }
  }

  const route = await createRoute(prisma, body as RouteFeatureCollection, {
    creatorId,
    status,
    campusId: body.campusId,
  });

  return c.json({ route, graphRebuilt: status === "published" }, 201);
});

// DELETE /api/routes/:id — Delete a route [FR-705]
routeManagementRoutes.delete("/routes/:id", async (c) => {
  const id = c.req.param("id");

  const deleted = await deleteRoute(prisma, id);

  if (!deleted) {
    return c.json(
      { error: { code: "NOT_FOUND", message: `Route '${id}' not found` } },
      404
    );
  }

  return c.json({ deleted: true, graphRebuilt: true });
});
