// FR-504: Dashboard page — summary statistics
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { IncidentSummary } from "@campus-gps/shared-types";

interface IncidentListResponse {
  incidents: IncidentSummary[];
  total: number;
}

async function getStats() {
  try {
    const [pending, validated, rejected, resolved] = await Promise.all([
      apiGet<IncidentListResponse>("/incidents?status=pending&limit=1"),
      apiGet<IncidentListResponse>("/incidents?status=validated&limit=1"),
      apiGet<IncidentListResponse>("/incidents?status=rejected&limit=1"),
      apiGet<IncidentListResponse>("/incidents?status=resolved&limit=1"),
    ]);
    return {
      pending: pending.total,
      validated: validated.total,
      rejected: rejected.total,
      resolved: resolved.total,
    };
  } catch {
    return null;
  }
}

async function getRecentIncidents() {
  try {
    const data = await apiGet<IncidentListResponse>("/incidents?limit=10");
    return data.incidents;
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const stats = await getStats();
  const recent = await getRecentIncidents();

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Dashboard</h1>

      {stats ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <StatCard label="Pendientes" value={stats.pending} color="#f9ab00" />
          <StatCard label="Validadas" value={stats.validated} color="#1a73e8" />
          <StatCard label="Rechazadas" value={stats.rejected} color="#ea4335" />
          <StatCard label="Resueltas" value={stats.resolved} color="#34a853" />
        </div>
      ) : (
        <p style={{ color: "#999" }}>No se pudo conectar con el servidor API.</p>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Incidencias recientes</h2>
      {recent.length === 0 ? (
        <p style={{ color: "#999" }}>No hay incidencias.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", borderRadius: 8 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
              <th style={{ padding: "10px 14px" }}>Título</th>
              <th style={{ padding: "10px 14px" }}>Tipo</th>
              <th style={{ padding: "10px 14px" }}>Estado</th>
              <th style={{ padding: "10px 14px" }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((inc) => (
              <tr key={inc.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px 14px" }}>
                  <Link href={`/incidents/${inc.id}`} style={{ color: "#1a73e8" }}>
                    {inc.title}
                  </Link>
                </td>
                <td style={{ padding: "10px 14px" }}>{inc.type}</td>
                <td style={{ padding: "10px 14px" }}>{inc.status}</td>
                <td style={{ padding: "10px 14px" }}>
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        borderLeft: `4px solid ${color}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{label}</div>
    </div>
  );
}
