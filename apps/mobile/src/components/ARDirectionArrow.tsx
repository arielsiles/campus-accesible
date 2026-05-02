// FR-1303: Large directional arrow overlay for AR navigation
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export type ArrowKind = "straight" | "left" | "right" | "u-turn" | "arrived";

interface ARDirectionArrowProps {
  kind: ArrowKind;
  /** Distance to the next instruction in meters */
  distanceM: number;
  /** Spanish instruction text */
  instructionText: string;
}

const ARROW_SYMBOL: Record<ArrowKind, string> = {
  straight: "⬆",
  left: "⬅",
  right: "➡",
  "u-turn": "⤺",
  arrived: "✓",
};

export default function ARDirectionArrow({
  kind,
  distanceM,
  instructionText,
}: ARDirectionArrowProps) {
  const distanceText =
    distanceM < 1 ? "Aqui mismo" : `${Math.round(distanceM)} m`;

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      accessibilityLabel={`${instructionText}, ${distanceText}`}
    >
      <Text style={styles.arrow} accessibilityElementsHidden>
        {ARROW_SYMBOL[kind]}
      </Text>
      <Text style={styles.instruction}>{instructionText}</Text>
      <Text style={styles.distance}>{distanceText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 16,
    padding: 16,
    minWidth: 220,
    alignItems: "center",
  },
  arrow: {
    fontSize: 100, // NFR-1302: >= 100dp for direction indicators
    color: "#10b981",
    lineHeight: 110,
  },
  instruction: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  distance: {
    color: "#a7f3d0",
    fontSize: 22,
    fontWeight: "600",
    marginTop: 4,
  },
});
