// FR-802: Geocoding service via Nominatim (OpenStreetMap)

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "CampusGPSAccesible/1.0 (accessibility-navigation-app)";

export interface NominatimResult {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
  boundingBox: [number, number, number, number]; // [south, north, west, east]
}

// Rate limiting — max 1 request per second per Nominatim policy
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
}

/**
 * FR-802: Search for places by name using Nominatim
 * Returns up to 5 results, biased toward Spanish locations
 */
export async function searchPlaces(
  query: string,
  viewbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number }
): Promise<NominatimResult[]> {
  if (query.length < 2) return [];

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "5",
    addressdetails: "1",
    countrycodes: "es",
  });

  if (viewbox) {
    params.set("viewbox", `${viewbox.minLng},${viewbox.maxLat},${viewbox.maxLng},${viewbox.minLat}`);
    params.set("bounded", "0"); // Prefer viewbox but don't restrict
  }

  try {
    const response = await rateLimitedFetch(`${NOMINATIM_URL}?${params}`);
    if (!response.ok) return [];

    const data = await response.json();

    return (data as Array<Record<string, unknown>>).map((item) => ({
      name: String(item.name ?? item.display_name ?? ""),
      displayName: String(item.display_name ?? ""),
      latitude: parseFloat(String(item.lat)),
      longitude: parseFloat(String(item.lon)),
      type: String(item.type ?? "unknown"),
      boundingBox: (item.boundingbox as string[])?.map(Number) as [number, number, number, number] ?? [0, 0, 0, 0],
    }));
  } catch {
    return [];
  }
}

/**
 * FR-802: Reverse geocode — get place name from coordinates
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
    zoom: "18",
  });

  try {
    const response = await rateLimitedFetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    return (data as Record<string, unknown>).display_name as string ?? null;
  } catch {
    return null;
  }
}
