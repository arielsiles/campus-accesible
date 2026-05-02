// FR-1102, FR-1103: Vision service using Claude Haiku 4.5 for accessibility-aware image description
import Anthropic from "@anthropic-ai/sdk";
import type { PrismaClient } from "@prisma/client";

const MODEL = "claude-haiku-4-5";

// FR-1101, NFR-1101: Pricing for budget tracking (Haiku 4.5)
// Reference: https://www.anthropic.com/pricing — keep in sync if pricing changes
const PRICING = {
  inputPerMillion: 1.0, // USD per 1M input tokens
  outputPerMillion: 5.0, // USD per 1M output tokens
};

export type AccessibilityProfile =
  | "standard"
  | "visual_disability"
  | "reduced_mobility"
  | "deaf"
  | "easy_read";

export interface VisionRequest {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png";
  profile: AccessibilityProfile;
  latitude?: number;
  longitude?: number;
  context?: string; // segment info, nearby waypoints, incidents
}

export interface VisionResponse {
  description: string;
  obstacles: string[];
  surface: string;
  riskLevel: "none" | "low" | "medium" | "high";
  suggestions: string[];
  confidence: number;
  source: "ai" | "fallback";
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
}

// FR-1102: Profile-specific prompt focus
const PROFILE_PROMPTS: Record<AccessibilityProfile, string> = {
  visual_disability:
    "El usuario tiene discapacidad visual. PRIORIZA: obstaculos en el camino (a que distancia y donde), tipo de superficie, senalizacion tactil, cambios de nivel (escalones, bordillos), iluminacion. Describe distancias y direcciones en relojaje (ej. 'a las 2 en punto'). Frases claras y direcciones precisas.",
  reduced_mobility:
    "El usuario tiene movilidad reducida (silla de ruedas o ayudas tecnicas). PRIORIZA: presencia y ubicacion de escaleras, rampas, bordillos, ancho del paso (estimado en metros), pendientes visibles, calidad del suelo. Indica si la zona es accesible o si hay que buscar alternativa.",
  deaf:
    "El usuario es sordo. PRIORIZA elementos visuales: senales de peligro, semaforos, gestos de personas que pueden alertar, vehiculos cercanos, elementos visuales que sustituyan a senales auditivas.",
  easy_read:
    "El usuario necesita lectura facil. Usa frases cortas (maximo 10 palabras), vocabulario simple, una idea por frase. Estructura: 'Hay X. Esta a tu izquierda/derecha. Es seguro/peligroso.' Evita terminos tecnicos.",
  standard:
    "Describe el entorno de forma general: edificios, calles, puntos de interes, direccion del camino. 2-4 frases.",
};

const SYSTEM_PROMPT = `Eres un asistente de navegacion accesible. Tu unica tarea es describir el entorno visual capturado para ayudar a una persona a navegar de forma segura.

REGLAS ESTRICTAS:
- Responde SIEMPRE en espanol
- NO identifiques personas (rostros, nombres) — describelas solo como "una persona caminando" si es relevante para la navegacion
- Manten descripcion entre 2-5 frases
- Prioriza informacion util para navegar sobre detalles esteticos
- Si la imagen es muy oscura, borrosa o no muestra entorno relevante, dilo
- Si detectas riesgos, listalos claramente

Devuelve respuesta como JSON valido (sin texto adicional):
{
  "description": "texto descriptivo principal",
  "obstacles": ["lista de obstaculos detectados"],
  "surface": "paved|cobblestone|gravel|dirt|tactile|unknown",
  "riskLevel": "none|low|medium|high",
  "suggestions": ["sugerencias de accion"],
  "confidence": 0.0-1.0
}`;

/**
 * FR-1102: Build the user prompt combining profile + context.
 */
function buildUserPrompt(req: VisionRequest): string {
  const lines: string[] = [PROFILE_PROMPTS[req.profile]];

  if (req.context) {
    lines.push(`\nContexto de navegacion: ${req.context}`);
  }
  if (req.latitude != null && req.longitude != null) {
    lines.push(
      `\nPosicion GPS: ${req.latitude.toFixed(5)}, ${req.longitude.toFixed(5)}`
    );
  }

  return lines.join("\n");
}

/**
 * FR-1102, NFR-1101: Calculate USD cost from token usage.
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens * PRICING.inputPerMillion) / 1_000_000 +
    (outputTokens * PRICING.outputPerMillion) / 1_000_000
  );
}

/**
 * FR-1102: Parse Claude response as JSON, with fallback if parsing fails.
 */
function parseClaudeResponse(text: string): Omit<VisionResponse, "source" | "costUsd" | "inputTokens" | "outputTokens"> {
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      description: String(parsed.description ?? "Sin descripcion disponible"),
      obstacles: Array.isArray(parsed.obstacles) ? parsed.obstacles.map(String) : [],
      surface: String(parsed.surface ?? "unknown"),
      riskLevel: ["none", "low", "medium", "high"].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : "none",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [],
      confidence: typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
    };
  } catch {
    // FR-1102 fallback: use raw text as description
    return {
      description: text.slice(0, 500),
      obstacles: [],
      surface: "unknown",
      riskLevel: "none",
      suggestions: [],
      confidence: 0.3,
    };
  }
}

/**
 * FR-1102: Main vision describe function.
 */
export async function describeImage(
  req: VisionRequest,
  apiKey?: string
): Promise<VisionResponse> {
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new VisionError("VISION_NO_API_KEY", "Anthropic API key not configured");
  }

  const client = new Anthropic({ apiKey: key });

  const result = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: req.mediaType,
              data: req.imageBase64,
            },
          },
          {
            type: "text",
            text: buildUserPrompt(req),
          },
        ],
      },
    ],
  });

  const textBlock = result.content.find((b) => b.type === "text");
  const text = textBlock && "text" in textBlock ? textBlock.text : "";
  const parsed = parseClaudeResponse(text);

  const inputTokens = result.usage.input_tokens;
  const outputTokens = result.usage.output_tokens;
  const costUsd = calculateCost(inputTokens, outputTokens);

  return {
    ...parsed,
    source: "ai",
    costUsd,
    inputTokens,
    outputTokens,
  };
}

/**
 * NFR-1101: Get current month usage record (creates if missing).
 */
export async function getCurrentMonthUsage(
  prisma: PrismaClient
): Promise<{ totalUsd: number; totalCalls: number; month: string }> {
  const month = currentMonth();
  const usage = await prisma.visionUsage.upsert({
    where: { month },
    create: { month },
    update: {},
  });
  return { totalUsd: usage.totalUsd, totalCalls: usage.totalCalls, month };
}

/**
 * NFR-1101: Increment monthly usage after successful API call.
 */
export async function recordUsage(
  prisma: PrismaClient,
  costUsd: number
): Promise<void> {
  const month = currentMonth();
  await prisma.visionUsage.upsert({
    where: { month },
    create: { month, totalUsd: costUsd, totalCalls: 1 },
    update: {
      totalUsd: { increment: costUsd },
      totalCalls: { increment: 1 },
    },
  });
}

/**
 * Track errors separately so they don't burn budget but are visible.
 */
export async function recordError(prisma: PrismaClient): Promise<void> {
  const month = currentMonth();
  await prisma.visionUsage.upsert({
    where: { month },
    create: { month, totalErrors: 1 },
    update: { totalErrors: { increment: 1 } },
  });
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export class VisionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "VisionError";
  }
}
