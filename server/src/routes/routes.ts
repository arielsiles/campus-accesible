// FR-007: Routes endpoints — GET /api/routes, GET /api/routes/:id
// FR-307: AI description generation endpoint
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { descriptionGenerator } from "../services/descriptionGenerator";

const prisma = new PrismaClient();

export const routeRoutes = new Hono();

// GET /api/routes — list all routes
routeRoutes.get("/routes", async (c) => {
  const routes = await prisma.route.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return c.json(routes);
});

// GET /api/routes/:id — get route with waypoints and segments as GeoJSON
routeRoutes.get("/routes/:id", async (c) => {
  const { id } = c.req.param();

  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      waypoints: { orderBy: { orderIndex: "asc" } },
      segments: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!route) {
    return c.json(
      { error: { code: "NOT_FOUND", message: `Route '${id}' not found` } },
      404
    );
  }

  // FR-006: Transform to GeoJSON FeatureCollection
  const geojson = {
    type: "FeatureCollection" as const,
    properties: {
      id: route.id,
      name: route.name,
      description: route.description,
    },
    features: [
      // Waypoint features (Point) — FR-205: include transport info
      ...route.waypoints.map((wp) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [wp.longitude, wp.latitude],
        },
        properties: {
          featureType: "waypoint",
          waypointId: wp.waypointId,
          name: wp.name,
          description: wp.description,
          waypointType: wp.waypointType,
          ...(wp.transportType && {
            transportType: wp.transportType,
            transportLines: wp.transportLines,
          }),
        },
      })),
      // Segment features (LineString) — geometry from geometryGeoJson field
      ...route.segments.map((seg) => ({
        type: "Feature" as const,
        geometry: JSON.parse(seg.geometryGeoJson),
        properties: {
          featureType: "route-segment",
          segmentId: seg.segmentId,
          name: seg.name,
          surfaceType: seg.surfaceType,
          elevationChange: seg.elevationChange,
          riskLevel: seg.riskLevel,
          // FR-304: Detailed risk assessment
          ...(seg.riskDescription && { riskDescription: seg.riskDescription }),
          ...(seg.riskFactors.length > 0 && { riskFactors: seg.riskFactors }),
          ...(seg.audioDescription && { audioDescription: seg.audioDescription }),
          // FR-401: Physical accessibility
          hasRamp: seg.hasRamp,
          hasStairs: seg.hasStairs,
          pathWidth: seg.pathWidth,
          maxSlope: seg.maxSlope,
          surfaceQuality: seg.surfaceQuality,
        },
      })),
    ],
  };

  return c.json(geojson);
});

// FR-307: POST /api/routes/generate-descriptions — batch AI description generation
routeRoutes.post("/routes/generate-descriptions", async (c) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const segments = await prisma.routeSegment.findMany({
    select: {
      id: true,
      name: true,
      surfaceType: true,
      elevationChange: true,
      riskLevel: true,
      riskDescription: true,
      riskFactors: true,
      audioDescription: true,
    },
  });

  const segmentData = segments.map((seg) => ({
    id: seg.id,
    name: seg.name,
    surfaceType: seg.surfaceType,
    elevationChange: seg.elevationChange,
    riskLevel: seg.riskLevel,
    riskDescription: seg.riskDescription,
    riskFactors: seg.riskFactors,
  }));

  const results = await descriptionGenerator.generateBatch(
    segmentData,
    apiKey || undefined,
  );

  // Update descriptions in database
  let updated = 0;
  for (let i = 0; i < segments.length; i++) {
    await prisma.routeSegment.update({
      where: { id: segments[i].id },
      data: { audioDescription: results[i].audioDescription },
    });
    updated++;
  }

  return c.json({
    updated,
    source: results[0]?.source ?? "template",
    descriptions: results.map((r, i) => ({
      segmentId: segments[i].id,
      name: segments[i].name,
      audioDescription: r.audioDescription,
      source: r.source,
    })),
  });
});
