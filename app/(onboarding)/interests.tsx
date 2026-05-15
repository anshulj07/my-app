// app/(onboarding)/interests.tsx — Step 4 of 6
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";

import heroImage from "../../assets/IMG_0016.png";

const STEP = 4;
const TOTAL = 6;
const MAX_SELECT = 8;
const MIN_SELECT = 3;
const COLS = 3;
const H_PAD = 20;
const GAP = 10;

type Interest = { label: string; icon: string };
type Category = { key: string; title: string; items: Interest[] };

const CATEGORIES: Category[] = [
  {
    key: "going_out",
    title: "Going Out",
    items: [
      { label: "Drinks", icon: "wine-outline" },
      { label: "Nightlife", icon: "moon-outline" },
      { label: "Rooftops", icon: "business-outline" },
      { label: "Karaoke", icon: "mic-outline" },
      { label: "Brunch", icon: "restaurant-outline" },
      { label: "Clubbing", icon: "musical-notes-outline" },
    ],
  },
  {
    key: "food",
    title: "Food & Drink",
    items: [
      { label: "Coffee", icon: "cafe-outline" },
      { label: "Foodie", icon: "restaurant-outline" },
      { label: "Sushi", icon: "fish-outline" },
      { label: "Boba", icon: "water-outline" },
      { label: "Cooking", icon: "flame-outline" },
      { label: "Wine", icon: "wine-outline" },
    ],
  },
  {
    key: "outdoors",
    title: "Outdoors",
    items: [
      { label: "Hiking", icon: "walk-outline" },
      { label: "Beach", icon: "partly-sunny-outline" },
      { label: "Camping", icon: "bonfire-outline" },
      { label: "Cycling", icon: "bicycle-outline" },
      { label: "Running", icon: "fitness-outline" },
      { label: "Road trips", icon: "car-outline" },
    ],
  },
  {
    key: "creative",
    title: "Arts & Culture",
    items: [
      { label: "Music", icon: "headset-outline" },
      { label: "Photography", icon: "camera-outline" },
      { label: "Dancing", icon: "body-outline" },
      { label: "Art", icon: "color-palette-outline" },
      { label: "Film", icon: "videocam-outline" },
      { label: "Theatre", icon: "ticket-outline" },
    ],
  },
  {
    key: "wellness",
    title: "Fitness & Wellness",
    items: [
      { label: "Gym", icon: "barbell-outline" },
      { label: "Yoga", icon: "leaf-outline" },
      { label: "Pilates", icon: "body-outline" },
      { label: "Meditation", icon: "moon-outline" },
      { label: "Spa days", icon: "flower-outline" },
      { label: "Sports", icon: "football-outline" },
    ],
  },
  {
    key: "entertainment",
    title: "Entertainment",
    items: [
      { label: "Gaming", icon: "game-controller-outline" },
      { label: "Anime", icon: "tv-outline" },
      { label: "Standup", icon: "happy-outline" },
      { label: "Concerts", icon: "musical-note-outline" },
      { label: "Podcasts", icon: "radio-outline" },
      { label: "Board games", icon: "dice-outline" },
    ],
  },
  {
    key: "tech",
    title: "Tech & Business",
    items: [
      { label: "Startups", icon: "rocket-outline" },
      { label: "AI", icon: "hardware-chip-outline" },
      { label: "Coding", icon: "code-slash-outline" },
      { label: "Hackathons", icon: "flash-outline" },
      { label: "Design", icon: "brush-outline" },
      { label: "Crypto", icon: "logo-bitcoin" },
    ],
  },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const HEADER_FULL = height * 0.28;

  const tileSize = Math.floor((width - H_PAD * 2 - GAP * (COLS - 1)) / COLS);

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const atLimit = selected.length >= MAX_SELECT;
  const canContinue = selected.length >= MIN_SELECT && !saving;

  const toggle = (label: string) => {
    setSelected((prev) => {
      if (prev.includes(label)) return prev.filter((x) => x !== label);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, label];
    });
  };

  const onNext = async () => {
    if (!isLoaded || !user || !canContinue) return;
    setSaving(true);
    setErr(null);
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, interests: selected } });
      router.push("/(onboarding)/about");
    } catch (e: any) {
      setErr(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>

      {/* Header with hero image */}
      <View style={[styles.header, { height: HEADER_FULL }]}>
        <Image source={heroImage} style={{ width, height: HEADER_FULL }} resizeMode="cover" />
        <View style={[styles.headerInner, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{selected.length}/{MAX_SELECT} selected</Text>
          </View>
        </View>
      </View>

      {/* White content */}
      <View style={[styles.content, { flex: 1 }]}>
        <View style={styles.contentHeader}>
          <Text style={styles.stepLabel}>STEP {STEP} OF {TOTAL}</Text>
          <Text style={styles.title}>What are you into?</Text>
          <Text style={styles.subtitle}>
            Pick at least {MIN_SELECT}. We'll match you with people who get it.
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        >
          {CATEGORIES.map((cat) => (
            <View key={cat.key} style={styles.section}>
              <Text style={styles.catLabel}>{cat.title}</Text>
              <View style={styles.grid}>
                {cat.items.map((it) => {
                  const on = selected.includes(it.label);
                  const disabled = !on && atLimit;
                  return (
                    <TouchableOpacity
                      key={it.label}
                      onPress={() => toggle(it.label)}
                      disabled={disabled}
                      activeOpacity={0.8}
                      style={[
                        styles.tile,
                        { width: tileSize, height: tileSize },
                        on && styles.tileOn,
                        disabled && styles.tileDisabled,
                      ]}
                    >
                      {on && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                      <Ionicons
                        name={it.icon as any}
                        size={26}
                        color={on ? "#fff" : "#6B46C1"}
                      />
                      <Text style={[styles.tileLabel, on && styles.tileLabelOn]} numberOfLines={1}>
                        {it.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {!!err && <Text style={styles.errText}>{err}</Text>}
        </ScrollView>
      </View>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!canContinue && selected.length > 0 && (
          <Text style={styles.nudge}>{MIN_SELECT - selected.length} more to go</Text>
        )}
        <TouchableOpacity
          onPress={onNext}
          disabled={!canContinue}
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ctaText}>
                {canContinue ? `Continue (${selected.length} selected)` : `Pick ${Math.max(0, MIN_SELECT - selected.length)} more`}
              </Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(onboarding)/about")} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#3D2875" },

  header: {
    overflow: "hidden",
    position: "relative",
  },
  headerInner: {
    paddingHorizontal: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  countPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  countPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  contentHeader: {
    paddingHorizontal: H_PAD,
    paddingTop: 24,
    paddingBottom: 12,
  },

  stepLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B46C1",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
  },

  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    gap: 24,
  },

  section: { gap: 10 },

  catLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#aaa",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },

  tile: {
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    position: "relative",
    borderWidth: 1.5,
    borderColor: "#E5E0F5",
  },
  tileOn: {
    backgroundColor: "#5B3FA0",
    borderColor: "#5B3FA0",
  },
  tileDisabled: { opacity: 0.3 },

  checkBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  tileLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#444",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  tileLabelOn: { color: "rgba(255,255,255,0.92)" },

  errText: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },

  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EDF8",
  },
  nudge: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#aaa",
    marginBottom: 8,
  },
  cta: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#5B3FA0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  ctaDisabled: { backgroundColor: "#C5B8E8" },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  skipBtn: { alignItems: "center", paddingVertical: 6 },
  skipText: { color: "#999", fontSize: 14, fontWeight: "600" },
});
