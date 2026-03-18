// FR-005: Tests for route service
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRoutes, fetchRoute } from "./routeService";

// Mock apiClient
vi.mock("./apiClient", () => ({
  apiGet: vi.fn(),
}));

import { apiGet } from "./apiClient";

const mockApiGet = vi.mocked(apiGet);

describe("routeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchRoutes", () => {
    it("returns route list from /routes [FR-005]", async () => {
      const mockRoutes = [
        { id: "r1", name: "Route 1", description: "Test route" },
      ];
      mockApiGet.mockResolvedValue(mockRoutes);

      const result = await fetchRoutes();

      expect(mockApiGet).toHaveBeenCalledWith("/routes");
      expect(result).toEqual(mockRoutes);
    });

    it("propagates errors from API [FR-005]", async () => {
      mockApiGet.mockRejectedValue(new Error("Network error"));

      await expect(fetchRoutes()).rejects.toThrow("Network error");
    });
  });

  describe("fetchRoute", () => {
    it("returns GeoJSON FeatureCollection from /routes/:id [FR-005]", async () => {
      const mockGeoJSON = {
        type: "FeatureCollection",
        properties: { id: "r1", name: "Route 1", description: "Test" },
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [-3.7264, 40.4468] },
            properties: {
              featureType: "waypoint",
              waypointId: "wp-1",
              name: "Start",
              description: "Start point",
              waypointType: "BUILDING",
              order: 0,
            },
          },
        ],
      };
      mockApiGet.mockResolvedValue(mockGeoJSON);

      const result = await fetchRoute("r1");

      expect(mockApiGet).toHaveBeenCalledWith("/routes/r1");
      expect(result).toEqual(mockGeoJSON);
      expect(result.type).toBe("FeatureCollection");
    });

    it("propagates 404 errors [FR-005]", async () => {
      mockApiGet.mockRejectedValue(new Error("Route 'no-exist' not found"));

      await expect(fetchRoute("no-exist")).rejects.toThrow(
        "Route 'no-exist' not found"
      );
    });
  });
});
