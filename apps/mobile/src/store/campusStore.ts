// FR-902: Campus selection state management
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet } from "../services/apiClient";

const SELECTED_CAMPUS_KEY = "@campus-gps/selected-campus";

export interface CampusSummary {
  id: string;
  name: string;
  description: string;
  centerLng: number;
  centerLat: number;
  boundingBox: { minLng: number; minLat: number; maxLng: number; maxLat: number };
  imageUrl: string | null;
  routeCount: number;
}

interface CampusState {
  campuses: CampusSummary[];
  selectedCampus: CampusSummary | null;
  isLoading: boolean;

  // Actions
  fetchCampuses: () => Promise<void>;
  selectCampus: (campus: CampusSummary) => Promise<void>;
  restoreSelection: () => Promise<void>;
}

export const useCampusStore = create<CampusState>((set) => ({
  campuses: [],
  selectedCampus: null,
  isLoading: false,

  fetchCampuses: async () => {
    set({ isLoading: true });
    try {
      const campuses = await apiGet<CampusSummary[]>("/campuses");
      set({ campuses, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  selectCampus: async (campus: CampusSummary) => {
    await AsyncStorage.setItem(SELECTED_CAMPUS_KEY, JSON.stringify(campus));
    set({ selectedCampus: campus });
  },

  restoreSelection: async () => {
    try {
      const json = await AsyncStorage.getItem(SELECTED_CAMPUS_KEY);
      if (json) {
        set({ selectedCampus: JSON.parse(json) as CampusSummary });
      }
    } catch {
      // ignore
    }
  },
}));
