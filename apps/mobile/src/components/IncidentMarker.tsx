// FR-502: Map marker for incidents
import React from "react";
import { StyleSheet, View, Text } from "react-native";
import type { IncidentSummary } from "@campus-gps/shared-types";
import { INCIDENT_TYPE_LABELS } from "@campus-gps/shared-types";

const TYPE_ICONS: Record<string, string> = {
  obras: "🚧",
  obstaculo_temporal: "⚠️",
  superficie_danada: "🕳️",
  ascensor_averiado: "🛗",
  rampa_bloqueada: "♿",
  otro: "📌",
};

interface IncidentMarkerProps {
  incident: IncidentSummary;
}

/**
 * FR-502: Visual marker for displaying incidents on the map
 * Used as a child of MapLibre PointAnnotation
 */
export default function IncidentMarker({ incident }: IncidentMarkerProps) {
  const icon = TYPE_ICONS[incident.type] ?? "📌";
  const typeLabel = INCIDENT_TYPE_LABELS[incident.type] ?? incident.type;

  return (
    <View
      style={styles.container}
      accessibilityRole="image"
      accessibilityLabel={`Incidencia: ${typeLabel}, ${incident.title}`}
    >
      <Text style={styles.icon} accessibilityElementsHidden>
        {icon}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#ea4335",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  icon: {
    fontSize: 18,
  },
});
