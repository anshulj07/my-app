// app/(onboarding)/about.tsx
import React, { useMemo, useRef, useState } from "react";
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
  Animated,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";

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

  // --- Animations (subtle, like your newer screens) ---
  const cardScale = useRef(new Animated.Value(1)).current;
  const counterPulse = useRef(new Animated.Value(1)).current;

  const bumpCard = () => {
    cardScale.setValue(0.99);
    Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 180, useNativeDriver: true }).start();
  };

  const bumpCounter = () => {
    counterPulse.setValue(0.98);
    Animated.spring(counterPulse, { toValue: 1, friction: 5, tension: 220, useNativeDriver: true }).start();
  };

  const quickFill = (s: string) => {
    setAbout((prev) => (prev.trim().length ? prev : s));
    bumpCounter();
  };

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) throw new Error("Config issue: extra.apiBaseUrl is missing.");

      const apiBase = API_BASE.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/onboarding/about`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: user.id, about: about.trim() }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(pickErr(text, `Failed to save about (${res.status}).`));

      router.push("/(onboarding)/photos");
    } catch (e: any) {
      setErr(e?.message || "Failed to save about.");
    } finally {
      setSaving(false);
    }
  };

  const hintText =
    about.trim().length < minLen ? `Add ${minLen - about.trim().length}+ chars` : "Looks good";

  const hotCounter = remaining <= 40;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[THEME.bgTop, THEME.bgMid, THEME.bgBot]} style={styles.bg}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.select({ ios: "padding", android: undefined })}
        >
          {/* Top bar (matches your newer style) */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={20} color={THEME.text} />
            </TouchableOpacity>

            <Text style={styles.brandText}>Pulse</Text>

            <View style={{ width: 44 }} />
          </View>

          <View style={styles.page}>
            {/* HERO */}
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={styles.stepPill}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={THEME.ctaB} />
                  <Text style={styles.stepText}>Step 4 of 6</Text>
                </View>

                <View style={styles.heroIcon}>
                  <Ionicons name="sparkles" size={16} color={THEME.ctaA} />
                </View>
              </View>

              <Text style={styles.h1}>Tell us about you</Text>
              <Text style={styles.h2}>Short. Real. Swipe-worthy.</Text>
            </View>

            {/* CARD */}
            <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
              {/* Top row: label + counter */}
              <View style={styles.cardTopRow}>
                <View style={styles.labelRow}>
                  <Ionicons name="pencil-outline" size={16} color={THEME.muted} />
                  <Text style={styles.label}>About</Text>
                </View>

                <Animated.View style={{ transform: [{ scale: counterPulse }] }}>
                  <View style={[styles.counterPill, hotCounter && styles.counterPillHot]}>
                    <Text style={[styles.counterText, hotCounter && styles.counterTextHot]}>
                      {Math.min(len, maxLen)}/{maxLen}
                    </Text>
                  </View>
                </Animated.View>
              </View>

              <View style={[styles.textareaWrap, about.trim().length > 0 && styles.textareaWrapFocused]}>
                <TextInput
                  value={about}
                  onChangeText={(t) => {
                    setAbout(t.slice(0, maxLen));
                    bumpCounter();
                  }}
                  onFocus={bumpCard}
                  placeholder="Example: I’m into coffee, hikes, and finding underrated spots around the city."
                  placeholderTextColor={THEME.placeholder}
                  style={styles.textarea}
                  multiline
                  textAlignVertical="top"
                  maxLength={maxLen}
                />
              </View>

              {/* Quick picks */}
              <View style={styles.quickRow}>
                <View style={styles.quickLeft}>
                  <Pressable
                    onPress={() =>
                      quickFill("Coffee, hikes, and spontaneous plans. Always down to explore new spots.")
                    }
                    style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.92 }]}
                  >
                    <Ionicons name="flash-outline" size={14} color={THEME.text} />
                    <Text style={styles.quickText}>Quick fill</Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      quickFill("Big on good vibes, good food, and weekend adventures. Say hi 👋")
                    }
                    style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.92 }]}
                  >
                    <Ionicons name="sparkles-outline" size={14} color={THEME.text} />
                    <Text style={styles.quickText}>Another</Text>
                  </Pressable>
                </View>

                <View style={styles.hint}>
                  <Ionicons
                    name={about.trim().length < minLen ? "information-circle-outline" : "checkmark-circle-outline"}
                    size={14}
                    color={about.trim().length < minLen ? THEME.warn : THEME.good}
                  />
                  <Text style={styles.hintText}>{hintText}</Text>
                </View>
              </View>

              {!!err && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={THEME.bad} />
                  <Text style={styles.errorText}>{err}</Text>
                </View>
              )}

              {!API_BASE ? (
                <View style={[styles.errorBox, { marginTop: 12 }]}>
                  <Ionicons name="bug-outline" size={18} color={THEME.bad} />
                  <Text style={styles.errorText}>Config issue: extra.apiBaseUrl is missing.</Text>
                </View>
              ) : null}

              {/* CTA */}
              <Pressable
                onPress={onNext}
                disabled={!canContinue}
                style={({ pressed }) => [
                  styles.primaryWrap,
                  (!canContinue || saving) && styles.primaryDisabled,
                  pressed && canContinue && !saving && styles.primaryPressed,
                ]}
              >
                <LinearGradient
                  colors={[THEME.ctaA, THEME.ctaB]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primary}
                >
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

              <Text style={styles.micro}>Keep it friendly — you can always edit later.</Text>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
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
  warn: "#FFB020",
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
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

  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 16,
  },

  // HERO
  hero: { paddingHorizontal: 2, gap: 10 },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stepPill: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepText: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 12,
    letterSpacing: 0.2,
  },

  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },

  h1: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 28,
    letterSpacing: -0.6,
  },
  h2: {
    color: THEME.muted,
    fontFamily: "Sora_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },

  // CARD
  card: {
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

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { color: THEME.muted, fontFamily: "Sora_700Bold", fontSize: 12 },

  counterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  counterPillHot: {
    backgroundColor: "rgba(255,176,32,0.12)",
    borderColor: "rgba(255,176,32,0.24)",
  },
  counterText: { color: THEME.muted, fontFamily: "Sora_700Bold", fontSize: 12 },
  counterTextHot: { color: "#FFE7B3" },

  textareaWrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 170,
  },
  textareaWrapFocused: {
    borderColor: "rgba(106,240,255,0.28)",
    backgroundColor: "rgba(106,240,255,0.06)",
  },

  textarea: {
    flex: 1,
    color: THEME.text,
    fontFamily: "Sora_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.15,
    lineHeight: 20,
  },

  quickRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  quickLeft: { flexDirection: "row", alignItems: "center", gap: 10 },

  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  quickText: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 12 },

  hint: { flexDirection: "row", alignItems: "center", gap: 8, opacity: 0.95 },
  hintText: { color: THEME.muted, fontFamily: "Sora_600SemiBold", fontSize: 12 },

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

  primaryWrap: { marginTop: 14, borderRadius: 18, overflow: "hidden" },
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
    marginTop: 12,
    color: "rgba(245,247,255,0.70)",
    fontFamily: "Sora_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
