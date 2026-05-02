// FR-1102, NFR-1101: Per-identity rate limiting using PostgreSQL counters
import type { Context, Next } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface RateLimitConfig {
  /** Max requests allowed per window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Endpoint identifier for separate counters */
  endpoint: string;
}

/**
 * FR-1102: Rate limit middleware. Uses authenticated user id when available,
 * otherwise falls back to client IP. Sliding window via Postgres upsert.
 */
export function rateLimit(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";
    const identity = user?.sub ?? `ip:${ip}`;

    const now = new Date();

    // Fetch current entry
    const existing = await prisma.rateLimitEntry.findUnique({
      where: {
        identity_endpoint: { identity, endpoint: config.endpoint },
      },
    });

    if (existing && existing.windowEnd > now) {
      // Within active window
      if (existing.count >= config.maxRequests) {
        const retryAfterMs = existing.windowEnd.getTime() - now.getTime();
        c.header("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
        return c.json(
          {
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: `Has hecho demasiadas peticiones. Espera ${Math.ceil(retryAfterMs / 1000)} segundos.`,
            },
          },
          429
        );
      }
      await prisma.rateLimitEntry.update({
        where: {
          identity_endpoint: { identity, endpoint: config.endpoint },
        },
        data: { count: { increment: 1 } },
      });
    } else {
      // Start a new window (or first time)
      const windowEnd = new Date(now.getTime() + config.windowSeconds * 1000);
      await prisma.rateLimitEntry.upsert({
        where: {
          identity_endpoint: { identity, endpoint: config.endpoint },
        },
        create: { identity, endpoint: config.endpoint, count: 1, windowEnd },
        update: { count: 1, windowEnd },
      });
    }

    await next();
  };
}
