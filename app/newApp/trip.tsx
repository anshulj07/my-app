// app/newApp/trip.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Animated, Dimensions, Platform,
  StatusBar, RefreshControl, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useAuth } from "@clerk/clerk-expo";
import { formatEventDateTime } from "../../lib/dateUtils";
import FilterSheet, { FilterData } from "../../components/Filter/FilterSheet";
import type { EventPin } from "../../components/Map/MapView";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const { width: SW } = Dimensions.get("window");
const PAD = 20;

const C = {
  bg: "#FFFFFF",
  white: "#FFFFFF",
  card: "#FFFFFF",
  border: "#EEEEEE",
  ink: "#191919",
  ink2: "#3A3A3A",
  muted: "#888888",
  hint: "#C0C0C0",
  accent: "#6C63FF",
  green: "#22C55E",
  gold: "#F59E0B",
  red: "#FF4B6E",
};

const PALETTES = ["#D3E9DE", "#D4E5F7", "#F5DDD3", "#EAD9F5", "#F5EAD1", "#D3EDF5"];

const CATS = [
  { key: "All", label: "All", icon: "grid", color: "#6C63FF" },
  { key: "All Events", label: "All Events", icon: "calendar-outline", color: "#10B981" },
  { key: "Recurring", label: "Recurring", icon: "repeat-outline", color: "#14B8A6" },
  { key: "Fitness", label: "Fitness", icon: "barbell-outline", color: "#FF6B6B" },
  { key: "Wellness", label: "Wellness", icon: "leaf-outline", color: "#22C55E" },
  { key: "Food", label: "Food", icon: "restaurant-outline", color: "#F59E0B" },
  { key: "Activity", label: "Activity", icon: "bicycle-outline", color: "#06B6D4" },
];

export type TripEvent = {
  _id: string;
  title: string;
  emoji?: string;
  bannerUri?: string;
  kind?: string;
  priceCents?: number;
  date?: string;
  time?: string;
  description?: string;
  location?: {
    lat?: number | null;
    lng?: number | null;
    city?: string;
    admin1?: string;
    formattedAddress?: string;
    address?: string;
    countryName?: string;
    countryCode?: string;
  };
  creatorName?: string;
  creatorClerkId?: string;
  distanceKm?: number;
};

async function apiFetch(url: string, opts: any) {
  return fetch(url, { ...opts, headers: { ...opts.headers, "ngrok-skip-browser-warning": "1" } });
}

import { BlurView } from "expo-blur";

