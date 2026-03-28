// FR-504: Incident detail page with admin actions
import Link from "next/link";
import { apiGet } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import type { IncidentDetail, IncidentStatus } from "@campus-gps/shared-types";
import { INCIDENT_TYPE_LABELS } from "@campus-gps/shared-types";
import IncidentActions from "./IncidentActions";

interface IncidentDetailResponse {
  incident: IncidentDetail;
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let incident: IncidentDetail | null = null;
  let error: string | null = null;

  try {
    const data = await apiGet<IncidentDetailResponse>(`/incidents/${id}`);
    incident = data.incident;
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al cargar incidencia";
  }

  if (error || !incident) {
    return (
      <div>
        <Link href="/incidents" style={{ color: "#1a73e8" }}>
          &larr; Volver a incidencias
        </Link>
        <p style={{ color: "#ea4335", marginTop: 16 }}>
          {error ?? "Incidencia no encontrada"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/incidents" style={{ color: "#1a73e8", textDecoration: "none" }}>
        &larr; Volver a incidencias
      </Link>

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 24,
          marginTop: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, margin: 0 }}>{incident.title}</h1>
            <p style={{ color: "#666", marginTop: 4, fontSize: 14 }}>
              {INCIDENT_TYPE_LABELS[incident.type] ?? incident.type} &middot;{" "}
              {new Date(incident.createdAt).toLocaleString("es-ES")}
            </p>
          </div>
          <StatusBadge status={incident.status as IncidentStatus} />
        </div>

        <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 20 }}>
          {incident.description}
        </p>

        {/* Details grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
          <DetailItem label="ID" value={incident.id} />
          <DetailItem label="Dispositivo" value={incident.deviceId} />
          <DetailItem label="Coordenadas" value={`${incident.latitude}, ${incident.longitude}`} />
          <DetailItem label="Segmento" value={incident.segmentId ?? "Sin asignar"} />
          {incident.resolvedAt && (
            <DetailItem
              label="Resuelto"
              value={new Date(incident.resolvedAt).toLocaleString("es-ES")}
            />
          )}
        </div>

        {/* AI Validation */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>
            Validacion IA
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <DetailItem
              label="Plausible"
              value={incident.aiValidation === null ? "No evaluado" : incident.aiValidation ? "Si" : "No"}
            />
            <DetailItem
              label="Confianza"
              value={incident.aiConfidence !== null ? `${(incident.aiConfidence * 100).toFixed(0)}%` : "—"}
            />
            <DetailItem label="Razon" value={incident.aiReason ?? "—"} />
            <DetailItem label="Fuente" value={incident.validationSource ?? "—"} />
          </div>
        </div>

        {/* Admin actions */}
        <IncidentActions incidentId={incident.id} currentStatus={incident.status} />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#333", wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}
