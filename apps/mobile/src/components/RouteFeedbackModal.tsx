// FR-1505: Quick post-navigation feedback modal
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { apiPost } from "../services/apiClient";
import type { AccessibilityProfile } from "../store/accessibilityStore";

interface RouteFeedbackModalProps {
  visible: boolean;
  segmentIds: string[];
  profile: AccessibilityProfile;
  onClose: () => void;
}

type Rating = "good" | "ok" | "bad";

export default function RouteFeedbackModal({
  visible,
  segmentIds,
  profile,
  onClose,
}: RouteFeedbackModalProps) {
  const [selected, setSelected] = useState<Rating | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSelected(null);
    setComment("");
  };

  const handleSubmit = async (rating: Rating) => {
    setSelected(rating);
    if (rating === "bad") {
      // Stay open to ask for comment
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/feedback/route", {
        rating,
        segmentIds,
        profile,
      });
    } catch {
      // ignore — best effort
    } finally {
      setSubmitting(false);
      reset();
      onClose();
    }
  };

  const handleSubmitBadWithComment = async () => {
    setSubmitting(true);
    try {
      await apiPost("/feedback/route", {
        rating: "bad",
        comment: comment.trim() || undefined,
        segmentIds,
        profile,
      });
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
      reset();
      onClose();
    }
  };

  const handleSkip = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title} accessibilityRole="header">
            ¿Como estuvo la ruta?
          </Text>
          <Text style={styles.subtitle}>
            Tu opinion nos ayuda a mejorar la ruta para otros usuarios.
          </Text>

          {selected !== "bad" ? (
            <View style={styles.options}>
              <TouchableOpacity
                style={[styles.option, styles.good]}
                onPress={() => handleSubmit("good")}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Buena ruta"
              >
                <Text style={styles.optionEmoji} accessibilityElementsHidden>
                  👍
                </Text>
                <Text style={styles.optionLabel}>Buena</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, styles.ok]}
                onPress={() => handleSubmit("ok")}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Aceptable"
              >
                <Text style={styles.optionEmoji} accessibilityElementsHidden>
                  😐
                </Text>
                <Text style={styles.optionLabel}>Aceptable</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.option, styles.bad]}
                onPress={() => handleSubmit("bad")}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Mala ruta"
              >
                <Text style={styles.optionEmoji} accessibilityElementsHidden>
                  👎
                </Text>
                <Text style={styles.optionLabel}>Mala</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.commentLabel}>
                Cuentanos brevemente que paso (opcional):
              </Text>
              <TextInput
                style={styles.commentInput}
                multiline
                numberOfLines={3}
                maxLength={500}
                value={comment}
                onChangeText={setComment}
                placeholder="Ej. La acera estaba bloqueada por obras..."
                accessibilityLabel="Comentario sobre la ruta"
              />
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmitBadWithComment}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Enviar comentario"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Saltar feedback"
          >
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 88,
    justifyContent: "center",
    borderWidth: 2,
  },
  good: { backgroundColor: "#dcfce7", borderColor: "#22c55e" },
  ok: { backgroundColor: "#fef3c7", borderColor: "#eab308" },
  bad: { backgroundColor: "#fee2e2", borderColor: "#ef4444" },
  optionEmoji: { fontSize: 28, marginBottom: 4 },
  optionLabel: { fontSize: 13, fontWeight: "700", color: "#1a1a2e" },
  commentLabel: {
    fontSize: 14,
    color: "#1a1a2e",
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    marginTop: 4,
  },
  skipText: {
    fontSize: 14,
    color: "#666",
    textDecorationLine: "underline",
  },
});
