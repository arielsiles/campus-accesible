// FR-304: Detailed risk assessment types for route segments

export type RiskFactor =
  | "cruce_sin_semaforo"
  | "mala_iluminacion"
  | "superficie_irregular"
  | "pendiente_pronunciada"
  | "trafico_vehicular"
  | "obras_temporales"
  | "escalones"
  | "sin_barandilla"
  | "paso_estrecho";

export const RISK_FACTOR_LABELS: Record<RiskFactor, string> = {
  cruce_sin_semaforo: "Cruce sin semáforo",
  mala_iluminacion: "Mala iluminación",
  superficie_irregular: "Superficie irregular",
  pendiente_pronunciada: "Pendiente pronunciada",
  trafico_vehicular: "Tráfico vehicular",
  obras_temporales: "Obras temporales",
  escalones: "Escalones",
  sin_barandilla: "Sin barandilla",
  paso_estrecho: "Paso estrecho",
};

export interface RiskAssessment {
  level: "none" | "low" | "medium" | "high";
  description: string;
  factors: RiskFactor[];
}
