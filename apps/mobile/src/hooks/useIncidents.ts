// FR-502: Hook for fetching nearby incidents
import { useState, useEffect, useCallback } from "react";
import { useIncidentStore } from "../store/incidentStore";
import { fetchNearbyIncidents } from "../services/incidentService";

/**
 * FR-502: Fetch and manage nearby incidents for map display
 */
export function useIncidents(lat: number | null, lng: number | null, radius: number = 500) {
  const incidents = useIncidentStore((s) => s.incidents);
  const setIncidents = useIncidentStore((s) => s.setIncidents);
  const loading = useIncidentStore((s) => s.loading);
  const setLoading = useIncidentStore((s) => s.setLoading);
  const error = useIncidentStore((s) => s.error);
  const setError = useIncidentStore((s) => s.setError);

  const refresh = useCallback(async () => {
    if (lat === null || lng === null) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchNearbyIncidents(lat, lng, radius);
      setIncidents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar incidencias");
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius, setIncidents, setLoading, setError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { incidents, loading, error, refresh };
}
