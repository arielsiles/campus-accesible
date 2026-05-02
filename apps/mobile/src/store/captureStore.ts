// FR-1104: Capture history store with persistence
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const STORAGE_KEY = "@campus-gps/capture-history";
const STORAGE_DIR = `${FileSystem.documentDirectory}captures/`;
const MAX_CAPTURES = 20;

export interface CaptureItem {
  id: string;
  imageUri: string; // permanent file:// path
  description: string;
  obstacles: string[];
  surface: string;
  riskLevel: "none" | "low" | "medium" | "high";
  suggestions: string[];
  confidence: number;
  latitude?: number;
  longitude?: number;
  profile: string;
  timestamp: number; // epoch ms
}

interface CaptureState {
  history: CaptureItem[];
  isLoaded: boolean;

  load: () => Promise<void>;
  add: (item: Omit<CaptureItem, "id" | "imageUri" | "timestamp"> & { sourceUri: string }) => Promise<CaptureItem>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(STORAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
  }
}

async function saveMetadata(history: CaptureItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

async function loadMetadata(): Promise<CaptureItem[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const useCaptureStore = create<CaptureState>((set, get) => ({
  history: [],
  isLoaded: false,

  load: async () => {
    if (get().isLoaded) return;
    const history = await loadMetadata();
    set({ history, isLoaded: true });
  },

  add: async (data) => {
    await ensureDir();

    const id = `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const targetUri = `${STORAGE_DIR}${id}.jpg`;

    // Copy the image to permanent storage (otherwise expo cache may clear it)
    try {
      await FileSystem.copyAsync({
        from: data.sourceUri,
        to: targetUri,
      });
    } catch {
      // If copy fails, fall back to source URI (may be lost later)
    }

    const item: CaptureItem = {
      id,
      imageUri: targetUri,
      description: data.description,
      obstacles: data.obstacles,
      surface: data.surface,
      riskLevel: data.riskLevel,
      suggestions: data.suggestions,
      confidence: data.confidence,
      latitude: data.latitude,
      longitude: data.longitude,
      profile: data.profile,
      timestamp: Date.now(),
    };

    const next = [item, ...get().history].slice(0, MAX_CAPTURES);

    // Delete files of items that fell out of the window
    const removed = get().history.slice(MAX_CAPTURES - 1);
    for (const r of removed) {
      FileSystem.deleteAsync(r.imageUri, { idempotent: true }).catch(() => {});
    }

    set({ history: next });
    await saveMetadata(next);
    return item;
  },

  remove: async (id) => {
    const target = get().history.find((c) => c.id === id);
    if (target) {
      FileSystem.deleteAsync(target.imageUri, { idempotent: true }).catch(() => {});
    }
    const next = get().history.filter((c) => c.id !== id);
    set({ history: next });
    await saveMetadata(next);
  },

  clearAll: async () => {
    for (const item of get().history) {
      FileSystem.deleteAsync(item.imageUri, { idempotent: true }).catch(() => {});
    }
    set({ history: [] });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
