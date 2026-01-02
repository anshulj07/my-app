// components/add-event/steps/PriceStep.tsx
import React, { useMemo } from "react";
import { View, Text, TextInput, Platform, StyleSheet } from "react-native";
import StepShell from "./StepShell";
import type { WizardState } from "../wizard/wizardTypes";
import type { WizardAction } from "../wizard/wizardReducer";

export default function PriceStep({
  state,
  dispatch,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const ok = useMemo(() => {
    const n = Number(state.priceText);
    return Number.isFinite(n) && n > 0;
  }, [state.priceText]);

  const label = state.kind === "service" ? "Service fee (USD)" : "Ticket price (USD)";

  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.shell}>
        <Text style={styles.prefix}>$</Text>
        <TextInput
          value={state.priceText}
          onChangeText={(t) => dispatch({ type: "SET", key: "priceText", value: t.replace(/[^\d.]/g, "") })}
          placeholder={state.kind === "service" ? "25" : "15"}
          placeholderTextColor="#94A3B8"
          keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
          style={styles.input}
        />
        <View style={[styles.pill, ok ? styles.pillOk : styles.pillBad]}>
          <Text style={[styles.pillText, ok ? styles.pillTextOk : styles.pillTextBad]}>{ok ? "OK" : "REQUIRED"}</Text>
        </View>
      </View>

      <Text style={styles.helper}>
        {ok ? "Nice. Clear pricing converts better." : "Enter a valid number (example: 20)."}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: "900", color: "#0F172A", marginBottom: 8 },
  shell: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    height: 54,
  },
  prefix: { fontWeight: "900", color: "#0F172A", marginRight: 6, fontSize: 16 },
  input: { flex: 1, fontWeight: "900", color: "#0F172A" },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  pillOk: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  pillBad: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  pillText: { fontWeight: "900", fontSize: 12 },
  pillTextOk: { color: "#065F46" },
  pillTextBad: { color: "#991B1B" },
  helper: { marginTop: 10, color: "#64748B", fontWeight: "900" },
});
