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

export interface CalculatedRoute {
  origin: WaypointSummary;
  destination: WaypointSummary;
  totalDistance: number; // meters
  estimatedTime: number; // seconds (assuming 4 km/h)
  waypoints: WaypointSummary[];
  instructions: NavigationInstruction[];
  geojson: RouteFeatureCollection;
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
