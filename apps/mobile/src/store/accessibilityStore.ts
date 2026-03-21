// FR-305, FR-404: Accessibility profile store with persistence
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@campus-gps/accessibility-profile";

// FR-404: Extended to 5 profiles
export type AccessibilityProfile =
  | "standard"
  | "visual_disability"
  | "reduced_mobility"
  | "deaf"
  | "easy_read";

export type AudioOutputType = "stereo" | "bone_conduction";
export type DescriptionFrequency = "full" | "reduced";

export interface AccessibilityState {
  // Profile
  profile: AccessibilityProfile;
  isProfileSelected: boolean;

  // Audio beacon preferences
  audioBeaconEnabled: boolean;
  beaconVolume: number; // 0-1

  // Audio descriptions
  audioDescriptionsEnabled: boolean;
  descriptionFrequency: DescriptionFrequency;

  // TTS preferences
  ttsEnabled: boolean;
  ttsRate: number; // 0.5-2.0
  ttsPitch: number; // 0.5-2.0

  // Visual preferences
  highContrastEnabled: boolean;

  // Audio output — FR-306
  audioOutputType: AudioOutputType;

  // FR-403: Haptic navigation for deaf profile
  hapticEnabled: boolean;

  // FR-402: Easy read mode
  easyReadEnabled: boolean;
  largeFontEnabled: boolean;

  // FR-401: Mobility barriers
  mobilityBarriersEnabled: boolean;
  avoidStairs: boolean;
  maxSlopePercent: number; // default 8
  minPathWidth: number; // default 1.5m

  // Actions
  setProfile: (profile: AccessibilityProfile) => void;
  setAudioBeaconEnabled: (enabled: boolean) => void;
  setBeaconVolume: (volume: number) => void;
  setAudioDescriptionsEnabled: (enabled: boolean) => void;
  setDescriptionFrequency: (frequency: DescriptionFrequency) => void;
  setTtsEnabled: (enabled: boolean) => void;
  setTtsRate: (rate: number) => void;
  setTtsPitch: (pitch: number) => void;
  setHighContrastEnabled: (enabled: boolean) => void;
  setAudioOutputType: (type: AudioOutputType) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setEasyReadEnabled: (enabled: boolean) => void;
  setLargeFontEnabled: (enabled: boolean) => void;
  setMobilityBarriersEnabled: (enabled: boolean) => void;
  setAvoidStairs: (avoid: boolean) => void;
  setMaxSlopePercent: (percent: number) => void;
  setMinPathWidth: (width: number) => void;
  loadFromStorage: () => Promise<void>;
}

// FR-305, FR-404: Default preferences per profile
function getProfileDefaults(profile: AccessibilityProfile) {
  switch (profile) {
    case "visual_disability":
      return {
        audioBeaconEnabled: true,
        audioDescriptionsEnabled: true,
        ttsEnabled: true,
        highContrastEnabled: true,
        descriptionFrequency: "full" as DescriptionFrequency,
        hapticEnabled: false,
        easyReadEnabled: false,
        largeFontEnabled: false,
        mobilityBarriersEnabled: false,
        avoidStairs: false,
        maxSlopePercent: 8,
        minPathWidth: 1.5,
      };
    case "reduced_mobility":
      return {
        audioBeaconEnabled: false,
        audioDescriptionsEnabled: false,
        ttsEnabled: false,
        highContrastEnabled: false,
        descriptionFrequency: "reduced" as DescriptionFrequency,
        hapticEnabled: false,
        easyReadEnabled: false,
        largeFontEnabled: false,
        mobilityBarriersEnabled: true,
        avoidStairs: true,
        maxSlopePercent: 8,
        minPathWidth: 1.5,
      };
    case "deaf":
      return {
        audioBeaconEnabled: false,
        audioDescriptionsEnabled: false,
        ttsEnabled: false,
        highContrastEnabled: false,
        descriptionFrequency: "reduced" as DescriptionFrequency,
        hapticEnabled: true,
        easyReadEnabled: false,
        largeFontEnabled: false,
        mobilityBarriersEnabled: false,
        avoidStairs: false,
        maxSlopePercent: 8,
        minPathWidth: 1.5,
      };
    case "easy_read":
      return {
        audioBeaconEnabled: false,
        audioDescriptionsEnabled: true,
        ttsEnabled: true,
        highContrastEnabled: false,
        descriptionFrequency: "full" as DescriptionFrequency,
        hapticEnabled: false,
        easyReadEnabled: true,
        largeFontEnabled: true,
        mobilityBarriersEnabled: false,
        avoidStairs: false,
        maxSlopePercent: 8,
        minPathWidth: 1.5,
      };
    default:
      return {
        audioBeaconEnabled: false,
        audioDescriptionsEnabled: false,
        ttsEnabled: false,
        highContrastEnabled: false,
        descriptionFrequency: "reduced" as DescriptionFrequency,
        hapticEnabled: false,
        easyReadEnabled: false,
        largeFontEnabled: false,
        mobilityBarriersEnabled: false,
        avoidStairs: false,
        maxSlopePercent: 8,
        minPathWidth: 1.5,
      };
  }
}

