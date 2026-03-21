// FR-206: Search results dropdown component
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import type { SearchResult } from "@campus-gps/shared-types";

// FR-206: Human-readable waypoint type labels in Spanish
const WAYPOINT_TYPE_LABELS: Record<string, string> = {
  building: "Edificio",
  entrance: "Entrada",
  intersection: "Cruce",
  transport_stop: "Parada de transporte",
  landmark: "Punto de referencia",
  hazard: "Zona de precaución",
  rest_area: "Área de descanso",
  information_point: "Punto de información",
};

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  onSelect: (result: SearchResult) => void;
}

export default function SearchResults({
  results,
  loading,
  onSelect,
}: SearchResultsProps) {
  if (loading) {
    return (
      <View
        style={styles.container}
        accessibilityRole="alert"
        accessibilityLabel="Buscando destinos"
      >
        <ActivityIndicator size="small" color="#1a73e8" />
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View
        style={styles.container}
        accessibilityRole="alert"
        accessibilityLabel="Sin resultados"
      >
        <Text style={styles.emptyText}>Sin resultados</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={results}
      keyExtractor={(item) => item.waypointId}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => {
        const typeLabel =
          WAYPOINT_TYPE_LABELS[item.waypointType] ?? item.waypointType;
        return (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => onSelect(item)}
            accessibilityLabel={`${item.name}, ${typeLabel}`}
            accessibilityHint="Pulsa para seleccionar como destino"
            accessibilityRole="button"
          >
            <Text style={styles.resultName}>{item.name}</Text>
            <Text style={styles.resultType}>{typeLabel}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    maxHeight: 250,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    minHeight: 48, // NFR-202: Minimum touch target
  },
  resultName: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  resultType: {
    fontSize: 13,
    color: "#666666",
    marginTop: 2,
  },
  emptyText: {
    padding: 16,
    textAlign: "center",
    color: "#666666",
    fontSize: 14,
  },
});
