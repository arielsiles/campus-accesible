// FR-1407: Visual badge indicating route source quality
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { RouteSource } from "@campus-gps/shared-types";

interface RouteSourceBadgeProps {
  source: RouteSource | undefined;
}

const META: Record<RouteSource, { label: string; color: string; bg: string }> = {
  graph: {
    label: "✓ Verificado",
    color: "#15803d",
    bg: "#dcfce7",
  },
  osm: {
    label: "≈ Estimado OSM",
    color: "#a16207",
    bg: "#fef3c7",
  },
  hybrid: {
    label: "◑ Mixto",
    color: "#1d4ed8",
    bg: "#dbeafe",
  },
};

export default function RouteSourceBadge({ source }: RouteSourceBadgeProps) {
  if (!source) return null;
  const meta = META[source];
  return (
    <View
      style={[styles.badge, { backgroundColor: meta.bg }]}
      accessibilityLabel={`Fuente de la ruta: ${meta.label}`}
    >
      <Text style={[styles.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
