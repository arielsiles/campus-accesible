// FR-401: Mobility barrier alert for reduced mobility profile
import React from "react";
import { StyleSheet, View, Text } from "react-native";

type MobilityBarrier = {
  type: "stairs" | "steep_slope" | "narrow_path" | "poor_surface";
  severity: "warning" | "blocking";
  description: string;
};

interface MobilityAlertProps {
  visible: boolean;
  barriers: MobilityBarrier[];
  segmentName: string;
}

const SEVERITY_COLORS = {
  blocking: { bg: "#dc3545", text: "#ffffff", icon: "🚫" },
  warning: { bg: "#fff3cd", text: "#664d03", icon: "⚠️" },
};

export default function MobilityAlert({
  visible,
  barriers,
  segmentName,
}: MobilityAlertProps) {
  if (!visible || barriers.length === 0) return null;

  const hasBlocking = barriers.some((b) => b.severity === "blocking");
  const theme = hasBlocking
    ? SEVERITY_COLORS.blocking
    : SEVERITY_COLORS.warning;

  const title = hasBlocking ? "Barrera detectada" : "Accesibilidad limitada";
  const a11yLabel = `${title} en ${segmentName}. ${barriers.map((b) => b.description).join(". ")}`;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.bg }]}
      accessibilityRole="alert"
      accessibilityLabel={a11yLabel}
      accessibilityLiveRegion="assertive"
    >
      <Text
        style={styles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {theme.icon}
      </Text>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {barriers.map((barrier) => (
          <Text
            key={barrier.type}
            style={[styles.barrierText, { color: theme.text }]}
          >
            {barrier.description}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 10,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  barrierText: {
    fontSize: 13,
    marginTop: 2,
  },
});
