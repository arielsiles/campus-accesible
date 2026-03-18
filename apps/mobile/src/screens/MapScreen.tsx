// FR-003, FR-004, FR-005: Main map screen with route display and GPS
import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import MapView from "../components/MapView";
import RoutePolyline from "../components/RoutePolyline";
import WaypointMarker from "../components/WaypointMarker";
import UserLocationMarker from "../components/UserLocationMarker";
import PermissionRequestModal from "../components/PermissionRequestModal";
import { useMapStore } from "../store/mapStore";
import { useRoutes } from "../hooks/useRoutes";
import { useRoute } from "../hooks/useRoute";
import { useLocation } from "../hooks/useLocation";

export default function MapScreen() {
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const selectedRouteId = useMapStore((s) => s.selectedRouteId);
  const selectRoute = useMapStore((s) => s.selectRoute);

  const { routes, loading: loadingRoutes } = useRoutes();
  const { route, loading: loadingRoute, error } = useRoute(selectedRouteId);
  const { permissionStatus, requestPermission } = useLocation();

  // FR-004: Show permission modal when status is undetermined
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    if (permissionStatus === "undetermined") {
      setShowPermissionModal(true);
    } else {
      setShowPermissionModal(false);
    }
  }, [permissionStatus]);

  // FR-005: Auto-select first route when routes load
  useEffect(() => {
    if (routes.length > 0 && !selectedRouteId) {
      selectRoute(routes[0].id);
    }
  }, [routes, selectedRouteId, selectRoute]);

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Pantalla del mapa de navegación del campus"
    >
      <MapView center={center} zoom={zoom}>
        {permissionStatus === "granted" && <UserLocationMarker />}
        {route && <RoutePolyline routeData={route} />}
        {route && <WaypointMarker routeData={route} />}
      </MapView>

      <PermissionRequestModal
        visible={showPermissionModal}
        onRequestPermission={async () => {
          await requestPermission();
          setShowPermissionModal(false);
        }}
        onDismiss={() => setShowPermissionModal(false)}
      />

      {(loadingRoutes || loadingRoute) && (
        <View
          style={styles.loadingOverlay}
          accessibilityRole="alert"
          accessibilityLabel="Cargando ruta"
        >
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Cargando ruta...</Text>
        </View>
      )}

      {error && (
        <View
          style={styles.errorOverlay}
          accessibilityRole="alert"
          accessibilityLabel={`Error: ${error}`}
        >
          <Text style={styles.errorText}>Error al cargar la ruta</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    color: "#333333",
  },
  errorOverlay: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    backgroundColor: "rgba(234, 67, 53, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#ffffff",
  },
});
