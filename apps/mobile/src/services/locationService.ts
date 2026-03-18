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

// FR-004: Watch position updates every ≤ 1 second
export async function watchPosition(
  callback: (location: Location.LocationObject) => void
): Promise<Location.LocationSubscription> {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 1,
    },
    callback
  );
}
