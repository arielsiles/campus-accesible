// FR-302: Audio description service tests
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock expo-speech before importing services
vi.mock("expo-speech", () => ({
  speak: vi.fn(),
  stop: vi.fn(),
}));
import {
  SurfaceType,
  RiskLevel,
  WaypointType,
} from "@campus-gps/shared-types";

type RouteSegmentProperties = import("@campus-gps/shared-types").RouteSegmentProperties;
type WaypointProperties = import("@campus-gps/shared-types").WaypointProperties;
import {
  describeSurface,
  describeElevation,
  describeRisk,
  describeWaypoint,
  describeSegment,
  setDescriptionMode,
  resetAnnouncementState,
} from "./audioDescriptionService";

beforeEach(() => {
  setDescriptionMode("full");
  resetAnnouncementState();
});

describe("describeSurface [FR-302]", () => {
  it("TST-FR-302-001: generates description for cobblestone surface", () => {
    const result = describeSurface(SurfaceType.Cobblestone);
    expect(result).toBe("Atención: suelo adoquinado");
  });

  it("generates description for gravel surface", () => {
    const result = describeSurface(SurfaceType.Gravel);
    expect(result).toBe("Atención: suelo de grava, terreno suelto");
  });

  it("generates description for paved surface", () => {
    const result = describeSurface(SurfaceType.Paved);
    expect(result).toBe("Superficie pavimentada, terreno firme");
  });

  it("generates description for tactile surface", () => {
    const result = describeSurface(SurfaceType.Tactile);
    expect(result).toBe("Pavimento táctil disponible");
  });
});

describe("describeElevation [FR-302]", () => {
  it("returns null for small elevation changes", () => {
    expect(describeElevation(2)).toBeNull();
    expect(describeElevation(-1)).toBeNull();
    expect(describeElevation(0)).toBeNull();
  });

  it("describes uphill for positive elevation > threshold", () => {
    const result = describeElevation(5);
    expect(result).toBe(
      "Cuesta arriba pronunciada, 5 metros de desnivel",
    );
  });

  it("describes downhill for negative elevation > threshold", () => {
    const result = describeElevation(-4);
    expect(result).toBe(
      "Cuesta abajo pronunciada, 4 metros de desnivel",
    );
  });
});

describe("describeRisk [FR-302]", () => {
  it("TST-FR-302-002: generates description for high risk segment", () => {
    const result = describeRisk(
      RiskLevel.High,
      "Cruce peligroso sin semáforo",
    );
    expect(result).toBe(
      "¡Atención! Zona de riesgo alto: Cruce peligroso sin semáforo",
    );
  });

  it("generates description for medium risk with factors", () => {
    const result = describeRisk(RiskLevel.Medium, undefined, [
      "cruce_sin_semaforo",
      "trafico_vehicular",
    ]);
    expect(result).toBe(
      "Precaución: cruce sin semáforo, tráfico vehicular cercano",
    );
  });

  it("generates description for low risk", () => {
    const result = describeRisk(RiskLevel.Low, "Suelo irregular");
    expect(result).toBe("Precaución leve: Suelo irregular");
  });

  it("returns null for no risk", () => {
    expect(describeRisk(RiskLevel.None)).toBeNull();
  });
});

describe("describeWaypoint [FR-302]", () => {
  it("describes intersection with direction", () => {
    const waypoint: WaypointProperties = {
      featureType: "waypoint",
      waypointId: "wp-1",
      name: "Avenida Complutense",
      description: "Cruce principal",
      waypointType: WaypointType.Intersection,
    };
    const result = describeWaypoint(waypoint, "recto");
    expect(result).toBe("Cruce con Avenida Complutense, continúa recto");
  });

  it("describes transport stop", () => {
    const waypoint: WaypointProperties = {
      featureType: "waypoint",
      waypointId: "wp-2",
      name: "Metro Ciudad Universitaria",
      description: "Estación de metro",
      waypointType: WaypointType.TransportStop,
    };
    const result = describeWaypoint(waypoint);
    expect(result).toBe(
      "Parada de transporte: Metro Ciudad Universitaria",
    );
  });

  it("describes building", () => {
    const waypoint: WaypointProperties = {
      featureType: "waypoint",
      waypointId: "wp-3",
      name: "Facultad de Medicina",
      description: "Edificio",
      waypointType: WaypointType.Building,
    };
    const result = describeWaypoint(waypoint);
    expect(result).toBe("Edificio: Facultad de Medicina");
  });
});

describe("describeSegment [FR-302]", () => {
  const makeSegment = (
    overrides: Partial<RouteSegmentProperties> = {},
  ): RouteSegmentProperties => ({
    featureType: "route-segment",
    segmentId: "seg-test",
    name: "Test Segment",
    surfaceType: SurfaceType.Paved,
    elevationChange: 0,
    riskLevel: RiskLevel.None,
    ...overrides,
  });

  it("returns empty array for safe paved flat segment", () => {
    const result = describeSegment(makeSegment());
    expect(result).toEqual([]);
  });

  it("includes surface and risk descriptions in full mode", () => {
    const result = describeSegment(
      makeSegment({
        surfaceType: SurfaceType.Cobblestone,
        riskLevel: RiskLevel.Medium,
        riskDescription: "Suelo irregular",
      }),
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toContain("Precaución");
    expect(result[1]).toContain("adoquinado");
  });

  it("only includes risk in reduced mode", () => {
    const result = describeSegment(
      makeSegment({
        surfaceType: SurfaceType.Cobblestone,
        elevationChange: 5,
        riskLevel: RiskLevel.Medium,
        riskDescription: "Suelo irregular",
      }),
      "reduced",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("Precaución");
  });

  it("includes elevation for steep segments in full mode", () => {
    const result = describeSegment(
      makeSegment({ elevationChange: 5 }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("Cuesta arriba");
  });
});
