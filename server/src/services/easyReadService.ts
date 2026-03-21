// FR-402: Easy-read text simplification service using Claude API
// Follows Plena Inclusión guidelines: short sentences, simple vocabulary,
// affirmative structure, no subordinates, no double negation

import Anthropic from "@anthropic-ai/sdk";

export interface EasyReadResult {
  original: string;
  simplified: string;
  source: "ai" | "template";
}

export type EasyReadContext = "navigation" | "risk" | "description" | "general";

// FR-402: Template-based simplification patterns (fallback)
const NAVIGATION_SIMPLIFICATIONS: Record<string, string> = {
  "Continúa recto": "Camina recto",
  "Gira a la izquierda": "Gira a la izquierda",
  "Gira a la derecha": "Gira a la derecha",
  "Has llegado a tu destino": "Ya llegaste",
};

/**
 * FR-402: Simplify text using Claude API (Haiku 4.5)
 * NFR-402: Max 10 words per sentence, simple vocabulary
 */
async function simplifyWithAI(
  text: string,
  context: EasyReadContext,
  apiKey: string
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const prompt = `Simplifica este texto a lectura fácil siguiendo las guías de Plena Inclusión España.

Texto original: "${text}"
Contexto: ${context === "navigation" ? "instrucción de navegación" : context === "risk" ? "aviso de riesgo" : "descripción general"}

Reglas estrictas:
- Máximo 10 palabras por frase
- Vocabulario sencillo, palabras comunes
- Frases afirmativas, sin subordinadas
- Sin doble negación ni metáforas
- Español claro y directo
- Usa punto para separar ideas
- Si hay números (metros, porcentajes), mantenlos
- Responde SOLO con el texto simplificado, nada más`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock?.text?.trim() ?? simplifyFromTemplate(text, context);
}

/**
 * FR-402: Template-based simplification (fallback when API unavailable)
 */
export function simplifyFromTemplate(
  text: string,
  context: EasyReadContext
): string {
  if (context === "navigation") {
    // Apply known navigation simplifications
    for (const [pattern, replacement] of Object.entries(
      NAVIGATION_SIMPLIFICATIONS
    )) {
      if (text.startsWith(pattern)) {
        // Extract destination/distance info
        const rest = text.slice(pattern.length).trim();
        const distanceMatch = rest.match(/(\d+)\s*metros?/);
        const destinationMatch = rest.match(/hacia\s+(.+?)(?:\s*\(|$)/);

        const parts: string[] = [replacement];
        if (destinationMatch) {
          parts.push(`Ve a ${destinationMatch[1].trim()}.`);
        }
        if (distanceMatch) {
          parts.push(`Son ${distanceMatch[1]} metros.`);
        }
        return parts.join(". ").replace(/\.\./g, ".");
      }
    }
  }

  if (context === "risk") {
    // Simplify risk descriptions
    return text
      .replace(/Precaución:/g, "Cuidado.")
      .replace(/cruce sin semáforo/g, "Hay un cruce. No hay semáforo")
      .replace(/tráfico vehicular/g, "Pasan coches")
      .replace(/superficie irregular/g, "El suelo es irregular")
      .replace(/pendiente pronunciada/g, "Hay una cuesta")
      .replace(/mala iluminación/g, "Hay poca luz")
      .replace(/escalones/g, "Hay escalones")
      .replace(/paso estrecho/g, "El camino es estrecho");
  }

  // General: split long sentences at conjunctions
  return text
    .replace(/\s*,\s*/g, ". ")
    .replace(/\s+y\s+/g, ". ")
    .replace(/\.\./g, ".");
}

/**
 * FR-402: Main simplification function — tries AI, falls back to templates
 */
export async function simplifyText(
  text: string,
  context: EasyReadContext = "general",
  apiKey?: string
): Promise<EasyReadResult> {
  if (apiKey) {
    try {
      const simplified = await simplifyWithAI(text, context, apiKey);
      return { original: text, simplified, source: "ai" };
    } catch {
      // Fall through to template
    }
  }

  return {
    original: text,
    simplified: simplifyFromTemplate(text, context),
    source: "template",
  };
}

export const easyReadService = {
  simplifyText,
  simplifyFromTemplate,
};
