// FR-803: Auto-suggest waypoints from OSM data during route recording
import { fetchOsmFeatures } from "./osmService";
import type { OsmFeature } from "./osmService";
import { haversineDistance } from "./snapToRouteService";

const SUGGEST_RADIUS_M = 30; // Suggest when within 30m of POI
const FETCH_RADIUS_M = 500; // Fetch POIs within 500m
const DISMISS_COOLDOWN_MS = 60_000; // Don't re-suggest dismissed POI for 1 minute

export interface WaypointSuggestion {
  osmId: number;
  name: string;
  waypointType: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  tags: Record<string, string>;
}

// Track dismissed POIs to avoid re-suggesting
const dismissedPois = new Map<number, number>(); // osmId -> dismissedAt timestamp

// Cache of nearby features to avoid repeated Overpass calls
let cachedFeatures: OsmFeature[] = [];
let cachedCenter: { lat: number; lng: number } | null = null;

/**
 * FR-803: Check if user is near any OSM POI and return suggestion
 * Returns the closest unvisited POI within SUGGEST_RADIUS_M, or null
 */
export async function checkForSuggestion(
  lat: number,
  lng: number,
  existingWaypointNames: string[]
): Promise<WaypointSuggestion | null> {
  // Refresh OSM features if moved far from cached center
  if (
    !cachedCenter ||
    haversineDistance([lng, lat], [cachedCenter.lng, cachedCenter.lat]) > 200
  ) {
    cachedFeatures = await fetchOsmFeatures(lat, lng, FETCH_RADIUS_M);
    cachedCenter = { lat, lng };
  }

  const now = Date.now();
  let bestSuggestion: WaypointSuggestion | null = null;
  let bestDistance = Infinity;

  for (const feature of cachedFeatures) {
    // Skip already dismissed POIs within cooldown
    const dismissedAt = dismissedPois.get(feature.id);
    if (dismissedAt && now - dismissedAt < DISMISS_COOLDOWN_MS) continue;

    // Skip if a waypoint with this name already exists
    if (existingWaypointNames.includes(feature.name)) continue;

    const distance = haversineDistance(
      [lng, lat],
      [feature.longitude, feature.latitude]
    );

    if (distance <= SUGGEST_RADIUS_M && distance < bestDistance) {
      bestDistance = distance;
      bestSuggestion = {
        osmId: feature.id,
        name: feature.name,
        waypointType: feature.type,
        latitude: feature.latitude,
        longitude: feature.longitude,
        distanceM: Math.round(distance),
        tags: feature.tags,
      };
    }
  }

  return bestSuggestion;
}

/**
 * FR-803: Dismiss a suggestion — won't re-suggest for DISMISS_COOLDOWN_MS
 */
export function dismissSuggestion(osmId: number): void {
  dismissedPois.set(osmId, Date.now());
}

/**
 * FR-803: Reset suggestion state (call when starting new recording)
 */
export function resetSuggestions(): void {
  dismissedPois.clear();
  cachedFeatures = [];
  cachedCenter = null;
}
