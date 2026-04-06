// TST-FR-802: Nominatim service tests
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { searchPlaces, reverseGeocode } from "./nominatimService";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchPlaces [FR-802]", () => {
  it("returns empty for short query [T8.2]", async () => {
    const result = await searchPlaces("a");
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls Nominatim with correct params [T8.2]", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          name: "Parque del Retiro",
          display_name: "Parque del Retiro, Madrid, Spain",
          lat: "40.4153",
          lon: "-3.6833",
          type: "park",
          boundingbox: ["40.40", "40.43", "-3.70", "-3.66"],
        },
      ]),
    });

    const results = await searchPlaces("Parque del Retiro");

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Parque del Retiro");
    expect(results[0].latitude).toBeCloseTo(40.4153, 3);
    expect(results[0].longitude).toBeCloseTo(-3.6833, 3);

    // Verify URL contains correct params
    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl).toContain("nominatim.openstreetmap.org");
    expect(callUrl).toContain("countrycodes=es");
  });

  it("returns empty on network error [T8.2]", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const results = await searchPlaces("Madrid");
    expect(results).toEqual([]);
  });

  it("returns empty on non-OK response [T8.2]", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const results = await searchPlaces("Madrid");
    expect(results).toEqual([]);
  });
});

describe("reverseGeocode [FR-802]", () => {
  it("returns display name from coordinates [T8.2]", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        display_name: "Facultad de Medicina, Ciudad Universitaria, Madrid",
      }),
    });

    const name = await reverseGeocode(40.4489, -3.7267);
    expect(name).toContain("Facultad de Medicina");
  });

  it("returns null on error [T8.2]", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const name = await reverseGeocode(0, 0);
    expect(name).toBeNull();
  });
});
