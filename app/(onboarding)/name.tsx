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

export default function NameScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canContinue = useMemo(
    () => firstName.trim().length >= 1 && !saving,
    [firstName, saving]
  );

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      // ✅ Use camelCase only
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim() || null, // optional; avoids sending empty string
      });

      // ✅ If you want app-specific fields, store in unsafeMetadata (client-writable)
      await user.update({
        unsafeMetadata: {
          ...(user.unsafeMetadata as any),
          displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        },
      });

      router.push("/(onboarding)/interests");
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.longMessage ||
        e?.errors?.[0]?.message ||
        e?.message ||
        "Failed to save name.";
      setErr(msg);
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
