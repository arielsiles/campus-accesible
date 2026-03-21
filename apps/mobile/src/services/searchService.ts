// FR-206: Waypoint search service
import { apiGet } from "./apiClient";
import type { SearchResponse } from "@campus-gps/shared-types";

/**
 * Search waypoints by name (minimum 2 characters).
 * Returns max 10 results, case-insensitive partial match.
 */
export async function searchWaypoints(query: string): Promise<SearchResponse> {
  if (query.length < 2) return [];
  return apiGet<SearchResponse>(
    `/waypoints/search?q=${encodeURIComponent(query)}`
  );
}
