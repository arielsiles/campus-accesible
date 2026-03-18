// FR-006: GeoJSON data model types

export type WaypointType =
  | "BUILDING"
  | "ENTRANCE"
  | "INTERSECTION"
  | "BUS_STOP"
  | "METRO"
  | "LANDMARK"
  | "PARKING"
  | "ACCESSIBILITY_FEATURE";

export interface RouteProperties {
  id: string;
  name: string;
  description: string;
}

export interface WaypointProperties {
  featureType: "waypoint";
  waypointId: string;
  name: string;
  description: string;
  waypointType: WaypointType;
  order: number;
}

export interface RouteSegmentProperties {
  featureType: "route-segment";
  segmentId: string;
  name: string;
  surfaceType: string;
  elevationChange: number;
  riskLevel: number;
  order: number;
}

export interface RouteFeature {
  type: "Feature";
  geometry:
    | { type: "Point"; coordinates: [number, number] }
    | { type: "LineString"; coordinates: [number, number][] };
  properties: WaypointProperties | RouteSegmentProperties;
}

export interface RouteFeatureCollection {
  type: "FeatureCollection";
  properties: RouteProperties;
  features: RouteFeature[];
}

export interface RouteListItem {
  id: string;
  name: string;
  description: string;
}

export interface HealthResponse {
  status: "ok";
  timestamp: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
