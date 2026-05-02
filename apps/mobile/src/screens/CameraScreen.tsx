// FR-1101, FR-1102, FR-1103: Camera screen with capture, AI description and TTS
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { CameraView, CameraType } from "expo-camera";
import * as Speech from "expo-speech";
import { useCamera } from "../hooks/useCamera";
import { imageToBase64, compressImage } from "../services/cameraService";
import { describeImage, type VisionDescribeResponse } from "../services/visionService";
import { useAccessibilityStore } from "../store/accessibilityStore";
import { useLocationStore } from "../store/locationStore";
import { useCaptureStore } from "../store/captureStore";

interface CameraScreenProps {
  onClose: () => void;
  onOpenHistory?: () => void;
}

const RISK_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: "Sin riesgos detectados", color: "#22c55e" },
  low: { label: "Riesgo bajo", color: "#eab308" },
  medium: { label: "Riesgo medio", color: "#f97316" },
  high: { label: "Riesgo alto", color: "#dc2626" },
};

const SURFACE_LABELS: Record<string, string> = {
  paved: "Pavimentada",
  cobblestone: "Adoquinada",
  gravel: "Grava",
  dirt: "Tierra",
  tactile: "Pavimento tactil",
  unknown: "Sin determinar",
};

export default function CameraScreen({ onClose, onOpenHistory }: CameraScreenProps) {
  const { permission, requestPermission } = useCamera();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing] = useState<CameraType>("back");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionDescribeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const profile = useAccessibilityStore((s) => s.profile);
  const coords = useLocationStore((s) => s.coords);
  const addCapture = useCaptureStore((s) => s.add);

  // FR-1102: Stop TTS when screen unmounts
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Permission not yet determined
  if (permission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.statusText}>Comprobando permisos de camara...</Text>
      </View>
    );
  }

  // Permission denied
  if (permission !== "granted") {
    return (
      <View style={styles.center}>
        <Text style={styles.title} accessibilityRole="header">
          Permiso de camara requerido
        </Text>
        <Text style={styles.body}>
          Necesitamos acceso a tu camara para describir el entorno con IA.
          Las imagenes se analizan y se descartan, no se almacenan en servidor.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={async () => {
            await requestPermission();
          }}
          accessibilityRole="button"
          accessibilityLabel="Conceder permiso de camara"
        >
          <Text style={styles.primaryBtnText}>Permitir camara</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Volver al mapa"
        >
          <Text style={styles.secondaryBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        // Auto-trigger analysis
        await analyzeImage(photo.uri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al capturar");
    } finally {
      setIsCapturing(false);
    }
  };

  const analyzeImage = async (uri: string) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setSavedToHistory(false);
    try {
      // NFR-1101: Resize + compress to keep payload under server limit
      const compressedUri = await compressImage(uri, 1024, 0.6);
      const base64 = await imageToBase64(compressedUri);
      const response = await describeImage({
        image: base64,
        mediaType: "image/jpeg",
        profile,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      setResult(response);
      // FR-1102: Speak the description with TTS
      Speech.speak(response.description, {
        language: "es-ES",
        rate: 1.0,
        pitch: 1.0,
      });
      // FR-1104: Auto-save to history
      try {
        await addCapture({
          sourceUri: compressedUri,
          description: response.description,
          obstacles: response.obstacles,
          surface: response.surface,
          riskLevel: response.riskLevel,
          suggestions: response.suggestions,
          confidence: response.confidence,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          profile,
        });
        setSavedToHistory(true);
      } catch {
        // History save errors should not block the user from seeing results
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error en analisis";
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSpeakAgain = () => {
    if (!result) return;
    Speech.stop();
    Speech.speak(result.description, {
      language: "es-ES",
      rate: 1.0,
      pitch: 1.0,
    });
  };

  const handleRetake = () => {
    Speech.stop();
    setCapturedUri(null);
    setResult(null);
    setError(null);
  };

  // Captured photo + result view
  if (capturedUri) {
    const risk = result ? RISK_LABELS[result.riskLevel] : null;
    return (
      <View style={styles.container}>
        <View style={styles.resultHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Cerrar camara y volver al mapa"
          >
            <Text style={styles.closeTextLight}>← Volver</Text>
          </TouchableOpacity>
          {onOpenHistory && (
            <TouchableOpacity
              onPress={onOpenHistory}
              style={styles.historyBtn}
              accessibilityRole="button"
              accessibilityLabel="Ver historial de capturas"
            >
              <Text style={styles.historyBtnText}>📋 Historial</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Image
            source={{ uri: capturedUri }}
            style={styles.thumbnail}
            accessibilityLabel="Vista previa de la imagen capturada"
          />

          {analyzing && (
            <View
              style={styles.analyzingBox}
              accessibilityLiveRegion="polite"
              accessibilityLabel="Analizando imagen con IA"
            >
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.body}>Analizando con IA...</Text>
            </View>
          )}

          {error && (
            <View
              style={styles.errorBox}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {result && (
            <>
              {/* Description card */}
              <View
                style={styles.descriptionBox}
                accessibilityLiveRegion="polite"
                accessibilityRole="summary"
              >
                <Text style={styles.cardTitle} accessibilityRole="header">
                  Descripcion
                </Text>
                <Text style={styles.descriptionText}>{result.description}</Text>
                <TouchableOpacity
                  style={styles.speakBtn}
                  onPress={handleSpeakAgain}
                  accessibilityLabel="Leer descripcion en voz alta otra vez"
                  accessibilityRole="button"
                >
                  <Text style={styles.speakBtnText}>🔊 Leer de nuevo</Text>
                </TouchableOpacity>
              </View>

              {/* Risk level badge */}
              {risk && (
                <View
                  style={[styles.riskBadge, { backgroundColor: risk.color + "22", borderColor: risk.color }]}
                  accessibilityLabel={`Nivel de riesgo: ${risk.label}`}
                >
                  <Text style={[styles.riskText, { color: risk.color }]}>
                    {risk.label}
                  </Text>
                </View>
              )}

              {/* Surface info */}
              {result.surface && result.surface !== "unknown" && (
                <View style={styles.infoCard}>
                  <Text style={styles.cardTitle}>Superficie</Text>
                  <Text style={styles.infoText}>
                    {SURFACE_LABELS[result.surface] ?? result.surface}
                  </Text>
                </View>
              )}

              {/* Obstacles */}
              {result.obstacles.length > 0 && (
                <View style={styles.infoCard}>
                  <Text style={styles.cardTitle} accessibilityRole="header">
                    Obstaculos detectados
                  </Text>
                  {result.obstacles.map((o, i) => (
                    <Text key={i} style={styles.listItem}>
                      • {o}
                    </Text>
                  ))}
                </View>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <View style={[styles.infoCard, styles.suggestionsCard]}>
                  <Text style={styles.cardTitle} accessibilityRole="header">
                    Sugerencias
                  </Text>
                  {result.suggestions.map((s, i) => (
                    <Text key={i} style={styles.listItem}>
                      ✓ {s}
                    </Text>
                  ))}
                </View>
              )}

              {/* Confidence */}
              <Text
                style={styles.confidence}
                accessibilityLabel={`Nivel de confianza: ${Math.round(result.confidence * 100)} por ciento`}
              >
                Confianza: {Math.round(result.confidence * 100)}%
              </Text>

              {savedToHistory && (
                <Text
                  style={styles.savedHint}
                  accessibilityLabel="Guardado en el historial"
                >
                  ✓ Guardado en historial
                </Text>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleRetake}
            accessibilityRole="button"
            accessibilityLabel="Tomar otra foto"
          >
            <Text style={styles.primaryBtnText}>Otra foto</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.cameraOverlay}>
          <View style={styles.headerBar}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar camara"
            >
              <Text style={styles.closeTextLight}>← Cerrar</Text>
            </TouchableOpacity>
            {onOpenHistory && (
              <TouchableOpacity
                onPress={onOpenHistory}
                style={styles.historyBtn}
                accessibilityRole="button"
                accessibilityLabel="Ver historial de capturas"
              >
                <Text style={styles.historyBtnText}>📋 Historial</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomBar}>
            <Text style={styles.profileHint}>
              Perfil: {profileLabel(profile)}
            </Text>
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={handleCapture}
              disabled={isCapturing}
              accessibilityRole="button"
              accessibilityLabel="Tomar foto y describir entorno"
              accessibilityHint="Captura el entorno y obtiene descripcion con IA"
            >
              {isCapturing ? (
                <ActivityIndicator color="#1a1a2e" />
              ) : (
                <View style={styles.captureBtnInner} />
              )}
            </TouchableOpacity>
            <Text style={styles.captureLabel}>¿Que veo?</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
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
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f5f5f5",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerBar: {
    paddingTop: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingBottom: 8,
  },
  resultHeader: {
    paddingTop: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a2e",
    paddingBottom: 12,
  },
  historyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  historyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  historyBtnLight: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  historyBtnLightText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  savedHint: {
    fontSize: 13,
    color: "#16a34a",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
    fontWeight: "600",
  },
  closeBtn: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
  },
  closeText: {
    fontSize: 16,
    color: "#1a1a2e",
    fontWeight: "600",
  },
  closeTextLight: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  bottomBar: {
    alignItems: "center",
    paddingBottom: 48,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: 16,
  },
  profileHint: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 12,
    opacity: 0.8,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  captureLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 12,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  statusText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  primaryBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minHeight: 48,
    minWidth: 200,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    alignSelf: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  secondaryBtnText: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  resultContainer: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    minHeight: "100%",
  },
  thumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#000",
    marginBottom: 16,
  },
  analyzingBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: "#dc2626",
  },
  descriptionBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 17,
    color: "#1a1a2e",
    lineHeight: 24,
    marginBottom: 12,
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
  riskBadge: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  riskText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  infoCard: {
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
  infoText: {
    fontSize: 16,
    color: "#1a1a2e",
  },
  listItem: {
    fontSize: 15,
    color: "#1a1a2e",
    lineHeight: 22,
    marginBottom: 4,
  },
  confidence: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
});
