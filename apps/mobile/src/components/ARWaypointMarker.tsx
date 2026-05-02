// FR-1305: AR marker for a POI/waypoint, positioned by useARPositioning
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { PositionedMarker } from "../hooks/useARPositioning";

export interface ARWaypointData {
  name: string;
  type?: string;
  description?: string;
}

interface ARWaypointMarkerProps {
  marker: PositionedMarker<ARWaypointData>;
  /** Total width of the AR view in pixels (used to convert screenX to absolute X) */
  viewWidth: number;
  /** Top offset in pixels for vertical placement */
  topOffset?: number;
  onPress?: (marker: PositionedMarker<ARWaypointData>) => void;
}

export default function ARWaypointMarker({
  marker,
  viewWidth,
  topOffset = 120,
  onPress,
}: ARWaypointMarkerProps) {
  if (!marker.inFov) return null;

  const left = Math.max(8, marker.screenX * viewWidth - 80);
  const distanceText =
    marker.distanceM < 1000
      ? `${Math.round(marker.distanceM)}m`
      : `${(marker.distanceM / 1000).toFixed(1)}km`;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { left, top: topOffset, opacity: marker.opacity },
      ]}
      onPress={() => onPress?.(marker)}
      accessibilityRole="button"
      accessibilityLabel={`${marker.data.name}, a ${distanceText}`}
    >
      <Text style={styles.icon} accessibilityElementsHidden>
        📍
      </Text>
      <View style={styles.textBox}>
        <Text style={styles.name} numberOfLines={1}>
          {marker.data.name}
        </Text>
        <Text style={styles.distance}>{distanceText}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 140,
    maxWidth: 220,
    minHeight: 44,
    gap: 6,
  },
  icon: {
    fontSize: 22,
  },
  textBox: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  distance: {
    color: "#a7f3d0",
    fontSize: 12,
    marginTop: 1,
  },
});
