// FR-901: Login screen with accessible form
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

interface LoginScreenProps {
  onNavigateRegister: () => void;
  onSkip: () => void;
}

export default function LoginScreen({
  onNavigateRegister,
  onSkip,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    try {
      await login(email.trim(), password);
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
        <View
          style={styles.header}
          accessibilityRole="header"
        >
          <Text style={styles.title}>Campus GPS Accesible</Text>
          <Text style={styles.subtitle}>Inicia sesión para contribuir</Text>
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
            accessibilityLabel="Contraseña"
            accessibilityLabelledBy="passwordLabel"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              clearError();
              setPassword(text);
            }}
            editable={!isLoading}
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleLogin}
            disabled={isLoading || !email.trim() || !password}
            accessibilityLabel="Iniciar sesión"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onNavigateRegister}
            disabled={isLoading}
            accessibilityLabel="Crear cuenta nueva"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            disabled={isLoading}
            accessibilityLabel="Continuar sin cuenta, modo de solo lectura"
            accessibilityRole="button"
            accessibilityHint="Podrás navegar rutas pero no crear ni reportar"
          >
            <Text style={styles.skipText}>Continuar sin cuenta</Text>
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
    marginBottom: 32,
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
  skipButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  skipText: {
    color: "#888",
    fontSize: 14,
    textDecorationLine: "underline",
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
