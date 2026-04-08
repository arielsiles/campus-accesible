// FR-901: Authentication routes — register and login
import { Hono } from "hono";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { registerUser, loginUser, AuthError } from "../services/authService";

const prisma = new PrismaClient();

const authRoutes = new Hono();

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  name: z.string().min(1, "Nombre requerido").max(100),
  deviceId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

// POST /api/auth/register
authRoutes.post("/auth/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
      400
    );
  }

  try {
    const result = await registerUser(prisma, parsed.data);
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: { code: err.code, message: err.message } }, 409);
    }
    throw err;
  }
});

// POST /api/auth/login
authRoutes.post("/auth/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
      400
    );
  }

  try {
    const result = await loginUser(prisma, parsed.data);
    return c.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: { code: err.code, message: err.message } }, 401);
    }
    throw err;
  }
});

export { authRoutes };
