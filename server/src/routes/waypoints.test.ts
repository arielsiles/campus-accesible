// TST-FR-206-001, TST-FR-206-002: Waypoint search endpoint tests
import { describe, it, expect } from "vitest";
import app from "../app";

describe("GET /api/waypoints/search [FR-206]", () => {
  it("returns matching waypoints for valid query [TST-FR-206-001]", async () => {
    const res = await app.request("/api/waypoints/search?q=medicina");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const result = body[0];
    expect(result.name.toLowerCase()).toContain("medicina");
    expect(result).toHaveProperty("waypointId");
    expect(result).toHaveProperty("coordinates");
    expect(result).toHaveProperty("waypointType");
  });

  it("returns case-insensitive results [TST-FR-206-001]", async () => {
    const res = await app.request("/api/waypoints/search?q=METRO");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].name.toLowerCase()).toContain("metro");
  });

  it("returns empty array for no matches [TST-FR-206-002]", async () => {
    const res = await app.request("/api/waypoints/search?q=zzzznoexiste");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns 400 for query shorter than 2 chars [FR-206]", async () => {
    const res = await app.request("/api/waypoints/search?q=a");

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns max 10 results [FR-206]", async () => {
    const res = await app.request("/api/waypoints/search?q=Facultad");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.length).toBeLessThanOrEqual(10);
  });

  it("includes transport info for transport_stop waypoints [FR-206]", async () => {
    const res = await app.request("/api/waypoints/search?q=Metro");

    expect(res.status).toBe(200);

    const body = await res.json();
    const metroStop = body.find((r: Record<string, unknown>) =>
      (r.name as string).includes("Metro")
    );

    expect(metroStop).toBeDefined();
    expect(metroStop.transportInfo).toBeDefined();
    expect(metroStop.transportInfo.transportType).toBe("metro");
  });
});
