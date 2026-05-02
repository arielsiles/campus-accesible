// FR-1201: OCR text utility tests
import { describe, it, expect } from "vitest";
import { cleanRecognizedText, isMeaningfulText } from "./ocrTextUtils";

describe("cleanRecognizedText [FR-1201]", () => {
  it("collapses multiple whitespace", () => {
    expect(cleanRecognizedText("Hola    mundo")).toBe("Hola mundo");
  });

  it("removes single-char noise lines", () => {
    expect(cleanRecognizedText("FARMACIA\nA\n8 a 22h")).toBe("FARMACIA 8 a 22h");
  });

  it("strips leading/trailing punctuation", () => {
    expect(cleanRecognizedText("  ::: HOSPITAL :::  ")).toBe("HOSPITAL");
  });

  it("returns empty for empty input", () => {
    expect(cleanRecognizedText("")).toBe("");
  });

  it("preserves accented characters", () => {
    expect(cleanRecognizedText("Árbol de higo")).toBe("Árbol de higo");
  });
});

describe("isMeaningfulText [FR-1201]", () => {
  it("rejects very short strings", () => {
    expect(isMeaningfulText("ok")).toBe(false);
    expect(isMeaningfulText("")).toBe(false);
  });

  it("accepts strings with at least one 3+ letter word", () => {
    expect(isMeaningfulText("FARMACIA")).toBe(true);
    expect(isMeaningfulText("Hola")).toBe(true);
  });

  it("rejects strings of only digits and short tokens", () => {
    expect(isMeaningfulText("12 34 5")).toBe(false);
  });

  it("accepts mixed text with numbers", () => {
    expect(isMeaningfulText("HORARIO 8 a 22h")).toBe(true);
  });
});
