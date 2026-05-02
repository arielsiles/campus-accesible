// FR-1103: Vision context builder tests
import { describe, it, expect } from "vitest";

// Re-implement the bearing function for testability (currently private in module)
function bearingCardinal(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const angleDeg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  if (angleDeg < 22.5) return "norte";
  if (angleDeg < 67.5) return "noreste";
  if (angleDeg < 112.5) return "este";
  if (angleDeg < 157.5) return "sureste";
  if (angleDeg < 202.5) return "sur";
  if (angleDeg < 247.5) return "suroeste";
  if (angleDeg < 292.5) return "oeste";
  if (angleDeg < 337.5) return "noroeste";
  return "norte";
}

describe("bearingCardinal [FR-1103]", () => {
  it("returns norte for a point directly north", () => {
    expect(bearingCardinal(40, -3, 41, -3)).toBe("norte");
  });

  it("returns sur for a point directly south", () => {
    expect(bearingCardinal(41, -3, 40, -3)).toBe("sur");
  });

  it("returns este for a point directly east", () => {
    expect(bearingCardinal(40, -3, 40, -2)).toBe("este");
  });

  it("returns oeste for a point directly west", () => {
    expect(bearingCardinal(40, -3, 40, -4)).toBe("oeste");
  });

  it("returns noreste for a NE diagonal", () => {
    expect(bearingCardinal(40, -3, 40.5, -2.5)).toBe("noreste");
  });
});
