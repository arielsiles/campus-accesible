// FR-307: AI-powered audio description generator using Claude API
// Falls back to template-based descriptions when API is unavailable

import Anthropic from "@anthropic-ai/sdk";

export interface SegmentData {
  name: string;
  surfaceType: string;
  elevationChange: number;
  riskLevel: string;
  riskDescription?: string | null;
  riskFactors?: string[];
}

export interface GeneratedDescription {
  audioDescription: string;
  source: "ai" | "template";
}

// Template-based fallback descriptions (Spanish)
const SURFACE_LABELS: Record<string, string> = {
  paved: "pavimento firme",
  cobblestone: "adoquinado",
  gravel: "grava",
  dirt: "tierra",
  tactile: "pavimento táctil",
};

const RISK_LABELS: Record<string, string> = {
  cruce_sin_semaforo: "cruce sin semáforo",
  mala_iluminacion: "mala iluminación",
  superficie_irregular: "superficie irregular",
  pendiente_pronunciada: "pendiente pronunciada",
  trafico_vehicular: "tráfico vehicular",
  obras_temporales: "obras temporales",
  escalones: "escalones",
  sin_barandilla: "sin barandilla",
  paso_estrecho: "paso estrecho",
};

/**
 * FR-307: Generate audio description using Claude API.
 */
async function generateWithAI(
  segment: SegmentData,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const prompt = `Genera una audio-descripción corta (máximo 80 caracteres) en español para un segmento de ruta peatonal en un campus universitario. La descripción debe ser clara, concisa y útil para una persona con discapacidad visual que navega con auriculares.

Datos del segmento:
- Nombre: ${segment.name}
- Superficie: ${segment.surfaceType}
- Desnivel: ${segment.elevationChange}m
- Nivel de riesgo: ${segment.riskLevel}
${segment.riskDescription ? `- Descripción riesgo: ${segment.riskDescription}` : ""}
${segment.riskFactors?.length ? `- Factores: ${segment.riskFactors.join(", ")}` : ""}

Reglas:
- Máximo 80 caracteres
- Español claro, sin tecnicismos
- Menciona solo lo relevante para seguridad y orientación
- No uses comillas en la respuesta
- Responde SOLO con la descripción, nada más`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.text?.trim() ?? generateFromTemplate(segment);
}

/**
 * FR-307: Generate description from templates (fallback).
 */
export function generateFromTemplate(segment: SegmentData): string {
  const parts: string[] = [];

  // Surface (skip paved — it's the default)
  if (segment.surfaceType !== "paved") {
    const surfaceLabel = SURFACE_LABELS[segment.surfaceType];
    if (surfaceLabel) parts.push(`Suelo de ${surfaceLabel}`);
  }

  // Elevation
  if (Math.abs(segment.elevationChange) >= 3) {
    const direction = segment.elevationChange > 0 ? "subida" : "bajada";
    parts.push(`${direction} de ${Math.abs(segment.elevationChange)}m`);
  }

  // Risk
  if (segment.riskLevel !== "none" && segment.riskFactors?.length) {
    const factorLabels = segment.riskFactors
      .slice(0, 2)
      .map((f) => RISK_LABELS[f] ?? f);
    parts.push(`precaución: ${factorLabels.join(" y ")}`);
  } else if (segment.riskLevel === "none") {
    parts.push("tramo seguro y accesible");
  }

  if (parts.length === 0) {
    return `Tramo ${segment.name}, camino accesible`;
  }

  // Capitalize first letter and join
  const description = parts.join(", ");
  return description.charAt(0).toUpperCase() + description.slice(1);
}

/**
 * FR-307: Generate audio description with AI, falling back to templates.
 */
export async function generateDescription(
  segment: SegmentData,
  apiKey?: string,
): Promise<GeneratedDescription> {
  // Try AI generation if API key is available
  if (apiKey) {
    try {
      const audioDescription = await generateWithAI(segment, apiKey);
      return { audioDescription, source: "ai" };
    } catch {
      // Fall through to template
    }
  }

  // Fallback to template
  return {
    audioDescription: generateFromTemplate(segment),
    source: "template",
  };
}

/**
 * FR-307: Generate descriptions for a batch of segments.
 */
export async function generateBatch(
  segments: SegmentData[],
  apiKey?: string,
): Promise<GeneratedDescription[]> {
  const results: GeneratedDescription[] = [];

  for (const segment of segments) {
    const result = await generateDescription(segment, apiKey);
    results.push(result);
  }

  return results;
}

export const descriptionGenerator = {
  generateDescription,
  generateFromTemplate,
  generateBatch,
};
