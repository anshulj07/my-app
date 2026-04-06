// // app/newApp/trip.tsx
// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import {
//   View, Text, ScrollView, TouchableOpacity, TextInput,
//   RefreshControl, StyleSheet, Platform, StatusBar,
//   Animated, Dimensions,
// } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import Constants from "expo-constants";
// import * as Location from "expo-location";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { apiFetch } from "../../lib/apiFetch";

// // ─────────────────────────────────────────────────────────────
// //  TOKENS
// // ─────────────────────────────────────────────────────────────
// const { width: SW } = Dimensions.get("window");
// const CARD_W   = Math.round(SW * 0.58);
// const CARD_IMG = 130;
// // Body height: title(1 line 18) + loc(16) + time(16) + gap + footer(34) + padding(24) = ~120
// const CARD_BODY = 120;

// const C = {
//   bg:      "#F7F8F4",
//   white:   "#FFFFFF",
//   green:   "#22C55E",
//   greenLt: "#E6F5EE",
//   ink:     "#191919",
//   ink2:    "#3A3A3A",
//   muted:   "#888888",
//   hint:    "#C0C0C0",
//   border:  "#DEDEDE",   // slightly darker so pill border is visible like Image 2
//   red:     "#FF4B6E",
// };

// const PALETTES = [
//   { bg: "#D3E9DE" }, { bg: "#D4E5F7" }, { bg: "#F5DDD3" },
//   { bg: "#EAD9F5" }, { bg: "#F5EAD1" }, { bg: "#D3EDF5" },
// ];

// const SECTION_META = [
//   { key: "s1", title: "Morning Rituals",  sub: "Start your day right" },
//   { key: "s2", title: "Culinary Trails",  sub: "Savour every moment"  },
//   { key: "s3", title: "Wellness Escapes", sub: "Rejuvenate your mind"  },
// ];

// const CATS = ["All", "Fitness", "Wellness", "Food", "Active", "Nightlife"] as const;
// type CatFilter  = typeof CATS[number];
// type DateFilter = "today" | "tomorrow" | "weekend";

// type Event = {
//   _id: string; emoji?: string; title: string;
//   kind: "free" | "paid" | "service";
//   priceCents?: number; date?: string; time?: string;
//   joinPolicy?: "open" | "approval"; attendance?: number; attendees?: any[];
//   location?: { formattedAddress?: string; city?: string; admin1?: string; admin1Code?: string };
//   creatorName?: string;
// };

// function getDateRange(f: DateFilter) {
//   const now = new Date();
//   const p   = (n: number) => String(n).padStart(2, "0");
//   const fmt = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
//   if (f === "today") { const s = fmt(now); return { from: s, to: s }; }
//   if (f === "tomorrow") {
//     const t = new Date(now); t.setDate(t.getDate() + 1);
//     return { from: fmt(t), to: fmt(t) };
//   }
//   const day = now.getDay(), dSat = day === 0 ? 6 : 6 - day;
//   const sat = new Date(now); sat.setDate(now.getDate() + dSat);
//   const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
//   return { from: fmt(sat), to: fmt(sun) };
// }

// // ─────────────────────────────────────────────────────────────
// //  SCREEN
// // ─────────────────────────────────────────────────────────────
// export default function TripScreen() {
//   const insets = useSafeAreaInsets();
//   const router = useRouter();

//   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [catFilter,  setCatFilter]  = useState<CatFilter>("All");
//   const [dateFilter, setDateFilter] = useState<DateFilter>("today");
//   const [search,     setSearch]     = useState("");
//   const [events,     setEvents]     = useState<Event[]>([]);
//   const [loading,    setLoading]    = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [city,       setCity]       = useState("Nearby");
//   const [wishlist,   setWishlist]   = useState<Set<string>>(new Set());

//   const fade = useRef(new Animated.Value(0)).current;
//   useEffect(() => {
//     Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
//   }, []);

//   useEffect(() => {
//     (async () => {
//       try {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== "granted") return;
//         const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
//         const rev = await Location.reverseGeocodeAsync({ latitude: cur.coords.latitude, longitude: cur.coords.longitude });
//         const c = (rev?.[0]?.city || "").trim();
//         if (c) setCity(c);
//       } catch {}
//     })();
//   }, []);

//   const headers = useMemo(() => ({
//     "Content-Type": "application/json",
//     ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//   }), [EVENT_API_KEY]);

