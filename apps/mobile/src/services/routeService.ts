// FR-005: Route data fetching service
import type {
  RouteListItem,
  RouteFeatureCollection,
} from "@campus-gps/shared-types";
import { apiGet } from "./apiClient";

export async function fetchRoutes(): Promise<RouteListItem[]> {
  return apiGet<RouteListItem[]>("/routes");
}

export async function fetchRoute(
  routeId: string
): Promise<RouteFeatureCollection> {
  return apiGet<RouteFeatureCollection>(`/routes/${routeId}`);
}
