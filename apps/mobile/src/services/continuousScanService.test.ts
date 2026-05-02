// FR-1105: continuousScanService tests
import { describe, it, expect } from "vitest";
import {
  detectSignificantChange,
  mapResultToIncidentType,
} from "./continuousScanService";
import type { VisionDescribeResponse } from "./visionService";

const baseResult: VisionDescribeResponse = {
  description: "Camino pavimentado recto",
  obstacles: [],
  surface: "paved",
  riskLevel: "none",
  suggestions: [],
  confidence: 0.8,
  source: "ai",
};

describe("detectSignificantChange [FR-1105]", () => {
  it("first scan is always significant", () => {
    const result = detectSignificantChange(baseResult, null);
    expect(result.isSignificant).toBe(true);
    expect(result.reason).toBe("first_scan");
  });

  it("escalating risk is significant", () => {
    const prev = { ...baseResult, riskLevel: "low" as const };
    const curr = { ...baseResult, riskLevel: "high" as const };
    const result = detectSignificantChange(curr, prev);
    expect(result.isSignificant).toBe(true);
    expect(result.reason).toBe("risk_escalated");
  });

  it("risk going down is NOT significant", () => {
    const prev = { ...baseResult, riskLevel: "high" as const };
    const curr = { ...baseResult, riskLevel: "low" as const };
    const result = detectSignificantChange(curr, prev);
    expect(result.isSignificant).toBe(false);
  });

  it("new obstacle is significant", () => {
    const prev = { ...baseResult, obstacles: [] };
    const curr = { ...baseResult, obstacles: ["bordillo a 5m"] };
    const result = detectSignificantChange(curr, prev);
    expect(result.isSignificant).toBe(true);
    expect(result.reason).toBe("new_obstacle");
    expect(result.announcement).toContain("bordillo");
  });

  it("same obstacles are NOT significant", () => {
    const prev = { ...baseResult, obstacles: ["bordillo a 5m"] };
    const curr = { ...baseResult, obstacles: ["bordillo a 5m"] };
    const result = detectSignificantChange(curr, prev);
    expect(result.isSignificant).toBe(false);
  });

  it("surface change is significant", () => {
    const prev = { ...baseResult, surface: "paved" };
    const curr = { ...baseResult, surface: "cobblestone" };
    const result = detectSignificantChange(curr, prev);
    expect(result.isSignificant).toBe(true);
    expect(result.reason).toBe("surface_changed");
  });

  it("identical scans are NOT significant", () => {
    const result = detectSignificantChange(baseResult, baseResult);
    expect(result.isSignificant).toBe(false);
    expect(result.reason).toBe("no_change");
  });
});

describe("mapResultToIncidentType [FR-1105]", () => {
  it("detects obras from description", () => {
    expect(
      mapResultToIncidentType({ ...baseResult, description: "Obras en la acera" })
    ).toBe("obras");
  });

  it("detects damaged surface", () => {
    expect(
      mapResultToIncidentType({
        ...baseResult,
        description: "Hay baldosas sueltas",
      })
    ).toBe("superficie_danada");
  });

  it("detects ramp issue", () => {
    expect(
      mapResultToIncidentType({
        ...baseResult,
        description: "Bordillo sin rampa",
      })
    ).toBe("rampa_bloqueada");
  });

  it("detects temporary obstacle", () => {
    expect(
      mapResultToIncidentType({
        ...baseResult,
        obstacles: ["paso bloqueado"],
      })
    ).toBe("obstaculo_temporal");
  });

  it("falls back to otro for unrecognized", () => {
    expect(
      mapResultToIncidentType({
        ...baseResult,
        description: "Camino normal",
      })
    ).toBe("otro");
  });
});
