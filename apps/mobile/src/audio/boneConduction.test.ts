// FR-306: Bone conduction adapter tests
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("expo-av", () => ({
  Audio: {
    Sound: { createAsync: vi.fn() },
    setAudioModeAsync: vi.fn(),
  },
}));

vi.mock("expo-speech", () => ({
  speak: vi.fn(),
  stop: vi.fn(),
}));

import {
  getConfigForOutputType,
  applyOutputType,
  getCurrentConfig,
  isBoneConductionActive,
} from "./boneConduction";
import { calculateHRTF } from "./hrtfProcessor";

beforeEach(() => {
  // Reset to stereo
  applyOutputType("stereo");
});

describe("boneConduction [FR-306]", () => {
  it("TST-FR-306-001: returns mono config for bone conduction output", () => {
    const config = getConfigForOutputType("bone_conduction");
    expect(config.monoOutput).toBe(true);
    expect(config.volumeBoost).toBe(1.2);
    expect(config.ttsRateAdjust).toBe(-0.1);
  });

  it("returns stereo config for standard output", () => {
    const config = getConfigForOutputType("stereo");
    expect(config.monoOutput).toBe(false);
    expect(config.volumeBoost).toBe(1.0);
    expect(config.ttsRateAdjust).toBe(0);
  });

  it("TST-FR-306-002: applies bone conduction with +20% volume boost", () => {
    const config = applyOutputType("bone_conduction");
    expect(config.volumeBoost).toBe(1.2);
    expect(isBoneConductionActive()).toBe(true);
  });

  it("applies stereo config and deactivates bone conduction", () => {
    applyOutputType("bone_conduction");
    expect(isBoneConductionActive()).toBe(true);

    applyOutputType("stereo");
    expect(isBoneConductionActive()).toBe(false);
    expect(getCurrentConfig().volumeBoost).toBe(1.0);
  });

  it("switch applies immediately without restart", () => {
    // Simulate switching during navigation
    applyOutputType("bone_conduction");
    let config = getCurrentConfig();
    expect(config.monoOutput).toBe(true);

    // Switch back to stereo immediately
    applyOutputType("stereo");
    config = getCurrentConfig();
    expect(config.monoOutput).toBe(false);
  });

  it("HRTF produces equal L/R in mono mode (bone conduction)", () => {
    const hrtfConfig = { monoMode: true, volumeBoost: 1.2 };

    // Even at 90° (hard right), mono mode should give equal L/R
    const result = calculateHRTF(90, hrtfConfig);
    expect(result.leftGain).toBe(0.5);
    expect(result.rightGain).toBe(0.5);
  });

  it("HRTF produces stereo panning in normal mode", () => {
    const hrtfConfig = { monoMode: false, volumeBoost: 1.0 };

    // At 90° (hard right), stereo mode should pan right
    const result = calculateHRTF(90, hrtfConfig);
    expect(result.rightGain).toBeGreaterThan(result.leftGain);
  });
});
