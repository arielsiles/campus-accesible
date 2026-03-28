// FR-505: Hook for managing push notification permissions and subscriptions
import { useState, useCallback } from "react";
import { Platform } from "react-native";
import {
  subscribeToSegments,
  unsubscribeFromSegments,
} from "../services/notificationService";

/**
 * FR-505: Get push notification token
 * Uses expo-notifications when available, returns null otherwise
 */
async function getPushToken(): Promise<string | null> {
  try {
    // Dynamic import — expo-notifications may not be installed
    const Notifications = await import("expo-notifications");

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    // Android requires a notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("incidents", {
        name: "Incidencias",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    // expo-notifications not available or error
    return null;
  }
}

/**
 * FR-505: Manage push notification subscriptions for route segments
 */
export function useNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const subscribe = useCallback(async (segmentIds: string[]) => {
    if (segmentIds.length === 0) return;

    setLoading(true);
    try {
      const token = await getPushToken();
      if (!token) {
        setHasPermission(false);
        return;
      }

      setHasPermission(true);
      await subscribeToSegments(token, segmentIds);
    } catch {
      // Non-critical — app works without notifications
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (segmentIds?: string[]) => {
    try {
      await unsubscribeFromSegments(segmentIds);
    } catch {
      // Non-critical
    }
  }, []);

  return { subscribe, unsubscribe, hasPermission, loading };
}
