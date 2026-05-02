// FR-1105: Continuous scanning helpers — detect significant changes
import type { VisionDescribeResponse } from "./visionService";

const RISK_RANK: Record<string, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export interface ChangeAnalysis {
  isSignificant: boolean;
  /** Reason for the change (used for the announcement) */
  reason: string;
  /** Concise text suitable for TTS */
  announcement?: string;
}

/**
 * FR-1105: Decide whether the current capture is "significant" enough to announce.
 * Avoids saturating the user with redundant descriptions.
 */
export function detectSignificantChange(
  current: VisionDescribeResponse,
  previous: VisionDescribeResponse | null
): ChangeAnalysis {
  if (!previous) {
    // First scan — always announce
    return {
      isSignificant: true,
      reason: "first_scan",
      announcement: current.description,
    };
  }

  // Risk escalation
  const currRisk = RISK_RANK[current.riskLevel] ?? 0;
  const prevRisk = RISK_RANK[previous.riskLevel] ?? 0;
  if (currRisk > prevRisk) {
    return {
      isSignificant: true,
      reason: "risk_escalated",
      announcement: `Atencion: ${current.description}`,
    };
  }

  // New obstacles (not in previous)
  const newObstacles = current.obstacles.filter(
    (o) => !previous.obstacles.includes(o)
  );
  if (newObstacles.length > 0) {
    return {
      isSignificant: true,
      reason: "new_obstacle",
      announcement: `Nuevo obstaculo: ${newObstacles.join(", ")}`,
    };
  }

  // Surface changed
  if (current.surface !== previous.surface && current.surface !== "unknown") {
    return {
      isSignificant: true,
      reason: "surface_changed",
      announcement: `Cambio de superficie a ${current.surface}`,
    };
  }

  // Otherwise: silence
  return { isSignificant: false, reason: "no_change" };
}

/**
 * Map vision API riskLevel + first obstacle to a sensible incident type.
 */
export function mapResultToIncidentType(
  result: VisionDescribeResponse
): "obras" | "obstaculo_temporal" | "superficie_danada" | "rampa_bloqueada" | "otro" {
  const description = result.description.toLowerCase();
  const obstacles = result.obstacles.join(" ").toLowerCase();
  const haystack = `${description} ${obstacles}`;

  if (/\bobra|construccion|escombro/.test(haystack)) return "obras";
  if (/superficie|baldosa|grieta|hueco|bache/.test(haystack)) return "superficie_danada";
  if (/rampa|bordillo/.test(haystack)) return "rampa_bloqueada";
  if (/obstaculo|bloqu|cerrado/.test(haystack)) return "obstaculo_temporal";
  return "otro";
}
