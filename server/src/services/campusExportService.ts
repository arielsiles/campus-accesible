// FR-603: Campus data export service — serializes all routes to GeoJSON bundle
import { PrismaClient } from "@prisma/client";

export interface CampusBundle {
  campus: {
    name: string;
    center: [number, number];
    version: string;
  };
  routes: CampusRouteExport[];
  metadata: {
    exportedAt: string;
    routeCount: number;
    waypointCount: number;
    segmentCount: number;
  };
}

interface CampusRouteExport {
  type: "FeatureCollection";
  properties: {
    id: string;
    name: string;
    description: string;
  };
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point" | "LineString";
      coordinates: unknown;
    };
    properties: Record<string, unknown>;
  }>;
}

/**
 * FR-603: Export all campus routes as a GeoJSON bundle
 */
export async function exportCampus(
  prisma: PrismaClient,
  campusName: string = "Ciudad Universitaria",
  campusCenter: [number, number] = [-3.7264, 40.4468]
): Promise<CampusBundle> {
  const routes = await prisma.route.findMany({
    include: {
      waypoints: { orderBy: { orderIndex: "asc" } },
      segments: { orderBy: { orderIndex: "asc" } },
    },
  });

  let totalWaypoints = 0;
  let totalSegments = 0;

  const routeExports: CampusRouteExport[] = routes.map((route) => {
    totalWaypoints += route.waypoints.length;
    totalSegments += route.segments.length;

    const waypointFeatures = route.waypoints.map((wp) => ({
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
        orderIndex: wp.orderIndex,
        ...(wp.transportType && { transportType: wp.transportType }),
        ...(wp.transportLines.length > 0 && { transportLines: wp.transportLines }),
      },
    }));

    const segmentFeatures = route.segments.map((seg) => ({
      type: "Feature" as const,
      geometry: JSON.parse(seg.geometryGeoJson),
      properties: {
        featureType: "route-segment",
        segmentId: seg.segmentId,
        name: seg.name,
        surfaceType: seg.surfaceType,
        elevationChange: seg.elevationChange,
        riskLevel: seg.riskLevel,
        orderIndex: seg.orderIndex,
        ...(seg.riskDescription && { riskDescription: seg.riskDescription }),
        ...(seg.riskFactors.length > 0 && { riskFactors: seg.riskFactors }),
        ...(seg.audioDescription && { audioDescription: seg.audioDescription }),
        hasRamp: seg.hasRamp,
        hasStairs: seg.hasStairs,
        pathWidth: seg.pathWidth,
        maxSlope: seg.maxSlope,
        surfaceQuality: seg.surfaceQuality,
      },
    }));

    return {
      type: "FeatureCollection" as const,
      properties: {
        id: route.id,
        name: route.name,
        description: route.description,
      },
      features: [...waypointFeatures, ...segmentFeatures],
    };
  });

  return {
    campus: {
      name: campusName,
      center: campusCenter,
      version: "1.0",
    },
    routes: routeExports,
    metadata: {
      exportedAt: new Date().toISOString(),
      routeCount: routes.length,
      waypointCount: totalWaypoints,
      segmentCount: totalSegments,
    },
  };
}
