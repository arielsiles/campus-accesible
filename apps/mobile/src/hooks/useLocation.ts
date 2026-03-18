// FR-004: Hook to manage GPS location with permission handling
import { useEffect, useRef } from "react";
import type { LocationSubscription } from "expo-location";
import { useLocationStore } from "../store/locationStore";
import {
  requestLocationPermission,
  checkLocationPermission,
  watchPosition,
} from "../services/locationService";

export function useLocation() {
  const {
    coords,
    permissionStatus,
    loading,
    error,
    setCoords,
    setPermissionStatus,
    setLoading,
    setError,
  } = useLocationStore();

  const subscriptionRef = useRef<LocationSubscription | null>(null);

  // FR-004: Check permission on mount
  useEffect(() => {
    async function checkPermission() {
      const status = await checkLocationPermission();
      setPermissionStatus(status);
    }
    checkPermission();
  }, [setPermissionStatus]);

  // FR-004: Start watching when permission is granted
  useEffect(() => {
    if (permissionStatus !== "granted") return;

    let cancelled = false;

    async function startWatching() {
      try {
        setLoading(true);
        setError(null);
        const subscription = await watchPosition((location) => {
          if (!cancelled) {
            setCoords({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
            });
            setLoading(false);
          }
        });
        if (!cancelled) {
          subscriptionRef.current = subscription;
        } else {
          subscription.remove();
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Error accessing location"
          );
          setLoading(false);
        }
      }
    }

    startWatching();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [permissionStatus, setCoords, setLoading, setError]);

  // FR-004: Request permission function for PermissionRequestModal
  async function requestPermission() {
    const status = await requestLocationPermission();
    setPermissionStatus(status);
  }

  return {
    coords,
    permissionStatus,
    loading,
    error,
    requestPermission,
  };
}
