// FR-303: Screen reader service and focus manager tests
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-native
vi.mock("react-native", () => ({
  AccessibilityInfo: {
    isScreenReaderEnabled: vi.fn().mockResolvedValue(false),
    addEventListener: vi.fn(),
    announceForAccessibility: vi.fn(),
    setAccessibilityFocus: vi.fn(),
  },
  Platform: { OS: "android" },
  findNodeHandle: vi.fn().mockReturnValue(42),
}));

import {
  initialize,
  getIsScreenReaderEnabled,
  announce,
  announceSearchResults,
  announceInstruction,
  announceAlert,
  getScreenReaderName,
} from "./screenReaderService";
import { setFocus } from "./focusManager";
import { AccessibilityInfo, findNodeHandle } from "react-native";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("screenReaderService [FR-303]", () => {
  it("TST-FR-303-001: detects screen reader state on initialize", async () => {
    vi.mocked(AccessibilityInfo.isScreenReaderEnabled).mockResolvedValue(true);
    const result = await initialize();
    expect(result).toBe(true);
    expect(getIsScreenReaderEnabled()).toBe(true);
  });

  it("returns false when screen reader is off", async () => {
    vi.mocked(AccessibilityInfo.isScreenReaderEnabled).mockResolvedValue(false);
    const result = await initialize();
    expect(result).toBe(false);
    expect(getIsScreenReaderEnabled()).toBe(false);
  });

  it("announces message via AccessibilityInfo", () => {
    announce("Prueba de anuncio");
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "Prueba de anuncio",
    );
  });

  it("does not announce empty message", () => {
    announce("");
    expect(
      AccessibilityInfo.announceForAccessibility,
    ).not.toHaveBeenCalled();
  });

  it("announces search results count in Spanish", () => {
    announceSearchResults(0);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "Sin resultados",
    );

    vi.clearAllMocks();
    announceSearchResults(1);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "1 resultado encontrado",
    );

    vi.clearAllMocks();
    announceSearchResults(5);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "5 resultados encontrados",
    );
  });

  it("announces navigation instruction", () => {
    announceInstruction("Gira a la derecha en 50 metros");
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "Gira a la derecha en 50 metros",
    );
  });

  it("announces alert message", () => {
    announceAlert("Señal GPS perdida");
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "Señal GPS perdida",
    );
  });

  it("returns platform-specific screen reader name", () => {
    // Mocked as android
    expect(getScreenReaderName()).toBe("TalkBack");
  });
});

describe("focusManager [FR-303]", () => {
  it("TST-FR-303-002: sets accessibility focus on ref", () => {
    vi.useFakeTimers();
    const mockRef = { current: {} };

    setFocus(mockRef, 0);
    vi.advanceTimersByTime(0);

    expect(findNodeHandle).toHaveBeenCalledWith(mockRef.current);
    expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(42);

    vi.useRealTimers();
  });

  it("does not set focus when ref is null", () => {
    vi.useFakeTimers();
    const mockRef = { current: null };

    setFocus(mockRef, 0);
    vi.advanceTimersByTime(0);

    expect(findNodeHandle).not.toHaveBeenCalled();
    expect(
      AccessibilityInfo.setAccessibilityFocus,
    ).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
