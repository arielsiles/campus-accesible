// FR-203: Hook to snap GPS position to active route
import { useMemo } from "react";
import { snapToRoute, type SnapResult } from "../services/snapToRouteService";
import type { RouteFeatureCollection } from "@campus-gps/shared-types";

/**
 * Extract segment coordinates from a GeoJSON route FeatureCollection
 */
function extractSegments(
  routeData: RouteFeatureCollection
): [number, number][][] {
  return routeData.features
    .filter((f) => f.geometry.type === "LineString")
    .map((f) => f.geometry.coordinates as [number, number][]);
}

/**
 * Hook that snaps GPS position to the nearest point on the route.
 * Returns null when no route is active.
 */
export function useSnapToRoute(
  gpsPosition: [number, number] | null,
  routeData: RouteFeatureCollection | null
): SnapResult | null {
  const segments = useMemo(
    () => (routeData ? extractSegments(routeData) : []),
    [routeData]
  );

  return useMemo(() => {
    if (!gpsPosition || segments.length === 0) return null;
    return snapToRoute(gpsPosition, segments);
  }, [gpsPosition, segments]);
}
