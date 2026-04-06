// TST-FR-701: Route creator store tests
import { describe, it, expect, beforeEach } from "vitest";
import { useRouteCreatorStore } from "./routeCreatorStore";
import type { TrackPoint, DraftWaypoint } from "./routeCreatorStore";

function makeTrackPoint(lat: number, lng: number, accuracy: number = 5): TrackPoint {
  return { latitude: lat, longitude: lng, timestamp: Date.now(), accuracy };
}

function makeWaypoint(name: string, lat: number, lng: number): DraftWaypoint {
  return {
    id: "",
    name,
    description: `Punto ${name}`,
    waypointType: "landmark",
    latitude: lat,
    longitude: lng,
    orderIndex: 0,
  };
}

beforeEach(() => {
  useRouteCreatorStore.getState().reset();
});

describe("routeCreatorStore recording [FR-701]", () => {
  it("starts recording with clean state [T7.1]", () => {
    useRouteCreatorStore.getState().startRecording();

    const state = useRouteCreatorStore.getState();
    expect(state.isRecording).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.startTime).not.toBeNull();
    expect(state.trackPoints).toHaveLength(0);
  });

  it("pauses and resumes recording [T7.1]", () => {
    useRouteCreatorStore.getState().startRecording();
    useRouteCreatorStore.getState().pauseRecording();
    expect(useRouteCreatorStore.getState().isPaused).toBe(true);

    useRouteCreatorStore.getState().resumeRecording();
    expect(useRouteCreatorStore.getState().isPaused).toBe(false);
  });

  it("adds track points while recording [T7.1]", () => {
    useRouteCreatorStore.getState().startRecording();

    useRouteCreatorStore.getState().addTrackPoint(makeTrackPoint(40.4468, -3.7264));
    useRouteCreatorStore.getState().addTrackPoint(makeTrackPoint(40.4470, -3.7260));

    expect(useRouteCreatorStore.getState().trackPoints).toHaveLength(2);
  });

  it("filters points with accuracy > 20m [TST-FR-701-002]", () => {
    useRouteCreatorStore.getState().startRecording();

    useRouteCreatorStore.getState().addTrackPoint(makeTrackPoint(40.4468, -3.7264, 5));
    useRouteCreatorStore.getState().addTrackPoint(makeTrackPoint(40.4470, -3.7260, 25)); // filtered

    expect(useRouteCreatorStore.getState().trackPoints).toHaveLength(1);
  });

  it("ignores track points when not recording [T7.1]", () => {
    useRouteCreatorStore.getState().addTrackPoint(makeTrackPoint(40.4468, -3.7264));
    expect(useRouteCreatorStore.getState().trackPoints).toHaveLength(0);
  });

  it("ignores track points when paused [T7.1]", () => {
    useRouteCreatorStore.getState().startRecording();
    useRouteCreatorStore.getState().pauseRecording();

    useRouteCreatorStore.getState().addTrackPoint(makeTrackPoint(40.4468, -3.7264));
    expect(useRouteCreatorStore.getState().trackPoints).toHaveLength(0);
  });
});

describe("routeCreatorStore waypoints [FR-701]", () => {
  it("adds waypoints with auto-incremented orderIndex [T7.1]", () => {
    const store = useRouteCreatorStore.getState();
    store.addWaypoint(makeWaypoint("A", 40.44, -3.72));
    store.addWaypoint(makeWaypoint("B", 40.45, -3.73));

    const wps = useRouteCreatorStore.getState().waypoints;
    expect(wps).toHaveLength(2);
    expect(wps[0].orderIndex).toBe(0);
    expect(wps[1].orderIndex).toBe(1);
  });

  it("updates waypoint by index [T7.1]", () => {
    useRouteCreatorStore.getState().addWaypoint(makeWaypoint("A", 40.44, -3.72));
    useRouteCreatorStore.getState().updateWaypoint(0, { name: "Updated A" });

    expect(useRouteCreatorStore.getState().waypoints[0].name).toBe("Updated A");
  });

  it("removes waypoint and reindexes [T7.1]", () => {
    const store = useRouteCreatorStore.getState();
    store.addWaypoint(makeWaypoint("A", 40.44, -3.72));
    store.addWaypoint(makeWaypoint("B", 40.45, -3.73));
    store.addWaypoint(makeWaypoint("C", 40.46, -3.74));

    useRouteCreatorStore.getState().removeWaypoint(1); // remove B

    const wps = useRouteCreatorStore.getState().waypoints;
    expect(wps).toHaveLength(2);
    expect(wps[0].name).toBe("A");
    expect(wps[0].orderIndex).toBe(0);
    expect(wps[1].name).toBe("C");
    expect(wps[1].orderIndex).toBe(1);
  });

  it("reorders waypoints [T7.1]", () => {
    const store = useRouteCreatorStore.getState();
    store.addWaypoint(makeWaypoint("A", 40.44, -3.72));
    store.addWaypoint(makeWaypoint("B", 40.45, -3.73));
    store.addWaypoint(makeWaypoint("C", 40.46, -3.74));

    useRouteCreatorStore.getState().reorderWaypoint(2, 0); // move C to front

    const wps = useRouteCreatorStore.getState().waypoints;
    expect(wps[0].name).toBe("C");
    expect(wps[1].name).toBe("A");
    expect(wps[2].name).toBe("B");
    expect(wps[0].orderIndex).toBe(0);
  });
});

