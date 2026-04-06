// TST-FR-804: OSM path matching service tests
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock osmService
vi.mock("./osmService", () => ({
  fetchOsmFootways: vi.fn(),
  mapOsmSurface: vi.fn((s: string) => {
    const map: Record<string, string> = { asphalt: "paved", gravel: "gravel" };
    return map[s] ?? "paved";
  }),
}));

import { fetchOsmFootways } from "./osmService";
import { matchSegmentToOsmPath } from "./osmPathMatchingService";

const mockFetchFootways = vi.mocked(fetchOsmFootways);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("matchSegmentToOsmPath [FR-804]", () => {
  it("returns not matched when no footways found [T8.4]", async () => {
    mockFetchFootways.mockResolvedValue([]);

    const result = await matchSegmentToOsmPath([
      [-3.72, 40.44],
      [-3.73, 40.45],
    ]);

    expect(result.matched).toBe(false);
  });

  it("matches when footway is close to segment [T8.4]", async () => {
    // Footway very close to our segment
    mockFetchFootways.mockResolvedValue([
      {
        id: 999,
        coordinates: [
          [-3.7200, 40.4400],
          [-3.7210, 40.4410],
          [-3.7220, 40.4420],
        ],
        surface: "asphalt",
        name: "Camino principal",
      },
    ]);

    const result = await matchSegmentToOsmPath([
      [-3.7200, 40.4400],
      [-3.7220, 40.4420],
    ]);

    expect(result.matched).toBe(true);
    expect(result.osmFootwayId).toBe(999);
    expect(result.surfaceType).toBe("paved");
    expect(result.footwayName).toBe("Camino principal");
  });

  it("returns not matched when footway is far [T8.4]", async () => {
    // Footway 200m+ away from our segment
    mockFetchFootways.mockResolvedValue([
      {
        id: 888,
        coordinates: [
          [-3.7500, 40.4600],
          [-3.7510, 40.4610],
        ],
        surface: "gravel",
      },
    ]);

    const result = await matchSegmentToOsmPath([
      [-3.7200, 40.4400],
      [-3.7220, 40.4420],
    ]);

    expect(result.matched).toBe(false);
    expect(result.averageDistance).toBeGreaterThan(15);
  });

  it("returns original coords when segment has < 2 points [T8.4]", async () => {
    const result = await matchSegmentToOsmPath([[-3.72, 40.44]]);

    expect(result.matched).toBe(false);
    expect(result.coordinates).toEqual([[-3.72, 40.44]]);
  });
});
