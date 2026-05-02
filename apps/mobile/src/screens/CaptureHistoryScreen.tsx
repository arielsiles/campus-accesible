// FR-1104: History of past camera captures with descriptions
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import * as Speech from "expo-speech";
import { useCaptureStore, type CaptureItem } from "../store/captureStore";

interface CaptureHistoryScreenProps {
  onBack: () => void;
}

const RISK_COLORS: Record<string, string> = {
  none: "#22c55e",
  low: "#eab308",
  medium: "#f97316",
  high: "#dc2626",
};

const RISK_LABELS: Record<string, string> = {
  none: "Sin riesgo",
  low: "Riesgo bajo",
  medium: "Riesgo medio",
  high: "Riesgo alto",
};

export default function CaptureHistoryScreen({
  onBack,
}: CaptureHistoryScreenProps) {
  const { history, load, remove, clearAll } = useCaptureStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const selected = history.find((c) => c.id === selectedId) ?? null;

  const handleSpeak = (item: CaptureItem) => {
    Speech.stop();
    Speech.speak(item.description, {
      language: "es-ES",
      rate: 1.0,
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar captura",
      "Esta accion no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (selectedId === id) setSelectedId(null);
            await remove(id);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    Alert.alert(
      "Borrar todo el historial",
      `Vas a eliminar las ${history.length} capturas guardadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
          style: "destructive",
          onPress: async () => {
            setSelectedId(null);
            await clearAll();
          },
        },
      ]
    );
  };

  // Detail view
  if (selected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Speech.stop();
              setSelectedId(null);
            }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Volver al historial"
          >
            <Text style={styles.backText}>← Historial</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.detailContent}>
          <Image
            source={{ uri: selected.imageUri }}
            style={styles.detailImage}
            accessibilityLabel="Imagen capturada"
          />

          <View
            style={[
              styles.riskBadge,
              {
                backgroundColor: RISK_COLORS[selected.riskLevel] + "22",
                borderColor: RISK_COLORS[selected.riskLevel],
              },
            ]}
          >
            <Text
              style={[styles.riskText, { color: RISK_COLORS[selected.riskLevel] }]}
            >
              {RISK_LABELS[selected.riskLevel]}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Descripcion</Text>
            <Text style={styles.descriptionText}>{selected.description}</Text>
            <TouchableOpacity
              style={styles.speakBtn}
              onPress={() => handleSpeak(selected)}
              accessibilityRole="button"
              accessibilityLabel="Leer descripcion en voz alta"
            >
              <Text style={styles.speakBtnText}>🔊 Leer</Text>
            </TouchableOpacity>
          </View>

          {selected.obstacles.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Obstaculos</Text>
              {selected.obstacles.map((o, i) => (
                <Text key={i} style={styles.listItem}>• {o}</Text>
              ))}
            </View>
          )}

          {selected.suggestions.length > 0 && (
            <View style={[styles.card, styles.suggestionsCard]}>
              <Text style={styles.cardTitle}>Sugerencias</Text>
              {selected.suggestions.map((s, i) => (
                <Text key={i} style={styles.listItem}>✓ {s}</Text>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Detalles</Text>
            <Text style={styles.metaText}>Fecha: {formatDate(selected.timestamp)}</Text>
            <Text style={styles.metaText}>Perfil: {profileLabel(selected.profile)}</Text>
            {selected.latitude != null && selected.longitude != null && (
              <Text style={styles.metaText}>
                GPS: {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
              </Text>
            )}
            <Text style={styles.metaText}>
              Confianza: {Math.round(selected.confidence * 100)}%
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(selected.id)}
            accessibilityRole="button"
            accessibilityLabel="Eliminar esta captura"
          >
            <Text style={styles.deleteBtnText}>Eliminar captura</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // List view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Historial
        </Text>
        {history.length > 0 && (
          <TouchableOpacity
            onPress={handleClearAll}
            style={styles.headerAction}
            accessibilityRole="button"
            accessibilityLabel="Borrar todas las capturas"
          >
            <Text style={styles.headerActionText}>Borrar todo</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No hay capturas</Text>
          <Text style={styles.emptyBody}>
            Toma fotos con la camara y se guardaran aqui automaticamente.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {history.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.row}
              onPress={() => setSelectedId(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Captura del ${formatDate(item.timestamp)}: ${item.description.slice(0, 80)}`}
            >
              <Image
                source={{ uri: item.imageUri }}
                style={styles.thumbnail}
                accessibilityLabel="Miniatura de imagen"
              />
              <View style={styles.rowText}>
                <Text style={styles.rowDate}>{formatDate(item.timestamp)}</Text>
                <Text style={styles.rowDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.rowMeta}>
                  <View
                    style={[
                      styles.miniBadge,
                      {
                        backgroundColor: RISK_COLORS[item.riskLevel] + "22",
                        borderColor: RISK_COLORS[item.riskLevel],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniBadgeText,
                        { color: RISK_COLORS[item.riskLevel] },
                      ]}
                    >
                      {RISK_LABELS[item.riskLevel]}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function formatDate(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function profileLabel(p: string): string {
  const labels: Record<string, string> = {
    standard: "Estandar",
    visual_disability: "Discapacidad visual",
    reduced_mobility: "Movilidad reducida",
    deaf: "Persona sorda",
    easy_read: "Lectura facil",
  };
  return labels[p] ?? p;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1a1a2e",
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "center",
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginLeft: 8,
  },
  headerAction: {
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  headerActionText: {
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  list: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    minHeight: 88,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    justifyContent: "space-between",
  },
  rowDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  rowDesc: {
    fontSize: 14,
    color: "#1a1a2e",
    lineHeight: 18,
    flex: 1,
  },
  rowMeta: {
    flexDirection: "row",
    marginTop: 4,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  detailContent: {
    padding: 16,
  },
  detailImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#000",
    marginBottom: 16,
  },
  riskBadge: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  riskText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  suggestionsCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: "#1a1a2e",
    lineHeight: 24,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    color: "#1a1a2e",
    lineHeight: 22,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  speakBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    alignSelf: "flex-start",
    minHeight: 36,
    justifyContent: "center",
  },
  speakBtnText: {
    fontSize: 14,
    color: "#0369a1",
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dc2626",
    marginTop: 8,
  },
  deleteBtnText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
  },
});
