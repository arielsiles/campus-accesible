// FR-1201: Pure text utilities for OCR — separated for testability
// (ML Kit requires native modules and cannot run in node test env)

const MIN_TEXT_LENGTH = 2;

/**
 * FR-1201: Clean OCR output — remove single-char noise, collapse whitespace,
 * trim leading/trailing punctuation that's often noise.
 */
export function cleanRecognizedText(raw: string): string {
  if (!raw) return "";
  // Split by newline first to filter single-char noise lines
  let text = raw
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= MIN_TEXT_LENGTH)
    .join(" ");
  // Collapse remaining whitespace
  text = text.replace(/\s+/g, " ").trim();
  // Strip leading/trailing isolated punctuation
  text = text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").trim();
  return text;
}

/**
 * FR-1201: Validate text is meaningful enough to announce.
 * Avoids reading garbage when image has no real text.
 */
export function isMeaningfulText(text: string): boolean {
  if (text.length < 3) return false;
  // At least one word with 3+ letters
  const hasRealWord = /\p{L}{3,}/u.test(text);
  return hasRealWord;
}
