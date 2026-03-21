// FR-403: Visual direction indicator for deaf profile navigation
import React from "react";
import { StyleSheet, View, Text } from "react-native";

interface HapticIndicatorProps {
  visible: boolean;
  direction: "left" | "right" | "straight" | "arrive" | null;
  distance?: number; // meters to next waypoint
}

const DIRECTION_ICONS: Record<string, string> = {
  left: "⬅️",
  right: "➡️",
  straight: "⬆️",
  arrive: "📍",
};

const DIRECTION_LABELS: Record<string, string> = {
  left: "Girar a la izquierda",
  right: "Girar a la derecha",
  straight: "Continuar recto",
  arrive: "Has llegado",
};

export default function HapticIndicator({
  visible,
  direction,
  distance,
}: HapticIndicatorProps) {
  if (!visible || !direction) return null;

  const icon = DIRECTION_ICONS[direction] ?? "⬆️";
  const label = DIRECTION_LABELS[direction] ?? "";
  const distanceText = distance ? `${distance}m` : "";
  const a11yLabel = `${label}${distance ? `. A ${distance} metros` : ""}`;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={a11yLabel}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.direction}>{label}</Text>
        {distanceText ? (
          <Text style={styles.distance}>{distanceText}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a73e8",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  direction: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  distance: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 4,
  },
});
