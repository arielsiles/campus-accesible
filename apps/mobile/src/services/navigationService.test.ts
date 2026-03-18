// TST-FR-204-001, TST-FR-204-002, TST-FR-204-003: Navigation service tests
import { describe, it, expect } from "vitest";
import {
  shouldTriggerNext,
  detectArrival,
  getCurrentInstructionIndex,
  calculateProgress,
} from "./navigationService";
import type { WaypointSummary } from "@campus-gps/shared-types";

const medicina: WaypointSummary = {
  waypointId: "wp-medicina",
  name: "Facultad de Medicina",
  waypointType: "building",
  coordinates: [-3.7267, 40.4489],
};

const odontologia: WaypointSummary = {
  waypointId: "wp-odontologia",
  name: "Facultad de Odontología",
  waypointType: "intersection",
  coordinates: [-3.7258, 40.4479],
};

const metroCU: WaypointSummary = {
  waypointId: "wp-metro-cu",
  name: "Metro Ciudad Universitaria",
  waypointType: "transport_stop",
  coordinates: [-3.7302, 40.4449],
};

const testWaypoints: WaypointSummary[] = [medicina, odontologia, metroCU];

describe("navigationService", () => {
  describe("shouldTriggerNext [TST-FR-204-002]", () => {
    it("returns true when within 15m of waypoint", () => {
      // Position very close to Odontología
      const gps: [number, number] = [-3.7258, 40.4479];
      expect(shouldTriggerNext(gps, odontologia)).toBe(true);
    });

    it("returns false when far from waypoint", () => {
      // Position at Medicina, checking for Odontología (~140m away)
      const gps: [number, number] = [-3.7267, 40.4489];
      expect(shouldTriggerNext(gps, odontologia)).toBe(false);
    });

    it("returns true at exactly the waypoint position", () => {
      expect(
        shouldTriggerNext(odontologia.coordinates, odontologia)
      ).toBe(true);
    });
  });

  describe("detectArrival [TST-FR-204-003]", () => {
    it("returns true when within 10m of destination", () => {
      // Exactly at Metro CU
      const gps: [number, number] = [-3.7302, 40.4449];
      expect(detectArrival(gps, metroCU)).toBe(true);
    });

    it("returns false when far from destination", () => {
      // At Medicina, checking for Metro CU
      const gps: [number, number] = [-3.7267, 40.4489];
      expect(detectArrival(gps, metroCU)).toBe(false);
    });
  });

  describe("getCurrentInstructionIndex [TST-FR-204-001]", () => {
    it("stays at current index when far from next waypoint", () => {
      const gps: [number, number] = [-3.7265, 40.4487]; // Near Medicina
      const result = getCurrentInstructionIndex(gps, testWaypoints, 0);
      expect(result).toBe(0);
    });

    it("advances when reaching next waypoint", () => {
      const gps: [number, number] = [-3.7258, 40.4479]; // At Odontología
      const result = getCurrentInstructionIndex(gps, testWaypoints, 0);
      expect(result).toBe(1);
    });

    it("does not go backwards", () => {
      const gps: [number, number] = [-3.7267, 40.4489]; // At Medicina
      const result = getCurrentInstructionIndex(gps, testWaypoints, 1);
      expect(result).toBe(1);
    });
  });

  describe("calculateProgress", () => {
    it("returns 0% at start", () => {
      expect(calculateProgress(0, 4)).toBe(0);
    });

    it("returns 100% at last instruction", () => {
      expect(calculateProgress(3, 4)).toBe(100);
    });

    it("returns 50% at midpoint", () => {
      expect(calculateProgress(1, 3)).toBe(50);
    });

    it("returns 100% for single instruction", () => {
      expect(calculateProgress(0, 1)).toBe(100);
    });
  });
});
