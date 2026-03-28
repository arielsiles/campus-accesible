// FR-505: Push notification client service
import { apiPost, apiDelete } from "./apiClient";
import { getDeviceId } from "./deviceIdService";

interface SubscribeResponse {
  subscriptions: number;
}

interface UnsubscribeResponse {
  removed: number;
}

/**
 * FR-505: Register push token and subscribe to segment notifications
 */
export async function subscribeToSegments(
  pushToken: string,
  segmentIds: string[]
): Promise<number> {
  if (segmentIds.length === 0) return 0;

  const deviceId = await getDeviceId();
  const response = await apiPost<SubscribeResponse>("/notifications/subscribe", {
    deviceId,
    pushToken,
    segmentIds,
  });

  return response.subscriptions;
}

/**
 * FR-505: Unsubscribe from segment notifications
 */
export async function unsubscribeFromSegments(
  segmentIds?: string[]
): Promise<number> {
  const deviceId = await getDeviceId();
  const response = await apiDelete<UnsubscribeResponse>(
    "/notifications/unsubscribe",
    {
      deviceId,
      ...(segmentIds && { segmentIds }),
    }
  );

  return response.removed;
}
