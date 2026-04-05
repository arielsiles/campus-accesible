// FR-305, FR-404: Accessibility store tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}));

import { useAccessibilityStore } from "./accessibilityStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// FR-601: Use fake timers to test debounced persistence
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  // Reset store to defaults
  useAccessibilityStore.setState({
    profile: "standard",
    isProfileSelected: false,
    audioBeaconEnabled: false,
    beaconVolume: 0.7,
    audioDescriptionsEnabled: false,
    descriptionFrequency: "reduced",
    ttsEnabled: false,
    ttsRate: 0.9,
    ttsPitch: 1.0,
    highContrastEnabled: false,
    audioOutputType: "stereo",
    hapticEnabled: false,
    easyReadEnabled: false,
    largeFontEnabled: false,
    mobilityBarriersEnabled: false,
    avoidStairs: false,
    maxSlopePercent: 8,
    minPathWidth: 1.5,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("accessibilityStore [FR-305]", () => {
  it("has correct default values for standard profile", () => {
    const state = useAccessibilityStore.getState();
    expect(state.profile).toBe("standard");
    expect(state.isProfileSelected).toBe(false);
    expect(state.audioBeaconEnabled).toBe(false);
    expect(state.audioDescriptionsEnabled).toBe(false);
    expect(state.ttsEnabled).toBe(false);
    expect(state.highContrastEnabled).toBe(false);
    expect(state.hapticEnabled).toBe(false);
    expect(state.easyReadEnabled).toBe(false);
    expect(state.mobilityBarriersEnabled).toBe(false);
  });

  it("TST-FR-305-002: sets visual disability profile with correct defaults", () => {
    useAccessibilityStore.getState().setProfile("visual_disability");
    const state = useAccessibilityStore.getState();

    expect(state.profile).toBe("visual_disability");
    expect(state.isProfileSelected).toBe(true);
    expect(state.audioBeaconEnabled).toBe(true);
    expect(state.audioDescriptionsEnabled).toBe(true);
    expect(state.ttsEnabled).toBe(true);
    expect(state.highContrastEnabled).toBe(true);
    expect(state.descriptionFrequency).toBe("full");
    expect(state.hapticEnabled).toBe(false);
    expect(state.easyReadEnabled).toBe(false);
    expect(state.mobilityBarriersEnabled).toBe(false);
  });

  it("sets standard profile with correct defaults", () => {
    useAccessibilityStore.getState().setProfile("visual_disability");
    useAccessibilityStore.getState().setProfile("standard");
    const state = useAccessibilityStore.getState();

    expect(state.profile).toBe("standard");
    expect(state.audioBeaconEnabled).toBe(false);
    expect(state.audioDescriptionsEnabled).toBe(false);
    expect(state.ttsEnabled).toBe(false);
    expect(state.highContrastEnabled).toBe(false);
  });

  it("TST-FR-305-001: persists profile to AsyncStorage", () => {
    useAccessibilityStore.getState().setProfile("visual_disability");
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@campus-gps/accessibility-profile",
      expect.any(String),
    );

    const savedData = JSON.parse(
      vi.mocked(AsyncStorage.setItem).mock.calls[0][1],
    );
    expect(savedData.profile).toBe("visual_disability");
    expect(savedData.isProfileSelected).toBe(true);
  });

  it("loads profile from AsyncStorage", async () => {
    const stored = JSON.stringify({
      profile: "visual_disability",
      isProfileSelected: true,
      audioBeaconEnabled: true,
      beaconVolume: 0.5,
      audioDescriptionsEnabled: true,
      descriptionFrequency: "full",
      ttsEnabled: true,
      ttsRate: 1.2,
      ttsPitch: 1.0,
      highContrastEnabled: true,
      audioOutputType: "bone_conduction",
      hapticEnabled: false,
      easyReadEnabled: false,
      largeFontEnabled: false,
      mobilityBarriersEnabled: false,
      avoidStairs: false,
      maxSlopePercent: 8,
      minPathWidth: 1.5,
    });
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(stored);

    await useAccessibilityStore.getState().loadFromStorage();
    const state = useAccessibilityStore.getState();

    expect(state.profile).toBe("visual_disability");
    expect(state.beaconVolume).toBe(0.5);
    expect(state.ttsRate).toBe(1.2);
    expect(state.audioOutputType).toBe("bone_conduction");
  });

  it("clamps beacon volume to 0-1", () => {
    useAccessibilityStore.getState().setBeaconVolume(1.5);
    expect(useAccessibilityStore.getState().beaconVolume).toBe(1);

    useAccessibilityStore.getState().setBeaconVolume(-0.3);
    expect(useAccessibilityStore.getState().beaconVolume).toBe(0);
  });

  it("clamps TTS rate to 0.5-2.0", () => {
    useAccessibilityStore.getState().setTtsRate(3.0);
    expect(useAccessibilityStore.getState().ttsRate).toBe(2.0);

    useAccessibilityStore.getState().setTtsRate(0.1);
    expect(useAccessibilityStore.getState().ttsRate).toBe(0.5);
  });

  it("updates individual preferences and persists", () => {
    useAccessibilityStore.getState().setDescriptionFrequency("full");
    expect(useAccessibilityStore.getState().descriptionFrequency).toBe("full");
    // FR-601: Persistence is debounced — advance timer to trigger write
    vi.advanceTimersByTime(600);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("sets audio output type", () => {
    useAccessibilityStore.getState().setAudioOutputType("bone_conduction");
    expect(useAccessibilityStore.getState().audioOutputType).toBe(
      "bone_conduction",
    );
  });
});

describe("accessibilityStore multi-profile [FR-404]", () => {
  it("TST-FR-404-001: supports 5 profiles", () => {
    const profiles = [
      "standard",
      "visual_disability",
      "reduced_mobility",
      "deaf",
      "easy_read",
    ] as const;

    for (const p of profiles) {
      useAccessibilityStore.getState().setProfile(p);
      expect(useAccessibilityStore.getState().profile).toBe(p);
      expect(useAccessibilityStore.getState().isProfileSelected).toBe(true);
    }
  });

  it("TST-FR-404-002: profile change applies immediately", () => {
    // Start with standard
    useAccessibilityStore.getState().setProfile("standard");
    expect(useAccessibilityStore.getState().hapticEnabled).toBe(false);
    expect(useAccessibilityStore.getState().mobilityBarriersEnabled).toBe(
      false,
    );

    // Switch to deaf — haptic ON, audio OFF
    useAccessibilityStore.getState().setProfile("deaf");
    const deafState = useAccessibilityStore.getState();
    expect(deafState.hapticEnabled).toBe(true);
    expect(deafState.audioBeaconEnabled).toBe(false);
    expect(deafState.ttsEnabled).toBe(false);

    // Switch to reduced_mobility — barriers ON
    useAccessibilityStore.getState().setProfile("reduced_mobility");
    const mobilityState = useAccessibilityStore.getState();
    expect(mobilityState.mobilityBarriersEnabled).toBe(true);
    expect(mobilityState.avoidStairs).toBe(true);
    expect(mobilityState.hapticEnabled).toBe(false);
  });

  it("sets reduced_mobility profile with correct defaults", () => {
    useAccessibilityStore.getState().setProfile("reduced_mobility");
    const state = useAccessibilityStore.getState();

    expect(state.profile).toBe("reduced_mobility");
    expect(state.mobilityBarriersEnabled).toBe(true);
    expect(state.avoidStairs).toBe(true);
    expect(state.maxSlopePercent).toBe(8);
    expect(state.minPathWidth).toBe(1.5);
    expect(state.audioBeaconEnabled).toBe(false);
    expect(state.hapticEnabled).toBe(false);
    expect(state.easyReadEnabled).toBe(false);
  });

  it("sets deaf profile with correct defaults", () => {
    useAccessibilityStore.getState().setProfile("deaf");
    const state = useAccessibilityStore.getState();

    expect(state.profile).toBe("deaf");
    expect(state.hapticEnabled).toBe(true);
    expect(state.audioBeaconEnabled).toBe(false);
    expect(state.ttsEnabled).toBe(false);
    expect(state.audioDescriptionsEnabled).toBe(false);
    expect(state.easyReadEnabled).toBe(false);
    expect(state.mobilityBarriersEnabled).toBe(false);
  });

  it("sets easy_read profile with correct defaults", () => {
    useAccessibilityStore.getState().setProfile("easy_read");
    const state = useAccessibilityStore.getState();

    expect(state.profile).toBe("easy_read");
    expect(state.easyReadEnabled).toBe(true);
    expect(state.largeFontEnabled).toBe(true);
    expect(state.ttsEnabled).toBe(true);
    expect(state.audioDescriptionsEnabled).toBe(true);
    expect(state.descriptionFrequency).toBe("full");
    expect(state.hapticEnabled).toBe(false);
    expect(state.mobilityBarriersEnabled).toBe(false);
  });

  it("clamps maxSlopePercent to 1-20", () => {
    useAccessibilityStore.getState().setMaxSlopePercent(25);
    expect(useAccessibilityStore.getState().maxSlopePercent).toBe(20);

    useAccessibilityStore.getState().setMaxSlopePercent(0);
    expect(useAccessibilityStore.getState().maxSlopePercent).toBe(1);
  });

  it("clamps minPathWidth to 0.5-3.0", () => {
    useAccessibilityStore.getState().setMinPathWidth(5.0);
    expect(useAccessibilityStore.getState().minPathWidth).toBe(3.0);

    useAccessibilityStore.getState().setMinPathWidth(0.1);
    expect(useAccessibilityStore.getState().minPathWidth).toBe(0.5);
  });

  it("persists new profile fields to AsyncStorage", () => {
    useAccessibilityStore.getState().setProfile("deaf");
    const savedData = JSON.parse(
      vi.mocked(AsyncStorage.setItem).mock.calls[0][1],
    );
    expect(savedData.hapticEnabled).toBe(true);
    expect(savedData.easyReadEnabled).toBe(false);
    expect(savedData.mobilityBarriersEnabled).toBe(false);
  });
});
