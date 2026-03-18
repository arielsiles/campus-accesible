// TST-FR-201-001, TST-FR-201-002: Graph builder tests
import { describe, it, expect } from "vitest";
import { haversineDistance, calculateWeight } from "./graphBuilder";

describe("graphBuilder", () => {
  describe("haversineDistance", () => {
    it("calculates distance between two coordinates [FR-201]", () => {
      // Medicina to Odontología (~142m real-world)
      const medicina: [number, number] = [-3.7267, 40.4489];
      const odontologia: [number, number] = [-3.7258, 40.4479];

      const distance = haversineDistance(medicina, odontologia);

      // Should be approximately 130-160m
      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(200);
    });

    it("returns 0 for identical coordinates [FR-201]", () => {
      const point: [number, number] = [-3.7267, 40.4489];
      expect(haversineDistance(point, point)).toBe(0);
    });

    it("calculates longer distance for farther points [FR-201]", () => {
      const medicina: [number, number] = [-3.7267, 40.4489];
      const odontologia: [number, number] = [-3.7258, 40.4479];
      const metroCU: [number, number] = [-3.7302, 40.4449];

      const shortDist = haversineDistance(medicina, odontologia);
      const longDist = haversineDistance(medicina, metroCU);

      expect(longDist).toBeGreaterThan(shortDist);
    });
  });

  describe("calculateWeight [TST-FR-201-002]", () => {
    it("returns distance as base weight with no elevation or risk", () => {
      const weight = calculateWeight(100, 0, "none");
      // 100m * 1.0 risk = 100
      expect(weight).toBe(100);
    });

    it("increases weight with elevation change", () => {
      const flat = calculateWeight(100, 0, "none");
      const uphill = calculateWeight(100, 5, "none");

      // 5m elevation * 1.5 penalty = 7.5 extra, so (100 + 7.5) * 1.0 = 107.5
      expect(uphill).toBeGreaterThan(flat);
      expect(uphill).toBeCloseTo(107.5, 1);
    });

    it("increases weight for negative elevation (downhill)", () => {
      const flat = calculateWeight(100, 0, "none");
      const downhill = calculateWeight(100, -5, "none");

      // abs(-5) * 1.5 = 7.5 penalty
      expect(downhill).toBeGreaterThan(flat);
    });

    it("applies risk multiplier for high-risk segments [FR-201]", () => {
      const safe = calculateWeight(100, 0, "none");
      const risky = calculateWeight(100, 0, "high");

      // 100 * 2.0 = 200
      expect(risky).toBe(200);
      expect(risky).toBeGreaterThan(safe);
    });

    it("combines elevation and risk penalties [FR-201]", () => {
      // distance=100, elevation=5m, risk=medium
      // (100 + 5*1.5) * 1.5 = (100 + 7.5) * 1.5 = 161.25
      const weight = calculateWeight(100, 5, "medium");
      expect(weight).toBeCloseTo(161.25, 1);
    });

    it("accepts custom weight factors", () => {
      const customFactors = {
        elevationPenalty: 3.0,
        riskPenalty: { none: 1.0, high: 5.0 },
      };

      const weight = calculateWeight(100, 2, "high", customFactors);
      // (100 + 2*3.0) * 5.0 = 106 * 5 = 530
      expect(weight).toBeCloseTo(530, 1);
    });
  });
});
