// FR-402: Easy-read adapter tests
import { describe, it, expect } from "vitest";
import { simplifyLocally, simplifyInstruction } from "./easyReadAdapter";

describe("easyReadAdapter [FR-402]", () => {
  it("simplifies 'Sal de' instruction", () => {
    const result = simplifyLocally(
      "Sal de Facultad de Medicina y camina hacia Odontología",
      "navigation"
    );

    expect(result).toContain("Sal de Facultad de Medicina");
    expect(result).toContain("Ve a Odontología");
  });

  it("simplifies 'Continúa recto' instruction", () => {
    const result = simplifyLocally(
      "Continúa recto hasta Facultad de Farmacia",
      "navigation"
    );

    expect(result).toContain("Camina recto");
    expect(result).toContain("Ve a Facultad de Farmacia");
  });

  it("simplifies turn instruction", () => {
    const result = simplifyLocally(
      "Gira a la izquierda hacia Biblioteca Central",
      "navigation"
    );

    expect(result).toContain("Gira a la izquierda");
    expect(result).toContain("Ve a Biblioteca Central");
  });

  it("simplifies arrival instruction", () => {
    const result = simplifyLocally(
      "Has llegado a tu destino: Metro Ciudad Universitaria",
      "navigation"
    );

    expect(result).toContain("Ya llegaste");
    expect(result).toContain("Metro Ciudad Universitaria");
  });

  it("TST-FR-402-003: simplified sentences have ≤ 10 words", () => {
    const instructions = [
      "Sal de Facultad de Medicina y camina hacia Odontología",
      "Continúa recto hasta Facultad de Farmacia",
      "Gira a la derecha hacia Metro Ciudad Universitaria",
      "Has llegado a tu destino: Facultad de Derecho",
    ];

    for (const instruction of instructions) {
      const result = simplifyLocally(instruction, "navigation");
      const sentences = result
        .split(".")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const sentence of sentences) {
        const wordCount = sentence.split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(10);
      }
    }
  });

  it("simplifyInstruction is a convenience wrapper", () => {
    const result = simplifyInstruction(
      "Continúa recto hasta Facultad de Farmacia"
    );

    expect(result).toContain("Camina recto");
  });

  it("splits general text at conjunctions", () => {
    const result = simplifyLocally(
      "Camino pavimentado y buena iluminación",
      "general"
    );

    expect(result).toContain(".");
  });
});
