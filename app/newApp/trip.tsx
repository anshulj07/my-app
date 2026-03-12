// app/newApp/trip.tsx
// 🆕 REPLACED — old "My Trips" (joined events) → now "Explore" (discover new events)
// Old trip.tsx content (GoingTab logic) has moved to:
//   → MyBookingsScreen.tsx  (Going tab)
//   → GoingTab.tsx          (the actual cards)

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, StyleSheet, Platform, StatusBar,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { apiFetch } from "../../lib/apiFetch";

const BRAND  = "#FF4D6D";
const BG     = "#FFF7FA";
const CARD   = "#FFFFFF";
const MUTED  = "#6B7280";
const BORDER = "#F3F4F6";
const TEXT   = "#111827";

type DateFilter = "today" | "tomorrow" | "weekend" | "custom";
type KindFilter = "all" | "free" | "paid";

type Event = {
  _id: string;
  emoji?: string;
  title: string;
  kind: "free" | "paid" | "service";
  priceCents?: number;
  date?: string;
  time?: string;
  startsAt?: string;
  joinPolicy?: "open" | "approval";
  attendance?: number;
  attendees?: any[];
  location?: { formattedAddress?: string; city?: string; admin1?: string; admin1Code?: string; countryCode?: string };
  creatorName?: string;
  status?: string;
};

