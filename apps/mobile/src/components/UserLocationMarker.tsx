// FR-004: User location marker on map using MapLibre UserLocation
import React from "react";
import { UserLocation } from "@maplibre/maplibre-react-native";

export default function UserLocationMarker() {
  return (
    <UserLocation
      visible
      animated
      showsUserHeadingIndicator
      androidRenderMode="compass"
      renderMode="native"
    />
  );
}
