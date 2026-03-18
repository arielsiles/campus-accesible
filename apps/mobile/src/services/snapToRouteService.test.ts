// TST-FR-203-001, TST-FR-203-002: Snap-to-route service tests
import { describe, it, expect } from "vitest";
import {
  haversineDistance,
  projectPointToSegment,
  snapToRoute,
} from "./snapToRouteService";

// Test segment: roughly Medicina → Odontología
const segMedOdonto: [number, number][] = [
  [-3.7267, 40.4489], // Medicina
  [-3.7258, 40.4479], // Odontología
];

// Test segment: Odontología → Farmacia
const segOdontoFarm: [number, number][] = [
  [-3.7258, 40.4479], // Odontología
  [-3.7271, 40.4471], // Farmacia
];

const testSegments: [number, number][][] = [segMedOdonto, segOdontoFarm];

describe("snapToRouteService", () => {
  describe("haversineDistance", () => {
    it("returns 0 for same point", () => {
      expect(haversineDistance([-3.7267, 40.4489], [-3.7267, 40.4489])).toBe(0);
    });

    it("calculates approximate distance between known points", () => {
      const dist = haversineDistance([-3.7267, 40.4489], [-3.7258, 40.4479]);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(200);
    });
  });

  describe("projectPointToSegment", () => {
    it("projects onto midpoint of segment", () => {
      // Point above the midpoint of segment
      const result = projectPointToSegment(
        [-3.72625, 40.4490],
        [-3.7267, 40.4489],
        [-3.7258, 40.4479]
      );
      // Should be somewhere between start and end
      expect(result[0]).toBeGreaterThan(-3.7267);
      expect(result[0]).toBeLessThan(-3.7258);
    });

    it("clamps to start when point is before segment", () => {
      const result = projectPointToSegment(
        [-3.728, 40.450], // way before start
        [-3.7267, 40.4489],
        [-3.7258, 40.4479]
      );
      expect(result).toEqual([-3.7267, 40.4489]);
    });

    it("clamps to end when point is past segment", () => {
      const result = projectPointToSegment(
        [-3.724, 40.446], // way past end
        [-3.7267, 40.4489],
        [-3.7258, 40.4479]
      );
      expect(result).toEqual([-3.7258, 40.4479]);
    });

    it("returns segment start for degenerate (zero-length) segment", () => {
      const result = projectPointToSegment(
        [-3.726, 40.449],
        [-3.7267, 40.4489],
        [-3.7267, 40.4489]
      );
      expect(result).toEqual([-3.7267, 40.4489]);
    });
  });

  describe("snapToRoute [TST-FR-203-001]", () => {
    it("snaps GPS position to nearest point on route", () => {
      // Position slightly off the first segment
      const gps: [number, number] = [-3.7264, 40.4486];
      const result = snapToRoute(gps, testSegments);

      expect(result.snappedPosition).toBeDefined();
      expect(result.distanceToRoute).toBeGreaterThan(0);
      expect(result.distanceToRoute).toBeLessThan(50);
      expect(result.segmentIndex).toBe(0);
    });

    it("reports isOnRoute=true when within threshold [TST-FR-203-001]", () => {
      // Position very close to route (within 30m)
      const gps: [number, number] = [-3.7263, 40.4485];
      const result = snapToRoute(gps, testSegments);

      expect(result.isOnRoute).toBe(true);
      expect(result.distanceToRoute).toBeLessThan(30);
    });

    it("reports isOnRoute=false when beyond threshold [TST-FR-203-002]", () => {
      // Position far from route (> 30m)
      const gps: [number, number] = [-3.7200, 40.4500];
      const result = snapToRoute(gps, testSegments);

      expect(result.isOnRoute).toBe(false);
      expect(result.distanceToRoute).toBeGreaterThan(30);
    });

    it("snaps to second segment when closer", () => {
      // Position near second segment (Odontología → Farmacia)
      const gps: [number, number] = [-3.7265, 40.4474];
      const result = snapToRoute(gps, testSegments);

      expect(result.segmentIndex).toBe(1);
    });

    it("returns progressAlongSegment between 0 and 1", () => {
      const gps: [number, number] = [-3.7263, 40.4484];
      const result = snapToRoute(gps, testSegments);

      expect(result.progressAlongSegment).toBeGreaterThanOrEqual(0);
      expect(result.progressAlongSegment).toBeLessThanOrEqual(1);
    });

    it("uses custom threshold", () => {
      const gps: [number, number] = [-3.7250, 40.4490];
      const distToRoute = haversineDistance(gps, [-3.7258, 40.4479]);

      // With very large threshold, should be on route
      const result1 = snapToRoute(gps, testSegments, 1000);
      expect(result1.isOnRoute).toBe(true);

      // With very small threshold, should be off route
      const result2 = snapToRoute(gps, testSegments, 1);
      expect(result2.isOnRoute).toBe(false);
    });
  });
});
