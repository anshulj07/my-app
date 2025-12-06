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
      if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");

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
          {/* Top glow header */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.pill}>
                <View style={styles.pillDot} />
                <Text style={styles.pillText}>Step 1 of 4</Text>
              </View>

              <View style={styles.spark}>
                <Ionicons name="sparkles" size={16} color={COLORS.primary} />
              </View>
            </View>

            <Text style={styles.h1}>What’s your name?</Text>
            <Text style={styles.h2}>This helps people recognize you nearby.</Text>
          </View>

          {/* Glass card */}
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>First name</Text>
              <View style={[styles.inputWrap, firstName.trim() && styles.focused]}>
                <View style={styles.leftIcon}>
                  <Ionicons name="person-outline" size={18} color={COLORS.muted} />
                </View>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="e.g. Anshul"
                  placeholderTextColor={COLORS.placeholder}
                  style={styles.input}
                  returnKeyType="next"
                />
                <View style={styles.rightIcon}>
                  {firstName.trim().length > 0 ? (
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  ) : (
                    <View style={{ width: 18 }} />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Last name</Text>
              <View style={styles.inputWrap}>
                <View style={styles.leftIcon}>
                  <Ionicons name="id-card-outline" size={18} color={COLORS.muted} />
                </View>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="e.g. Jain"
                  placeholderTextColor={COLORS.placeholder}
                  style={styles.input}
                  returnKeyType="done"
                />
                <View style={styles.rightIcon}>
                  <Ionicons
                    name={lastName.trim().length ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={lastName.trim().length ? COLORS.success : "rgba(255,255,255,0.25)"}
                  />
                </View>
              </View>
            </View>

            {!!err && (
              <View style={styles.alert}>
                <View style={styles.alertIcon}>
                  <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
                </View>
                <Text style={styles.alertText}>{err}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={onNext}
              activeOpacity={0.92}
              disabled={!canContinue}
              style={[styles.cta, !canContinue && styles.ctaDisabled]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaText}>Continue</Text>
                  <View style={styles.ctaIcon}>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {!API_BASE ? (
              <View style={[styles.alert, { marginTop: 12 }]}>
                <View style={styles.alertIcon}>
                  <Ionicons name="bug-outline" size={18} color={COLORS.danger} />
                </View>
                <Text style={styles.alertText}>Config issue: extra.apiBaseUrl is missing.</Text>
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: "#0B0B12",
  card: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",
  ink: "#FFFFFF",
  inkSoft: "rgba(255,255,255,0.82)",
  muted: "rgba(255,255,255,0.62)",
  placeholder: "rgba(255,255,255,0.42)",
  primary: "#FF4D6D",
  primary2: "#FF8A00",
  success: "#22C55E",
  danger: "#FB7185",
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: COLORS.bg },

  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    justifyContent: "center",
    gap: 16,
    backgroundColor: COLORS.bg,
  },

  // HERO
  hero: { paddingHorizontal: 2, gap: 10 },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,77,109,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.25)",
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: COLORS.primary2,
    shadowColor: COLORS.primary2,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  pillText: { color: COLORS.ink, fontWeight: "900", fontSize: 12, letterSpacing: 0.25 },

  spark: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  h1: { color: COLORS.ink, fontSize: 34, fontWeight: "900", letterSpacing: -1.1, lineHeight: 40 },
  h2: { color: COLORS.muted, fontSize: 14, fontWeight: "700", lineHeight: 20 },

  // CARD
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },

  field: { marginTop: 12 },
  label: { color: COLORS.inkSoft, fontWeight: "900", fontSize: 12, marginBottom: 8 },
  optional: { color: COLORS.muted, fontWeight: "800" },

  inputWrap: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  focused: {
    borderColor: "rgba(255,77,109,0.35)",
    backgroundColor: "rgba(255,77,109,0.08)",
  },

  leftIcon: { width: 46, height: 56, alignItems: "center", justifyContent: "center", opacity: 0.95 },
  rightIcon: { width: 46, height: 56, alignItems: "center", justifyContent: "center", opacity: 0.95 },

  input: {
    flex: 1,
    color: COLORS.ink,
    fontWeight: "900",
    fontSize: 15,
    paddingVertical: 0,
    paddingRight: 8,
    letterSpacing: 0.2,
  },

  // ALERT
  alert: {
    marginTop: 14,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.24)",
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(251,113,133,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: { color: "#FFE4EA", fontWeight: "900", flex: 1, lineHeight: 18 },

  // CTA
  cta: {
    marginTop: 18,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.3 },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: 10,
    marginTop: 2,
    lineHeight: 18,
  },
});
