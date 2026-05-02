// FR-1205: Unified contextual info panel: weather + nearby places
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocationStore } from "../store/locationStore";
import {
  fetchContextAll,
  type ContextAll,
  type NearbyPlace,
} from "../services/contextService";

interface ContextPanelProps {
  onBack: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  pharmacy: "🏥 Farmacia",
  hospital: "🏥 Hospital",
  bank: "🏦 Banco",
  atm: "💳 Cajero",
  cafe: "☕ Cafeteria",
  restaurant: "🍴 Restaurante",
  supermarket: "🛒 Supermercado",
  toilets: "🚻 Banos",
  transport: "🚉 Transporte",
  education: "🎓 Educacion",
  info: "ℹ️ Informacion",
  other: "📍 Punto de interes",
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "#3b82f6",
  warning: "#f59e0b",
  danger: "#dc2626",
};

export default function ContextPanel({ onBack }: ContextPanelProps) {
  const coords = useLocationStore((s) => s.coords);
  const [data, setData] = useState<ContextAll | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!coords) {
      setError("Sin GPS disponible");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const result = await fetchContextAll(coords.latitude, coords.longitude);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords?.latitude, coords?.longitude]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver al mapa"
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Informacion del entorno
        </Text>
      </View>

      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.statusText}>Cargando informacion...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Weather */}
          {data?.weather && (
            <View
              style={styles.section}
              accessibilityLabel={`Clima actual: ${data.weather.conditionLocal}, ${data.weather.temperature} grados`}
            >
              <Text style={styles.sectionTitle} accessibilityRole="header">
                🌤️ Clima
              </Text>
              <View style={styles.weatherRow}>
                <Text style={styles.weatherTemp}>
                  {data.weather.temperature}°C
                </Text>
                <View style={styles.weatherDetails}>
                  <Text style={styles.weatherCondition}>
                    {data.weather.conditionLocal}
                  </Text>
                  <Text style={styles.weatherMeta}>
                    Sensacion {data.weather.feelsLike}°C · Humedad{" "}
                    {data.weather.humidity}% · Viento{" "}
                    {data.weather.windSpeed.toFixed(1)} m/s
                  </Text>
                </View>
              </View>
              {data.weather.alerts.map((alert, i) => (
                <View
                  key={i}
                  style={[
                    styles.alertBox,
                    {
                      backgroundColor: SEVERITY_COLORS[alert.severity] + "22",
                      borderColor: SEVERITY_COLORS[alert.severity],
                    },
                  ]}
                  accessibilityRole="alert"
                >
                  <Text
                    style={[
                      styles.alertText,
                      { color: SEVERITY_COLORS[alert.severity] },
                    ]}
                  >
                    {alert.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Places */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              📍 Cerca de ti
            </Text>
            {data?.places && data.places.length > 0 ? (
              data.places.map((place) => (
                <PlaceRow key={place.id} place={place} />
              ))
            ) : (
              <Text style={styles.emptyText}>
                No se encontraron lugares cercanos en OpenStreetMap.
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function PlaceRow({ place }: { place: NearbyPlace }) {
  const distance =
    place.distanceM < 1000
      ? `${Math.round(place.distanceM)} m`
      : `${(place.distanceM / 1000).toFixed(1)} km`;
  const wheelchairLabel =
    place.wheelchair === "yes"
      ? " · ♿ Accesible"
      : place.wheelchair === "limited"
        ? " · ♿ Limitado"
        : place.wheelchair === "no"
          ? " · ♿ No accesible"
          : "";
  return (
    <View
      style={styles.placeRow}
      accessibilityLabel={`${place.name}, a ${distance}${wheelchairLabel}`}
    >
      <Text style={styles.placeCategory}>
        {CATEGORY_LABELS[place.category] ?? CATEGORY_LABELS.other}
      </Text>
      <Text style={styles.placeName}>{place.name}</Text>
      <Text style={styles.placeMeta}>
        {distance}
        {place.openingHours ? ` · ${place.openingHours}` : ""}
        {wheelchairLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#1a1a2e",
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "center",
  },
  backText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginLeft: 8,
  },
  content: { padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  statusText: { fontSize: 16, color: "#666", marginTop: 12 },
  errorText: { fontSize: 16, color: "#dc2626", textAlign: "center" },
  retryBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  retryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 12,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: "300",
    color: "#1a1a2e",
  },
  weatherDetails: { flex: 1 },
  weatherCondition: {
    fontSize: 16,
    color: "#1a1a2e",
    textTransform: "capitalize",
  },
  weatherMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  alertBox: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  alertText: { fontSize: 14, fontWeight: "500" },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    paddingVertical: 8,
  },
  placeRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  placeCategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  placeMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
