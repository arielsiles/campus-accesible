// FR-704, FR-707: Route preview and upload screen
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouteCreatorStore } from "../store/routeCreatorStore";
import { validateRoute } from "../services/routeValidationService";
import { uploadRoute } from "../services/routeUploadService";
import { haversineDistance } from "../services/snapToRouteService";

interface RoutePreviewScreenProps {
  onDone: () => void;
  onBack: () => void;
}

export default function RoutePreviewScreen({
  onDone,
  onBack,
}: RoutePreviewScreenProps) {
  const routeName = useRouteCreatorStore((s) => s.routeName);
  const routeDescription = useRouteCreatorStore((s) => s.routeDescription);
  const waypoints = useRouteCreatorStore((s) => s.waypoints);
  const segments = useRouteCreatorStore((s) => s.segments);
  const setRouteName = useRouteCreatorStore((s) => s.setRouteName);
  const setRouteDescription = useRouteCreatorStore((s) => s.setRouteDescription);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Calculate summary
  const totalDistance = waypoints.reduce((sum, wp, i) => {
    if (i === 0) return 0;
    const prev = waypoints[i - 1];
    return sum + haversineDistance(
      [prev.longitude, prev.latitude],
      [wp.longitude, wp.latitude]
    );
  }, 0);
  const estimatedMinutes = Math.ceil(totalDistance / (4000 / 60)); // 4km/h

  // Validate
  const validation = validateRoute(routeName, routeDescription, waypoints, segments);

  const handleUpload = async () => {
    setUploading(true);
    setUploadError(null);

    const result = await uploadRoute();

    if (result.success) {
      setUploadSuccess(true);
    } else {
      setUploadError(
        result.error ||
        result.validation?.errors.map((e) => e.message).join(", ") ||
        "Error desconocido"
      );
    }

    setUploading(false);
  };

  if (uploadSuccess) {
    return (
      <View
        style={styles.successContainer}
        accessibilityRole="alert"
        accessibilityLabel="Ruta creada con exito"
      >
        <Text style={styles.successIcon} accessibilityElementsHidden>✅</Text>
        <Text style={styles.successTitle}>¡Ruta creada!</Text>
        <Text style={styles.successMessage}>
          Tu ruta "{routeName}" se ha guardado correctamente.
          Las audio-descripciones se generaran automaticamente.
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={onDone}
          accessibilityLabel="Volver al mapa"
          accessibilityRole="button"
        >
          <Text style={styles.doneButtonText}>Volver al mapa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityRole="summary"
      accessibilityLabel="Vista previa de la ruta"
    >
      <Text style={styles.title} accessibilityRole="header">
        Vista previa
      </Text>

      {/* Route name & description */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Nombre de la ruta</Text>
        <TextInput
          style={styles.input}
          value={routeName}
          onChangeText={setRouteName}
          placeholder="Ej: Entrada Norte → Area de Juegos"
          placeholderTextColor="#999"
          accessibilityLabel="Nombre de la ruta"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Descripcion</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={routeDescription}
          onChangeText={setRouteDescription}
          placeholder="Describe brevemente la ruta"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Descripcion de la ruta"
        />
      </View>

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{waypoints.length}</Text>
          <Text style={styles.statLabel}>Puntos</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{segments.length}</Text>
          <Text style={styles.statLabel}>Segmentos</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(totalDistance)}m</Text>
          <Text style={styles.statLabel}>Distancia</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{estimatedMinutes} min</Text>
          <Text style={styles.statLabel}>Tiempo est.</Text>
        </View>
      </View>

      {/* Waypoint list */}
      <Text style={styles.sectionTitle}>Puntos de la ruta</Text>
      {waypoints.map((wp, i) => (
        <View key={wp.id} style={styles.waypointItem}>
          <Text style={styles.waypointIndex}>{i + 1}</Text>
          <View style={styles.waypointInfo}>
            <Text style={styles.waypointName}>{wp.name}</Text>
            <Text style={styles.waypointType}>{wp.waypointType}</Text>
          </View>
        </View>
      ))}

      {/* Validation errors */}
      {!validation.valid && (
        <View
          style={styles.errorBox}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.errorTitle}>Errores de validacion:</Text>
          {validation.errors.map((err, i) => (
            <Text key={i} style={styles.errorItem}>• {err.message}</Text>
          ))}
        </View>
      )}

      {/* Upload error */}
      {uploadError && (
        <View
          style={styles.errorBox}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text style={styles.errorItem}>{uploadError}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel="Volver a anotar segmentos"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!validation.valid || uploading) && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={!validation.valid || uploading}
          accessibilityLabel="Guardar ruta en el servidor"
          accessibilityRole="button"
          accessibilityState={{ disabled: !validation.valid || uploading }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Guardar ruta</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 16 },
  section: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 48,
  },
  textArea: { minHeight: 80 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    elevation: 1,
  },
  stat: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: "#1a73e8" },
  statLabel: { fontSize: 12, color: "#999", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 10 },
  waypointItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    gap: 12,
  },
  waypointIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1a73e8",
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
  },
  waypointInfo: { flex: 1 },
  waypointName: { fontSize: 15, fontWeight: "500", color: "#333" },
  waypointType: { fontSize: 12, color: "#999" },
  errorBox: {
    backgroundColor: "#fce8e6",
    borderRadius: 10,
    padding: 14,
    marginVertical: 12,
  },
  errorTitle: { fontSize: 14, fontWeight: "600", color: "#ea4335", marginBottom: 6 },
  errorItem: { fontSize: 13, color: "#ea4335", marginBottom: 2 },
  navButtons: { flexDirection: "row", gap: 12, marginTop: 16 },
  backButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    minHeight: 48,
    justifyContent: "center",
  },
  backButtonText: { fontSize: 16, color: "#333" },
  uploadButton: {
    flex: 2,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#34a853",
    minHeight: 48,
    justifyContent: "center",
  },
  uploadButtonDisabled: { backgroundColor: "#b0c4de" },
  uploadButtonText: { fontSize: 16, color: "#fff", fontWeight: "600" },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f5f5f5",
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: "700", color: "#34a853", marginBottom: 8 },
  successMessage: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 24, lineHeight: 24 },
  doneButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minHeight: 48,
  },
  doneButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
