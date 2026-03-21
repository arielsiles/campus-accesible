// FR-005: Waypoint markers rendered on MapLibre map
import React, { useMemo, useCallback } from "react";
import { Alert } from "react-native";
import {
  ShapeSource,
  CircleLayer,
  SymbolLayer,
  type OnPressEvent,
} from "@maplibre/maplibre-react-native";
import type { RouteFeatureCollection } from "@campus-gps/shared-types";

interface WaypointMarkerProps {
  routeData: RouteFeatureCollection;
}

// FR-303: Waypoint type labels in Spanish for accessible announcements
const WAYPOINT_TYPE_LABELS: Record<string, string> = {
  building: "Edificio",
  entrance: "Entrada",
  intersection: "Cruce",
  transport_stop: "Parada de transporte",
  landmark: "Punto de referencia",
  hazard: "Zona de precaución",
  rest_area: "Área de descanso",
  information_point: "Punto de información",
};

// FR-005: Color mapping by waypoint type (spec enums) for visual differentiation
const WAYPOINT_COLORS: Record<string, string> = {
  building: "#1a73e8",
  entrance: "#34a853",
  intersection: "#fbbc04",
  transport_stop: "#ea4335",
  landmark: "#ff6d01",
  hazard: "#d32f2f",
  rest_area: "#607d8b",
  information_point: "#00bcd4",
};

export default function WaypointMarker({ routeData }: WaypointMarkerProps) {
  // FR-005: Filter only waypoint features (Point)
  const waypointGeoJSON = useMemo(() => {
    const waypointFeatures = routeData.features.filter(
      (f) => f.properties.featureType === "waypoint"
    );
    return {
      type: "FeatureCollection" as const,
      features: waypointFeatures,
    };
  }, [routeData]);

  // FR-005, FR-303: Show waypoint info on tap with accessible announcement
  const handlePress = useCallback((event: OnPressEvent) => {
    const feature = event.features?.[0];
    if (!feature?.properties) return;

    const name = feature.properties.name as string;
    const description = feature.properties.description as string;
    const waypointType = feature.properties.waypointType as string;
    const typeLabel = WAYPOINT_TYPE_LABELS[waypointType] ?? waypointType;

    // FR-303: Alert includes type for screen reader context
    Alert.alert(`${name} — ${typeLabel}`, description);
  }, []);

  return (
    <ShapeSource
      id="route-waypoints"
      shape={waypointGeoJSON}
      onPress={handlePress}
      hitbox={{ width: 44, height: 44 }}
    >
      <CircleLayer
        id="waypoint-circle"
        style={{
          circleRadius: 10,
          // FR-005: Color by waypoint type using MapLibre match expression
          circleColor: [
            "match",
            ["get", "waypointType"],
            "building", "#1a73e8",
            "entrance", "#34a853",
            "intersection", "#fbbc04",
            "transport_stop", "#ea4335",
            "landmark", "#ff6d01",
            "hazard", "#d32f2f",
            "rest_area", "#607d8b",
            "information_point", "#00bcd4",
            "#999999",
          ] as unknown as string,
          circleStrokeColor: "#ffffff",
          circleStrokeWidth: 2,
        }}
      />
      <SymbolLayer
        id="waypoint-label"
        style={{
          textField: ["get", "name"],
          textFont: ["Noto Sans Regular"],
          textSize: 12,
          textOffset: [0, 1.5],
          textAnchor: "top",
          textColor: "#333333",
          textHaloColor: "#ffffff",
          textHaloWidth: 1,
        }}
      />
    </ShapeSource>
  );
}
