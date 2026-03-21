// FR-403: Haptic navigation service for deaf profile
// Translates navigation instructions to vibration patterns

import * as Haptics from "expo-haptics";
import {
  HAPTIC_PATTERNS,
  actionToPattern,
  type HapticPattern,
  type HapticIntensity,
} from "./hapticPatterns";

const INTENSITY_MAP: Record<HapticIntensity, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

let isEnabled = true;

/**
 * FR-403: Execute a haptic pattern
 * NFR-401: Total execution time < pattern duration (async, no blocking)
 */
export async function playPattern(pattern: HapticPattern): Promise<void> {
  if (!isEnabled) return;

  const steps = HAPTIC_PATTERNS[pattern];

  for (const step of steps) {
    if (step.type === "impact") {
      const style = INTENSITY_MAP[step.intensity ?? "medium"];
      await Haptics.impactAsync(style);
    }
    // Pause between steps
    if (step.duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, step.duration));
    }
  }
}

/**
 * FR-403: Vibrate for a navigation instruction action
 * TST-FR-403-001: Generates correct pattern for turn_left
 */
export async function vibrateForAction(action: string): Promise<HapticPattern | null> {
  const pattern = actionToPattern(action);
  if (pattern) {
    await playPattern(pattern);
  }
  return pattern;
}

/**
 * FR-403: Vibrate alert for risk segment
 * TST-FR-403-002: Generates alert pattern for high risk
 */
export async function vibrateAlert(riskLevel: string): Promise<void> {
  if (!isEnabled) return;

  if (riskLevel === "high") {
    await playPattern("alert_risk");
  } else if (riskLevel === "medium") {
    // Single heavy impact for medium risk
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

/**
 * FR-403: Vibrate on arrival
 */
export async function vibrateArrival(): Promise<void> {
  await playPattern("arrival");
}

/**
 * FR-403: Vibrate when off route
 */
export async function vibrateOffRoute(): Promise<void> {
  await playPattern("off_route");
}

/**
 * Enable/disable haptic feedback
 */
export function setEnabled(enabled: boolean): void {
  isEnabled = enabled;
}

export function getIsEnabled(): boolean {
  return isEnabled;
}

export const hapticNavigationService = {
  playPattern,
  vibrateForAction,
  vibrateAlert,
  vibrateArrival,
  vibrateOffRoute,
  setEnabled,
  getIsEnabled,
};
