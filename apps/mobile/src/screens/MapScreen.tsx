// FR-003, FR-004, FR-005, FR-206, FR-208, FR-502: Main map screen with route display, GPS, search, navigation, and incidents
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
import ReportIncidentScreen from "./ReportIncidentScreen";
import RouteRecorderScreen from "./RouteRecorderScreen";
import RouteEditorScreen from "./RouteEditorScreen";
import SegmentAnnotatorScreen from "./SegmentAnnotatorScreen";
import RoutePreviewScreen from "./RoutePreviewScreen";
import { useRouteCreatorStore } from "../store/routeCreatorStore";
import { useAuthStore } from "../store/authStore";
import { useMapStore } from "../store/mapStore";
import { useLocationStore } from "../store/locationStore";
import { useRoutes } from "../hooks/useRoutes";
import { useRoute } from "../hooks/useRoute";
import { useLocation } from "../hooks/useLocation";
import { useSearch } from "../hooks/useSearch";
import { useNavigation } from "../hooks/useNavigation";
import { useIncidents } from "../hooks/useIncidents";
import { calculateRoute } from "../services/routeCalculationService";

interface MapScreenProps {
  onNavigateProfile?: () => void;
  onNavigateCampus?: () => void;
  onNavigateCamera?: () => void;
}

