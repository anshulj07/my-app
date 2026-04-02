// app/(onboarding)/username.tsx
// Step 2 of 5 — Choose a unique @username

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { apiFetch } from "../../lib/apiFetch";

const COLORS = {
  bg:          "#0B0B12",
  card:        "rgba(255,255,255,0.10)",
  border:      "rgba(255,255,255,0.12)",
  borderSoft:  "rgba(255,255,255,0.08)",
  ink:         "#FFFFFF",
  inkSoft:     "rgba(255,255,255,0.82)",
  muted:       "rgba(255,255,255,0.62)",
  placeholder: "rgba(255,255,255,0.42)",
  primary:     "#FF4D6D",
  primary2:    "#FF8A00",
  success:     "#22C55E",
  danger:      "#FB7185",
};

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

// username rules: lowercase letters/numbers/underscores, 3-30 chars
const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export default function UsernameScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [raw,     setRaw]     = useState("");
  const [check,   setCheck]   = useState<CheckState>("idle");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState<string | null>(null);
  const [hint,    setHint]    = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sanitise input: auto-lowercase, strip disallowed chars
  const handleChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setRaw(cleaned);
    setErr(null);
  };

  // Real-time availability check
  const checkAvailability = useCallback(async (value: string) => {
    if (!API_BASE || !user?.id) return;
    setCheck("checking");
    setHint(null);
    try {
      const url = `${API_BASE}/api/onboarding/username?q=${encodeURIComponent(value)}&clerkUserId=${encodeURIComponent(user.id)}`;
      const res  = await apiFetch(url, {
        headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (json.available) {
        setCheck("available");
        setHint("@" + value + " is available ✓");
      } else if (json.reason === "invalid_format") {
        setCheck("invalid");
        setHint("3–30 chars, only letters / numbers / underscores");
      } else if (json.reason === "blocked") {
        setCheck("invalid");
        setHint("That username is not allowed.");
      } else {
        setCheck("taken");
        setHint("@" + value + " is already taken");
      }
    } catch {
      setCheck("idle");
    }
  }, [API_BASE, EVENT_API_KEY, user?.id]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!raw) { setCheck("idle"); setHint(null); return; }
    if (!USERNAME_RE.test(raw)) {
      setCheck("invalid");
      setHint(raw.length < 3 ? "At least 3 characters" : "Only lowercase letters, numbers, underscores");
      return;
    }
    setCheck("checking");
    debounceRef.current = setTimeout(() => checkAvailability(raw), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [raw, checkAvailability]);

  const canContinue = check === "available" && !saving;

  const onNext = async () => {
    if (!isLoaded || !user || !canContinue) return;
    setSaving(true);
    setErr(null);
    try {
      if (!API_BASE) throw new Error("Missing API base URL.");

      const res = await apiFetch(`${API_BASE}/api/onboarding/username`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: user.id, username: raw }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`);

      router.push("/(onboarding)/dateOfBirth");
    } catch (e: any) {
      setErr(e?.message || "Failed to set username.");
      setCheck("idle");
    } finally {
      setSaving(false);
    }
  };

  // Icon for real-time status
  const checkIcon = () => {
    if (!raw) return null;
    if (check === "checking") return <ActivityIndicator size="small" color={COLORS.muted} />;
    if (check === "available") return <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />;
    if (check === "taken")   return <Ionicons name="close-circle" size={20} color={COLORS.danger} />;
    if (check === "invalid") return <Ionicons name="alert-circle" size={20} color={COLORS.primary2} />;
    return null;
  };

  const hintColor =
    check === "available" ? COLORS.success :
    check === "taken"     ? COLORS.danger  :
    check === "invalid"   ? COLORS.primary2 :
    COLORS.muted;

  const inputBorderColor =
    check === "available" ? "rgba(34,197,94,0.45)"  :
    check === "taken"     ? "rgba(251,113,133,0.45)" :
    check === "invalid"   ? "rgba(255,138,0,0.45)"   :
    raw.length > 0        ? "rgba(255,77,109,0.35)"  :
    COLORS.borderSoft;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.page}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push("/(onboarding)/name");
                }
              }}
              activeOpacity={0.7}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.ink} />
            </TouchableOpacity>

            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>Step 2 of 7</Text>
            </View>
            <View style={styles.spark}>
                <Ionicons name="at" size={18} color={COLORS.primary} />
              </View>
            </View>

            <Text style={styles.h1}>Pick your username</Text>
            <Text style={styles.h2}>
              This is how people will discover you. You can always change it later.
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.label}>USERNAME</Text>

            <View style={[styles.inputWrap, { borderColor: inputBorderColor }]}>
              {/* @ prefix */}
              <View style={styles.prefixBox}>
                <Text style={styles.prefix}>@</Text>
              </View>

              <TextInput
                value={raw}
                onChangeText={handleChange}
                placeholder="your_username"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username-new"
                returnKeyType="done"
                maxLength={30}
                onSubmitEditing={canContinue ? onNext : undefined}
              />

              <View style={styles.suffixBox}>
                {checkIcon()}
              </View>
            </View>

            {/* Hint line */}
            {hint ? (
              <Text style={[styles.hint, { color: hintColor }]}>{hint}</Text>
            ) : (
              <Text style={styles.hintGrey}>3–30 chars · only a–z, 0–9, _</Text>
            )}

            {/* Rules chips */}
            <View style={styles.rulesRow}>
              {["Lowercase only", "Letters / numbers / _", "3–30 chars"].map(r => (
                <View key={r} style={styles.ruleChip}>
                  <Text style={styles.ruleChipTxt}>{r}</Text>
                </View>
              ))}
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
              disabled={!canContinue}
              activeOpacity={0.92}
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
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    marginBottom: 4,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  pill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, backgroundColor: "rgba(255,77,109,0.14)",
    borderWidth: 1, borderColor: "rgba(255,77,109,0.25)",
  },
  pillDot: {
    width: 7, height: 7, borderRadius: 99,
    backgroundColor: COLORS.primary2,
    shadowColor: COLORS.primary2, shadowOpacity: 0.35,
    shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },
  pillText: { color: COLORS.ink, fontWeight: "900", fontSize: 12, letterSpacing: 0.25 },

  spark: {
    width: 40, height: 40, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1, borderColor: COLORS.borderSoft,
    alignItems: "center", justifyContent: "center",
  },

  h1: { color: COLORS.ink, fontSize: 34, fontWeight: "900", letterSpacing: -1.1, lineHeight: 40 },
  h2: { color: COLORS.muted, fontSize: 14, fontWeight: "700", lineHeight: 20 },

  // CARD
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28, padding: 18,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: "#000", shadowOpacity: 0.35,
    shadowRadius: 26, shadowOffset: { width: 0, height: 16 }, elevation: 6,
  },

  label: { color: COLORS.inkSoft, fontWeight: "900", fontSize: 11, letterSpacing: 1, marginBottom: 10 },

  inputWrap: {
    height: 56, borderRadius: 18,
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
  },
  prefixBox: {
    width: 40, height: 56,
    alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.08)",
  },
  prefix: { color: COLORS.primary, fontWeight: "900", fontSize: 18 },

  input: {
    flex: 1,
    color: COLORS.ink, fontWeight: "900", fontSize: 16,
    paddingHorizontal: 12, paddingVertical: 0,
    letterSpacing: 0.3,
  },
  suffixBox: {
    width: 46, height: 56,
    alignItems: "center", justifyContent: "center",
  },

  hint: { fontSize: 12, fontWeight: "800", marginTop: 8, letterSpacing: 0.1 },
  hintGrey: { fontSize: 12, fontWeight: "700", color: COLORS.muted, marginTop: 8 },

  rulesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  ruleChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  ruleChipTxt: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },

  // ALERT
  alert: {
    marginTop: 14, borderRadius: 18, padding: 12,
    flexDirection: "row", gap: 10, alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1, borderColor: "rgba(251,113,133,0.24)",
  },
  alertIcon: {
    width: 36, height: 36, borderRadius: 14,
    backgroundColor: "rgba(251,113,133,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  alertText: { color: "#FFE4EA", fontWeight: "900", flex: 1, lineHeight: 18 },

  // CTA
  cta: {
    marginTop: 18, height: 56, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 10,
    shadowColor: COLORS.primary, shadowOpacity: 0.35,
    shadowRadius: 18, shadowOffset: { width: 0, height: 12 }, elevation: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.16)",
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.3 },
  ctaIcon: {
    width: 36, height: 36, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
});
