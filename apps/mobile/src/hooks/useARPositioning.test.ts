// FR-1302: AR positioning tests
import { describe, it, expect } from "vitest";
import {
  bearingBetween,
  haversineMeters,
  normalizeAngleDiff,
  positionMarker,
} from "./useARPositioning";

describe("bearingBetween [FR-1302]", () => {
  it("0 degrees for due north", () => {
    expect(bearingBetween(40, -3, 41, -3)).toBeCloseTo(0, 1);
  });
  it("near 90 degrees for due east", () => {
    // Great-circle bearing slightly different from 90 at non-equator latitudes
    expect(bearingBetween(40, -3, 40, -2)).toBeGreaterThan(89);
    expect(bearingBetween(40, -3, 40, -2)).toBeLessThan(91);
  });
  it("180 degrees for due south", () => {
    expect(bearingBetween(41, -3, 40, -3)).toBeCloseTo(180, 1);
  });
  it("near 270 degrees for due west", () => {
    expect(bearingBetween(40, -3, 40, -4)).toBeGreaterThan(269);
    expect(bearingBetween(40, -3, 40, -4)).toBeLessThan(271);
  });
});

describe("haversineMeters [FR-1302]", () => {
  it("returns 0 for identical points", () => {
    expect(haversineMeters(40, -3, 40, -3)).toBe(0);
  });
  it("returns ~111km for 1 degree of latitude", () => {
    expect(haversineMeters(40, -3, 41, -3)).toBeGreaterThan(110_000);
    expect(haversineMeters(40, -3, 41, -3)).toBeLessThan(112_000);
  });
});

describe("normalizeAngleDiff [FR-1302]", () => {
  it("keeps small diffs unchanged", () => {
    expect(normalizeAngleDiff(45)).toBe(45);
    expect(normalizeAngleDiff(-45)).toBe(-45);
  });
  it("wraps angles greater than 180", () => {
    expect(normalizeAngleDiff(270)).toBe(-90);
    expect(normalizeAngleDiff(350)).toBe(-10);
  });
  it("wraps angles less than -180", () => {
    expect(normalizeAngleDiff(-270)).toBe(90);
  });
});

describe("positionMarker [FR-1302]", () => {
  const marker = {
    id: "m1",
    latitude: 40.001,
    longitude: -3,
    data: { name: "test" },
  };

  it("marker straight ahead is centered (screenX ~0.5)", () => {
    // user heading 0 (north), marker is north
    const result = positionMarker(marker, 40, -3, 0);
    expect(result.inFov).toBe(true);
    expect(result.screenX).toBeCloseTo(0.5, 1);
  });

  it("marker right of heading appears on right (screenX > 0.5)", () => {
    // user heading 350 (NNW), marker due north → marker is 10° to the right
    const result = positionMarker(marker, 40, -3, 350);
    expect(result.inFov).toBe(true);
    expect(result.screenX).toBeGreaterThan(0.5);
  });

  it("marker left of heading appears on left (screenX < 0.5)", () => {
    // user heading 10 (NNE), marker due north → marker is 10° to the left
    const result = positionMarker(marker, 40, -3, 10);
    expect(result.inFov).toBe(true);
    expect(result.screenX).toBeLessThan(0.5);
  });

  it("marker behind user is out of FOV", () => {
    // user heading 180 (south), marker north
    const result = positionMarker(marker, 40, -3, 180);
    expect(result.inFov).toBe(false);
  });

  it("closer marker has bigger size", () => {
    const close = positionMarker(
      { id: "a", latitude: 40.0001, longitude: -3, data: {} },
      40,
      -3,
      0
    );
    const far = positionMarker(
      { id: "b", latitude: 40.005, longitude: -3, data: {} },
      40,
      -3,
      0
    );
    expect(close.size).toBeGreaterThan(far.size);
  });

  it("closer marker has higher opacity", () => {
    const close = positionMarker(
      { id: "a", latitude: 40.0001, longitude: -3, data: {} },
      40,
      -3,
      0
    );
    const far = positionMarker(
      { id: "b", latitude: 40.005, longitude: -3, data: {} },
      40,
      -3,
      0
    );
    expect(close.opacity).toBeGreaterThan(far.opacity);
  });
});
