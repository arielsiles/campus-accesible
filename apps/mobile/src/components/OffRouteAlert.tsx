// FR-208: Off-route warning alert component
import React from "react";
import { StyleSheet, View, Text } from "react-native";

interface OffRouteAlertProps {
  visible: boolean;
}

export default function OffRouteAlert({ visible }: OffRouteAlertProps) {
  if (!visible) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel="Fuera de ruta. Vuelve al camino marcado."
      accessibilityLiveRegion="assertive"
    >
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>Fuera de ruta</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9ab00",
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
    color: "#333333",
  },
});
