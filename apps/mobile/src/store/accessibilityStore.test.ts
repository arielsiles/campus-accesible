// FR-305: Accessibility store tests
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}));

import { useAccessibilityStore } from "./accessibilityStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

beforeEach(() => {
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
  });
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
  });

  it("sets standard profile with correct defaults", () => {
    // First set to visual, then back to standard
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
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("sets audio output type", () => {
    useAccessibilityStore.getState().setAudioOutputType("bone_conduction");
    expect(useAccessibilityStore.getState().audioOutputType).toBe(
      "bone_conduction",
    );
  });
});
