// FR-1406: Render approach legs as dashed polylines on the map
import React from "react";
import { ShapeSource, LineLayer } from "@maplibre/maplibre-react-native";
import type { ApproachLeg } from "@campus-gps/shared-types";

interface ApproachLegPolylineProps {
  legs: ApproachLeg[];
}

export default function ApproachLegPolyline({ legs }: ApproachLegPolylineProps) {
  if (legs.length === 0) return null;

  const features = legs.map((leg, i) => ({
    type: "Feature" as const,
    properties: { position: leg.position, index: i },
    geometry: {
      type: "LineString" as const,
      coordinates: [leg.fromCoords, leg.toCoords],
    },
  }));

  const collection = {
    type: "FeatureCollection" as const,
    features,
  };

  return (
    <ShapeSource id="approach-legs" shape={collection as unknown as object}>
      <LineLayer
        id="approach-legs-line"
        style={{
          lineColor: "#7c3aed",
          lineWidth: 4,
          lineDasharray: [2, 2],
          lineCap: "round",
          lineJoin: "round",
          lineOpacity: 0.85,
        }}
      />
    </ShapeSource>
  );
}
