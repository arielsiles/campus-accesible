// FR-702: Draggable waypoint marker for route editor
import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { PointAnnotation } from "@maplibre/maplibre-react-native";
import type { DraftWaypoint } from "../store/routeCreatorStore";

const TYPE_ICONS: Record<string, string> = {
  entrance: "🚪",
  building: "🏛️",
  intersection: "🔀",
  transport_stop: "🚏",
  landmark: "📍",
  rest_area: "🪑",
  hazard: "⚠️",
  information_point: "ℹ️",
};

interface DraggableWaypointProps {
  waypoint: DraftWaypoint;
  index: number;
  onDragEnd: (index: number, longitude: number, latitude: number) => void;
  onSelect: (index: number) => void;
}

export default function DraggableWaypoint({
  waypoint,
  index,
  onDragEnd,
  onSelect,
}: DraggableWaypointProps) {
  const icon = TYPE_ICONS[waypoint.waypointType] ?? "📍";

  return (
    <PointAnnotation
      id={`editor-wp-${waypoint.id}`}
      coordinate={[waypoint.longitude, waypoint.latitude]}
      draggable
      onDragEnd={(e) => {
        const coords = e.geometry.coordinates;
        onDragEnd(index, coords[0], coords[1]);
      }}
      onSelected={() => onSelect(index)}
      title={waypoint.name}
    >
      <View
        style={styles.marker}
        accessibilityRole="button"
        accessibilityLabel={`Punto ${index + 1}: ${waypoint.name}. Arrastra para mover.`}
      >
        <Text style={styles.index}>{index + 1}</Text>
        <Text style={styles.icon} accessibilityElementsHidden>{icon}</Text>
      </View>
    </PointAnnotation>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a73e8",
    borderWidth: 3,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  index: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    position: "absolute",
    top: 2,
    right: 4,
  },
  icon: {
    fontSize: 18,
  },
});
