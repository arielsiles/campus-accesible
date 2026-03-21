// FR-204: Navigation instruction management service
import { haversineDistance } from "./snapToRouteService";
import type {
  NavigationInstruction,
  WaypointSummary,
} from "@campus-gps/shared-types";

const WAYPOINT_TRIGGER_RADIUS_M = 15; // NFR-203: instruction trigger distance
const ARRIVAL_RADIUS_M = 10; // NFR-203: destination arrival distance

/**
 * Check if the user should receive the next instruction.
 * Triggered when within 15m of the next waypoint.
 */
export function shouldTriggerNext(
  gpsPosition: [number, number],
  nextWaypoint: WaypointSummary
): boolean {
  const distance = haversineDistance(gpsPosition, nextWaypoint.coordinates);
  return distance <= WAYPOINT_TRIGGER_RADIUS_M;
}

/**
 * Detect if the user has arrived at the final destination.
 * Triggered when within 10m of the final waypoint.
 */
export function detectArrival(
  gpsPosition: [number, number],
  destination: WaypointSummary
): boolean {
  const distance = haversineDistance(gpsPosition, destination.coordinates);
  return distance <= ARRIVAL_RADIUS_M;
}

/**
 * Get the current instruction index based on GPS position and waypoints.
 * Advances through instructions as the user reaches each waypoint.
 */
export function getCurrentInstructionIndex(
  gpsPosition: [number, number],
  waypoints: WaypointSummary[],
  currentIndex: number
): number {
  // Check if we should advance to the next instruction
  for (let i = currentIndex; i < waypoints.length - 1; i++) {
    const nextWp = waypoints[i + 1];
    if (shouldTriggerNext(gpsPosition, nextWp)) {
      return i + 1;
    }
  }
  return currentIndex;
}

/**
 * Calculate navigation progress as a percentage.
 */
export function calculateProgress(
  currentInstructionIndex: number,
  totalInstructions: number
): number {
  if (totalInstructions <= 1) return 100;
  return Math.round(
    (currentInstructionIndex / (totalInstructions - 1)) * 100
  );
}
