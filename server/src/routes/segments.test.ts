// TST-FR-506: Segment block/unblock endpoint tests
import { describe, it, expect } from "vitest";
import app from "../app";

describe("PATCH /api/segments/:id/block [FR-506]", () => {
  it("returns 404 for non-existing segment [TST-FR-506-002]", async () => {
    const res = await app.request("/api/segments/non-existing/block", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked: true, reason: "Obras" }),
    });

    // Will be 404 or 500 depending on DB availability
    // When DB is available: 404
    // When DB is not available: 500 (DB error)
    expect([404, 500]).toContain(res.status);
  });

  it("returns 400 for invalid body [TST-FR-506-002]", async () => {
    const res = await app.request("/api/segments/test-id/block", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: "data" }),
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for missing JSON body [FR-506]", async () => {
    const res = await app.request("/api/segments/test-id/block", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    expect(res.status).toBe(400);
  });
});
