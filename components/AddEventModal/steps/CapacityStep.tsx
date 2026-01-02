// components/add-event/steps/CapacityStep.tsx
import React, { useMemo } from "react";
import { View, Text, TextInput, Platform, StyleSheet } from "react-native";
import StepShell from "./StepShell";
import type { WizardState } from "../wizard/wizardTypes";
import type { WizardAction } from "../wizard/wizardReducer";

export default function CapacityStep({
  state,
  dispatch,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const raw = (state.capacityText || "").trim();

  const parsed = useMemo(() => {
    if (!raw) return null; // ✅ empty = skipped
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }, [raw]);

  const ok = raw.length === 0 || (parsed !== null && parsed > 0); // ✅ allow skip

  const pillLabel =
    raw.length === 0 ? "OPTIONAL" : ok ? "OK" : "INVALID";

  return (
    <StepShell title="Capacity" subtitle="Optional for free events. Leave empty for no limit.">
      <Text style={styles.label}>Max people</Text>

      <View style={styles.shell}>
        <TextInput
          value={state.capacityText}
          onChangeText={(t) =>
            dispatch({ type: "SET", key: "capacityText", value: t.replace(/[^\d]/g, "") })
          }
          placeholder="e.g., 20"
          placeholderTextColor="#94A3B8"
          keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
          style={styles.input}
        />

        <View style={[styles.pill, ok ? styles.pillOk : styles.pillBad]}>
          <Text style={[styles.pillText, ok ? styles.pillTextOk : styles.pillTextBad]}>
            {pillLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.helper}>
        {raw.length === 0
          ? "No limit set — anyone can join."
          : ok
          ? "Nice — a clear limit helps people decide."
          : "Enter a valid number (> 0) or leave it empty."}
      </Text>
    </StepShell>
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
  input: { flex: 1, fontWeight: "900", color: "#0F172A" },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  pillOk: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  pillBad: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  pillText: { fontWeight: "900", fontSize: 12 },
  pillTextOk: { color: "#065F46" },
  pillTextBad: { color: "#991B1B" },
  helper: { marginTop: 10, color: "#64748B", fontWeight: "900" },
});
