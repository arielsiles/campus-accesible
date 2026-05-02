// FR-1404, FR-1405: OSM-based routing fallback
// Builds a temporary in-memory graph from OSM footways via Overpass and runs
// Dijkstra with accessibility-aware weights derived from OSM tags.

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "CampusGPSAccesible/1.0";

const EARTH_RADIUS_M = 6_371_000;

export interface OsmRoutePoint {
  lat: number;
  lng: number;
}

export interface OsmRouteSegment {
  fromCoords: [number, number]; // [lng, lat]
  toCoords: [number, number];
  distanceM: number;
  surface: string;
  hasStairs: boolean;
  wheelchair: "yes" | "limited" | "no" | "unknown";
}

export interface OsmRouteResult {
  segments: OsmRouteSegment[];
  totalDistanceM: number;
  source: "osm";
  /** Composite confidence (0..1) — lowered when OSM data is sparse */
  confidence: number;
}

interface RawWay {
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

interface RawNode {
  id: number;
  lat: number;
  lon: number;
}

interface OverpassResponse {
  elements: Array<RawNode | (RawWay & { type: "way" })>;
}

/**
 * FR-1405: Map OSM footway tags to accessibility weights.
 * Returns a multiplier for the segment length based on profile.
 */
export type AccessibilityProfile =
  | "standard"
  | "visual_disability"
  | "reduced_mobility"
  | "deaf"
  | "easy_read";

export function mapOsmToWeight(
  tags: Record<string, string>,
  distanceM: number,
  profile: AccessibilityProfile
): number {
  let multiplier = 1;

  // Hard barrier for reduced mobility on stairs
  if (
    tags.highway === "steps" ||
    tags.step_count != null ||
    tags.indoor === "stairs"
  ) {
    if (profile === "reduced_mobility") return distanceM * 100;
    if (profile === "visual_disability") multiplier *= 2;
  }

  // Wheelchair tag
  if (tags.wheelchair === "no") {
    if (profile === "reduced_mobility") return distanceM * 50;
    multiplier *= 1.5;
  } else if (tags.wheelchair === "limited") {
    multiplier *= 1.3;
  }

  // Surface
  const surface = tags.surface ?? "";
  if (
    surface === "cobblestone" ||
    surface === "sett" ||
    surface === "paving_stones"
  ) {
    if (profile === "visual_disability") multiplier *= 1.4;
    if (profile === "reduced_mobility") multiplier *= 1.3;
  } else if (
    surface === "gravel" ||
    surface === "fine_gravel" ||
    surface === "compacted"
  ) {
    if (profile === "reduced_mobility") multiplier *= 2;
  } else if (surface === "dirt" || surface === "grass" || surface === "mud") {
    if (profile === "reduced_mobility") multiplier *= 3;
    multiplier *= 1.5;
  }

  // Tactile paving bonus for visual disability
  if (tags.tactile_paving === "yes" && profile === "visual_disability") {
    multiplier *= 0.85;
  }

  // Lighting
  if (tags.lit === "no" && profile === "visual_disability") {
    multiplier *= 1.2;
  }

  // Incline
  const incline = parseInclinePercent(tags.incline);
  if (incline != null && incline > 5 && profile === "reduced_mobility") {
    multiplier *= 1 + incline / 10;
  }

  return distanceM * multiplier;
}

function parseInclinePercent(v?: string): number | null {
  if (!v) return null;
  const m = v.match(/(-?\d+(?:\.\d+)?)\s*%/);
  if (m) return Math.abs(Number(m[1]));
  if (v === "up" || v === "down") return 5; // unknown, conservative
  return null;
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * FR-1404: Query Overpass for footways within radius and build a graph.
 */
async function fetchFootways(
  centerLat: number,
  centerLng: number,
  radiusM: number
): Promise<{
  nodes: Map<number, { lat: number; lng: number }>;
  ways: RawWay[];
}> {
  const query = `
    [out:json][timeout:15];
    (
      way["highway"~"^(footway|path|pedestrian|steps|track|service|residential)$"](around:${radiusM},${centerLat},${centerLng});
    );
    out body;
    >;
    out skel qt;
  `;
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) {
    throw new Error(`Overpass returned ${response.status}`);
  }
  const data = (await response.json()) as OverpassResponse;
  const nodes = new Map<number, { lat: number; lng: number }>();
  const ways: RawWay[] = [];
  for (const el of data.elements) {
    if ("type" in el && el.type === "way") {
      ways.push(el as RawWay);
    } else if ("lat" in el) {
      const node = el as RawNode;
      nodes.set(node.id, { lat: node.lat, lng: node.lon });
    }
  }
  return { nodes, ways };
}

interface GraphEdge {
  toNodeId: number;
  weight: number;
  distanceM: number;
  tags: Record<string, string>;
}

/**
 * FR-1404: Build adjacency list from OSM ways.
 */
function buildAdjacency(
  ways: RawWay[],
  nodes: Map<number, { lat: number; lng: number }>,
  profile: AccessibilityProfile
): Map<number, GraphEdge[]> {
  const adj = new Map<number, GraphEdge[]>();
  for (const way of ways) {
    const tags = way.tags ?? {};
    const isOneWay = tags.oneway === "yes";
    for (let i = 0; i < way.nodes.length - 1; i++) {
      const a = way.nodes[i];
      const b = way.nodes[i + 1];
      const na = nodes.get(a);
      const nb = nodes.get(b);
      if (!na || !nb) continue;
      const distM = haversineMeters(na.lat, na.lng, nb.lat, nb.lng);
      const weight = mapOsmToWeight(tags, distM, profile);
      const edge: GraphEdge = { toNodeId: b, weight, distanceM: distM, tags };
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a)!.push(edge);
      if (!isOneWay) {
        const reverse: GraphEdge = {
          toNodeId: a,
          weight,
          distanceM: distM,
          tags,
        };
        if (!adj.has(b)) adj.set(b, []);
        adj.get(b)!.push(reverse);
      }
    }
  }
  return adj;
}

