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
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";

export default function NameScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const canContinue = useMemo(() => firstName.trim().length >= 1 && !saving, [firstName, saving]);

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) throw new Error("Config issue: extra.apiBaseUrl is missing.");

      const payload = {
        clerkUserId: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
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
        let msg = `Failed to save name (${res.status}).`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      router.push("/(onboarding)/dateOfBirth");
    } catch (e: any) {
      setErr(e?.message || "Failed to save name.");
    } finally {
      setSaving(false);
    }
  };

  const title = "Your name";
  const subtitle = "This helps people recognize you nearby.";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
        <LinearGradient colors={[THEME.bgTop, THEME.bgMid, THEME.bgBot]} style={styles.bg}>
          {/* Top bar (match sign-in screen) */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={20} color={THEME.text} />
            </TouchableOpacity>

            <Text style={styles.brandText}>Pulse</Text>

            <View style={{ width: 44 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.h1}>{title}</Text>
            <Text style={styles.h2}>{subtitle}</Text>

            <View style={styles.card}>
              <Text style={styles.label}>First name</Text>
              <View style={[styles.field, firstName.trim().length > 0 && styles.fieldOk]}>
                <Ionicons name="person-outline" size={18} color={THEME.muted} style={{ marginRight: 10 }} />
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="e.g. Anshul"
                  placeholderTextColor={THEME.placeholder}
                  style={styles.input}
                  returnKeyType="next"
                />
                {firstName.trim().length > 0 ? (
                  <Ionicons name="checkmark-circle" size={18} color={THEME.good} />
                ) : (
                  <View style={{ width: 18 }} />
                )}
              </View>

              <Text style={[styles.label, { marginTop: 14 }]}>
                Last name <Text style={{ opacity: 0.7 }}>(optional)</Text>
              </Text>
              <View style={[styles.field, lastName.trim().length > 0 && styles.fieldOk]}>
                <Ionicons name="id-card-outline" size={18} color={THEME.muted} style={{ marginRight: 10 }} />
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="e.g. Jain"
                  placeholderTextColor={THEME.placeholder}
                  style={styles.input}
                  returnKeyType="done"
                />
                {lastName.trim().length > 0 ? (
                  <Ionicons name="checkmark-circle" size={18} color={THEME.good} />
                ) : (
                  <View style={{ width: 18 }} />
                )}
              </View>

              {!!err && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={THEME.bad} />
                  <Text style={styles.errorText}>{err}</Text>
                </View>
              )}

              <Pressable
                onPress={onNext}
                disabled={!canContinue}
                style={({ pressed }) => [
                  styles.primaryWrap,
                  (!canContinue || saving) && styles.primaryDisabled,
                  pressed && canContinue && !saving && styles.primaryPressed,
                ]}
              >
                <LinearGradient colors={[THEME.ctaA, THEME.ctaB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
                  {saving ? (
                    <ActivityIndicator color="#0B0B12" />
                  ) : (
                    <View style={styles.primaryRow}>
                      <Text style={styles.primaryText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={16} color="#0B0B12" />
                    </View>
                  )}
                </LinearGradient>
              </Pressable>

              {!API_BASE ? (
                <View style={[styles.errorBox, { marginTop: 12 }]}>
                  <Ionicons name="bug-outline" size={18} color={THEME.bad} />
                  <Text style={styles.errorText}>Config issue: extra.apiBaseUrl is missing.</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.micro}>Step 1 of 4</Text>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const THEME = {
  bgTop: "#0B0B12",
  bgMid: "#14102A",
  bgBot: "#090A10",

  text: "#F5F7FF",
  muted: "rgba(245,247,255,0.72)",
  placeholder: "rgba(245,247,255,0.35)",

  border: "rgba(255,255,255,0.14)",
  card: "rgba(255,255,255,0.06)",

  ctaA: "#B8FF6A",
  ctaB: "#6AF0FF",

  good: "#34D399",
  bad: "#FB7185",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bgTop },
  bg: { flex: 1 },

  topBar: {
    paddingHorizontal: 18,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  content: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  h1: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 28,
    letterSpacing: -0.6,
  },
  h2: {
    marginTop: 8,
    color: THEME.muted,
    fontFamily: "Sora_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },

  card: {
    marginTop: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },

  label: {
    color: THEME.muted,
    fontFamily: "Sora_600SemiBold",
    fontSize: 12,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  field: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  fieldOk: {
    borderColor: "rgba(52,211,153,0.35)",
    backgroundColor: "rgba(52,211,153,0.06)",
  },

  input: {
    flex: 1,
    color: THEME.text,
    fontFamily: "Sora_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.16)",
  },
  errorText: {
    flex: 1,
    color: "#FFD1DA",
    fontFamily: "Sora_600SemiBold",
    fontSize: 12,
    lineHeight: 18,
  },

  primaryWrap: { marginTop: 16, borderRadius: 18, overflow: "hidden" },
  primary: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryDisabled: { opacity: 0.5 },
  primaryPressed: { transform: [{ scale: 0.99 }] },

  primaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryText: {
    color: "#0B0B12",
    fontFamily: "Sora_700Bold",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  micro: {
    marginTop: 14,
    color: "rgba(245,247,255,0.65)",
    fontFamily: "Sora_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
