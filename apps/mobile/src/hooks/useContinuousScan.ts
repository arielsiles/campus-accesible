// FR-1105: Continuous scan hook — schedules captures during navigation
import { useEffect, useRef, useState } from "react";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { describeImage, type VisionDescribeResponse } from "../services/visionService";
import {
  detectSignificantChange,
  type ChangeAnalysis,
} from "../services/continuousScanService";
import { useAccessibilityStore } from "../store/accessibilityStore";
import { useLocationStore } from "../store/locationStore";

const SCAN_INTERVAL_MS = 20_000; // FR-1105: 20s default

export interface ContinuousScanState {
  enabled: boolean;
  scanning: boolean; // a scan is in flight
  lastResult: VisionDescribeResponse | null;
  lastChange: ChangeAnalysis | null;
  errorCount: number;
}

export interface ContinuousScanControls extends ContinuousScanState {
  setEnabled: (v: boolean) => void;
  /** Capture function provided by the camera component (returns base64 jpeg) */
  setCaptureFn: (fn: (() => Promise<string | null>) | null) => void;
}

export function useContinuousScan(): ContinuousScanControls {
  const [enabled, setEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<VisionDescribeResponse | null>(null);
  const [lastChange, setLastChange] = useState<ChangeAnalysis | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  const captureFnRef = useRef<(() => Promise<string | null>) | null>(null);
  const profile = useAccessibilityStore((s) => s.profile);
  const coords = useLocationStore((s) => s.coords);

  const setCaptureFn = (fn: (() => Promise<string | null>) | null) => {
    captureFnRef.current = fn;
  };

  // FR-1105: Periodic scan loop
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const runScan = async () => {
      if (!captureFnRef.current || cancelled) return;
      setScanning(true);
      try {
        const base64 = await captureFnRef.current();
        if (!base64 || cancelled) return;

        const result = await describeImage({
          image: base64,
          mediaType: "image/jpeg",
          profile,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });
        if (cancelled) return;

        const change = detectSignificantChange(result, lastResult);
        setLastResult(result);
        setLastChange(change);

        // FR-1105: Announce only on significant change
        if (change.isSignificant && change.announcement) {
          if (profile === "deaf") {
            // Visual + haptic only for deaf profile
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } else {
            Speech.speak(change.announcement, {
              language: "es-ES",
              rate: 1.0,
            });
          }
        }
        setErrorCount(0);
      } catch {
        if (!cancelled) setErrorCount((n) => n + 1);
      } finally {
        if (!cancelled) setScanning(false);
      }
    };

    // Run immediately, then on interval
    runScan();
    const interval = setInterval(runScan, SCAN_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      Speech.stop();
    };
  // We intentionally do not depend on lastResult to avoid re-creating the loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, profile, coords?.latitude, coords?.longitude]);

  // Auto-disable after 5 consecutive errors (server unreachable, budget exceeded, etc.)
  useEffect(() => {
    if (errorCount >= 5) {
      setEnabled(false);
    }
  }, [errorCount]);

  return {
    enabled,
    scanning,
    lastResult,
    lastChange,
    errorCount,
    setEnabled,
    setCaptureFn,
  };
}
