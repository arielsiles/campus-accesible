// FR-007: Routes endpoint tests
import { describe, it, expect } from "vitest";
import app from "../app";

describe("GET /api/routes [FR-007]", () => {
  it("responds 200 with array of routes [FR-007]", async () => {
    const res = await app.request("/api/routes");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("id");
    expect(body[0]).toHaveProperty("name");
    expect(body[0]).toHaveProperty("description");
  });
});

describe("GET /api/routes/:id [FR-007]", () => {
  it("responds 200 with GeoJSON for existing route [FR-007]", async () => {
    const res = await app.request("/api/routes/test-route-1");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.type).toBe("FeatureCollection");
    expect(body.properties.id).toBe("test-route-1");
    expect(body.features.length).toBeGreaterThan(0);

    // Check waypoint features
    const waypoints = body.features.filter(
      (f: Record<string, unknown>) =>
        (f.properties as Record<string, unknown>).featureType === "waypoint"
    );
    expect(waypoints.length).toBe(5);
    expect(
      (waypoints[0].geometry as Record<string, unknown>).type
    ).toBe("Point");

    // Check segment features
    const segments = body.features.filter(
      (f: Record<string, unknown>) =>
        (f.properties as Record<string, unknown>).featureType ===
        "route-segment"
    );
    expect(segments.length).toBe(4);
    expect(
      (segments[0].geometry as Record<string, unknown>).type
    ).toBe("LineString");
  });

  it("responds 404 for non-existing route [FR-007]", async () => {
    const res = await app.request("/api/routes/no-existe");

    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