//   const load = useCallback(async () => {
//     if (!API_BASE) return;
//     setLoading(true);
//     try {
//       const range  = getDateRange(dateFilter);
//       const params = new URLSearchParams({ limit: "100", upcomingOnly: "true" });
//       if (range) { params.set("dateFrom", range.from); params.set("dateTo", range.to); }
//       const res  = await apiFetch(`${API_BASE}/api/events/get-events?${params}`, { method: "GET", headers });
//       const json = await res.json().catch(() => ({}));
//       setEvents(Array.isArray(json?.events) ? json.events : []);
//     } catch { setEvents([]); }
//     finally  { setLoading(false); setRefreshing(false); }
//   }, [API_BASE, headers, dateFilter]);

//   useEffect(() => { load(); }, [load]);
//   const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

//   const toggleWish = useCallback((id: string) => {
//     setWishlist(prev => {
//       const n = new Set(prev);
//       n.has(id) ? n.delete(id) : n.add(id);
//       return n;
//     });
//   }, []);

//   const filtered = useMemo(() => {
//     if (!search.trim()) return events;
//     const q = search.toLowerCase();
//     return events.filter(e =>
//       e.title.toLowerCase().includes(q) ||
//       (e.location?.city ?? "").toLowerCase().includes(q) ||
//       (e.creatorName ?? "").toLowerCase().includes(q),
//     );
//   }, [events, search]);

//   const sections = useMemo(() => {
//     if (!filtered.length) return [];
//     const chunk = Math.ceil(filtered.length / SECTION_META.length);
//     return SECTION_META
//       .map((m, i) => ({ ...m, events: filtered.slice(i * chunk, i * chunk + chunk).slice(0, 8) }))
//       .filter(s => s.events.length > 0);
//   }, [filtered]);

//   const TOP = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + insets.top;

//   return (
//     <Animated.View style={[S.screen, { paddingTop: TOP, opacity: fade }]}>

//       {/* ── HEADER ── */}
//       <View style={S.header}>
//         <View>
//           <Text style={S.headerTitle}>Trip</Text>
//           <Text style={S.headerSub}>Explore the world</Text>
//         </View>
//         <TouchableOpacity style={S.locationPill} activeOpacity={0.85}>
//           <Ionicons name="location-sharp" size={13} color="#fff" />
//           <Text style={S.locationText} numberOfLines={1}>{city}</Text>
//           <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.75)" />
//         </TouchableOpacity>
//       </View>

//       {/* ── SEARCH + FILTER ── */}
//       <View style={S.searchRow}>
//         <View style={S.searchShell}>
//           <Ionicons name="search-outline" size={17} color={C.hint} />
//           <TextInput
//             value={search} onChangeText={setSearch}
//             placeholder="Search Events or Locations"
//             placeholderTextColor={C.hint}
//             style={S.searchInput}
//             returnKeyType="search"
//           />
//           {!!search && (
//             <TouchableOpacity onPress={() => setSearch("")} hitSlop={12}>
//               <Ionicons name="close-circle" size={16} color={C.hint} />
//             </TouchableOpacity>
//           )}
//         </View>
//         <TouchableOpacity
//           style={S.filterBtn}
//           activeOpacity={0.85}
//           onPress={() => router.push("/newApp/filters" as any)}
//         >
//           <Ionicons name="options-outline" size={20} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* ── CATEGORY PILLS — exactly like Image 2 ── */}
//       <View style={S.catWrapper}>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={S.catRow}
//           bounces={true}
//         >
//           {CATS.map(cat => {
//             const active = catFilter === cat;
//             return (
//               <TouchableOpacity
//                 key={cat}
//                 onPress={() => setCatFilter(cat)}
//                 style={[S.catPill, active && S.catPillActive]}
//                 activeOpacity={0.75}
//               >
//                 <Text style={[S.catText, active && S.catTextActive]}>{cat}</Text>
//               </TouchableOpacity>
//             );
//           })}
//         </ScrollView>
//       </View>

