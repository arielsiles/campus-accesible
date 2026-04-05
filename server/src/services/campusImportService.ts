// FR-603: Campus data import service — validates and creates routes from GeoJSON bundle
import { PrismaClient } from "@prisma/client";
import { buildGraph } from "./graphBuilder";
import type { CampusBundle } from "./campusExportService";

export interface ImportValidationError {
  route?: string;
  feature?: number;
  message: string;
}

export interface ImportResult {
  success: boolean;
  routesCreated: number;
  waypointsCreated: number;
  segmentsCreated: number;
  errors: ImportValidationError[];
}

const VALID_WAYPOINT_TYPES = [
  "entrance", "intersection", "building", "transport_stop",
  "landmark", "hazard", "rest_area", "information_point",
];

const VALID_SURFACE_TYPES = ["paved", "cobblestone", "gravel", "dirt", "tactile"];
const VALID_RISK_LEVELS = ["none", "low", "medium", "high"];

/**
 * FR-603: Validate a campus bundle before importing
 */
export function validateBundle(bundle: unknown): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  if (!bundle || typeof bundle !== "object") {
    errors.push({ message: "Bundle must be a JSON object" });
    return errors;
  }

  const b = bundle as Record<string, unknown>;

  if (!b.campus || typeof b.campus !== "object") {
    errors.push({ message: "Missing 'campus' object with name and center" });
  }

  if (!Array.isArray(b.routes)) {
    errors.push({ message: "Missing 'routes' array" });
    return errors;
  }

  for (let ri = 0; ri < b.routes.length; ri++) {
    const route = b.routes[ri] as Record<string, unknown>;
    const routeName = `Route ${ri}`;

    if (!route.properties || typeof route.properties !== "object") {
      errors.push({ route: routeName, message: "Missing route properties (name, description)" });
      continue;
    }

    const props = route.properties as Record<string, unknown>;
    if (!props.name) {
      errors.push({ route: routeName, message: "Missing route name" });
    }

    if (!Array.isArray(route.features)) {
      errors.push({ route: routeName, message: "Missing features array" });
      continue;
    }

    const features = route.features as Array<Record<string, unknown>>;
    const waypoints = features.filter(
      (f) => (f.properties as Record<string, unknown>)?.featureType === "waypoint"
    );
    const segments = features.filter(
      (f) => (f.properties as Record<string, unknown>)?.featureType === "route-segment"
    );

    if (waypoints.length < 2) {
      errors.push({ route: routeName, message: "Route must have at least 2 waypoints" });
    }

    if (segments.length < 1) {
      errors.push({ route: routeName, message: "Route must have at least 1 segment" });
    }

    // Validate waypoint properties
    for (let fi = 0; fi < waypoints.length; fi++) {
      const wp = waypoints[fi].properties as Record<string, unknown>;
      if (!wp?.waypointId) {
        errors.push({ route: routeName, feature: fi, message: "Waypoint missing waypointId" });
      }
      if (!wp?.name) {
        errors.push({ route: routeName, feature: fi, message: "Waypoint missing name" });
      }
      if (wp?.waypointType && !VALID_WAYPOINT_TYPES.includes(wp.waypointType as string)) {
        errors.push({ route: routeName, feature: fi, message: `Invalid waypointType: ${wp.waypointType}` });
      }
    }

    // Validate segment properties
    for (let fi = 0; fi < segments.length; fi++) {
      const seg = segments[fi].properties as Record<string, unknown>;
      if (!seg?.segmentId) {
        errors.push({ route: routeName, feature: fi, message: "Segment missing segmentId" });
      }
      if (seg?.surfaceType && !VALID_SURFACE_TYPES.includes(seg.surfaceType as string)) {
        errors.push({ route: routeName, feature: fi, message: `Invalid surfaceType: ${seg.surfaceType}` });
      }
      if (seg?.riskLevel && !VALID_RISK_LEVELS.includes(seg.riskLevel as string)) {
        errors.push({ route: routeName, feature: fi, message: `Invalid riskLevel: ${seg.riskLevel}` });
      }
    }
  }

  return errors;
}

/**
 * FR-603: Import a validated campus bundle into the database
 */
export async function importCampus(
  prisma: PrismaClient,
  bundle: CampusBundle
): Promise<ImportResult> {
  const errors = validateBundle(bundle);
  if (errors.length > 0) {
    return { success: false, routesCreated: 0, waypointsCreated: 0, segmentsCreated: 0, errors };
  }

  let routesCreated = 0;
  let waypointsCreated = 0;
  let segmentsCreated = 0;

  for (const routeData of bundle.routes) {
    const waypoints = routeData.features.filter(
      (f) => f.properties.featureType === "waypoint"
    );
    const segments = routeData.features.filter(
      (f) => f.properties.featureType === "route-segment"
    );

    await prisma.route.create({
      data: {
        name: routeData.properties.name,
        description: routeData.properties.description || "",
        waypoints: {
          create: waypoints.map((f, i) => ({
            waypointId: f.properties.waypointId as string,
            name: f.properties.name as string,
            description: (f.properties.description as string) || "",
            waypointType: (f.properties.waypointType as string) || "landmark",
            latitude: (f.geometry.coordinates as number[])[1],
            longitude: (f.geometry.coordinates as number[])[0],
            orderIndex: (f.properties.orderIndex as number) ?? i,
            ...(f.properties.transportType && {
              transportType: f.properties.transportType as string,
            }),
            ...(f.properties.transportLines && {
              transportLines: f.properties.transportLines as string[],
            }),
          })),
        },
        segments: {
          create: segments.map((f, i) => ({
            segmentId: f.properties.segmentId as string,
            name: (f.properties.name as string) || `Segment ${i}`,
            surfaceType: (f.properties.surfaceType as string) || "paved",
            elevationChange: (f.properties.elevationChange as number) || 0,
            riskLevel: (f.properties.riskLevel as string) || "none",
            geometryGeoJson: JSON.stringify(f.geometry),
            orderIndex: (f.properties.orderIndex as number) ?? i,
            riskDescription: f.properties.riskDescription as string | undefined,
            riskFactors: (f.properties.riskFactors as string[]) || [],
            audioDescription: f.properties.audioDescription as string | undefined,
            hasRamp: (f.properties.hasRamp as boolean) ?? false,
            hasStairs: (f.properties.hasStairs as boolean) ?? false,
            pathWidth: (f.properties.pathWidth as number) ?? 2.0,
            maxSlope: (f.properties.maxSlope as number) ?? 0,
            surfaceQuality: (f.properties.surfaceQuality as string) ?? "good",
          })),
        },
      },
    });

    routesCreated++;
    waypointsCreated += waypoints.length;
    segmentsCreated += segments.length;
  }

  // Rebuild graph after import
  await buildGraph(prisma);

  return {
    success: true,
    routesCreated,
    waypointsCreated,
    segmentsCreated,
    errors: [],
  };
}
