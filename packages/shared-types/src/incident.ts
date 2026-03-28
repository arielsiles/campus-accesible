// FR-501: Incident shared types for collaborative reporting system

// Incident type categorization
export type IncidentType =
  | "obras"
  | "obstaculo_temporal"
  | "superficie_danada"
  | "ascensor_averiado"
  | "rampa_bloqueada"
  | "otro";

// Incident lifecycle status
export type IncidentStatus = "pending" | "validated" | "rejected" | "resolved";

// Summary for list views
export interface IncidentSummary {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  segmentId: string | null;
  createdAt: string;
}

// Full detail including AI validation
export interface IncidentDetail extends IncidentSummary {
  deviceId: string;
  photoUrl: string | null;
  aiValidation: boolean | null;
  aiConfidence: number | null;
  aiReason: string | null;
  validationSource: string | null;
  resolvedAt: string | null;
  updatedAt: string;
}

// Request to create a new incident
export interface CreateIncidentRequest {
  deviceId: string;
  type: IncidentType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  segmentId?: string;
  photoUrl?: string;
}

// Request to update incident status
export interface UpdateIncidentStatusRequest {
  status: IncidentStatus;
  reason?: string;
}

// FR-503: AI validation result
export interface IncidentValidationResult {
  plausible: boolean;
  confidence: number;
  reason: string;
  suggestedType?: IncidentType;
  source: "ai" | "template";
}

// FR-505: Push notification subscription request
export interface PushSubscriptionRequest {
  deviceId: string;
  pushToken: string;
  segmentIds: string[];
}

// Labels in Spanish for UI — FR-501
export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  obras: "Obras",
  obstaculo_temporal: "Obstáculo temporal",
  superficie_danada: "Superficie dañada",
  ascensor_averiado: "Ascensor averiado",
  rampa_bloqueada: "Rampa bloqueada",
  otro: "Otro",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  pending: "Pendiente",
  validated: "Validada",
  rejected: "Rechazada",
  resolved: "Resuelta",
};
