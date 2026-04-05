// FR-603: Campus export endpoint
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { exportCampus } from "../services/campusExportService";

const prisma = new PrismaClient();

export const campusExportRoutes = new Hono();

// GET /api/campus/export — Export all campus data as GeoJSON bundle [FR-603]
campusExportRoutes.get("/campus/export", async (c) => {
  const name = c.req.query("name") ?? "Ciudad Universitaria";

  const bundle = await exportCampus(prisma, name);

  return c.json(bundle);
});