describe("routeCreatorStore generateSegments [FR-701]", () => {
  it("generates segments between consecutive waypoints [TST-FR-701-004]", () => {
    const store = useRouteCreatorStore.getState();
    store.addWaypoint(makeWaypoint("A", 40.44, -3.72));
    store.addWaypoint(makeWaypoint("B", 40.45, -3.73));
    store.addWaypoint(makeWaypoint("C", 40.46, -3.74));

    useRouteCreatorStore.getState().generateSegments();

    const segs = useRouteCreatorStore.getState().segments;
    expect(segs).toHaveLength(2);
    expect(segs[0].name).toBe("A a B");
    expect(segs[1].name).toBe("B a C");
    expect(segs[0].orderIndex).toBe(0);
    expect(segs[1].orderIndex).toBe(1);
  });

  it("does not generate segments with < 2 waypoints [TST-FR-701-005]", () => {
    useRouteCreatorStore.getState().addWaypoint(makeWaypoint("A", 40.44, -3.72));
    useRouteCreatorStore.getState().generateSegments();

    expect(useRouteCreatorStore.getState().segments).toHaveLength(0);
  });

  it("segments have default accessibility values [TST-FR-703-001]", () => {
    const store = useRouteCreatorStore.getState();
    store.addWaypoint(makeWaypoint("A", 40.44, -3.72));
    store.addWaypoint(makeWaypoint("B", 40.45, -3.73));
    useRouteCreatorStore.getState().generateSegments();

    const seg = useRouteCreatorStore.getState().segments[0];
    expect(seg.surfaceType).toBe("paved");
    expect(seg.pathWidth).toBe(2.0);
    expect(seg.hasStairs).toBe(false);
    expect(seg.riskLevel).toBe("none");
    expect(seg.surfaceQuality).toBe("good");
  });

  it("updates segment annotation [T7.1]", () => {
    const store = useRouteCreatorStore.getState();
    store.addWaypoint(makeWaypoint("A", 40.44, -3.72));
    store.addWaypoint(makeWaypoint("B", 40.45, -3.73));
    useRouteCreatorStore.getState().generateSegments();

    useRouteCreatorStore.getState().updateSegment(0, {
      surfaceType: "gravel",
      hasStairs: true,
      pathWidth: 1.2,
    });

    const seg = useRouteCreatorStore.getState().segments[0];
    expect(seg.surfaceType).toBe("gravel");
    expect(seg.hasStairs).toBe(true);
    expect(seg.pathWidth).toBe(1.2);
  });
});

describe("routeCreatorStore reset [FR-701]", () => {
  it("resets all state [T7.1]", () => {
    const store = useRouteCreatorStore.getState();
    store.startRecording();
    store.addWaypoint(makeWaypoint("A", 40.44, -3.72));
    store.setRouteName("Test Route");

    useRouteCreatorStore.getState().reset();

    const state = useRouteCreatorStore.getState();
    expect(state.isRecording).toBe(false);
    expect(state.waypoints).toHaveLength(0);
    expect(state.routeName).toBe("");
    expect(state.startTime).toBeNull();
  });
});
