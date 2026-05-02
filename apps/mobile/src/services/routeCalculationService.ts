// FR-208, FR-1401: Client service for route calculation API
import { apiPost } from "./apiClient";
import type {
  RouteCalculationResponse,
  CalculatedRoute,
} from "@campus-gps/shared-types";

interface CalculateRouteOptions {
  /** Optional GPS origin (instead of waypointId) */
  fromLat?: number;
  fromLng?: number;
  /** Optional GPS destination (instead of waypointId) */
  toLat?: number;
  toLng?: number;
  toName?: string;
  /** Accessibility profile */
  profile?: string;
}

/**
 * FR-1401, FR-1402: Calculate a route. Either origin/destination waypoints
 * or arbitrary GPS coords (or a mix) can be passed. The server resolves
 * GPS to nearest registered waypoint and adds approach legs as needed.
 */
export async function calculateRoute(
  originWaypointId: string | null,
  destinationWaypointId: string | null,
  options: CalculateRouteOptions = {}
): Promise<CalculatedRoute> {
  const body: Record<string, unknown> = {};
  if (originWaypointId) body.origin = originWaypointId;
  if (destinationWaypointId) body.destination = destinationWaypointId;
  if (options.fromLat != null) body.fromLat = options.fromLat;
  if (options.fromLng != null) body.fromLng = options.fromLng;
  if (options.toLat != null) body.toLat = options.toLat;
  if (options.toLng != null) body.toLng = options.toLng;
  if (options.toName) body.toName = options.toName;
  if (options.profile) body.profile = options.profile;

  const response = await apiPost<RouteCalculationResponse>(
    "/routes/calculate",
    body
  );
  return response.route;
}