export default function MapScreen({
  onNavigateProfile,
  onNavigateCampus,
  onNavigateCamera,
}: MapScreenProps = {}) {
  const authUser = useAuthStore((s) => s.user);
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const selectedRouteId = useMapStore((s) => s.selectedRouteId);
  const selectRoute = useMapStore((s) => s.selectRoute);

  const [routesRefreshKey, setRoutesRefreshKey] = useState(0);
  const { routes, loading: loadingRoutes } = useRoutes(routesRefreshKey);
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

  // FR-502: Incident reporting
  const coords = useLocationStore((s) => s.coords);
  const { incidents } = useIncidents(
    coords?.latitude ?? null,
    coords?.longitude ?? null,
    1000
  );
  const [showReportScreen, setShowReportScreen] = useState(false);

  // FR-701: Route creation flow
  type CreatorStep = "idle" | "recording" | "editing" | "annotating" | "preview";
  const [creatorStep, setCreatorStep] = useState<CreatorStep>("idle");

  // FR-004: Show permission modal when status is undetermined
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Route selector visibility
  const [showRouteSelector, setShowRouteSelector] = useState(false);

  // F2: Direction modal for navigating a selected route
  const [navigateRouteId, setNavigateRouteId] = useState<string | null>(null);

  useEffect(() => {
    if (permissionStatus === "undetermined") {
      setShowPermissionModal(true);
    } else {
      setShowPermissionModal(false);
    }
  }, [permissionStatus]);

  // Auto-center map on GPS position when available
  useEffect(() => {
    if (coords && permissionStatus === "granted") {
      useMapStore.getState().setCenter([coords.longitude, coords.latitude]);
    }
  }, [coords?.latitude, coords?.longitude, permissionStatus]);

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

  // F3: Find waypoint nearest to user's GPS to use as routing origin
  const findNearestWaypointToGps = (): string | null => {
    if (!route || !coords) return null;
    const waypointFeatures = route.features.filter(
      (f) => f.properties.featureType === "waypoint"
    );
    if (waypointFeatures.length === 0) return null;

    let nearestId: string | null = null;
    let minDistance = Infinity;

    for (const wp of waypointFeatures) {
      const wpCoords = wp.geometry.coordinates as [number, number];
      // Haversine distance (simple Euclidean works for small distances)
      const dLng = wpCoords[0] - coords.longitude;
      const dLat = wpCoords[1] - coords.latitude;
      const distance = Math.sqrt(dLng * dLng + dLat * dLat);

      if (distance < minDistance) {
        minDistance = distance;
        nearestId = String(wp.properties.waypointId);
      }
    }
    return nearestId;
  };

  // FR-208, F3: Calculate route and start navigation
  const handleStartNavigation = async () => {
    if (!selectedDestination || !route) return;

    setCalculatingRoute(true);
    setCalcError(null);

    try {
      // F3: Origin = waypoint nearest to user's GPS (not always the first)
      // Falls back to first waypoint if no GPS available
      let originWaypointId = findNearestWaypointToGps();

      if (!originWaypointId) {
        const originFeature = route.features.find(
          (f) => f.properties.featureType === "waypoint"
        );
        originWaypointId = originFeature?.properties.waypointId
          ? String(originFeature.properties.waypointId)
          : null;
      }

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

  // F2: Navigate selected route in chosen direction (start or end)
  const handleNavigateRouteDirection = async (
    direction: "start" | "end"
  ) => {
    if (!route) return;

    const waypoints = route.features.filter(
      (f) => f.properties.featureType === "waypoint"
    );
    if (waypoints.length === 0) return;

    const targetIndex = direction === "start" ? 0 : waypoints.length - 1;
    const targetFeature = waypoints[targetIndex];
    const destinationCoords = targetFeature.geometry.coordinates as [number, number];

    // F3: Origin = nearest waypoint to GPS
    let originWaypointId = findNearestWaypointToGps();
    if (!originWaypointId) {
      originWaypointId = String(waypoints[0].properties.waypointId);
    }
    const destinationWaypointId = String(targetFeature.properties.waypointId);

    if (originWaypointId === destinationWaypointId) {
      setCalcError("Ya estas en este punto de la ruta");
      return;
    }

    setNavigateRouteId(null);
    setShowRouteSelector(false);
    setCalculatingRoute(true);
    setCalcError(null);

    try {
      const calculatedRoute: CalculatedRoute = await calculateRoute(
        originWaypointId,
        destinationWaypointId
      );
      startNavigation(calculatedRoute);
    } catch (err) {
      setCalcError(
        err instanceof Error ? err.message : "Error al calcular la ruta"
      );
    } finally {
      setCalculatingRoute(false);
    }
  };

  // FR-208: When navigating, show NavigationScreen
  if (isNavigating) {
    return <NavigationScreen />;
  }

  // FR-702: Route editor flow (map-based)
  if (creatorStep === "editing") {
    return (
      <RouteEditorScreen
        onFinish={() => setCreatorStep("annotating")}
        onCancel={() => {
          useRouteCreatorStore.getState().reset();
          setCreatorStep("idle");
        }}
        initialCenter={coords ? [coords.longitude, coords.latitude] : center}
      />
    );
  }

  // FR-701: Route creation flow
  if (creatorStep === "recording") {
    return (
      <RouteRecorderScreen
        onFinish={() => setCreatorStep("annotating")}
        onCancel={() => {
          useRouteCreatorStore.getState().reset();
          setCreatorStep("idle");
        }}
      />
    );
  }

  if (creatorStep === "annotating") {
    return (
      <SegmentAnnotatorScreen
        onFinish={() => setCreatorStep("preview")}
        onBack={() => setCreatorStep("recording")}
      />
    );
  }

  if (creatorStep === "preview") {
    return (
      <RoutePreviewScreen
        onDone={() => {
          useRouteCreatorStore.getState().reset();
          setCreatorStep("idle");
          setRoutesRefreshKey((k) => k + 1); // FR-705: refresh route list after creation
        }}
        onBack={() => setCreatorStep("annotating")}
      />
    );
  }

  // FR-502: When reporting, show ReportIncidentScreen
  if (showReportScreen && coords) {
    return (
      <ReportIncidentScreen
        latitude={coords.latitude}
        longitude={coords.longitude}
        onClose={() => setShowReportScreen(false)}
      />
    );
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

      {/* FR-206: Search overlay with profile FAB */}
      <View style={styles.searchOverlay}>
        <View style={styles.searchRow}>
          {onNavigateProfile && (
            <TouchableOpacity
              style={styles.profileFab}
              onPress={onNavigateProfile}
              accessibilityLabel={authUser ? "Mi perfil" : "Iniciar sesion"}
              accessibilityRole="button"
            >
              <Text style={styles.profileFabText}>
                {authUser?.name?.charAt(0)?.toUpperCase() ?? "👤"}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.searchBarContainer}>
            <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
          </View>
        </View>
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

      {/* FR-1101: Camera FAB */}
      {!selectedDestination && !showSearchResults && onNavigateCamera && (
        <TouchableOpacity
          style={styles.cameraFab}
          onPress={onNavigateCamera}
          accessibilityLabel="Abrir camara para describir el entorno con IA"
          accessibilityRole="button"
          accessibilityHint="Captura el entorno y obtiene descripcion accesible"
        >
          <Text style={styles.cameraFabIcon} accessibilityElementsHidden>📷</Text>
          <Text style={styles.cameraFabText}>Camara</Text>
        </TouchableOpacity>
      )}

      {/* Route selector */}
      {!selectedDestination && !showSearchResults && (
        <TouchableOpacity
          style={styles.routeSelectorFab}
          onPress={() => setShowRouteSelector(!showRouteSelector)}
          accessibilityLabel={`Ver rutas disponibles. ${routes.length} rutas`}
          accessibilityRole="button"
        >
          <Text style={styles.routeSelectorIcon} accessibilityElementsHidden>🗂️</Text>
          <Text style={styles.routeSelectorText}>Rutas ({routes.length})</Text>
        </TouchableOpacity>
      )}

      {showRouteSelector && (
        <View style={styles.routeList}>
          <Text style={styles.routeListTitle} accessibilityRole="header">
            Rutas disponibles
          </Text>
          {routes.map((r) => (
            <View
              key={r.id}
              style={[
                styles.routeListItem,
                selectedRouteId === r.id && styles.routeListItemSelected,
              ]}
            >
              <TouchableOpacity
                style={styles.routeListItemMain}
                onPress={() => {
                  selectRoute(r.id);
                }}
                accessibilityLabel={`${r.name}${selectedRouteId === r.id ? ", seleccionada" : ""}`}
                accessibilityRole="button"
                accessibilityHint="Mostrar esta ruta en el mapa"
              >
                <Text style={[
                  styles.routeListItemText,
                  selectedRouteId === r.id && styles.routeListItemTextSelected,
                ]}>
                  {r.name}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.routeNavigateBtn}
                onPress={() => {
                  selectRoute(r.id);
                  setNavigateRouteId(r.id);
                }}
                accessibilityLabel={`Navegar por la ruta ${r.name}`}
                accessibilityRole="button"
                accessibilityHint="Elegir direccion y empezar navegacion"
              >
                <Text style={styles.routeNavigateBtnText}>Navegar →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* F2: Direction picker modal */}
      {navigateRouteId && route && (
        <View style={styles.directionModalOverlay}>
          <View style={styles.directionModal}>
            <Text style={styles.directionModalTitle} accessibilityRole="header">
              ¿Hacia donde quieres ir?
            </Text>
            {(() => {
              const wps = route.features.filter(
                (f) => f.properties.featureType === "waypoint"
              );
              const firstName = wps[0]?.properties.name ?? "Inicio";
              const lastName = wps[wps.length - 1]?.properties.name ?? "Final";
              return (
                <>
                  <TouchableOpacity
                    style={styles.directionBtn}
                    onPress={() => handleNavigateRouteDirection("start")}
                    accessibilityLabel={`Navegar hacia ${firstName}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.directionBtnLabel}>Hacia el inicio</Text>
                    <Text style={styles.directionBtnTarget}>{firstName}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.directionBtn}
                    onPress={() => handleNavigateRouteDirection("end")}
                    accessibilityLabel={`Navegar hacia ${lastName}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.directionBtnLabel}>Hacia el final</Text>
                    <Text style={styles.directionBtnTarget}>{lastName}</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
            <TouchableOpacity
              style={styles.directionCancelBtn}
              onPress={() => setNavigateRouteId(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.directionCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FR-701: Record route FAB */}
      {!selectedDestination && !showSearchResults && (
        <TouchableOpacity
          style={styles.createRouteFab}
          onPress={() => setCreatorStep("recording")}
          accessibilityLabel="Grabar ruta caminando"
          accessibilityRole="button"
          accessibilityHint="Abre la grabacion GPS para crear una ruta caminando"
        >
          <Text style={styles.createRouteFabIcon} accessibilityElementsHidden>
            🎙️
          </Text>
          <Text style={styles.createRouteFabText}>Grabar</Text>
        </TouchableOpacity>
      )}

      {/* FR-702: Edit route on map FAB */}
      {!selectedDestination && !showSearchResults && (
        <TouchableOpacity
          style={styles.editRouteFab}
          onPress={() => setCreatorStep("editing")}
          accessibilityLabel="Crear ruta en mapa"
          accessibilityRole="button"
          accessibilityHint="Abre el editor para colocar puntos en el mapa"
        >
          <Text style={styles.editRouteFabIcon} accessibilityElementsHidden>
            ✏️
          </Text>
          <Text style={styles.editRouteFabText}>Editar</Text>
        </TouchableOpacity>
      )}

      {/* FR-502: Report incident FAB */}
      {!selectedDestination && !showSearchResults && (
        <TouchableOpacity
          style={styles.reportFab}
          onPress={() => setShowReportScreen(true)}
          accessibilityLabel="Reportar incidencia"
          accessibilityRole="button"
          accessibilityHint="Abre el formulario para reportar una incidencia en el campus"
        >
          <Text style={styles.reportFabIcon} accessibilityElementsHidden>
            ⚠️
          </Text>
          <Text style={styles.reportFabText}>Reportar</Text>
        </TouchableOpacity>
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
  routeSelectorFab: {
    position: "absolute",
    bottom: 224,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 48,
    gap: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  routeListItemMain: {
    flex: 1,
    paddingVertical: 4,
    paddingRight: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  routeNavigateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1a73e8",
    borderRadius: 6,
    minHeight: 36,
    justifyContent: "center",
  },
  routeNavigateBtnText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  directionModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    padding: 24,
  },
  directionModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  directionModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 16,
    textAlign: "center",
  },
  directionBtn: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    minHeight: 56,
    justifyContent: "center",
  },
  directionBtnLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  directionBtnTarget: {
    color: "#cfe2ff",
    fontSize: 13,
    marginTop: 2,
  },
  directionCancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
    marginTop: 4,
  },
  directionCancelText: {
    color: "#666",
    fontSize: 15,
  },
  cameraFab: {
    position: "absolute",
    bottom: 288,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7c3aed",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 48,
    gap: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  cameraFabIcon: {
    fontSize: 18,
  },
  cameraFabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  routeSelectorIcon: {
    fontSize: 18,
  },
  routeSelectorText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  routeList: {
    position: "absolute",
    bottom: 280,
    right: 16,
    left: 16,
    zIndex: 20,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    maxHeight: 300,
  },
  routeListTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  routeListItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeListItemSelected: {
    backgroundColor: "#e8f0fe",
  },
  routeListItemText: {
    fontSize: 14,
    color: "#333",
  },
  routeListItemTextSelected: {
    color: "#1a73e8",
    fontWeight: "600",
  },
  createRouteFab: {
    position: "absolute",
    bottom: 160,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a73e8",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 48,
    gap: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  createRouteFabIcon: {
    fontSize: 18,
  },
  createRouteFabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  editRouteFab: {
    position: "absolute",
    bottom: 96,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34a853",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 48,
    gap: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  editRouteFabIcon: {
    fontSize: 18,
  },
  editRouteFabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  reportFab: {
    position: "absolute",
    bottom: 32,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ea4335",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 48,
    gap: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  reportFabIcon: {
    fontSize: 18,
  },
  reportFabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
  },
  profileFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  profileFabText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});
