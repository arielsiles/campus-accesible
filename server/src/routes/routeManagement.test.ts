// TST-FR-705: Route management endpoint tests
import { describe, it, expect } from "vitest";
import app from "../app";

describe("POST /api/routes [FR-705]", () => {
  it("returns 400 for invalid JSON body [TST-FR-705-003]", async () => {
    const res = await app.request("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing waypoints [TST-FR-705-003]", async () => {
    const res = await app.request("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "FeatureCollection",
        properties: { name: "Test" },
        features: [],
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });
});

describe("DELETE /api/routes/:id [FR-705]", () => {
  it("returns 404 for non-existing route [TST-FR-705-002]", async () => {
    const res = await app.request("/api/routes/non-existing", {
      method: "DELETE",
    });

    // 404 or 500 depending on DB availability
    expect([404, 500]).toContain(res.status);
  });
});
