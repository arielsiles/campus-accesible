// FR-901: Register screen with accessible form
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuthStore } from "../store/authStore";

interface RegisterScreenProps {
  onNavigateLogin: () => void;
}

export default function RegisterScreen({
  onNavigateLogin,
}: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { register, isLoading, error, clearError } = useAuthStore();

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    passwordsMatch &&
    !isLoading;

  const handleRegister = async () => {
    if (!canSubmit) return;
    try {
      await register(email.trim(), password, name.trim());
    } catch {
      // error shown via store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header} accessibilityRole="header">
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Regístrate para contribuir con rutas e incidencias
          </Text>
        </View>

        {error && (
          <View
            style={styles.errorContainer}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.label} nativeID="nameLabel">
            Nombre
          </Text>
          <TextInput
            style={styles.input}
            accessibilityLabel="Nombre completo"
            accessibilityLabelledBy="nameLabel"
            placeholder="Tu nombre"
            autoCapitalize="words"
            value={name}
            onChangeText={(text) => {
              clearError();
              setName(text);
            }}
            editable={!isLoading}
          />

          <Text style={styles.label} nativeID="emailLabel">
            Correo electrónico
          </Text>
          <TextInput
            style={styles.input}
            accessibilityLabel="Correo electrónico"
            accessibilityLabelledBy="emailLabel"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(text) => {
              clearError();
              setEmail(text);
            }}
            editable={!isLoading}
          />

          <Text style={styles.label} nativeID="passwordLabel">
            Contraseña
          </Text>
          <TextInput
            style={styles.input}
            accessibilityLabel="Contraseña, mínimo 6 caracteres"
            accessibilityLabelledBy="passwordLabel"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              clearError();
              setPassword(text);
            }}
            editable={!isLoading}
          />

          <Text style={styles.label} nativeID="confirmLabel">
            Confirmar contraseña
          </Text>
          <TextInput
            style={[
              styles.input,
              confirmPassword.length > 0 && !passwordsMatch && styles.inputError,
            ]}
            accessibilityLabel="Confirmar contraseña"
            accessibilityLabelledBy="confirmLabel"
            placeholder="Repite la contraseña"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              clearError();
              setConfirmPassword(text);
            }}
            editable={!isLoading}
            onSubmitEditing={handleRegister}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={styles.fieldError} accessibilityRole="alert">
              Las contraseñas no coinciden
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleRegister}
            disabled={!canSubmit}
            accessibilityLabel="Registrarse"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onNavigateLogin}
            disabled={isLoading}
            accessibilityLabel="Volver a iniciar sesión"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>
              Ya tengo cuenta
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: "#333",
    minHeight: 48,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  fieldError: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    marginTop: 24,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
});