function getDateRange(filter: DateFilter, custom: string): { from: string; to: string } | null {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (filter === "today")    { const s = fmt(now); return { from: s, to: s }; }
  if (filter === "tomorrow") { const t = new Date(now); t.setDate(t.getDate() + 1); const s = fmt(t); return { from: s, to: s }; }
  if (filter === "weekend")  {
    const day = now.getDay();
    const daysToSat = day === 0 ? 6 : 6 - day;
    const sat = new Date(now); sat.setDate(now.getDate() + daysToSat);
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
    return { from: fmt(sat), to: fmt(sun) };
  }
  if (filter === "custom" && custom) return { from: custom, to: custom };
  return null;
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [customDate, setCustomDate] = useState("");
  const [events,     setEvents]     = useState<Event[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [city,       setCity]       = useState("");

  // Auto-detect city once
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const rev = await Location.reverseGeocodeAsync({ latitude: cur.coords.latitude, longitude: cur.coords.longitude });
        setCity((rev?.[0]?.city || "").trim());
      } catch { }
    })();
  }, []);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
  }), [EVENT_API_KEY]);

  const load = useCallback(async () => {
    if (!API_BASE) return;
    setLoading(true);
    try {
      const range  = getDateRange(dateFilter, customDate);
      const params = new URLSearchParams({ limit: "100", upcomingOnly: "true" });
      if (kindFilter !== "all") params.set("kind", kindFilter);
      if (city) params.set("city", city);
      if (range) { params.set("dateFrom", range.from); params.set("dateTo", range.to); }

      const res  = await apiFetch(`${API_BASE}/api/events/get-events?${params}`, { method: "GET", headers });
      const json = await res.json().catch(() => ({}));
      setEvents(Array.isArray(json?.events) ? json.events : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE, headers, dateFilter, kindFilter, city, customDate]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const dateTabs: { key: DateFilter; label: string }[] = [
    { key: "today",    label: "Today"    },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "weekend",  label: "Weekend"  },
    { key: "custom",   label: "📅 Pick"  },
  ];
  const kindTabs: { key: KindFilter; label: string; activeColor: string }[] = [
    { key: "all",  label: "All",  activeColor: BRAND },
    { key: "free", label: "Free", activeColor: "#00C67F" },
    { key: "paid", label: "Paid", activeColor: "#7C3AED" },
  ];

  const TOP = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + insets.top + 8;

  return (
    <View style={[S.screen, { paddingTop: TOP }]}>

      {/* Header */}
      <View style={S.header}>
        <Text style={S.title}>Explore</Text>
        <Text style={S.subtitle}>
          {city ? `📍 ${city}` : "📍 Nearby"}
          {"  ·  "}
          <Text style={{ color: events.length > 0 ? BRAND : MUTED, fontWeight: "800" }}>
            {loading ? "…" : `${events.length} events`}
          </Text>
        </Text>
      </View>

      {/* Date filter chips */}
      {/* Date filter chips */}
      <View style={{ height: 48, marginBottom: 2 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterRow}>
        {dateTabs.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setDateFilter(t.key)}
            style={[S.pill, dateFilter === t.key && S.pillActive]}
            activeOpacity={0.8}
          >
            <Text style={[S.pillText, dateFilter === t.key && S.pillTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Custom date input */}
      {dateFilter === "custom" && (
        <View style={S.customRow}>
          <Ionicons name="calendar-outline" size={16} color={MUTED} />
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor={MUTED}
            value={customDate}
            onChangeText={setCustomDate}
            onSubmitEditing={load}
            style={S.customInput}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      )}

      {/* Kind filter */}
      <View style={[S.kindRow, { marginBottom: 10 }]}>
        {kindTabs.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setKindFilter(t.key)}
            style={[S.kindPill, kindFilter === t.key && { backgroundColor: t.activeColor, borderColor: t.activeColor }]}
            activeOpacity={0.8}
          >
            <Text style={[S.kindText, kindFilter === t.key && { color: "#fff" }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {loading && !refreshing ? (
        <View style={S.center}><ActivityIndicator color={BRAND} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
        >
          {events.length === 0 ? (
            <View style={S.empty}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
              <Text style={S.emptyTitle}>No events found</Text>
              <Text style={S.emptySub}>
                Try a different date or kind filter
              </Text>
            </View>
          ) : (
            events.map(ev => (
              <EventCard
                key={ev._id}
                ev={ev}
                onPress={() => router.push({
                  pathname: "/event-interest/[eventId]" as any,
                  params: { eventId: ev._id, kind: ev.kind, title: ev.title, emoji: ev.emoji || "📍" },
                })}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── EventCard ────────────────────────────────────────────────────
function EventCard({ ev, onPress }: { ev: Event; onPress: () => void }) {
  const joined   = Array.isArray(ev.attendees) ? ev.attendees.length : 0;
  const capacity = ev.attendance ?? null;
  const full     = capacity != null && joined >= capacity;
  const pct      = capacity ? Math.min(100, (joined / capacity) * 100) : 30;
  const location = ev.location?.city
    ? [ev.location.city, ev.location.admin1 || ev.location.admin1Code].filter(Boolean).join(", ")
    : ev.location?.formattedAddress ?? "";

  return (
    <TouchableOpacity style={S.card} onPress={onPress} activeOpacity={0.88}>
      <View style={S.cardTop}>
        <View style={S.emojiBox}>
          <Text style={{ fontSize: 26 }}>{ev.emoji || "📍"}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={S.cardTitle} numberOfLines={1}>{ev.title}</Text>
          {!!location && <Text style={S.cardMeta} numberOfLines={1}>📍 {location}</Text>}
          {!!(ev.date || ev.time) && (
            <Text style={S.cardMeta}>🕐 {[ev.date, ev.time].filter(Boolean).join("  ·  ")}</Text>
          )}
        </View>
        <View style={[S.priceBadge, ev.kind === "paid" && S.priceBadgePaid]}>
          <Text style={[S.priceText, ev.kind === "paid" && S.priceTextPaid]}>
            {ev.kind === "paid" ? `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}` : "FREE"}
          </Text>
        </View>
      </View>

      {/* Capacity bar */}
      <View style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={S.capLabel}>
            {ev.joinPolicy === "approval" ? "🔒 Approval" : "🟢 Open"}
          </Text>
          <Text style={[S.capVal, full && { color: "#F87171" }]}>
            {joined}{capacity ? ` / ${capacity}` : " joined"}
            {full ? "  ·  Full" : capacity ? `  ·  ${capacity - joined} left` : ""}
          </Text>
        </View>
        <View style={S.barBg}>
          <View style={[S.barFill, { width: `${pct}%` as any, backgroundColor: full ? "#F87171" : BRAND }]} />
        </View>
      </View>

      {/* Host */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={S.hostDot}>
          <Text style={{ color: BRAND, fontSize: 12, fontWeight: "900" }}>
            {(ev.creatorName || "H")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={S.hostName}>{ev.creatorName || "Host"}</Text>
        <Ionicons name="chevron-forward" size={16} color={MUTED} style={{ marginLeft: "auto" }} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const S = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: BG },
  header:   { paddingHorizontal: 20, marginBottom: 14 },
  title:    { color: TEXT, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: MUTED, fontSize: 13, fontWeight: "600", marginTop: 2, marginBottom: 2 },

  filterRow: { paddingHorizontal: 20, paddingBottom: 4, gap: 8, marginBottom: 10 },
  pill:      { paddingHorizontal: 16, height: 38, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, alignItems: "center", justifyContent: "center" },
  pillActive:{ backgroundColor: BRAND, borderColor: BRAND },
  pillText:  { color: MUTED, fontSize: 13, fontWeight: "800" },
  pillTextActive: { color: "#fff" },

  customRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: CARD, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  customInput: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "700" },

  kindRow:  { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  kindPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: BORDER, backgroundColor: CARD },
  kindText: { color: MUTED, fontSize: 13, fontWeight: "800" },

  list:  { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },
  center:{ flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { color: TEXT, fontSize: 18, fontWeight: "900", marginBottom: 6 },
  emptySub:   { color: MUTED, fontSize: 14, fontWeight: "600", textAlign: "center" },

  card: {
    backgroundColor: CARD, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: BORDER, marginBottom: 12,
  },
  cardTop: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  emojiBox:{
    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
    backgroundColor: "rgba(255,77,109,0.10)", borderWidth: 1, borderColor: "rgba(255,77,109,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  cardTitle: { color: TEXT, fontSize: 15, fontWeight: "800" },
  cardMeta:  { color: MUTED, fontSize: 12, fontWeight: "600", marginTop: 2 },

  priceBadge: { padding: 6, borderRadius: 10, backgroundColor: "rgba(0,198,127,0.12)", borderWidth: 1, borderColor: "rgba(0,198,127,0.20)", flexShrink: 0 },
  priceBadgePaid: { backgroundColor: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.25)" },
  priceText: { color: "#00C67F", fontSize: 11, fontWeight: "900" },
  priceTextPaid: { color: "#A78BFA" },

  capLabel: { color: MUTED, fontSize: 11, fontWeight: "700" },
  capVal:   { color: TEXT, fontSize: 11, fontWeight: "800" },
  barBg:    { height: 4, backgroundColor: "#F3F4F6", borderRadius: 99, overflow: "hidden" },
  barFill:  { height: "100%" as any, borderRadius: 99 },

  hostDot: {
    width: 28, height: 28, borderRadius: 99,
    backgroundColor: "rgba(255,77,109,0.15)", borderWidth: 1, borderColor: "rgba(255,77,109,0.20)",
    alignItems: "center", justifyContent: "center",
  },
  hostName: { color: MUTED, fontSize: 12, fontWeight: "700" },
});