/** FR-1404: Find graph node closest to a coordinate */
function findClosestNode(
  nodes: Map<number, { lat: number; lng: number }>,
  lat: number,
  lng: number
): number | null {
  let best: number | null = null;
  let bestDist = Infinity;
  for (const [id, n] of nodes) {
    const d = haversineMeters(lat, lng, n.lat, n.lng);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}

/**
 * FR-1404: Dijkstra's shortest path on the OSM graph.
 */
function dijkstra(
  adj: Map<number, GraphEdge[]>,
  start: number,
  end: number
): {
  path: number[];
  edges: GraphEdge[];
} | null {
  const dist = new Map<number, number>();
  const prev = new Map<number, { node: number; edge: GraphEdge }>();
  const visited = new Set<number>();
  dist.set(start, 0);
  // Simple O(n^2) priority queue (sufficient for ~few thousand nodes)
  while (true) {
    let current: number | null = null;
    let currentDist = Infinity;
    for (const [node, d] of dist) {
      if (!visited.has(node) && d < currentDist) {
        current = node;
        currentDist = d;
      }
    }
    if (current == null) break;
    if (current === end) break;
    visited.add(current);
    const edges = adj.get(current) ?? [];
    for (const edge of edges) {
      if (visited.has(edge.toNodeId)) continue;
      const newDist = currentDist + edge.weight;
      if (newDist < (dist.get(edge.toNodeId) ?? Infinity)) {
        dist.set(edge.toNodeId, newDist);
        prev.set(edge.toNodeId, { node: current, edge });
      }
    }
  }

  if (!prev.has(end) && start !== end) return null;
  // Reconstruct path
  const path: number[] = [];
  const edges: GraphEdge[] = [];
  let cur = end;
  while (cur !== start) {
    path.unshift(cur);
    const p = prev.get(cur);
    if (!p) return null;
    edges.unshift(p.edge);
    cur = p.node;
  }
  path.unshift(start);
  return { path, edges };
}

/**
 * FR-1404, FR-1405: Calculate a route between two GPS points using OSM footways.
 * Returns null if no path can be found.
 */
export async function calculateOsmRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  profile: AccessibilityProfile = "standard"
): Promise<OsmRouteResult | null> {
  // Compute center and bounding radius
  const centerLat = (fromLat + toLat) / 2;
  const centerLng = (fromLng + toLng) / 2;
  const directDist = haversineMeters(fromLat, fromLng, toLat, toLng);
  const radiusM = Math.min(2000, Math.max(300, directDist * 1.5));

  let footways;
  try {
    footways = await fetchFootways(centerLat, centerLng, radiusM);
  } catch {
    return null;
  }

  if (footways.nodes.size === 0 || footways.ways.length === 0) return null;

  const adj = buildAdjacency(footways.ways, footways.nodes, profile);
  const startNode = findClosestNode(footways.nodes, fromLat, fromLng);
  const endNode = findClosestNode(footways.nodes, toLat, toLng);
  if (startNode == null || endNode == null) return null;

  const dijkstraResult = dijkstra(adj, startNode, endNode);
  if (!dijkstraResult) return null;

  const segments: OsmRouteSegment[] = [];
  let totalDistanceM = 0;
  for (let i = 0; i < dijkstraResult.path.length - 1; i++) {
    const fromId = dijkstraResult.path[i];
    const toId = dijkstraResult.path[i + 1];
    const fromNode = footways.nodes.get(fromId)!;
    const toNode = footways.nodes.get(toId)!;
    const edge = dijkstraResult.edges[i];
    segments.push({
      fromCoords: [fromNode.lng, fromNode.lat],
      toCoords: [toNode.lng, toNode.lat],
      distanceM: edge.distanceM,
      surface: edge.tags.surface ?? "unknown",
      hasStairs: edge.tags.highway === "steps",
      wheelchair: parseWheelchair(edge.tags.wheelchair),
    });
    totalDistanceM += edge.distanceM;
  }

  // Confidence: lower when there are many "unknown" wheelchair tags
  const knownCount = segments.filter(
    (s) => s.wheelchair !== "unknown" || s.surface !== "unknown"
  ).length;
  const confidence = segments.length > 0 ? knownCount / segments.length : 0;

  return {
    segments,
    totalDistanceM: Math.round(totalDistanceM),
    source: "osm",
    confidence,
  };
}

function parseWheelchair(v?: string): "yes" | "limited" | "no" | "unknown" {
  if (v === "yes" || v === "limited" || v === "no") return v;
  return "unknown";
}
