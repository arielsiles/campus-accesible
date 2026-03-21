// FR-301: Audio beacon hook — connects compass, location, and audio engine
import { useState, useEffect, useCallback } from "react";
import { audioBeaconEngine } from "../audio/audioBeaconEngine";
import { useCompass } from "./useCompass";

import type { BeaconState } from "../audio/audioBeaconEngine";

export interface UseAudioBeaconOptions {
  /** Whether the beacon is enabled */
  enabled: boolean;
  /** Target waypoint latitude */
  targetLat: number;
  /** Target waypoint longitude */
  targetLon: number;
  /** User's current latitude */
  userLat: number;
  /** User's current longitude */
  userLon: number;
  /** Whether to use mono mode (bone conduction) */
  monoMode?: boolean;
}

/**
 * FR-301: Hook that manages the audio beacon lifecycle.
 * Connects compass heading and user position to the audio beacon engine.
 */
export function useAudioBeacon(options: UseAudioBeaconOptions): BeaconState {
  const { enabled, targetLat, targetLon, userLat, userLon, monoMode = false } = options;
  const { heading } = useCompass();
  const [beaconState, setBeaconState] = useState<BeaconState>({
    isActive: false,
    targetLat: 0,
    targetLon: 0,
    userLat: 0,
    userLon: 0,
    userHeading: 0,
    relativeAngle: 0,
    leftGain: 0.5,
    rightGain: 0.5,
    volume: 0.7,
  });

  // Update heading in engine
  useEffect(() => {
    audioBeaconEngine.updateUserHeading(heading);
  }, [heading]);

  // Update user position in engine
  useEffect(() => {
    audioBeaconEngine.updateUserPosition(userLat, userLon);
  }, [userLat, userLon]);

  // Update target in engine
  useEffect(() => {
    audioBeaconEngine.updateTarget(targetLat, targetLon);
  }, [targetLat, targetLon]);

  // FR-306: Configure mono mode for bone conduction
  useEffect(() => {
    audioBeaconEngine.setHRTFConfig({
      monoMode,
      volumeBoost: monoMode ? 1.2 : 1.0,
    });
  }, [monoMode]);

  // Start/stop beacon based on enabled state
  useEffect(() => {
    if (enabled && targetLat !== 0 && targetLon !== 0) {
      audioBeaconEngine.initialize().then(() => {
        audioBeaconEngine.startBeacon(targetLat, targetLon);
      });
    } else {
      audioBeaconEngine.stopBeacon();
    }

    return () => {
      audioBeaconEngine.stopBeacon();
    };
  }, [enabled, targetLat, targetLon]);

  // Poll beacon state for UI updates
  const updateState = useCallback(() => {
    setBeaconState(audioBeaconEngine.getBeaconState());
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(updateState, 200);
    return () => clearInterval(interval);
  }, [enabled, updateState]);

  return beaconState;
}
