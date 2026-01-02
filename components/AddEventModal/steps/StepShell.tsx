// components/add-event/steps/StepShell.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.h}>{title}</Text>
      {!!subtitle && <Text style={styles.p}>{subtitle}</Text>}

      <View style={styles.surface}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  h: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  p: { marginTop: 6, color: "#64748B", fontWeight: "800", lineHeight: 18 },
  surface: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2FF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
});
