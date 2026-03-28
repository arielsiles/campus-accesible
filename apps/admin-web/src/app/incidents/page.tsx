// FR-504: Incident list page with filters
import Link from "next/link";
import { apiGet } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import type { IncidentSummary, IncidentStatus } from "@campus-gps/shared-types";
import { INCIDENT_TYPE_LABELS } from "@campus-gps/shared-types";

interface IncidentListResponse {
  incidents: IncidentSummary[];
  total: number;
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const queryParts: string[] = ["limit=50"];
  if (params.status) queryParts.push(`status=${params.status}`);
  if (params.type) queryParts.push(`type=${params.type}`);

  let incidents: IncidentSummary[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const data = await apiGet<IncidentListResponse>(
      `/incidents?${queryParts.join("&")}`
    );
    incidents = data.incidents;
    total = data.total;
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al cargar incidencias";
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Incidencias ({total})</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <FilterLink label="Todas" href="/incidents" active={!params.status} />
        <FilterLink label="Pendientes" href="/incidents?status=pending" active={params.status === "pending"} />
        <FilterLink label="Validadas" href="/incidents?status=validated" active={params.status === "validated"} />
        <FilterLink label="Rechazadas" href="/incidents?status=rejected" active={params.status === "rejected"} />
        <FilterLink label="Resueltas" href="/incidents?status=resolved" active={params.status === "resolved"} />
      </div>

      {error && (
        <p style={{ color: "#ea4335", backgroundColor: "#fce8e6", padding: 12, borderRadius: 8 }}>
          {error}
        </p>
      )}

      {incidents.length === 0 && !error ? (
        <p style={{ color: "#999" }}>No hay incidencias con los filtros seleccionados.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", borderRadius: 8 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
              <th style={{ padding: "10px 14px" }}>Título</th>
              <th style={{ padding: "10px 14px" }}>Tipo</th>
              <th style={{ padding: "10px 14px" }}>Estado</th>
              <th style={{ padding: "10px 14px" }}>Segmento</th>
              <th style={{ padding: "10px 14px" }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => (
              <tr key={inc.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px 14px" }}>
                  <Link href={`/incidents/${inc.id}`} style={{ color: "#1a73e8" }}>
                    {inc.title}
                  </Link>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {INCIDENT_TYPE_LABELS[inc.type] ?? inc.type}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <StatusBadge status={inc.status as IncidentStatus} />
                </td>
                <td style={{ padding: "10px 14px", color: "#666" }}>
                  {inc.segmentId ?? "—"}
                </td>
                <td style={{ padding: "10px 14px", color: "#666" }}>
                  {new Date(inc.createdAt).toLocaleDateString("es-ES")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 16px",
        borderRadius: 20,
        backgroundColor: active ? "#1a73e8" : "#e0e0e0",
        color: active ? "#fff" : "#333",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </Link>
  );
}
