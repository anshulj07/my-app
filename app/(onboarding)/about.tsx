// app/(onboarding)/about.tsx
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

export default function AboutScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [about, setAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const maxLen = 500;
  const minLen = 10;

  const len = about.length;
  const remaining = Math.max(0, maxLen - len);

  const canContinue = useMemo(() => about.trim().length >= minLen && !saving, [about, saving]);

  const pickErr = (text: string, fallback: string) => {
    try {
      const j = JSON.parse(text);
      return j?.message || j?.error || fallback;
    } catch {
      return fallback;
    }
  };

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");

      const res = await fetch(`${API_BASE}/api/onboarding/about`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: user.id, about: about.trim() }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(pickErr(text, `Failed to save about (${res.status}).`));
      }

      // Step 4
      router.push("/(onboarding)/photos");
    } catch (e: any) {
      setErr(e?.message || "Failed to save about.");
    } finally {
      setSaving(false);
    }
  };

  const quickFill = (s: string) => setAbout((prev) => (prev.trim().length ? prev : s));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: "padding", android: undefined })}>
        <View style={styles.page}>
          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.pill}>
                <View style={styles.pillDot} />
                <Text style={styles.pillText}>Step 3 of 4</Text>
              </View>

              <View style={styles.spark}>
                <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
              </View>
            </View>

            <Text style={styles.h1}>Tell us about you</Text>
            <Text style={styles.h2}>Short. Real. Swipe-worthy.</Text>
          </View>

          {/* CARD */}
          <View style={styles.card}>
            {/* Top row: label + counter */}
            <View style={styles.cardTopRow}>
              <View style={styles.labelRow}>
                <Ionicons name="pencil-outline" size={16} color={COLORS.inkSoft} />
                <Text style={styles.label}>About</Text>
              </View>

              <View style={[styles.counterPill, remaining <= 40 && styles.counterPillHot]}>
                <Text style={styles.counterText}>
                  {Math.min(len, maxLen)}/{maxLen}
                </Text>
              </View>
            </View>

            <View style={[styles.textareaWrap, about.trim().length > 0 && styles.textareaWrapFocused]}>
              <TextInput
                value={about}
                onChangeText={(t) => setAbout(t.slice(0, maxLen))}
                placeholder="Example: I’m into coffee, hikes, and finding underrated spots around the city."
                placeholderTextColor={COLORS.placeholder}
                style={styles.textarea}
                multiline
                textAlignVertical="top"
                maxLength={maxLen}
              />
            </View>

            {/* Quick picks */}
            <View style={styles.quickRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => quickFill("Coffee, hikes, and spontaneous plans. Always down to explore new spots.")}
                style={styles.quickChip}
              >
                <Ionicons name="flash-outline" size={14} color={COLORS.ink} />
                <Text style={styles.quickText}>Quick fill</Text>
              </TouchableOpacity>

              <View style={styles.hint}>
                <Ionicons name="sparkles-outline" size={14} color={COLORS.muted} />
                <Text style={styles.hintText}>
                  {about.trim().length < minLen ? `Add ${minLen - about.trim().length}+ chars` : "Looks good"}
                </Text>
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

          <Text style={styles.footer}>Keep it friendly — you can always edit later.</Text>
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
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

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

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { color: COLORS.inkSoft, fontWeight: "900", fontSize: 12 },

  counterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  counterPillHot: {
    backgroundColor: "rgba(255,138,0,0.14)",
    borderColor: "rgba(255,138,0,0.26)",
  },
  counterText: { color: COLORS.inkSoft, fontWeight: "900", fontSize: 12 },

  textareaWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 180,
  },
  textareaWrapFocused: {
    borderColor: "rgba(255,77,109,0.35)",
    backgroundColor: "rgba(255,77,109,0.08)",
  },

  textarea: {
    flex: 1,
    color: COLORS.ink,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.2,
    lineHeight: 20,
  },

  quickRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  quickText: { color: COLORS.ink, fontWeight: "900", fontSize: 12 },

  hint: { flexDirection: "row", alignItems: "center", gap: 8, opacity: 0.95 },
  hintText: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },

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
    marginTop: 2,
    lineHeight: 18,
  },
});
