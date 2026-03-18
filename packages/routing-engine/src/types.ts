// FR-202: Internal types for the routing engine

export interface GraphEdgeInput {
  id: string;
  fromWaypointId: string;
  toWaypointId: string;
  distance: number;
  weight: number;
}

export interface GraphNodeInput {
  waypointId: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface PathResult {
  found: boolean;
  path: string[]; // ordered waypointIds from origin to destination
  totalDistance: number; // meters
  totalWeight: number; // total cost
  edges: GraphEdgeInput[]; // edges traversed in order
}
