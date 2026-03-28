// FR-502: Incident card for list display
import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
} from "@campus-gps/shared-types";
import type { IncidentSummary } from "@campus-gps/shared-types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f9ab00",
  validated: "#1a73e8",
  rejected: "#ea4335",
  resolved: "#34a853",
};

const TYPE_ICONS: Record<string, string> = {
  obras: "🚧",
  obstaculo_temporal: "⚠️",
  superficie_danada: "🕳️",
  ascensor_averiado: "🛗",
  rampa_bloqueada: "♿",
  otro: "📌",
};

interface IncidentCardProps {
  incident: IncidentSummary;
  onPress?: (incident: IncidentSummary) => void;
}

export default function IncidentCard({ incident, onPress }: IncidentCardProps) {
  const typeLabel = INCIDENT_TYPE_LABELS[incident.type] ?? incident.type;
  const statusLabel = INCIDENT_STATUS_LABELS[incident.status] ?? incident.status;
  const statusColor = STATUS_COLORS[incident.status] ?? "#666666";
  const icon = TYPE_ICONS[incident.type] ?? "📌";

  const dateStr = new Date(incident.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(incident)}
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel}: ${incident.title}. Estado: ${statusLabel}. ${dateStr}`}
      accessibilityHint="Pulsa para ver detalles de la incidencia"
      disabled={!onPress}
    >
      <Text style={styles.icon} accessibilityElementsHidden>
        {icon}
      </Text>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {incident.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {incident.description}
        </Text>
        <View style={styles.footer}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor }]}
          >
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    gap: 12,
    minHeight: 44,
  },
  icon: {
    fontSize: 24,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  description: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: "#999999",
  },
});
