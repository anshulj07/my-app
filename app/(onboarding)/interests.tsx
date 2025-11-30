// app/(onboarding)/interests.tsx
import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";

const OPTIONS = [
  "Music",
  "Gym",
  "Coffee",
  "Hiking",
  "Tech",
  "Movies",
  "Food",
  "Travel",
  "Photography",
  "Sports",
];

export default function InterestsScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const initial = (user?.publicMetadata as any)?.interests;
  const [selected, setSelected] = useState<string[]>(Array.isArray(initial) ? initial : []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canContinue = useMemo(() => selected.length >= 1 && !saving, [selected.length, saving]);

  const toggle = (x: string) => {
    setSelected((prev) => (prev.includes(x) ? prev.filter((v) => v !== x) : [...prev, x]));
  };

  const onNext = async () => {
    if (!isLoaded || !user) return;
    setSaving(true);
    setErr(null);

    try {
      await user.update({
        unsafeMetadata: {
          ...(user.publicMetadata as any),
          interests: selected,
        },
      });

      router.push("/(onboarding)/about");
    } catch (e: any) {
      setErr(e?.errors?.[0]?.longMessage || e?.message || "Failed to save interests.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logo}>
            <Ionicons name="heart-outline" size={18} color="#0A84FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Step 2 of 4</Text>
            <Text style={styles.title}>Pick your interests</Text>
            <Text style={styles.sub}>Choose at least one.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.chips}>
            {OPTIONS.map((x) => {
              const on = selected.includes(x);
              return (
                <TouchableOpacity
                  key={x}
                  onPress={() => toggle(x)}
                  activeOpacity={0.9}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{x}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!!err && <Text style={styles.err}>{err}</Text>}

          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.9}
            disabled={!canContinue}
            style={[styles.primaryBtn, !canContinue && { opacity: 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  page: { flex: 1, padding: 16, justifyContent: "center", gap: 14 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: { color: "#0A84FF", fontWeight: "900", fontSize: 12 },
  title: { color: "#0F172A", fontWeight: "900", fontSize: 20, marginTop: 2 },
  sub: { color: "#64748B", fontWeight: "700", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  chipOn: { backgroundColor: "#0A84FF", borderColor: "#0A84FF" },
  chipText: { color: "#0F172A", fontWeight: "900" },
  chipTextOn: { color: "#fff" },

  err: { marginTop: 12, color: "#B91C1C", fontWeight: "800" },

  primaryBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
