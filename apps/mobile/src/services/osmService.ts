// FR-801: OpenStreetMap data service via Overpass API
import { getCachedOsmData, setCachedOsmData } from "./osmCache";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "CampusGPSAccesible/1.0 (accessibility-navigation-app)";

// FR-801: OSM feature transformed to app-compatible format
export interface OsmFeature {
  id: number;
  name: string;
  type: string; // WaypointType equivalent
  latitude: number;
  longitude: number;
  tags: Record<string, string>;
}

// FR-804: OSM footway for path matching
export interface OsmFootway {
  id: number;
  coordinates: [number, number][]; // [lng, lat][]
  surface?: string;
  name?: string;
}

// Mapping OSM tags to app WaypointType
function mapToWaypointType(tags: Record<string, string>): string {
  if (tags.public_transport === "stop_position" || tags.highway === "bus_stop") return "transport_stop";
  if (tags.railway === "station" || tags.station) return "transport_stop";
  if (tags.amenity === "university" || tags.building === "university") return "building";
  if (tags.building) return "building";
  if (tags.highway === "crossing") return "intersection";
  if (tags.tourism === "information" || tags.information) return "information_point";
  if (tags.amenity === "bench" || tags.leisure === "picnic_table") return "rest_area";
  if (tags.barrier) return "hazard";
  if (tags.entrance || tags.door) return "entrance";
  return "landmark";
}

// Mapping OSM surface tags to app surfaceType
export function mapOsmSurface(surface?: string): string {
  if (!surface) return "paved";
  const map: Record<string, string> = {
    asphalt: "paved",
    concrete: "paved",
    paving_stones: "paved",
    sett: "cobblestone",
    cobblestone: "cobblestone",
    gravel: "gravel",
    fine_gravel: "gravel",
    compacted: "gravel",
    dirt: "dirt",
    earth: "dirt",
    grass: "dirt",
    sand: "dirt",
    mud: "dirt",
  };
  return map[surface] ?? "paved";
}

/**
 * FR-801: Query Overpass API for buildings, POIs, and transport stops near coordinates
 */
export async function fetchOsmFeatures(
  lat: number,
  lng: number,
  radiusM: number = 500
): Promise<OsmFeature[]> {
  // Check cache first
  const cached = getCachedOsmData(lat, lng, "features");
  if (cached) return cached as OsmFeature[];

  const query = `
    [out:json][timeout:10];
    (
      node["amenity"](around:${radiusM},${lat},${lng});
      node["building"](around:${radiusM},${lat},${lng});
      node["public_transport"](around:${radiusM},${lat},${lng});
      node["highway"="bus_stop"](around:${radiusM},${lat},${lng});
      node["highway"="crossing"](around:${radiusM},${lat},${lng});
      node["entrance"](around:${radiusM},${lat},${lng});
      way["building"](around:${radiusM},${lat},${lng});
    );
    out center body;
  `;

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

    const data = await response.json();
    const elements = data.elements ?? [];

    const features: OsmFeature[] = elements
      .filter((el: Record<string, unknown>) => el.tags?.name)
      .map((el: Record<string, unknown>) => {
        const tags = (el.tags ?? {}) as Record<string, string>;
        // Ways have center coordinates
        const elLat = (el.lat ?? (el.center as Record<string, number>)?.lat) as number;
        const elLng = (el.lon ?? (el.center as Record<string, number>)?.lon) as number;

        return {
          id: el.id as number,
          name: tags.name,
          type: mapToWaypointType(tags),
          latitude: elLat,
          longitude: elLng,
          tags,
        };
      })
      .filter((f: OsmFeature) => f.latitude && f.longitude);

    setCachedOsmData(lat, lng, "features", features);
    return features;
  } catch {
    return [];
  }
}

/**
 * FR-804: Query Overpass API for footways/paths near coordinates
 */
export async function fetchOsmFootways(
  lat: number,
  lng: number,
  radiusM: number = 300
): Promise<OsmFootway[]> {
  const cached = getCachedOsmData(lat, lng, "footways");
  if (cached) return cached as OsmFootway[];

  const query = `
    [out:json][timeout:10];
    (
      way["highway"="footway"](around:${radiusM},${lat},${lng});
      way["highway"="path"](around:${radiusM},${lat},${lng});
      way["highway"="pedestrian"](around:${radiusM},${lat},${lng});
    );
    out body geom;
  `;

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

    const data = await response.json();
    const elements = data.elements ?? [];

    const footways: OsmFootway[] = elements
      .filter((el: Record<string, unknown>) => el.geometry)
      .map((el: Record<string, unknown>) => {
        const tags = (el.tags ?? {}) as Record<string, string>;
        const geom = el.geometry as Array<{ lat: number; lon: number }>;
        return {
          id: el.id as number,
          coordinates: geom.map((p): [number, number] => [p.lon, p.lat]),
          surface: tags.surface,
          name: tags.name,
        };
      });

    setCachedOsmData(lat, lng, "footways", footways);
    return footways;
  } catch {
    return [];
  }
}
