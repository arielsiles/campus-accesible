// FR-402: Easy-read text simplification endpoint
import { Hono } from "hono";
import { z } from "zod";
import { easyReadService } from "../services/easyReadService";

export const easyReadRoutes = new Hono();

const easyReadSchema = z.object({
  text: z.string().min(1, "text is required"),
  context: z
    .enum(["navigation", "risk", "description", "general"])
    .optional()
    .default("general"),
});

// POST /api/text/easy-read
easyReadRoutes.post("/text/easy-read", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      400
    );
  }

  const parsed = easyReadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
        },
      },
      400
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const result = await easyReadService.simplifyText(
    parsed.data.text,
    parsed.data.context,
    apiKey || undefined
  );

  return c.json(result);
});