//       {/* ── MAIN SCROLL ── */}
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
//         contentContainerStyle={{ paddingBottom: 100 }}
//       >
//         {loading && !refreshing ? (
//           <View style={S.center}>
//             <View style={S.loadingBox}><Text style={{ fontSize: 36 }}>🔍</Text></View>
//             <Text style={S.loadingTitle}>Finding events…</Text>
//             <Text style={S.loadingSub}>Looking around {city}</Text>
//           </View>
//         ) : sections.length === 0 ? (
//           <View style={S.empty}>
//             <Text style={{ fontSize: 50, marginBottom: 14 }}>🗓️</Text>
//             <Text style={S.emptyTitle}>{search ? `No results for "${search}"` : "No events found"}</Text>
//             <Text style={S.emptySub}>
//               {search ? "Try a different keyword." : "Pull to refresh or adjust filters."}
//             </Text>
//             {!!search && (
//               <TouchableOpacity onPress={() => setSearch("")} style={S.emptyBtn}>
//                 <Text style={S.emptyBtnText}>Clear search</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         ) : (
//           sections.map(sec => (
//             <View key={sec.key} style={S.section}>
//               <View style={S.sectionHead}>
//                 <View>
//                   <Text style={S.sectionTitle}>{sec.title}</Text>
//                   <Text style={S.sectionSub}>{sec.sub}</Text>
//                 </View>
//                 {/* ── VIEW ALL — works ── */}
//                 <TouchableOpacity
//                   activeOpacity={0.75}
//                   onPress={() =>
//                     router.push({
//                       pathname: "/newApp/explore" as any,
//                       params: { section: sec.title },
//                     })
//                   }
//                 >
//                   <Text style={S.viewAll}>View All</Text>
//                 </TouchableOpacity>
//               </View>

//               <ScrollView horizontal showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={S.cardStrip}>
//                 {sec.events.map((ev, i) => (
//                   <EventCard
//                     key={ev._id} ev={ev} index={i}
//                     wished={wishlist.has(ev._id)}
//                     onWish={() => toggleWish(ev._id)}
//                     onPress={() => router.push({
//                       pathname: "/event-interest/[eventId]" as any,
//                       params: { eventId: ev._id, kind: ev.kind, title: ev.title, emoji: ev.emoji || "📍" },
//                     })}
//                   />
//                 ))}
//               </ScrollView>
//             </View>
//           ))
//         )}
//       </ScrollView>
//     </Animated.View>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// //  EVENT CARD
// //  Key fix: cardTop (flex:1, overflow hidden) + cardFooter (fixed at bottom)
// //  → no matter how long title/location is, Free+Book never moves
// // ─────────────────────────────────────────────────────────────
// function EventCard({ ev, index, wished, onWish, onPress }: {
//   ev: Event; index: number; wished: boolean; onWish: () => void; onPress: () => void;
// }) {
//   const op         = useRef(new Animated.Value(0)).current;
//   const slide      = useRef(new Animated.Value(16)).current;
//   const heartScale = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(op,    { toValue: 1, duration: 280, delay: Math.min(index * 55, 220), useNativeDriver: true }),
//       Animated.timing(slide, { toValue: 0, duration: 280, delay: Math.min(index * 55, 220), useNativeDriver: true }),
//     ]).start();
//   }, []);

//   const handleWish = () => {
//     Animated.sequence([
//       Animated.timing(heartScale, { toValue: 1.45, duration: 100, useNativeDriver: true }),
//       Animated.timing(heartScale, { toValue: 1,    duration: 100, useNativeDriver: true }),
//     ]).start();
//     onWish();
//   };

//   const pal    = PALETTES[index % PALETTES.length];
//   const isPaid = ev.kind === "paid";
//   const price  = isPaid ? `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}` : "Free";
//   const loc    = ev.location?.city
//     ? [ev.location.city, ev.location.admin1 || ev.location.admin1Code].filter(Boolean).join(", ")
//     : ev.location?.formattedAddress ?? "";

//   return (
//     <Animated.View style={{ opacity: op, transform: [{ translateY: slide }] }}>
//       <TouchableOpacity style={[S.card, { width: CARD_W }]} onPress={onPress} activeOpacity={0.88}>

//         {/* ── Image area ── */}
//         <View style={[S.cardImg, { backgroundColor: pal.bg }]}>
//           <Text style={S.cardEmoji}>{ev.emoji || "📍"}</Text>
//           <TouchableOpacity style={S.heartBtn} onPress={handleWish} activeOpacity={0.8} hitSlop={10}>
//             <Animated.View style={{ transform: [{ scale: heartScale }] }}>
//               <Ionicons name={wished ? "heart" : "heart-outline"} size={17} color={wished ? C.red : C.ink2} />
//             </Animated.View>
//           </TouchableOpacity>
//         </View>

