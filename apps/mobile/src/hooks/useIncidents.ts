// FR-502, FR-601: Hook for fetching nearby incidents with coordinate debouncing
import { useState, useEffect, useCallback, useRef } from "react";
import { useIncidentStore } from "../store/incidentStore";
import { fetchNearbyIncidents } from "../services/incidentService";

// FR-601: Only refetch if position changed by more than 50m
const MIN_MOVE_THRESHOLD_DEG = 0.0005; // ~50m at Madrid latitude
const DEBOUNCE_MS = 3000; // 3 seconds between fetches

/**
 * FR-502, FR-601: Fetch nearby incidents with position debouncing
 */
export function useIncidents(lat: number | null, lng: number | null, radius: number = 500) {
  const incidents = useIncidentStore((s) => s.incidents);
  const setIncidents = useIncidentStore((s) => s.setIncidents);
  const loading = useIncidentStore((s) => s.loading);
  const setLoading = useIncidentStore((s) => s.setLoading);
  const error = useIncidentStore((s) => s.error);
  const setError = useIncidentStore((s) => s.setError);

  const lastFetchCoords = useRef<{ lat: number; lng: number } | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (lat === null || lng === null) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchNearbyIncidents(lat, lng, radius);
      setIncidents(result);
      lastFetchCoords.current = { lat, lng };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar incidencias");
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius, setIncidents, setLoading, setError]);

  useEffect(() => {
    if (lat === null || lng === null) return;

    // FR-601: Skip if position hasn't moved significantly
    if (lastFetchCoords.current) {
      const dLat = Math.abs(lat - lastFetchCoords.current.lat);
      const dLng = Math.abs(lng - lastFetchCoords.current.lng);
      if (dLat < MIN_MOVE_THRESHOLD_DEG && dLng < MIN_MOVE_THRESHOLD_DEG) {
        return;
      }
    }

    // FR-601: Debounce to avoid rapid-fire requests
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      refresh();
    }, lastFetchCoords.current ? DEBOUNCE_MS : 0); // Immediate on first load

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [lat, lng, refresh]);

  return { incidents, loading, error, refresh };
}
