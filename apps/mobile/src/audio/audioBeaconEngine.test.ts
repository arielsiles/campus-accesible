// FR-301: Audio beacon engine and HRTF processor tests
import { describe, it, expect } from "vitest";
import {
  calculateHRTF,
  calculateRelativeAngle,
  calculateBearing,
} from "./hrtfProcessor";

describe("calculateHRTF [FR-301]", () => {
  it("TST-FR-301-001: centers audio when target is ahead (0°)", () => {
    const result = calculateHRTF(0);
    expect(result.leftGain).toBeCloseTo(0.5, 1);
    expect(result.rightGain).toBeCloseTo(0.5, 1);
    expect(result.volume).toBe(1.0);
    expect(result.isBehind).toBe(false);
  });

  it("pans right when target is at 90° (right)", () => {
    const result = calculateHRTF(90);
    expect(result.rightGain).toBeGreaterThan(result.leftGain);
    expect(result.isBehind).toBe(false);
  });

  it("pans left when target is at -90° (left)", () => {
    const result = calculateHRTF(-90);
    expect(result.leftGain).toBeGreaterThan(result.rightGain);
    expect(result.isBehind).toBe(false);
  });

  it("attenuates volume when target is behind (180°)", () => {
    const result = calculateHRTF(180);
    expect(result.volume).toBeLessThan(0.5);
    expect(result.isBehind).toBe(true);
  });

  it("attenuates volume for 135° (behind-right)", () => {
    const result = calculateHRTF(135);
    expect(result.isBehind).toBe(true);
    expect(result.volume).toBeLessThan(0.5);
  });

  it("handles mono mode for bone conduction (FR-306)", () => {
    const config = { monoMode: true, volumeBoost: 1.2 };
    const result = calculateHRTF(90, config);
    // Mono mode: equal L/R gains
    expect(result.leftGain).toBe(0.5);
    expect(result.rightGain).toBe(0.5);
    expect(result.isBehind).toBe(false);
  });

  it("applies volume boost in mono mode", () => {
    const config = { monoMode: true, volumeBoost: 1.2 };
    const resultFront = calculateHRTF(0, config);
    expect(resultFront.volume).toBeCloseTo(1.0); // Capped at 1.0

    const resultBehind = calculateHRTF(180, config);
    expect(resultBehind.volume).toBeCloseTo(0.48, 1); // 0.4 * 1.2
  });

  it("normalizes angles beyond 360°", () => {
    const result = calculateHRTF(450); // = 90°
    expect(result.rightGain).toBeGreaterThan(result.leftGain);
  });
});

describe("calculateRelativeAngle [FR-301]", () => {
  it("returns 0 when heading matches bearing", () => {
    expect(calculateRelativeAngle(45, 45)).toBe(0);
  });

  it("returns positive for target to the right", () => {
    const result = calculateRelativeAngle(0, 90);
    expect(result).toBe(90);
  });

  it("returns negative for target to the left", () => {
    const result = calculateRelativeAngle(90, 0);
    expect(result).toBe(-90);
  });

  it("handles wrap-around (350° heading, 10° bearing)", () => {
    const result = calculateRelativeAngle(350, 10);
    expect(result).toBe(20);
  });

  it("handles opposite direction", () => {
    const result = calculateRelativeAngle(0, 180);
    // 180° and -180° are equivalent (directly behind)
    expect(Math.abs(result)).toBe(180);
  });
});

describe("calculateBearing [FR-301]", () => {
  it("TST-FR-301-003: returns northward bearing for north target", () => {
    // From CU center to a point directly north
    const bearing = calculateBearing(40.4468, -3.7264, 40.4568, -3.7264);
    // Should be ~0° (North)
    expect(bearing).toBeCloseTo(0, 0);
  });

  it("returns eastward bearing for east target", () => {
    const bearing = calculateBearing(40.4468, -3.7264, 40.4468, -3.7164);
    // Should be ~90° (East)
    expect(bearing).toBeCloseTo(90, 0);
  });

  it("returns southward bearing for south target", () => {
    const bearing = calculateBearing(40.4468, -3.7264, 40.4368, -3.7264);
    // Should be ~180° (South)
    expect(bearing).toBeCloseTo(180, 0);
  });

  it("returns westward bearing for west target", () => {
    const bearing = calculateBearing(40.4468, -3.7264, 40.4468, -3.7364);
    // Should be ~270° (West)
    expect(bearing).toBeCloseTo(270, 0);
  });

  it("returns bearing between 0 and 360", () => {
    const bearing = calculateBearing(40.4468, -3.7264, 40.4500, -3.7300);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });
});
