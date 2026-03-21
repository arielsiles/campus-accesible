// FR-302: Audio description service — generates contextual descriptions
// for route segments and waypoints during navigation

import {
  SurfaceType,
  RiskLevel,
  WaypointType,
} from "@campus-gps/shared-types";

type RouteSegmentProperties = import("@campus-gps/shared-types").RouteSegmentProperties;
type WaypointProperties = import("@campus-gps/shared-types").WaypointProperties;
import templates from "../../../../data/audio-descriptions/templates.json";
import { ttsService } from "./ttsService";

export type DescriptionMode = "full" | "reduced";

let currentMode: DescriptionMode = "full";
let lastAnnouncedSegmentId: string | null = null;
let lastAnnouncedWaypointId: string | null = null;

/** FR-302: Generate surface description */
export function describeSurface(surfaceType: SurfaceType): string | null {
  const template = templates.surface[surfaceType];
  return template ?? null;
}

/** FR-302: Generate elevation description */
export function describeElevation(elevationChange: number): string | null {
  const threshold = templates.elevation.threshold;
  if (Math.abs(elevationChange) < threshold) return null;

  const absMeters = Math.abs(elevationChange).toFixed(0);
  if (elevationChange > 0) {
    return templates.elevation.uphill.replace("{meters}", absMeters);
  }
  return templates.elevation.downhill.replace("{meters}", absMeters);
}

/** FR-302: Generate risk description */
export function describeRisk(
  riskLevel: RiskLevel,
  riskDescription?: string,
  riskFactors?: string[],
): string | null {
  if (riskLevel === RiskLevel.None) return null;

  const levelKey = riskLevel as "low" | "medium" | "high";
  const template = templates.risk[levelKey];
  if (!template) return null;

  // Use audioDescription or riskDescription or factor list
  let description = riskDescription ?? "";
  if (!description && riskFactors && riskFactors.length > 0) {
    const factorLabels = riskFactors.map(
      (f) =>
        templates.riskFactors[f as keyof typeof templates.riskFactors] ?? f,
    );
    description = factorLabels.join(", ");
  }

  return template.replace("{description}", description || "zona de precaución");
}

/** FR-302: Generate waypoint description */
export function describeWaypoint(
  waypoint: WaypointProperties,
  direction?: string,
): string {
  const typeKey = waypoint.waypointType as keyof typeof templates.waypoint;
  const template = templates.waypoint[typeKey] ?? "{name}";

  let result = template.replace("{name}", waypoint.name);
  if (direction) {
    result = result.replace("{direction}", direction);
  }
  return result;
}

/** FR-302: Generate full segment description */
export function describeSegment(
  segment: RouteSegmentProperties,
  mode: DescriptionMode = currentMode,
): string[] {
  const descriptions: string[] = [];

  // Risk descriptions always included
  const riskDesc = describeRisk(
    segment.riskLevel,
    segment.riskDescription,
    segment.riskFactors,
  );
  if (riskDesc) descriptions.push(riskDesc);

  // In reduced mode, skip surface and elevation
  if (mode === "full") {
    // Surface description (skip paved — it's the default/expected)
    if (segment.surfaceType !== SurfaceType.Paved) {
      const surfaceDesc = describeSurface(segment.surfaceType);
      if (surfaceDesc) descriptions.push(surfaceDesc);
    }

    // Elevation description
    const elevationDesc = describeElevation(segment.elevationChange);
    if (elevationDesc) descriptions.push(elevationDesc);
  }

  return descriptions;
}

/** FR-302: Announce segment entry — speaks descriptions via TTS */
export async function announceSegmentEntry(
  segment: RouteSegmentProperties,
): Promise<void> {
  // Avoid re-announcing the same segment
  if (segment.segmentId === lastAnnouncedSegmentId) return;
  lastAnnouncedSegmentId = segment.segmentId;

  const descriptions = describeSegment(segment);
  if (descriptions.length === 0) return;

  const fullText = descriptions.join(". ");
  await ttsService.speak(fullText);
}

/** FR-302: Announce waypoint arrival */
export async function announceWaypoint(
  waypoint: WaypointProperties,
  direction?: string,
): Promise<void> {
  if (waypoint.waypointId === lastAnnouncedWaypointId) return;
  lastAnnouncedWaypointId = waypoint.waypointId;

  const description = describeWaypoint(waypoint, direction);
  await ttsService.speak(description);
}

/** Set description mode */
export function setDescriptionMode(mode: DescriptionMode): void {
  currentMode = mode;
}

/** Get current description mode */
export function getDescriptionMode(): DescriptionMode {
  return currentMode;
}

/** Reset announcement tracking (e.g., on new route) */
export function resetAnnouncementState(): void {
  lastAnnouncedSegmentId = null;
  lastAnnouncedWaypointId = null;
}

export const audioDescriptionService = {
  describeSurface,
  describeElevation,
  describeRisk,
  describeWaypoint,
  describeSegment,
  announceSegmentEntry,
  announceWaypoint,
  setDescriptionMode,
  getDescriptionMode,
  resetAnnouncementState,
};
