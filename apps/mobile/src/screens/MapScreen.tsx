// FR-003, FR-004, FR-005, FR-206, FR-208: Main map screen with route display, GPS, search, and navigation
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import type { SearchResult, CalculatedRoute } from "@campus-gps/shared-types";
import MapView from "../components/MapView";
import RoutePolyline from "../components/RoutePolyline";
import WaypointMarker from "../components/WaypointMarker";
import UserLocationMarker from "../components/UserLocationMarker";
import PermissionRequestModal from "../components/PermissionRequestModal";
import SearchBar from "../components/SearchBar";
import SearchResults from "../components/SearchResults";
import NavigationScreen from "./NavigationScreen";
import { useMapStore } from "../store/mapStore";
import { useRoutes } from "../hooks/useRoutes";
import { useRoute } from "../hooks/useRoute";
import { useLocation } from "../hooks/useLocation";
import { useSearch } from "../hooks/useSearch";
import { useNavigation } from "../hooks/useNavigation";
import { calculateRoute } from "../services/routeCalculationService";

export default function MapScreen() {
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const selectedRouteId = useMapStore((s) => s.selectedRouteId);
  const selectRoute = useMapStore((s) => s.selectRoute);

  const { routes, loading: loadingRoutes } = useRoutes();
  const { route, loading: loadingRoute, error } = useRoute(selectedRouteId);
  const { permissionStatus, requestPermission } = useLocation();
  const {
    results: searchResults,
    loading: searchLoading,
    search,
    clear: clearSearch,
  } = useSearch();
  const { isNavigating, start: startNavigation } = useNavigation();

  // FR-206: Track search visibility
  const [showSearchResults, setShowSearchResults] = useState(false);

  // FR-208: Selected destination for navigation
  const [selectedDestination, setSelectedDestination] =
    useState<SearchResult | null>(null);

  // FR-208: Route calculation loading state
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

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

  // FR-206: Handle search and destination selection
  const handleSearch = (query: string) => {
    search(query);
    setShowSearchResults(true);
  };

  const handleClearSearch = () => {
    clearSearch();
    setShowSearchResults(false);
  };

  const handleSelectDestination = (result: SearchResult) => {
    // FR-206: Center map on selected waypoint
    useMapStore.getState().setCenter(result.coordinates);
    setShowSearchResults(false);
    clearSearch();
    // FR-208: Store selected destination for navigation
    setSelectedDestination(result);
    setCalcError(null);
  };

  // FR-208: Calculate route and start navigation
  const handleStartNavigation = async () => {
    if (!selectedDestination || !route) return;

    setCalculatingRoute(true);
    setCalcError(null);

    try {
      // FR-208: Use first waypoint of current route as origin
      const originFeature = route.features.find(
        (f) => f.properties.featureType === "waypoint"
      );
      const originWaypointId = originFeature?.properties.waypointId;

      if (!originWaypointId) {
        setCalcError("No se encontró el punto de origen");
        return;
      }

      const calculatedRoute: CalculatedRoute = await calculateRoute(
        originWaypointId,
        selectedDestination.waypointId
      );

      startNavigation(calculatedRoute);
      setSelectedDestination(null);
    } catch (err) {
      setCalcError(
        err instanceof Error ? err.message : "Error al calcular la ruta"
      );
    } finally {
      setCalculatingRoute(false);
    }
  };

  const handleDismissDestination = () => {
    setSelectedDestination(null);
    setCalcError(null);
  };

  // FR-208: When navigating, show NavigationScreen
  if (isNavigating) {
    return <NavigationScreen />;
  }

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

      {/* FR-206: Search overlay */}
      <View style={styles.searchOverlay}>
        <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
        {showSearchResults && (searchResults.length > 0 || searchLoading) && (
          <View style={styles.searchResultsContainer}>
            <SearchResults
              results={searchResults}
              loading={searchLoading}
              onSelect={handleSelectDestination}
            />
          </View>
        )}
      </View>

      {/* FR-208: Destination card with navigate button */}
      {selectedDestination && !showSearchResults && (
        <View style={styles.destinationCard}>
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationName}>
              {selectedDestination.name}
            </Text>
            <Text style={styles.destinationDescription}>
              {selectedDestination.description}
            </Text>
          </View>
          <View style={styles.destinationActions}>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={handleStartNavigation}
              disabled={calculatingRoute}
              accessibilityLabel={`Navegar a ${selectedDestination.name}`}
              accessibilityRole="button"
              accessibilityHint="Calcula la ruta y comienza la navegación"
            >
              {calculatingRoute ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.navigateButtonText}>Navegar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismissDestination}
              accessibilityLabel="Descartar destino"
              accessibilityRole="button"
            >
              <Text style={styles.dismissButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          {calcError && (
            <Text
              style={styles.calcErrorText}
              accessibilityRole="alert"
              accessibilityLabel={`Error: ${calcError}`}
            >
              {calcError}
            </Text>
          )}
        </View>
      )}

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
  searchOverlay: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchResultsContainer: {
    marginTop: 4,
  },
  destinationCard: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  destinationInfo: {
    marginBottom: 12,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
  },
  destinationDescription: {
    fontSize: 14,
    color: "#666666",
  },
  destinationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: 14,
    minHeight: 48, // NFR-202: Minimum touch target
    alignItems: "center",
    justifyContent: "center",
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  dismissButton: {
    width: 48,
    height: 48, // NFR-202: Minimum touch target
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  dismissButtonText: {
    fontSize: 18,
    color: "#666666",
  },
  calcErrorText: {
    fontSize: 13,
    color: "#ea4335",
    marginTop: 8,
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
