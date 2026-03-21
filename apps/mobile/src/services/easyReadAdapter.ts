// FR-402: Client-side easy-read adapter
// Simplifies navigation instructions locally with fallback to API

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000";

export type EasyReadContext = "navigation" | "risk" | "description" | "general";

export interface EasyReadResult {
  original: string;
  simplified: string;
  source: "ai" | "template" | "local";
}

// FR-402: Local simplification patterns for immediate response
const LOCAL_PATTERNS: Array<{
  match: RegExp;
  simplify: (m: RegExpMatchArray) => string;
}> = [
  {
    match: /^Sal de (.+) y camina hacia (.+)$/,
    simplify: (m) => `Sal de ${m[1]}. Ve a ${m[2]}.`,
  },
  {
    match: /^Continúa recto hasta (.+)$/,
    simplify: (m) => `Camina recto. Ve a ${m[1]}.`,
  },
  {
    match: /^Gira a la (izquierda|derecha) hacia (.+)$/,
    simplify: (m) => `Gira a la ${m[1]}. Ve a ${m[2]}.`,
  },
  {
    match: /^Has llegado a tu destino: (.+)$/,
    simplify: (m) => `Ya llegaste. Estás en ${m[1]}.`,
  },
];

/**
 * FR-402: Simplify text locally (instant, no network)
 * NFR-402: Max 10 words per sentence
 */
export function simplifyLocally(
  text: string,
  context: EasyReadContext = "general"
): string {
  if (context === "navigation") {
    for (const pattern of LOCAL_PATTERNS) {
      const match = text.match(pattern.match);
      if (match) return pattern.simplify(match);
    }
  }

  // General fallback: split at commas and conjunctions
  return text
    .replace(/\s*,\s*/g, ". ")
    .replace(/\s+y\s+/g, ". ")
    .replace(/\.\./g, ".");
}

/**
 * FR-402: Simplify text via API (uses AI when available)
 */
export async function simplifyViaAPI(
  text: string,
  context: EasyReadContext = "general"
): Promise<EasyReadResult> {
  try {
    const response = await fetch(`${API_BASE}/api/text/easy-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Network error — fallback to local
  }

  return {
    original: text,
    simplified: simplifyLocally(text, context),
    source: "local",
  };
}

/**
 * FR-402: Get simplified text — local first, API optional
 */
export function simplifyInstruction(instruction: string): string {
  return simplifyLocally(instruction, "navigation");
}
