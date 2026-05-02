// FR-1304: Risk alert overlay shown in AR view
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export type AROverlayKind = "stairs" | "ramp" | "obstacle" | "high_risk";

interface ARRiskOverlayProps {
  kind: AROverlayKind;
  message: string;
  /** Distance in meters to the hazard */
  distanceM: number;
}

const KIND_META: Record<
  AROverlayKind,
  { icon: string; color: string; label: string }
> = {
  stairs: { icon: "🪜", color: "#f59e0b", label: "Escaleras" },
  ramp: { icon: "♿", color: "#3b82f6", label: "Rampa" },
  obstacle: { icon: "⚠️", color: "#dc2626", label: "Obstaculo" },
  high_risk: { icon: "🚧", color: "#dc2626", label: "Riesgo alto" },
};

export default function ARRiskOverlay({
  kind,
  message,
  distanceM,
}: ARRiskOverlayProps) {
  const meta = KIND_META[kind];
  const distanceText = `${Math.round(distanceM)} m`;

  return (
    <View
      style={[styles.banner, { borderColor: meta.color }]}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      accessibilityLabel={`${meta.label}: ${message}, a ${distanceText}`}
    >
      <Text style={styles.icon} accessibilityElementsHidden>
        {meta.icon}
      </Text>
      <View style={styles.textBox}>
        <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <Text style={[styles.distance, { color: meta.color }]}>
        {distanceText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  textBox: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  message: {
    color: "#fff",
    fontSize: 14,
    marginTop: 2,
  },
  distance: {
    fontSize: 18,
    fontWeight: "700",
  },
});
