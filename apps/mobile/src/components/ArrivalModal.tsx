// FR-204: Arrival notification modal
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
} from "react-native";

interface ArrivalModalProps {
  visible: boolean;
  destinationName: string;
  onDismiss: () => void;
}

export default function ArrivalModal({
  visible,
  destinationName,
  onDismiss,
}: ArrivalModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View
          style={styles.modal}
          accessibilityRole="alert"
          accessibilityLabel={`Has llegado a tu destino: ${destinationName}`}
        >
          <Text style={styles.icon}>🎉</Text>
          <Text style={styles.title}>¡Has llegado!</Text>
          <Text style={styles.destination}>{destinationName}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            accessibilityLabel="Cerrar aviso de llegada"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#34a853",
    marginBottom: 8,
  },
  destination: {
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 120,
    minHeight: 48, // NFR-202: Minimum touch target
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
