// FR-702: Editable segment line for route editor
import React, { useMemo } from "react";
import { ShapeSource, LineLayer } from "@maplibre/maplibre-react-native";
import type { DraftSegment } from "../store/routeCreatorStore";

interface EditableSegmentProps {
  segments: DraftSegment[];
}

export default function EditableSegment({ segments }: EditableSegmentProps) {
  const geojson = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: segments.map((seg) => ({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: seg.coordinates,
      },
      properties: {
        segmentId: seg.id,
        name: seg.name,
      },
    })),
  }), [segments]);

  if (segments.length === 0) return null;

  return (
    <ShapeSource id="editor-segments" shape={geojson}>
      <LineLayer
        id="editor-segment-line"
        style={{
          lineColor: "#1a73e8",
          lineWidth: 4,
          lineDasharray: [2, 2],
          lineOpacity: 0.7,
        }}
      />
    </ShapeSource>
  );
}
