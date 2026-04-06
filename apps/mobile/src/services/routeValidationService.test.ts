// TST-FR-704: Route validation service tests
import { describe, it, expect } from "vitest";
import { validateRoute, serializeRouteToGeoJSON } from "./routeValidationService";
import type { DraftWaypoint, DraftSegment } from "../store/routeCreatorStore";

const wpA: DraftWaypoint = {
  id: "wp-a", name: "Punto A", description: "Inicio",
  waypointType: "entrance", latitude: 40.44, longitude: -3.72, orderIndex: 0,
};
const wpB: DraftWaypoint = {
  id: "wp-b", name: "Punto B", description: "Final",
  waypointType: "building", latitude: 40.45, longitude: -3.73, orderIndex: 1,
};

const segAB: DraftSegment = {
  id: "seg-ab", name: "A a B", coordinates: [[-3.72, 40.44], [-3.73, 40.45]],
  surfaceType: "paved", elevationChange: 0, riskLevel: "none",
  riskDescription: "", riskFactors: [], hasRamp: false, hasStairs: false,
  pathWidth: 2.0, maxSlope: 0, surfaceQuality: "good", orderIndex: 0,
};

describe("validateRoute [FR-704]", () => {
  it("accepts valid route [TST-FR-704-002]", () => {
    const result = validateRoute("Mi Ruta", "Una ruta de prueba", [wpA, wpB], [segAB]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects route with < 2 waypoints [TST-FR-704-001]", () => {
    const result = validateRoute("Mi Ruta", "Desc", [wpA], []);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("al menos 2 puntos"))).toBe(true);
  });

  it("rejects route with empty name [FR-704]", () => {
    const result = validateRoute("", "Desc", [wpA, wpB], [segAB]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "routeName")).toBe(true);
  });

  it("rejects waypoint without name [FR-704]", () => {
    const wpNoName = { ...wpA, name: "" };
    const result = validateRoute("Ruta", "Desc", [wpNoName, wpB], [segAB]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field.includes("waypoint"))).toBe(true);
  });

  it("rejects mismatched segment count [FR-704]", () => {
    const result = validateRoute("Ruta", "Desc", [wpA, wpB], []); // 0 segments, need 1
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("segmentos"))).toBe(true);
  });
});

describe("serializeRouteToGeoJSON [FR-707]", () => {
  it("serializes to valid GeoJSON FeatureCollection [TST-FR-707-001]", () => {
    const geojson = serializeRouteToGeoJSON("Test Route", "A test", [wpA, wpB], [segAB]);

    expect(geojson.type).toBe("FeatureCollection");
    expect((geojson.properties as Record<string, string>).name).toBe("Test Route");
    expect(Array.isArray(geojson.features)).toBe(true);
    expect((geojson.features as unknown[]).length).toBe(3); // 2 waypoints + 1 segment
  });

  it("waypoints have Point geometry [TST-FR-707-001]", () => {
    const geojson = serializeRouteToGeoJSON("R", "D", [wpA], []);
    const features = geojson.features as Array<Record<string, unknown>>;
    const wp = features[0];
    expect((wp.geometry as Record<string, unknown>).type).toBe("Point");
    expect((wp.properties as Record<string, unknown>).featureType).toBe("waypoint");
  });

  it("segments have LineString geometry [TST-FR-707-001]", () => {
    const geojson = serializeRouteToGeoJSON("R", "D", [wpA, wpB], [segAB]);
    const features = geojson.features as Array<Record<string, unknown>>;
    const seg = features[2]; // after 2 waypoints
    expect((seg.geometry as Record<string, unknown>).type).toBe("LineString");
    expect((seg.properties as Record<string, unknown>).featureType).toBe("route-segment");
  });
});
