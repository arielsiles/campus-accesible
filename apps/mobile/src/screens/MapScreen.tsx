// FR-003: Main map screen — single screen in Fase 1
import React from "react";
import { StyleSheet, View } from "react-native";
import MapView from "../components/MapView";
import { useMapStore } from "../store/mapStore";

export default function MapScreen() {
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Pantalla del mapa de navegación del campus"
    >
      <MapView center={center} zoom={zoom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
