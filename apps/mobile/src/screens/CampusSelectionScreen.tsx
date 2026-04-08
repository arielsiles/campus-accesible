// FR-902: Campus selection screen
import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useCampusStore, type CampusSummary } from "../store/campusStore";

interface CampusSelectionScreenProps {
  onCampusSelected: (campus: CampusSummary) => void;
}

export default function CampusSelectionScreen({
  onCampusSelected,
}: CampusSelectionScreenProps) {
  const { campuses, isLoading, fetchCampuses, selectCampus } = useCampusStore();

  useEffect(() => {
    fetchCampuses();
  }, [fetchCampuses]);

  const handleSelect = async (campus: CampusSummary) => {
    await selectCampus(campus);
    onCampusSelected(campus);
  };

  const renderCampus = ({ item }: { item: CampusSummary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelect(item)}
      accessibilityLabel={`${item.name}, ${item.routeCount} rutas disponibles`}
      accessibilityRole="button"
      accessibilityHint="Pulsa para seleccionar este campus"
    >
      <View style={styles.cardContent}>
        <Text style={styles.campusName}>{item.name}</Text>
        <Text style={styles.campusDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.routeCount}>
            {item.routeCount} {item.routeCount === 1 ? "ruta" : "rutas"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header} accessibilityRole="header">
        <Text style={styles.title}>Selecciona tu campus</Text>
        <Text style={styles.subtitle}>
          Elige el campus donde quieres navegar
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando campus...</Text>
        </View>
      ) : campuses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No hay campus disponibles en este momento
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchCampuses}
            accessibilityLabel="Reintentar carga de campus"
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={campuses}
          renderItem={renderCampus}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: "#1a1a2e",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minHeight: 48,
  },
  cardContent: {
    padding: 16,
  },
  campusName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  campusDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeCount: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
