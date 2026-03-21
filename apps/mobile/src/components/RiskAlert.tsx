// FR-304: Risk warning alert for approaching hazardous segments
import React from "react";
import { StyleSheet, View, Text } from "react-native";

interface RiskAlertProps {
  visible: boolean;
  riskLevel: "low" | "medium" | "high";
  segmentName: string;
  riskDescription?: string;
}

const RISK_COLORS: Record<string, string> = {
  low: "#fff3cd",
  medium: "#f9ab00",
  high: "#dc3545",
};

const RISK_TEXT_COLORS: Record<string, string> = {
  low: "#664d03",
  medium: "#333333",
  high: "#ffffff",
};

const RISK_LABELS: Record<string, string> = {
  low: "Riesgo bajo",
  medium: "Precaución",
  high: "Riesgo alto",
};

export default function RiskAlert({
  visible,
  riskLevel,
  segmentName,
  riskDescription,
}: RiskAlertProps) {
  if (!visible) return null;

  const label = RISK_LABELS[riskLevel];
  const description = riskDescription ?? `${label} en ${segmentName}`;
  const a11yLabel = `${label}. ${description}`;

  return (
    <View
      style={[styles.container, { backgroundColor: RISK_COLORS[riskLevel] }]}
      accessibilityRole="alert"
      accessibilityLabel={a11yLabel}
      accessibilityLiveRegion="assertive"
    >
      <Text style={styles.icon}>{riskLevel === "high" ? "🚨" : "⚠️"}</Text>
      <View style={styles.textContainer}>
        <Text
          style={[styles.title, { color: RISK_TEXT_COLORS[riskLevel] }]}
        >
          {label}
        </Text>
        <Text
          style={[styles.description, { color: RISK_TEXT_COLORS[riskLevel] }]}
          numberOfLines={2}
        >
          {description}
        </Text>
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
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
});
