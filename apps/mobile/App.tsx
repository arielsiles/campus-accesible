// FR-002: Mobile app entry point
// FR-003: Renders MapScreen as main view
import React from "react";
import { StatusBar } from "expo-status-bar";
import MapScreen from "./src/screens/MapScreen";

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <MapScreen />
    </>
  );
}
