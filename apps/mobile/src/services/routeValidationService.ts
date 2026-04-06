// FR-704: Route validation service — validates draft route before upload
import type { DraftWaypoint, DraftSegment } from "../store/routeCreatorStore";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * FR-704: Validate a draft route locally before uploading
 */
export function validateRoute(
  routeName: string,
  routeDescription: string,
  waypoints: DraftWaypoint[],
  segments: DraftSegment[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // Route metadata
  if (!routeName || routeName.trim().length < 3) {
    errors.push({ field: "routeName", message: "El nombre de la ruta debe tener al menos 3 caracteres" });
  }

  if (!routeDescription || routeDescription.trim().length < 5) {
    errors.push({ field: "routeDescription", message: "La descripcion de la ruta es requerida" });
  }

  // Waypoints
  if (waypoints.length < 2) {
    errors.push({ field: "waypoints", message: "Se necesitan al menos 2 puntos para crear una ruta" });
  }

  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    if (!wp.name || wp.name.trim().length === 0) {
      errors.push({ field: `waypoint[${i}].name`, message: `El punto ${i + 1} necesita un nombre` });
    }
    if (wp.latitude === 0 && wp.longitude === 0) {
      errors.push({ field: `waypoint[${i}].coords`, message: `El punto ${i + 1} tiene coordenadas invalidas` });
    }
  }

  // Segments
  const expectedSegments = Math.max(0, waypoints.length - 1);
  if (segments.length !== expectedSegments) {
    errors.push({
      field: "segments",
      message: `Se esperan ${expectedSegments} segmentos pero hay ${segments.length}`,
    });
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.coordinates.length < 2) {
      errors.push({
        field: `segment[${i}].coordinates`,
        message: `El segmento ${i + 1} necesita al menos 2 coordenadas`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * FR-707: Serialize draft route to GeoJSON FeatureCollection for upload
 */
export function serializeRouteToGeoJSON(
  routeName: string,
  routeDescription: string,
  waypoints: DraftWaypoint[],
  segments: DraftSegment[]
): Record<string, unknown> {
  const waypointFeatures = waypoints.map((wp) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [wp.longitude, wp.latitude],
    },
    properties: {
      featureType: "waypoint",
      waypointId: wp.id,
      name: wp.name,
      description: wp.description,
      waypointType: wp.waypointType,
      orderIndex: wp.orderIndex,
      ...(wp.transportType && { transportType: wp.transportType }),
      ...(wp.transportLines && { transportLines: wp.transportLines }),
    },
  }));

  const segmentFeatures = segments.map((seg) => ({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: seg.coordinates,
    },
    properties: {
      featureType: "route-segment",
      segmentId: seg.id,
      name: seg.name,
      surfaceType: seg.surfaceType,
      elevationChange: seg.elevationChange,
      riskLevel: seg.riskLevel,
      orderIndex: seg.orderIndex,
      ...(seg.riskDescription && { riskDescription: seg.riskDescription }),
      ...(seg.riskFactors.length > 0 && { riskFactors: seg.riskFactors }),
      hasRamp: seg.hasRamp,
      hasStairs: seg.hasStairs,
      pathWidth: seg.pathWidth,
      maxSlope: seg.maxSlope,
      surfaceQuality: seg.surfaceQuality,
    },
  }));

  return {
    type: "FeatureCollection",
    properties: {
      name: routeName,
      description: routeDescription,
    },
    features: [...waypointFeatures, ...segmentFeatures],
  };
}
