// FR-504: Status badge component
import type { IncidentStatus } from "@campus-gps/shared-types";
import { INCIDENT_STATUS_LABELS } from "@campus-gps/shared-types";

const STATUS_COLORS: Record<IncidentStatus, string> = {
  pending: "#f9ab00",
  validated: "#1a73e8",
  rejected: "#ea4335",
  resolved: "#34a853",
};

export default function StatusBadge({ status }: { status: IncidentStatus }) {
  const color = STATUS_COLORS[status] ?? "#666";
  const label = INCIDENT_STATUS_LABELS[status] ?? status;

  return (
    <span
      style={{
        backgroundColor: color,
        color: "#fff",
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}
