// app/newApp/trip.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Animated, Dimensions, Platform,
  StatusBar, RefreshControl, ActivityIndicator,
} from "react-native";
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
  bg: "#F7F8F4",
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

const PALETTES = ["#D3E9DE","#D4E5F7","#F5DDD3","#EAD9F5","#F5EAD1","#D3EDF5"];

const CATS = [
  { key: "All",      label: "All",      icon: "grid",               color: "#6C63FF" },
  { key: "Fitness",  label: "Fitness",  icon: "barbell-outline",    color: "#FF6B6B" },
  { key: "Wellness", label: "Wellness", icon: "leaf-outline",       color: "#22C55E" },
  { key: "Food",     label: "Food",     icon: "restaurant-outline", color: "#F59E0B" },
  { key: "Activity", label: "Activity", icon: "bicycle-outline",    color: "#06B6D4" },
];

type TripEvent = {
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
};

async function apiFetch(url: string, opts: any) {
  return fetch(url, { ...opts, headers: { ...opts.headers, "ngrok-skip-browser-warning": "1" } });
}

import { BlurView } from "expo-blur";

// ── Hero Card: image fills bg, content overlays at bottom ─────────────────────
function HeroCard({ ev, onPress }: { ev: TripEvent; onPress?: () => void }) {
  const isPaid = ev.kind === "paid" || ev.kind === "service";
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
            <View style={[S.heroMetaItem, { marginLeft: 12 }]}>
              <Ionicons name="navigate-outline" size={12} color="#fff" />
              <Text style={S.heroMetaText}>1.2 km away</Text>
            </View>
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
  const isPaid = ev.kind === "paid" || ev.kind === "service";
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
  const [displayCount, setDisplayCount] = useState(50);
  const LOAD_MORE_SIZE = 50;

  const fade = useRef(new Animated.Value(0)).current;
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserCoords({ lat: cur.coords.latitude, lng: cur.coords.longitude });
        const rev = await Location.reverseGeocodeAsync({ latitude: cur.coords.latitude, longitude: cur.coords.longitude });
        const c = (rev?.[0]?.city || rev?.[0]?.district || rev?.[0]?.subregion || "").trim();
        if (c) setCity(c);
      } catch {}
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
      const res = await apiFetch(`${API_BASE}/api/events/get-events?limit=200`, { method: "GET", headers });
      const json = await res.json().catch(() => ({}));
      setEvents(Array.isArray(json?.events) ? json.events : []);
    } catch { setEvents([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [API_BASE, headers]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); setDisplayCount(50); load(); }, [load]);

  const filtered = useMemo(() => {
    let list = events.filter(e => {
      const st = String((e as any).status || "active").toLowerCase();
      const isMine = userId && String((e as any).creatorClerkId) === userId;
      return st === "active" || st === "live" || (st === "paused" && isMine);
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
        const kindMatch = (e.kind ?? "").toLowerCase().includes(q) ||
                          (e.kind === "service" && "service".includes(q)) ||
                          (e.kind === "paid" && "paid".includes(q)) ||
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
          if (fk === "service") return ek === "service";
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

    return list;
  }, [events, search, catFilter, filters, userCoords, userId]);

  const heroEvents = useMemo(() => filtered.slice(0, 3), [filtered]);

  const nearbyEvents = useMemo(() => {
    if (!city || city === "Nearby") return filtered.slice(0, 8);
    const q = city.toLowerCase();
    const m = filtered.filter(e => {
      const c = (e.location?.city || e.location?.address || e.location?.formattedAddress || "").toLowerCase();
      return c.includes(q) || q.includes(c);
    });
    return m.length > 0 ? m : filtered.slice(0, 8);
  }, [filtered, city]);

  const localServices = useMemo(() => {
    return filtered.filter(e => e.kind === "service" || e.title.toLowerCase().includes("service"));
  }, [filtered]);

  const allEvents = useMemo(() => filtered.slice(0, displayCount), [filtered, displayCount]);
  const hasMore = filtered.length > displayCount;
  const TOP = Math.max(insets.top, Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 8;

  const openSheet = (ev: TripEvent) => {
    const isService = ev.kind === "service" || ev.title?.toLowerCase().includes("service");
    router.push({
      pathname: "/newApp/event-detail",
      params: { 
        eventId: ev._id, 
        title: ev.title, 
        emoji: ev.emoji,
        booking: isService ? "true" : "false"
      }
    });
  };

  return (
    <Animated.View style={[S.screen, { opacity: fade }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* HEADER */}
      <View style={[S.header, { paddingTop: TOP }]}>
        <View style={S.headerRow}>
          <View>
            <Text style={S.headerTitle}>Explore</Text>
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
          setDisplayCount(50);
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {loading && !refreshing ? (
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
                horizontal pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: PAD, gap: 16 }}
                style={{ marginBottom: 32 }}
              >
                {heroEvents.map(ev => (
                  <HeroCard key={ev._id} ev={ev} onPress={() => openSheet(ev)} />
                ))}
              </ScrollView>
            )}

            {/* BROWSE BY CATEGORY */}
            <View style={S.section}>
              <View style={S.sectionHead}>
                <Text style={S.sectionTitle}>Browse by Category</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.catScroll}>
                {CATS.map(cat => {
                  const active = catFilter === cat.key;
                  return (
                    <TouchableOpacity key={cat.key} style={S.catItem} onPress={() => { setCatFilter(cat.key); setDisplayCount(50); }} activeOpacity={0.78}>
                      <View style={[S.catCircle, { backgroundColor: active ? cat.color : "#F0F0F0" }]}>
                        <Ionicons name={cat.icon as any} size={22} color={active ? "#fff" : cat.color} />
                      </View>
                      <Text style={[S.catLabel, { color: active ? cat.color : C.muted }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* UPCOMING NEAR YOU */}
            <View style={S.section}>
              <View style={S.sectionHead}>
                <View>
                  <Text style={S.sectionTitle}>Upcoming Near You</Text>
                  <Text style={S.sectionSub}>Events in {city}</Text>
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

            {/* LOCAL SERVICES (2-row Horizontal) */}
            {localServices.length > 0 && (
              <View style={S.section}>
                <View style={S.sectionHead}>
                  <View>
                    <Text style={S.sectionTitle}>Local Services</Text>
                    <Text style={S.sectionSub}>Top rated professionals in {city}</Text>
                  </View>
                  <TouchableOpacity><Text style={S.seeAll}>See all</Text></TouchableOpacity>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={S.hGridScroll}
                >
                  {Array.from({ length: Math.ceil(localServices.length / 2) }).map((_, colIdx) => (
                    <View key={colIdx} style={S.vCol}>
                      {localServices.slice(colIdx * 2, colIdx * 2 + 2).map(ev => (
                        <TouchableOpacity 
                          key={ev._id} 
                          style={S.compactServiceCard} 
                          onPress={() => openSheet(ev)}
                        >
                          <Image 
                            source={{ uri: ev.bannerUri || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=200" }} 
                            style={S.compactServiceImg} 
                          />
                          <View style={S.compactServiceBody}>
                            <Text style={S.compactServiceTitle} numberOfLines={1}>{ev.title}</Text>
                            <View style={S.compactServiceMeta}>
                              <Ionicons name="star" size={10} color={C.gold} />
                              <Text style={S.compactServiceMetaTxt}>4.9 • 1.2km</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ALL EVENTS */}
            <View style={S.section}>
              <View style={S.sectionHead}>
                <View>
                  <Text style={S.sectionTitle}>All Events</Text>
                  <Text style={S.sectionSub}>{filtered.length} events available</Text>
                </View>
              </View>
              <View style={S.allGrid}>
                {allEvents.map(ev => (
                  <SmallCard key={ev._id} ev={ev} width={(SW - PAD * 2 - 12) / 2} onPress={() => openSheet(ev)} />
                ))}
              </View>
              {hasMore && (
                <TouchableOpacity
                  style={S.loadMoreBtn}
                  onPress={() => setDisplayCount(c => c + LOAD_MORE_SIZE)}
                  activeOpacity={0.8}
                >
                  <Text style={S.loadMoreTxt}>Load More ({filtered.length - displayCount} remaining)</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

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
  catScroll: { paddingHorizontal: PAD, gap: 18 },
  catItem: { alignItems: "center", gap: 8 },
  catCircle: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  catLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },

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
  loadMoreBtn: {
    marginHorizontal: PAD, marginTop: 16, marginBottom: 8,
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    borderRadius: 16, paddingVertical: 14, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  loadMoreTxt: { fontSize: 14, fontWeight: "800", color: C.accent },

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