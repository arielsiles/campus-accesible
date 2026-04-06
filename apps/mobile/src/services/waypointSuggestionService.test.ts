// TST-FR-803: Waypoint suggestion service tests
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock osmService
vi.mock("./osmService", () => ({
  fetchOsmFeatures: vi.fn().mockResolvedValue([
    {
      id: 101,
      name: "Facultad de Derecho",
      type: "building",
      latitude: 40.4495,
      longitude: -3.7285,
      tags: { building: "university", name: "Facultad de Derecho" },
    },
    {
      id: 102,
      name: "Parada de bus",
      type: "transport_stop",
      latitude: 40.4465,
      longitude: -3.7275,
      tags: { highway: "bus_stop", name: "Parada de bus" },
    },
  ]),
}));

import {
  checkForSuggestion,
  dismissSuggestion,
  resetSuggestions,
} from "./waypointSuggestionService";

beforeEach(() => {
  resetSuggestions();
});

describe("checkForSuggestion [FR-803]", () => {
  it("suggests nearby POI when within 30m [T8.3]", async () => {
    // Position very close to Facultad de Derecho
    const suggestion = await checkForSuggestion(40.4495, -3.7285, []);

    expect(suggestion).not.toBeNull();
    expect(suggestion!.name).toBe("Facultad de Derecho");
    expect(suggestion!.waypointType).toBe("building");
    expect(suggestion!.distanceM).toBeLessThanOrEqual(30);
  });

  it("returns null when far from any POI [T8.3]", async () => {
    // Position far from both POIs
    const suggestion = await checkForSuggestion(40.4600, -3.7100, []);

    expect(suggestion).toBeNull();
  });

  it("skips POIs with names already in waypoints [T8.3]", async () => {
    const suggestion = await checkForSuggestion(
      40.4495, -3.7285,
      ["Facultad de Derecho"] // Already added
    );

    expect(suggestion).toBeNull();
  });

  it("skips dismissed POIs within cooldown [T8.3]", async () => {
    // First call should suggest
    const first = await checkForSuggestion(40.4495, -3.7285, []);
    expect(first).not.toBeNull();

    // Dismiss it
    dismissSuggestion(first!.osmId);

    // Should not suggest again
    const second = await checkForSuggestion(40.4495, -3.7285, []);
    expect(second).toBeNull();
  });

  it("resetSuggestions clears dismissed list [T8.3]", async () => {
    const first = await checkForSuggestion(40.4495, -3.7285, []);
    dismissSuggestion(first!.osmId);

    resetSuggestions();

    // After reset, should suggest again
    const again = await checkForSuggestion(40.4495, -3.7285, []);
    expect(again).not.toBeNull();
  });
});
