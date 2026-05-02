// FR-1301: AR navigation screen — camera background + 2D overlays
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Switch,
} from "react-native";
import { CameraView } from "expo-camera";
import { useCamera } from "../hooks/useCamera";
import { useCompass } from "../hooks/useCompass";
import { useLocationStore } from "../store/locationStore";
import { useARPositioning } from "../hooks/useARPositioning";
import ARDirectionArrow, { type ArrowKind } from "../components/ARDirectionArrow";
import ARWaypointMarker, { type ARWaypointData } from "../components/ARWaypointMarker";
import ARRiskOverlay, { type AROverlayKind } from "../components/ARRiskOverlay";

interface ARNavigationScreenProps {
  /** Called when the user wants to switch back to map view */
  onSwitchToMap: () => void;
  /** Current text instruction from the navigation engine */
  instructionText: string;
  /** Distance in meters to the next instruction point */
  distanceToNextM: number;
  /** Bearing of the next instruction in degrees (0-360) */
  nextBearing?: number;
  /** Waypoints in the current route to render as AR markers */
  waypoints: Array<{
    id: string;
    name: string;
    type?: string;
    description?: string;
    latitude: number;
    longitude: number;
  }>;
  /** Active risk hint (if any) */
  riskHint?: {
    kind: AROverlayKind;
    message: string;
    distanceM: number;
  };
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ARNavigationScreen({
  onSwitchToMap,
  instructionText,
  distanceToNextM,
  nextBearing,
  waypoints,
  riskHint,
}: ARNavigationScreenProps) {
  const { permission, requestPermission } = useCamera();
  const { heading, isAvailable: compassAvailable } = useCompass();
  const coords = useLocationStore((s) => s.coords);
  const [simpleMode, setSimpleMode] = useState(false);

  const arMarkers = useMemo(
    () =>
      waypoints.map((w) => ({
        id: w.id,
        latitude: w.latitude,
        longitude: w.longitude,
        data: { name: w.name, type: w.type, description: w.description } as ARWaypointData,
      })),
    [waypoints]
  );

  const positioned = useARPositioning(
    arMarkers,
    coords?.latitude ?? null,
    coords?.longitude ?? null,
    heading
  );

  // FR-1301: Determine arrow kind from bearing diff to next instruction
  const arrowKind: ArrowKind = useMemo(() => {
    if (distanceToNextM < 1) return "arrived";
    if (nextBearing == null) return "straight";
    let delta = ((nextBearing - heading + 540) % 360) - 180;
    if (Math.abs(delta) <= 25) return "straight";
    if (delta > 25 && delta < 155) return "right";
    if (delta < -25 && delta > -155) return "left";
    return "u-turn";
  }, [nextBearing, heading, distanceToNextM]);

  // Permission handling
  if (permission === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.statusText}>Comprobando permisos...</Text>
      </View>
    );
  }

  if (permission !== "granted") {
    return (
      <View style={styles.center}>
        <Text style={styles.title} accessibilityRole="header">
          Permiso de camara requerido
        </Text>
        <Text style={styles.body}>
          Para la navegacion en realidad aumentada necesitamos acceso a la camara.
          Sirve solo para mostrar el entorno detras de las indicaciones.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel="Permitir camara"
        >
          <Text style={styles.primaryBtnText}>Permitir camara</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSwitchToMap}
          accessibilityRole="button"
          accessibilityLabel="Volver al mapa"
        >
          <Text style={styles.secondaryBtnText}>Volver al mapa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!compassAvailable) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Brujula no disponible</Text>
        <Text style={styles.body}>
          Tu dispositivo no tiene brujula (magnetometro). El modo AR no puede funcionar
          sin ella. Usa la vista de mapa.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onSwitchToMap}
          accessibilityRole="button"
          accessibilityLabel="Volver al mapa"
        >
          <Text style={styles.primaryBtnText}>Volver al mapa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onSwitchToMap}
          style={styles.topBtn}
          accessibilityRole="button"
          accessibilityLabel="Cambiar a vista de mapa"
        >
          <Text style={styles.topBtnText}>← Mapa</Text>
        </TouchableOpacity>
        <View style={styles.simpleToggle}>
          <Text style={styles.simpleToggleLabel}>Modo simple</Text>
          <Switch
            value={simpleMode}
            onValueChange={setSimpleMode}
            accessibilityLabel="Modo simplificado: solo flecha y distancia"
            trackColor={{ false: "#666", true: "#10b981" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* FR-1304: Risk overlay (always visible if active) */}
      {riskHint && (
        <View style={styles.riskWrap}>
          <ARRiskOverlay
            kind={riskHint.kind}
            message={riskHint.message}
            distanceM={riskHint.distanceM}
          />
        </View>
      )}

      {/* FR-1305: Waypoint markers (hidden in simple mode) */}
      {!simpleMode &&
        positioned.map((m) => (
          <ARWaypointMarker
            key={m.id}
            marker={m}
            viewWidth={SCREEN_WIDTH}
          />
        ))}

      {/* FR-1303: Direction arrow centered at bottom */}
      <View style={styles.arrowWrap} pointerEvents="none">
        <ARDirectionArrow
          kind={arrowKind}
          distanceM={distanceToNextM}
          instructionText={instructionText}
        />
      </View>

      {/* Heading indicator */}
      <View style={styles.headingBadge} pointerEvents="none">
        <Text style={styles.headingText}>{Math.round(heading)}°</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#1a1a2e",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  body: {
    color: "#ccc",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  statusText: { color: "#fff", fontSize: 16 },
  primaryBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minHeight: 48,
    minWidth: 200,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  secondaryBtnText: {
    color: "#ccc",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  topBar: {
    position: "absolute",
    top: 48,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
  },
  topBtn: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  topBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  simpleToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  simpleToggleLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  riskWrap: {
    position: "absolute",
    top: 110,
    left: 16,
    right: 16,
    zIndex: 18,
  },
  arrowWrap: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 15,
  },
  headingBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 15,
  },
  headingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
