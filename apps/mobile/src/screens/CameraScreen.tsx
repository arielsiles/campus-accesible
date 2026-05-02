// FR-1101, FR-1102: Camera screen with capture and AI description
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CameraView, CameraType } from "expo-camera";
import { useCamera } from "../hooks/useCamera";

interface CameraScreenProps {
  onClose: () => void;
}

export default function CameraScreen({ onClose }: CameraScreenProps) {
  const { permission, requestPermission, isReady } = useCamera();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing] = useState<CameraType>("back");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

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
            const result = await requestPermission();
            if (result !== "granted") {
              // user denied — guide to settings
            }
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
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        // T11.3 will add the AI describe step here
      }
    } catch {
      // Silently ignore camera errors
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setDescription(null);
  };

  // Captured photo + result view
  if (capturedUri) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Cerrar camara"
          >
            <Text style={styles.closeText}>← Volver</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.resultTitle} accessibilityRole="header">
            Captura tomada
          </Text>

          {analyzing && (
            <View style={styles.analyzingBox} accessibilityLiveRegion="polite">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.body}>Analizando con IA...</Text>
            </View>
          )}

          {description && (
            <View style={styles.descriptionBox} accessibilityLiveRegion="polite">
              <Text style={styles.descriptionText}>{description}</Text>
            </View>
          )}

          {!description && !analyzing && (
            <View style={styles.placeholderBox}>
              <Text style={styles.body}>
                La descripcion IA se anadira en el siguiente paso (T11.3).
              </Text>
            </View>
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
          </View>

          <View style={styles.bottomBar}>
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
  },
  closeBtn: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
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
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingTop: 24,
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
    marginTop: 12,
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
  resultTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 16,
    marginTop: 16,
  },
  analyzingBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  descriptionBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  placeholderBox: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
});
