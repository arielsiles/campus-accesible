// FR-703: Segment annotator screen — annotate accessibility data per segment
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useRouteCreatorStore } from "../store/routeCreatorStore";

const SURFACE_OPTIONS = [
  { value: "paved", label: "Pavimentado" },
  { value: "cobblestone", label: "Adoquinado" },
  { value: "gravel", label: "Grava" },
  { value: "dirt", label: "Tierra" },
  { value: "tactile", label: "Podotactil" },
];

const RISK_OPTIONS = [
  { value: "none", label: "Ninguno" },
  { value: "low", label: "Bajo" },
  { value: "medium", label: "Medio" },
  { value: "high", label: "Alto" },
];

const QUALITY_OPTIONS = [
  { value: "good", label: "Bueno" },
  { value: "fair", label: "Aceptable" },
  { value: "poor", label: "Malo" },
];

interface SegmentAnnotatorScreenProps {
  onFinish: () => void;
  onBack: () => void;
}

export default function SegmentAnnotatorScreen({
  onFinish,
  onBack,
}: SegmentAnnotatorScreenProps) {
  const segments = useRouteCreatorStore((s) => s.segments);
  const updateSegment = useRouteCreatorStore((s) => s.updateSegment);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityRole="summary"
      accessibilityLabel="Anotacion de segmentos de ruta"
    >
      <Text style={styles.title} accessibilityRole="header">
        Anotar segmentos
      </Text>
      <Text style={styles.subtitle}>
        Describe las condiciones de cada tramo de la ruta
      </Text>

      {segments.map((seg, idx) => (
        <View key={seg.id} style={styles.segmentCard}>
          <Text style={styles.segmentTitle}>
            {idx + 1}. {seg.name}
          </Text>

          {/* Surface type */}
          <Text style={styles.fieldLabel}>Tipo de superficie</Text>
          <View style={styles.chipRow} accessibilityRole="radiogroup">
            {SURFACE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, seg.surfaceType === opt.value && styles.chipSelected]}
                onPress={() => updateSegment(idx, { surfaceType: opt.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected: seg.surfaceType === opt.value }}
                accessibilityLabel={opt.label}
              >
                <Text style={[styles.chipText, seg.surfaceType === opt.value && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Risk level */}
          <Text style={styles.fieldLabel}>Nivel de riesgo</Text>
          <View style={styles.chipRow} accessibilityRole="radiogroup">
            {RISK_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, seg.riskLevel === opt.value && styles.chipSelected]}
                onPress={() => updateSegment(idx, { riskLevel: opt.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected: seg.riskLevel === opt.value }}
                accessibilityLabel={`Riesgo ${opt.label}`}
              >
                <Text style={[styles.chipText, seg.riskLevel === opt.value && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Surface quality */}
          <Text style={styles.fieldLabel}>Estado del suelo</Text>
          <View style={styles.chipRow} accessibilityRole="radiogroup">
            {QUALITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, seg.surfaceQuality === opt.value && styles.chipSelected]}
                onPress={() => updateSegment(idx, { surfaceQuality: opt.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected: seg.surfaceQuality === opt.value }}
                accessibilityLabel={`Estado ${opt.label}`}
              >
                <Text style={[styles.chipText, seg.surfaceQuality === opt.value && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Toggles */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Tiene escaleras</Text>
            <Switch
              value={seg.hasStairs}
              onValueChange={(v) => updateSegment(idx, { hasStairs: v })}
              accessibilityLabel="Tiene escaleras"
              accessibilityRole="switch"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Tiene rampa</Text>
            <Switch
              value={seg.hasRamp}
              onValueChange={(v) => updateSegment(idx, { hasRamp: v })}
              accessibilityLabel="Tiene rampa"
              accessibilityRole="switch"
            />
          </View>

          {/* Width stepper */}
          <View style={styles.stepperRow}>
            <Text style={styles.fieldLabel}>Ancho del camino: {seg.pathWidth.toFixed(1)}m</Text>
            <View style={styles.stepperButtons}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateSegment(idx, { pathWidth: Math.max(0.5, seg.pathWidth - 0.5) })}
                accessibilityLabel="Reducir ancho"
                accessibilityRole="button"
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateSegment(idx, { pathWidth: Math.min(5.0, seg.pathWidth + 0.5) })}
                accessibilityLabel="Aumentar ancho"
                accessibilityRole="button"
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Slope stepper */}
          <View style={styles.stepperRow}>
            <Text style={styles.fieldLabel}>Pendiente maxima: {seg.maxSlope}%</Text>
            <View style={styles.stepperButtons}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateSegment(idx, { maxSlope: Math.max(0, seg.maxSlope - 1) })}
                accessibilityLabel="Reducir pendiente"
                accessibilityRole="button"
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateSegment(idx, { maxSlope: Math.min(30, seg.maxSlope + 1) })}
                accessibilityLabel="Aumentar pendiente"
                accessibilityRole="button"
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {/* Navigation */}
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel="Volver a la grabacion"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onFinish}
          accessibilityLabel="Continuar a vista previa"
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>Vista previa →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  segmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  segmentTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: "500", color: "#333", marginBottom: 8, marginTop: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    minHeight: 44,
    justifyContent: "center",
  },
  chipSelected: { borderColor: "#1a73e8", backgroundColor: "#e8f0fe" },
  chipText: { fontSize: 13, color: "#666" },
  chipTextSelected: { color: "#1a73e8", fontWeight: "600" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, color: "#333" },
  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  stepperButtons: { flexDirection: "row", gap: 8 },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: { fontSize: 20, fontWeight: "700", color: "#333" },
  navButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  backButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    minHeight: 48,
    justifyContent: "center",
  },
  backButtonText: { fontSize: 16, color: "#333" },
  nextButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1a73e8",
    minHeight: 48,
    justifyContent: "center",
  },
  nextButtonText: { fontSize: 16, color: "#fff", fontWeight: "600" },
});
