// FR-404: Multi-profile selector — shown on first launch
import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useAccessibilityStore } from "../store/accessibilityStore";
import ProfileCard from "./ProfileCard";

import type { AccessibilityProfile } from "../store/accessibilityStore";

interface ProfileOption {
  id: AccessibilityProfile;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

// FR-404: 4 main profiles available at onboarding
const PROFILES: ProfileOption[] = [
  {
    id: "standard",
    title: "Estándar",
    description: "Navegación visual con mapa e instrucciones en pantalla",
    icon: "📍",
    features: ["Mapa interactivo", "Instrucciones en pantalla"],
  },
  {
    id: "visual_disability",
    title: "Discapacidad visual",
    description:
      "Audio beacons 3D, descripciones por voz, alto contraste, compatible con TalkBack",
    icon: "🔊",
    features: [
      "Audio beacons 3D",
      "Descripciones por voz",
      "Alto contraste",
      "Compatible con TalkBack",
    ],
  },
  {
    id: "reduced_mobility",
    title: "Movilidad reducida",
    description:
      "Rutas sin barreras, evita escalones, alerta de pendientes y pasos estrechos",
    icon: "♿",
    features: [
      "Rutas sin escalones",
      "Alerta de pendientes",
      "Ancho de paso mínimo",
      "Calidad de superficie",
    ],
  },
  {
    id: "deaf",
    title: "Personas sordas",
    description:
      "Vibración háptica direccional, alertas visuales ampliadas, sin audio",
    icon: "📳",
    features: [
      "Vibración direccional",
      "Alertas visuales",
      "Sin audio ni voz",
      "Indicadores en pantalla",
    ],
  },
  {
    id: "easy_read",
    title: "Lectura fácil",
    description:
      "Instrucciones simplificadas, frases cortas, letra grande, paso a paso",
    icon: "📖",
    features: [
      "Frases cortas y claras",
      "Letra grande",
      "Instrucciones paso a paso",
      "Voz activada",
    ],
  },
];

export default function ProfileSelector() {
  const setProfile = useAccessibilityStore((s) => s.setProfile);
  const currentProfile = useAccessibilityStore((s) => s.profile);

  const handleSelect = (profileId: AccessibilityProfile) => {
    setProfile(profileId);
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Selección de perfil de accesibilidad"
    >
      <Text style={styles.title} accessibilityRole="header">
        Bienvenido a Campus GPS
      </Text>
      <Text style={styles.subtitle}>
        Selecciona tu perfil para personalizar la experiencia
      </Text>

      <View style={styles.options}>
        {PROFILES.map((profile) => (
          <ProfileCard
            key={profile.id}
            id={profile.id}
            title={profile.title}
            description={profile.description}
            icon={profile.icon}
            features={profile.features}
            isSelected={currentProfile === profile.id}
            onPress={handleSelect}
          />
        ))}
      </View>

      <Text style={styles.note}>
        Puedes cambiar tu perfil en cualquier momento desde Configuración
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 40,
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
    marginBottom: 24,
  },
  options: {
    width: "100%",
    gap: 12,
  },
  note: {
    fontSize: 13,
    color: "#999999",
    textAlign: "center",
    marginTop: 24,
  },
});
