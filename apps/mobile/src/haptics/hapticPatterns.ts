// FR-403: Haptic vibration patterns for deaf profile navigation

export type HapticPattern =
  | "turn_left" // 2 short pulses
  | "turn_right" // 3 short pulses
  | "go_straight" // 1 long pulse
  | "alert_risk" // rapid continuous pulses, 1 second
  | "arrival" // 3 long pulses
  | "off_route"; // 2 long pulses

export type HapticIntensity = "light" | "medium" | "heavy";

export interface HapticStep {
  type: "impact" | "pause";
  duration: number; // milliseconds
  intensity?: HapticIntensity;
}

// FR-403: Pattern definitions — each pattern is a sequence of impact/pause steps
export const HAPTIC_PATTERNS: Record<HapticPattern, HapticStep[]> = {
  turn_left: [
    // 2 short pulses
    { type: "impact", duration: 100, intensity: "medium" },
    { type: "pause", duration: 150 },
    { type: "impact", duration: 100, intensity: "medium" },
  ],
  turn_right: [
    // 3 short pulses
    { type: "impact", duration: 100, intensity: "medium" },
    { type: "pause", duration: 150 },
    { type: "impact", duration: 100, intensity: "medium" },
    { type: "pause", duration: 150 },
    { type: "impact", duration: 100, intensity: "medium" },
  ],
  go_straight: [
    // 1 long pulse
    { type: "impact", duration: 400, intensity: "light" },
  ],
  alert_risk: [
    // Rapid pulses for 1 second
    { type: "impact", duration: 80, intensity: "heavy" },
    { type: "pause", duration: 80 },
    { type: "impact", duration: 80, intensity: "heavy" },
    { type: "pause", duration: 80 },
    { type: "impact", duration: 80, intensity: "heavy" },
    { type: "pause", duration: 80 },
    { type: "impact", duration: 80, intensity: "heavy" },
    { type: "pause", duration: 80 },
    { type: "impact", duration: 80, intensity: "heavy" },
    { type: "pause", duration: 80 },
    { type: "impact", duration: 80, intensity: "heavy" },
  ],
  arrival: [
    // 3 long pulses
    { type: "impact", duration: 300, intensity: "heavy" },
    { type: "pause", duration: 200 },
    { type: "impact", duration: 300, intensity: "heavy" },
    { type: "pause", duration: 200 },
    { type: "impact", duration: 300, intensity: "heavy" },
  ],
  off_route: [
    // 2 long pulses
    { type: "impact", duration: 300, intensity: "heavy" },
    { type: "pause", duration: 200 },
    { type: "impact", duration: 300, intensity: "heavy" },
  ],
};

// FR-403: Labels in Spanish for settings UI
export const HAPTIC_PATTERN_LABELS: Record<HapticPattern, string> = {
  turn_left: "Giro a la izquierda (2 pulsos cortos)",
  turn_right: "Giro a la derecha (3 pulsos cortos)",
  go_straight: "Continuar recto (1 pulso largo)",
  alert_risk: "Alerta de riesgo (pulsos rápidos)",
  arrival: "Llegada al destino (3 pulsos largos)",
  off_route: "Fuera de ruta (2 pulsos largos)",
};

/**
 * Calculate total duration of a haptic pattern in milliseconds
 */
export function getPatternDuration(pattern: HapticPattern): number {
  return HAPTIC_PATTERNS[pattern].reduce(
    (total, step) => total + step.duration,
    0
  );
}

/**
 * Map a navigation action to a haptic pattern
 */
export function actionToPattern(
  action: string
): HapticPattern | null {
  switch (action) {
    case "turn_left":
    case "slight_left":
      return "turn_left";
    case "turn_right":
    case "slight_right":
      return "turn_right";
    case "continue":
    case "start":
      return "go_straight";
    case "arrive":
      return "arrival";
    default:
      return null;
  }
}
