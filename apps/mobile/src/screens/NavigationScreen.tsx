// FR-208: Active navigation screen with route, instructions, progress
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
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
import { useNavigation } from "../hooks/useNavigation";
import { useSnapToRoute } from "../hooks/useSnapToRoute";
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

      {/* FR-208: Top overlay — instruction banner */}
      <View style={styles.topOverlay}>
        {currentInstruction && (
          <InstructionBanner instruction={currentInstruction} />
        )}

        {/* FR-208: Alerts below instruction */}
        <View style={styles.alerts}>
          <GpsLostAlert visible={gpsLost} />
          <OffRouteAlert visible={isOffRoute && !gpsLost} />
        </View>
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
