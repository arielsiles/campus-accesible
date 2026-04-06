// FR-701, FR-803: Route recorder screen — GPS track recording with OSM suggestions
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import MapView from "../components/MapView";
import UserLocationMarker from "../components/UserLocationMarker";
import RecordingControls from "../components/RecordingControls";
import WaypointSuggestionComponent from "../components/WaypointSuggestion";
import { useRouteCreatorStore } from "../store/routeCreatorStore";
import { useLocationStore } from "../store/locationStore";
import {
  checkForSuggestion,
  dismissSuggestion,
  resetSuggestions,
} from "../services/waypointSuggestionService";
import type { WaypointSuggestion } from "../services/waypointSuggestionService";
import {
  startTrackRecording,
  stopTrackRecording,
  pauseTrackRecording,
  resumeTrackRecording,
} from "../services/trackRecorderService";

const WAYPOINT_TYPES = [
  { value: "entrance", label: "Entrada" },
  { value: "building", label: "Edificio" },
  { value: "intersection", label: "Cruce" },
  { value: "transport_stop", label: "Parada transporte" },
  { value: "landmark", label: "Punto referencia" },
  { value: "rest_area", label: "Zona descanso" },
  { value: "hazard", label: "Zona peligro" },
  { value: "information_point", label: "Punto informacion" },
];

interface RouteRecorderScreenProps {
  onFinish: () => void;
  onCancel: () => void;
}

