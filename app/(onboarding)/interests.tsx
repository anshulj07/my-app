// app/(onboarding)/interests.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";

const MAX_SELECT = 6;

type Category = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: "pink" | "orange" | "blue" | "green" | "purple";
  items: { label: string; emoji: string }[];
};

const CATEGORIES: Category[] = [
  {
    key: "lifestyle",
    title: "Lifestyle",
    icon: "sparkles-outline",
    accent: "pink",
    items: [
      { label: "Gym", emoji: "🏋️" },
      { label: "Coffee", emoji: "☕" },
      { label: "Cooking", emoji: "🍳" },
      { label: "Foodie", emoji: "🍜" },
      { label: "Nightlife", emoji: "🥂" },
      { label: "Self care", emoji: "🧖" },
    ],
  },
  {
    key: "outdoors",
    title: "Outdoors",
    icon: "trail-sign-outline",
    accent: "orange",
    items: [
      { label: "Hiking", emoji: "🥾" },
      { label: "Camping", emoji: "🏕️" },
      { label: "Road trips", emoji: "🚗" },
      { label: "Beaches", emoji: "🏖️" },
      { label: "Cycling", emoji: "🚴" },
      { label: "Nature", emoji: "🌿" },
    ],
  },
  {
    key: "creative",
    title: "Creative",
    icon: "color-palette-outline",
    accent: "purple",
    items: [
      { label: "Photography", emoji: "📸" },
      { label: "Music", emoji: "🎧" },
      { label: "Dancing", emoji: "💃" },
      { label: "Art", emoji: "🎨" },
      { label: "Writing", emoji: "✍️" },
      { label: "Design", emoji: "🧩" },
    ],
  },
  {
    key: "entertainment",
    title: "Entertainment",
    icon: "film-outline",
    accent: "blue",
    items: [
      { label: "Movies", emoji: "🎬" },
      { label: "TV shows", emoji: "📺" },
      { label: "Anime", emoji: "🍥" },
      { label: "Gaming", emoji: "🎮" },
      { label: "Standup", emoji: "🎤" },
      { label: "Karaoke", emoji: "🎙️" },
    ],
  },
  {
    key: "tech",
    title: "Tech",
    icon: "hardware-chip-outline",
    accent: "green",
    items: [
      { label: "AI", emoji: "🤖" },
      { label: "Startups", emoji: "🚀" },
      { label: "Coding", emoji: "💻" },
      { label: "Product", emoji: "🧠" },
      { label: "Hackathons", emoji: "⚡" },
      { label: "Gadgets", emoji: "📱" },
    ],
  },
];

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

const ACCENT = {
  pink: { bg: "rgba(255,77,109,0.14)", border: "rgba(255,77,109,0.28)", dot: "#FF4D6D" },
  orange: { bg: "rgba(255,138,0,0.13)", border: "rgba(255,138,0,0.26)", dot: "#FF8A00" },
  blue: { bg: "rgba(10,132,255,0.14)", border: "rgba(10,132,255,0.26)", dot: "#0A84FF" },
  green: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.24)", dot: "#22C55E" },
  purple: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.24)", dot: "#A855F7" },
} as const;

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

  const toggle = (label: string) => {
    setSelected((prev) => {
      if (prev.includes(label)) return prev.filter((x) => x !== label);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, label];
    });
  };

  const onNext = async () => {
    if (!isLoaded || !user) return;
    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        {/* Top glow header */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>
                Step 2 of 4 • {selected.length}/{MAX_SELECT}
              </Text>
            </View>

            <View style={styles.spark}>
              <Ionicons name="sparkles" size={16} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.h1}>What are you into?</Text>
          <Text style={styles.h2}>Pick up to {MAX_SELECT}. Mix it up—this improves matches.</Text>
        </View>

        {/* Full screen card */}
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {CATEGORIES.map((cat) => {
              const a = ACCENT[cat.accent];
              return (
                <View key={cat.key} style={styles.section}>
                  <View style={styles.sectionTop}>
                    <View style={[styles.sectionBadge, { backgroundColor: a.bg, borderColor: a.border }]}>
                      <View style={[styles.sectionDot, { backgroundColor: a.dot }]} />
                      <Ionicons name={cat.icon} size={16} color={COLORS.ink} />
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

                      return (
                        <TouchableOpacity
                          key={it.label}
                          activeOpacity={0.92}
                          disabled={disabled}
                          onPress={() => toggle(it.label)}
                          style={[
                            styles.tile,
                            on && styles.tileOn,
                            disabled && styles.tileDisabled,
                          ]}
                        >
                          <Text style={styles.tileEmoji}>{it.emoji}</Text>
                          <Text style={[styles.tileText, on && styles.tileTextOn]} numberOfLines={1}>
                            {it.label}
                          </Text>

                          {/* <View style={[styles.tick, on && styles.tickOn]}>
                            <Ionicons name="checkmark" size={14} color={on ? "#0B0B12" : "transparent"} />
                          </View> */}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {!!err && (
              <View style={styles.alert}>
                <View style={styles.alertIcon}>
                  <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
                </View>
                <Text style={styles.alertText}>{err}</Text>
              </View>
            )}

            {!API_BASE ? (
              <View style={[styles.alert, { marginTop: 12 }]}>
                <View style={styles.alertIcon}>
                  <Ionicons name="bug-outline" size={18} color={COLORS.danger} />
                </View>
                <Text style={styles.alertText}>Config issue: extra.apiBaseUrl is missing.</Text>
              </View>
            ) : null}

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

            <Text style={styles.footer}>
              Tip: you can change these later in Settings.
            </Text>
          </ScrollView>

          {/* Sticky selected bar */}
          {/* <View style={styles.selectedBar}>
            <View style={styles.selectedLeft}>
              <Ionicons name="heart" size={16} color={COLORS.primary2} />
              <Text style={styles.selectedText}>
                Selected {selected.length}/{MAX_SELECT}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              disabled={selected.length === 0}
              onPress={() => setSelected([])}
              style={[styles.clearBtn, selected.length === 0 && { opacity: 0.4 }]}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  // CARD (full-screen)
  card: {
    flex: 1,
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
  sectionTitle: { color: COLORS.ink, fontWeight: "900", fontSize: 13, letterSpacing: 0.2 },
  sectionHint: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },

  // Tiles grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,

    // compact pill
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,

    // NO fixed width / height
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  tileOn: {
    backgroundColor: "rgba(255,77,109,0.18)",
    borderColor: "rgba(255,77,109,0.35)",
  },

  tileDisabled: { opacity: 0.45 },

  tileEmoji: { fontSize: 16 },

  tileText: {
    color: COLORS.ink,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.2,
  },

  tileTextOn: { color: "#fff" },

  // make tick smaller so it doesn’t eat space
  tick: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  tickOn: {
    backgroundColor: COLORS.primary2,
    borderColor: "rgba(255,255,255,0.22)",
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

  // Sticky selected bar
  selectedBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  selectedLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectedText: { color: COLORS.inkSoft, fontWeight: "900" },

  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  clearText: { color: COLORS.ink, fontWeight: "900" },

  footer: {
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: 10,
    marginTop: 12,
    lineHeight: 18,
    marginBottom: 74, // space for sticky bar
  },
});
