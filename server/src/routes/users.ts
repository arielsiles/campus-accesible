// FR-906: User profile routes
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

const userRoutes = new Hono();

// GET /api/users/:id/routes — user's created routes
userRoutes.get("/users/:id/routes", requireAuth(), async (c) => {
  const userId = c.req.param("id");
  const user = c.get("user");

  // Only allow users to see their own routes (or admin/reviewer can see anyone's)
  if (user.sub !== userId && !["admin", "reviewer"].includes(user.role)) {
    return c.json(
      { error: { code: "FORBIDDEN", message: "No tiene permisos" } },
      403
    );
  }

  const routes = await prisma.route.findMany({
    where: { creatorId: userId },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json(
    routes.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

// GET /api/users/me — current user profile
userRoutes.get("/users/me", requireAuth(), async (c) => {
  const user = c.get("user");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      reputation: true,
      level: true,
      createdAt: true,
      _count: {
        select: {
          routes: true,
        },
      },
    },
  });

  if (!dbUser) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Usuario no encontrado" } },
      404
    );
  }

  return c.json({
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    reputation: dbUser.reputation,
    level: dbUser.level,
    createdAt: dbUser.createdAt.toISOString(),
    routeCount: dbUser._count.routes,
  });
});

export { userRoutes };
