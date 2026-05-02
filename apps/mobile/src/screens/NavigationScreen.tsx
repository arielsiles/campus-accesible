// FR-208: Active navigation screen with route, instructions, progress
// FR-303: Screen reader integration with focus management
// FR-1105: Continuous AI scan during navigation with quick incident reporting
import React, { useEffect, useRef, useState, useCallback } from "react";
import { StyleSheet, View, Text, Switch, TouchableOpacity } from "react-native";
import { focusManager } from "../accessibility/focusManager";
import MapView from "../components/MapView";
import RoutePolyline from "../components/RoutePolyline";
import WaypointMarker from "../components/WaypointMarker";
import UserLocationMarker from "../components/UserLocationMarker";
import InstructionBanner from "../components/InstructionBanner";
import ProgressBar from "../components/ProgressBar";
import NavigationControls from "../components/NavigationControls";
import OffRouteAlert from "../components/OffRouteAlert";
import GpsLostAlert from "../components/GpsLostAlert";
import ArrivalModal from "../components/ArrivalModal";
import ContinuousScanOverlay from "../components/ContinuousScanOverlay";
import QuickReportBanner from "../components/QuickReportBanner";
import { useNavigation } from "../hooks/useNavigation";
import { useSnapToRoute } from "../hooks/useSnapToRoute";
import { useContinuousScan } from "../hooks/useContinuousScan";
import { useLocationStore } from "../store/locationStore";
import { useNavigationStore } from "../store/navigationStore";

// FR-208: GPS signal lost threshold in milliseconds
const GPS_LOST_THRESHOLD_MS = 10_000;

