// FR-007: Hono app definition (separate from server startup for testing)
import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health";
import { routeRoutes } from "./routes/routes";
import { calculateRoutes } from "./routes/calculate";
import { waypointRoutes } from "./routes/waypoints";
import { easyReadRoutes } from "./routes/easyRead";
import { incidentRoutes } from "./routes/incidents";
import { segmentRoutes } from "./routes/segments";
import { notificationRoutes } from "./routes/notifications";
import { campusExportRoutes } from "./routes/campusExport";
import { campusImportRoutes } from "./routes/campusImport";
import { routeManagementRoutes } from "./routes/routeManagement";
import { authRoutes } from "./routes/auth";
import { campusRoutes } from "./routes/campuses";
import { moderationRoutes } from "./routes/moderation";
import { userRoutes } from "./routes/users";
import { visionRoutes } from "./routes/vision";
import { textSimplifyRoutes } from "./routes/textSimplify";
import { contextRoutes } from "./routes/context";
import { telemetryRoutes } from "./routes/telemetry";
import { feedbackRoutes } from "./routes/feedback";
import { reweightingRoutes } from "./routes/reweighting";

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
app.route("/api", calculateRoutes);
app.route("/api", waypointRoutes);
app.route("/api", easyReadRoutes);
app.route("/api", incidentRoutes);
app.route("/api", segmentRoutes);
app.route("/api", notificationRoutes);
app.route("/api", campusExportRoutes);
app.route("/api", campusImportRoutes);
app.route("/api", routeManagementRoutes);
app.route("/api", authRoutes);
app.route("/api", campusRoutes);
app.route("/api", moderationRoutes);
app.route("/api", userRoutes);
app.route("/api", visionRoutes);
app.route("/api", textSimplifyRoutes);
app.route("/api", contextRoutes);
app.route("/api", telemetryRoutes);
app.route("/api", feedbackRoutes);
app.route("/api", reweightingRoutes);

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
