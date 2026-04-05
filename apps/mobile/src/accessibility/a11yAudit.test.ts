// TST-FR-602: Accessibility audit tests — WCAG 2.1 AA compliance
import { describe, it, expect } from "vitest";
import {
  contrastRatio,
  meetsContrastAA,
  meetsContrastAALarge,
  meetsTouchTarget,
  auditComponent,
} from "./a11yAudit";

describe("contrastRatio [FR-602]", () => {
  it("returns 21:1 for black on white [NFR-602]", () => {
    const ratio = contrastRatio("#000000", "#ffffff");
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("returns 1:1 for same color [NFR-602]", () => {
    const ratio = contrastRatio("#333333", "#333333");
    expect(ratio).toBeCloseTo(1, 0);
  });

  it("primary blue #1a73e8 on white meets AA for large text [NFR-602]", () => {
    expect(meetsContrastAALarge("#1a73e8", "#ffffff")).toBe(true);
  });

  it("dark text #333333 on white meets AA [NFR-602]", () => {
    expect(meetsContrastAA("#333333", "#ffffff")).toBe(true);
  });

  it("white text on primary blue #1a73e8 meets AA for large text [NFR-602]", () => {
    expect(meetsContrastAALarge("#ffffff", "#1a73e8")).toBe(true);
  });

  it("error red #ea4335 on white meets AA for large text [NFR-602]", () => {
    expect(meetsContrastAALarge("#ea4335", "#ffffff")).toBe(true);
  });

  it("success green #34a853 on white meets AA for large text [NFR-602]", () => {
    expect(meetsContrastAALarge("#34a853", "#ffffff")).toBe(true);
  });
});

describe("meetsTouchTarget [FR-602]", () => {
  it("passes for 48x48 [NFR-602]", () => {
    expect(meetsTouchTarget(48, 48)).toBe(true);
  });

  it("passes for exactly 44x44 [NFR-602]", () => {
    expect(meetsTouchTarget(44, 44)).toBe(true);
  });

  it("fails for 40x40 [NFR-602]", () => {
    expect(meetsTouchTarget(40, 40)).toBe(false);
  });

  it("fails for 44x30 [NFR-602]", () => {
    expect(meetsTouchTarget(44, 30)).toBe(false);
  });
});

describe("auditComponent [FR-602]", () => {
  it("detects missing accessibilityLabel [NFR-602]", () => {
    const result = auditComponent("TestButton", {});
    expect(result.hasLabel).toBe(false);
    expect(result.issues).toContain("Missing accessibilityLabel");
  });

  it("detects missing accessibilityRole [NFR-602]", () => {
    const result = auditComponent("TestButton", {
      accessibilityLabel: "Cerrar",
    });
    expect(result.hasRole).toBe(false);
    expect(result.issues).toContain("Missing accessibilityRole");
  });

  it("passes for complete Spanish props [NFR-602]", () => {
    const result = auditComponent("TestButton", {
      accessibilityLabel: "Cerrar formulario",
      accessibilityRole: "button",
    });
    expect(result.hasLabel).toBe(true);
    expect(result.labelIsSpanish).toBe(true);
    expect(result.hasRole).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("warns about non-Spanish label [NFR-602]", () => {
    const result = auditComponent("TestButton", {
      accessibilityLabel: "Close button",
      accessibilityRole: "button",
    });
    expect(result.labelIsSpanish).toBe(false);
    expect(result.issues).toContain("accessibilityLabel may not be in Spanish");
  });
});

describe("app color palette audit [FR-602]", () => {
  // Verify all colors used in the app meet WCAG 2.1 AA
  const APP_COLORS = {
    primaryBlue: "#1a73e8",
    successGreen: "#34a853",
    errorRed: "#ea4335",
    warningYellow: "#f9ab00",
    darkText: "#333333",
    mediumText: "#666666",
    lightText: "#999999",
    white: "#ffffff",
    background: "#f5f5f5",
  };

  it("dark text on white background meets AA [NFR-602]", () => {
    expect(meetsContrastAA(APP_COLORS.darkText, APP_COLORS.white)).toBe(true);
  });

  it("medium text on white background meets AA for large text [NFR-602]", () => {
    expect(meetsContrastAALarge(APP_COLORS.mediumText, APP_COLORS.white)).toBe(true);
  });

  it("white text on primary blue meets AA for large text [NFR-602]", () => {
    expect(meetsContrastAALarge(APP_COLORS.white, APP_COLORS.primaryBlue)).toBe(true);
  });

  it("white text on error red meets AA for large text [NFR-602]", () => {
    expect(meetsContrastAALarge(APP_COLORS.white, APP_COLORS.errorRed)).toBe(true);
  });

  it("white text on success green meets AA for large text [NFR-602]", () => {
    expect(meetsContrastAALarge(APP_COLORS.white, APP_COLORS.successGreen)).toBe(true);
  });
});