export default function NavigationScreen() {
  const coords = useLocationStore((s) => s.coords);

  const {
    route,
    isNavigating,
    currentInstruction,
    progress,
    isOffRoute,
    hasArrived,
    cancel,
    updatePosition,
  } = useNavigation();

  // FR-208: Track GPS signal freshness
  const [gpsLost, setGpsLost] = useState(false);
  const lastGpsTimestamp = useRef<number>(Date.now());
  const gpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // FR-203: Snap GPS to route
  const gpsPosition: [number, number] | null = coords
    ? [coords.longitude, coords.latitude]
    : null;

  const snapResult = useSnapToRoute(gpsPosition, route?.geojson ?? null);

  // FR-208: Update navigation on GPS change
  useEffect(() => {
    if (!gpsPosition || !isNavigating) return;

    lastGpsTimestamp.current = Date.now();
    setGpsLost(false);
    updatePosition(gpsPosition);
  }, [gpsPosition, isNavigating, updatePosition]);

  // FR-208: Update off-route state from snap result
  useEffect(() => {
    if (!isNavigating || !snapResult) return;
    const store = useNavigationStore.getState();
    store.setOffRoute(!snapResult.isOnRoute);
  }, [snapResult, isNavigating]);

  // FR-208: GPS lost detection (>10 seconds without update)
  useEffect(() => {
    if (!isNavigating) {
      if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
      setGpsLost(false);
      return;
    }

    gpsTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastGpsTimestamp.current;
      setGpsLost(elapsed > GPS_LOST_THRESHOLD_MS);
    }, 2000);

    return () => {
      if (gpsTimerRef.current) clearInterval(gpsTimerRef.current);
    };
  }, [isNavigating]);

  // FR-303: Set focus on instruction banner when screen mounts
  const instructionRef = useRef(null);
  useEffect(() => {
    if (isNavigating) {
      return focusManager.createScreenFocusHandler(instructionRef);
    }
  }, [isNavigating]);

  // FR-1105: Continuous scan during navigation
  const continuousScan = useContinuousScan();
  const [reportBannerKey, setReportBannerKey] = useState(0);
  const [reportBannerDismissed, setReportBannerDismissed] = useState(false);

  // Show report banner when AI detects significant risk
  const shouldShowReportBanner =
    continuousScan.enabled &&
    continuousScan.lastResult != null &&
    !reportBannerDismissed &&
    (continuousScan.lastResult.riskLevel === "high" ||
      (continuousScan.lastResult.riskLevel === "medium" &&
        continuousScan.lastResult.obstacles.length > 0));

  // Reset dismissal when a new result comes in (so user can report each new finding)
  useEffect(() => {
    if (continuousScan.lastChange?.isSignificant) {
      setReportBannerDismissed(false);
      setReportBannerKey((k) => k + 1);
    }
  }, [continuousScan.lastChange]);

  // Auto-disable continuous scan on arrival
  useEffect(() => {
    if (hasArrived) continuousScan.setEnabled(false);
  }, [hasArrived]);

  const handleScanReady = useCallback(
    (capture: (() => Promise<string | null>) | null) => {
      continuousScan.setCaptureFn(capture);
    },
    [continuousScan]
  );

  // FR-208: Center map on user or route origin
  const mapCenter: [number, number] = gpsPosition ??
    route?.origin.coordinates ?? [-3.7264, 40.4468];

  if (!route) return null;

  const destinationName = route.destination.name;

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Pantalla de navegación activa"
    >
      <MapView center={mapCenter} zoom={17}>
        <RoutePolyline routeData={route.geojson} />
        <WaypointMarker routeData={route.geojson} />
        <UserLocationMarker />
      </MapView>

      {/* FR-1105: Hidden camera for continuous scanning */}
      <ContinuousScanOverlay
        enabled={continuousScan.enabled}
        onReady={handleScanReady}
      />

      {/* FR-208: Top overlay — instruction banner */}
      <View style={styles.topOverlay} ref={instructionRef}>
        {currentInstruction && (
          <InstructionBanner instruction={currentInstruction} />
        )}

        {/* FR-208: Alerts below instruction */}
        <View style={styles.alerts}>
          <GpsLostAlert visible={gpsLost} />
          <OffRouteAlert visible={isOffRoute && !gpsLost} />
        </View>

        {/* FR-1105: Continuous scan toggle */}
        <View style={styles.scanToggle}>
          <View style={styles.scanToggleTextWrap}>
            <Text style={styles.scanToggleLabel}>
              📷 Camara IA continua
            </Text>
            <Text style={styles.scanToggleHint}>
              {continuousScan.enabled
                ? continuousScan.scanning
                  ? "Analizando..."
                  : "Activa — analiza cada 20s"
                : "Activa para analisis automatico del entorno"}
            </Text>
          </View>
          <Switch
            value={continuousScan.enabled}
            onValueChange={continuousScan.setEnabled}
            accessibilityLabel="Activar camara IA continua"
            accessibilityHint="Captura automatica del entorno cada 20 segundos durante la navegacion"
            trackColor={{ false: "#d1d5db", true: "#7c3aed" }}
            thumbColor="#fff"
          />
        </View>

        {/* FR-1105: Quick report banner when AI detects risk */}
        {shouldShowReportBanner && continuousScan.lastResult && (
          <QuickReportBanner
            key={reportBannerKey}
            result={continuousScan.lastResult}
            latitude={coords?.latitude}
            longitude={coords?.longitude}
            onDone={() => setReportBannerDismissed(true)}
          />
        )}
      </View>

      {/* FR-208: Bottom overlay — progress + controls */}
      <View style={styles.bottomOverlay}>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} />
        </View>
        <NavigationControls onCancel={cancel} />
      </View>

      {/* FR-208: Arrival modal */}
      <ArrivalModal
        visible={hasArrived}
        destinationName={destinationName}
        onDismiss={cancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topOverlay: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 8,
  },
  alerts: {
    gap: 8,
  },
  scanToggle: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minHeight: 56,
    gap: 12,
  },
  scanToggleTextWrap: {
    flex: 1,
  },
  scanToggleLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  scanToggleHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 12,
  },
  progressContainer: {
    backgroundColor: "rgba(26, 115, 232, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
