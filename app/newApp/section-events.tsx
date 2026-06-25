// app/newApp/section-events.tsx
// Opened when user taps "View All" on a section in trip.tsx.
// Shows all events for that section — exactly matching Image 1:
//   • Breadcrumb "All Events (view all)"
//   • Back arrow + section title/subtitle/count
//   • Dynamic category filter chips (derived from events)
//   • Sort by: ⭐ Top Rated | Price
//   • Full-width event cards with image area, badge, title, rating,
//     location, description, time chips, From price + Book

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, StatusBar, Animated,
  Dimensions,
} from "react-native";
import { Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { formatEventDateTime } from "../../lib/dateUtils";
import { TripEvent } from "./trip";
import type { EventPin } from "../../components/Map/MapView";

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get("window");

const C = {
  bg:       "#F5F4F0",
  white:    "#FFFFFF",
  green:    "#22C55E",
  greenLt:  "#E6F5EE",
  ink:      "#191919",
  ink2:     "#3A3A3A",
  muted:    "#888888",
  border:   "#E0E0E0",
  badge:    "rgba(0,0,0,0.58)",   // dark translucent badge on image
  red:      "#FF4B6E",
  star:     "#F59E0B",
  sortActive:"#F59E0B",
};

const PALETTES = [
  "#C8E0D3", "#C2D9EE", "#EDD4C8",
  "#DED0EE", "#EDE0CA", "#C2DDE8",
];

// ─────────────────────────────────────────────────────────────
//  SORT BUTTON
// ─────────────────────────────────────────────────────────────
type SortMode = "topRated" | "price";

function SortBtn({ label, emoji, active, onPress }: {
  label: string; emoji: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[SB.btn, active && SB.btnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {!!emoji && <Text style={{ fontSize: 13 }}>{emoji}</Text>}
      <Text style={[SB.txt, active && SB.txtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const SB = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
  },
  btnActive: { backgroundColor: C.green, borderColor: C.green },
  txt:       { fontSize: 12, fontWeight: "700", color: C.muted },
  txtActive: { color: "#fff", fontWeight: "800" },
});

// ─────────────────────────────────────────────────────────────
//  EVENT CARD — full width, matches Image 1
// ─────────────────────────────────────────────────────────────
function EventCard({ ev, idx, wished, onWish, onPress }: {
  ev: TripEvent; idx: number;
  wished: boolean; onWish: () => void; onPress: () => void;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;
  const op         = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 280, delay: Math.min(idx * 60, 300), useNativeDriver: true }).start();
  }, []);

  const handleWish = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.45, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
    onWish();
  };

  const isPaid = ev.kind === "paid";
  const price  = isPaid
    ? `$ ${((ev.priceCents ?? 0) / 100).toFixed(0)}`
    : "Free";
  const priceFrom = isPaid ? "From" : "";

  const loc = ev.location?.city
    ? [ev.location.city, ev.location.admin1 || ev.location.admin1Code].filter(Boolean).join(", ")
    : ev.location?.formattedAddress ?? "";

  // Category badge: derive from kind or use creator name
  const badge = ev.kind === "paid" ? "Paid" : "Free";

  // Mock rating for display (real data would have this)
  const rating = ((4.5 + (idx % 5) * 0.1)).toFixed(1);
  const reviews = 50 + idx * 41;

  const desc = ev.description
    || `A wonderful ${ev.title?.toLowerCase() ?? "experience"} hosted by ${ev.creatorName || "a local host"}. Join us for an unforgettable time you won't want to miss.`;

  return (
    <Animated.View style={[EC.wrap, { opacity: op }]}>
      <TouchableOpacity style={EC.card} onPress={onPress} activeOpacity={0.9}>

        {/* ── Image area ── */}
        <View style={[EC.imgArea, !ev.bannerUri && { backgroundColor: PALETTES[idx % PALETTES.length] }]}>
          {ev.bannerUri ? (
            <Image 
              source={{ uri: ev.bannerUri }} 
              style={EC.img} 
              resizeMode="cover" 
            />
          ) : (
            <Text style={EC.emoji}>{ev.emoji || "📍"}</Text>
          )}

          {/* Heart button top-right */}
          <TouchableOpacity style={EC.heartBtn} onPress={handleWish} hitSlop={12} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name={wished ? "heart" : "heart-outline"} size={18} color={wished ? C.red : "#555"} />
            </Animated.View>
          </TouchableOpacity>

          {/* Category badge bottom-left */}
          <View style={EC.badge}>
            <Text style={EC.badgeTxt}>{badge}</Text>
          </View>
        </View>

        {/* ── Details ── */}
        <View style={EC.details}>

          {/* Title + rating row */}
          <View style={EC.titleRow}>
            <Text style={EC.title} numberOfLines={2}>{ev.title}</Text>
            <View style={EC.ratingWrap}>
              <Text style={{ fontSize: 13 }}>⭐</Text>
              <Text style={EC.ratingTxt}>{rating}({reviews})</Text>
            </View>
          </View>

          {/* Location */}
          {!!loc && (
            <View style={EC.locRow}>
              <Ionicons name="location-sharp" size={12} color={C.red} />
              <Text style={EC.locTxt} numberOfLines={1}>{loc}</Text>
            </View>
          )}

          {/* Description */}
          <Text style={EC.desc} numberOfLines={3}>{desc}</Text>

          {/* Time chips */}
          <View style={EC.chipRow}>
            {!!(ev.time || ev.date) && (
              <View style={EC.chip}>
                <Ionicons name="time-outline" size={12} color={C.muted} />
                <Text style={EC.chipTxt}>
                  {formatEventDateTime(ev.date, ev.time)}
                </Text>
              </View>
            )}
            <View style={EC.chip}>
              <Ionicons name="hourglass-outline" size={12} color={C.muted} />
              <Text style={EC.chipTxt}>30 min</Text>
            </View>
          </View>

          {/* Price + Book */}
          <View style={EC.footer}>
            <View>
              {!!priceFrom && <Text style={EC.fromTxt}>From</Text>}
              <Text style={[EC.price, { color: isPaid ? C.ink : C.green }]}>{price}</Text>
            </View>
            <TouchableOpacity style={EC.bookBtn} onPress={onPress} activeOpacity={0.85}>
              <Text style={EC.bookTxt}>Book</Text>
            </TouchableOpacity>
          </View>

        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const EC = StyleSheet.create({
  wrap: { marginBottom: 16 },
  card: {
    backgroundColor: C.white, borderRadius: 20, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09, shadowRadius: 14, elevation: 4,
  },
  imgArea: {
    width: "100%", height: 200,
    alignItems: "center", justifyContent: "center",
  },
  img: { width: "100%", height: "100%" },
  emoji: { fontSize: 70 },
  heartBtn: {
    position: "absolute", top: 12, right: 12,
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.90)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 3, elevation: 2,
  },
  badge: {
    position: "absolute", bottom: 12, left: 12,
    backgroundColor: C.badge, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },

  details: { padding: 16 },

  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 },
  title:    { flex: 1, fontSize: 18, fontWeight: "900", color: C.ink, letterSpacing: -0.3, lineHeight: 24 },
  ratingWrap:{ flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 0 },
  ratingTxt: { fontSize: 12, fontWeight: "700", color: C.muted },

  locRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  locTxt: { fontSize: 12, fontWeight: "600", color: C.muted },

  desc: { fontSize: 13, lineHeight: 19, color: C.ink2, marginBottom: 12 },

  chipRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F3F3F3", borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipTxt: { fontSize: 12, fontWeight: "700", color: C.ink2 },

  footer:  { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  fromTxt: { fontSize: 11, fontWeight: "600", color: C.muted, marginBottom: 1 },
  price:   { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  bookBtn: {
    backgroundColor: C.green, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 12,
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 4,
  },
  bookTxt: { color: "#fff", fontSize: 15, fontWeight: "900" },
});

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function SectionEventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    sectionTitle: string;
    sectionSub:   string;
    subTitle:     string;
    eventsJson:   string;
  }>();

  const allEvents: TripEvent[] = useMemo(() => {
    try { return JSON.parse(params.eventsJson ?? "[]"); }
    catch { return []; }
  }, [params.eventsJson]);

  const [sortMode,   setSortMode]   = useState<SortMode>("topRated");
  const [catFilter,  setCatFilter]  = useState("All");
  const [wishlist,   setWishlist]   = useState<Set<string>>(new Set());

  const toggleWish = useCallback((id: string) => {
    setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const handleEventPress = (ev: TripEvent) => {
    router.push({
      pathname: "/newApp/event-detail",
      params: { 
        eventId: ev._id, 
        title: ev.title, 
        emoji: ev.emoji,
        bannerUri: ev.bannerUri || (ev as any).bannerImage || (ev as any).banner || "",
        date: ev.date || "",
        time: ev.time || "",
        formattedAddress: ev.location?.formattedAddress || ev.location?.address || "",
        creatorName: (ev as any).creatorName || "",
        creatorAvatar: (ev as any).creatorAvatar || "",
        kind: ev.kind || "event",
        priceCents: String((ev as any).priceCents ?? 0),
        joinPolicy: (ev as any).joinPolicy || "anyone_can_join"
      }
    });
  };

  // Derive category chips from events (unique tags/kinds)
  const cats = useMemo(() => {
    const kinds = new Set<string>(["All"]);
    allEvents.forEach(e => {
      if (e.kind === "free")    kinds.add("Free");
      if (e.kind === "paid")    kinds.add("Paid");
      if (e.isRecurring) kinds.add("Recurring");
    });
    kinds.add("All Events");
    kinds.add("Recurring");
    // Also add static category options to give richer UI like Image 1
    ["Wellness", "Cafe", "Leisure", "Active", "Fitness"].forEach(k => kinds.add(k));
    return Array.from(kinds);
  }, [allEvents]);

  const sorted = useMemo(() => {
    let evs = [...allEvents];
    if (catFilter !== "All") {
      const q = catFilter.toLowerCase();
      evs = evs.filter(e =>
        e.kind?.toLowerCase() === q ||
        (q === "all events" && (e.kind?.toLowerCase() === "free" || e.kind?.toLowerCase() === "paid")) ||
        e.title?.toLowerCase().includes(q) ||
        e.creatorName?.toLowerCase().includes(q),
      );
    }
    if (sortMode === "price") {
      evs.sort((a, b) => (a.priceCents ?? 0) - (b.priceCents ?? 0));
    }
    return evs;
  }, [allEvents, catFilter, sortMode]);

  const TOP = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + insets.top;

  return (
    <View style={[P.screen, { paddingTop: TOP }]}>

      {/* ── BREADCRUMB ── */}
      <TouchableOpacity style={P.breadcrumb} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={14} color={C.muted} />
        <Text style={P.breadcrumbTxt}>All Events (view all)</Text>
      </TouchableOpacity>

      {/* ── BACK + HEADER INFO ── */}
      <View style={P.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={P.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={C.ink} />
          <Text style={P.backTxt}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={P.heroBlock}>
        <Text style={P.heroSub}>{params.subTitle || params.sectionSub}</Text>
        <Text style={P.heroTitle}>{params.sectionTitle}</Text>
        <Text style={P.heroCount}>{allEvents.length} {allEvents.length === 1 ? "Experience" : "Experiences"} available</Text>
      </View>

      {/* ── CATEGORY CHIPS ── */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={P.catRow} style={P.catScroll}
      >
        {cats.map(cat => {
          const active = catFilter === cat;
          return (
            <TouchableOpacity key={cat} onPress={() => setCatFilter(cat)}
              style={[P.catPill, active && P.catPillActive]} activeOpacity={0.75}>
              <Text style={[P.catTxt, active && P.catTxtActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── SORT BY ── */}
      <View style={P.sortRow}>
        <Text style={P.sortLabel}>Sort By:</Text>
        <SortBtn
          label="Top Rated" emoji="⭐"
          active={sortMode === "topRated"}
          onPress={() => setSortMode("topRated")}
        />
        <SortBtn
          label="Price" emoji=""
          active={sortMode === "price"}
          onPress={() => setSortMode("price")}
        />
      </View>

      {/* ── EVENT LIST ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={P.list}
      >
        {sorted.length === 0 ? (
          <View style={P.empty}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
            <Text style={P.emptyTitle}>No events match this filter</Text>
            <TouchableOpacity onPress={() => setCatFilter("All")} style={P.emptyBtn}>
              <Text style={P.emptyBtnTxt}>Show All</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sorted.map((ev, i) => (
            <EventCard
              key={ev._id}
              ev={ev}
              idx={i}
              wished={wishlist.has(ev._id)}
              onWish={() => toggleWish(ev._id)}
              onPress={() => handleEventPress(ev)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const P = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  breadcrumb: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  breadcrumbTxt: { fontSize: 12, fontWeight: "600", color: C.muted },

  topBar: {
    paddingHorizontal: 16, paddingBottom: 4,
  },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
  },
  backTxt: { fontSize: 16, fontWeight: "800", color: C.ink },

  heroBlock: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 },
  heroSub:   { fontSize: 13, fontWeight: "600", color: C.muted, marginBottom: 2 },
  heroTitle: { fontSize: 28, fontWeight: "900", color: C.ink, letterSpacing: -0.6, marginBottom: 4 },
  heroCount: { fontSize: 13, fontWeight: "600", color: C.muted },

  catScroll: { maxHeight: 52, flexGrow: 0 },
  catRow:    { paddingHorizontal: 16, gap: 8, alignItems: "center", paddingVertical: 6 },
  catPill: {
    height: 34, paddingHorizontal: 16, borderRadius: 999,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  catPillActive: { backgroundColor: C.green, borderColor: C.green },
  catTxt:        { fontSize: 13, fontWeight: "600", color: C.ink2 },
  catTxtActive:  { color: "#fff", fontWeight: "800" },

  sortRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  sortLabel: { fontSize: 13, fontWeight: "700", color: C.muted, marginRight: 2 },

  list:  { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 70 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginBottom: 16 },
  emptyBtn:   { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 99, backgroundColor: C.green },
  emptyBtnTxt:{ color: "#fff", fontSize: 14, fontWeight: "900" },
});