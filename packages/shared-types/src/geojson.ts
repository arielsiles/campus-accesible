// FR-006: GeoJSON data model types — aligned with SPEC-FASE-1.md §4.3

// === Enums ===

export enum WaypointType {
  Entrance = "entrance",
  Intersection = "intersection",
  Building = "building",
  TransportStop = "transport_stop",
  Landmark = "landmark",
  Hazard = "hazard",
  RestArea = "rest_area",
  InformationPoint = "information_point",
}

export enum SurfaceType {
  Paved = "paved",
  Cobblestone = "cobblestone",
  Gravel = "gravel",
  Dirt = "dirt",
  Tactile = "tactile",
}

export enum RiskLevel {
  None = "none",
  Low = "low",
  Medium = "medium",
  High = "high",
}

// === GeoJSON Interfaces ===

export interface RouteSegmentProperties {
  featureType: "route-segment";
  segmentId: string;
  name: string;
  surfaceType: SurfaceType;
  elevationChange: number;
  riskLevel: RiskLevel;
}

export interface WaypointProperties {
  featureType: "waypoint";
  waypointId: string;
  name: string;
  description: string;
  waypointType: WaypointType;
}

export interface RouteSegmentFeature {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][] | [number, number, number][];
  };
  properties: RouteSegmentProperties;
}

export interface WaypointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number] | [number, number, number];
  };
  properties: WaypointProperties;
}

export type RouteFeature = RouteSegmentFeature | WaypointFeature;

export interface RouteProperties {
  id: string;
  name: string;
  description: string;
}

export interface RouteFeatureCollection {
  type: "FeatureCollection";
  properties: RouteProperties;
  features: RouteFeature[];
}

// === API Response Types ===

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
