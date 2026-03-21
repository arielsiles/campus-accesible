// FR-401: Mobility assessment service — evaluates physical accessibility of segments

type MobilityBarrier = import("@campus-gps/shared-types").MobilityBarrier;
type MobilityAssessment = import("@campus-gps/shared-types").MobilityAssessment;
type SurfaceQuality = import("@campus-gps/shared-types").SurfaceQuality;

export interface SegmentAccessibilityData {
  segmentId: string;
  hasRamp: boolean;
  hasStairs: boolean;
  pathWidth: number;
  maxSlope: number;
  surfaceQuality: SurfaceQuality;
}

export interface MobilityPreferences {
  avoidStairs: boolean;
  maxSlopePercent: number; // default 8
  minPathWidth: number; // default 1.5m
}

const DEFAULT_PREFERENCES: MobilityPreferences = {
  avoidStairs: true,
  maxSlopePercent: 8,
  minPathWidth: 1.5,
};

/**
 * FR-401: Assess physical accessibility of a route segment
 * TST-FR-401-001: Detects barriers (stairs) in segment
 * TST-FR-401-002: Warns about slope > configurable threshold
 */
export function assessSegment(
  segment: SegmentAccessibilityData,
  preferences: MobilityPreferences = DEFAULT_PREFERENCES
): MobilityAssessment {
  const barriers: MobilityBarrier[] = [];

  // Check for stairs — blocking barrier
  if (segment.hasStairs && preferences.avoidStairs) {
    barriers.push({
      type: "stairs",
      severity: "blocking",
      description: "Sin paso adaptado. Hay escalones en este tramo.",
    });
  }

  // Check slope — warning if over threshold
  if (segment.maxSlope > preferences.maxSlopePercent) {
    barriers.push({
      type: "steep_slope",
      severity: "warning",
      description: `Pendiente pronunciada, ${segment.maxSlope}% de inclinación`,
    });
  }

  // Check path width — warning if narrow
  if (segment.pathWidth < preferences.minPathWidth) {
    barriers.push({
      type: "narrow_path",
      severity: "warning",
      description: `Paso estrecho de ${segment.pathWidth}m (mínimo ${preferences.minPathWidth}m)`,
    });
  }

  // Check surface quality — warning if poor
  if (segment.surfaceQuality === "poor") {
    barriers.push({
      type: "poor_surface",
      severity: "warning",
      description: "Superficie en mal estado",
    });
  }

  return {
    isAccessible: barriers.every((b) => b.severity !== "blocking"),
    barriers,
    segmentId: segment.segmentId,
  };
}

/**
 * Assess multiple segments and return summary
 */
export function assessRoute(
  segments: SegmentAccessibilityData[],
  preferences: MobilityPreferences = DEFAULT_PREFERENCES
): MobilityAssessment[] {
  return segments.map((seg) => assessSegment(seg, preferences));
}

/**
 * Check if any segment in route has blocking barriers
 */
export function hasBlockingBarriers(
  assessments: MobilityAssessment[]
): boolean {
  return assessments.some((a) => !a.isAccessible);
}
