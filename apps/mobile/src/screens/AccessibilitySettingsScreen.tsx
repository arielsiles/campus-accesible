// FR-305: Accessibility settings screen
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

import type { DescriptionFrequency } from "../store/accessibilityStore";

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
    setProfile,
    setAudioBeaconEnabled,
    setBeaconVolume,
    setAudioDescriptionsEnabled,
    setDescriptionFrequency,
    setTtsEnabled,
    setTtsRate,
    setHighContrastEnabled,
    setAudioOutputType,
  } = useAccessibilityStore();

  return (
    <ScrollView
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel="Configuración de accesibilidad"
    >
      {/* Profile section */}
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Perfil activo
      </Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.profileButton,
            profile === "standard" && styles.profileButtonActive,
          ]}
          onPress={() => setProfile("standard")}
          accessibilityLabel="Perfil Estándar"
          accessibilityHint="Navegación visual sin audio"
          accessibilityRole="button"
          accessibilityState={{ selected: profile === "standard" }}
        >
          <Text
            style={[
              styles.profileButtonText,
              profile === "standard" && styles.profileButtonTextActive,
            ]}
          >
            Estándar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.profileButton,
            profile === "visual_disability" && styles.profileButtonActive,
          ]}
          onPress={() => setProfile("visual_disability")}
          accessibilityLabel="Perfil Discapacidad visual"
          accessibilityHint="Audio beacons, descripciones por voz, alto contraste"
          accessibilityRole="button"
          accessibilityState={{ selected: profile === "visual_disability" }}
        >
          <Text
            style={[
              styles.profileButtonText,
              profile === "visual_disability" && styles.profileButtonTextActive,
            ]}
          >
            Discapacidad visual
          </Text>
        </TouchableOpacity>
      </View>

      {/* Audio beacons */}
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
        <View style={styles.volumeControls}>
          <TouchableOpacity
            onPress={() => setBeaconVolume(beaconVolume - 0.1)}
            style={styles.volumeButton}
            accessibilityLabel="Reducir volumen del beacon"
            accessibilityRole="button"
          >
            <Text style={styles.volumeButtonText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setBeaconVolume(beaconVolume + 0.1)}
            style={styles.volumeButton}
            accessibilityLabel="Aumentar volumen del beacon"
            accessibilityRole="button"
          >
            <Text style={styles.volumeButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audio descriptions */}
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
            accessibilityState={{ selected: descriptionFrequency === "full" }}
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
            accessibilityState={{ selected: descriptionFrequency === "reduced" }}
          >
            <Text style={styles.chipText}>Reducidas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TTS */}
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
        <View style={styles.volumeControls}>
          <TouchableOpacity
            onPress={() => setTtsRate(ttsRate - 0.1)}
            style={styles.volumeButton}
            accessibilityLabel="Reducir velocidad de voz"
            accessibilityRole="button"
          >
            <Text style={styles.volumeButtonText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTtsRate(ttsRate + 0.1)}
            style={styles.volumeButton}
            accessibilityLabel="Aumentar velocidad de voz"
            accessibilityRole="button"
          >
            <Text style={styles.volumeButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      {/* Audio output */}
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
              audioOutputType === "bone_conduction" && styles.chipButtonActive,
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
  profileButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    minHeight: 48,
  },
  profileButtonActive: {
    borderColor: "#1a73e8",
    backgroundColor: "#e8f0fe",
  },
  profileButtonText: {
    fontSize: 14,
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
  volumeControls: {
    flexDirection: "row",
    gap: 8,
  },
  volumeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  volumeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  bottomPadding: {
    height: 40,
  },
});
