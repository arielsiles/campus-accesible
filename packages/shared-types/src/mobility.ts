// FR-401: Physical accessibility types for reduced mobility profile

export type SurfaceQuality = "good" | "fair" | "poor";

export interface PhysicalAccessibility {
  hasRamp: boolean;
  hasStairs: boolean;
  pathWidth: number; // meters
  maxSlope: number; // percentage (0-100)
  surfaceQuality: SurfaceQuality;
}

// FR-401: Mobility barrier assessment result
export interface MobilityBarrier {
  type: "stairs" | "steep_slope" | "narrow_path" | "poor_surface";
  severity: "warning" | "blocking";
  description: string;
}

export interface MobilityAssessment {
  isAccessible: boolean;
  barriers: MobilityBarrier[];
  segmentId: string;
}

// FR-401: Labels in Spanish for UI
export const MOBILITY_BARRIER_LABELS: Record<MobilityBarrier["type"], string> =
  {
    stairs: "Escalones",
    steep_slope: "Pendiente pronunciada",
    narrow_path: "Paso estrecho",
    poor_surface: "Superficie en mal estado",
  };

export const SURFACE_QUALITY_LABELS: Record<SurfaceQuality, string> = {
  good: "Buena",
  fair: "Regular",
  poor: "Mala",
};
