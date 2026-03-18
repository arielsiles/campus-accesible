// FR-007: Health endpoint tests
import { describe, it, expect } from "vitest";
import app from "../app";

describe("GET /api/health [FR-007]", () => {
  it("responds 200 with status ok and timestamp [FR-007]", async () => {
    const res = await app.request("/api/health");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});
