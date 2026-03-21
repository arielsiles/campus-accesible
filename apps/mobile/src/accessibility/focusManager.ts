// FR-303: Focus manager — manages accessibility focus for screen readers
import { AccessibilityInfo, findNodeHandle } from "react-native";

import type { RefObject } from "react";

/**
 * TST-FR-303-002: Move accessibility focus to a specific component.
 * Used when navigating between screens to set focus on the primary element.
 *
 * @param ref - React ref to the target component
 * @param delay - Optional delay in ms (default 500ms for screen transition)
 */
export function setFocus(
  ref: RefObject<unknown>,
  delay: number = 500,
): void {
  if (!ref.current) return;

  setTimeout(() => {
    const node = findNodeHandle(ref.current as number);
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, delay);
}

/**
 * FR-303: Focus the first interactive element on screen change.
 * Creates a focus handler for use in useEffect on screen mount.
 *
 * @param ref - React ref to the primary element of the new screen
 * @returns Cleanup function (no-op for setTimeout)
 */
export function createScreenFocusHandler(
  ref: RefObject<unknown>,
): () => void {
  const timeoutId = setTimeout(() => {
    setFocus(ref, 0);
  }, 600);

  return () => clearTimeout(timeoutId);
}

/**
 * FR-303: Accessibility order helper.
 * Returns props to set the reading order for TalkBack/VoiceOver.
 *
 * @param order - Numeric order (lower = read first)
 */
export function accessibilityOrder(order: number): {
  accessibilityViewIsModal: boolean;
} {
  // On React Native, reading order follows the component tree order.
  // This helper is a placeholder for future custom ordering if needed.
  return { accessibilityViewIsModal: false };
}

export const focusManager = {
  setFocus,
  createScreenFocusHandler,
  accessibilityOrder,
};
