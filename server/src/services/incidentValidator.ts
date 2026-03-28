// FR-503: AI incident validation service
// Validates incident reports using Claude API with template fallback

import Anthropic from "@anthropic-ai/sdk";

export interface IncidentValidationInput {
  type: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface ValidationResult {
  plausible: boolean;
  confidence: number;
  reason: string;
  suggestedType?: string;
  source: "ai" | "template";
}

// Ciudad Universitaria bounding box (approximate)
const CU_BOUNDS = {
  latMin: 40.44,
  latMax: 40.46,
  lngMin: -3.74,
  lngMax: -3.72,
};

// FR-503: Template-based validation (fallback)
export function validateFromTemplate(
  input: IncidentValidationInput
): ValidationResult {
  // Check geographic bounds
  if (
    input.latitude < CU_BOUNDS.latMin ||
    input.latitude > CU_BOUNDS.latMax ||
    input.longitude < CU_BOUNDS.lngMin ||
    input.longitude > CU_BOUNDS.lngMax
  ) {
    return {
      plausible: false,
      confidence: 0.95,
      reason: "Ubicación fuera del campus universitario",
      source: "template",
    };
  }

  // Check spam patterns
  if (isSpam(input.title, input.description)) {
    return {
      plausible: false,
      confidence: 0.9,
      reason: "Contenido sospechoso de spam",
      source: "template",
    };
  }

  // Check title equals description (lazy/bot reports)
  if (input.title.trim().toLowerCase() === input.description.trim().toLowerCase()) {
    return {
      plausible: false,
      confidence: 0.7,
      reason: "Título y descripción son idénticos",
      source: "template",
    };
  }

  // Default: plausible
  return {
    plausible: true,
    confidence: 0.5,
    reason: "Validación básica superada, pendiente de revisión",
    source: "template",
  };
}

// Spam detection helpers
function isSpam(title: string, description: string): boolean {
  const combined = `${title} ${description}`;

  // Repeated characters (e.g., "aaaaaaa")
  if (/(.)\1{5,}/.test(combined)) return true;

  // URLs
  if (/https?:\/\/|www\./i.test(combined)) return true;

  // All caps gibberish (more than 20 chars of caps)
  if (/[A-Z]{20,}/.test(combined)) return true;

  // Very short meaningful content
  const meaningful = combined.replace(/[^a-záéíóúñ]/gi, "").trim();
  if (meaningful.length < 10) return true;

  return false;
}

// FR-503: AI validation via Claude Haiku
async function validateWithAI(
  input: IncidentValidationInput,
  apiKey: string
): Promise<ValidationResult> {
  const client = new Anthropic({ apiKey });

  const prompt = `Eres un validador de incidencias para una app de accesibilidad del campus universitario Ciudad Universitaria (Madrid).

Evalúa si esta incidencia reportada es plausible y legítima.

Incidencia:
- Tipo: ${input.type}
- Título: "${input.title}"
- Descripción: "${input.description}"
- Coordenadas: ${input.latitude}, ${input.longitude}

Campus Ciudad Universitaria está en Madrid, entre latitudes 40.44-40.46 y longitudes -3.74 a -3.72.

Responde SOLO con un JSON válido (sin markdown):
{"plausible": true/false, "confidence": 0.0-1.0, "reason": "explicación breve"}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return validateFromTemplate(input);
  }

  try {
    const parsed = JSON.parse(textBlock.text.trim());
    return {
      plausible: Boolean(parsed.plausible),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
      reason: String(parsed.reason || "Sin explicación"),
      suggestedType: parsed.suggestedType,
      source: "ai",
    };
  } catch {
    return validateFromTemplate(input);
  }
}

// FR-503: Main validation function — tries AI, falls back to template
export async function validateIncident(
  input: IncidentValidationInput,
  apiKey?: string
): Promise<ValidationResult> {
  if (apiKey) {
    try {
      return await validateWithAI(input, apiKey);
    } catch {
      // Fall through to template
    }
  }

  return validateFromTemplate(input);
}

export const incidentValidator = {
  validateIncident,
  validateFromTemplate,
};