// FR-305: Persist state to AsyncStorage
async function persistState(state: Partial<AccessibilityState>): Promise<void> {
  try {
    const data = {
      profile: state.profile,
      isProfileSelected: state.isProfileSelected,
      audioBeaconEnabled: state.audioBeaconEnabled,
      beaconVolume: state.beaconVolume,
      audioDescriptionsEnabled: state.audioDescriptionsEnabled,
      descriptionFrequency: state.descriptionFrequency,
      ttsEnabled: state.ttsEnabled,
      ttsRate: state.ttsRate,
      ttsPitch: state.ttsPitch,
      highContrastEnabled: state.highContrastEnabled,
      audioOutputType: state.audioOutputType,
      hapticEnabled: state.hapticEnabled,
      easyReadEnabled: state.easyReadEnabled,
      largeFontEnabled: state.largeFontEnabled,
      mobilityBarriersEnabled: state.mobilityBarriersEnabled,
      avoidStairs: state.avoidStairs,
      maxSlopePercent: state.maxSlopePercent,
      minPathWidth: state.minPathWidth,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage failure is non-critical
  }
}

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
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

  setProfile: (profile) => {
    const defaults = getProfileDefaults(profile);
    const newState = { profile, isProfileSelected: true, ...defaults };
    set(newState);
    persistState({ ...get(), ...newState });
  },

  setAudioBeaconEnabled: (enabled) => {
    set({ audioBeaconEnabled: enabled });
    persistState(get());
  },

  setBeaconVolume: (volume) => {
    set({ beaconVolume: Math.max(0, Math.min(1, volume)) });
    persistState(get());
  },

  setAudioDescriptionsEnabled: (enabled) => {
    set({ audioDescriptionsEnabled: enabled });
    persistState(get());
  },

  setDescriptionFrequency: (frequency) => {
    set({ descriptionFrequency: frequency });
    persistState(get());
  },

  setTtsEnabled: (enabled) => {
    set({ ttsEnabled: enabled });
    persistState(get());
  },

  setTtsRate: (rate) => {
    set({ ttsRate: Math.max(0.5, Math.min(2.0, rate)) });
    persistState(get());
  },

  setTtsPitch: (pitch) => {
    set({ ttsPitch: Math.max(0.5, Math.min(2.0, pitch)) });
    persistState(get());
  },

  setHighContrastEnabled: (enabled) => {
    set({ highContrastEnabled: enabled });
    persistState(get());
  },

  setAudioOutputType: (type) => {
    set({ audioOutputType: type });
    persistState(get());
  },

  setHapticEnabled: (enabled) => {
    set({ hapticEnabled: enabled });
    persistState(get());
  },

  setEasyReadEnabled: (enabled) => {
    set({ easyReadEnabled: enabled });
    persistState(get());
  },

  setLargeFontEnabled: (enabled) => {
    set({ largeFontEnabled: enabled });
    persistState(get());
  },

  setMobilityBarriersEnabled: (enabled) => {
    set({ mobilityBarriersEnabled: enabled });
    persistState(get());
  },

  setAvoidStairs: (avoid) => {
    set({ avoidStairs: avoid });
    persistState(get());
  },

  setMaxSlopePercent: (percent) => {
    set({ maxSlopePercent: Math.max(1, Math.min(20, percent)) });
    persistState(get());
  },

  setMinPathWidth: (width) => {
    set({ minPathWidth: Math.max(0.5, Math.min(3.0, width)) });
    persistState(get());
  },

  loadFromStorage: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        set(data);
      }
    } catch {
      // Storage failure is non-critical
    }
  },
}));
