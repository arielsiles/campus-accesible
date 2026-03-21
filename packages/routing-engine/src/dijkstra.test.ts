// TST-FR-202-001, TST-FR-202-002, TST-FR-202-003: Pathfinding algorithm tests
import { describe, it, expect } from "vitest";
import { findShortestPath } from "./dijkstra";
import type { GraphEdgeInput } from "./types";

// Simple graph:  A --10--> B --20--> C
//                A --50--> C (direct but heavier)
const simpleEdges: GraphEdgeInput[] = [
  { id: "e1", fromWaypointId: "A", toWaypointId: "B", distance: 100, weight: 10 },
  { id: "e2", fromWaypointId: "B", toWaypointId: "C", distance: 200, weight: 20 },
  { id: "e3", fromWaypointId: "A", toWaypointId: "C", distance: 250, weight: 50 },
];

// Bidirectional campus-like graph
const campusEdges: GraphEdgeInput[] = [
  // Medicina <-> Odontología
  { id: "e1", fromWaypointId: "wp-medicina", toWaypointId: "wp-odontologia", distance: 142, weight: 145 },
  { id: "e2", fromWaypointId: "wp-odontologia", toWaypointId: "wp-medicina", distance: 142, weight: 145 },
  // Odontología <-> Farmacia
  { id: "e3", fromWaypointId: "wp-odontologia", toWaypointId: "wp-farmacia", distance: 160, weight: 162 },
  { id: "e4", fromWaypointId: "wp-farmacia", toWaypointId: "wp-odontologia", distance: 160, weight: 162 },
  // Farmacia <-> Bus Farmacia
  { id: "e5", fromWaypointId: "wp-farmacia", toWaypointId: "wp-bus-farmacia", distance: 80, weight: 80 },
  { id: "e6", fromWaypointId: "wp-bus-farmacia", toWaypointId: "wp-farmacia", distance: 80, weight: 80 },
  // Bus Farmacia <-> Metro CU (with risk penalty)
  { id: "e7", fromWaypointId: "wp-bus-farmacia", toWaypointId: "wp-metro-cu", distance: 340, weight: 412 },
  { id: "e8", fromWaypointId: "wp-metro-cu", toWaypointId: "wp-bus-farmacia", distance: 340, weight: 412 },
];

describe("findShortestPath", () => {
  it("finds shortest path between two connected nodes [TST-FR-202-001]", () => {
    const result = findShortestPath(simpleEdges, "A", "C");

    expect(result.found).toBe(true);
    // Via B (weight 30) is cheaper than direct (weight 50)
    expect(result.path).toEqual(["A", "B", "C"]);
    expect(result.totalWeight).toBe(30);
    expect(result.totalDistance).toBe(300);
  });

  it("finds direct path when it is optimal [TST-FR-202-001]", () => {
    const edges: GraphEdgeInput[] = [
      { id: "e1", fromWaypointId: "A", toWaypointId: "B", distance: 100, weight: 100 },
      { id: "e2", fromWaypointId: "B", toWaypointId: "C", distance: 200, weight: 200 },
      { id: "e3", fromWaypointId: "A", toWaypointId: "C", distance: 250, weight: 50 },
    ];

    const result = findShortestPath(edges, "A", "C");

    expect(result.found).toBe(true);
    expect(result.path).toEqual(["A", "C"]);
    expect(result.totalWeight).toBe(50);
  });

  it("returns found=false for unreachable destination [TST-FR-202-002]", () => {
    const edges: GraphEdgeInput[] = [
      { id: "e1", fromWaypointId: "A", toWaypointId: "B", distance: 100, weight: 10 },
    ];

    const result = findShortestPath(edges, "A", "C");

    expect(result.found).toBe(false);
    expect(result.path).toEqual([]);
    expect(result.totalDistance).toBe(0);
  });

  it("returns found=false when origin does not exist [TST-FR-202-002]", () => {
    const result = findShortestPath(simpleEdges, "Z", "C");

    expect(result.found).toBe(false);
  });

  it("handles single-step path [TST-FR-202-001]", () => {
    const result = findShortestPath(simpleEdges, "A", "B");

    expect(result.found).toBe(true);
    expect(result.path).toEqual(["A", "B"]);
    expect(result.totalWeight).toBe(10);
    expect(result.edges).toHaveLength(1);
  });

  it("handles origin === destination", () => {
    const result = findShortestPath(simpleEdges, "A", "A");

    expect(result.found).toBe(true);
    expect(result.path).toEqual(["A"]);
    expect(result.totalWeight).toBe(0);
  });

  it("finds optimal path in campus-like bidirectional graph [TST-FR-202-001]", () => {
    const result = findShortestPath(campusEdges, "wp-medicina", "wp-metro-cu");

    expect(result.found).toBe(true);
    expect(result.path).toEqual([
      "wp-medicina",
      "wp-odontologia",
      "wp-farmacia",
      "wp-bus-farmacia",
      "wp-metro-cu",
    ]);
    expect(result.totalDistance).toBeGreaterThan(0);
    expect(result.edges).toHaveLength(4);
  });

  it("finds reverse path in bidirectional graph [TST-FR-202-001]", () => {
    const result = findShortestPath(campusEdges, "wp-metro-cu", "wp-medicina");

    expect(result.found).toBe(true);
    expect(result.path[0]).toBe("wp-metro-cu");
    expect(result.path[result.path.length - 1]).toBe("wp-medicina");
  });

  it("completes in < 500ms with 500 nodes [TST-FR-202-003]", () => {
    // Generate a grid-like graph with 500 nodes
    const edges: GraphEdgeInput[] = [];
    let edgeId = 0;

    for (let i = 0; i < 500; i++) {
      // Connect to next node
      if (i < 499) {
        edges.push({
          id: `e${edgeId++}`,
          fromWaypointId: `n${i}`,
          toWaypointId: `n${i + 1}`,
          distance: 50,
          weight: 50 + Math.random() * 20,
        });
        edges.push({
          id: `e${edgeId++}`,
          fromWaypointId: `n${i + 1}`,
          toWaypointId: `n${i}`,
          distance: 50,
          weight: 50 + Math.random() * 20,
        });
      }
      // Add some cross-links for realistic graph density
      if (i + 10 < 500) {
        edges.push({
          id: `e${edgeId++}`,
          fromWaypointId: `n${i}`,
          toWaypointId: `n${i + 10}`,
          distance: 200,
          weight: 200 + Math.random() * 50,
        });
      }
    }

    const start = performance.now();
    const result = findShortestPath(edges, "n0", "n499");
    const elapsed = performance.now() - start;

    expect(result.found).toBe(true);
    expect(elapsed).toBeLessThan(500);
  });
});
