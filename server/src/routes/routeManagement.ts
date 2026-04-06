// FR-705: Route management endpoints — POST, PUT, DELETE
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import {
  validateRouteData,
  createRoute,
  deleteRoute,
} from "../services/routeCreationService";
import type { RouteFeatureCollection } from "../services/routeCreationService";

const prisma = new PrismaClient();

export const routeManagementRoutes = new Hono();

// POST /api/routes — Create a new route [FR-705]
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

  const route = await createRoute(prisma, body as RouteFeatureCollection);

  return c.json({ route, graphRebuilt: true }, 201);
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