export default function RouteRecorderScreen({
  onFinish,
  onCancel,
}: RouteRecorderScreenProps) {
  const isRecording = useRouteCreatorStore((s) => s.isRecording);
  const isPaused = useRouteCreatorStore((s) => s.isPaused);
  const startTime = useRouteCreatorStore((s) => s.startTime);
  const trackPoints = useRouteCreatorStore((s) => s.trackPoints);
  const waypoints = useRouteCreatorStore((s) => s.waypoints);
  const addWaypoint = useRouteCreatorStore((s) => s.addWaypoint);
  const generateSegments = useRouteCreatorStore((s) => s.generateSegments);

  const coords = useLocationStore((s) => s.coords);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showWaypointModal, setShowWaypointModal] = useState(false);
  const [wpName, setWpName] = useState("");
  const [wpDescription, setWpDescription] = useState("");
  const [wpType, setWpType] = useState("landmark");
  const [error, setError] = useState<string | null>(null);

  // FR-803: OSM waypoint suggestions
  const [suggestion, setSuggestion] = useState<WaypointSuggestion | null>(null);
  const suggestionCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (!isRecording || isPaused || !startTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, isPaused, startTime]);

  // Start recording on mount
  useEffect(() => {
    resetSuggestions();
    startTrackRecording().then((ok) => {
      if (!ok) setError("No se pudo acceder al GPS. Verifica los permisos.");
    });

    // FR-803: Periodically check for OSM waypoint suggestions (every 5s)
    suggestionCheckRef.current = setInterval(async () => {
      const currentCoords = useLocationStore.getState().coords;
      const currentWps = useRouteCreatorStore.getState().waypoints;
      if (!currentCoords || !useRouteCreatorStore.getState().isRecording) return;

      const found = await checkForSuggestion(
        currentCoords.latitude,
        currentCoords.longitude,
        currentWps.map((w) => w.name)
      );
      setSuggestion(found);
    }, 5000);

    return () => {
      if (suggestionCheckRef.current) clearInterval(suggestionCheckRef.current);
      if (useRouteCreatorStore.getState().isRecording) {
        stopTrackRecording();
      }
    };
  }, []);

  const handleMarkWaypoint = useCallback(() => {
    if (!coords) {
      setError("Esperando senal GPS...");
      return;
    }
    setWpName("");
    setWpDescription("");
    setWpType("landmark");
    setShowWaypointModal(true);
  }, [coords]);

  const handleSaveWaypoint = useCallback(() => {
    if (!coords || wpName.trim().length === 0) return;

    addWaypoint({
      id: "",
      name: wpName.trim(),
      description: wpDescription.trim(),
      waypointType: wpType,
      latitude: coords.latitude,
      longitude: coords.longitude,
      orderIndex: 0,
    });

    setShowWaypointModal(false);
  }, [coords, wpName, wpDescription, wpType, addWaypoint]);

  const handleStop = useCallback(() => {
    if (waypoints.length < 2) {
      setError("Se necesitan al menos 2 puntos para crear una ruta");
      return;
    }
    stopTrackRecording();
    generateSegments();
    onFinish();
  }, [waypoints.length, generateSegments, onFinish]);

  // FR-803: Accept OSM suggestion as waypoint
  const handleAcceptSuggestion = useCallback((s: WaypointSuggestion) => {
    addWaypoint({
      id: "",
      name: s.name,
      description: `Detectado via OpenStreetMap`,
      waypointType: s.waypointType,
      latitude: s.latitude,
      longitude: s.longitude,
      orderIndex: 0,
    });
    setSuggestion(null);
  }, [addWaypoint]);

  const handleDismissSuggestion = useCallback((osmId: number) => {
    dismissSuggestion(osmId);
    setSuggestion(null);
  }, []);

  const handleCancel = useCallback(() => {
    stopTrackRecording();
    useRouteCreatorStore.getState().reset();
    onCancel();
  }, [onCancel]);

  const mapCenter = coords
    ? [coords.longitude, coords.latitude] as [number, number]
    : undefined;

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Pantalla de grabacion de ruta"
    >
      {/* Map */}
      <MapView center={mapCenter} zoom={17}>
        {coords && <UserLocationMarker />}
      </MapView>

      {/* Cancel button (top) */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancel}
        accessibilityLabel="Cancelar grabacion"
        accessibilityRole="button"
      >
        <Text style={styles.cancelText}>✕ Cancelar</Text>
      </TouchableOpacity>

      {/* Error */}
      {error && (
        <View
          style={styles.errorBanner}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => setError(null)}
            accessibilityLabel="Cerrar aviso"
            accessibilityRole="button"
          >
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FR-803: OSM waypoint suggestion */}
      {suggestion && (
        <View style={styles.suggestionContainer}>
          <WaypointSuggestionComponent
            suggestion={suggestion}
            onAccept={handleAcceptSuggestion}
            onDismiss={handleDismissSuggestion}
          />
        </View>
      )}

      {/* Recording controls (bottom) */}
      <View style={styles.controlsContainer}>
        <RecordingControls
          isRecording={isRecording}
          isPaused={isPaused}
          trackPointCount={trackPoints.length}
          waypointCount={waypoints.length}
          elapsedSeconds={elapsedSeconds}
          onMarkWaypoint={handleMarkWaypoint}
          onPause={pauseTrackRecording}
          onResume={resumeTrackRecording}
          onStop={handleStop}
        />
      </View>

      {/* Waypoint creation modal */}
      <Modal
        visible={showWaypointModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWaypointModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={styles.modalContent}
            accessibilityRole="alert"
            accessibilityLabel="Formulario para crear punto de interes"
          >
            <Text style={styles.modalTitle} accessibilityRole="header">
              Nuevo punto
            </Text>

            <TextInput
              style={styles.input}
              value={wpName}
              onChangeText={setWpName}
              placeholder="Nombre del punto"
              placeholderTextColor="#999"
              accessibilityLabel="Nombre del punto"
              autoFocus
            />

            <TextInput
              style={styles.input}
              value={wpDescription}
              onChangeText={setWpDescription}
              placeholder="Descripcion (opcional)"
              placeholderTextColor="#999"
              accessibilityLabel="Descripcion del punto"
            />

            <View style={styles.typeGrid}>
              {WAYPOINT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeOption,
                    wpType === t.value && styles.typeOptionSelected,
                  ]}
                  onPress={() => setWpType(t.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: wpType === t.value }}
                  accessibilityLabel={t.label}
                >
                  <Text
                    style={[
                      styles.typeLabel,
                      wpType === t.value && styles.typeLabelSelected,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowWaypointModal(false)}
                accessibilityLabel="Cancelar"
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSave,
                  wpName.trim().length === 0 && styles.modalSaveDisabled,
                ]}
                onPress={handleSaveWaypoint}
                disabled={wpName.trim().length === 0}
                accessibilityLabel="Guardar punto"
                accessibilityRole="button"
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cancelButton: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  cancelText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  suggestionContainer: {
    position: "absolute",
    bottom: 180,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  errorBanner: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ea4335",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { color: "#fff", fontSize: 14, flex: 1 },
  errorDismiss: { color: "#fff", fontSize: 18, paddingLeft: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#333",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    minHeight: 48,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    minHeight: 44,
    justifyContent: "center",
  },
  typeOptionSelected: {
    borderColor: "#1a73e8",
    backgroundColor: "#e8f0fe",
  },
  typeLabel: { fontSize: 13, color: "#666" },
  typeLabelSelected: { color: "#1a73e8", fontWeight: "600" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    minHeight: 48,
    justifyContent: "center",
  },
  modalCancelText: { fontSize: 16, color: "#666" },
  modalSave: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#1a73e8",
    minHeight: 48,
    justifyContent: "center",
  },
  modalSaveDisabled: { backgroundColor: "#b0c4de" },
  modalSaveText: { fontSize: 16, color: "#fff", fontWeight: "600" },
});
