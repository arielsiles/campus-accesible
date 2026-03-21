// FR-405: Profile weight tests
import { describe, it, expect } from "vitest";
import {
  calculateProfileMultiplier,
  applyProfileWeight,
  getProfileWeights,
} from "./profileWeights";
import type { SegmentData } from "./profileWeights";

const accessibleSegment: SegmentData = {
  hasStairs: false,
  maxSlope: 3.0,
  pathWidth: 2.5,
  surfaceQuality: "good",
  surfaceType: "paved",
  riskLevel: "none",
};

const stairsSegment: SegmentData = {
  hasStairs: true,
  maxSlope: 6.5,
  pathWidth: 1.8,
  surfaceQuality: "good",
  surfaceType: "paved",
  riskLevel: "medium",
};

const narrowSteepSegment: SegmentData = {
  hasStairs: false,
  maxSlope: 10.0,
  pathWidth: 1.2,
  surfaceQuality: "poor",
  surfaceType: "gravel",
  riskLevel: "medium",
};

const tactileSegment: SegmentData = {
  hasStairs: false,
  maxSlope: 0.0,
  pathWidth: 2.0,
  surfaceQuality: "good",
  surfaceType: "tactile",
  riskLevel: "none",
};

describe("profileWeights [FR-405]", () => {
  it("TST-FR-405-001: penalizes stairs x10 for reduced_mobility", () => {
    const multiplier = calculateProfileMultiplier(
      { ...accessibleSegment, hasStairs: true },
      "reduced_mobility"
    );

    // Should include x10 stairs penalty
    expect(multiplier).toBeGreaterThanOrEqual(10);
  });

  it("no penalty for standard profile on accessible segment", () => {
    const multiplier = calculateProfileMultiplier(
      accessibleSegment,
      "standard"
    );
    expect(multiplier).toBe(1.0);
  });

  it("TST-FR-405-002: generates different weights for different profiles", () => {
    const baseWeight = 100;

    const standardWeight = applyProfileWeight(
      baseWeight,
      stairsSegment,
      "standard"
    );
    const mobilityWeight = applyProfileWeight(
      baseWeight,
      stairsSegment,
      "reduced_mobility"
    );

    // Reduced mobility should be significantly heavier due to stairs
    expect(mobilityWeight).toBeGreaterThan(standardWeight);
    expect(mobilityWeight).toBeGreaterThan(baseWeight * 5);
  });

  it("applies narrow path penalty for reduced_mobility", () => {
    const multiplier = calculateProfileMultiplier(
      narrowSteepSegment,
      "reduced_mobility"
    );

    // Should include narrow path (x5) + poor surface (x3) + slope + risk
    expect(multiplier).toBeGreaterThan(10);
  });

  it("applies tactile bonification for visual_disability", () => {
    const multiplier = calculateProfileMultiplier(
      tactileSegment,
      "visual_disability"
    );

    // Tactile paving should give bonus (multiplier < 1)
    expect(multiplier).toBeLessThan(1.0);
  });

  it("applies risk penalty per profile", () => {
    const highRiskSegment: SegmentData = {
      ...accessibleSegment,
      riskLevel: "high",
    };

    const visualMultiplier = calculateProfileMultiplier(
      highRiskSegment,
      "visual_disability"
    );
    const standardMultiplier = calculateProfileMultiplier(
      highRiskSegment,
      "standard"
    );

    // Visual disability should penalize high risk more (3.0 vs 2.0)
    expect(visualMultiplier).toBeGreaterThan(standardMultiplier);
  });

  it("getProfileWeights returns valid config for all profiles", () => {
    const profiles = [
      "standard",
      "visual_disability",
      "reduced_mobility",
      "deaf",
      "easy_read",
    ] as const;

    for (const profile of profiles) {
      const config = getProfileWeights(profile);
      expect(config.stairsPenalty).toBeGreaterThanOrEqual(1);
      expect(config.riskPenalty).toHaveProperty("none");
      expect(config.riskPenalty).toHaveProperty("high");
    }
  });

  it("deaf and easy_read use standard-like weights", () => {
    const deafMultiplier = calculateProfileMultiplier(
      stairsSegment,
      "deaf"
    );
    const standardMultiplier = calculateProfileMultiplier(
      stairsSegment,
      "standard"
    );

    expect(deafMultiplier).toBe(standardMultiplier);
  });
});
