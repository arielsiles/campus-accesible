// FR-204: Navigation management hook
import { useCallback } from "react";
import { useNavigationStore } from "../store/navigationStore";
import {
  getCurrentInstructionIndex,
  calculateProgress,
  detectArrival,
} from "../services/navigationService";
import type { CalculatedRoute } from "@campus-gps/shared-types";

export function useNavigation() {
  const route = useNavigationStore((s) => s.route);
  const isNavigating = useNavigationStore((s) => s.isNavigating);
  const currentInstructionIndex = useNavigationStore(
    (s) => s.currentInstructionIndex
  );
  const progress = useNavigationStore((s) => s.progress);
  const isOffRoute = useNavigationStore((s) => s.isOffRoute);
  const hasArrived = useNavigationStore((s) => s.hasArrived);

  const currentInstruction = route?.instructions[currentInstructionIndex] ?? null;
  const nextWaypoint =
    route?.waypoints[currentInstructionIndex + 1] ?? null;

  const start = useCallback((calculatedRoute: CalculatedRoute) => {
    useNavigationStore.getState().startNavigation(calculatedRoute);
  }, []);

  const cancel = useCallback(() => {
    useNavigationStore.getState().cancelNavigation();
  }, []);

  /**
   * Update navigation state based on GPS position.
   * Call this on each GPS update during active navigation.
   */
  const updatePosition = useCallback(
    (gpsPosition: [number, number]) => {
      if (!route || !isNavigating) return;

      const store = useNavigationStore.getState();

      // Check arrival
      const destination = route.waypoints[route.waypoints.length - 1];
      if (detectArrival(gpsPosition, destination)) {
        store.setArrived();
        return;
      }

      // Update instruction index
      const newIndex = getCurrentInstructionIndex(
        gpsPosition,
        route.waypoints,
        store.currentInstructionIndex
      );

      if (newIndex !== store.currentInstructionIndex) {
        store.setInstructionIndex(newIndex);
      }

      // Update progress
      const newProgress = calculateProgress(
        newIndex,
        route.instructions.length
      );
      store.setProgress(newProgress);
    },
    [route, isNavigating]
  );

  return {
    route,
    isNavigating,
    currentInstruction,
    currentInstructionIndex,
    nextWaypoint,
    progress,
    isOffRoute,
    hasArrived,
    start,
    cancel,
    updatePosition,
  };
}
