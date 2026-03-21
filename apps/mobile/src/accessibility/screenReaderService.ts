// FR-303: Screen reader service — TalkBack/VoiceOver detection and announcements
import { AccessibilityInfo, Platform } from "react-native";

let isScreenReaderEnabled = false;
let listeners: Array<(enabled: boolean) => void> = [];

/**
 * FR-303: Initialize screen reader detection.
 * Sets up listener for screen reader state changes.
 */
export async function initialize(): Promise<boolean> {
  isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();

  AccessibilityInfo.addEventListener(
    "screenReaderChanged",
    (enabled: boolean) => {
      isScreenReaderEnabled = enabled;
      listeners.forEach((cb) => cb(enabled));
    },
  );

  return isScreenReaderEnabled;
}

/**
 * TST-FR-303-001: Check if a screen reader (TalkBack/VoiceOver) is active.
 */
export function getIsScreenReaderEnabled(): boolean {
  return isScreenReaderEnabled;
}

/**
 * FR-303: Announce a message to the screen reader.
 * Uses AccessibilityInfo.announceForAccessibility on both platforms.
 *
 * @param message - The message to announce in Spanish
 */
export function announce(message: string): void {
  if (!message) return;
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * FR-303: Announce search results count for screen reader users.
 * Per spec: "TalkBack anuncia '{N} resultados'"
 */
export function announceSearchResults(count: number): void {
  if (count === 0) {
    announce("Sin resultados");
  } else if (count === 1) {
    announce("1 resultado encontrado");
  } else {
    announce(`${count} resultados encontrados`);
  }
}

/**
 * FR-303: Announce navigation instruction change.
 * Triggered when the current turn-by-turn instruction updates.
 */
export function announceInstruction(description: string): void {
  announce(description);
}

/**
 * FR-303: Announce alert (off-route, GPS lost, arrival).
 */
export function announceAlert(alertMessage: string): void {
  announce(alertMessage);
}

/**
 * Subscribe to screen reader state changes.
 */
export function onScreenReaderChanged(
  callback: (enabled: boolean) => void,
): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

/**
 * Get the platform-specific screen reader name.
 */
export function getScreenReaderName(): string {
  return Platform.OS === "ios" ? "VoiceOver" : "TalkBack";
}

export const screenReaderService = {
  initialize,
  getIsScreenReaderEnabled,
  announce,
  announceSearchResults,
  announceInstruction,
  announceAlert,
  onScreenReaderChanged,
  getScreenReaderName,
};
