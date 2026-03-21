// @campus-gps/shared-types
// FR-006: Shared TypeScript interfaces, enums, and API types

export {
  WaypointType,
  SurfaceType,
  RiskLevel,
} from "./geojson";

export type {
  RouteProperties,
  WaypointProperties,
  RouteSegmentProperties,
  RouteSegmentFeature,
  WaypointFeature,
  RouteFeature,
  RouteFeatureCollection,
  RouteListItem,
  HealthResponse,
  ErrorResponse,
} from "./geojson";

// FR-201: Graph types
export type {
  GraphNode,
  GraphEdgeSummary,
  GraphData,
  WeightFactors,
} from "./graph";
export { DEFAULT_WEIGHT_FACTORS } from "./graph";

// FR-205: Transport types
export type { TransportInfo } from "./transport";
export { TransportType } from "./transport";

// FR-204, FR-207: Navigation types
export type {
  RouteCalculationRequest,
  WaypointSummary,
  NavigationInstruction,
  CalculatedRoute,
  RouteCalculationResponse,
  SearchResult,
  SearchResponse,
} from "./navigation";
