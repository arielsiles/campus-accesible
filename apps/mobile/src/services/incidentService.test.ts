// TST-FR-502: Incident service tests
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock apiClient
vi.mock("./apiClient", () => ({
  apiPost: vi.fn(),
  apiGet: vi.fn(),
}));

import { apiPost, apiGet } from "./apiClient";
import {
  reportIncident,
  fetchIncidents,
  fetchNearbyIncidents,
  fetchIncidentDetail,
} from "./incidentService";

const mockApiPost = vi.mocked(apiPost);
const mockApiGet = vi.mocked(apiGet);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("reportIncident [FR-502]", () => {
  it("posts to /incidents with correct data [T5.2]", async () => {
    const incidentData = {
      deviceId: "test-device",
      type: "obras" as const,
      title: "Test incident",
      description: "Test description for incident",
      latitude: 40.4475,
      longitude: -3.7265,
    };

    mockApiPost.mockResolvedValue({
      incident: { ...incidentData, id: "inc-1", status: "pending", createdAt: "2026-03-28" },
    });

    const result = await reportIncident(incidentData);

    expect(mockApiPost).toHaveBeenCalledWith("/incidents", incidentData);
    expect(result.id).toBe("inc-1");
  });
});

describe("fetchIncidents [FR-501]", () => {
  it("fetches from /incidents with no filters [T5.2]", async () => {
    mockApiGet.mockResolvedValue({ incidents: [], total: 0 });

    const result = await fetchIncidents();

    expect(mockApiGet).toHaveBeenCalledWith("/incidents");
    expect(result.incidents).toEqual([]);
  });

  it("includes filters in query params [T5.2]", async () => {
    mockApiGet.mockResolvedValue({ incidents: [], total: 0 });

    await fetchIncidents({ status: "validated", limit: 10 });

    expect(mockApiGet).toHaveBeenCalledWith(
      expect.stringContaining("status=validated")
    );
    expect(mockApiGet).toHaveBeenCalledWith(
      expect.stringContaining("limit=10")
    );
  });
});

describe("fetchNearbyIncidents [FR-502]", () => {
  it("fetches from /incidents/near with coordinates [T5.2]", async () => {
    mockApiGet.mockResolvedValue({ incidents: [] });

    const result = await fetchNearbyIncidents(40.4475, -3.7265, 300);

    expect(mockApiGet).toHaveBeenCalledWith(
      "/incidents/near?lat=40.4475&lng=-3.7265&radius=300"
    );
    expect(result).toEqual([]);
  });
});

describe("fetchIncidentDetail [FR-501]", () => {
  it("fetches incident by ID [T5.2]", async () => {
    mockApiGet.mockResolvedValue({
      incident: { id: "inc-1", title: "Test" },
    });

    const result = await fetchIncidentDetail("inc-1");

    expect(mockApiGet).toHaveBeenCalledWith("/incidents/inc-1");
    expect(result.id).toBe("inc-1");
  });
});
