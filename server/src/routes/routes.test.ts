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

  it("includes transportType and lines for transport_stop waypoints [TST-FR-205-001]", async () => {
    const res = await app.request("/api/routes/test-route-1");
    const body = await res.json();

    const transportStops = body.features.filter(
      (f: Record<string, unknown>) => {
        const props = f.properties as Record<string, unknown>;
        return props.waypointType === "transport_stop";
      }
    );

    expect(transportStops.length).toBeGreaterThan(0);

    const metroStop = transportStops.find(
      (f: Record<string, unknown>) =>
        (f.properties as Record<string, unknown>).waypointId === "wp-metro-cu"
    );
    expect(metroStop).toBeDefined();
    expect(
      (metroStop.properties as Record<string, unknown>).transportType
    ).toBe("metro");
    expect(
      (metroStop.properties as Record<string, unknown>).transportLines
    ).toEqual(["6"]);
  });

  it("includes riskDescription and riskFactors for segments with risks [TST-FR-304-001]", async () => {
    const res = await app.request("/api/routes/test-route-1");
    const body = await res.json();

    const segments = body.features.filter(
      (f: Record<string, unknown>) =>
        (f.properties as Record<string, unknown>).featureType === "route-segment"
    );

    // seg-bus-metro has medium risk with factors
    const riskSegment = segments.find(
      (f: Record<string, unknown>) =>
        (f.properties as Record<string, unknown>).segmentId === "seg-bus-metro"
    );
    expect(riskSegment).toBeDefined();
    const props = riskSegment.properties as Record<string, unknown>;
    expect(props.riskLevel).toBe("medium");
    expect(props.riskDescription).toBe("Cruce con tráfico moderado sin semáforo");
    expect(props.riskFactors).toEqual(["cruce_sin_semaforo", "trafico_vehicular"]);
    expect(props.audioDescription).toContain("Precaución");

    // seg-medicina-odonto has no risk — should not have riskDescription
    const safeSegment = segments.find(
      (f: Record<string, unknown>) =>
        (f.properties as Record<string, unknown>).segmentId === "seg-medicina-odonto"
    );
    expect(safeSegment).toBeDefined();
    const safeProps = safeSegment.properties as Record<string, unknown>;
    expect(safeProps.riskLevel).toBe("none");
    expect(safeProps.riskDescription).toBeUndefined();
    expect(safeProps.riskFactors).toBeUndefined();
  });

  it("includes physical accessibility data in segments [TST-FR-401-001]", async () => {
    const res = await app.request("/api/routes/test-route-1");
    const body = await res.json();

    const segments = body.features.filter(
      (f: Record<string, unknown>) =>
        (f.properties as Record<string, unknown>).featureType === "route-segment"
    );

    // seg-medicina-odonto — accessible with ramp
    const accessibleSeg = segments.find(
      (f: Record<string, unknown>) =>
        (f.properties as Record<string, unknown>).segmentId === "seg-medicina-odonto"
    );
    expect(accessibleSeg).toBeDefined();
    const accessibleProps = accessibleSeg.properties as Record<string, unknown>;
    expect(accessibleProps.hasRamp).toBe(true);
    expect(accessibleProps.hasStairs).toBe(false);
    expect(accessibleProps.pathWidth).toBe(2.5);
    expect(accessibleProps.maxSlope).toBe(3.2);
    expect(accessibleProps.surfaceQuality).toBe("good");

    // seg-bus-metro — has stairs
    const stairsSeg = segments.find(
      (f: Record<string, unknown>) =>
        (f.properties as Record<string, unknown>).segmentId === "seg-bus-metro"
    );
    expect(stairsSeg).toBeDefined();
    const stairsProps = stairsSeg.properties as Record<string, unknown>;
    expect(stairsProps.hasStairs).toBe(true);
    expect(stairsProps.hasRamp).toBe(false);
  });

  it("responds 404 for non-existing route [FR-007]", async () => {
    const res = await app.request("/api/routes/no-existe");

    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
