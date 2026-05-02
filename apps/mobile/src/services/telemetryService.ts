// FR-1501: Telemetry service — sends anonymous GPS traces to the server in batches
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost } from "./apiClient";
import { usePrivacyStore } from "../store/privacyStore";
import type { AccessibilityProfile } from "../store/accessibilityStore";

const QUEUE_KEY = "@campus-gps/telemetry-queue";
const MAX_QUEUE_SIZE = 500; // safety limit
const BATCH_INTERVAL_MS = 30_000;
const BATCH_SIZE = 50;

export interface TracePoint {
  segmentId: string | null;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface SegmentSummary {
  segmentId: string;
  traversalTimeS: number;
  offRouteSeconds: number;
}

let queue: TracePoint[] = [];
let segmentSummaries: SegmentSummary[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

async function loadQueue() {
  try {
    const json = await AsyncStorage.getItem(QUEUE_KEY);
    if (json) queue = JSON.parse(json) as TracePoint[];
  } catch {
    queue = [];
  }
}

async function saveQueue() {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

/**
 * FR-1501: Add a GPS point to the in-memory queue.
 * No-op if telemetry is not enabled by the user.
 */
export function recordTracePoint(point: TracePoint): void {
  const enabled = usePrivacyStore.getState().telemetryEnabled;
  if (!enabled) return;
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift(); // drop oldest
  }
  queue.push(point);
}

/**
 * FR-1501, FR-1506: Record a segment summary for metric aggregation on the server.
 */
export function recordSegmentSummary(summary: SegmentSummary): void {
  const enabled = usePrivacyStore.getState().telemetryEnabled;
  if (!enabled) return;
  segmentSummaries.push(summary);
}

/**
 * Send any queued traces to the server. Drops old data if upload fails.
 */
export async function flush(profile: AccessibilityProfile): Promise<void> {
  if (queue.length === 0 && segmentSummaries.length === 0) return;
  if (!usePrivacyStore.getState().telemetryEnabled) return;

  const points = queue.splice(0, BATCH_SIZE);
  const summaries = segmentSummaries.splice(0, BATCH_SIZE);

  try {
    await apiPost("/telemetry/traces", {
      profile,
      points,
      segmentSummary: summaries,
    });
  } catch {
    // Re-queue points if request fails (best effort, no infinite retry)
    queue.unshift(...points);
    segmentSummaries.unshift(...summaries);
    await saveQueue();
  }
}

/**
 * FR-1501: Start the periodic flush loop. Should be called when navigation begins.
 */
export function startTelemetry(profile: AccessibilityProfile): void {
  if (timer) return;
  loadQueue();
  timer = setInterval(() => flush(profile), BATCH_INTERVAL_MS);
}

/**
 * FR-1501: Stop the flush loop and persist queued data for next session.
 */
export async function stopTelemetry(profile: AccessibilityProfile): Promise<void> {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  // Final flush attempt before stopping
  await flush(profile);
  await saveQueue();
}

/**
 * NFR-1501: Allow user to clear all locally queued telemetry data.
 */
export async function clearTelemetryQueue(): Promise<void> {
  queue = [];
  segmentSummaries = [];
  await AsyncStorage.removeItem(QUEUE_KEY);
}
