// FR-403: Haptic navigation service tests
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock expo-haptics
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: "LIGHT",
    Medium: "MEDIUM",
    Heavy: "HEAVY",
  },
}));

import {
  vibrateForAction,
  vibrateAlert,
  setEnabled,
  getIsEnabled,
  hapticNavigationService,
} from "./hapticNavigationService";
import {
  actionToPattern,
  getPatternDuration,
  HAPTIC_PATTERNS,
  HAPTIC_PATTERN_LABELS,
} from "./hapticPatterns";
import * as Haptics from "expo-haptics";

beforeEach(() => {
  vi.clearAllMocks();
  setEnabled(true);
});

describe("hapticPatterns [FR-403]", () => {
  it("TST-FR-403-001: maps turn_left action to correct pattern", () => {
    const pattern = actionToPattern("turn_left");
    expect(pattern).toBe("turn_left");

    // turn_left has 2 impact steps (2 short pulses)
    const steps = HAPTIC_PATTERNS.turn_left;
    const impacts = steps.filter((s) => s.type === "impact");
    expect(impacts).toHaveLength(2);
  });

  it("maps turn_right action to 3-pulse pattern", () => {
    const pattern = actionToPattern("turn_right");
    expect(pattern).toBe("turn_right");

    const steps = HAPTIC_PATTERNS.turn_right;
    const impacts = steps.filter((s) => s.type === "impact");
    expect(impacts).toHaveLength(3);
  });

  it("maps continue/start to go_straight pattern", () => {
    expect(actionToPattern("continue")).toBe("go_straight");
    expect(actionToPattern("start")).toBe("go_straight");
  });

  it("maps arrive to arrival pattern", () => {
    expect(actionToPattern("arrive")).toBe("arrival");

    const steps = HAPTIC_PATTERNS.arrival;
    const impacts = steps.filter((s) => s.type === "impact");
    expect(impacts).toHaveLength(3); // 3 long pulses
  });

  it("returns null for unknown action", () => {
    expect(actionToPattern("unknown")).toBeNull();
  });

  it("TST-FR-403-003: all patterns complete within 2 seconds", () => {
    const patterns = Object.keys(HAPTIC_PATTERNS) as Array<
      keyof typeof HAPTIC_PATTERNS
    >;
    for (const pattern of patterns) {
      const duration = getPatternDuration(pattern);
      expect(duration).toBeLessThanOrEqual(2000);
    }
  });

  it("has Spanish labels for all patterns", () => {
    const patterns = Object.keys(HAPTIC_PATTERNS) as Array<
      keyof typeof HAPTIC_PATTERNS
    >;
    for (const pattern of patterns) {
      expect(HAPTIC_PATTERN_LABELS[pattern]).toBeTruthy();
    }
  });
});

describe("hapticNavigationService [FR-403]", () => {
  it("TST-FR-403-001: vibrates for turn_left action", async () => {
    const pattern = await vibrateForAction("turn_left");

    expect(pattern).toBe("turn_left");
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it("TST-FR-403-002: vibrates alert for high risk", async () => {
    await vibrateAlert("high");

    // alert_risk has 6 heavy impacts
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Heavy
    );
  });

  it("does not vibrate when disabled", async () => {
    setEnabled(false);
    const pattern = await vibrateForAction("turn_left");

    expect(pattern).toBe("turn_left");
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it("returns null for unknown actions", async () => {
    const pattern = await vibrateForAction("unknown_action");
    expect(pattern).toBeNull();
  });

  it("enable/disable state works correctly", () => {
    expect(getIsEnabled()).toBe(true);
    setEnabled(false);
    expect(getIsEnabled()).toBe(false);
    setEnabled(true);
    expect(getIsEnabled()).toBe(true);
  });
});
