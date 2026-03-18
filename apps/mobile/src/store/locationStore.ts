// FR-004: GPS location state management
import { create } from "zustand";

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

type PermissionStatus = "undetermined" | "granted" | "denied";

interface LocationState {
  coords: LocationCoords | null;
  permissionStatus: PermissionStatus;
  loading: boolean;
  error: string | null;
  setCoords: (coords: LocationCoords | null) => void;
  setPermissionStatus: (status: PermissionStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  permissionStatus: "undetermined",
  loading: false,
  error: null,
  setCoords: (coords) => set({ coords }),
  setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
