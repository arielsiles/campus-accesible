// FR-402: Easy-read service tests
import { describe, it, expect } from "vitest";
import { simplifyFromTemplate, simplifyText } from "./easyReadService";

describe("easyReadService [FR-402]", () => {
  it("TST-FR-402-002: simplifies navigation instruction with template", () => {
    const result = simplifyFromTemplate(
      "Continúa recto por la Avenida Complutense durante 135 metros",
      "navigation"
    );

    expect(result).toContain("Camina recto");
    expect(result).toContain("135 metros");
  });

  it("simplifies turn instruction", () => {
    const result = simplifyFromTemplate(
      "Gira a la izquierda hacia Facultad de Derecho",
      "navigation"
    );

    expect(result).toContain("Gira a la izquierda");
    expect(result).toContain("Derecho");
  });

  it("simplifies arrival instruction", () => {
    const result = simplifyFromTemplate(
      "Has llegado a tu destino: Facultad de Medicina",
      "navigation"
    );

    expect(result).toContain("Ya llegaste");
  });

  it("simplifies risk descriptions", () => {
    const result = simplifyFromTemplate(
      "Precaución: cruce sin semáforo con tráfico vehicular",
      "risk"
    );

    expect(result).toContain("Cuidado");
    expect(result).toContain("cruce");
    expect(result).toContain("semáforo");
  });

  it("simplifies general text by splitting at conjunctions", () => {
    const result = simplifyFromTemplate(
      "Camino pavimentado con descenso y buena iluminación",
      "general"
    );

    expect(result).toContain(".");
    // Should split at "y"
    expect(result.split(".").length).toBeGreaterThan(1);
  });

  it("TST-FR-402-003: template result has short sentences", () => {
    const result = simplifyFromTemplate(
      "Continúa recto por la Avenida Complutense durante 135 metros",
      "navigation"
    );

    // Each sentence should be <= 10 words
    const sentences = result
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const sentence of sentences) {
      const wordCount = sentence.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(10);
    }
  });

  it("TST-FR-402-002: uses template when API key is not provided", async () => {
    const result = await simplifyText(
      "Continúa recto durante 100 metros",
      "navigation"
    );

    expect(result.source).toBe("template");
    expect(result.original).toBe("Continúa recto durante 100 metros");
    expect(result.simplified).toContain("Camina recto");
  });

  it("returns both original and simplified text", async () => {
    const original = "Gira a la derecha hacia la biblioteca";
    const result = await simplifyText(original, "navigation");

    expect(result.original).toBe(original);
    expect(result.simplified).toBeTruthy();
    expect(result.source).toBe("template");
  });
});
