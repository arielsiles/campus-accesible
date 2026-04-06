// FR-705: Route creation/update/deletion service
import { PrismaClient } from "@prisma/client";
import { buildGraph } from "./graphBuilder";
import { descriptionGenerator } from "./descriptionGenerator";

export interface RouteFeatureCollection {
  type: string;
  properties: { name: string; description: string };
  features: Array<{
    type: string;
    geometry: { type: string; coordinates: unknown };
    properties: Record<string, unknown>;
  }>;
}

export interface RouteValidationError {
  field: string;
  message: string;
}

/**
 * FR-705: Validate a route FeatureCollection
 */
export function validateRouteData(data: unknown): RouteValidationError[] {
  const errors: RouteValidationError[] = [];

  if (!data || typeof data !== "object") {
    errors.push({ field: "body", message: "Invalid route data" });
    return errors;
  }

  const fc = data as Record<string, unknown>;

  if (fc.type !== "FeatureCollection") {
    errors.push({ field: "type", message: "Must be a FeatureCollection" });
  }

  if (!fc.properties || typeof fc.properties !== "object") {
    errors.push({ field: "properties", message: "Missing properties" });
  } else {
    const props = fc.properties as Record<string, unknown>;
    if (!props.name || typeof props.name !== "string") {
      errors.push({ field: "properties.name", message: "Route name is required" });
    }
  }

  if (!Array.isArray(fc.features)) {
    errors.push({ field: "features", message: "Missing features array" });
    return errors;
  }

  const features = fc.features as Array<Record<string, unknown>>;
  const waypoints = features.filter(
    (f) => (f.properties as Record<string, unknown>)?.featureType === "waypoint"
  );
  const segments = features.filter(
    (f) => (f.properties as Record<string, unknown>)?.featureType === "route-segment"
  );

  if (waypoints.length < 2) {
    errors.push({ field: "waypoints", message: "At least 2 waypoints required" });
  }

  if (segments.length < 1) {
    errors.push({ field: "segments", message: "At least 1 segment required" });
  }

  // Validate each waypoint has required fields
  for (let i = 0; i < waypoints.length; i++) {
    const props = waypoints[i].properties as Record<string, unknown>;
    if (!props?.waypointId) {
      errors.push({ field: `waypoint[${i}]`, message: "Missing waypointId" });
    }
    if (!props?.name) {
      errors.push({ field: `waypoint[${i}]`, message: "Missing name" });
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const props = segments[i].properties as Record<string, unknown>;
    if (!props?.segmentId) {
      errors.push({ field: `segment[${i}]`, message: "Missing segmentId" });
    }
  }

  return errors;
}

/**
 * FR-705: Create a new route from a GeoJSON FeatureCollection
 */
export async function createRoute(
  prisma: PrismaClient,
  data: RouteFeatureCollection
): Promise<{ id: string; name: string; description: string }> {
  const props = data.properties;

  const features = data.features;
  const waypointFeatures = features.filter(
    (f) => f.properties.featureType === "waypoint"
  );
  const segmentFeatures = features.filter(
    (f) => f.properties.featureType === "route-segment"
  );

  const route = await prisma.route.create({
    data: {
      name: props.name,
      description: props.description || "",
      waypoints: {
        create: waypointFeatures.map((f, i) => ({
          waypointId: String(f.properties.waypointId),
          name: String(f.properties.name),
          description: String(f.properties.description || ""),
          waypointType: String(f.properties.waypointType || "landmark"),
          latitude: (f.geometry.coordinates as number[])[1],
          longitude: (f.geometry.coordinates as number[])[0],
          orderIndex: (f.properties.orderIndex as number) ?? i,
          ...(f.properties.transportType && {
            transportType: String(f.properties.transportType),
          }),
          ...(f.properties.transportLines && {
            transportLines: f.properties.transportLines as string[],
          }),
        })),
      },
      segments: {
        create: segmentFeatures.map((f, i) => ({
          segmentId: String(f.properties.segmentId),
          name: String(f.properties.name || `Segmento ${i + 1}`),
          surfaceType: String(f.properties.surfaceType || "paved"),
          elevationChange: Number(f.properties.elevationChange || 0),
          riskLevel: String(f.properties.riskLevel || "none"),
          geometryGeoJson: JSON.stringify(f.geometry),
          orderIndex: (f.properties.orderIndex as number) ?? i,
          riskDescription: f.properties.riskDescription as string | undefined,
          riskFactors: (f.properties.riskFactors as string[]) || [],
          audioDescription: f.properties.audioDescription as string | undefined,
          hasRamp: (f.properties.hasRamp as boolean) ?? false,
          hasStairs: (f.properties.hasStairs as boolean) ?? false,
          pathWidth: Number(f.properties.pathWidth ?? 2.0),
          maxSlope: Number(f.properties.maxSlope ?? 0),
          surfaceQuality: String(f.properties.surfaceQuality ?? "good"),
        })),
      },
    },
    select: { id: true, name: true, description: true },
  });

  // FR-706: Auto-generate audio descriptions for new segments
  const newSegments = await prisma.routeSegment.findMany({
    where: { routeId: route.id },
    select: {
      id: true, name: true, surfaceType: true, elevationChange: true,
      riskLevel: true, riskDescription: true, riskFactors: true,
    },
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const descriptions = await descriptionGenerator.generateBatch(
    newSegments.map((s) => ({
      name: s.name,
      surfaceType: s.surfaceType,
      elevationChange: s.elevationChange,
      riskLevel: s.riskLevel,
      riskDescription: s.riskDescription,
      riskFactors: s.riskFactors,
    })),
    apiKey || undefined
  );

  for (let i = 0; i < newSegments.length; i++) {
    await prisma.routeSegment.update({
      where: { id: newSegments[i].id },
      data: { audioDescription: descriptions[i].audioDescription },
    });
  }

  // Rebuild graph to include new route
  await buildGraph(prisma);

  return route;
}

/**
 * FR-705: Delete a route and rebuild the graph
 */
export async function deleteRoute(
  prisma: PrismaClient,
  routeId: string
): Promise<boolean> {
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route) return false;

  // Delete in order (FK constraints)
  await prisma.routeSegment.deleteMany({ where: { routeId } });
  await prisma.waypoint.deleteMany({ where: { routeId } });
  await prisma.route.delete({ where: { id: routeId } });

  // Rebuild graph without deleted route
  await buildGraph(prisma);

  return true;
}
