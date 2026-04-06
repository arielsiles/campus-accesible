// FR-701: GPS track recording service
import * as Location from "expo-location";
import { useRouteCreatorStore } from "../store/routeCreatorStore";

let subscription: Location.LocationSubscription | null = null;

/**
 * FR-701: Start recording GPS track points into the route creator store
 * Records at high frequency (1s interval, 1m distance) for accurate tracks
 */
export async function startTrackRecording(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") return false;

  const store = useRouteCreatorStore.getState();
  store.startRecording();

  subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 1,
    },
    (location) => {
      useRouteCreatorStore.getState().addTrackPoint({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy ?? 10,
      });
    }
  );

  return true;
}

/**
 * FR-701: Stop recording and clean up GPS subscription
 */
export function stopTrackRecording(): void {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  useRouteCreatorStore.getState().stopRecording();
}

/**
 * FR-701: Pause/resume recording (GPS continues but points are filtered by store)
 */
export function pauseTrackRecording(): void {
  useRouteCreatorStore.getState().pauseRecording();
}

export function resumeTrackRecording(): void {
  useRouteCreatorStore.getState().resumeRecording();
}

/**
 * FR-701: Check if currently recording
 */
export function isRecording(): boolean {
  return useRouteCreatorStore.getState().isRecording;
}
