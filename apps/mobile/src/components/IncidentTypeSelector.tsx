// FR-502: Accessible incident type selector
import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import {
  INCIDENT_TYPE_LABELS,
} from "@campus-gps/shared-types";
import type { IncidentType } from "@campus-gps/shared-types";

const INCIDENT_TYPES: IncidentType[] = [
  "obras",
  "obstaculo_temporal",
  "superficie_danada",
  "ascensor_averiado",
  "rampa_bloqueada",
  "otro",
];

const TYPE_ICONS: Record<IncidentType, string> = {
  obras: "🚧",
  obstaculo_temporal: "⚠️",
  superficie_danada: "🕳️",
  ascensor_averiado: "🛗",
  rampa_bloqueada: "♿",
  otro: "📌",
};

interface IncidentTypeSelectorProps {
  selectedType: IncidentType | null;
  onSelect: (type: IncidentType) => void;
}

export default function IncidentTypeSelector({
  selectedType,
  onSelect,
}: IncidentTypeSelectorProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="radiogroup"
      accessibilityLabel="Tipo de incidencia"
    >
      {INCIDENT_TYPES.map((type) => {
        const isSelected = selectedType === type;
        return (
          <TouchableOpacity
            key={type}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(type)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${INCIDENT_TYPE_LABELS[type]}${isSelected ? ", seleccionado" : ""}`}
            accessibilityHint="Pulsa para seleccionar este tipo de incidencia"
          >
            <Text
              style={styles.icon}
              accessibilityElementsHidden
            >
              {TYPE_ICONS[type]}
            </Text>
            <Text
              style={[styles.label, isSelected && styles.labelSelected]}
            >
              {INCIDENT_TYPE_LABELS[type]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#ffffff",
    minHeight: 44,
    minWidth: 44,
    gap: 6,
  },
  optionSelected: {
    borderColor: "#1a73e8",
    backgroundColor: "#e8f0fe",
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 14,
    color: "#333333",
  },
  labelSelected: {
    color: "#1a73e8",
    fontWeight: "600",
  },
});
