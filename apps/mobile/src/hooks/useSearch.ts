// FR-206, FR-802: Search hook with Nominatim geocoding fallback
import { useState, useCallback, useRef } from "react";
import type { SearchResponse, SearchResult } from "@campus-gps/shared-types";
import { searchWaypoints } from "../services/searchService";
import { searchPlaces } from "../services/nominatimService";

const DEBOUNCE_MS = 300;

export function useSearch() {
  const [results, setResults] = useState<SearchResponse>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        // FR-206: Search local waypoints first
        const localResults = await searchWaypoints(query);

        if (localResults.length > 0) {
          setResults(localResults);
        } else {
          // FR-802: Fallback to Nominatim for places not in local data
          const osmResults = await searchPlaces(query);
          const mapped: SearchResult[] = osmResults.map((r) => ({
            waypointId: `osm-${r.latitude.toFixed(6)}-${r.longitude.toFixed(6)}`,
            name: r.name,
            description: r.displayName,
            waypointType: r.type === "park" ? "landmark" : "building",
            coordinates: [r.longitude, r.latitude] as [number, number],
          }));
          setResults(mapped);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResults([]);
    setLoading(false);
  }, []);

  return { results, loading, search, clear };
}