//         {/* ── Body: fixed total height, footer always pinned to bottom ── */}
//         <View style={S.cardBody}>

//           {/* Top section — clips gracefully if content is long */}
//           <View style={S.cardTop}>
//             {/* Title: max 1 line → never overflows */}
//             <Text style={S.cardTitle} numberOfLines={1}>{ev.title}</Text>

//             {!!loc && (
//               <View style={S.metaRow}>
//                 <Ionicons name="location-sharp" size={10} color={C.green} />
//                 <Text style={S.metaText} numberOfLines={1}>{loc}</Text>
//               </View>
//             )}
//             {!!(ev.time || ev.date) && (
//               <View style={S.metaRow}>
//                 <Ionicons name="time-outline" size={10} color={C.muted} />
//                 <Text style={S.metaText} numberOfLines={1}>{ev.time || ev.date}</Text>
//               </View>
//             )}
//           </View>

//           {/* Footer always static at bottom — never moves */}
//           <View style={S.cardFooter}>
//             <Text style={[S.cardPrice, { color: isPaid ? C.ink : C.green }]}>{price}</Text>
//             <TouchableOpacity style={S.bookBtn} onPress={onPress} activeOpacity={0.85}>
//               <Text style={S.bookBtnText}>Book</Text>
//             </TouchableOpacity>
//           </View>

//         </View>
//       </TouchableOpacity>
//     </Animated.View>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// //  STYLES
// // ─────────────────────────────────────────────────────────────
// const S = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: C.bg },

//   /* Header */
//   header: {
//     flexDirection: "row", alignItems: "flex-start",
//     justifyContent: "space-between",
//     paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6,
//   },
//   headerTitle: { fontSize: 28, fontWeight: "900", color: C.ink, letterSpacing: -0.6 },
//   headerSub:   { fontSize: 13, color: C.muted, fontWeight: "600", marginTop: 1 },
//   locationPill: {
//     flexDirection: "row", alignItems: "center", gap: 5,
//     backgroundColor: C.green, borderRadius: 22,
//     paddingHorizontal: 12, paddingVertical: 9, maxWidth: 140,
//     shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.30, shadowRadius: 8, elevation: 5,
//   },
//   locationText: { color: "#fff", fontSize: 12, fontWeight: "800", flex: 1 },

//   /* Search */
//   searchRow: {
//     flexDirection: "row", alignItems: "center", gap: 10,
//     paddingHorizontal: 20, paddingVertical: 10,
//   },
//   searchShell: {
//     flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
//     backgroundColor: C.white, borderRadius: 14,
//     borderWidth: 1.5, borderColor: C.border,
//     paddingHorizontal: 14, paddingVertical: 11,
//     shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
//   },
//   searchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: C.ink },
//   filterBtn: {
//     width: 46, height: 46, borderRadius: 14,
//     backgroundColor: C.green, alignItems: "center", justifyContent: "center",
//     shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.30, shadowRadius: 8, elevation: 5,
//   },

