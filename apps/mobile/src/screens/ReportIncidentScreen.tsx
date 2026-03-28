// FR-502: Incident reporting screen with accessible form
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { IncidentType } from "@campus-gps/shared-types";
import IncidentTypeSelector from "../components/IncidentTypeSelector";
import { useReportIncident } from "../hooks/useReportIncident";

interface ReportIncidentScreenProps {
  latitude: number;
  longitude: number;
  segmentId?: string;
  onClose: () => void;
}

export default function ReportIncidentScreen({
  latitude,
  longitude,
  segmentId,
  onClose,
}: ReportIncidentScreenProps) {
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { report, loading, error, success } = useReportIncident();

  const canSubmit =
    selectedType !== null &&
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedType) return;

    await report({
      type: selectedType,
      title: title.trim(),
      description: description.trim(),
      latitude,
      longitude,
      segmentId,
    });
  };

  if (success) {
    return (
      <View
        style={styles.container}
        accessibilityRole="alert"
        accessibilityLabel="Incidencia reportada con éxito"
      >
        <View style={styles.successContainer}>
          <Text style={styles.successIcon} accessibilityElementsHidden>
            ✅
          </Text>
          <Text style={styles.successTitle}>¡Reporte enviado!</Text>
          <Text style={styles.successMessage}>
            Tu incidencia será revisada. Gracias por colaborar.
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Cerrar y volver al mapa"
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>Volver al mapa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      accessibilityRole="summary"
      accessibilityLabel="Formulario para reportar incidencia"
    >
      <View style={styles.header}>
        <Text
          style={styles.headerTitle}
          accessibilityRole="header"
        >
          Reportar incidencia
        </Text>
        <TouchableOpacity
          style={styles.headerClose}
          onPress={onClose}
          accessibilityLabel="Cerrar formulario"
          accessibilityRole="button"
        >
          <Text style={styles.headerCloseText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Incident type selector */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Tipo de incidencia</Text>
        <IncidentTypeSelector
          selectedType={selectedType}
          onSelect={setSelectedType}
        />
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Título</Text>
        <TextInput
          style={styles.textInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Describe brevemente la incidencia"
          placeholderTextColor="#999999"
          maxLength={100}
          accessibilityLabel="Título de la incidencia"
          accessibilityHint="Escribe un título breve, mínimo 3 caracteres"
        />
        <Text style={styles.charCount}>{title.length}/100</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Descripción</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Explica con más detalle qué ocurre y dónde"
          placeholderTextColor="#999999"
          maxLength={500}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          accessibilityLabel="Descripción de la incidencia"
          accessibilityHint="Escribe una descripción detallada, mínimo 10 caracteres"
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>

      {/* Location info */}
      <View style={styles.locationInfo}>
        <Text style={styles.locationIcon} accessibilityElementsHidden>
          📍
        </Text>
        <Text
          style={styles.locationText}
          accessibilityLabel={`Ubicación: latitud ${latitude.toFixed(4)}, longitud ${longitude.toFixed(4)}`}
        >
          Ubicación GPS actual
        </Text>
      </View>

      {/* Error */}
      {error && (
        <View
          style={styles.errorContainer}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityLabel="Enviar reporte de incidencia"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
        accessibilityHint={
          !canSubmit
            ? "Completa todos los campos para enviar"
            : "Envía el reporte de incidencia"
        }
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>Enviar reporte</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  headerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCloseText: {
    fontSize: 18,
    color: "#666666",
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333333",
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: "#999999",
    textAlign: "right",
    marginTop: 4,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 8,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 14,
    color: "#1a73e8",
  },
  errorContainer: {
    backgroundColor: "#fce8e6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#ea4335",
  },
  submitButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#b0c4de",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#34a853",
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minHeight: 48,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
