// FR-505: Push notification service via Expo push notifications
import { PrismaClient } from "@prisma/client";

// Expo push notification endpoint
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface SendResult {
  sent: number;
  failed: number;
}

/**
 * FR-505: Validate Expo push token format
 */
export function isValidExpoPushToken(token: string): boolean {
  return /^ExponentPushToken\[.+\]$/.test(token) || /^ExpoPushToken\[.+\]$/.test(token);
}

/**
 * FR-505: Send push notifications to all subscribers of a segment
 */
export async function notifySegmentSubscribers(
  prisma: PrismaClient,
  segmentId: string,
  incident: { title: string; type: string; id: string }
): Promise<SendResult> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { segmentId },
    select: { pushToken: true },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Deduplicate tokens
  const uniqueTokens = [...new Set(subscriptions.map((s) => s.pushToken))];

  const messages: ExpoPushMessage[] = uniqueTokens
    .filter(isValidExpoPushToken)
    .map((token) => ({
      to: token,
      title: "Incidencia en tu ruta",
      body: `${incident.title}`,
      data: { incidentId: incident.id, type: incident.type },
    }));

  if (messages.length === 0) {
    return { sent: 0, failed: 0 };
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      return { sent: 0, failed: messages.length };
    }

    const result = await response.json();
    const tickets = Array.isArray(result.data) ? result.data : [];
    const sent = tickets.filter(
      (t: { status: string }) => t.status === "ok"
    ).length;

    return { sent, failed: messages.length - sent };
  } catch {
    return { sent: 0, failed: messages.length };
  }
}

export const notificationService = {
  isValidExpoPushToken,
  notifySegmentSubscribers,
};
