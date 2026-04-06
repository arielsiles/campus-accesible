// TST-FR-705: Route creation service validation tests
import { describe, it, expect } from "vitest";
import { validateRouteData } from "./routeCreationService";

describe("validateRouteData [FR-705]", () => {
  it("rejects null input [TST-FR-705-003]", () => {
    const errors = validateRouteData(null);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects non-FeatureCollection [TST-FR-705-003]", () => {
    const errors = validateRouteData({ type: "Feature" });
    expect(errors.some((e) => e.message.includes("FeatureCollection"))).toBe(true);
  });

  it("rejects missing route name [TST-FR-705-003]", () => {
    const errors = validateRouteData({
      type: "FeatureCollection",
      properties: {},
      features: [],
    });
    expect(errors.some((e) => e.field.includes("name"))).toBe(true);
  });

  it("rejects < 2 waypoints [TST-FR-705-003]", () => {
    const errors = validateRouteData({
      type: "FeatureCollection",
      properties: { name: "Test" },
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { featureType: "waypoint", waypointId: "w1", name: "W1" },
        },
      ],
    });
    expect(errors.some((e) => e.message.includes("2 waypoints"))).toBe(true);
  });

  it("rejects 0 segments [TST-FR-705-003]", () => {
    const errors = validateRouteData({
      type: "FeatureCollection",
      properties: { name: "Test" },
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { featureType: "waypoint", waypointId: "w1", name: "W1" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [1, 1] },
          properties: { featureType: "waypoint", waypointId: "w2", name: "W2" },
        },
      ],
    });
    expect(errors.some((e) => e.message.includes("1 segment"))).toBe(true);
  });

  it("accepts valid route data [FR-705]", () => {
    const errors = validateRouteData({
      type: "FeatureCollection",
      properties: { name: "Test Route", description: "A test" },
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-3.72, 40.44] },
          properties: { featureType: "waypoint", waypointId: "wp-1", name: "Start" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-3.73, 40.45] },
          properties: { featureType: "waypoint", waypointId: "wp-2", name: "End" },
        },
        {
          type: "Feature",
          geometry: { type: "LineString", coordinates: [[-3.72, 40.44], [-3.73, 40.45]] },
          properties: { featureType: "route-segment", segmentId: "seg-1" },
        },
      ],
    });
    expect(errors).toHaveLength(0);
  });
});
