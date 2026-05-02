// FR-1105: Banner that lets the user report an AI-detected obstacle as an incident
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { apiPost } from "../services/apiClient";
import { mapResultToIncidentType } from "../services/continuousScanService";
import type { VisionDescribeResponse } from "../services/visionService";

interface QuickReportBannerProps {
  result: VisionDescribeResponse;
  latitude?: number;
  longitude?: number;
  /** Called when the user reports or dismisses the banner */
  onDone: () => void;
}

interface CreateIncidentResponse {
  incident: { id: string };
}

export default function QuickReportBanner({
  result,
  latitude,
  longitude,
  onDone,
}: QuickReportBannerProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReport = async () => {
    if (latitude == null || longitude == null) {
      setError("Sin GPS para georreferenciar");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const type = mapResultToIncidentType(result);
      const title = result.obstacles[0] ?? "Obstaculo detectado por IA";
      const description = result.description.slice(0, 500);

      await apiPost<CreateIncidentResponse>("/incidents", {
        deviceId: "ai-vision-quickreport",
        type,
        title: title.slice(0, 100),
        description,
        latitude,
        longitude,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reportar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={styles.banner}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          ⚠️ Obstaculo detectado por IA
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {result.obstacles[0] ?? result.description}
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={handleReport}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Reportar como incidencia para que otros usuarios lo eviten"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.reportBtnText}>Reportar</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ignoreBtn}
            onPress={onDone}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Ignorar este obstaculo"
          >
            <Text style={styles.ignoreBtnText}>Ignorar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f59e0b",
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  content: {
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#78350f",
  },
  description: {
    fontSize: 14,
    color: "#1a1a2e",
    lineHeight: 18,
  },
  error: {
    fontSize: 13,
    color: "#dc2626",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  reportBtn: {
    flex: 1,
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  reportBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  ignoreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  ignoreBtnText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "600",
  },
});
