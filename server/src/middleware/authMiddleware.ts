// FR-903: Authorization middleware — JWT verification + role checking
import type { Context, Next } from "hono";
import { verifyToken, type TokenPayload } from "../services/authService";

/** Augment Hono context with user data */
declare module "hono" {
  interface ContextVariableMap {
    user: TokenPayload;
  }
}

/** Middleware: require valid JWT token */
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "Token requerido" } },
        401
      );
    }

    const token = authHeader.slice(7);
    try {
      const payload = await verifyToken(token);
      c.set("user", payload);
      await next();
    } catch {
      return c.json(
        { error: { code: "INVALID_TOKEN", message: "Token inválido o expirado" } },
        401
      );
    }
  };
}

/** Middleware: require specific role(s) — must be used after requireAuth */
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role)) {
      return c.json(
        { error: { code: "FORBIDDEN", message: "No tiene permisos para esta acción" } },
        403
      );
    }
    await next();
  };
}
