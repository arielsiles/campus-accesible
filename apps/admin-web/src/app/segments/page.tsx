// FR-504: Segments management page with block/unblock
"use client";

import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

interface RouteItem {
  id: string;
  name: string;
  description: string;
}

interface SegmentItem {
  segmentId: string;
  name: string;
  surfaceType: string;
  riskLevel: string;
  temporarilyBlocked: boolean;
  blockReason: string | null;
}

export default function SegmentsPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/routes`);
      const data = await res.json();
      setRoutes(data);

      // Fetch details for each route to get segments
      const allSegments: SegmentItem[] = [];
      for (const route of data) {
        try {
          const routeRes = await fetch(`${API_BASE_URL}/routes/${route.id}`);
          const routeData = await routeRes.json();
          const segs = routeData.features
            ?.filter((f: { properties: { featureType: string } }) => f.properties.featureType === "route-segment")
            .map((f: { properties: SegmentItem }) => f.properties) ?? [];
          allSegments.push(...segs);
        } catch {
          // Skip failed route
        }
      }

      // Deduplicate by segmentId
      const unique = Array.from(
        new Map(allSegments.map((s) => [s.segmentId, s])).values()
      );
      setSegments(unique);
    } catch {
      // API not available
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (segmentId: string, currentBlocked: boolean) => {
    setActionLoading(segmentId);
    try {
      // Need the database ID, not the segmentId. Use segmentId as lookup.
      // The API expects the Prisma ID. For now, use segmentId which matches.
      const res = await fetch(`${API_BASE_URL}/segments/${segmentId}/block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocked: !currentBlocked,
          reason: !currentBlocked ? "Bloqueado por administrador" : undefined,
        }),
      });

      if (res.ok) {
        setSegments((prev) =>
          prev.map((s) =>
            s.segmentId === segmentId
              ? {
                  ...s,
                  temporarilyBlocked: !currentBlocked,
                  blockReason: !currentBlocked ? "Bloqueado por administrador" : null,
                }
              : s
          )
        );
      }
    } catch {
      // Error handling
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <p style={{ color: "#999" }}>Cargando segmentos...</p>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        Segmentos ({segments.length})
      </h1>

      {segments.length === 0 ? (
        <p style={{ color: "#999" }}>No se encontraron segmentos. Verifica que el API esta corriendo.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#fff",
            borderRadius: 8,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
              <th style={{ padding: "10px 14px" }}>Nombre</th>
              <th style={{ padding: "10px 14px" }}>ID</th>
              <th style={{ padding: "10px 14px" }}>Superficie</th>
              <th style={{ padding: "10px 14px" }}>Riesgo</th>
              <th style={{ padding: "10px 14px" }}>Estado</th>
              <th style={{ padding: "10px 14px" }}>Accion</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg) => (
              <tr
                key={seg.segmentId}
                style={{
                  borderBottom: "1px solid #eee",
                  backgroundColor: seg.temporarilyBlocked ? "#fce8e6" : "transparent",
                }}
              >
                <td style={{ padding: "10px 14px" }}>{seg.name}</td>
                <td style={{ padding: "10px 14px", color: "#666", fontSize: 13 }}>
                  {seg.segmentId}
                </td>
                <td style={{ padding: "10px 14px" }}>{seg.surfaceType}</td>
                <td style={{ padding: "10px 14px" }}>{seg.riskLevel}</td>
                <td style={{ padding: "10px 14px" }}>
                  {seg.temporarilyBlocked ? (
                    <span style={{ color: "#ea4335", fontWeight: 600 }}>
                      Bloqueado
                      {seg.blockReason && (
                        <span style={{ fontWeight: 400, fontSize: 12 }}>
                          {" "}({seg.blockReason})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: "#34a853" }}>Activo</span>
                  )}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <button
                    onClick={() => toggleBlock(seg.segmentId, seg.temporarilyBlocked)}
                    disabled={actionLoading === seg.segmentId}
                    style={{
                      backgroundColor: seg.temporarilyBlocked ? "#34a853" : "#ea4335",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 14px",
                      fontSize: 13,
                      cursor: actionLoading === seg.segmentId ? "not-allowed" : "pointer",
                      opacity: actionLoading === seg.segmentId ? 0.6 : 1,
                    }}
                  >
                    {seg.temporarilyBlocked ? "Desbloquear" : "Bloquear"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
