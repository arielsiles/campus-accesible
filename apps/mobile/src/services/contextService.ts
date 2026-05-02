// FR-1205: Mobile client for /api/context endpoints
import { apiGet } from "./apiClient";

export interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  category: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  openNow?: boolean | null;
  openingHours?: string;
  wheelchair?: "yes" | "limited" | "no" | "unknown";
  tags: Record<string, string>;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  conditionLocal: string;
  iconCode: string;
  windSpeed: number;
  alerts: Array<{
    severity: "info" | "warning" | "danger";
    message: string;
  }>;
}

export interface TransitArrival {
  line: string;
  destination?: string;
  minutes: number | null;
  vehicleType: "bus" | "metro" | "tram" | "train" | "unknown";
}

export interface TransitInfo {
  arrivals: TransitArrival[];
  source: "realtime" | "static" | "none";
  providerName: string;
}

export interface ContextAll {
  places: NearbyPlace[];
  weather: WeatherData | null;
  coordinates: { lat: number; lng: number };
  timestamp: string;
}

export async function fetchContextAll(
  lat: number,
  lng: number
): Promise<ContextAll> {
  return apiGet<ContextAll>(
    `/context/all?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}`
  );
}

export async function fetchTransit(
  lat: number,
  lng: number,
  waypointId?: string
): Promise<TransitInfo> {
  const params = new URLSearchParams({
    lat: lat.toFixed(5),
    lng: lng.toFixed(5),
  });
  if (waypointId) params.set("waypointId", waypointId);
  return apiGet<TransitInfo>(`/context/transit?${params.toString()}`);
}
