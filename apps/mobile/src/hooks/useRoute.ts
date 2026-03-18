// FR-005: Hook to fetch a single route as GeoJSON
import { useEffect, useState } from "react";
import type { RouteFeatureCollection } from "@campus-gps/shared-types";
import { fetchRoute } from "../services/routeService";

interface UseRouteResult {
  route: RouteFeatureCollection | null;
  loading: boolean;
  error: string | null;
}

export function useRoute(routeId: string | null): UseRouteResult {
  const [route, setRoute] = useState<RouteFeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeId) {
      setRoute(null);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchRoute(routeId!);
        if (!cancelled) {
          setRoute(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error loading route");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  return { route, loading, error };
}
