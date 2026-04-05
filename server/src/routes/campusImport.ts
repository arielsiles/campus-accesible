// FR-603: Campus import endpoint
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { validateBundle, importCampus } from "../services/campusImportService";
import type { CampusBundle } from "../services/campusExportService";

const prisma = new PrismaClient();

export const campusImportRoutes = new Hono();

// POST /api/campus/validate — Validate a campus bundle without importing [FR-603]
campusImportRoutes.post("/campus/validate", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      400
    );
  }

  const errors = validateBundle(body);

  return c.json({
    valid: errors.length === 0,
    errors,
  });
});

// POST /api/campus/import — Import a campus bundle [FR-603]
campusImportRoutes.post("/campus/import", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      400
    );
  }

  const result = await importCampus(prisma, body as CampusBundle);

  if (!result.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: `Import failed with ${result.errors.length} validation errors`,
        },
        errors: result.errors,
      },
      400
    );
  }

  return c.json({
    success: true,
    routesCreated: result.routesCreated,
    waypointsCreated: result.waypointsCreated,
    segmentsCreated: result.segmentsCreated,
  }, 201);
});
