// app/(onboarding)/gender.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";

const OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"] as const;
type GenderOption = (typeof OPTIONS)[number];

const THEME = {
  bgTop: "#0B0B12",
  bgMid: "#14102A",
  bgBot: "#090A10",

  text: "#F5F7FF",
  muted: "rgba(245,247,255,0.72)",
  placeholder: "rgba(245,247,255,0.35)",

  border: "rgba(255,255,255,0.14)",
  card: "rgba(255,255,255,0.06)",
  card2: "rgba(255,255,255,0.09)",

  ctaA: "#B8FF6A",
  ctaB: "#6AF0FF",

  good: "#34D399",
  bad: "#FB7185",
};

const ICON_FOR: Record<GenderOption, keyof typeof Ionicons.glyphMap> = {
  Male: "male-outline",
  Female: "female-outline",
  "Non-binary": "sparkles-outline",
  "Prefer not to say": "eye-off-outline",
  Other: "ellipsis-horizontal",
};

export default function GenderScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [selected, setSelected] = useState<GenderOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  // ---- Animations
  const pop = useRef(new Animated.Value(1)).current;
  const rowAnim = useRef<Record<string, Animated.Value>>({}).current;

  const getRowAnim = (k: string) => {
    if (!rowAnim[k]) rowAnim[k] = new Animated.Value(1);
    return rowAnim[k];
  };

  const bumpHeader = () => {
    pop.setValue(0.97);
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 180, useNativeDriver: true }).start();
  };

  const bumpRow = (k: string) => {
    const v = getRowAnim(k);
    v.setValue(0.985);
    Animated.spring(v, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
  };

  useEffect(() => {
    const load = async () => {
      if (!isLoaded || !user) return;

      setErr(null);
      setLoading(true);

      try {
        if (!API_BASE) throw new Error("Config issue: extra.apiBaseUrl is missing.");

        const res = await fetch(
          `${API_BASE.replace(/\/$/, "")}/api/onboarding/gender?clerkUserId=${encodeURIComponent(user.id)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
            },
          }
        );

        const text = await res.text();
        // if (!res.ok) {
        //   let msg = `Failed to load gender (${res.status}).`;
        //   try {
        //     const j = JSON.parse(text);
        //     msg = j?.message || j?.error || msg;
        //   } catch {}
        //   throw new Error(msg);
        // }

        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {}

        const g = data?.gender;
        if (typeof g === "string" && (OPTIONS as readonly string[]).includes(g)) {
          setSelected(g as GenderOption);
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load gender.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoaded, user?.id, API_BASE, EVENT_API_KEY]);

  const canContinue = useMemo(() => !!selected && !saving && !loading, [selected, saving, loading]);

  const onPick = (x: GenderOption) => {
    bumpHeader();
    bumpRow(x);
    setSelected(x);
  };

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) throw new Error("Config issue: extra.apiBaseUrl is missing.");
      if (!selected) throw new Error("Please select a gender.");

      const apiBase = API_BASE.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/onboarding/gender`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: user.id, gender: selected }),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `Failed to save gender (${res.status}).`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      router.push("/(onboarding)/interests");
    } catch (e: any) {
      setErr(e?.message || "Failed to save gender.");
    } finally {
      setSaving(false);
    }
  };

  const title = "Select your gender";
  const subtitle = "This helps personalize your profile. You can change it later.";

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[THEME.bgTop, THEME.bgMid, THEME.bgBot]} style={styles.bg}>
        {/* Top bar (match sign-in/name/interests) */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={THEME.text} />
          </TouchableOpacity>

          <Text style={styles.brandText}>Pulse</Text>

          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{title}</Text>
              <Text style={styles.h2}>{subtitle}</Text>
            </View>

            <Animated.View style={{ transform: [{ scale: pop }] }}>
              <View style={styles.stepPill}>
                <Ionicons name="male-female-outline" size={14} color={THEME.ctaB} />
                <Text style={styles.stepText}>Step 2 of 4</Text>
              </View>
            </Animated.View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={THEME.text} />
                <Text style={styles.loadingText}>Loading…</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {OPTIONS.map((x) => {
                  const on = selected === x;
                  const scale = getRowAnim(x);

                  return (
                    <Animated.View key={x} style={{ transform: [{ scale }] }}>
                      <Pressable
                        onPress={() => onPick(x)}
                        style={({ pressed }) => [
                          styles.option,
                          on && styles.optionOn,
                          pressed && styles.optionPressed,
                        ]}
                      >
                        <View style={[styles.optionIcon, on && styles.optionIconOn]}>
                          <Ionicons name={ICON_FOR[x]} size={16} color={on ? THEME.text : THEME.muted} />
                        </View>

                        <Text style={[styles.optionText, on && styles.optionTextOn]}>{x}</Text>

                        <View style={[styles.radio, on && styles.radioOn]}>
                          {on ? <View style={styles.radioDot} /> : null}
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            )}

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
                    <Text style={styles.primaryText}>{selected ? "Continue" : "Select an option"}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#0B0B12" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={styles.micro}>You can update this anytime from Settings.</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

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

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

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
  stepText: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 12, letterSpacing: 0.2 },

  card: {
    marginTop: 16,
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

  loadingWrap: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  loadingText: { color: THEME.muted, fontFamily: "Sora_600SemiBold" },

  list: { gap: 10, marginTop: 2 },

  option: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionPressed: { opacity: 0.95 },
  optionOn: {
    backgroundColor: "rgba(106,240,255,0.10)",
    borderColor: "rgba(106,240,255,0.28)",
  },

  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  optionIconOn: {
    backgroundColor: "rgba(184,255,106,0.10)",
    borderColor: "rgba(184,255,106,0.20)",
  },

  optionText: { flex: 1, color: THEME.text, fontFamily: "Sora_600SemiBold", fontSize: 14, letterSpacing: 0.2 },
  optionTextOn: { color: THEME.text },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  radioOn: {
    borderColor: "rgba(106,240,255,0.55)",
    backgroundColor: "rgba(106,240,255,0.16)",
  },
  radioDot: { width: 10, height: 10, borderRadius: 99, backgroundColor: THEME.ctaA },

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
