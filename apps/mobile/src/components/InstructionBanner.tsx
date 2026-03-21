// FR-204: Turn-by-turn instruction banner component
import React from "react";
import { StyleSheet, View, Text } from "react-native";
import type { NavigationInstruction } from "@campus-gps/shared-types";

// NFR-202: Action icons for visual+screen reader context
const ACTION_ICONS: Record<string, string> = {
  start: "🚶",
  continue: "⬆️",
  turn_left: "⬅️",
  turn_right: "➡️",
  slight_left: "↖️",
  slight_right: "↗️",
  arrive: "📍",
};

interface InstructionBannerProps {
  instruction: NavigationInstruction;
}

export default function InstructionBanner({
  instruction,
}: InstructionBannerProps) {
  const icon = ACTION_ICONS[instruction.action] ?? "📍";

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={instruction.description}
      accessibilityLiveRegion="assertive"
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.description}>{instruction.description}</Text>
        {instruction.action !== "arrive" && instruction.distance > 0 && (
          <Text style={styles.distance}>
            {instruction.distance < 1000
              ? `${instruction.distance} m`
              : `${(instruction.distance / 1000).toFixed(1)} km`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 22,
  },
  distance: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
});
