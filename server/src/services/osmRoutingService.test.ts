// FR-1405: OSM weight mapping tests
import { describe, it, expect } from "vitest";
import { mapOsmToWeight } from "./osmRoutingService";

describe("mapOsmToWeight [FR-1405]", () => {
  it("returns base distance for plain footway", () => {
    expect(mapOsmToWeight({}, 100, "standard")).toBe(100);
  });

  it("blocks stairs hard for reduced_mobility", () => {
    const w = mapOsmToWeight({ highway: "steps" }, 100, "reduced_mobility");
    expect(w).toBeGreaterThan(100 * 50);
  });

  it("doubles weight for stairs in visual_disability", () => {
    expect(mapOsmToWeight({ highway: "steps" }, 100, "visual_disability")).toBe(200);
  });

  it("penalizes cobblestone for visual_disability", () => {
    const w = mapOsmToWeight({ surface: "cobblestone" }, 100, "visual_disability");
    expect(w).toBeGreaterThan(100);
    expect(w).toBeLessThan(200);
  });

  it("rewards tactile paving for visual_disability", () => {
    const w = mapOsmToWeight({ tactile_paving: "yes" }, 100, "visual_disability");
    expect(w).toBeLessThan(100);
  });

  it("penalizes gravel heavily for reduced_mobility", () => {
    expect(
      mapOsmToWeight({ surface: "gravel" }, 100, "reduced_mobility")
    ).toBe(200);
  });

  it("penalizes wheelchair=no for reduced_mobility", () => {
    expect(
      mapOsmToWeight({ wheelchair: "no" }, 100, "reduced_mobility")
    ).toBeGreaterThan(100 * 25);
  });

  it("scales incline impact for reduced_mobility", () => {
    const flat = mapOsmToWeight({}, 100, "reduced_mobility");
    const slope = mapOsmToWeight({ incline: "10%" }, 100, "reduced_mobility");
    expect(slope).toBeGreaterThan(flat);
  });
});
