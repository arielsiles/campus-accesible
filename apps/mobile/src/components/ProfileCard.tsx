// FR-404: Profile card component for multi-profile selector
import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

import type { AccessibilityProfile } from "../store/accessibilityStore";

export interface ProfileCardProps {
  id: AccessibilityProfile;
  title: string;
  description: string;
  icon: string;
  features: string[];
  isSelected: boolean;
  onPress: (id: AccessibilityProfile) => void;
}

export default function ProfileCard({
  id,
  title,
  description,
  icon,
  features,
  isSelected,
  onPress,
}: ProfileCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onPress(id)}
      accessibilityLabel={`Perfil ${title}: ${description}`}
      accessibilityHint="Pulsa para seleccionar este perfil"
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <Text
        style={styles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {icon}
      </Text>
      <Text style={[styles.title, isSelected && styles.titleSelected]}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.features}>
        {features.map((feature) => (
          <Text key={feature} style={styles.featureText}>
            {feature}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    minHeight: 44,
  },
  cardSelected: {
    borderColor: "#1a73e8",
    backgroundColor: "#e8f0fe",
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  titleSelected: {
    color: "#1a73e8",
  },
  description: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  features: {
    width: "100%",
    gap: 2,
  },
  featureText: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
  },
});
