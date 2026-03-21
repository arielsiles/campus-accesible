// FR-304: Risk assessment types tests
import { describe, it, expect } from "vitest";
import { RISK_FACTOR_LABELS } from "./risk";
import type { RiskFactor, RiskAssessment } from "./risk";

describe("Risk types [FR-304]", () => {
  it("RISK_FACTOR_LABELS has Spanish labels for all factors", () => {
    const expectedFactors: RiskFactor[] = [
      "cruce_sin_semaforo",
      "mala_iluminacion",
      "superficie_irregular",
      "pendiente_pronunciada",
      "trafico_vehicular",
      "obras_temporales",
      "escalones",
      "sin_barandilla",
      "paso_estrecho",
    ];

    for (const factor of expectedFactors) {
      expect(RISK_FACTOR_LABELS[factor]).toBeDefined();
      expect(typeof RISK_FACTOR_LABELS[factor]).toBe("string");
      expect(RISK_FACTOR_LABELS[factor].length).toBeGreaterThan(0);
    }

    expect(Object.keys(RISK_FACTOR_LABELS)).toHaveLength(expectedFactors.length);
  });

  it("RiskAssessment interface accepts valid risk data", () => {
    const assessment: RiskAssessment = {
      level: "medium",
      description: "Cruce con tráfico moderado",
      factors: ["cruce_sin_semaforo", "trafico_vehicular"],
    };

    expect(assessment.level).toBe("medium");
    expect(assessment.factors).toHaveLength(2);
    expect(assessment.description).toContain("tráfico");
  });

  it("RiskAssessment accepts empty factors for no-risk segments", () => {
    const assessment: RiskAssessment = {
      level: "none",
      description: "",
      factors: [],
    };

    expect(assessment.level).toBe("none");
    expect(assessment.factors).toHaveLength(0);
  });

  it("RISK_FACTOR_LABELS values are in Spanish", () => {
    expect(RISK_FACTOR_LABELS.cruce_sin_semaforo).toBe("Cruce sin semáforo");
    expect(RISK_FACTOR_LABELS.mala_iluminacion).toBe("Mala iluminación");
    expect(RISK_FACTOR_LABELS.pendiente_pronunciada).toBe("Pendiente pronunciada");
  });
});
