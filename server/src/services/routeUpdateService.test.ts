// TST-FR-506: Route update service tests
import { describe, it, expect } from "vitest";
import { isBlockingType } from "./routeUpdateService";

describe("isBlockingType [FR-506]", () => {
  it("returns true for obras [TST-FR-506-001]", () => {
    expect(isBlockingType("obras")).toBe(true);
  });

  it("returns true for rampa_bloqueada [TST-FR-506-001]", () => {
    expect(isBlockingType("rampa_bloqueada")).toBe(true);
  });

  it("returns true for ascensor_averiado [TST-FR-506-001]", () => {
    expect(isBlockingType("ascensor_averiado")).toBe(true);
  });

  it("returns false for obstaculo_temporal [TST-FR-506-001]", () => {
    expect(isBlockingType("obstaculo_temporal")).toBe(false);
  });

  it("returns false for superficie_danada [TST-FR-506-001]", () => {
    expect(isBlockingType("superficie_danada")).toBe(false);
  });

  it("returns false for otro [TST-FR-506-001]", () => {
    expect(isBlockingType("otro")).toBe(false);
  });
});
