// FR-208: GPS signal lost alert component
import React from "react";
import { StyleSheet, View, Text } from "react-native";

interface GpsLostAlertProps {
  visible: boolean;
}

export default function GpsLostAlert({ visible }: GpsLostAlertProps) {
  if (!visible) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel="Señal GPS perdida. Esperando señal."
      accessibilityLiveRegion="assertive"
    >
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>Señal GPS perdida</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ea4335",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
});
