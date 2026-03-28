// FR-501, FR-502: Incident state management
import { create } from "zustand";
import type { IncidentSummary } from "@campus-gps/shared-types";

interface IncidentState {
  // Data
  incidents: IncidentSummary[];
  loading: boolean;
  error: string | null;
  selectedIncidentId: string | null;

  // Actions
  setIncidents: (incidents: IncidentSummary[]) => void;
  addIncident: (incident: IncidentSummary) => void;
  selectIncident: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useIncidentStore = create<IncidentState>((set) => ({
  incidents: [],
  loading: false,
  error: null,
  selectedIncidentId: null,

  setIncidents: (incidents) => set({ incidents }),
  addIncident: (incident) =>
    set((state) => ({ incidents: [incident, ...state.incidents] })),
  selectIncident: (id) => set({ selectedIncidentId: id }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
