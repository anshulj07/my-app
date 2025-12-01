// app/(onboarding)/name.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";

export default function NameScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  // ✅ user enters manually (do NOT prefill from Clerk)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const canContinue = useMemo(
    () => firstName.trim().length >= 1 && !saving,
    [firstName, saving]
  );

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) {
        throw new Error("Missing API base URL (extra.apiBaseUrl).");
      }

      // ✅ your backend should save onboarding info keyed by clerk user id
      const payload = {
        clerkUserId: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(), // can be empty
      };

      const res = await fetch(`${API_BASE}/api/onboarding/name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        // try to surface backend message
        let msg = `Failed to save name (${res.status}).`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      // ✅ continue onboarding flow
      router.push("/(onboarding)/interests");
    } catch (e: any) {
      setErr(e?.message || "Failed to save name.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.page}>
          <View style={styles.headerRow}>
            <View style={styles.logo}>
              <Ionicons name="person-outline" size={18} color="#0A84FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>Step 1 of 4</Text>
              <Text style={styles.title}>What’s your name?</Text>
              <Text style={styles.sub}>This helps people recognize you.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="e.g. Anshul"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              returnKeyType="next"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Last name (optional)</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="e.g. Jain"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              returnKeyType="done"
            />

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

            {!API_BASE ? (
              <Text style={[styles.err, { marginTop: 10 }]}>
                Config issue: extra.apiBaseUrl is missing.
              </Text>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  label: { color: "#0F172A", fontWeight: "900", fontSize: 12, marginBottom: 8 },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontWeight: "800",
  },
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
