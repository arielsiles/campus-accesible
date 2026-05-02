// FR-005: Hook to fetch route list
import { useEffect, useState } from "react";
import type { RouteListItem } from "@campus-gps/shared-types";
import { fetchRoutes } from "../services/routeService";

interface UseRoutesResult {
  routes: RouteListItem[];
  loading: boolean;
  error: string | null;
}

/**
 * @param refreshKey — bump this number to force a refetch (use after creating a new route)
 */
export function useRoutes(refreshKey: number = 0): UseRoutesResult {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchRoutes();
        if (!cancelled) {
          setRoutes(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error loading routes");
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
  }, [refreshKey]);

  return { routes, loading, error };
}
