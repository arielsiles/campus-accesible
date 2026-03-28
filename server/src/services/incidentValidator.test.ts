// TST-FR-503: Incident validation service tests
import { describe, it, expect } from "vitest";
import { validateFromTemplate, validateIncident } from "./incidentValidator";

const validInput = {
  type: "obras",
  title: "Obras en la acera",
  description: "Hay obras de reparación que bloquean el paso peatonal cerca de Medicina",
  latitude: 40.4475,
  longitude: -3.7265,
};

describe("validateFromTemplate [FR-503]", () => {
  it("rejects out-of-bounds coordinates [TST-FR-503-001]", () => {
    const result = validateFromTemplate({
      ...validInput,
      latitude: 41.0, // Outside CU bounds
      longitude: -3.7,
    });

    expect(result.plausible).toBe(false);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.reason).toContain("fuera del campus");
    expect(result.source).toBe("template");
  });

  it("rejects spam patterns [TST-FR-503-002]", () => {
    const result = validateFromTemplate({
      ...validInput,
      title: "aaaaaaaaaa",
      description: "bbbbbbbbbbbbbbb",
    });

    expect(result.plausible).toBe(false);
    expect(result.reason).toContain("spam");
  });

  it("rejects URLs in content [TST-FR-503-002]", () => {
    const result = validateFromTemplate({
      ...validInput,
      description: "Mira esto https://spam.com compra ahora",
    });

    expect(result.plausible).toBe(false);
    expect(result.reason).toContain("spam");
  });

  it("rejects identical title and description [FR-503]", () => {
    const result = validateFromTemplate({
      ...validInput,
      title: "Obras en la acera",
      description: "Obras en la acera",
    });

    expect(result.plausible).toBe(false);
    expect(result.reason).toContain("idénticos");
  });

  it("accepts plausible incident [TST-FR-503-003]", () => {
    const result = validateFromTemplate(validInput);

    expect(result.plausible).toBe(true);
    expect(result.confidence).toBe(0.5);
    expect(result.source).toBe("template");
  });
});

describe("validateIncident [FR-503]", () => {
  it("uses template when no API key provided [TST-FR-503-004]", async () => {
    const result = await validateIncident(validInput);

    expect(result.source).toBe("template");
    expect(result.plausible).toBe(true);
  });

  it("returns source 'template' without API key [TST-FR-503-005]", async () => {
    const result = await validateIncident(validInput, undefined);

    expect(result.source).toBe("template");
  });

  it("rejects out-of-bounds even via main function [FR-503]", async () => {
    const result = await validateIncident({
      ...validInput,
      latitude: 39.0,
    });

    expect(result.plausible).toBe(false);
    expect(result.source).toBe("template");
  });
});
