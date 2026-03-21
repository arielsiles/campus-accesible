// FR-305: Profile selector component — shown on first launch
import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useAccessibilityStore } from "../store/accessibilityStore";

import type { AccessibilityProfile } from "../store/accessibilityStore";

interface ProfileOption {
  id: AccessibilityProfile;
  title: string;
  description: string;
  icon: string;
}

const PROFILES: ProfileOption[] = [
  {
    id: "standard",
    title: "Estándar",
    description: "Navegación visual con mapa e instrucciones en pantalla",
    icon: "📍",
  },
  {
    id: "visual_disability",
    title: "Discapacidad visual",
    description:
      "Audio beacons 3D, descripciones por voz, alto contraste, compatible con TalkBack",
    icon: "🔊",
  },
];

export default function ProfileSelector() {
  const setProfile = useAccessibilityStore((s) => s.setProfile);

  const handleSelect = (profileId: AccessibilityProfile) => {
    setProfile(profileId);
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Selección de perfil de accesibilidad"
    >
      <Text
        style={styles.title}
        accessibilityRole="header"
      >
        Bienvenido a Campus GPS
      </Text>
      <Text style={styles.subtitle}>
        Selecciona tu perfil para personalizar la experiencia
      </Text>

      <View style={styles.options}>
        {PROFILES.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={styles.option}
            onPress={() => handleSelect(profile.id)}
            accessibilityLabel={`Perfil ${profile.title}: ${profile.description}`}
            accessibilityHint="Pulsa para seleccionar este perfil"
            accessibilityRole="button"
          >
            <Text
              style={styles.optionIcon}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {profile.icon}
            </Text>
            <Text style={styles.optionTitle}>{profile.title}</Text>
            <Text style={styles.optionDescription}>{profile.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.note}>
        Puedes cambiar tu perfil en cualquier momento desde Configuración
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 32,
  },
  options: {
    width: "100%",
    gap: 16,
  },
  option: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    minHeight: 120,
  },
  optionIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  },
  note: {
    fontSize: 13,
    color: "#999999",
    textAlign: "center",
    marginTop: 24,
  },
});
