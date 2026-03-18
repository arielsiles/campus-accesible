// FR-202: Dijkstra's algorithm for shortest path with accessibility weights

import type { GraphEdgeInput, PathResult } from "./types";

interface AdjacencyEntry {
  toId: string;
  edge: GraphEdgeInput;
}

/**
 * Build adjacency list from edges for efficient graph traversal.
 */
export function buildAdjacencyList(
  edges: GraphEdgeInput[]
): Map<string, AdjacencyEntry[]> {
  const adj = new Map<string, AdjacencyEntry[]>();

  for (const edge of edges) {
    const fromList = adj.get(edge.fromWaypointId) ?? [];
    fromList.push({ toId: edge.toWaypointId, edge });
    adj.set(edge.fromWaypointId, fromList);
  }

  return adj;
}

/**
 * Find the shortest path between two waypoints using Dijkstra's algorithm.
 * Uses weight (accessibility-aware cost) rather than pure distance.
 *
 * @param edges - All graph edges
 * @param originId - Source waypoint ID
 * @param destinationId - Target waypoint ID
 * @returns PathResult with the optimal path or found=false if unreachable
 */
export function findShortestPath(
  edges: GraphEdgeInput[],
  originId: string,
  destinationId: string
): PathResult {
  const adj = buildAdjacencyList(edges);

  // Distance map: waypointId → minimum weight to reach it
  const dist = new Map<string, number>();
  // Real distance map for reporting
  const realDist = new Map<string, number>();
  // Previous node and edge for path reconstruction
  const prev = new Map<string, { nodeId: string; edge: GraphEdgeInput }>();
  // Visited set
  const visited = new Set<string>();

  // Priority queue implemented as sorted array (sufficient for campus-scale graphs)
  const queue: Array<{ id: string; weight: number }> = [];

  dist.set(originId, 0);
  realDist.set(originId, 0);
  queue.push({ id: originId, weight: 0 });

  while (queue.length > 0) {
    // Extract minimum weight node
    queue.sort((a, b) => a.weight - b.weight);
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    // Found destination
    if (current.id === destinationId) {
      return reconstructPath(originId, destinationId, prev, dist, realDist);
    }

    // Explore neighbors
    const neighbors = adj.get(current.id) ?? [];
    for (const { toId, edge } of neighbors) {
      if (visited.has(toId)) continue;

      const newWeight = current.weight + edge.weight;
      const currentDist = dist.get(toId);

      if (currentDist === undefined || newWeight < currentDist) {
        dist.set(toId, newWeight);
        realDist.set(toId, (realDist.get(current.id) ?? 0) + edge.distance);
        prev.set(toId, { nodeId: current.id, edge });
        queue.push({ id: toId, weight: newWeight });
      }
    }
  }

  // Destination not reachable
  return {
    found: false,
    path: [],
    totalDistance: 0,
    totalWeight: 0,
    edges: [],
  };
}

function reconstructPath(
  originId: string,
  destinationId: string,
  prev: Map<string, { nodeId: string; edge: GraphEdgeInput }>,
  dist: Map<string, number>,
  realDist: Map<string, number>
): PathResult {
  const path: string[] = [];
  const edges: GraphEdgeInput[] = [];

  let current = destinationId;
  while (current !== originId) {
    path.unshift(current);
    const prevEntry = prev.get(current);
    if (!prevEntry) break;
    edges.unshift(prevEntry.edge);
    current = prevEntry.nodeId;
  }
  path.unshift(originId);

  return {
    found: true,
    path,
    totalDistance: realDist.get(destinationId) ?? 0,
    totalWeight: dist.get(destinationId) ?? 0,
    edges,
  };
}
