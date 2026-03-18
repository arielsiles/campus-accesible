// FR-204, FR-208: Navigation state management
import { create } from "zustand";
import type { CalculatedRoute, NavigationInstruction } from "@campus-gps/shared-types";

interface NavigationState {
  // Route data
  route: CalculatedRoute | null;
  isNavigating: boolean;

  // Current state
  currentInstructionIndex: number;
  progress: number; // 0-100

  // Alerts
  isOffRoute: boolean;
  hasArrived: boolean;

  // Actions
  startNavigation: (route: CalculatedRoute) => void;
  cancelNavigation: () => void;
  setInstructionIndex: (index: number) => void;
  setProgress: (progress: number) => void;
  setOffRoute: (isOffRoute: boolean) => void;
  setArrived: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  route: null,
  isNavigating: false,
  currentInstructionIndex: 0,
  progress: 0,
  isOffRoute: false,
  hasArrived: false,

  startNavigation: (route) =>
    set({
      route,
      isNavigating: true,
      currentInstructionIndex: 0,
      progress: 0,
      isOffRoute: false,
      hasArrived: false,
    }),

  cancelNavigation: () =>
    set({
      route: null,
      isNavigating: false,
      currentInstructionIndex: 0,
      progress: 0,
      isOffRoute: false,
      hasArrived: false,
    }),

  setInstructionIndex: (index) => set({ currentInstructionIndex: index }),
  setProgress: (progress) => set({ progress }),
  setOffRoute: (isOffRoute) => set({ isOffRoute }),
  setArrived: () => set({ hasArrived: true, isNavigating: false, progress: 100 }),
}));
