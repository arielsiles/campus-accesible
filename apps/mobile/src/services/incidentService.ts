// FR-501, FR-502: Incident API service
import { apiPost, apiGet } from "./apiClient";
import type {
  IncidentSummary,
  IncidentDetail,
  CreateIncidentRequest,
} from "@campus-gps/shared-types";

interface IncidentListResponse {
  incidents: IncidentSummary[];
  total: number;
}

interface IncidentDetailResponse {
  incident: IncidentDetail;
}

interface NearbyResponse {
  incidents: IncidentSummary[];
}

/**
 * FR-501: Create a new incident report
 */
export async function reportIncident(
  data: CreateIncidentRequest
): Promise<IncidentDetail> {
  const response = await apiPost<IncidentDetailResponse>("/incidents", data);
  return response.incident;
}

/**
 * FR-501: Fetch incidents with optional filters
 */
export async function fetchIncidents(filters?: {
  status?: string;
  type?: string;
  segmentId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ incidents: IncidentSummary[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.segmentId) params.set("segmentId", filters.segmentId);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));

  const query = params.toString();
  const path = query ? `/incidents?${query}` : "/incidents";
  return apiGet<IncidentListResponse>(path);
}

/**
 * FR-502: Fetch incidents near a location
 */
export async function fetchNearbyIncidents(
  lat: number,
  lng: number,
  radius: number = 500
): Promise<IncidentSummary[]> {
  const response = await apiGet<NearbyResponse>(
    `/incidents/near?lat=${lat}&lng=${lng}&radius=${radius}`
  );
  return response.incidents;
}

/**
 * FR-501: Fetch incident detail by ID
 */
export async function fetchIncidentDetail(
  id: string
): Promise<IncidentDetail> {
  const response = await apiGet<IncidentDetailResponse>(`/incidents/${id}`);
  return response.incident;
}
