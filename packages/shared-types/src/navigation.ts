// FR-204, FR-207: Navigation and route calculation types

import type { WaypointType, RouteFeatureCollection } from "./geojson";
import type { TransportInfo } from "./transport";

// === Route Calculation ===

export interface RouteCalculationRequest {
  origin: string; // waypointId
  destination: string; // waypointId
}

export interface WaypointSummary {
  waypointId: string;
  name: string;
  waypointType: WaypointType;
  coordinates: [number, number]; // [lng, lat]
  transportInfo?: TransportInfo;
}

export interface NavigationInstruction {
  action:
    | "start"
    | "continue"
    | "turn_left"
    | "turn_right"
    | "slight_left"
    | "slight_right"
    | "arrive";
  distance: number; // meters to next waypoint
  waypointName: string; // destination waypoint name
  waypointType: WaypointType;
  description: string; // human-readable instruction in Spanish
  bearing: number; // degrees 0-360
}

// FR-1406: Approach leg — straight-line walk between user GPS and the
// nearest graph node (or between graph node and arbitrary destination).
// Rendered as a dashed line in the UI to differentiate from mapped segments.
export interface ApproachLeg {
  position: "start" | "end";
  fromCoords: [number, number]; // [lng, lat]
  toCoords: [number, number]; // [lng, lat]
  distanceM: number;
  bearingDeg: number;
  /** Spanish instruction shown in turn-by-turn ("Avanza 80m al norte hacia el inicio") */
  instructionText: string;
}

// FR-1404, FR-1407: Source of the route data
export type RouteSource = "graph" | "osm" | "hybrid";

export interface CalculatedRoute {
  origin: WaypointSummary;
  destination: WaypointSummary;
  totalDistance: number; // meters
  estimatedTime: number; // seconds (assuming 4 km/h)
  waypoints: WaypointSummary[];
  instructions: NavigationInstruction[];
  geojson: RouteFeatureCollection;

  // FR-1406: Optional approach legs at start and/or end
  approachLegs?: ApproachLeg[];

  // FR-1404, FR-1407: Where this route came from
  source?: RouteSource;
}

export interface RouteCalculationResponse {
  route: CalculatedRoute;
}

// === Search ===

export interface SearchResult {
  waypointId: string;
  name: string;
  description: string;
  waypointType: WaypointType;
  coordinates: [number, number];
  transportInfo?: TransportInfo;
}

export type SearchResponse = SearchResult[];
