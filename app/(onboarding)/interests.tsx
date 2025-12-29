// app/(onboarding)/interests.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";

const MAX_SELECT = 6;

type Accent = "pink" | "orange" | "blue" | "green" | "purple";

type Category = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: Accent;
  items: { label: string; emoji: string }[];
};

const CATEGORIES: Category[] = [
  {
    key: "lifestyle",
    title: "Lifestyle",
    icon: "sparkles-outline",
    accent: "pink",
    items: [
      { label: "Gym", emoji: "🏋️‍♂️" },
      { label: "Coffee", emoji: "☕️" },
      { label: "Cooking", emoji: "👨‍🍳" },
      { label: "Foodie", emoji: "🍣" },
      { label: "Nightlife", emoji: "🌙🥂" },
      { label: "Self care", emoji: "🧖‍♀️✨" },
    ],
  },
  {
    key: "outdoors",
    title: "Outdoors",
    icon: "trail-sign-outline",
    accent: "orange",
    items: [
      { label: "Hiking", emoji: "🥾⛰️" },
      { label: "Camping", emoji: "🏕️🔥" },
      { label: "Road trips", emoji: "🚗💨" },
      { label: "Beaches", emoji: "🏖️🌊" },
      { label: "Cycling", emoji: "🚴‍♂️" },
      { label: "Nature", emoji: "🌿🦋" },
    ],
  },
  {
    key: "creative",
    title: "Creative",
    icon: "color-palette-outline",
    accent: "purple",
    items: [
      { label: "Photography", emoji: "📸✨" },
      { label: "Music", emoji: "🎧🎶" },
      { label: "Dancing", emoji: "💃🪩" },
      { label: "Art", emoji: "🎨" },
      { label: "Writing", emoji: "✍️📓" },
      { label: "Design", emoji: "🧩🖌️" },
    ],
  },
  {
    key: "entertainment",
    title: "Entertainment",
    icon: "film-outline",
    accent: "blue",
    items: [
      { label: "Movies", emoji: "🎬🍿" },
      { label: "TV shows", emoji: "📺" },
      { label: "Anime", emoji: "🌸🍥" },
      { label: "Gaming", emoji: "🎮⚡️" },
      { label: "Standup", emoji: "🎤😂" },
      { label: "Karaoke", emoji: "🎙️✨" },
    ],
  },
  {
    key: "tech",
    title: "Tech",
    icon: "hardware-chip-outline",
    accent: "green",
    items: [
      { label: "AI", emoji: "🤖🧠" },
      { label: "Startups", emoji: "🚀" },
      { label: "Coding", emoji: "💻" },
      { label: "Product", emoji: "🧩📈" },
      { label: "Hackathons", emoji: "⚡️🏆" },
      { label: "Gadgets", emoji: "📱✨" },
    ],
  },
];

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

  // subtle brand tints used in chips
  pink: "rgba(255,77,109,0.18)",
  orange: "rgba(255,138,0,0.16)",
  blue: "rgba(10,132,255,0.16)",
  green: "rgba(34,197,94,0.15)",
  purple: "rgba(168,85,247,0.15)",
};

