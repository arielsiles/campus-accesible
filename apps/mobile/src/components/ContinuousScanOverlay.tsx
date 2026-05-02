// FR-1105: Hidden camera overlay for continuous scanning during navigation
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { CameraView } from "expo-camera";
import { compressImage, imageToBase64 } from "../services/cameraService";

interface ContinuousScanOverlayProps {
  enabled: boolean;
  /** Called once with a stable capture function the parent can invoke */
  onReady: (capture: (() => Promise<string | null>) | null) => void;
}

/**
 * FR-1105: Invisible camera mounted off-screen that exposes a capture()
 * function to the parent. Camera only initializes when enabled is true to save
 * battery.
 */
export default function ContinuousScanOverlay({
  enabled,
  onReady,
}: ContinuousScanOverlayProps) {
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    if (!enabled) {
      onReady(null);
      return;
    }

    const capture = async (): Promise<string | null> => {
      if (!cameraRef.current) return null;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: false,
          skipProcessing: true,
        });
        if (!photo?.uri) return null;
        // Smaller resolution for continuous mode (NFR-1101)
        const compressed = await compressImage(photo.uri, 640, 0.5);
        return await imageToBase64(compressed);
      } catch {
        return null;
      }
    };

    onReady(capture);

    return () => onReady(null);
  }, [enabled, onReady]);

  if (!enabled) return null;

  return (
    <View style={styles.hidden} pointerEvents="none">
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
    </View>
  );
}

const styles = StyleSheet.create({
  // Position offscreen (visible to camera HW but not to user UI)
  hidden: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 200,
    height: 200,
    opacity: 0,
  },
  camera: {
    flex: 1,
  },
});
