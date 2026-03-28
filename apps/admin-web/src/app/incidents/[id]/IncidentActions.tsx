// FR-504: Client component for incident admin actions
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

interface IncidentActionsProps {
  incidentId: string;
  currentStatus: string;
}

export default function IncidentActions({
  incidentId,
  currentStatus,
}: IncidentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (status: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Error al actualizar");
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Acciones</h3>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {currentStatus !== "validated" && (
          <ActionButton
            label="Validar"
            color="#1a73e8"
            onClick={() => updateStatus("validated")}
            disabled={loading}
          />
        )}
        {currentStatus !== "rejected" && (
          <ActionButton
            label="Rechazar"
            color="#ea4335"
            onClick={() => updateStatus("rejected")}
            disabled={loading}
          />
        )}
        {currentStatus !== "resolved" && (
          <ActionButton
            label="Marcar resuelta"
            color="#34a853"
            onClick={() => updateStatus("resolved")}
            disabled={loading}
          />
        )}
        {currentStatus !== "pending" && (
          <ActionButton
            label="Volver a pendiente"
            color="#f9ab00"
            onClick={() => updateStatus("pending")}
            disabled={loading}
          />
        )}
      </div>

      {error && (
        <p style={{ color: "#ea4335", marginTop: 12, fontSize: 14 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ActionButton({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string;
  color: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: color,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 20px",
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}
