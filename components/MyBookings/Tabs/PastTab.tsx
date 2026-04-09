import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Pressable, RefreshControl, TouchableOpacity,
  Animated, SectionList, SectionListData, StyleSheet, ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiFetch } from "../../../lib/apiFetch";
import type { EventDoc } from "./CreatedTab";


// ─────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  inputBorder: "#E8E0D5",
  ink:         "#1C1A17",
  ink2:        "#3D3A34",
  muted:       "#8A8278",
  hint:        "#BCB6AD",
  teal:        "#3ECFB2",
  tealBg:      "#E8FAF7",
  tealText:    "#1A7A6A",
  coral:       "#FF6F6F",
  coralBg:     "#FFF0F0",
  coralText:   "#C0392B",
  amber:       "#F59E0B",
  amberBg:     "#FFFBEB",
  amberText:   "#92400E",
  purple:      "#A78BFA",
  purpleBg:    "#F3F0FF",
  purpleText:  "#5B21B6",
  green:       "#34D399",
  greenBg:     "#ECFDF5",
  greenText:   "#065F46",
  blue:        "#60A5FA",
  blueBg:      "#EFF6FF",
  blueText:    "#1D4ED8",
};
const R = { card: 20, input: 14, pill: 999 };

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
type PastDoc   = EventDoc & { _role?: "created" | "attended" };
type FilterKey = "all" | "created" | "attended";
type SectionT  = { title: string; hint: string; data: PastDoc[] };

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function eventStartMs(ev: EventDoc): number {
  if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
  const date = (ev.date ?? "").trim(); const time = (ev.time ?? "").trim();
  if (date && time) { const t = new Date(`${date}T${time}:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  if (date) { const t = new Date(`${date}T12:00:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  return Number.POSITIVE_INFINITY;
}
function fmtWhen(ev: EventDoc) {
  const ms = eventStartMs(ev);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "No time set";
  return new Date(ms).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function fmtWhere(ev: EventDoc) {
  const city = ev.location?.city?.trim(); const s = ev.location?.admin1Code?.trim(); const cc = ev.location?.countryCode?.trim();
  if (!city && !cc) return "Location not set";
  return `${city ?? ""}${s ? `, ${s}` : ""}${cc ? ` · ${cc}` : ""}`.trim();
}
function priceLabel(ev: EventDoc) {
  if (ev.kind === "free") return "FREE";
  return `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}`;
}
function kindLabel(ev: EventDoc) {
  if (ev.kind === "service") return "Service";
  if (ev.kind === "paid") return "Paid event";
  return "Free event";
}

// ─────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────
export default function PastTab({
  past, refreshing, onRefresh, onPressEvent,
}: {
  past: PastDoc[]; refreshing: boolean;
  onRefresh: () => void; onPressEvent: (ev: EventDoc) => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const createdCount  = past.filter(e => e._role === "created").length;
  const attendedCount = past.filter(e => e._role === "attended").length;

  const filtered = filter === "created"
    ? past.filter(e => e._role === "created")
    : filter === "attended"
    ? past.filter(e => e._role === "attended")
    : past;

  const sections: SectionT[] = filtered.length
    ? [{ title: "Past Events 📦", hint: "Events that have already ended", data: filtered }]
    : [];

  const FILTERS: { key: FilterKey; label: string; emoji: string; count: number }[] = [
    { key: "all",      label: "All",       emoji: "✨", count: past.length    },
    { key: "created",  label: "Created",   emoji: "⭐", count: createdCount   },
    { key: "attended", label: "Attended",  emoji: "🎟", count: attendedCount  },
  ];

  return (
    <View style={{ flex: 1 }}>
      <SectionList
        sections={sections as SectionListData<PastDoc>[]}
        keyExtractor={item => item._id}
        contentContainerStyle={T.list}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.teal} />}
        ListHeaderComponent={
          <View style={T.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {FILTERS.map(f => {
                const active  = filter === f.key;
                const hasCount = f.count > 0;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.8}
                    style={[T.chip, active && T.chipActive]}
                  >
                    <Text style={{ fontSize: 13 }}>{f.emoji}</Text>
                    <Text style={[T.chipText, active && T.chipTextActive]}>{f.label}</Text>
                    {hasCount && (
                      <View style={[T.chipCount, active && T.chipCountActive]}>
                        <Text style={[T.chipCountText, active && T.chipCountTextActive]}>{f.count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={T.empty}>
            <View style={T.emptyIcon}>
              <Text style={{ fontSize: 34 }}>📦</Text>
            </View>
            <Text style={T.emptyTitle}>
              {filter === "all" ? "No past events" : filter === "created" ? "No hosted events ended" : "No events attended yet"}
            </Text>
            <Text style={T.emptySub}>
              {filter === "all"
                ? "Created and attended events will appear here once ended."
                : filter === "created"
                ? "Your hosted events will appear here after they end."
                : "Events you joined will appear here after they end."}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }: any) => (
          <View style={T.sectionHeaderWrap}>
            <Text style={T.sectionLabel}>{section.title}</Text>
            {!!section.hint && <Text style={T.sectionHint}>{section.hint}</Text>}
            <View style={T.sectionDivider} />
          </View>
        )}
        renderItem={({ item, index }) => (
          <EventCard
            e={item} index={index}
            onPress={() => onPressEvent(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
      />

    </View>
  );
}


// ─────────────────────────────────────────────
//  EVENT CARD
// ─────────────────────────────────────────────
function EventCard({ e, index, onPress }: { e: PastDoc; index: number; onPress: () => void }) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
    ]).start();
  }, [a, y, index]);

  const attendeeCount  = Array.isArray(e.attendees) ? e.attendees.length : 0;
  const checkedInCount = Array.isArray(e.attendees) ? e.attendees.filter((a: any) => a.checkedIn).length : 0;
  const isCreated      = e._role === "created";
  const isAttended     = e._role === "attended";

  const kindCfg = e.kind === "service"
    ? { accent: C.purple, accentBg: C.purpleBg, accentText: C.purpleText, label: "Service" }
    : e.kind === "paid"
    ? { accent: C.amber,  accentBg: C.amberBg,  accentText: C.amberText,  label: "Paid event" }
    : { accent: C.teal,   accentBg: C.tealBg,   accentText: C.tealText,   label: "Free event" };

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [T.card, pressed && { transform: [{ scale: 0.985 }], borderColor: C.teal }]}
      >
        {/* Top row */}
        <View style={T.cardTop}>
          <View style={[T.emojiBox, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "33", opacity: 0.75 }]}>
            <Text style={{ fontSize: 24 }}>{e.emoji || "📍"}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[T.cardTitle, { opacity: 0.75 }]} numberOfLines={1}>{e.title}</Text>
            <View style={T.badgeRow}>
              {/* Kind badge */}
              <View style={[T.badge, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
                <Text style={[T.badgeText, { color: kindCfg.accentText }]}>{kindCfg.label}</Text>
              </View>
              {/* Ended badge */}
              <View style={[T.badge, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
                <Text style={[T.badgeText, { color: C.muted }]}>✓ Ended</Text>
              </View>
              {/* Role badge */}
              {isCreated && (
                <View style={[T.badge, { backgroundColor: C.amberBg, borderColor: C.amber + "55" }]}>
                  <Text style={[T.badgeText, { color: C.amberText }]}>⭐ Created</Text>
                </View>
              )}
              {isAttended && (
                <View style={[T.badge, { backgroundColor: C.blueBg, borderColor: C.blue + "55" }]}>
                  <Text style={[T.badgeText, { color: C.blueText }]}>🎟 Attended</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[T.pricePill, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
            <Text style={[T.priceText, { color: C.muted }]}>{priceLabel(e)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={T.divider} />

        {/* Meta */}
        <View style={T.metaGrid}>
          <View style={T.metaCell}>
            <Text style={T.metaLabel}>📅 When</Text>
            <Text style={T.metaValue} numberOfLines={1}>{fmtWhen(e)}</Text>
          </View>
          <View style={T.metaCell}>
            <Text style={T.metaLabel}>📍 Where</Text>
            <Text style={T.metaValue} numberOfLines={1}>{fmtWhere(e)}</Text>
          </View>
        </View>

        {/* Summary row */}
        <View style={T.summaryRow}>
          <View style={[T.summaryIcon, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
            <Text style={{ fontSize: 15 }}>🕐</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.summaryMain}>
              Event concluded
              {attendeeCount  > 0 ? ` · ${attendeeCount} attended`   : ""}
              {checkedInCount > 0 ? ` · ${checkedInCount} checked in` : ""}
            </Text>
            <Text style={T.summarySub}>Tap to view summary</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.hint} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────

const T = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  filterBar: { paddingBottom: 12, paddingTop: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
  },
  chipActive:         { backgroundColor: C.teal, borderColor: C.teal },
  chipText:           { color: C.muted, fontSize: 13, fontWeight: "700" },
  chipTextActive:     { color: "#FFFFFF" },
  chipCount:          { backgroundColor: C.inputBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: R.pill },
  chipCountActive:    { backgroundColor: "rgba(255,255,255,0.25)" },
  chipCountText:      { color: C.muted, fontSize: 10, fontWeight: "900" },
  chipCountTextActive:{ color: "#FFFFFF" },

  empty:     { alignItems: "center", paddingTop: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { color: C.ink, fontSize: 17, fontWeight: "900", marginBottom: 6 },
  emptySub:   { color: C.muted, fontSize: 13, fontWeight: "600", textAlign: "center", paddingHorizontal: 24 },

  sectionHeaderWrap: { paddingTop: 16, paddingBottom: 8 },
  sectionLabel:      { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 1.2 },
  sectionHint:       { fontSize: 12, color: C.hint, fontWeight: "600", marginTop: 2 },
  sectionDivider:    { height: 1.5, backgroundColor: C.cardBorder, marginTop: 10 },

  card: {
    backgroundColor: C.card,
    borderRadius: R.card, borderWidth: 1.5, borderColor: C.cardBorder,
    padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTop:   { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  emojiBox:  { width: 50, height: 50, borderRadius: 14, flexShrink: 0, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "900", color: C.ink, letterSpacing: -0.2, marginBottom: 6 },
  badgeRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge:     { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, borderWidth: 1.5 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  pricePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.pill, borderWidth: 1.5 },
  priceText: { fontSize: 12, fontWeight: "900" },

  divider:  { height: 1.5, backgroundColor: C.cardBorder, marginBottom: 12 },
  metaGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  metaCell: { flex: 1, backgroundColor: C.inputBg, borderRadius: R.input, borderWidth: 1.5, borderColor: C.inputBorder, padding: 10 },
  metaLabel:{ fontSize: 10, fontWeight: "800", color: C.hint, marginBottom: 3 },
  metaValue:{ fontSize: 12, fontWeight: "700", color: C.ink2 },

  summaryRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.inputBg, borderRadius: R.input,
    borderWidth: 1.5, borderColor: C.inputBorder,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  summaryIcon: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.inputBorder, alignItems: "center", justifyContent: "center",
  },
  summaryMain: { fontSize: 13, fontWeight: "800", color: C.muted, marginBottom: 1 },
  summarySub:  { fontSize: 11, fontWeight: "600", color: C.hint },
});
