// FR-1201: Simplify text for easy-read accessibility profile using Claude Haiku
import { Hono } from "hono";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "../middleware/rateLimitMiddleware";

const MODEL = "claude-haiku-4-5";

const simplifySchema = z.object({
  text: z.string().min(2).max(2000),
});

const SYSTEM_PROMPT = `Eres un asistente que simplifica texto a "lectura facil" para personas con discapacidad cognitiva o dislexia.

Reglas:
- Frases cortas (maximo 8 palabras)
- Una idea por frase
- Vocabulario simple, evita tecnicismos
- Mantiene la informacion esencial
- Responde SOLO con el texto simplificado, sin explicaciones
- Si el texto ya es simple o muy corto, devuelvelo tal cual
- Si el texto no se entiende o esta corrupto, responde "TEXTO_INVALIDO"`;

export const textSimplifyRoutes = new Hono();

textSimplifyRoutes.post(
  "/text/simplify",
  // Reasonable limits — simpler than vision
  rateLimit({ maxRequests: 30, windowSeconds: 60, endpoint: "text:simplify:1m" }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = simplifySchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
        400
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Graceful fallback: return text as-is
      return c.json({ simplified: parsed.data.text, source: "fallback" });
    }

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: parsed.data.text }],
      });

      const block = response.content.find((b) => b.type === "text");
      const simplified = block && "text" in block ? block.text.trim() : parsed.data.text;
      const isInvalid = simplified === "TEXTO_INVALIDO" || simplified === "";

      return c.json({
        simplified: isInvalid ? parsed.data.text : simplified,
        source: isInvalid ? "fallback" : "ai",
      });
    } catch {
      // Fallback to original text on error
      return c.json({ simplified: parsed.data.text, source: "fallback" });
    }
  }
);
