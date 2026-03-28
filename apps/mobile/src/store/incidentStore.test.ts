// TST-FR-501: Incident store tests
import { describe, it, expect, beforeEach } from "vitest";
import { useIncidentStore } from "./incidentStore";
import type { IncidentSummary } from "@campus-gps/shared-types";

const mockIncident: IncidentSummary = {
  id: "inc-1",
  type: "obras",
  status: "pending",
  title: "Obras en el camino",
  description: "Hay obras de reparación",
  latitude: 40.4475,
  longitude: -3.7265,
  segmentId: "seg-medicina-odonto",
  createdAt: "2026-03-28T10:00:00Z",
};

beforeEach(() => {
  useIncidentStore.setState({
    incidents: [],
    loading: false,
    error: null,
    selectedIncidentId: null,
  });
});

describe("incidentStore [FR-501]", () => {
  it("has correct initial state [T5.2]", () => {
    const state = useIncidentStore.getState();
    expect(state.incidents).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.selectedIncidentId).toBeNull();
  });

  it("setIncidents replaces incidents list [T5.2]", () => {
    useIncidentStore.getState().setIncidents([mockIncident]);

    const state = useIncidentStore.getState();
    expect(state.incidents).toHaveLength(1);
    expect(state.incidents[0].id).toBe("inc-1");
  });

  it("addIncident prepends to list [T5.2]", () => {
    const existing: IncidentSummary = { ...mockIncident, id: "inc-0" };
    useIncidentStore.getState().setIncidents([existing]);

    useIncidentStore.getState().addIncident(mockIncident);

    const state = useIncidentStore.getState();
    expect(state.incidents).toHaveLength(2);
    expect(state.incidents[0].id).toBe("inc-1"); // prepended
    expect(state.incidents[1].id).toBe("inc-0");
  });

  it("selectIncident sets selected ID [T5.2]", () => {
    useIncidentStore.getState().selectIncident("inc-1");

    expect(useIncidentStore.getState().selectedIncidentId).toBe("inc-1");
  });

  it("selectIncident with null clears selection [T5.2]", () => {
    useIncidentStore.getState().selectIncident("inc-1");
    useIncidentStore.getState().selectIncident(null);

    expect(useIncidentStore.getState().selectedIncidentId).toBeNull();
  });

  it("setError and clearError work correctly [T5.2]", () => {
    useIncidentStore.getState().setError("Network error");
    expect(useIncidentStore.getState().error).toBe("Network error");

    useIncidentStore.getState().clearError();
    expect(useIncidentStore.getState().error).toBeNull();
  });
});
