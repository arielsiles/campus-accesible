// FR-707: Route upload service — serializes and sends route to server
import { apiPost } from "./apiClient";
import { invalidateCache } from "./apiCache";
import { useRouteCreatorStore } from "../store/routeCreatorStore";
import { validateRoute, serializeRouteToGeoJSON } from "./routeValidationService";
import type { ValidationResult } from "./routeValidationService";

interface UploadResult {
  success: boolean;
  routeId?: string;
  error?: string;
  validation?: ValidationResult;
}

interface CreateRouteResponse {
  route: { id: string; name: string; description: string };
  graphRebuilt: boolean;
}

/**
 * FR-707: Validate, serialize, and upload the current draft route
 */
export async function uploadRoute(): Promise<UploadResult> {
  const state = useRouteCreatorStore.getState();

  // Validate locally first
  const validation = validateRoute(
    state.routeName,
    state.routeDescription,
    state.waypoints,
    state.segments
  );

  if (!validation.valid) {
    return { success: false, validation };
  }

  // Serialize to GeoJSON
  const geojson = serializeRouteToGeoJSON(
    state.routeName,
    state.routeDescription,
    state.waypoints,
    state.segments
  );

  try {
    const response = await apiPost<CreateRouteResponse>("/routes", geojson);

    // Invalidate route cache so new route appears in list
    invalidateCache("/routes");

    return { success: true, routeId: response.route.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al subir la ruta",
    };
  }
}
