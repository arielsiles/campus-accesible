// FR-401: Mobility types tests
import { describe, it, expect } from "vitest";
import { MOBILITY_BARRIER_LABELS, SURFACE_QUALITY_LABELS } from "./mobility";

describe("mobility types [FR-401]", () => {
  it("has Spanish labels for all barrier types", () => {
    expect(MOBILITY_BARRIER_LABELS.stairs).toBe("Escalones");
    expect(MOBILITY_BARRIER_LABELS.steep_slope).toBe("Pendiente pronunciada");
    expect(MOBILITY_BARRIER_LABELS.narrow_path).toBe("Paso estrecho");
    expect(MOBILITY_BARRIER_LABELS.poor_surface).toBe(
      "Superficie en mal estado"
    );
  });

  it("has Spanish labels for all surface qualities", () => {
    expect(SURFACE_QUALITY_LABELS.good).toBe("Buena");
    expect(SURFACE_QUALITY_LABELS.fair).toBe("Regular");
    expect(SURFACE_QUALITY_LABELS.poor).toBe("Mala");
  });
});
