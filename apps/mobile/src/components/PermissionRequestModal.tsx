// FR-004: Modal requesting location permission with accessible explanation
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PermissionRequestModalProps {
  visible: boolean;
  onRequestPermission: () => void;
  onDismiss: () => void;
}

export default function PermissionRequestModal({
  visible,
  onRequestPermission,
  onDismiss,
}: PermissionRequestModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View
          style={styles.card}
          accessibilityRole="alert"
          accessibilityLabel="Solicitud de permiso de ubicación"
        >
          <Text style={styles.title}>Permiso de ubicación</Text>
          <Text style={styles.body}>
            Campus GPS necesita acceder a tu ubicación para mostrarte dónde te
            encuentras en el mapa y guiarte por el campus universitario.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onRequestPermission}
            accessibilityRole="button"
            accessibilityLabel="Permitir acceso a la ubicación"
            accessibilityHint="Abre el diálogo del sistema para conceder permisos de ubicación"
          >
            <Text style={styles.primaryButtonText}>Permitir ubicación</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Continuar sin ubicación"
            accessibilityHint="Cierra este diálogo y usa la app sin ubicación"
          >
            <Text style={styles.secondaryButtonText}>Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: "#555555",
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
  },
  secondaryButtonText: {
    color: "#1a73e8",
    fontSize: 16,
    fontWeight: "500",
  },
});
