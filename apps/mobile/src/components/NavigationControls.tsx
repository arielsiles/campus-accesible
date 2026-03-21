// FR-208: Navigation control buttons (cancel navigation)
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
} from "react-native";

interface NavigationControlsProps {
  onCancel: () => void;
}

export default function NavigationControls({
  onCancel,
}: NavigationControlsProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setShowConfirm(true)}
        accessibilityLabel="Cancelar navegación"
        accessibilityRole="button"
        accessibilityHint="Detiene la navegación activa"
      >
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>

      {/* FR-208: Confirmation dialog before cancelling */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.overlay}>
          <View
            style={styles.dialog}
            accessibilityRole="alert"
            accessibilityLabel="Confirmar cancelación de navegación"
          >
            <Text style={styles.dialogTitle}>¿Cancelar navegación?</Text>
            <Text style={styles.dialogMessage}>
              Se detendrá la navegación actual.
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogButtonSecondary}
                onPress={() => setShowConfirm(false)}
                accessibilityLabel="Continuar navegando"
                accessibilityRole="button"
              >
                <Text style={styles.dialogButtonSecondaryText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogButtonPrimary}
                onPress={() => {
                  setShowConfirm(false);
                  onCancel();
                }}
                accessibilityLabel="Confirmar cancelación"
                accessibilityRole="button"
              >
                <Text style={styles.dialogButtonPrimaryText}>Sí, cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(234, 67, 53, 0.9)",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 120,
    minHeight: 48, // NFR-202: Minimum touch target
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 24,
  },
  dialogButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  dialogButtonSecondary: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  dialogButtonSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
  dialogButtonPrimary: {
    backgroundColor: "#ea4335",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  dialogButtonPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});
