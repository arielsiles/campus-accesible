// FR-405: Profile-based weight calculation for accessibility routing

export type RoutingProfile =
  | "standard"
  | "visual_disability"
  | "reduced_mobility"
  | "deaf"
  | "easy_read";

export interface ProfileWeightFactors {
  stairsPenalty: number; // multiplier for segments with stairs
  slopePenalty: number; // multiplier per % of slope over threshold
  slopeThreshold: number; // slope % below which no penalty
  narrowPathPenalty: number; // multiplier for paths narrower than threshold
  pathWidthThreshold: number; // meters
  poorSurfacePenalty: number; // multiplier for poor surface
  riskPenalty: Record<string, number>; // by risk level
  tactileBonification: number; // multiplier for tactile surface (< 1 = bonus)
}

// FR-405: Weight factors per profile
const PROFILE_WEIGHT_CONFIGS: Record<RoutingProfile, ProfileWeightFactors> = {
  standard: {
    stairsPenalty: 1.0,
    slopePenalty: 1.0,
    slopeThreshold: 20,
    narrowPathPenalty: 1.0,
    pathWidthThreshold: 0.5,
    poorSurfacePenalty: 1.0,
    riskPenalty: { none: 1.0, low: 1.2, medium: 1.5, high: 2.0 },
    tactileBonification: 1.0,
  },
  visual_disability: {
    stairsPenalty: 1.5,
    slopePenalty: 1.2,
    slopeThreshold: 10,
    narrowPathPenalty: 1.5,
    pathWidthThreshold: 1.2,
    poorSurfacePenalty: 2.0,
    riskPenalty: { none: 1.0, low: 1.5, medium: 2.0, high: 3.0 },
    tactileBonification: 0.5, // bonus for tactile paving
  },
  reduced_mobility: {
    stairsPenalty: 10.0, // TST-FR-405-001: x10 for stairs
    slopePenalty: 3.0, // x3 per % over threshold
    slopeThreshold: 8,
    narrowPathPenalty: 5.0, // x5 for narrow paths
    pathWidthThreshold: 1.5,
    poorSurfacePenalty: 3.0,
    riskPenalty: { none: 1.0, low: 1.2, medium: 1.5, high: 2.0 },
    tactileBonification: 1.0,
  },
  deaf: {
    stairsPenalty: 1.0,
    slopePenalty: 1.0,
    slopeThreshold: 20,
    narrowPathPenalty: 1.0,
    pathWidthThreshold: 0.5,
    poorSurfacePenalty: 1.0,
    riskPenalty: { none: 1.0, low: 1.2, medium: 1.5, high: 2.0 },
    tactileBonification: 1.0,
  },
  easy_read: {
    stairsPenalty: 1.0,
    slopePenalty: 1.0,
    slopeThreshold: 20,
    narrowPathPenalty: 1.0,
    pathWidthThreshold: 0.5,
    poorSurfacePenalty: 1.0,
    riskPenalty: { none: 1.0, low: 1.2, medium: 1.5, high: 2.0 },
    tactileBonification: 1.0,
  },
};

export function getProfileWeights(
  profile: RoutingProfile
): ProfileWeightFactors {
  return PROFILE_WEIGHT_CONFIGS[profile] ?? PROFILE_WEIGHT_CONFIGS.standard;
}

export interface SegmentData {
  hasStairs: boolean;
  maxSlope: number;
  pathWidth: number;
  surfaceQuality: string;
  surfaceType: string;
  riskLevel: string;
}

/**
 * FR-405: Calculate weight multiplier for a segment based on profile
 * TST-FR-405-001: Penalizes stairs x10 for reduced_mobility
 */
export function calculateProfileMultiplier(
  segment: SegmentData,
  profile: RoutingProfile
): number {
  const config = getProfileWeights(profile);
  let multiplier = 1.0;

  // Stairs penalty
  if (segment.hasStairs) {
    multiplier *= config.stairsPenalty;
  }

  // Slope penalty (per % over threshold)
  if (segment.maxSlope > config.slopeThreshold) {
    const excess = segment.maxSlope - config.slopeThreshold;
    multiplier *= 1 + excess * (config.slopePenalty - 1) * 0.1;
  }

  // Narrow path penalty
  if (segment.pathWidth < config.pathWidthThreshold) {
    multiplier *= config.narrowPathPenalty;
  }

  // Poor surface penalty
  if (segment.surfaceQuality === "poor") {
    multiplier *= config.poorSurfacePenalty;
  }

  // Risk level penalty
  const riskMultiplier = config.riskPenalty[segment.riskLevel] ?? 1.0;
  multiplier *= riskMultiplier;

  // Tactile surface bonification
  if (segment.surfaceType === "tactile") {
    multiplier *= config.tactileBonification;
  }

  return multiplier;
}

/**
 * Apply profile-based weight adjustment to a base weight
 */
export function applyProfileWeight(
  baseWeight: number,
  segment: SegmentData,
  profile: RoutingProfile
): number {
  return baseWeight * calculateProfileMultiplier(segment, profile);
}
