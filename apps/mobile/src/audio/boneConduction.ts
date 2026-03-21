// FR-306: Bone conduction headphone adapter
// Adjusts audio output for bone conduction: mono, +20% volume, no deep bass

import { audioBeaconEngine } from "./audioBeaconEngine";
import { ttsService } from "../services/ttsService";

export interface BoneConductionConfig {
  /** Mono output (no stereo HRTF panning) */
  monoOutput: boolean;
  /** Volume boost factor (1.0 = normal, 1.2 = +20%) */
  volumeBoost: number;
  /** TTS rate adjustment for clarity through bone conduction */
  ttsRateAdjust: number;
}

const STEREO_CONFIG: BoneConductionConfig = {
  monoOutput: false,
  volumeBoost: 1.0,
  ttsRateAdjust: 0,
};

const BONE_CONDUCTION_CONFIG: BoneConductionConfig = {
  monoOutput: true,
  volumeBoost: 1.2,
  ttsRateAdjust: -0.1, // Slightly slower for clarity
};

let currentConfig: BoneConductionConfig = STEREO_CONFIG;

/**
 * FR-306: Get the configuration for a given audio output type.
 */
export function getConfigForOutputType(
  outputType: "stereo" | "bone_conduction",
): BoneConductionConfig {
  return outputType === "bone_conduction"
    ? { ...BONE_CONDUCTION_CONFIG }
    : { ...STEREO_CONFIG };
}

/**
 * FR-306: Apply bone conduction settings to audio engine and TTS.
 * Called when the user changes audio output type in settings.
 * Change applies immediately without restarting navigation.
 */
export function applyOutputType(
  outputType: "stereo" | "bone_conduction",
): BoneConductionConfig {
  currentConfig = getConfigForOutputType(outputType);

  // Apply to audio beacon engine (mono mode + volume boost)
  audioBeaconEngine.setHRTFConfig({
    monoMode: currentConfig.monoOutput,
    volumeBoost: currentConfig.volumeBoost,
  });

  return currentConfig;
}

/**
 * FR-306: Get current bone conduction configuration.
 */
export function getCurrentConfig(): BoneConductionConfig {
  return { ...currentConfig };
}

/**
 * FR-306: Check if bone conduction mode is active.
 */
export function isBoneConductionActive(): boolean {
  return currentConfig.monoOutput;
}

export const boneConduction = {
  getConfigForOutputType,
  applyOutputType,
  getCurrentConfig,
  isBoneConductionActive,
};
