// FR-208: Navigation progress bar component
import React from "react";
import { StyleSheet, View, Text } from "react-native";

interface ProgressBarProps {
  progress: number; // 0-100
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Progreso de navegación: ${Math.round(clamped)} por ciento`}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(clamped),
      }}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
      <Text style={styles.label}>{Math.round(clamped)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    minWidth: 36,
    textAlign: "right",
  },
});
