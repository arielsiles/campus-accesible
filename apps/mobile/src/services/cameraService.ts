// FR-1101: Camera capture and image processing
import * as FileSystem from "expo-file-system";

export interface CapturedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  sizeBytes?: number;
}

/**
 * FR-1101, NFR-1101: Read captured image as base64 for API submission.
 * Used to send to Claude Vision via the server.
 */
export async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

/**
 * NFR-1101: Get file size in bytes for budget tracking.
 */
export async function getImageSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && !info.isDirectory ? info.size ?? 0 : 0;
}

/**
 * Validate image meets size constraints before sending.
 * NFR-1101: Max 500KB compressed.
 */
export function isValidImageSize(sizeBytes: number): boolean {
  const MAX_BYTES = 2 * 1024 * 1024; // 2MB hard limit (server enforces)
  return sizeBytes > 0 && sizeBytes <= MAX_BYTES;
}
