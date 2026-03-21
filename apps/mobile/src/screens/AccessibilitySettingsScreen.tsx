// FR-305, FR-404: Accessibility settings screen with multi-profile support
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAccessibilityStore } from "../store/accessibilityStore";

import type {
  AccessibilityProfile,
  DescriptionFrequency,
} from "../store/accessibilityStore";

interface ProfileButton {
  id: AccessibilityProfile;
  label: string;
  hint: string;
}

const PROFILE_BUTTONS: ProfileButton[] = [
  { id: "standard", label: "Estándar", hint: "Navegación visual sin audio" },
  {
    id: "visual_disability",
    label: "Visual",
    hint: "Audio beacons, descripciones por voz, alto contraste",
  },
  {
    id: "reduced_mobility",
    label: "Movilidad",
    hint: "Rutas sin barreras, evita escalones",
  },
  {
    id: "deaf",
    label: "Sordos",
    hint: "Vibración háptica, sin audio",
  },
  {
    id: "easy_read",
    label: "Lectura fácil",
    hint: "Instrucciones simplificadas, letra grande",
  },
];

export default function AccessibilitySettingsScreen() {
  const {
    profile,
    audioBeaconEnabled,
    beaconVolume,
    audioDescriptionsEnabled,
    descriptionFrequency,
    ttsEnabled,
    ttsRate,
    highContrastEnabled,
    audioOutputType,
    hapticEnabled,
    easyReadEnabled,
    largeFontEnabled,
    mobilityBarriersEnabled,
    avoidStairs,
    maxSlopePercent,
    minPathWidth,
    setProfile,
    setAudioBeaconEnabled,
    setBeaconVolume,
    setAudioDescriptionsEnabled,
    setDescriptionFrequency,
    setTtsEnabled,
    setTtsRate,
    setHighContrastEnabled,
    setAudioOutputType,
    setHapticEnabled,
    setEasyReadEnabled,
    setLargeFontEnabled,
    setMobilityBarriersEnabled,
    setAvoidStairs,
    setMaxSlopePercent,
    setMinPathWidth,
  } = useAccessibilityStore();

  return (
    <ScrollView
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Configuración de accesibilidad"
    >
      {/* FR-404: Profile section with 5 profiles */}
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Perfil activo
      </Text>
      <View style={styles.profileGrid}>
        {PROFILE_BUTTONS.map((btn) => (
          <TouchableOpacity
            key={btn.id}
            style={[
              styles.profileButton,
              profile === btn.id && styles.profileButtonActive,
            ]}
            onPress={() => setProfile(btn.id)}
            accessibilityLabel={`Perfil ${btn.label}`}
            accessibilityHint={btn.hint}
            accessibilityRole="button"
            accessibilityState={{ selected: profile === btn.id }}
          >
            <Text
              style={[
                styles.profileButtonText,
                profile === btn.id && styles.profileButtonTextActive,
              ]}
            >
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Audio beacons — visible for visual_disability */}
      {(profile === "visual_disability" || profile === "standard") && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Audio Beacons
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Audio beacons activados</Text>
            <Switch
              value={audioBeaconEnabled}
              onValueChange={setAudioBeaconEnabled}
              accessibilityLabel="Audio beacons activados"
              accessibilityRole="switch"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Volumen beacon: {Math.round(beaconVolume * 100)}%
            </Text>
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={() => setBeaconVolume(beaconVolume - 0.1)}
                style={styles.controlButton}
                accessibilityLabel="Reducir volumen del beacon"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBeaconVolume(beaconVolume + 0.1)}
                style={styles.controlButton}
                accessibilityLabel="Aumentar volumen del beacon"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Audio descriptions */}
      {profile !== "deaf" && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Audio-Descripciones
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Descripciones activadas</Text>
            <Switch
              value={audioDescriptionsEnabled}
              onValueChange={setAudioDescriptionsEnabled}
              accessibilityLabel="Audio-descripciones activadas"
              accessibilityRole="switch"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Frecuencia</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  descriptionFrequency === "full" && styles.chipButtonActive,
                ]}
                onPress={() => setDescriptionFrequency("full")}
                accessibilityLabel="Descripciones completas"
                accessibilityHint="Superficie, desnivel, riesgos y puntos de interés"
                accessibilityRole="button"
                accessibilityState={{
                  selected: descriptionFrequency === "full",
                }}
              >
                <Text style={styles.chipText}>Completas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  descriptionFrequency === "reduced" && styles.chipButtonActive,
                ]}
                onPress={() => setDescriptionFrequency("reduced")}
                accessibilityLabel="Descripciones reducidas"
                accessibilityHint="Solo riesgos y giros"
                accessibilityRole="button"
                accessibilityState={{
                  selected: descriptionFrequency === "reduced",
                }}
              >
                <Text style={styles.chipText}>Reducidas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* TTS — not for deaf */}
      {profile !== "deaf" && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Voz (TTS)
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Instrucciones por voz</Text>
            <Switch
              value={ttsEnabled}
              onValueChange={setTtsEnabled}
              accessibilityLabel="Instrucciones por voz activadas"
              accessibilityRole="switch"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Velocidad: {ttsRate.toFixed(1)}x
            </Text>
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={() => setTtsRate(ttsRate - 0.1)}
                style={styles.controlButton}
                accessibilityLabel="Reducir velocidad de voz"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTtsRate(ttsRate + 0.1)}
                style={styles.controlButton}
                accessibilityLabel="Aumentar velocidad de voz"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Visual */}
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Visual
      </Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Alto contraste</Text>
        <Switch
          value={highContrastEnabled}
          onValueChange={setHighContrastEnabled}
          accessibilityLabel="Alto contraste activado"
          accessibilityRole="switch"
        />
      </View>

      {/* Audio output — not for deaf */}
      {profile !== "deaf" && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Salida de audio
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  audioOutputType === "stereo" && styles.chipButtonActive,
                ]}
                onPress={() => setAudioOutputType("stereo")}
                accessibilityLabel="Auriculares estéreo"
                accessibilityRole="button"
                accessibilityState={{ selected: audioOutputType === "stereo" }}
              >
                <Text style={styles.chipText}>Estéreo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  audioOutputType === "bone_conduction" &&
                    styles.chipButtonActive,
                ]}
                onPress={() => setAudioOutputType("bone_conduction")}
                accessibilityLabel="Auriculares de conducción ósea"
                accessibilityHint="Adapta el audio a mono para auriculares de conducción ósea"
                accessibilityRole="button"
                accessibilityState={{
                  selected: audioOutputType === "bone_conduction",
                }}
              >
                <Text style={styles.chipText}>Conducción ósea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* FR-403: Haptic settings — for deaf profile */}
      {profile === "deaf" && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Vibración háptica
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Vibración direccional</Text>
            <Switch
              value={hapticEnabled}
              onValueChange={setHapticEnabled}
              accessibilityLabel="Vibración háptica direccional activada"
              accessibilityRole="switch"
            />
          </View>
        </>
      )}

      {/* FR-402: Easy read settings */}
      {profile === "easy_read" && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Lectura fácil
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Textos simplificados</Text>
            <Switch
              value={easyReadEnabled}
              onValueChange={setEasyReadEnabled}
              accessibilityLabel="Textos simplificados activados"
              accessibilityRole="switch"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Letra grande</Text>
            <Switch
              value={largeFontEnabled}
              onValueChange={setLargeFontEnabled}
              accessibilityLabel="Letra grande activada"
              accessibilityRole="switch"
            />
          </View>
        </>
      )}

      {/* FR-401: Mobility settings */}
      {profile === "reduced_mobility" && (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Accesibilidad física
          </Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Alertas de barreras</Text>
            <Switch
              value={mobilityBarriersEnabled}
              onValueChange={setMobilityBarriersEnabled}
              accessibilityLabel="Alertas de barreras arquitectónicas activadas"
              accessibilityRole="switch"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Evitar escalones</Text>
            <Switch
              value={avoidStairs}
              onValueChange={setAvoidStairs}
              accessibilityLabel="Evitar escalones en rutas"
              accessibilityRole="switch"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Pendiente máxima: {maxSlopePercent}%
            </Text>
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={() => setMaxSlopePercent(maxSlopePercent - 1)}
                style={styles.controlButton}
                accessibilityLabel="Reducir pendiente máxima"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMaxSlopePercent(maxSlopePercent + 1)}
                style={styles.controlButton}
                accessibilityLabel="Aumentar pendiente máxima"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Ancho mínimo: {minPathWidth.toFixed(1)}m
            </Text>
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={() => setMinPathWidth(minPathWidth - 0.1)}
                style={styles.controlButton}
                accessibilityLabel="Reducir ancho mínimo de paso"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMinPathWidth(minPathWidth + 0.1)}
                style={styles.controlButton}
                accessibilityLabel="Aumentar ancho mínimo de paso"
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 24,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    minHeight: 48,
  },
  settingLabel: {
    fontSize: 16,
    color: "#333333",
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  profileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  profileButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  profileButtonActive: {
    borderColor: "#1a73e8",
    backgroundColor: "#e8f0fe",
  },
  profileButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666666",
  },
  profileButtonTextActive: {
    color: "#1a73e8",
  },
  chipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 44,
    justifyContent: "center",
  },
  chipButtonActive: {
    borderColor: "#1a73e8",
    backgroundColor: "#e8f0fe",
  },
  chipText: {
    fontSize: 14,
    color: "#333333",
  },
  controls: {
    flexDirection: "row",
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  bottomPadding: {
    height: 40,
  },
});
