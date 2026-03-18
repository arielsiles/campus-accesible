// FR-005: Route polyline rendered on MapLibre map
import React, { useMemo } from "react";
import { ShapeSource, LineLayer } from "@maplibre/maplibre-react-native";
import type { RouteFeatureCollection } from "@campus-gps/shared-types";

interface RoutePolylineProps {
  routeData: RouteFeatureCollection;
}

export default function RoutePolyline({ routeData }: RoutePolylineProps) {
  // FR-005: Filter only route-segment features (LineString)
  const segmentGeoJSON = useMemo(() => {
    const segmentFeatures = routeData.features.filter(
      (f) => f.properties.featureType === "route-segment"
    );
    return {
      type: "FeatureCollection" as const,
      features: segmentFeatures,
    };
  }, [routeData]);

  return (
    <ShapeSource id="route-segments" shape={segmentGeoJSON}>
      <LineLayer
        id="route-line"
        style={{
          lineColor: "#1a73e8",
          lineWidth: 4,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
    </ShapeSource>
  );
}
