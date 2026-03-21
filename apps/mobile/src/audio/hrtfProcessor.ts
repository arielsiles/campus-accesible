// FR-301: HRTF (Head-Related Transfer Function) processor
// Calculates stereo panning and volume based on relative angle

export interface HRTFOutput {
  /** Left channel gain 0-1 */
  leftGain: number;
  /** Right channel gain 0-1 */
  rightGain: number;
  /** Overall volume multiplier 0-1 */
  volume: number;
  /** Whether the source is behind the listener */
  isBehind: boolean;
}

export interface HRTFConfig {
  /** Whether to use mono output (e.g., bone conduction) */
  monoMode: boolean;
  /** Volume boost factor for bone conduction (default 1.0) */
  volumeBoost: number;
}

const DEFAULT_CONFIG: HRTFConfig = {
  monoMode: false,
  volumeBoost: 1.0,
};

/**
 * FR-301: Calculate HRTF stereo panning from relative angle.
 *
 * @param relativeAngle - Angle in degrees (0 = ahead, 90 = right, -90 = left, 180 = behind)
 * @param config - HRTF configuration
 * @returns HRTFOutput with left/right gains and volume
 */
export function calculateHRTF(
  relativeAngle: number,
  config: HRTFConfig = DEFAULT_CONFIG,
): HRTFOutput {
  // Normalize angle to -180..180
  let angle = ((relativeAngle % 360) + 540) % 360 - 180;

  const isBehind = Math.abs(angle) > 90;

  // FR-306: Mono mode for bone conduction headphones
  if (config.monoMode) {
    // In mono mode, use volume attenuation only (no stereo panning)
    const frontFactor = isBehind ? 0.4 : 1.0;
    const volume = Math.min(frontFactor * config.volumeBoost, 1.0);
    return {
      leftGain: 0.5,
      rightGain: 0.5,
      volume,
      isBehind,
    };
  }

  // Convert to radians for trigonometric calculations
  const angleRad = (angle * Math.PI) / 180;

  // Stereo panning using sine of angle
  // 0° (ahead): equal L/R, 90° (right): more R, -90° (left): more L
  const pan = Math.sin(angleRad);

  // Left gain: stronger when source is to the left (negative pan)
  const leftGain = Math.max(0, Math.min(1, 0.5 - pan * 0.5));
  // Right gain: stronger when source is to the right (positive pan)
  const rightGain = Math.max(0, Math.min(1, 0.5 + pan * 0.5));

  // Volume attenuation for sources behind the listener
  // Behind sounds are attenuated to ~40% to create "behind" effect
  const frontFactor = isBehind ? 0.4 : 1.0;
  const volume = Math.min(frontFactor * config.volumeBoost, 1.0);

  return { leftGain, rightGain, volume, isBehind };
}

/**
 * Calculate relative angle between user heading and target bearing.
 *
 * @param userHeading - User's compass heading in degrees (0-360, 0 = North)
 * @param targetBearing - Bearing to target in degrees (0-360, 0 = North)
 * @returns Relative angle in degrees (-180 to 180, positive = right)
 */
export function calculateRelativeAngle(
  userHeading: number,
  targetBearing: number,
): number {
  let diff = targetBearing - userHeading;
  // Normalize to -180..180
  diff = ((diff % 360) + 540) % 360 - 180;
  return diff;
}

/**
 * Calculate bearing from one coordinate to another.
 *
 * @param fromLat - Source latitude in degrees
 * @param fromLon - Source longitude in degrees
 * @param toLat - Target latitude in degrees
 * @param toLon - Target longitude in degrees
 * @returns Bearing in degrees (0-360, 0 = North)
 */
export function calculateBearing(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const dLon = toRad(toLon - fromLon);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}
