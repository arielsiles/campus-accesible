// FR-1201: OCR service using Google ML Kit (on-device, offline)
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { apiPost } from "./apiClient";
import { cleanRecognizedText, isMeaningfulText } from "./ocrTextUtils";

export { cleanRecognizedText, isMeaningfulText };

export interface OcrResult {
  /** All recognized text joined by spaces, post-cleaned */
  text: string;
  /** Confidence: simple count of recognized blocks (no per-block confidence in ML Kit text-recognition) */
  blockCount: number;
  /** Raw blocks for advanced UI overlays */
  blocks: Array<{
    text: string;
    boundingBox?: { left: number; top: number; right: number; bottom: number };
  }>;
}

/**
 * FR-1201: Recognize text in an image using on-device ML Kit.
 * Falls back to empty string if recognition fails.
 */
export async function recognizeText(imageUri: string): Promise<OcrResult> {
  try {
    const result = await TextRecognition.recognize(imageUri);
    const blocks = result.blocks.map((b) => ({
      text: b.text,
      boundingBox: b.frame
        ? {
            left: b.frame.left,
            top: b.frame.top,
            right: b.frame.left + b.frame.width,
            bottom: b.frame.top + b.frame.height,
          }
        : undefined,
    }));

    const cleanedText = cleanRecognizedText(result.text);
    return {
      text: cleanedText,
      blockCount: blocks.length,
      blocks,
    };
  } catch {
    return { text: "", blockCount: 0, blocks: [] };
  }
}

interface SimplifyResponse {
  simplified: string;
  source: "ai" | "fallback";
}

/**
 * FR-1201: Send text to server for easy-read simplification (Claude Haiku).
 * Returns the original text if the server is unreachable.
 */
export async function simplifyForEasyRead(text: string): Promise<string> {
  try {
    const response = await apiPost<SimplifyResponse>("/text/simplify", { text });
    return response.simplified;
  } catch {
    return text;
  }
}