//   /* ── Category pills — matching Image 2 exactly ──
//      White bg, visible border (#DEDEDE), rounded pill, proper padding.
//      Active = solid green fill, white text.
//   */
//   catWrapper: {
//     height: 52,                    // fixed row height — no clipping
//     justifyContent: "center",
//     marginBottom: 4,
//   },
//   catRow: {
//     paddingHorizontal: 20,
//     paddingVertical: 6,            // vertical breathing room
//     gap: 8,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   catPill: {
//     height: 36,
//     paddingHorizontal: 16,
//     borderRadius: 999,
//     backgroundColor: C.white,
//     borderWidth: 1.5,
//     borderColor: C.border,         // visible grey outline
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   catPillActive: {
//     backgroundColor: C.green,
//     borderColor: C.green,
//   },
//   catText: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: C.ink2,                 // darker than muted → readable on white like Image 2
//     lineHeight: 18,
//   },
//   catTextActive: {
//     color: "#FFFFFF",
//     fontWeight: "800",
//   },

//   /* Sections */
//   section:     { marginTop: 24 },
//   sectionHead: {
//     flexDirection: "row", alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20, marginBottom: 14,
//   },
//   sectionTitle: { fontSize: 20, fontWeight: "900", color: C.ink, letterSpacing: -0.4 },
//   sectionSub:   { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
//   viewAll:      { fontSize: 13, fontWeight: "800", color: C.green },
//   cardStrip:    { paddingHorizontal: 20, gap: 12 },

//   /* ── Card ── */
//   card: {
//     backgroundColor: C.white, borderRadius: 18, overflow: "hidden",
//     shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
//   },
//   cardImg: {
//     width: "100%", height: CARD_IMG,
//     alignItems: "center", justifyContent: "center",
//   },
//   cardEmoji: { fontSize: 48 },
//   heartBtn: {
//     position: "absolute", top: 10, right: 10,
//     width: 32, height: 32, borderRadius: 10,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     alignItems: "center", justifyContent: "center",
//     shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.10, shadowRadius: 3, elevation: 2,
//   },

//   /* Fixed-height body: top section clips, footer always at bottom */
//   cardBody: {
//     height: CARD_BODY,
//     paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10,
//     justifyContent: "space-between",   // ← pushes footer to bottom always
//   },
//   /* Top text section: flex + overflow hidden so it never overflows into footer */
//   cardTop: {
//     flex: 1,
//     overflow: "hidden",
//     marginBottom: 6,
//   },
//   cardTitle: {
//     fontSize: 13, fontWeight: "900", color: C.ink,
//     letterSpacing: -0.2, lineHeight: 18,
//     marginBottom: 4,
//   },
//   metaRow:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
//   metaText: { fontSize: 10, fontWeight: "600", color: C.muted, flex: 1 },

//   /* Footer — always at bottom, never pushed down by long text */
//   cardFooter: {
//     flexDirection: "row", alignItems: "center",
//     justifyContent: "space-between",
//     flexShrink: 0,                     // ← never shrinks
//   },
//   cardPrice:   { fontSize: 14, fontWeight: "900" },
//   bookBtn: {
//     backgroundColor: C.green, borderRadius: 10,
//     paddingHorizontal: 14, paddingVertical: 6,
//   },
//   bookBtnText: { color: "#fff", fontSize: 11, fontWeight: "900" },

//   /* States */
//   center:      { alignItems: "center", paddingTop: 80 },
//   loadingBox: {
//     width: 84, height: 84, borderRadius: 24, backgroundColor: C.greenLt,
//     borderWidth: 1.5, borderColor: C.green + "44",
//     alignItems: "center", justifyContent: "center", marginBottom: 16,
//   },
//   loadingTitle: { fontSize: 16, fontWeight: "900", color: C.ink, marginBottom: 4 },
//   loadingSub:   { fontSize: 13, fontWeight: "600", color: C.muted },
//   empty:        { alignItems: "center", paddingTop: 80 },
//   emptyTitle:   { fontSize: 18, fontWeight: "900", color: C.ink, marginBottom: 8, textAlign: "center" },
//   emptySub:     { fontSize: 13, color: C.muted, fontWeight: "600", textAlign: "center", paddingHorizontal: 28, lineHeight: 20 },
//   emptyBtn:     { marginTop: 18, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 99, backgroundColor: C.green },
//   emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "900" },
// });
// app/newApp/trip.tsx
// Shows 2 events per section in a 2-column grid (like Image 2).
// "View All" → section-events.tsx with full list.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, StyleSheet, Platform, StatusBar,
  Animated, Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { apiFetch } from "../../lib/apiFetch";

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get("window");
const GRID_PAD  = 20;          // horizontal padding on screen
const GRID_GAP  = 12;          // gap between 2 cards
const CARD_W    = Math.floor((SW - GRID_PAD * 2 - GRID_GAP) / 2);
const CARD_IMG  = 130;         // image area height
const CARD_BODY = 106;         // body area height — always same

const C = {
  bg:      "#F7F8F4",
  white:   "#FFFFFF",
  green:   "#22C55E",
  greenLt: "#E6F5EE",
  ink:     "#191919",
  ink2:    "#3A3A3A",
  muted:   "#888888",
  hint:    "#C0C0C0",
  border:  "#DEDEDE",
  red:     "#FF4B6E",
};

const PALETTES = [
  "#D3E9DE", "#D4E5F7", "#F5DDD3",
  "#EAD9F5", "#F5EAD1", "#D3EDF5",
];

export const SECTION_META = [
  { key: "s1", title: "Morning Rituals",  sub: "Start your day right",  subTitle: "Start Your Day Right"  },
  { key: "s2", title: "Culinary Trails",  sub: "Savour every moment",   subTitle: "Savour Every Moment"   },
  { key: "s3", title: "Wellness Escapes", sub: "Rejuvenate your mind",  subTitle: "Rejuvenate Your Mind"  },
];

const CATS = ["All", "Fitness", "Wellness", "Food", "Active", "Nightlife"] as const;
type CatFilter  = typeof CATS[number];
type DateFilter = "today" | "tomorrow" | "weekend";

export type TripEvent = {
  _id: string; emoji?: string; title: string;
  kind: "free" | "paid" | "service";
  priceCents?: number; date?: string; time?: string;
  description?: string;
  joinPolicy?: "open" | "approval"; attendance?: number; attendees?: any[];
  location?: { formattedAddress?: string; city?: string; admin1?: string; admin1Code?: string };
  creatorName?: string;
};

function getDateRange(f: DateFilter) {
  const now = new Date();
  const p   = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  if (f === "today")    { const s = fmt(now); return { from: s, to: s }; }
  if (f === "tomorrow") {
    const t = new Date(now); t.setDate(t.getDate() + 1);
    return { from: fmt(t), to: fmt(t) };
  }
  const day = now.getDay(), dSat = day === 0 ? 6 : 6 - day;
  const sat = new Date(now); sat.setDate(now.getDate() + dSat);
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  return { from: fmt(sat), to: fmt(sun) };
}

// ─────────────────────────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────────────────────────
export default function TripScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [catFilter,  setCatFilter]  = useState<CatFilter>("All");
  const [dateFilter]                = useState<DateFilter>("today");
  const [search,     setSearch]     = useState("");
  const [events,     setEvents]     = useState<TripEvent[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [city,       setCity]       = useState("Nearby");
  const [wishlist,   setWishlist]   = useState<Set<string>>(new Set());

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 360, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const rev = await Location.reverseGeocodeAsync({ latitude: cur.coords.latitude, longitude: cur.coords.longitude });
        const c = (rev?.[0]?.city || "").trim();
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
      const range  = getDateRange(dateFilter);
      const params = new URLSearchParams({ limit: "100", upcomingOnly: "true" });
      if (range) { params.set("dateFrom", range.from); params.set("dateTo", range.to); }
      const res  = await apiFetch(`${API_BASE}/api/events/get-events?${params}`, { method: "GET", headers });
      const json = await res.json().catch(() => ({}));
      setEvents(Array.isArray(json?.events) ? json.events : []);
    } catch { setEvents([]); }
    finally  { setLoading(false); setRefreshing(false); }
  }, [API_BASE, headers, dateFilter]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const toggleWish = useCallback((id: string) => {
    setWishlist(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.location?.city ?? "").toLowerCase().includes(q) ||
      (e.creatorName ?? "").toLowerCase().includes(q),
    );
  }, [events, search]);

  // Split into sections — each section gets up to ALL events, but we display only 2 in grid.
  // We pass ALL section events to section-events screen via router param.
  const sections = useMemo(() => {
    if (!filtered.length) return [];
    const chunk = Math.ceil(filtered.length / SECTION_META.length);
    return SECTION_META
      .map((m, i) => ({
        ...m,
        events: filtered.slice(i * chunk, i * chunk + chunk), // ALL events for this section
      }))
      .filter(s => s.events.length > 0);
  }, [filtered]);

  const TOP = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + insets.top;

  return (
    <Animated.View style={[S.screen, { paddingTop: TOP, opacity: fade }]}>

      {/* ── HEADER ── */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>Trip</Text>
          <Text style={S.headerSub}>Explore the world</Text>
        </View>
        <TouchableOpacity style={S.locationPill} activeOpacity={0.85}>
          <Ionicons name="location-sharp" size={13} color="#fff" />
          <Text style={S.locationText} numberOfLines={1}>{city}</Text>
          <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>
      </View>

      {/* ── SEARCH + FILTER ── */}
      <View style={S.searchRow}>
        <View style={S.searchShell}>
          <Ionicons name="search-outline" size={17} color={C.hint} />
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search Events or Locations"
            placeholderTextColor={C.hint}
            style={S.searchInput}
            returnKeyType="search"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={12}>
              <Ionicons name="close-circle" size={16} color={C.hint} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={S.filterBtn}
          activeOpacity={0.85}
          onPress={() => router.push("/newApp/filters" as any)}
        >
          <Ionicons name="options-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── CATEGORY PILLS ── */}
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

      {/* ── MAIN SCROLL ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {loading && !refreshing ? (
          <View style={S.center}>
            <View style={S.loadingBox}><Text style={{ fontSize: 36 }}>🔍</Text></View>
            <Text style={S.loadingTitle}>Finding events…</Text>
            <Text style={S.loadingSub}>Looking around {city}</Text>
          </View>
        ) : sections.length === 0 ? (
          <View style={S.empty}>
            <Text style={{ fontSize: 50, marginBottom: 14 }}>🗓️</Text>
            <Text style={S.emptyTitle}>{search ? `No results for "${search}"` : "No events found"}</Text>
            <Text style={S.emptySub}>
              {search ? "Try a different keyword." : "Pull to refresh or adjust filters."}
            </Text>
            {!!search && (
              <TouchableOpacity onPress={() => setSearch("")} style={S.emptyBtn}>
                <Text style={S.emptyBtnText}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          sections.map(sec => {
            // Only show first 2 events in the grid preview
            const preview = sec.events.slice(0, 2);
            return (
              <View key={sec.key} style={S.section}>
                {/* Section header */}
                <View style={S.sectionHead}>
                  <View>
                    <Text style={S.sectionTitle}>{sec.title}</Text>
                    <Text style={S.sectionSub}>{sec.sub}</Text>
                  </View>
                  {/* VIEW ALL — navigates to section-events screen */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={S.viewAllBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/newApp/section-events" as any,
                        params: {
                          sectionKey:   sec.key,
                          sectionTitle: sec.title,
                          sectionSub:   sec.sub,
                          subTitle:     sec.subTitle,
                          // Pass serialized events to avoid re-fetch on simple nav
                          eventsJson:   JSON.stringify(sec.events),
                        },
                      })
                    }
                  >
                    <Text style={S.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                {/* ── 2-column grid (only 2 cards) ── */}
                <View style={S.gridRow}>
                  {preview.map((ev, i) => (
                    <GridCard
                      key={ev._id}
                      ev={ev}
                      paletteIdx={i}
                      wished={wishlist.has(ev._id)}
                      onWish={() => toggleWish(ev._id)}
                      onPress={() =>
                        router.push({
                          pathname: "/newApp/event-detail" as any,
                          params: { eventId: ev._id, kind: ev.kind, title: ev.title, emoji: ev.emoji || "📍" },
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
//  GRID CARD — 2-column, fixed dimensions
// ─────────────────────────────────────────────────────────────
function GridCard({ ev, paletteIdx, wished, onWish, onPress }: {
  ev: TripEvent; paletteIdx: number;
  wished: boolean; onWish: () => void; onPress: () => void;
}) {
  const op         = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 300, delay: paletteIdx * 80, useNativeDriver: true }).start();
  }, []);

  const handleWish = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.45, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
    onWish();
  };

  const isPaid = ev.kind === "paid";
  const price  = isPaid ? `$${((ev.priceCents ?? 0) / 100).toFixed(0)}` : "Free";
  const loc    = ev.location?.city
    ? [ev.location.city, ev.location.admin1 || ev.location.admin1Code].filter(Boolean).join(", ")
    : ev.location?.formattedAddress ?? "";

  return (
    <Animated.View style={{ opacity: op }}>
      <TouchableOpacity style={[G.card, { width: CARD_W }]} onPress={onPress} activeOpacity={0.88}>

        {/* Image area */}
        <View style={[G.imgArea, { backgroundColor: PALETTES[paletteIdx % PALETTES.length] }]}>
          <Text style={G.emoji}>{ev.emoji || "📍"}</Text>
          {/* Heart */}
          <TouchableOpacity style={G.heartBtn} onPress={handleWish} hitSlop={10} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name={wished ? "heart" : "heart-outline"} size={15} color={wished ? C.red : "#555"} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Body — fixed height, footer always at bottom */}
        <View style={G.body}>
          <View style={G.bodyTop}>
            <Text style={G.title} numberOfLines={1}>{ev.title}</Text>
            {!!loc && (
              <View style={G.metaRow}>
                <Ionicons name="location-sharp" size={9} color={C.green} />
                <Text style={G.metaText} numberOfLines={1}>{loc}</Text>
              </View>
            )}
            {!!(ev.time || ev.date) && (
              <View style={G.metaRow}>
                <Ionicons name="time-outline" size={9} color={C.muted} />
                <Text style={G.metaText} numberOfLines={1}>{ev.time || ev.date}</Text>
              </View>
            )}
          </View>
          {/* Footer always at bottom */}
          <View style={G.footer}>
            <Text style={[G.price, { color: isPaid ? C.ink : C.green }]}>{price}</Text>
            <TouchableOpacity style={G.bookBtn} onPress={onPress} activeOpacity={0.85}>
              <Text style={G.bookTxt}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>

      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: GRID_PAD, paddingTop: 14, paddingBottom: 6,
  },
  headerTitle: { fontSize: 28, fontWeight: "900", color: C.ink, letterSpacing: -0.6 },
  headerSub:   { fontSize: 13, color: C.muted, fontWeight: "600", marginTop: 1 },
  locationPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.green, borderRadius: 22,
    paddingHorizontal: 12, paddingVertical: 9, maxWidth: 140,
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 5,
  },
  locationText: { color: "#fff", fontSize: 12, fontWeight: "800", flex: 1 },

  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: GRID_PAD, paddingVertical: 10,
  },
  searchShell: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 11,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: C.ink },
  filterBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: C.green, alignItems: "center", justifyContent: "center",
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 5,
  },

  catWrapper: { height: 52, justifyContent: "center", marginBottom: 4 },
  catRow:     { paddingHorizontal: GRID_PAD, paddingVertical: 6, gap: 8, flexDirection: "row", alignItems: "center" },
  catPill: {
    height: 36, paddingHorizontal: 16, borderRadius: 999,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  catPillActive: { backgroundColor: C.green, borderColor: C.green },
  catText:       { fontSize: 13, fontWeight: "600", color: C.ink2, lineHeight: 18 },
  catTextActive: { color: "#fff", fontWeight: "800" },

  section:     { marginTop: 24 },
  sectionHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: GRID_PAD, marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: C.ink, letterSpacing: -0.4 },
  sectionSub:   { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
  viewAllBtn:   { paddingVertical: 4, paddingLeft: 12 },
  viewAllText:  { fontSize: 13, fontWeight: "800", color: C.green },

  // 2-column grid row
  gridRow: {
    flexDirection: "row",
    paddingHorizontal: GRID_PAD,
    gap: GRID_GAP,
  },

  center:      { alignItems: "center", paddingTop: 80 },
  loadingBox: {
    width: 84, height: 84, borderRadius: 24, backgroundColor: C.greenLt,
    borderWidth: 1.5, borderColor: C.green + "44",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  loadingTitle: { fontSize: 16, fontWeight: "900", color: C.ink, marginBottom: 4 },
  loadingSub:   { fontSize: 13, fontWeight: "600", color: C.muted },
  empty:        { alignItems: "center", paddingTop: 80 },
  emptyTitle:   { fontSize: 18, fontWeight: "900", color: C.ink, marginBottom: 8, textAlign: "center" },
  emptySub:     { fontSize: 13, color: C.muted, fontWeight: "600", textAlign: "center", paddingHorizontal: 28, lineHeight: 20 },
  emptyBtn:     { marginTop: 18, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 99, backgroundColor: C.green },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});

// Grid card styles
const G = StyleSheet.create({
  card: {
    backgroundColor: C.white, borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  imgArea: {
    width: "100%", height: CARD_IMG,
    alignItems: "center", justifyContent: "center",
  },
  emoji: { fontSize: 42 },
  heartBtn: {
    position: "absolute", top: 8, right: 8,
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10, shadowRadius: 2, elevation: 2,
  },
  body: {
    height: CARD_BODY,
    paddingHorizontal: 10, paddingTop: 9, paddingBottom: 9,
    justifyContent: "space-between",
  },
  bodyTop: { flex: 1, overflow: "hidden" },
  title: { fontSize: 12, fontWeight: "900", color: C.ink, letterSpacing: -0.2, marginBottom: 4, lineHeight: 16 },
  metaRow:  { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  metaText: { fontSize: 9, fontWeight: "600", color: C.muted, flex: 1 },
  footer:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  price:    { fontSize: 13, fontWeight: "900" },
  bookBtn:  { backgroundColor: C.green, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5 },
  bookTxt:  { color: "#fff", fontSize: 10, fontWeight: "900" },
});