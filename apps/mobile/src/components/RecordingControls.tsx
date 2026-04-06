// FR-701: Recording controls for route creation
import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  trackPointCount: number;
  waypointCount: number;
  elapsedSeconds: number;
  onMarkWaypoint: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function RecordingControls({
  isRecording,
  isPaused,
  trackPointCount,
  waypointCount,
  elapsedSeconds,
  onMarkWaypoint,
  onPause,
  onResume,
  onStop,
}: RecordingControlsProps) {
  return (
    <View style={styles.container}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Text style={[styles.statusDot, isPaused ? styles.dotPaused : styles.dotRecording]}>
            {isPaused ? "⏸" : "🔴"}
          </Text>
          <Text style={styles.statusText}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Puntos GPS</Text>
          <Text style={styles.statusValue}>{trackPointCount}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Marcadores</Text>
          <Text style={styles.statusValue}>{waypointCount}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.markButton}
          onPress={onMarkWaypoint}
          accessibilityLabel="Marcar punto de interes"
          accessibilityRole="button"
          accessibilityHint="Anade un punto en tu ubicacion actual"
        >
          <Text style={styles.markButtonIcon} accessibilityElementsHidden>📍</Text>
          <Text style={styles.markButtonText}>Marcar punto</Text>
        </TouchableOpacity>

        {isPaused ? (
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={onResume}
            accessibilityLabel="Reanudar grabacion"
            accessibilityRole="button"
          >
            <Text style={styles.pauseButtonText}>▶ Reanudar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={onPause}
            accessibilityLabel="Pausar grabacion"
            accessibilityRole="button"
          >
            <Text style={styles.pauseButtonText}>⏸ Pausar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.stopButton}
          onPress={onStop}
          accessibilityLabel="Finalizar grabacion"
          accessibilityRole="button"
          accessibilityHint="Termina la grabacion y pasa a anotar los segmentos"
        >
          <Text style={styles.stopButtonText}>⏹ Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statusItem: {
    alignItems: "center",
  },
  statusDot: {
    fontSize: 16,
  },
  dotRecording: {
    color: "#ea4335",
  },
  dotPaused: {
    color: "#f9ab00",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginTop: 2,
  },
  statusLabel: {
    fontSize: 12,
    color: "#999999",
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  markButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
    gap: 8,
  },
  markButtonIcon: {
    fontSize: 18,
  },
  markButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  pauseButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  pauseButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  stopButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ea4335",
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});
