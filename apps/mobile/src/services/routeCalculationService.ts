// FR-208: Client service for route calculation API
import { apiPost } from "./apiClient";
import type {
  RouteCalculationResponse,
  CalculatedRoute,
} from "@campus-gps/shared-types";

export async function calculateRoute(
  originWaypointId: string,
  destinationWaypointId: string
): Promise<CalculatedRoute> {
  const response = await apiPost<RouteCalculationResponse>(
    "/routes/calculate",
    {
      origin: originWaypointId,
      destination: destinationWaypointId,
    }
  );
  return response.route;
}
