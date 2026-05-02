// FR-1102: Mobile client for vision describe API
import { apiPost } from "./apiClient";
import type { AccessibilityProfile } from "../store/accessibilityStore";

export interface VisionDescribeRequest {
  image: string; // base64 (no prefix)
  mediaType: "image/jpeg" | "image/png";
  profile: AccessibilityProfile;
  latitude?: number;
  longitude?: number;
  context?: string;
}

export interface VisionDescribeResponse {
  description: string;
  obstacles: string[];
  surface: string;
  riskLevel: "none" | "low" | "medium" | "high";
  suggestions: string[];
  confidence: number;
  source: "ai" | "fallback";
}

/**
 * FR-1102: Send image to backend for AI description.
 * The image must be base64-encoded JPEG/PNG (without data: prefix).
 */
export async function describeImage(
  request: VisionDescribeRequest
): Promise<VisionDescribeResponse> {
  return apiPost<VisionDescribeResponse>("/vision/describe", request);
}
