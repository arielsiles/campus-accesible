// FR-206: Search hook for waypoint destination search
import { useState, useCallback, useRef } from "react";
import type { SearchResponse } from "@campus-gps/shared-types";
import { searchWaypoints } from "../services/searchService";

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
        const data = await searchWaypoints(query);
        setResults(data);
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
