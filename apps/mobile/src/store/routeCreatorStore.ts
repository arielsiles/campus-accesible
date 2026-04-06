// FR-701: Route creator state management for GPS recording and editing
import { create } from "zustand";
import { haversineDistance } from "../services/snapToRouteService";

// --- Types ---

export interface TrackPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
}

export interface DraftWaypoint {
  id: string;
  name: string;
  description: string;
  waypointType: string;
  latitude: number;
  longitude: number;
  orderIndex: number;
  transportType?: string;
  transportLines?: string[];
}

export interface DraftSegment {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lng, lat][]
  surfaceType: string;
  elevationChange: number;
  riskLevel: string;
  riskDescription: string;
  riskFactors: string[];
  hasRamp: boolean;
  hasStairs: boolean;
  pathWidth: number;
  maxSlope: number;
  surfaceQuality: string;
  orderIndex: number;
}

interface RouteCreatorState {
  // Recording state
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;

  // Track data
  trackPoints: TrackPoint[];
  waypoints: DraftWaypoint[];
  segments: DraftSegment[];

  // Route metadata
  routeName: string;
  routeDescription: string;

  // Edit mode
  editingRouteId: string | null;

  // Actions
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  addTrackPoint: (point: TrackPoint) => void;
  addWaypoint: (waypoint: DraftWaypoint) => void;
  updateWaypoint: (index: number, data: Partial<DraftWaypoint>) => void;
  removeWaypoint: (index: number) => void;
  reorderWaypoint: (fromIndex: number, toIndex: number) => void;
  updateSegment: (index: number, data: Partial<DraftSegment>) => void;
  setRouteName: (name: string) => void;
  setRouteDescription: (desc: string) => void;
  generateSegments: () => void;
  reset: () => void;
}

// --- Helpers ---

let waypointCounter = 0;
let segmentCounter = 0;

function generateWaypointId(): string {
  return `draft-wp-${++waypointCounter}-${Date.now()}`;
}

function generateSegmentId(): string {
  return `draft-seg-${++segmentCounter}-${Date.now()}`;
}

