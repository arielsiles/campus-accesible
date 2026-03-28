// TST-FR-505: Notification endpoint tests
import { describe, it, expect } from "vitest";
import app from "../app";

describe("POST /api/notifications/subscribe [FR-505]", () => {
  it("returns 400 for invalid body [TST-FR-505-001]", async () => {
    const res = await app.request("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: "test" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid push token format [TST-FR-505-001]", async () => {
    const res = await app.request("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: "test-device",
        pushToken: "invalid-token",
        segmentIds: ["seg-1"],
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toContain("push token");
  });
});

describe("DELETE /api/notifications/unsubscribe [FR-505]", () => {
  it("returns 400 for missing deviceId [TST-FR-505-002]", async () => {
    const res = await app.request("/api/notifications/unsubscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