// ── Hero Card: image fills bg, content overlays at bottom ─────────────────────
function HeroCard({ ev, onPress }: { ev: TripEvent; onPress?: () => void }) {
  const isPaid = ev.kind === "paid";
  const price = isPaid ? `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}` : "Free";
  const loc = ev.location?.city || ev.location?.address || ev.location?.formattedAddress || "";
  const imgUri = ev.bannerUri || (ev as any).bannerImage || (ev as any).banner;
  const palette = PALETTES[Math.abs(ev._id.length) % PALETTES.length];

  return (
    <TouchableOpacity style={S.heroCard} onPress={onPress} activeOpacity={0.9}>
      {/* Background Image */}
      <View style={[S.heroImg, { backgroundColor: palette }]}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <Text style={{ fontSize: 56 }}>{ev.emoji || "📍"}</Text>
        }
        {/* Top Right Badge */}
        <View style={S.heroBadge}>
          <Text style={S.heroBadgeTxt}>{price}</Text>
        </View>

        {/* Bottom Content Overlay (Glassmorphism) */}
        <BlurView intensity={25} tint="dark" style={S.heroGlass}>
          <Text style={S.heroTitle} numberOfLines={1}>{ev.title}</Text>

          <View style={S.heroMetaRow}>
            <View style={S.heroMetaItem}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={S.heroMetaText}>Today, {ev.time || "18:30"}</Text>
            </View>
            {ev.distanceKm !== undefined && (
              <View style={[S.heroMetaItem, { marginLeft: 12 }]}>
                <Ionicons name="navigate-outline" size={12} color="#fff" />
                <Text style={S.heroMetaText}>{ev.distanceKm < 1 ? "< 1" : ev.distanceKm.toFixed(1)} km away</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={S.heroJoinBtn} onPress={onPress}>
            <Text style={S.heroJoinText}>Join Event</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </TouchableOpacity>
  );
}

// ── Small Card ─────────────────────────────────────────────────
function SmallCard({ ev, onPress, width }: { ev: TripEvent; onPress?: () => void; width: number }) {
  const isPaid = ev.kind === "paid";
  const price = isPaid ? `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}` : "Free";
  const loc = ev.location?.city || ev.location?.address || "";
  const imgUri = ev.bannerUri || (ev as any).bannerImage || (ev as any).banner;
  const palette = PALETTES[Math.abs(ev._id.length) % PALETTES.length];

  return (
    <TouchableOpacity style={[S.smallCard, { width }]} onPress={onPress} activeOpacity={0.88}>
      <View style={[S.smallImg, { backgroundColor: palette }]}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <Text style={{ fontSize: 30 }}>{ev.emoji || "📍"}</Text>
        }
        <View style={S.smallBadge}><Text style={S.smallBadgeTxt}>{price}</Text></View>
      </View>
      <View style={S.smallBody}>
        <Text style={S.smallTitle} numberOfLines={2}>{ev.title}</Text>
        {!!loc && (
          <View style={S.smallRow}>
            <Ionicons name="location-sharp" size={10} color={C.accent} />
            <Text style={S.smallLoc} numberOfLines={1}>{loc}</Text>
          </View>
        )}
        <Text style={S.smallTime} numberOfLines={1}>{formatEventDateTime(ev.date, ev.time) || "Upcoming"}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function TripScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [city, setCity] = useState("Nearby");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventPin | null>(null);
  const [filters, setFilters] = useState<FilterData | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userCountry, setUserCountry] = useState<string>("");
  const [displayCount, setDisplayCount] = useState(20); // ✅ Start with 20
  const LOAD_MORE_SIZE = 20; // ✅ Load 20 at a time
  const isLoadingMore = useRef(false); // ✅ Prevent double-trigger
  const scrollRef = useRef<any>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const gradAnim = useRef(new Animated.Value(0)).current;
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(gradAnim, { toValue: 0, duration: 4000, useNativeDriver: false })
      ])
    ).start();
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserCoords({ lat: cur.coords.latitude, lng: cur.coords.longitude });
        const rev = await Location.reverseGeocodeAsync({ latitude: cur.coords.latitude, longitude: cur.coords.longitude });
        const c = (rev?.[0]?.city || rev?.[0]?.district || rev?.[0]?.subregion || "").trim();
        if (c) setCity(c);
        if (rev?.[0]?.country) setUserCountry(rev[0].country);
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
      const res = await apiFetch(`${API_BASE}/api/events/get-events?limit=200&includePausedFor=${userId || ""}`, { method: "GET", headers });
      const json = await res.json().catch(() => ({}));
      setEvents(Array.isArray(json?.events) ? json.events : []);
    } catch { setEvents([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [API_BASE, headers, userId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); setDisplayCount(20); load(); }, [load]);

  const filtered = useMemo(() => {
    let list = events.filter(e => {
      const st = String((e as any).status || "active").toLowerCase();
      return st === "active" || st === "live" || (st === "paused" && e.creatorClerkId === userId);
    });

    // Reset display count on filter change
    setDisplayCount(50);

    // 1. Search (Smart Multi-field Search: City, Country, Event title, etc.)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(e => {
        const titleMatch = e.title.toLowerCase().includes(q);
        const descriptionMatch = (e.description ?? "").toLowerCase().includes(q);
        const cityMatch = (e.location?.city ?? "").toLowerCase().includes(q);
        const addressMatch = (e.location?.address ?? "").toLowerCase().includes(q);
        const formattedAddressMatch = (e.location?.formattedAddress ?? "").toLowerCase().includes(q);
        const admin1Match = (e.location?.admin1 ?? "").toLowerCase().includes(q);
        const countryMatch = (e.location?.countryName ?? "").toLowerCase().includes(q) ||
          (e.location?.countryCode ?? "").toLowerCase().includes(q);
        const creatorMatch = (e.creatorName ?? "").toLowerCase().includes(q);
        const kindMatch = (e.kind === "paid" && "paid".includes(q)) ||
          (e.kind === "free" && "free".includes(q));

        return (
          titleMatch ||
          descriptionMatch ||
          cityMatch ||
          addressMatch ||
          formattedAddressMatch ||
          admin1Match ||
          countryMatch ||
          creatorMatch ||
          kindMatch
        );
      });
    }

    // 2. Category Tabs (Main UI)
    if (catFilter !== "All") {
      const f = catFilter.toLowerCase();
      list = list.filter(e => {
        const t = e.title.toLowerCase();
        const k = (e.kind || "").toLowerCase();
        if (f === "all events") return k.includes("free") || k.includes("paid");
        if (f === "recurring") return k.includes("recurring");
        if (f === "fitness") return t.includes("fit") || k.includes("fitness");
        if (f === "wellness") return t.includes("well") || k.includes("wellness");
        if (f === "food") return t.includes("food") || k.includes("food");
        if (f === "activity") return t.includes("active") || k.includes("activity");
        return true;
      });
    }

    // 3. Filter Sheet Logic
    if (filters) {
      // Kind Filter
      if (filters.kind !== "All") {
        const fk = filters.kind.toLowerCase();
        list = list.filter(e => {
          const ek = (e.kind || "free").toLowerCase();
          if (fk === "free") return ek === "free" || ek === "event_free";
          if (fk === "paid") return ek === "paid" || ek === "event_paid";
          return true;
        });
      }

      // Category Sheet Filter
      if (filters.cat !== "All") {
        const fc = filters.cat.toLowerCase();
        list = list.filter(e => {
          const t = e.title.toLowerCase();
          const ek = (e.kind || "").toLowerCase();
          return t.includes(fc) || ek.includes(fc);
        });
      }

      // Price Filter
      list = list.filter(e => {
        const price = (e.priceCents || 0) / 100;
        const max = filters.priceHigh === 5000 ? 999999 : filters.priceHigh;
        return price >= filters.priceLow && price <= max;
      });

      // Date Filter (Day of month match - simple implementation)
      if (filters.dateFrom) {
        list = list.filter(e => {
          if (!e.date) return true;
          const d = new Date(e.date).getDate();
          if (filters.dateTo) {
            return d >= filters.dateFrom! && d <= filters.dateTo!;
          }
          return d === filters.dateFrom;
        });
      }
    }

    return list.map(e => {
      let distanceKm = undefined;
      const lat = Number(e.location?.lat);
      const lng = Number(e.location?.lng);
      if (userCoords && isFinite(lat) && isFinite(lng)) {
        distanceKm = getDistance(userCoords.lat, userCoords.lng, lat, lng);
      }
      return { ...e, distanceKm };
    });
  }, [events, search, catFilter, filters, userCoords, userId]);

  // ✅ Infinite scroll: auto-load more when user is within 300px of bottom
  const handleScroll = useCallback((e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    if (distanceFromBottom < 300 && !isLoadingMore.current) {
      setDisplayCount(prev => {
        if (prev >= (filtered?.length ?? 0)) return prev; // already showing all
        isLoadingMore.current = true;
        setTimeout(() => { isLoadingMore.current = false; }, 500); // cooldown
        return prev + LOAD_MORE_SIZE;
      });
    }
  }, [filtered]);

  const heroEvents = useMemo(() => {
    // Show most popular events in the Hero banner (Country-wise if available)
    let candidates = filtered;
    if (userCountry) {
      const q = userCountry.toLowerCase();
      const inCountry = filtered.filter(e => {
        const cName = (e.location?.countryName || "").toLowerCase();
        const cCode = (e.location?.countryCode || "").toLowerCase();
        return cName.includes(q) || q.includes(cName) || cCode === q;
      });
      if (inCountry.length > 0) {
        candidates = inCountry;
      }
    }

    const sorted = [...candidates].sort((a, b) => {
      const aAtt = (a as any).attendance || (a as any).attendees?.length || 0;
      const bAtt = (b as any).attendance || (b as any).attendees?.length || 0;
      return bAtt - aAtt;
    });
    return sorted.slice(0, 15);
  }, [filtered, userCountry]);

  const nearbyEvents = useMemo(() => {
    if (!city || city === "Nearby") return filtered.slice(0, 8);
    const q = city.toLowerCase();
    const m = filtered.filter(e => {
      const c = (e.location?.city || e.location?.address || e.location?.formattedAddress || "").toLowerCase();
      return c.includes(q) || q.includes(c);
    });
    return m.length > 0 ? m : filtered.slice(0, 8);
  }, [filtered, city]);



  const allEvents = useMemo(() => filtered.slice(0, displayCount), [filtered, displayCount]);
  const hasMore = filtered.length > displayCount;
  const TOP = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 8;

  const openSheet = (ev: TripEvent) => {
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
        joinPolicy: (ev as any).joinPolicy || "anyone_can_join",
        eventStr: JSON.stringify(ev)
      }
    });
  };

  return (
    <Animated.View style={[S.screen, { opacity: fade }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={["#E0E7FF", "#FCE7F3", "#EDE9FE"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradAnim }]}>
          <LinearGradient colors={["#EDE9FE", "#FFE4E6", "#DBEAFE"]} style={StyleSheet.absoluteFill} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} />
        </Animated.View>
      </View>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* HEADER */}
      <View style={[S.header, { paddingTop: TOP }]}>
        <View style={S.headerRow}>
          <View>
            <Text style={[S.headerTitle, { color: C.ink }]}>Explore</Text>
          </View>
          <TouchableOpacity style={S.filterBtn} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={20} color={C.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      <View style={S.searchRow}>
        <View style={S.searchShell}>
          <Ionicons name="search-outline" size={17} color={C.hint} />
          <TextInput
            value={search} onChangeText={t => { setSearch(t); setDisplayCount(50); }}
            placeholder="Search events, cities, countries..."
            placeholderTextColor={C.hint}
            style={S.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={17} color={C.hint} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        initialFilters={filters || {}}
        onApply={(data) => {
          setFilters(data);
          setDisplayCount(20);
        }}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        contentContainerStyle={{ paddingBottom: 110 }}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        {/* BROWSE BY CATEGORY */}
        <View style={[S.section, { marginTop: 10, marginBottom: 20 }]}>
          <View style={S.sectionHead}>
            <Text style={[S.sectionTitle, { color: C.ink }]}>Browse by Category</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.catScroll}>
            {CATS.map(cat => {
              const active = catFilter === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[S.catItem, active && S.catItemActive]}
                  onPress={() => { setCatFilter(cat.key); setDisplayCount(50); }}
                  activeOpacity={0.78}
                >
                  <Ionicons name={cat.icon as any} size={16} color={active ? "#fff" : C.ink2} />
                  <Text style={[S.catLabel, { color: active ? "#fff" : C.ink2, fontWeight: active ? "800" : "600" }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading && !refreshing && filtered.length === 0 ? (
          <View style={S.center}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={S.loadingTxt}>Finding events…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={S.center}>
            <View style={S.emptyIconBox}>
              <Ionicons name="search-outline" size={50} color={C.muted} />
            </View>
            <Text style={S.emptyTitle}>
              {search
                ? `No results for "${search}"`
                : catFilter !== "All"
                  ? `No ${catFilter} events found`
                  : "No events found"}
            </Text>
            <Text style={S.emptySub}>Try adjusting your filters or search terms to find what you're looking for.</Text>

            {(search.length > 0 || catFilter !== "All" || filters) && (
              <TouchableOpacity
                onPress={() => { setSearch(""); setCatFilter("All"); setFilters(null); }}
                style={S.clearBtn}
              >
                <Text style={S.clearBtnTxt}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {/* HERO CAROUSEL */}
            {heroEvents.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: PAD, gap: 16 }}
                style={{ marginBottom: 32 }}
              >
                {heroEvents.map(ev => (
                  <HeroCard key={ev._id} ev={ev} onPress={() => openSheet(ev)} />
                ))}
              </ScrollView>
            )}



            {/* UPCOMING NEAR YOU */}
            <View style={S.section}>
              <View style={S.sectionHead}>
                <View>
                  <Text style={[S.sectionTitle, { color: C.ink }]}>Upcoming Near You</Text>
                  <Text style={[S.sectionSub, { color: C.muted }]}>Events in {city}</Text>
                </View>
                <TouchableOpacity><Text style={S.seeAll}>See all</Text></TouchableOpacity>
              </View>
              {nearbyEvents.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.hList}>
                  {nearbyEvents.map(ev => (
                    <SmallCard key={ev._id} ev={ev} width={SW * 0.52} onPress={() => openSheet(ev)} />
                  ))}
                </ScrollView>
              )}
            </View>


            {/* ALL EVENTS */}
            <View style={S.section}>
              <View style={S.sectionHead}>
                <View>
                  <Text style={[S.sectionTitle, { color: C.ink }]}>All Events</Text>
                  <Text style={[S.sectionSub, { color: C.muted }]}>{filtered.length} events available</Text>
                </View>
              </View>
              <View style={S.allGrid}>
                {allEvents.map(ev => (
                  <SmallCard key={ev._id} ev={ev} width={(SW - PAD * 2 - 12) / 2} onPress={() => openSheet(ev)} />
                ))}
              </View>
              {hasMore && (
                <View style={S.loadMoreIndicator}>
                  <ActivityIndicator size="small" color={C.accent} />
                  <Text style={S.loadMoreTxt}>{filtered.length - displayCount} more events</Text>
                </View>
              )}
              {!hasMore && allEvents.length > 0 && (
                <View style={S.allDoneRow}>
                  <Text style={S.allDoneTxt}>✓ All {filtered.length} events loaded</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1 },

  header: { paddingHorizontal: PAD, paddingBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTitle: { fontSize: 30, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  headerLocRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  locBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerLoc: { fontSize: 13, color: C.accent, fontWeight: "700" },
  radiusBadge: { backgroundColor: "#E0E7FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#C7D2FE" },
  radiusBadgeText: { fontSize: 10, fontWeight: "800", color: C.accent },
  filterBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },

  searchRow: { paddingHorizontal: PAD, marginBottom: 20, marginTop: 8 },
  searchShell: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.white, borderRadius: 16,
    paddingHorizontal: 15, height: 50,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: C.ink },

  // Hero
  heroCard: {
    width: SW - PAD * 2,
    height: 380,
    backgroundColor: C.white, borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: C.border,
  },
  heroImg: {
    flex: 1,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  heroBadge: {
    position: "absolute", top: 16, right: 16,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6,
    zIndex: 10,
  },
  heroBadgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  heroGlass: {
    position: "absolute", bottom: 20, left: 20, right: 20,
    padding: 20, borderRadius: 24, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  heroTitle: { fontSize: 18, fontWeight: "900", color: "#fff", marginBottom: 12, letterSpacing: -0.3 },
  heroMetaRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroMetaText: { fontSize: 12, color: "#fff", fontWeight: "600", opacity: 0.9 },
  heroJoinBtn: {
    backgroundColor: "#6366F1", borderRadius: 14,
    paddingVertical: 14, alignItems: "center", justifyContent: "center",
    shadowColor: "#6366F1", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  heroJoinText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  // Section
  section: { marginBottom: 28 },
  sectionHead: {
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    paddingHorizontal: PAD, marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: C.ink, letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 3 },
  seeAll: { fontSize: 13, color: C.accent, fontWeight: "700" },

  // Category
  catScroll: { paddingHorizontal: PAD, gap: 10 },
  catItem: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.9)"
  },
  catItemActive: {
    backgroundColor: C.ink,
  },
  catLabel: { fontSize: 13, textAlign: "center", letterSpacing: 0.2 },

  // Horizontal list
  hList: { paddingHorizontal: PAD, gap: 12 },

  // Small card
  smallCard: {
    backgroundColor: C.white, borderRadius: 18,
    overflow: "hidden", borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  smallImg: { width: "100%", height: 120, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  smallBadge: {
    position: "absolute", bottom: 8, left: 8,
    backgroundColor: "rgba(108,99,255,0.9)", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  smallBadgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  smallBody: { padding: 10 },
  smallTitle: { fontSize: 13, fontWeight: "800", color: C.ink, marginBottom: 4, letterSpacing: -0.2 },
  smallRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  smallLoc: { fontSize: 11, color: C.accent, fontWeight: "600" },
  smallTime: { fontSize: 11, color: C.muted, fontWeight: "600" },

  // All Events grid
  allGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: PAD },

  // Pagination
  pageRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24, gap: 16 },
  pageBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.accent, alignItems: "center", justifyContent: "center",
    shadowColor: C.accent, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  pageBtnOff: { backgroundColor: "#F0F0F0", shadowOpacity: 0, elevation: 0 },
  pageLabel: {
    backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
  },
  pageLabelTxt: { fontSize: 14, fontWeight: "800", color: C.ink },

  // States
  center: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80, paddingHorizontal: PAD },
  loadingTxt: { color: C.muted, fontWeight: "700", marginTop: 14, fontSize: 15 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginBottom: 20, borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 18, color: C.ink, fontWeight: "900", textAlign: "center", marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.muted, fontWeight: "600", textAlign: "center", marginBottom: 24, lineHeight: 20 },
  emptyBox: {
    marginHorizontal: PAD, height: 110, borderRadius: 20,
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  emptyBoxTxt: { color: C.muted, fontWeight: "700", fontSize: 14 },
  clearBtn: { backgroundColor: C.accent, paddingHorizontal: 25, paddingVertical: 14, borderRadius: 16, shadowColor: C.accent, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  clearBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  loadMoreIndicator: {
    marginHorizontal: PAD, marginTop: 16, marginBottom: 24,
    paddingVertical: 14, alignItems: "center", justifyContent: "center", gap: 8,
  },
  loadMoreTxt: { fontSize: 13, fontWeight: "600", color: C.muted },
  allDoneRow: {
    marginHorizontal: PAD, marginTop: 16, marginBottom: 24,
    paddingVertical: 14, alignItems: "center", justifyContent: "center",
  },
  allDoneTxt: { fontSize: 13, fontWeight: "700", color: C.muted },

  // New Services Grid Styles
  hGridScroll: { paddingHorizontal: PAD, gap: 16 },
  vCol: { gap: 12 },
  compactServiceCard: {
    flexDirection: "row",
    width: SW * 0.75,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    gap: 12
  },
  compactServiceImg: { width: 60, height: 60, borderRadius: 12 },
  compactServiceBody: { flex: 1 },
  compactServiceTitle: { fontSize: 14, fontWeight: "800", color: C.ink, marginBottom: 4 },
  compactServiceMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  compactServiceMetaTxt: { fontSize: 11, color: C.muted, fontWeight: "600" },
});