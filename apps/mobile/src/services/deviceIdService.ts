// FR-502: Anonymous device identification for incident reporting
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "@campus-gps/device-id";

// Simple UUID v4 generator (no external dependency needed)
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedDeviceId: string | null = null;

/**
 * FR-502: Get or create a persistent anonymous device ID
 * Generated once, stored in AsyncStorage, cached in memory
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
  } catch {
    // Storage read failure — generate new
  }

  const newId = generateUUID();
  cachedDeviceId = newId;

  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  } catch {
    // Storage write failure — ID still cached in memory
  }

  return newId;
}

// For testing
export function resetCachedDeviceId(): void {
  cachedDeviceId = null;
}
