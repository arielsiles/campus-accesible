// TST-FR-207-001, TST-FR-207-002, TST-FR-207-003: Route calculation endpoint tests
import { describe, it, expect } from "vitest";
import app from "../app";

describe("POST /api/routes/calculate [FR-207]", () => {
  it("returns calculated route for valid waypoints [TST-FR-207-001]", async () => {
    const res = await app.request("/api/routes/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: "wp-medicina",
        destination: "wp-metro-cu",
      }),
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.route).toBeDefined();
    expect(body.route.origin.waypointId).toBe("wp-medicina");
    expect(body.route.destination.waypointId).toBe("wp-metro-cu");
    expect(body.route.totalDistance).toBeGreaterThan(0);
    expect(body.route.estimatedTime).toBeGreaterThan(0);
    expect(body.route.waypoints.length).toBeGreaterThan(1);
    expect(body.route.instructions.length).toBeGreaterThan(0);
    expect(body.route.geojson.type).toBe("FeatureCollection");

    // Verify instructions have arrive as last action
    const lastInstruction =
      body.route.instructions[body.route.instructions.length - 1];
    expect(lastInstruction.action).toBe("arrive");
    expect(lastInstruction.description).toContain("Has llegado");
  });

  it("returns 404 for non-existing waypoint [TST-FR-207-002]", async () => {
    const res = await app.request("/api/routes/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: "wp-no-existe",
        destination: "wp-metro-cu",
      }),
    });

    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error.code).toBe("WAYPOINT_NOT_FOUND");
  });

  it("returns 400 for missing body [TST-FR-207-003]", async () => {
    const res = await app.request("/api/routes/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for same origin and destination [FR-207]", async () => {
    const res = await app.request("/api/routes/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: "wp-medicina",
        destination: "wp-medicina",
      }),
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe("SAME_ORIGIN_DESTINATION");
  });
});
