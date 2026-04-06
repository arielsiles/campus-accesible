// FR-803: Waypoint suggestion notification during route recording
import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import type { WaypointSuggestion as Suggestion } from "../services/waypointSuggestionService";

interface WaypointSuggestionProps {
  suggestion: Suggestion;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (osmId: number) => void;
}

export default function WaypointSuggestion({
  suggestion,
  onAccept,
  onDismiss,
}: WaypointSuggestionProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Punto detectado: ${suggestion.name}, a ${suggestion.distanceM} metros. Pulsa para agregar.`}
    >
      <View style={styles.content}>
        <Text style={styles.icon} accessibilityElementsHidden>📍</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{suggestion.name}</Text>
          <Text style={styles.subtitle}>
            {suggestion.waypointType} · {suggestion.distanceM}m
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => onAccept(suggestion)}
          accessibilityLabel={`Agregar ${suggestion.name} como punto`}
          accessibilityRole="button"
        >
          <Text style={styles.acceptText}>Agregar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => onDismiss(suggestion.osmId)}
          accessibilityLabel="Descartar sugerencia"
          accessibilityRole="button"
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e8f0fe",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#1a73e8",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  dismissButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#d0d0d0",
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    fontSize: 16,
    color: "#666",
  },
});
