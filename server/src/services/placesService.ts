// FR-1202: Nearby places service via OpenStreetMap Overpass API (no Google Places)
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "CampusGPSAccesible/1.0 (accessibility-navigation-app)";

const NEARBY_RADIUS_M = 500;
const MAX_RESULTS = 10;

// Simple in-memory cache (NFR-1202: 30 min TTL)
interface CacheEntry {
  data: NearbyPlace[];
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export interface NearbyPlace {
  id: string;
  name: string;
  type: string; // category
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  distanceM: number;
  openNow?: boolean | null; // null when unknown
  openingHours?: string;
  wheelchair?: "yes" | "limited" | "no" | "unknown";
  tags: Record<string, string>;
}

export type PlaceCategory =
  | "pharmacy"
  | "hospital"
  | "bank"
  | "atm"
  | "cafe"
  | "restaurant"
  | "supermarket"
  | "toilets"
  | "transport"
  | "education"
  | "info"
  | "other";

const ACCESSIBLE_PRIORITY: PlaceCategory[] = [
  "pharmacy",
  "hospital",
  "toilets",
  "bank",
  "cafe",
  "restaurant",
  "supermarket",
  "transport",
  "education",
  "info",
  "atm",
  "other",
];

/**
 * FR-1202: Query nearby places from OSM Overpass.
 * Returns 5-10 most relevant places sorted by accessibility priority + distance.
 */
export async function fetchNearbyPlaces(
  latitude: number,
  longitude: number,
  radiusM: number = NEARBY_RADIUS_M
): Promise<NearbyPlace[]> {
  const cacheKey = makeCacheKey(latitude, longitude, radiusM);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const query = `
    [out:json][timeout:10];
    (
      node["amenity"~"^(pharmacy|hospital|clinic|bank|atm|cafe|restaurant|fast_food|supermarket|toilets|university|school|library|information)$"](around:${radiusM},${latitude},${longitude});
      node["shop"~"^(supermarket|convenience)$"](around:${radiusM},${latitude},${longitude});
      node["public_transport"="station"](around:${radiusM},${latitude},${longitude});
    );
    out body;
  `.trim();

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { elements: Array<RawOverpassElement> };
    const places = data.elements
      .filter((e) => e.tags && (e.tags.name || e.tags.amenity))
      .map((e) => transformElement(e, latitude, longitude))
      .filter((p): p is NearbyPlace => p !== null);

    // Sort: accessible priority order, then by distance
    places.sort((a, b) => {
      const ai = ACCESSIBLE_PRIORITY.indexOf(a.category);
      const bi = ACCESSIBLE_PRIORITY.indexOf(b.category);
      if (ai !== bi) return ai - bi;
      return a.distanceM - b.distanceM;
    });

    const result = places.slice(0, MAX_RESULTS);

    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    return [];
  }
}

interface RawOverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

function transformElement(
  el: RawOverpassElement,
  fromLat: number,
  fromLng: number
): NearbyPlace | null {
  const tags = el.tags ?? {};
  const name = tags.name || tags["name:es"] || tags.amenity || "Sin nombre";
  const category = mapCategory(tags);
  const distanceM = haversineMeters(fromLat, fromLng, el.lat, el.lon);

  return {
    id: `osm-${el.id}`,
    name,
    type: tags.amenity || tags.shop || tags.public_transport || "other",
    category,
    latitude: el.lat,
    longitude: el.lon,
    distanceM,
    openNow: parseOpenNow(tags.opening_hours),
    openingHours: tags.opening_hours,
    wheelchair: parseWheelchair(tags.wheelchair),
    tags,
  };
}

function mapCategory(tags: Record<string, string>): PlaceCategory {
  const a = tags.amenity;
  const s = tags.shop;
  if (a === "pharmacy") return "pharmacy";
  if (a === "hospital" || a === "clinic") return "hospital";
  if (a === "bank") return "bank";
  if (a === "atm") return "atm";
  if (a === "cafe") return "cafe";
  if (a === "restaurant" || a === "fast_food") return "restaurant";
  if (s === "supermarket" || s === "convenience" || a === "supermarket") return "supermarket";
  if (a === "toilets") return "toilets";
  if (tags.public_transport) return "transport";
  if (a === "university" || a === "school" || a === "library") return "education";
  if (a === "information") return "info";
  return "other";
}

function parseWheelchair(v?: string): NearbyPlace["wheelchair"] {
  if (v === "yes" || v === "limited" || v === "no") return v;
  return "unknown";
}

/**
 * Parse OSM opening_hours for a quick "open now" check (very simplified).
 * Returns null if unparseable. Full OSM opening_hours spec is complex; this is
 * a best-effort heuristic for common formats like "Mo-Fr 08:00-22:00".
 */
function parseOpenNow(hours?: string): boolean | null {
  if (!hours) return null;
  if (hours === "24/7") return true;
  // Skip complex parsing for now — return null (unknown)
  return null;
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeCacheKey(lat: number, lng: number, radius: number): string {
  // Round to 4 decimals (~11m) so nearby requests share cache
  return `${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
}
