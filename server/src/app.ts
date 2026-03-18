// FR-007: Hono app definition (separate from server startup for testing)
import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health";
import { routeRoutes } from "./routes/routes";

const app = new Hono();

// CORS configuration
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:8081",
  })
);

// Routes
app.route("/api", healthRoutes);
app.route("/api", routeRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    { error: { code: "NOT_FOUND", message: "Resource not found" } },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    500
  );
});

export default app;
