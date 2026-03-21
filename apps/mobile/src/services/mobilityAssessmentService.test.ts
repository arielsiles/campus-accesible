// FR-401: Mobility assessment service tests
import { describe, it, expect } from "vitest";
import {
  assessSegment,
  assessRoute,
  hasBlockingBarriers,
} from "./mobilityAssessmentService";
import type { SegmentAccessibilityData } from "./mobilityAssessmentService";

const accessibleSegment: SegmentAccessibilityData = {
  segmentId: "seg-1",
  hasRamp: true,
  hasStairs: false,
  pathWidth: 2.5,
  maxSlope: 3.0,
  surfaceQuality: "good",
};

const stairsSegment: SegmentAccessibilityData = {
  segmentId: "seg-stairs",
  hasRamp: false,
  hasStairs: true,
  pathWidth: 1.8,
  maxSlope: 6.5,
  surfaceQuality: "good",
};

const steepNarrowSegment: SegmentAccessibilityData = {
  segmentId: "seg-steep",
  hasRamp: false,
  hasStairs: false,
  pathWidth: 1.2,
  maxSlope: 10.0,
  surfaceQuality: "poor",
};

describe("mobilityAssessmentService [FR-401]", () => {
  it("TST-FR-401-001: detects stairs as blocking barrier", () => {
    const result = assessSegment(stairsSegment);

    expect(result.isAccessible).toBe(false);
    expect(result.barriers).toHaveLength(1);
    expect(result.barriers[0].type).toBe("stairs");
    expect(result.barriers[0].severity).toBe("blocking");
    expect(result.barriers[0].description).toContain("escalones");
  });

  it("TST-FR-401-002: warns about slope exceeding threshold", () => {
    const result = assessSegment(steepNarrowSegment);

    const slopeBarrier = result.barriers.find((b) => b.type === "steep_slope");
    expect(slopeBarrier).toBeDefined();
    expect(slopeBarrier!.severity).toBe("warning");
    expect(slopeBarrier!.description).toContain("10%");
  });

  it("reports accessible segment with no barriers", () => {
    const result = assessSegment(accessibleSegment);

    expect(result.isAccessible).toBe(true);
    expect(result.barriers).toHaveLength(0);
    expect(result.segmentId).toBe("seg-1");
  });

  it("detects narrow path barrier", () => {
    const result = assessSegment(steepNarrowSegment);

    const narrowBarrier = result.barriers.find(
      (b) => b.type === "narrow_path"
    );
    expect(narrowBarrier).toBeDefined();
    expect(narrowBarrier!.description).toContain("1.2m");
  });

  it("detects poor surface quality", () => {
    const result = assessSegment(steepNarrowSegment);

    const surfaceBarrier = result.barriers.find(
      (b) => b.type === "poor_surface"
    );
    expect(surfaceBarrier).toBeDefined();
    expect(surfaceBarrier!.description).toContain("mal estado");
  });

  it("respects custom slope threshold", () => {
    const result = assessSegment(steepNarrowSegment, {
      avoidStairs: true,
      maxSlopePercent: 12,
      minPathWidth: 1.0,
    });

    const slopeBarrier = result.barriers.find((b) => b.type === "steep_slope");
    expect(slopeBarrier).toBeUndefined();
  });

  it("allows stairs when avoidStairs is false", () => {
    const result = assessSegment(stairsSegment, {
      avoidStairs: false,
      maxSlopePercent: 8,
      minPathWidth: 1.5,
    });

    expect(result.isAccessible).toBe(true);
    expect(result.barriers).toHaveLength(0);
  });

  it("assesses multiple segments in a route", () => {
    const assessments = assessRoute([
      accessibleSegment,
      stairsSegment,
      steepNarrowSegment,
    ]);

    expect(assessments).toHaveLength(3);
    expect(assessments[0].isAccessible).toBe(true);
    expect(assessments[1].isAccessible).toBe(false);
  });

  it("detects blocking barriers in route", () => {
    const assessments = assessRoute([accessibleSegment, stairsSegment]);

    expect(hasBlockingBarriers(assessments)).toBe(true);
    expect(
      hasBlockingBarriers(assessRoute([accessibleSegment]))
    ).toBe(false);
  });
});
