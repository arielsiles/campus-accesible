// FR-003: Map state management
import { create } from "zustand";

interface MapState {
  center: [number, number];
  zoom: number;
  selectedRouteId: string | null;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  selectRoute: (routeId: string | null) => void;
}

// FR-003: Default center on Ciudad Universitaria (lat: 40.4468, lng: -3.7264)
const CU_CENTER: [number, number] = [-3.7264, 40.4468];
const DEFAULT_ZOOM = 15;

export const useMapStore = create<MapState>((set) => ({
  center: CU_CENTER,
  zoom: DEFAULT_ZOOM,
  selectedRouteId: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  selectRoute: (routeId) => set({ selectedRouteId: routeId }),
}));

export { CU_CENTER, DEFAULT_ZOOM };
