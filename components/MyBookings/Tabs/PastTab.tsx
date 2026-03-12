// components/MyBookings/Tabs/PastTab.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Pressable, RefreshControl, TouchableOpacity,
  Animated, SectionList, SectionListData, StyleSheet, ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles, COLORS } from "../MyBookingScreen.style";
import type { EventDoc } from "./CreatedTab";

// ✅ Extended with _role field set by MyBookingsScreen
type PastDoc = EventDoc & { _role?: "created" | "attended" };

type FilterKey = "all" | "created" | "attended";

type SectionT = { title: string; hint: string; data: PastDoc[] };

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

// ── Styles (must be before PastTab so TypeScript can infer types) ────────────
const P = StyleSheet.create({
  // Filter chips
  filterBar: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4,
  },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
    shadowColor: COLORS.brand, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  chipText: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  chipCount: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99,
  },
  chipCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  chipCountText: { color: COLORS.muted, fontSize: 10, fontWeight: "900" },
  chipCountTextActive: { color: "#fff" },
  // Role badges
  roleBadgeCreated: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99,
    backgroundColor: "rgba(251,191,36,0.12)", borderWidth: 1, borderColor: "rgba(251,191,36,0.25)",
  },
  roleBadgeAttended: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99,
    backgroundColor: "rgba(96,165,250,0.12)", borderWidth: 1, borderColor: "rgba(96,165,250,0.25)",
  },
  roleBadgeText: { fontSize: 10, fontWeight: "800" },
});

export default function PastTab({
  past, refreshing, onRefresh, onPressEvent,
}: {
  past: PastDoc[];
  refreshing: boolean;
  onRefresh: () => void;
  onPressEvent: (ev: EventDoc) => void;
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
    ? [{ title: "Past Events", hint: "Events that have already ended", data: filtered }]
    : [];

  const FILTERS: { key: FilterKey; label: string; icon: string; count: number }[] = [
    { key: "all",      label: "All",          icon: "layers-outline",  count: past.length },
    { key: "created",  label: "Created",      icon: "star-outline",    count: createdCount },
    { key: "attended", label: "I Attended",   icon: "ticket-outline",  count: attendedCount },
  ];

  return (
    <SectionList
      sections={sections as SectionListData<PastDoc>[]}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
      ListHeaderComponent={
        <View style={P.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {FILTERS.map(f => {
              const active = filter === f.key;
              const hasCount = f.count > 0;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.75}
                  style={[P.chip, active && P.chipActive]}
                >
                  <Ionicons
                    name={f.icon as any}
                    size={12}
                    color={active ? "#fff" : COLORS.muted}
                  />
                  <Text style={[P.chipText, active && P.chipTextActive]}>
                    {f.label}
                  </Text>
                  {hasCount && (
                    <View style={[P.chipCount, active && P.chipCountActive]}>
                      <Text style={[P.chipCountText, active && P.chipCountTextActive]}>
                        {f.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
          <Text style={styles.emptyTitle}>
            {filter === "all" ? "No past events" : filter === "created" ? "No created events ended" : "No events attended yet"}
          </Text>
          <Text style={styles.emptySub}>
            {filter === "all"
              ? "Created and attended events will appear here once ended."
              : filter === "created"
              ? "Your hosted events will appear here after they end."
              : "Events you joined will appear here after they end."}
          </Text>
        </View>
      }
      renderSectionHeader={({ section }: any) => (
        <View style={styles.sectionHeaderWrap}>
          <View style={styles.sectionHeaderTop}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {!!section.hint && <Text style={styles.sectionHint}>{section.hint}</Text>}
          </View>
          <View style={styles.sectionDivider} />
        </View>
      )}
      renderItem={({ item, index }) => (
        <EventCard e={item} index={index} onPress={() => onPressEvent(item)} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

function EventCard({ e, index, onPress }: { e: PastDoc; index: number; onPress: () => void }) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
    ]).start();
  }, []);

  const attendeeCount  = Array.isArray(e.attendees) ? e.attendees.length : 0;
  const checkedInCount = Array.isArray(e.attendees) ? e.attendees.filter((a: any) => a.checkedIn).length : 0;

  // ✅ role badge
  const isCreated  = e._role === "created";
  const isAttended = e._role === "attended";

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
        style={({ pressed }) => [
          styles.card,
          { borderColor: pressed ? COLORS.brand : COLORS.border },
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={styles.emojiPill}>
            <Text style={styles.emojiTxt}>{e.emoji || "📍"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{e.title}</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" style={{ marginLeft: "auto" }} />
            </View>
            <View style={styles.badgesRow}>
              {/* Kind badge */}
              <View style={StyleSheet.flatten([styles.badge, e.kind === "service" ? styles.badgeService : styles.badgeFree])}>
                <Ionicons name={e.kind === "service" ? "sparkles" : e.kind === "paid" ? "card" : "leaf"} size={12} color="#fff" />
                <Text style={styles.badgeText}>{kindLabel(e)}</Text>
              </View>
              {/* Ended badge */}
              <View style={StyleSheet.flatten([styles.badge, styles.badgePaused])}>
                <Ionicons name="checkmark-done" size={12} color="#fff" />
                <Text style={styles.badgeText}>Ended</Text>
              </View>
              {/* ✅ Role badge */}
              {isCreated && (
                <View style={P.roleBadgeCreated}>
                  <Ionicons name="star" size={10} color="#FBBF24" />
                  <Text style={[P.roleBadgeText, { color: "#FBBF24" }]}>Created</Text>
                </View>
              )}
              {isAttended && (
                <View style={P.roleBadgeAttended}>
                  <Ionicons name="ticket" size={10} color="#60A5FA" />
                  <Text style={[P.roleBadgeText, { color: "#60A5FA" }]}>Attended</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.rightCol}>
            <View style={styles.pricePill}>
              <Text style={styles.priceTxt}>{priceLabel(e)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>When</Text>
            <Text style={styles.metaValue} numberOfLines={1}>{fmtWhen(e)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Where</Text>
            <Text style={styles.metaValue} numberOfLines={1}>{fmtWhere(e)}</Text>
          </View>
        </View>

        <View style={styles.actionSub}>
          <View style={[styles.actionIconBox, { backgroundColor: COLORS.muted }]}>
            <Ionicons name="time" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTextMain}>
              Event concluded
              {attendeeCount  > 0 ? ` · ${attendeeCount} attended`  : ""}
              {checkedInCount > 0 ? ` · ${checkedInCount} checked in` : ""}
            </Text>
            <Text style={styles.actionTextSub}>Tap to view summary</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={COLORS.muted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

