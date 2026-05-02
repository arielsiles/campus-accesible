// FR-1204: Transit info service — multi-region with provider abstraction
//
// Architecture:
// - TransitProvider interface allows plugging different real-time APIs
// - The service picks the right provider based on the stop's region (lat/lng)
// - Falls back to OSM static data (transport_lines tag) when no provider
//   has real-time data for that location.

const MADRID_BBOX = { minLat: 40.30, maxLat: 40.55, minLng: -3.85, maxLng: -3.55 };

export interface TransitArrival {
  /** Line code (e.g. "G", "U", "6", "1") */
  line: string;
  /** Destination headsign */
  destination?: string;
  /** Minutes until arrival (null if static schedule only) */
  minutes: number | null;
  /** Vehicle type for UI icon */
  vehicleType: "bus" | "metro" | "tram" | "train" | "unknown";
}

export interface TransitInfo {
  arrivals: TransitArrival[];
  source: "realtime" | "static" | "none";
  /** Provider name for UI ("EMT Madrid", "OSM static", etc.) */
  providerName: string;
}

interface TransitProvider {
  name: string;
  /** Returns true if this provider has data for the given location */
  matches: (lat: number, lng: number) => boolean;
  /** Fetch arrivals; should return empty arrivals array if no data */
  fetchArrivals: (lat: number, lng: number) => Promise<TransitArrival[]>;
}

/**
 * EMT Madrid provider — placeholder for real EMT API integration.
 * Currently returns empty (no key configured); real integration requires
 * EMT_CLIENT_ID and EMT_PASSWORDC env vars.
 */
const emtMadridProvider: TransitProvider = {
  name: "EMT Madrid",
  matches: (lat, lng) =>
    lat >= MADRID_BBOX.minLat &&
    lat <= MADRID_BBOX.maxLat &&
    lng >= MADRID_BBOX.minLng &&
    lng <= MADRID_BBOX.maxLng,
  fetchArrivals: async () => {
    // FUTURE: integrate https://opendata.emtmadrid.es/
    // Requires EMT credentials. Placeholder returns empty until configured.
    return [];
  },
};

const PROVIDERS: TransitProvider[] = [emtMadridProvider];

/**
 * FR-1204: Get transit info for a stop. Tries providers, falls back to static.
 */
export async function fetchTransitInfo(
  latitude: number,
  longitude: number,
  staticLines: string[] = []
): Promise<TransitInfo> {
  // Try each provider that matches this region
  for (const provider of PROVIDERS) {
    if (!provider.matches(latitude, longitude)) continue;
    try {
      const arrivals = await provider.fetchArrivals(latitude, longitude);
      if (arrivals.length > 0) {
        return {
          arrivals,
          source: "realtime",
          providerName: provider.name,
        };
      }
    } catch {
      // Provider failed, continue to next or fall through to static
    }
  }

  // Fallback: build static info from OSM transport_lines tag
  if (staticLines.length > 0) {
    return {
      arrivals: staticLines.map((line) => ({
        line,
        minutes: null,
        vehicleType: "unknown" as const,
      })),
      source: "static",
      providerName: "OSM datos estaticos",
    };
  }

  return { arrivals: [], source: "none", providerName: "Sin datos" };
}
