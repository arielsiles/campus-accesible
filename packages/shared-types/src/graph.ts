// FR-201: Route graph model types for pathfinding

import type { WaypointType } from "./geojson";

export interface GraphNode {
  waypointId: string;
  name: string;
  waypointType: WaypointType;
  coordinates: [number, number]; // [lng, lat]
  edges: GraphEdgeSummary[];
}

export interface GraphEdgeSummary {
  id: string;
  fromWaypointId: string;
  toWaypointId: string;
  segmentId: string | null;
  distance: number; // meters
  weight: number; // calculated cost
  bidirectional: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdgeSummary[];
}

// Weight calculation factors
export interface WeightFactors {
  elevationPenalty: number; // multiplier per meter of elevation change
  riskPenalty: Record<string, number>; // multiplier by risk level
}

export const DEFAULT_WEIGHT_FACTORS: WeightFactors = {
  elevationPenalty: 1.5, // 1.5x per meter of elevation
  riskPenalty: {
    none: 1.0,
    low: 1.2,
    medium: 1.5,
    high: 2.0,
  },
};
