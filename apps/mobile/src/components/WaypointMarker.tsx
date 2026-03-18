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

// FR-005: Color mapping by waypoint type for visual differentiation
const WAYPOINT_COLORS: Record<string, string> = {
  BUILDING: "#1a73e8",
  ENTRANCE: "#34a853",
  INTERSECTION: "#fbbc04",
  BUS_STOP: "#ea4335",
  METRO: "#9334e6",
  LANDMARK: "#ff6d01",
  PARKING: "#607d8b",
  ACCESSIBILITY_FEATURE: "#00bcd4",
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

  // FR-005: Show waypoint info on tap
  const handlePress = useCallback((event: OnPressEvent) => {
    const feature = event.features?.[0];
    if (!feature?.properties) return;

    const name = feature.properties.name as string;
    const description = feature.properties.description as string;
    Alert.alert(name, description);
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
          circleColor: [
            "match",
            ["get", "waypointType"],
            "BUILDING",
            WAYPOINT_COLORS.BUILDING,
            "ENTRANCE",
            WAYPOINT_COLORS.ENTRANCE,
            "INTERSECTION",
            WAYPOINT_COLORS.INTERSECTION,
            "BUS_STOP",
            WAYPOINT_COLORS.BUS_STOP,
            "METRO",
            WAYPOINT_COLORS.METRO,
            "LANDMARK",
            WAYPOINT_COLORS.LANDMARK,
            "PARKING",
            WAYPOINT_COLORS.PARKING,
            "ACCESSIBILITY_FEATURE",
            WAYPOINT_COLORS.ACCESSIBILITY_FEATURE,
            "#999999",
          ],
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
