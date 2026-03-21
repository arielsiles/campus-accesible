// FR-307: Description generator tests
import { describe, it, expect, vi } from "vitest";
import {
  generateDescription,
  generateFromTemplate,
  generateBatch,
} from "./descriptionGenerator";

import type { SegmentData } from "./descriptionGenerator";

const safeSegment: SegmentData = {
  name: "Medicina → Bus Complutense",
  surfaceType: "paved",
  elevationChange: 0,
  riskLevel: "none",
  riskFactors: [],
};

const riskySegment: SegmentData = {
  name: "Bus Complutense → Metro CU",
  surfaceType: "cobblestone",
  elevationChange: 5,
  riskLevel: "medium",
  riskDescription: "Cruce con tráfico vehicular",
  riskFactors: ["cruce_sin_semaforo", "trafico_vehicular"],
};

const steepSegment: SegmentData = {
  name: "Físicas → Odontología",
  surfaceType: "paved",
  elevationChange: -4,
  riskLevel: "low",
  riskFactors: ["superficie_irregular"],
};

describe("generateFromTemplate [FR-307]", () => {
  it("TST-FR-307-002: generates template description for safe segment", () => {
    const result = generateFromTemplate(safeSegment);
    expect(result).toContain("seguro");
    expect(result.length).toBeLessThan(100);
  });

  it("includes surface type for non-paved segments", () => {
    const result = generateFromTemplate(riskySegment);
    expect(result).toContain("adoquinado");
  });

  it("includes elevation for steep segments", () => {
    const result = generateFromTemplate(steepSegment);
    expect(result.toLowerCase()).toContain("bajada");
    expect(result).toContain("4m");
  });

  it("includes risk factors", () => {
    const result = generateFromTemplate(riskySegment);
    expect(result).toContain("cruce sin semáforo");
  });

  it("limits to 2 risk factors", () => {
    const manyFactors: SegmentData = {
      ...riskySegment,
      riskFactors: [
        "cruce_sin_semaforo",
        "trafico_vehicular",
        "mala_iluminacion",
      ],
    };
    const result = generateFromTemplate(manyFactors);
    // Should only include first 2
    expect(result).toContain("cruce sin semáforo");
    expect(result).toContain("tráfico vehicular");
    expect(result).not.toContain("iluminación");
  });

  it("capitalizes first letter", () => {
    const result = generateFromTemplate(riskySegment);
    expect(result[0]).toBe(result[0].toUpperCase());
  });
});

describe("generateDescription [FR-307]", () => {
  it("TST-FR-307-002: falls back to template when no API key", async () => {
    const result = await generateDescription(safeSegment);
    expect(result.source).toBe("template");
    expect(result.audioDescription).toBeTruthy();
  });

  it("falls back to template when API key is empty string", async () => {
    const result = await generateDescription(safeSegment, "");
    expect(result.source).toBe("template");
  });
});

describe("generateBatch [FR-307]", () => {
  it("generates descriptions for multiple segments", async () => {
    const results = await generateBatch([safeSegment, riskySegment]);
    expect(results).toHaveLength(2);
    expect(results[0].source).toBe("template");
    expect(results[1].source).toBe("template");
    expect(results[0].audioDescription).toBeTruthy();
    expect(results[1].audioDescription).toBeTruthy();
  });
});