const ACCENT: Record<Accent, { tint: string; ring: string; dot: string }> = {
  pink: { tint: THEME.pink, ring: "rgba(255,77,109,0.30)", dot: "#FF4D6D" },
  orange: { tint: THEME.orange, ring: "rgba(255,138,0,0.28)", dot: "#FF8A00" },
  blue: { tint: THEME.blue, ring: "rgba(10,132,255,0.26)", dot: "#0A84FF" },
  green: { tint: THEME.green, ring: "rgba(34,197,94,0.26)", dot: "#22C55E" },
  purple: { tint: THEME.purple, ring: "rgba(168,85,247,0.26)", dot: "#A855F7" },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function InterestsScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const canContinue = useMemo(() => selected.length >= 1 && !saving, [selected.length, saving]);
  const atLimit = selected.length >= MAX_SELECT;

  // ---- Animations ----
  const animByKey = useRef<Record<string, Animated.Value>>({});
  const getAnim = (k: string) => {
    if (!animByKey.current[k]) animByKey.current[k] = new Animated.Value(1);
    return animByKey.current[k];
  };

  const countPop = useRef(new Animated.Value(1)).current;
  const progress = selected.length / MAX_SELECT;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // keep progress smooth when selected changes
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const popCount = () => {
    countPop.setValue(0.96);
    Animated.spring(countPop, { toValue: 1, friction: 6, tension: 180, useNativeDriver: true }).start();
  };

  const bump = (k: string) => {
    const v = getAnim(k);
    v.setValue(0.98);
    Animated.spring(v, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }).start();
  };

  const toggle = (label: string) => {
    setSelected((prev) => {
      const on = prev.includes(label);
      if (on) {
        bump(label);
        popCount();
        return prev.filter((x) => x !== label);
      }
      if (prev.length >= MAX_SELECT) {
        // small shake-ish bump to show limit
        bump(label);
        return prev;
      }
      bump(label);
      popCount();
      return [...prev, label];
    });
  };

  const clearAll = () => {
    setSelected([]);
    popCount();
  };

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) throw new Error("Config issue: extra.apiBaseUrl is missing.");

      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/onboarding/interests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          interests: selected,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `Failed to save interests (${res.status}).`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      router.push("/(onboarding)/about");
    } catch (e: any) {
      setErr(e?.message || "Failed to save interests.");
    } finally {
      setSaving(false);
    }
  };

  const title = "Your interests";
  const subtitle = `Pick up to ${MAX_SELECT}. Mix it up—this improves matches.`;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[THEME.bgTop, THEME.bgMid, THEME.bgBot]} style={styles.bg}>
        {/* Top bar (same style as name/sign-in) */}
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

            <Animated.View style={{ transform: [{ scale: countPop }] }}>
              <View style={styles.countPill}>
                <Ionicons name="sparkles" size={14} color={THEME.ctaB} />
                <Text style={styles.countText}>
                  {selected.length}/{MAX_SELECT}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={[THEME.ctaA, THEME.ctaB]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              {CATEGORIES.map((cat) => {
                const a = ACCENT[cat.accent];
                return (
                  <View key={cat.key} style={styles.section}>
                    <View style={styles.sectionTop}>
                      <View style={[styles.sectionBadge, { backgroundColor: a.tint, borderColor: a.ring }]}>
                        <View style={[styles.sectionDot, { backgroundColor: a.dot }]} />
                        <Ionicons name={cat.icon} size={16} color={THEME.text} />
                        <Text style={styles.sectionTitle}>{cat.title}</Text>
                      </View>

                      <Text style={styles.sectionHint}>
                        {atLimit ? "Max reached" : "Tap to select"}
                      </Text>
                    </View>

                    <View style={styles.grid}>
                      {cat.items.map((it) => {
                        const on = selected.includes(it.label);
                        const disabled = !on && atLimit;
                        const scale = getAnim(it.label);

                        return (
                          <Animated.View key={it.label} style={{ transform: [{ scale }] }}>
                            <Pressable
                              onPress={() => toggle(it.label)}
                              disabled={disabled}
                              style={({ pressed }) => [
                                styles.tile,
                                on && styles.tileOn,
                                disabled && styles.tileDisabled,
                                pressed && !disabled && styles.tilePressed,
                              ]}
                            >
                              <Text style={styles.tileEmoji}>{it.emoji}</Text>
                              <Text style={[styles.tileText, on && styles.tileTextOn]} numberOfLines={1}>
                                {it.label}
                              </Text>

                              <View style={[styles.tick, on && styles.tickOn]}>
                                <Ionicons
                                  name="checkmark"
                                  size={14}
                                  color={on ? "#0B0B12" : "transparent"}
                                />
                              </View>
                            </Pressable>
                          </Animated.View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

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
            </ScrollView>

            {/* Sticky action bar */}
            <View style={styles.sticky}>
              <View style={styles.stickyTopRow}>
                <View style={styles.selectedRow}>
                  <Ionicons name="heart" size={16} color={THEME.ctaB} />
                  <Text style={styles.selectedText}>
                    Selected{" "}
                    <Text style={{ color: THEME.text, fontFamily: "Sora_700Bold" }}>
                      {selected.length}
                    </Text>
                    /{MAX_SELECT}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={clearAll}
                  disabled={selected.length === 0 || saving}
                  style={[styles.clearBtn, (selected.length === 0 || saving) && { opacity: 0.45 }]}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>

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

              <Text style={styles.micro}>Tip: you can change these later in Settings.</Text>
            </View>
          </View>

          <Text style={styles.stepText}>Step 2 of 4</Text>
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
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },

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

  countPill: {
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
  countText: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 12, letterSpacing: 0.2 },

  card: {
    marginTop: 16,
    flex: 1,
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
    overflow: "hidden",
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },

  section: { marginBottom: 18 },

  sectionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionTitle: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 13, letterSpacing: 0.2 },
  sectionHint: { color: THEME.muted, fontFamily: "Sora_600SemiBold", fontSize: 12 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tilePressed: { opacity: 0.95 },
  tileOn: {
    backgroundColor: "rgba(106,240,255,0.10)",
    borderColor: "rgba(106,240,255,0.28)",
  },
  tileDisabled: { opacity: 0.45 },

  tileEmoji: { fontSize: 16 },
  tileText: {
    color: THEME.text,
    fontFamily: "Sora_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.2,
    maxWidth: 140,
  },
  tileTextOn: { color: THEME.text },

  tick: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  tickOn: {
    backgroundColor: THEME.ctaA,
    borderColor: "rgba(255,255,255,0.18)",
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

  sticky: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 18,
    padding: 12,
    backgroundColor: THEME.card2,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },

  stickyTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  selectedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectedText: { color: THEME.muted, fontFamily: "Sora_600SemiBold", fontSize: 12 },

  clearBtn: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 12, letterSpacing: 0.2 },

  primaryWrap: { marginTop: 10, borderRadius: 18, overflow: "hidden" },
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
    marginTop: 10,
    color: "rgba(245,247,255,0.70)",
    fontFamily: "Sora_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  stepText: {
    marginTop: 14,
    color: "rgba(245,247,255,0.65)",
    fontFamily: "Sora_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
});
