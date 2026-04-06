// TST-FR-805: OSM cache tests
import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedOsmData,
  setCachedOsmData,
  clearOsmCache,
  getOsmCacheStats,
} from "./osmCache";

beforeEach(() => {
  clearOsmCache();
});

describe("osmCache [FR-805]", () => {
  it("returns null for missing cache [T8.1]", () => {
    expect(getCachedOsmData(40.44, -3.72, "features")).toBeNull();
  });

  it("stores and retrieves cached data [T8.1]", () => {
    const data = [{ id: 1, name: "Test" }];
    setCachedOsmData(40.44, -3.72, "features", data);

    const result = getCachedOsmData(40.44, -3.72, "features");
    expect(result).toEqual(data);
  });

  it("returns same data for exact same coordinates [T8.1]", () => {
    const data = [{ id: 1 }];
    setCachedOsmData(40.4400, -3.7200, "features", data);

    // Same coordinates → same geohash bucket
    const result = getCachedOsmData(40.4400, -3.7200, "features");
    expect(result).toEqual(data);
  });

  it("separates cache by type [T8.1]", () => {
    setCachedOsmData(40.44, -3.72, "features", [{ type: "features" }]);
    setCachedOsmData(40.44, -3.72, "footways", [{ type: "footways" }]);

    expect(getCachedOsmData(40.44, -3.72, "features")).toEqual([{ type: "features" }]);
    expect(getCachedOsmData(40.44, -3.72, "footways")).toEqual([{ type: "footways" }]);
  });

  it("clearOsmCache removes all entries [T8.1]", () => {
    setCachedOsmData(40.44, -3.72, "features", [1]);
    setCachedOsmData(40.45, -3.73, "features", [2]);

    clearOsmCache();

    expect(getOsmCacheStats().entries).toBe(0);
  });

  it("tracks cache stats [T8.1]", () => {
    expect(getOsmCacheStats().entries).toBe(0);

    setCachedOsmData(40.44, -3.72, "features", []);
    expect(getOsmCacheStats().entries).toBe(1);
  });
});
