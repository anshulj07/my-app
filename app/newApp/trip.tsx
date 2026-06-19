// app/newApp/trip.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Animated, Dimensions, Platform,
  StatusBar, RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useAuth } from "@clerk/clerk-expo";
import { formatEventDateTime } from "../../lib/dateUtils";
import FilterSheet from "../../components/Filter/FilterSheet";
import PersonBookingSheet from "../../components/ClickPin/PersonBookingSheet";
import type { EventPin } from "../../components/Map/MapView";

// ─── Design tokens ─────────────────────────────────────────────
const { width: SW } = Dimensions.get("window");
const PAD = 20;

const C = {
  bg:          "#F7F8F4",
  white:       "#FFFFFF",
  card:        "#FFFFFF",
  cardBorder:  "#EEEEEE",
  ink:         "#191919",
  ink2:        "#3A3A3A",
  muted:       "#888888",
  hint:        "#C0C0C0",
  border:      "#DEDEDE",
  green:       "#22C55E",
  red:         "#FF4B6E",
};

const PALETTES = [
  "#D3E9DE", "#D4E5F7", "#F5DDD3",
  "#EAD9F5", "#F5EAD1", "#D3EDF5",
];

// ─── Types ──────────────────────────────────────────────────────
type TripEvent = {
  _id: string;
  title: string;
  emoji?: string;
  bannerUri?: string;
  kind?: string;
  priceCents?: number;
  date?: string;
  time?: string;
  location?: {
    city?: string;
    admin1?: string;
    admin1Code?: string;
    formattedAddress?: string;
    address?: string;
  };
  creatorName?: string;
};

// ─── Helpers ────────────────────────────────────────────────────
async function apiFetch(url: string, opts: any) {
  return fetch(url, { ...opts, headers: { ...opts.headers, "ngrok-skip-browser-warning": "1" } });
}

const CATS = ["All", "Fitness", "Wellness", "Food", "Activity"];

