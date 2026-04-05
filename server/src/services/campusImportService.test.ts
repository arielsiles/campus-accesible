// TST-FR-603: Campus import validation tests
import { describe, it, expect } from "vitest";
import { validateBundle } from "./campusImportService";

describe("validateBundle [FR-603]", () => {
  it("rejects null input [TST-FR-603-001]", () => {
    const errors = validateBundle(null);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("JSON object");
  });

  it("rejects missing campus object [TST-FR-603-001]", () => {
    const errors = validateBundle({ routes: [] });
    expect(errors.some((e) => e.message.includes("campus"))).toBe(true);
  });

  it("rejects missing routes array [TST-FR-603-001]", () => {
    const errors = validateBundle({ campus: { name: "Test" } });
    expect(errors.some((e) => e.message.includes("routes"))).toBe(true);
  });

  it("rejects route with less than 2 waypoints [TST-FR-603-002]", () => {
    const bundle = {
      campus: { name: "Test", center: [0, 0] },
      routes: [
        {
          properties: { name: "R1", description: "" },
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [0, 0] },
              properties: { featureType: "waypoint", waypointId: "w1", name: "W1" },
            },
          ],
        },
      ],
    };
    const errors = validateBundle(bundle);
    expect(errors.some((e) => e.message.includes("at least 2 waypoints"))).toBe(true);
  });

  it("rejects invalid waypointType [TST-FR-603-003]", () => {
    const bundle = {
      campus: { name: "Test" },
      routes: [
        {
          properties: { name: "R1" },
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [0, 0] },
              properties: { featureType: "waypoint", waypointId: "w1", name: "W1", waypointType: "invalid" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [1, 1] },
              properties: { featureType: "waypoint", waypointId: "w2", name: "W2", waypointType: "building" },
            },
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
              properties: { featureType: "route-segment", segmentId: "s1" },
            },
          ],
        },
      ],
    };
    const errors = validateBundle(bundle);
    expect(errors.some((e) => e.message.includes("Invalid waypointType"))).toBe(true);
  });

  it("accepts valid bundle [TST-FR-603-004]", () => {
    const bundle = {
      campus: { name: "Test Campus", center: [-3.72, 40.44] },
      routes: [
        {
          properties: { name: "Test Route", description: "A test" },
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [-3.72, 40.44] },
              properties: { featureType: "waypoint", waypointId: "wp-1", name: "Start", waypointType: "entrance" },
            },
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [-3.73, 40.45] },
              properties: { featureType: "waypoint", waypointId: "wp-2", name: "End", waypointType: "building" },
            },
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: [[-3.72, 40.44], [-3.73, 40.45]] },
              properties: { featureType: "route-segment", segmentId: "seg-1", surfaceType: "paved", riskLevel: "none" },
            },
          ],
        },
      ],
    };
    const errors = validateBundle(bundle);
    expect(errors).toHaveLength(0);
  });
});