// NFR-703: Douglas-Peucker line simplification
function simplifyTrack(
  points: [number, number][],
  epsilon: number = 0.00002 // ~2m at Madrid latitude
): [number, number][] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyTrack(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyTrack(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [px, py] = point;
  const [ax, ay] = lineStart;
  const [bx, by] = lineEnd;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const projX = ax + t * dx;
  const projY = ay + t * dy;

  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

// Extract track coordinates between two waypoints
function extractTrackBetween(
  trackPoints: TrackPoint[],
  wpFrom: DraftWaypoint,
  wpTo: DraftWaypoint
): [number, number][] {
  // Find closest track point to each waypoint
  const fromCoord: [number, number] = [wpFrom.longitude, wpFrom.latitude];
  const toCoord: [number, number] = [wpTo.longitude, wpTo.latitude];

  let fromIdx = 0;
  let toIdx = trackPoints.length - 1;
  let minFromDist = Infinity;
  let minToDist = Infinity;

  for (let i = 0; i < trackPoints.length; i++) {
    const coord: [number, number] = [trackPoints[i].longitude, trackPoints[i].latitude];
    const dFrom = haversineDistance(coord, fromCoord);
    const dTo = haversineDistance(coord, toCoord);

    if (dFrom < minFromDist) {
      minFromDist = dFrom;
      fromIdx = i;
    }
    if (dTo < minToDist) {
      minToDist = dTo;
      toIdx = i;
    }
  }

  // Ensure correct order
  if (fromIdx > toIdx) [fromIdx, toIdx] = [toIdx, fromIdx];

  const rawCoords: [number, number][] = [
    fromCoord,
    ...trackPoints
      .slice(fromIdx, toIdx + 1)
      .map((p): [number, number] => [p.longitude, p.latitude]),
    toCoord,
  ];

  return simplifyTrack(rawCoords);
}

// --- Store ---

export const useRouteCreatorStore = create<RouteCreatorState>((set, get) => ({
  isRecording: false,
  isPaused: false,
  startTime: null,
  trackPoints: [],
  waypoints: [],
  segments: [],
  routeName: "",
  routeDescription: "",
  editingRouteId: null,

  startRecording: () =>
    set({
      isRecording: true,
      isPaused: false,
      startTime: Date.now(),
      trackPoints: [],
      waypoints: [],
      segments: [],
    }),

  pauseRecording: () => set({ isPaused: true }),
  resumeRecording: () => set({ isPaused: false }),

  stopRecording: () =>
    set({ isRecording: false, isPaused: false }),

  addTrackPoint: (point) => {
    const state = get();
    if (!state.isRecording || state.isPaused) return;

    // NFR-703: Filter noisy points (accuracy > 20m)
    if (point.accuracy > 20) return;

    // Skip if too close to last point (< 1m)
    const last = state.trackPoints[state.trackPoints.length - 1];
    if (last) {
      const dist = haversineDistance(
        [point.longitude, point.latitude],
        [last.longitude, last.latitude]
      );
      if (dist < 1) return;
    }

    set({ trackPoints: [...state.trackPoints, point] });
  },

  addWaypoint: (waypoint) =>
    set((state) => ({
      waypoints: [...state.waypoints, {
        ...waypoint,
        id: waypoint.id || generateWaypointId(),
        orderIndex: state.waypoints.length,
      }],
    })),

  updateWaypoint: (index, data) =>
    set((state) => ({
      waypoints: state.waypoints.map((wp, i) =>
        i === index ? { ...wp, ...data } : wp
      ),
    })),

  removeWaypoint: (index) =>
    set((state) => ({
      waypoints: state.waypoints
        .filter((_, i) => i !== index)
        .map((wp, i) => ({ ...wp, orderIndex: i })),
    })),

  reorderWaypoint: (fromIndex, toIndex) =>
    set((state) => {
      const wps = [...state.waypoints];
      const [moved] = wps.splice(fromIndex, 1);
      wps.splice(toIndex, 0, moved);
      return { waypoints: wps.map((wp, i) => ({ ...wp, orderIndex: i })) };
    }),

  updateSegment: (index, data) =>
    set((state) => ({
      segments: state.segments.map((seg, i) =>
        i === index ? { ...seg, ...data } : seg
      ),
    })),

  setRouteName: (name) => set({ routeName: name }),
  setRouteDescription: (desc) => set({ routeDescription: desc }),

  // FR-701: Generate segments from track points between consecutive waypoints
  generateSegments: () => {
    const { waypoints, trackPoints } = get();
    if (waypoints.length < 2) return;

    const segments: DraftSegment[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];

      const coordinates = trackPoints.length > 0
        ? extractTrackBetween(trackPoints, from, to)
        : [[from.longitude, from.latitude] as [number, number],
           [to.longitude, to.latitude] as [number, number]];

      const distance = haversineDistance(
        [from.longitude, from.latitude],
        [to.longitude, to.latitude]
      );

      segments.push({
        id: generateSegmentId(),
        name: `${from.name} a ${to.name}`,
        coordinates,
        surfaceType: "paved",
        elevationChange: 0,
        riskLevel: "none",
        riskDescription: "",
        riskFactors: [],
        hasRamp: false,
        hasStairs: false,
        pathWidth: 2.0,
        maxSlope: 0,
        surfaceQuality: "good",
        orderIndex: i,
      });
    }

    set({ segments });
  },

  reset: () => {
    waypointCounter = 0;
    segmentCounter = 0;
    set({
      isRecording: false,
      isPaused: false,
      startTime: null,
      trackPoints: [],
      waypoints: [],
      segments: [],
      routeName: "",
      routeDescription: "",
      editingRouteId: null,
    });
  },
}));
