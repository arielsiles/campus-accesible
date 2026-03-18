// FR-002: Mobile app entry point
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Pantalla principal de Campus GPS Accesible"
    >
      <StatusBar style="dark" />
      <Text
        style={styles.title}
        accessibilityRole="header"
        accessibilityLabel="Campus GPS Accesible"
      >
        Campus GPS Accesible
      </Text>
      <Text
        style={styles.subtitle}
        accessibilityLabel="Navegación inclusiva para Ciudad Universitaria"
      >
        Navegación inclusiva para Ciudad Universitaria
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
});