// ─── Premium Card Component ─────────────────────────────────────
function TripCard({ ev, horizontal = false, wished, onWish, onPress }: {
  ev: TripEvent; horizontal?: boolean; wished?: boolean; onWish?: () => void; onPress?: () => void;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;
  const cardW = horizontal ? SW * 0.72 : (SW - (PAD * 2));
  
  const handleWish = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onWish?.();
  };

  const isPaid = ev.kind === "paid" || ev.kind === "service";
  const isService = ev.kind === "service";
  const price = isPaid ? `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}${isService ? "/hr" : ""}` : "Free";
  const loc = ev.location?.city || ev.location?.address || ev.location?.formattedAddress || "";
  const imgUri = ev.bannerUri || (ev as any).bannerImage || (ev as any).banner;

  return (
    <TouchableOpacity 
      style={[S.card, { width: cardW }, horizontal && { marginRight: 14 }]} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <View style={[S.cardImgArea, { backgroundColor: PALETTES[Math.abs(ev._id.length) % PALETTES.length] }]}>
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={S.cardImg} resizeMode="cover" />
        ) : (
          <Text style={S.cardEmoji}>{ev.emoji || "📍"}</Text>
        )}
        <TouchableOpacity style={S.heartBtn} onPress={handleWish} activeOpacity={0.8}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons name={wished ? "heart" : "heart-outline"} size={18} color={wished ? C.red : C.ink2} />
          </Animated.View>
        </TouchableOpacity>
      </View>
      
      <View style={S.cardBody}>
        <Text style={S.cardTitle} numberOfLines={1}>{ev.title}</Text>
        {!!loc && (
          <View style={S.cardMeta}>
            <Ionicons name="location-sharp" size={12} color={C.green} />
            <Text style={S.cardMetaTxt} numberOfLines={1}>{loc}</Text>
          </View>
        )}
        <View style={S.cardMeta}>
          <Ionicons name="time-outline" size={12} color={C.muted} />
          <Text style={S.cardMetaTxt} numberOfLines={1}>
            {formatEventDateTime(ev.date, ev.time) || "Upcoming"}
          </Text>
        </View>
        
        <View style={S.cardFooter}>
          <Text style={[S.cardPrice, { color: isPaid ? C.ink : C.green }]}>{price}</Text>
          <TouchableOpacity style={S.bookBtn} onPress={onPress}>
            <Text style={S.bookBtnTxt}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function TripScreen() {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events,     setEvents]     = useState<TripEvent[]>([]);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("All");
  const [wishlist,   setWishlist]   = useState<Set<string>>(new Set());
  const [city,       setCity]       = useState("Nearby");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventPin | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const fade = useRef(new Animated.Value(0)).current;

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 360, useNativeDriver: true }).start();
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const rev = await Location.reverseGeocodeAsync({ latitude: cur.coords.latitude, longitude: cur.coords.longitude });
        const c = (rev?.[0]?.city || rev?.[0]?.district || rev?.[0]?.subregion || rev?.[0]?.name || "").trim();
        console.log("[Trip] Detected location info:", rev?.[0]);
        if (c) setCity(c);
      } catch (err) {
        console.log("[Trip] Location error:", err);
      }
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
      const evs = Array.isArray(json?.events) ? json.events : [];
      console.log("[Trip] Loaded events count:", evs.length);
      setEvents(evs);
    } catch (err) { 
      console.log("[Trip] Load error:", err);
      setEvents([]); 
    }
    finally  { setLoading(false); setRefreshing(false); }
  }, [API_BASE, headers]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const toggleWish = useCallback((id: string) => {
    setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const filtered = useMemo(() => {
    // ✅ Hide paused pins for non-owners
    let list = events.filter(e => {
      const st = String((e as any).status || "active").toLowerCase();
      const isMine = userId && String((e as any).creatorClerkId) === userId;
      return st === "active" || st === "live" || (st === "paused" && isMine);
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.location?.city ?? "").toLowerCase().includes(q) ||
        (e.location?.address ?? "").toLowerCase().includes(q) ||
        (e.creatorName ?? "").toLowerCase().includes(q),
      );
    }
    if (catFilter !== "All") {
      const f = catFilter.toLowerCase();
      list = list.filter(e => {
        const title = e.title.toLowerCase();
        if (f === "fitness") return title.includes("fit");
        if (f === "wellness") return title.includes("well");
        if (f === "food") return title.includes("food");
        return true;
      });
    }
    return list;
  }, [events, search, catFilter, userId]);

  const nearbyCityEvents = useMemo(() => {
    if (!city || city === "Nearby") return [];
    const q = city.toLowerCase();
    // LOG ALL EVENTS DATA FOR DEBUGGING
    console.log("[Trip] Total filtered events:", filtered.length);
    filtered.forEach((e, idx) => {
       console.log(`[Trip] Event ${idx} FULL:`, JSON.stringify(e));
    });

    const matches = filtered.filter(e => {
      const c = (e.location?.city || e.location?.address || e.location?.formattedAddress || "").toLowerCase();
      return c.includes(q) || q.includes(c); // Bidirectional check
    });
    console.log("[Trip] Nearby matches for", q, ":", matches.length);
    return matches;
  }, [filtered, city]);

  const allEvents = useMemo(() => {
    return filtered.slice(page * pageSize, (page + 1) * pageSize);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const TOP = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 4;

  return (
    <Animated.View style={[S.screen, { paddingTop: TOP, opacity: fade }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ── */}
      <View style={S.headerInner}>
        <View>
          <Text style={S.headerTitle}>Trip</Text>
          <Text style={S.headerSub}>Explore the world</Text>
        </View>
        <TouchableOpacity style={S.locationPill} activeOpacity={0.85}>
          <Ionicons name="location-sharp" size={14} color="#fff" />
          <Text style={S.locationText} numberOfLines={1}>{city}</Text>
          <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* ── SEARCH ── */}
      <View style={S.searchRow}>
        <View style={S.searchShell}>
          <Ionicons name="search-outline" size={18} color={C.hint} />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search Events or Locations"
            placeholderTextColor={C.hint}
            style={S.searchInput}
          />
        </View>
        <TouchableOpacity style={S.filterBtn} activeOpacity={0.8} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FilterSheet visible={showFilters} onClose={() => setShowFilters(false)} />

      {/* ── CATEGORIES ── */}
      <View style={S.catWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.catRow}>
          {CATS.map(cat => {
            const active = catFilter === cat;
            return (
              <TouchableOpacity key={cat} onPress={() => setCatFilter(cat)}
                style={[S.catPill, active && S.catPillActive]} activeOpacity={0.75}>
                <Text style={[S.catText, active && S.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {loading && !refreshing ? (
          <View style={S.center}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={S.loadingTitle}>Finding events…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={S.empty}>
            <Text style={{ fontSize: 50, marginBottom: 14 }}>🗓️</Text>
            <Text style={S.emptyTitle}>{search ? `No results for "${search}"` : "No events found"}</Text>
            <TouchableOpacity onPress={() => setSearch("")} style={S.emptyBtn}>
              <Text style={S.emptyBtnText}>Clear search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Nearby Section */}
            <View style={S.section}>
              <View style={S.sectionHead}>
                <View>
                  <Text style={S.sectionTitle}>Nearby in {city}</Text>
                  <Text style={S.sectionSub}>Events happening in your city</Text>
                </View>
              </View>
              {nearbyCityEvents.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.horizontalList}>
                  {nearbyCityEvents.map(ev => (
                    <TripCard 
                      key={ev._id} 
                      ev={ev} 
                      horizontal 
                      wished={wishlist.has(ev._id)} 
                      onWish={() => toggleWish(ev._id)}
                      onPress={() => {
                        setSelectedEvent(ev as any);
                        setSheetVisible(true);
                      }}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={S.emptyCityBox}>
                  <Ionicons name="location-outline" size={24} color={C.muted} />
                  <Text style={S.emptyCityTxt}>No events found in {city} yet.</Text>
                </View>
              )}
            </View>

            {/* All Events Section */}
            <View style={[S.section, { marginTop: 24 }]}>
              <View style={S.sectionHead}>
                <Text style={S.sectionTitle}>All Events</Text>
                <Text style={S.sectionSub}>Discover more experiences</Text>
              </View>
              <View style={S.verticalList}>
                {allEvents.length > 0 ? (
                  allEvents.map(ev => (
                    <TripCard 
                      key={ev._id} 
                      ev={ev} 
                      wished={wishlist.has(ev._id)} 
                      onWish={() => toggleWish(ev._id)}
                      onPress={() => {
                        setSelectedEvent(ev as any);
                        setSheetVisible(true);
                      }}
                    />
                  ))
                ) : (
                  <Text style={S.emptyTxt}>No events available.</Text>
                )}
              </View>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <View style={S.paginationRow}>
                  <TouchableOpacity 
                    style={[S.pageBtn, page === 0 && S.pageBtnDisabled]} 
                    disabled={page === 0}
                    onPress={() => setPage(p => Math.max(0, p - 1))}
                  >
                    <Ionicons name="chevron-back" size={24} color={page === 0 ? C.hint : "#fff"} />
                  </TouchableOpacity>
                  
                  <View style={S.pageIndicator}>
                    <Text style={S.pageIndicatorTxt}>{page + 1} / {totalPages}</Text>
                  </View>

                  <TouchableOpacity 
                    style={[S.pageBtn, page >= totalPages - 1 && S.pageBtnDisabled]} 
                    disabled={page >= totalPages - 1}
                    onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  >
                    <Ionicons name="chevron-forward" size={24} color={page >= totalPages - 1 ? C.hint : "#fff"} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <PersonBookingSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        person={selectedEvent}
      />
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: PAD, paddingBottom: 12 },
  headerInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingBottom: 10, paddingHorizontal: PAD },
  headerTitle: { fontSize: 32, fontWeight: "900", color: C.ink, letterSpacing: -0.8 },
  headerSub:   { fontSize: 14, color: C.muted, fontWeight: "600", marginTop: -2 },
  locationPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.green, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  locationText: { color: "#fff", fontSize: 13, fontWeight: "800", maxWidth: 100 },

  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: PAD, marginVertical: 15,
  },
  searchShell: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.white, borderRadius: 16,
    paddingHorizontal: 15, height: 54,
    borderWidth: 1, borderColor: C.cardBorder,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "600", color: C.ink },
  filterBtn: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: C.green, alignItems: "center", justifyContent: "center",
    shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },

  catWrapper: { marginBottom: 10 },
  catRow:     { paddingHorizontal: PAD, gap: 10 },
  catPill: {
    paddingHorizontal: 20, height: 40, borderRadius: 12,
    backgroundColor: C.white, borderWidth: 1, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  catPillActive: { backgroundColor: C.green, borderColor: C.green },
  catText:       { fontSize: 14, fontWeight: "700", color: C.ink2 },
  catTextActive: { color: "#fff" },

  section:     { marginTop: 10 },
  sectionHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: PAD, marginBottom: 15,
  },
  sectionTitle: { fontSize: 22, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  sectionSub:   { fontSize: 13, color: C.muted, fontWeight: "600", marginTop: 2 },

  horizontalList: { paddingLeft: PAD, paddingBottom: 10 },
  verticalList:   { paddingHorizontal: PAD, gap: 16 },

  card: {
    backgroundColor: C.white, borderRadius: 24, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 15, elevation: 3,
  },
  cardImgArea: { width: "100%", height: 160, alignItems: "center", justifyContent: "center" },
  cardImg: { width: "100%", height: "100%" },
  cardEmoji: { fontSize: 50 },
  heartBtn: {
    position: "absolute", top: 12, right: 12,
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center",
  },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: C.ink, marginBottom: 6 },
  cardMeta:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardMetaTxt: { fontSize: 13, color: C.muted, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F0F0F0",
  },
  cardPrice: { fontSize: 18, fontWeight: "900" },
  bookBtn: {
    backgroundColor: C.green, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  bookBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100 },
  loadingTitle: { fontSize: 16, fontWeight: "700", color: C.muted, marginTop: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.muted, marginBottom: 15 },
  emptyBtn: { backgroundColor: C.green, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
  emptyTxt: { textAlign: "center", color: C.muted, marginTop: 10, fontWeight: "600" },

  emptyCityBox: {
    marginHorizontal: PAD,
    height: 120,
    backgroundColor: C.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderStyle: "dashed",
  },
  emptyCityTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: C.muted,
  },
  
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 20,
  },
  pageBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.green,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  pageBtnDisabled: {
    backgroundColor: "#F0F0F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  pageIndicator: {
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  pageIndicatorTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: C.ink,
  },
});