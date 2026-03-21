// FR-301: Audio Beacon Engine — 3D directional audio for navigation
import { Audio } from "expo-av";
import {
  calculateHRTF,
  calculateRelativeAngle,
  calculateBearing,
} from "./hrtfProcessor";

import type { HRTFConfig } from "./hrtfProcessor";

export interface BeaconState {
  isActive: boolean;
  targetLat: number;
  targetLon: number;
  userLat: number;
  userLon: number;
  userHeading: number;
  relativeAngle: number;
  leftGain: number;
  rightGain: number;
  volume: number;
}

let sound: Audio.Sound | null = null;
let updateInterval: ReturnType<typeof setInterval> | null = null;
let isActive = false;
let hrtfConfig: HRTFConfig = { monoMode: false, volumeBoost: 1.0 };

// Current state
let targetCoords = { lat: 0, lon: 0 };
let userCoords = { lat: 0, lon: 0 };
let userHeading = 0;

/**
 * FR-301: Initialize the audio beacon engine.
 * Loads the beacon sound and configures audio mode.
 */
export async function initialize(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  });
}

/**
 * FR-301: Start the audio beacon toward a target waypoint.
 *
 * @param lat - Target waypoint latitude
 * @param lon - Target waypoint longitude
 */
export async function startBeacon(lat: number, lon: number): Promise<void> {
  targetCoords = { lat, lon };
  isActive = true;

  // Load beacon sound
  if (!sound) {
    const { sound: loadedSound } = await Audio.Sound.createAsync(
      // Use a simple ping sound — bundled asset
      require("../../../assets/beacon.wav"),
      { isLooping: true, volume: 0.7 },
    );
    sound = loadedSound;
  }

  await sound.playAsync();

  // NFR-301: Update direction at 10Hz (100ms) for < 100ms latency
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(updateAudioDirection, 100);
}

/**
 * FR-301: Stop the audio beacon.
 */
export async function stopBeacon(): Promise<void> {
  isActive = false;

  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }

  if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
    sound = null;
  }
}

/**
 * FR-301: Update user position for beacon direction calculation.
 */
export function updateUserPosition(lat: number, lon: number): void {
  userCoords = { lat, lon };
}

/**
 * FR-301: Update user heading from compass.
 */
export function updateUserHeading(heading: number): void {
  userHeading = heading;
}

/**
 * FR-301: Update the target waypoint coordinates.
 */
export function updateTarget(lat: number, lon: number): void {
  targetCoords = { lat, lon };
}

/**
 * FR-306: Set HRTF configuration (e.g., mono mode for bone conduction).
 */
export function setHRTFConfig(config: Partial<HRTFConfig>): void {
  hrtfConfig = { ...hrtfConfig, ...config };
}

/**
 * Get current beacon state for UI display.
 */
export function getBeaconState(): BeaconState {
  const bearing = calculateBearing(
    userCoords.lat,
    userCoords.lon,
    targetCoords.lat,
    targetCoords.lon,
  );
  const relativeAngle = calculateRelativeAngle(userHeading, bearing);
  const hrtf = calculateHRTF(relativeAngle, hrtfConfig);

  return {
    isActive,
    targetLat: targetCoords.lat,
    targetLon: targetCoords.lon,
    userLat: userCoords.lat,
    userLon: userCoords.lon,
    userHeading,
    relativeAngle,
    leftGain: hrtf.leftGain,
    rightGain: hrtf.rightGain,
    volume: hrtf.volume,
  };
}

/** Internal: update audio panning based on current positions */
async function updateAudioDirection(): Promise<void> {
  if (!isActive || !sound) return;

  const bearing = calculateBearing(
    userCoords.lat,
    userCoords.lon,
    targetCoords.lat,
    targetCoords.lon,
  );
  const relativeAngle = calculateRelativeAngle(userHeading, bearing);
  const hrtf = calculateHRTF(relativeAngle, hrtfConfig);

  // expo-av supports stereo pan (-1 left, 0 center, 1 right)
  // Convert leftGain/rightGain to pan value
  const pan = hrtf.rightGain - hrtf.leftGain;

  try {
    await sound.setStatusAsync({
      volume: hrtf.volume,
      audioPan: pan,
    });
  } catch {
    // Sound may have been unloaded during navigation changes
  }
}

export const audioBeaconEngine = {
  initialize,
  startBeacon,
  stopBeacon,
  updateUserPosition,
  updateUserHeading,
  updateTarget,
  setHRTFConfig,
  getBeaconState,
};
