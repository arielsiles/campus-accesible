// FR-004: GPS location service using expo-location
import * as Location from "expo-location";

export type PermissionResult = "granted" | "denied";

export async function requestLocationPermission(): Promise<PermissionResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted" ? "granted" : "denied";
}

export async function checkLocationPermission(): Promise<PermissionResult> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === "granted" ? "granted" : "denied";
}

export async function getCurrentPosition(): Promise<Location.LocationObject> {
  return Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
}

// FR-004, FR-601: Watch position with adaptive intervals
// Walking: 1s interval, 1m distance — Stationary: 5s interval, 5m distance
export async function watchPosition(
  callback: (location: Location.LocationObject) => void,
  options?: { adaptive?: boolean }
): Promise<Location.LocationSubscription> {
  if (options?.adaptive) {
    return watchPositionAdaptive(callback);
  }
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 1,
    },
    callback
  );
}

// FR-601: Adaptive GPS — reduces update frequency when stationary
const STATIONARY_THRESHOLD_M = 5;
const STATIONARY_CHECK_INTERVAL = 10_000; // 10 seconds

async function watchPositionAdaptive(
  callback: (location: Location.LocationObject) => void
): Promise<Location.LocationSubscription> {
  let lastCoords: { latitude: number; longitude: number } | null = null;
  let lastMoveTime = Date.now();
  let currentSubscription: Location.LocationSubscription | null = null;
  let isStationary = false;

  const wrappedCallback = (location: Location.LocationObject) => {
    const { latitude, longitude } = location.coords;

    if (lastCoords) {
      const dLat = latitude - lastCoords.latitude;
      const dLng = longitude - lastCoords.longitude;
      const approxDistM = Math.sqrt(dLat * dLat + dLng * dLng) * 111320;

      if (approxDistM > STATIONARY_THRESHOLD_M) {
        lastMoveTime = Date.now();
        if (isStationary) {
          isStationary = false;
          // Will switch on next interval check
        }
      }
    }

    lastCoords = { latitude, longitude };
    callback(location);
  };

  // Start with walking mode
  currentSubscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
    wrappedCallback
  );

  // Periodic check to switch modes
  const intervalId = setInterval(async () => {
    const wasStationary = isStationary;
    isStationary = Date.now() - lastMoveTime > STATIONARY_CHECK_INTERVAL;

    if (isStationary !== wasStationary && currentSubscription) {
      currentSubscription.remove();
      const interval = isStationary ? 5000 : 1000;
      const distance = isStationary ? 5 : 1;
      currentSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: interval, distanceInterval: distance },
        wrappedCallback
      );
    }
  }, STATIONARY_CHECK_INTERVAL);

  // Return a subscription that cleans up everything
  return {
    remove: () => {
      clearInterval(intervalId);
      currentSubscription?.remove();
    },
  };
}
