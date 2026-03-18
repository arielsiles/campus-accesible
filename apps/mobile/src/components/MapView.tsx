// FR-003: MapLibre GL map component
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  MapView as MLMapView,
  Camera,
  type MapViewRef,
} from "@maplibre/maplibre-react-native";
import { CU_CENTER, DEFAULT_ZOOM } from "../store/mapStore";

// FR-003: Free tile provider — OpenFreeMap (no API key required)
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
}

export default function MapView({
  center = CU_CENTER,
  zoom = DEFAULT_ZOOM,
  children,
}: MapViewProps) {
  const mapRef = useRef<MapViewRef>(null);

  return (
    <View
      style={styles.container}
      accessibilityRole="none"
      accessibilityLabel="Mapa del campus universitario"
    >
      <MLMapView
        ref={mapRef}
        style={styles.map}
        mapStyle={STYLE_URL}
        logoEnabled={false}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        <Camera
          centerCoordinate={center}
          zoomLevel={zoom}
          animationDuration={0}
        />
        {children}
      </MLMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
