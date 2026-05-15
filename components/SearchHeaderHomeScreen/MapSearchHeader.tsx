// // // app/components/Map/MapSearchHeader.tsx
// // import React, { useEffect,useMemo, useRef, useState } from "react";
// // import {
// //   View,
// //   TextInput,
// //   StyleSheet,
// //   Pressable,
// //   FlatList,
// //   Text,
// //   Keyboard,
// //   ActivityIndicator,
// //   Platform,
// // } from "react-native";
// // import Ionicons from "@expo/vector-icons/Ionicons";
// // import Constants from "expo-constants";
// // import ProfileHeaderButton from "./ProfileHeaderButton";
// // import { ScrollView, TouchableOpacity } from "react-native";
// // import { Modalize } from "react-native-modalize";

// // // ✅ reuse your shared google places helpers
// // import { fetchAutocomplete, fetchPlaceDetails } from "../AddEventModal/google/places";
// // import type { Suggestion } from "../AddEventModal/types";
// // type Filter = { key: string; label: string; icon: any };

// // const ALL_FILTERS: Filter[] = [
// //   { key: "coffee", label: "Coffee", icon: "cafe-outline" },
// //   { key: "yoga", label: "Yoga", icon: "body-outline" },
// //   { key: "running", label: "Running", icon: "fitness-outline" },
// //   { key: "game", label: "Game", icon: "game-controller-outline" },
// //   { key: "movie", label: "Movie", icon: "film-outline" },
// //   { key: "dinner", label: "Dinner", icon: "restaurant-outline" },

// //   { key: "walking", label: "Walking", icon: "walk-outline" },
// //   { key: "hiking", label: "Hiking", icon: "trail-sign-outline" },
// //   { key: "music", label: "Music", icon: "musical-notes-outline" },
// //   { key: "party", label: "Party", icon: "sparkles-outline" },
// // ];


// // export default function MapSearchHeader({
// //   top,
// //   onPick,
// //   placeholder = "Search Anshul",
// //   activeFilter,
// //   onFilterChange,
// // }: {
// //   top: number;
// //   onPick: (lat: number, lng: number, label?: string) => void;
// //   placeholder?: string;

// //   // ✅ new
// //   activeFilter: string | null;
// //   onFilterChange: (key: string | null) => void;
// // }) {

// //   const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;

// //   const [q, setQ] = useState("");
// //   const [open, setOpen] = useState(false);
// //   const [items, setItems] = useState<Suggestion[]>([]);
// //   const [loading, setLoading] = useState(false);
// //   const [err, setErr] = useState<string | null>(null);

// //   const inputRef = useRef<TextInput>(null);
// //     const moreRef = useRef<Modalize>(null);
// //   const quick = useMemo(() => ALL_FILTERS.slice(0, 6), []);
// //   const rest = useMemo(() => ALL_FILTERS.slice(6), []);


// //   const closePanel = () => {
// //     setOpen(false);
// //     setItems([]);
// //     setErr(null);
// //     Keyboard.dismiss();
// //   };

// //   // Autocomplete (debounced) — via shared helper
// //   useEffect(() => {
// //     if (!open) return;
// //     if (!GOOGLE_KEY) return;

// //     const query = q.trim();

// //     // don't show anything until user types
// //     if (query.length === 0) {
// //       setItems([]);
// //       setErr(null);
// //       return;
// //     }

// //     // small guard to reduce calls
// //     if (query.length < 2) {
// //       setItems([]);
// //       setErr(null);
// //       return;
// //     }

// //     const t = setTimeout(() => {
// //       fetchAutocomplete({
// //         key: GOOGLE_KEY,
// //         q: query,
// //         setLoading,
// //         setList: setItems,
// //         setErr,
// //       });
// //     }, 250);

// //     return () => clearTimeout(t);
// //   }, [q, open, GOOGLE_KEY]);

// //   async function pick(placeId: string, label: string) {
// //     if (!GOOGLE_KEY) return;

// //     try {
// //       setLoading(true);
// //       setErr(null);

// //       const details = await fetchPlaceDetails(GOOGLE_KEY, placeId);
// //       const lat = details?.latLng?.lat;
// //       const lng = details?.latLng?.lng;

// //       if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

// //       const finalLabel = details?.formattedAddress || label;

// //       setQ(finalLabel);
// //       setOpen(false);
// //       setItems([]);
// //       Keyboard.dismiss();
// //       onPick(lat!, lng!, finalLabel);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }

// //   const panelTop = top + 62; // below the bar

// //   return (
// //     <>
// //       {/* bar */}
// //       <View pointerEvents="box-none" style={[styles.wrap, { top }]}>
// //         {/* entire bar clickable */}
// //         <Pressable
// //           style={({ pressed }) => [styles.bar, pressed && styles.barPressed]}
// //           onPress={() => {
// //             setOpen(true);
// //             inputRef.current?.focus();
// //           }}
// //         >
// //           <View style={styles.iconPill}>
// //             <Ionicons name="search" size={18} color="#0F172A" />
// //           </View>

// //           <TextInput
// //             ref={inputRef}
// //             value={q}
// //             onChangeText={(t) => {
// //               setQ(t);
// //               if (!open) setOpen(true);
// //             }}
// //             onFocus={() => setOpen(true)}
// //             placeholder={GOOGLE_KEY ? placeholder : "Missing googleMapsKey"}
// //             placeholderTextColor="#94A3B8"
// //             style={styles.input}
// //             returnKeyType="search"
// //             autoCorrect={false}
// //           />

// //           {loading ? (
// //             <View style={styles.trailingPill}>
// //               <ActivityIndicator size="small" />
// //             </View>
// //           ) : q.trim().length ? (
// //             <Pressable
// //               hitSlop={10}
// //               onPress={() => {
// //                 setQ("");
// //                 setItems([]);
// //                 setErr(null);
// //                 setOpen(true);
// //                 inputRef.current?.focus();
// //               }}
// //               style={styles.trailingPill}
// //             >
// //               <Ionicons name="close" size={16} color="#334155" />
// //             </Pressable>
// //           ) : (
// //             <View style={styles.trailingSpacer} />
// //           )}

// //           <View style={styles.profile}>
// //             <ProfileHeaderButton size={44} />
// //           </View>
// //         </Pressable>
// //       </View>

// //             {/* filters row */}
// //       <View pointerEvents="box-none" style={[styles.filtersWrap, { top: top + 58 }]}>
// //         <ScrollView
// //           horizontal
// //           showsHorizontalScrollIndicator={false}
// //           contentContainerStyle={styles.filtersRow}
// //         >
// //           {quick.map((f) => {
// //             const active = activeFilter === f.key;
// //             return (
// //               <TouchableOpacity
// //                 key={f.key}
// //                 activeOpacity={0.9}
// //                 onPress={() => onFilterChange(active ? null : f.key)}
// //                 style={[styles.chip, active && styles.chipActive]}
// //               >
// //                 <Ionicons name={f.icon} size={16} color={active ? "#fff" : "#0B1220"} />
// //                 <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
// //                 {active ? <Ionicons name="close" size={14} color="#fff" /> : null}
// //               </TouchableOpacity>
// //             );
// //           })}

// //           <TouchableOpacity
// //             activeOpacity={0.9}
// //             onPress={() => moreRef.current?.open()}
// //             style={[styles.chip, styles.moreChip]}
// //           >
// //             <Ionicons name="options-outline" size={16} color="#0B1220" />
// //             <Text style={styles.chipText}>More</Text>
// //           </TouchableOpacity>
// //         </ScrollView>
// //       </View>

// //       {/* More sheet */}
// //       <Modalize
// //         ref={moreRef}
// //         adjustToContentHeight
// //         handlePosition="inside"
// //         modalStyle={styles.sheet}
// //         handleStyle={styles.handle}
// //       >
// //         <View style={styles.sheetInner}>
// //           <View style={styles.sheetHeader}>
// //             <Text style={styles.sheetTitle}>More filters</Text>

// //             <TouchableOpacity
// //               activeOpacity={0.9}
// //               onPress={() => {
// //                 onFilterChange(null);
// //                 moreRef.current?.close();
// //               }}
// //               style={styles.resetBtn}
// //             >
// //               <Ionicons name="refresh-outline" size={16} color="#0B1220" />
// //               <Text style={styles.resetText}>Reset</Text>
// //             </TouchableOpacity>
// //           </View>

// //           <View style={styles.grid}>
// //             {rest.map((f) => {
// //               const active = activeFilter === f.key;
// //               return (
// //                 <TouchableOpacity
// //                   key={f.key}
// //                   activeOpacity={0.9}
// //                   onPress={() => {
// //                     onFilterChange(active ? null : f.key);
// //                     moreRef.current?.close();
// //                   }}
// //                   style={[styles.gridChip, active && styles.gridChipActive]}
// //                 >
// //                   <Ionicons name={f.icon} size={18} color={active ? "#fff" : "#0B1220"} />
// //                   <Text style={[styles.gridText, active && styles.gridTextActive]}>{f.label}</Text>
// //                 </TouchableOpacity>
// //               );
// //             })}
// //           </View>
// //         </View>
// //       </Modalize>


// //       {/* dropdown */}
// //       {open ? (
// //         <>
// //           {/* Backdrop starts BELOW the bar */}
// //           <Pressable style={[styles.backdrop, { top: panelTop }]} onPress={closePanel} />

// //           <View style={[styles.card, { top: panelTop }]}>
// //             <FlatList
// //               data={items}
// //               keyExtractor={(x) => x.id}
// //               keyboardShouldPersistTaps="always"
// //               renderItem={({ item }) => (
// //                 <Pressable style={styles.row} onPress={() => pick(item.id, item.main)}>
// //                   <View style={styles.rowIcon}>
// //                     <Ionicons name="location-outline" size={18} color="#0F172A" />
// //                   </View>

// //                   <View style={styles.rowTextWrap}>
// //                     <Text style={styles.rowMain} numberOfLines={1}>
// //                       {item.main}
// //                     </Text>
// //                     {!!item.secondary ? (
// //                       <Text style={styles.rowSecondary} numberOfLines={1}>
// //                         {item.secondary}
// //                       </Text>
// //                     ) : null}
// //                   </View>

// //                   <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
// //                 </Pressable>
// //               )}
// //               ListEmptyComponent={
// //                 <View style={styles.empty}>
// //                   <Text style={styles.emptyTitle}>
// //                     {q.trim().length === 0
// //                       ? "Start typing…"
// //                       : q.trim().length < 2
// //                       ? "Type at least 2 letters"
// //                       : loading
// //                       ? "Searching…"
// //                       : err
// //                       ? "Couldn’t fetch results"
// //                       : "No results"}
// //                   </Text>

// //                   {!!err ? <Text style={styles.emptySub}>{err}</Text> : null}
// //                 </View>
// //               }
// //             />
// //           </View>
// //         </>
// //       ) : null}
// //     </>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   wrap: {
// //     position: "absolute",
// //     left: 12,
// //     right: 12,
// //     zIndex: 9999,
// //     elevation: 30,
// //   },

// //   // ✅ upgraded "glassy" pill bar
// //   bar: {
// //     height: 54,
// //     flexDirection: "row",
// //     alignItems: "center",
// //     gap: 10,
// //     paddingLeft: 10,
// //     paddingRight: 8,
// //     borderRadius: 999,
// //     backgroundColor: "rgba(255,255,255,0.92)",
// //     borderWidth: 1,
// //     borderColor: "rgba(15,23,42,0.10)",
// //     shadowColor: "#000",
// //     shadowOpacity: 0.10,
// //     shadowRadius: 18,
// //     shadowOffset: { width: 0, height: 12 },
// //   },
// //   barPressed: {
// //     transform: [{ scale: 0.995 }],
// //     shadowOpacity: 0.14,
// //   },

// //   iconPill: {
// //     width: 36,
// //     height: 36,
// //     borderRadius: 18,
// //     alignItems: "center",
// //     justifyContent: "center",
// //     backgroundColor: "rgba(15,23,42,0.04)",
// //     borderWidth: 1,
// //     borderColor: "rgba(15,23,42,0.06)",
// //   },

// //   input: {
// //     flex: 1,
// //     fontSize: 15,
// //     fontWeight: "800",
// //     color: "#0F172A",
// //     paddingVertical: Platform.OS === "ios" ? 10 : 8,
// //   },

// //   trailingPill: {
// //     width: 32,
// //     height: 32,
// //     borderRadius: 16,
// //     alignItems: "center",
// //     justifyContent: "center",
// //     backgroundColor: "rgba(15,23,42,0.04)",
// //     borderWidth: 1,
// //     borderColor: "rgba(15,23,42,0.06)",
// //   },
// //   trailingSpacer: { width: 32, height: 32 },

// //   profile: {
// //     width: 44,
// //     height: 44,
// //     borderRadius: 22,
// //     overflow: "hidden",
// //     alignItems: "center",
// //     justifyContent: "center",
// //   },

// //   backdrop: {
// //     position: "absolute",
// //     left: 0,
// //     right: 0,
// //     bottom: 0,
// //     backgroundColor: "rgba(2,6,23,0.18)",
// //     zIndex: 9998,
// //   },

// //   // ✅ upgraded dropdown card
// //   card: {
// //     position: "absolute",
// //     left: 12,
// //     right: 12,
// //     maxHeight: 420,
// //     borderRadius: 20,
// //     overflow: "hidden",
// //     backgroundColor: "rgba(255,255,255,0.96)",
// //     borderWidth: 1,
// //     borderColor: "rgba(15,23,42,0.10)",
// //     shadowColor: "#000",
// //     shadowOpacity: 0.16,
// //     shadowRadius: 22,
// //     shadowOffset: { width: 0, height: 18 },
// //     elevation: 20,
// //     zIndex: 9999,
// //   },

// //   row: {
// //     paddingHorizontal: 14,
// //     paddingVertical: 12,
// //     flexDirection: "row",
// //     alignItems: "center",
// //     gap: 12,
// //     borderTopWidth: 1,
// //     borderTopColor: "rgba(15,23,42,0.06)",
// //   },

// //   rowIcon: {
// //     width: 34,
// //     height: 34,
// //     borderRadius: 17,
// //     alignItems: "center",
// //     justifyContent: "center",
// //     backgroundColor: "rgba(15,23,42,0.04)",
// //     borderWidth: 1,
// //     borderColor: "rgba(15,23,42,0.06)",
// //   },

// //   rowTextWrap: { flex: 1 },
// //   rowMain: { color: "#0F172A", fontSize: 14.5, fontWeight: "900" },
// //   rowSecondary: { marginTop: 2, color: "#64748B", fontSize: 12.5, fontWeight: "700" },

// //   empty: { padding: 16 },
// //   emptyTitle: { color: "#334155", fontWeight: "900" },
// //   emptySub: { marginTop: 6, color: "#64748B", fontWeight: "700" },
// //     filtersWrap: {
// //     position: "absolute",
// //     left: 0,
// //     right: 0,
// //     paddingHorizontal: 12,
// //     zIndex: 9997,
// //     elevation: 25,
// //   },
// //   filtersRow: {
// //     paddingVertical: 8,
// //     paddingRight: 18,
// //     gap: 10,
// //   },

// //   chip: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //     gap: 8,
// //     paddingHorizontal: 12,
// //     height: 38,
// //     borderRadius: 999,
// //     backgroundColor: "rgba(255,255,255,0.92)",
// //     borderWidth: 1,
// //     borderColor: "rgba(15,23,42,0.10)",
// //     shadowColor: "#000",
// //     shadowOpacity: 0.08,
// //     shadowRadius: 10,
// //     shadowOffset: { width: 0, height: 8 },
// //   },
// //   chipActive: {
// //     backgroundColor: "rgba(10,132,255,0.95)",
// //     borderColor: "rgba(10,132,255,0.25)",
// //     shadowOpacity: 0.18,
// //   },
// //   chipText: {
// //     fontSize: 13,
// //     fontWeight: "800",
// //     color: "#0B1220",
// //     letterSpacing: 0.2,
// //   },
// //   chipTextActive: { color: "#fff" },
// //   moreChip: { backgroundColor: "rgba(255,255,255,0.88)" },

// //   sheet: {
// //     borderTopLeftRadius: 22,
// //     borderTopRightRadius: 22,
// //     overflow: "hidden",
// //   },
// //   handle: {
// //     width: 56,
// //     height: 5,
// //     borderRadius: 999,
// //     backgroundColor: "rgba(15,23,42,0.18)",
// //     marginTop: 10,
// //   },
// //   sheetInner: { padding: 16, paddingBottom: 22 },
// //   sheetHeader: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //     justifyContent: "space-between",
// //     marginBottom: 14,
// //   },
// //   sheetTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220", letterSpacing: 0.2 },
// //   resetBtn: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //     gap: 6,
// //     paddingHorizontal: 12,
// //     height: 34,
// //     borderRadius: 999,
// //     backgroundColor: "rgba(15,23,42,0.06)",
// //   },
// //   resetText: { fontSize: 13, fontWeight: "900", color: "#0B1220" },

// //   grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
// //   gridChip: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //     gap: 8,
// //     paddingHorizontal: 12,
// //     height: 42,
// //     borderRadius: 14,
// //     backgroundColor: "rgba(255,255,255,0.96)",
// //     borderWidth: 1,
// //     borderColor: "rgba(15,23,42,0.10)",
// //   },
// //   gridChipActive: {
// //     backgroundColor: "rgba(10,132,255,0.95)",
// //     borderColor: "rgba(10,132,255,0.25)",
// //   },
// //   gridText: { fontSize: 13, fontWeight: "900", color: "#0B1220" },
// //   gridTextActive: { color: "#fff" },

// // });









// // components/SearchHeaderHomeScreen/MapSearchHeader.tsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   View, TextInput, StyleSheet, Pressable, FlatList, Text,
//   Keyboard, ActivityIndicator, Platform, ScrollView, TouchableOpacity,
// } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import Constants from "expo-constants";
// import { Modalize } from "react-native-modalize";

// import ProfileHeaderButton from "./ProfileHeaderButton";
// import { fetchAutocomplete, fetchPlaceDetails } from "../AddEventModal/google/places";
// import type { Suggestion } from "../AddEventModal/types";

// // ─── Activity filters (existing) ───────────────────────────────────────────
// type Filter = { key: string; label: string; icon: any };

// const ACTIVITY_FILTERS: Filter[] = [
//   { key: "coffee",  label: "Coffee",  icon: "cafe-outline" },
//   { key: "yoga",    label: "Yoga",    icon: "body-outline" },
//   { key: "running", label: "Running", icon: "fitness-outline" },
//   { key: "game",    label: "Game",    icon: "game-controller-outline" },
//   { key: "movie",   label: "Movie",   icon: "film-outline" },
//   { key: "dinner",  label: "Dinner",  icon: "restaurant-outline" },
//   { key: "walking", label: "Walking", icon: "walk-outline" },
//   { key: "hiking",  label: "Hiking",  icon: "trail-sign-outline" },
//   { key: "music",   label: "Music",   icon: "musical-notes-outline" },
//   { key: "party",   label: "Party",   icon: "sparkles-outline" },
// ];

// // ─── Kind filters (NEW) ────────────────────────────────────────────────────
// type KindFilter = { key: string; label: string; color: string; activeColor: string; dotColor: string };

// const KIND_FILTERS: KindFilter[] = [
//   { key: "free",    label: "⚪ Free",    color: "rgba(34,197,94,0.12)",  activeColor: "#16a34a", dotColor: "#22c55e" },
//   { key: "paid",    label: "🟡 Paid",    color: "rgba(234,179,8,0.12)",  activeColor: "#b45309", dotColor: "#eab308" },
//   { key: "service", label: "🟣 Service", color: "rgba(139,92,246,0.12)", activeColor: "#7c3aed", dotColor: "#8b5cf6" },
// ];

// export default function MapSearchHeader({
//   top,
//   onPick,
//   placeholder = "Search places…",
//   activeFilter,
//   onFilterChange,
// }: {
//   top: number;
//   onPick: (lat: number, lng: number, label?: string) => void;
//   placeholder?: string;
//   activeFilter: string | null;
//   onFilterChange: (key: string | null) => void;
// }) {
//   const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;

//   const [q, setQ] = useState("");
//   const [open, setOpen] = useState(false);
//   const [items, setItems] = useState<Suggestion[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);

//   const inputRef = useRef<TextInput>(null);
//   const moreRef = useRef<Modalize>(null);

//   const quickActivity = useMemo(() => ACTIVITY_FILTERS.slice(0, 4), []);
//   const restActivity  = useMemo(() => ACTIVITY_FILTERS.slice(4), []);

//   const closePanel = () => { setOpen(false); setItems([]); setErr(null); Keyboard.dismiss(); };

//   // Autocomplete debounced
//   useEffect(() => {
//     if (!open || !GOOGLE_KEY) return;
//     const query = q.trim();
//     if (query.length < 2) { setItems([]); setErr(null); return; }
//     const t = setTimeout(() => {
//       fetchAutocomplete({ key: GOOGLE_KEY, q: query, setLoading, setList: setItems, setErr });
//     }, 250);
//     return () => clearTimeout(t);
//   }, [q, open, GOOGLE_KEY]);

//   async function pick(placeId: string, label: string) {
//     if (!GOOGLE_KEY) return;
//     try {
//       setLoading(true); setErr(null);
//       const details = await fetchPlaceDetails(GOOGLE_KEY, placeId);
//       const lat = details?.latLng?.lat;
//       const lng = details?.latLng?.lng;
//       if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
//       const finalLabel = details?.formattedAddress || label;
//       setQ(finalLabel); setOpen(false); setItems([]);
//       Keyboard.dismiss();
//       onPick(lat!, lng!, finalLabel);
//     } finally { setLoading(false); }
//   }

//   const panelTop = top + 62;

//   return (
//     <>
//       {/* ── Search bar ─────────────────────────────────────────── */}
//       <View pointerEvents="box-none" style={[styles.wrap, { top }]}>
//         <Pressable
//           style={({ pressed }) => [styles.bar, pressed && styles.barPressed]}
//           onPress={() => { setOpen(true); inputRef.current?.focus(); }}
//         >
//           <View style={styles.iconPill}>
//             <Ionicons name="search" size={18} color="#0F172A" />
//           </View>

//           <TextInput
//             ref={inputRef}
//             value={q}
//             onChangeText={(t) => { setQ(t); if (!open) setOpen(true); }}
//             onFocus={() => setOpen(true)}
//             placeholder={GOOGLE_KEY ? placeholder : "Missing googleMapsKey"}
//             placeholderTextColor="#94A3B8"
//             style={styles.input}
//             returnKeyType="search"
//             autoCorrect={false}
//           />

//           {loading ? (
//             <View style={styles.trailingPill}><ActivityIndicator size="small" /></View>
//           ) : q.trim().length ? (
//             <Pressable
//               hitSlop={10}
//               onPress={() => { setQ(""); setItems([]); setErr(null); setOpen(true); inputRef.current?.focus(); }}
//               style={styles.trailingPill}
//             >
//               <Ionicons name="close" size={16} color="#334155" />
//             </Pressable>
//           ) : (
//             <View style={styles.trailingSpacer} />
//           )}

//           <View style={styles.profile}>
//             <ProfileHeaderButton size={44} />
//           </View>
//         </Pressable>
//       </View>

//       {/* ── Kind pills (Free / Paid / Service) — NEW ──────────── */}
//       <View pointerEvents="box-none" style={[styles.filtersWrap, { top: top + 60 }]}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
//           {KIND_FILTERS.map((f) => {
//             const active = activeFilter === f.key;
//             return (
//               <TouchableOpacity
//                 key={f.key}
//                 activeOpacity={0.9}
//                 onPress={() => onFilterChange(active ? null : f.key)}
//                 style={[
//                   styles.kindChip,
//                   active
//                     ? { backgroundColor: f.activeColor, borderColor: f.activeColor }
//                     : { backgroundColor: "rgba(255,255,255,0.93)", borderColor: "rgba(15,23,42,0.10)" },
//                 ]}
//               >
//                 <View style={[styles.kindDot, { backgroundColor: active ? "#fff" : f.dotColor }]} />
//                 <Text style={[styles.kindChipText, active && styles.kindChipTextActive]}>{f.label}</Text>
//                 {active && <Ionicons name="close" size={12} color="#fff" />}
//               </TouchableOpacity>
//             );
//           })}

//           {/* Divider pill */}
//           <View style={styles.dividerPill} />

//           {/* Activity filters */}
//           {quickActivity.map((f) => {
//             const active = activeFilter === f.key;
//             return (
//               <TouchableOpacity
//                 key={f.key}
//                 activeOpacity={0.9}
//                 onPress={() => onFilterChange(active ? null : f.key)}
//                 style={[styles.chip, active && styles.chipActive]}
//               >
//                 <Ionicons name={f.icon} size={15} color={active ? "#fff" : "#0B1220"} />
//                 <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
//                 {active && <Ionicons name="close" size={12} color="#fff" />}
//               </TouchableOpacity>
//             );
//           })}

//           <TouchableOpacity
//             activeOpacity={0.9}
//             onPress={() => moreRef.current?.open()}
//             style={[styles.chip, styles.moreChip]}
//           >
//             <Ionicons name="options-outline" size={15} color="#0B1220" />
//             <Text style={styles.chipText}>More</Text>
//           </TouchableOpacity>
//         </ScrollView>
//       </View>

//       {/* ── More sheet ─────────────────────────────────────────── */}
//       <Modalize ref={moreRef} adjustToContentHeight handlePosition="inside" modalStyle={styles.sheet} handleStyle={styles.handle}>
//         <View style={styles.sheetInner}>
//           <View style={styles.sheetHeader}>
//             <Text style={styles.sheetTitle}>More filters</Text>
//             <TouchableOpacity
//               activeOpacity={0.9}
//               onPress={() => { onFilterChange(null); moreRef.current?.close(); }}
//               style={styles.resetBtn}
//             >
//               <Ionicons name="refresh-outline" size={16} color="#0B1220" />
//               <Text style={styles.resetText}>Reset all</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Kind section in More */}
//           <Text style={styles.sectionLabel}>Type</Text>
//           <View style={styles.grid}>
//             {KIND_FILTERS.map((f) => {
//               const active = activeFilter === f.key;
//               return (
//                 <TouchableOpacity
//                   key={f.key}
//                   activeOpacity={0.9}
//                   onPress={() => { onFilterChange(active ? null : f.key); moreRef.current?.close(); }}
//                   style={[styles.gridChip, active && { backgroundColor: f.activeColor, borderColor: f.activeColor }]}
//                 >
//                   <View style={[styles.kindDot, { backgroundColor: active ? "#fff" : f.dotColor }]} />
//                   <Text style={[styles.gridText, active && styles.gridTextActive]}>{f.label}</Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>

//           <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Activity</Text>
//           <View style={styles.grid}>
//             {restActivity.map((f) => {
//               const active = activeFilter === f.key;
//               return (
//                 <TouchableOpacity
//                   key={f.key}
//                   activeOpacity={0.9}
//                   onPress={() => { onFilterChange(active ? null : f.key); moreRef.current?.close(); }}
//                   style={[styles.gridChip, active && styles.gridChipActive]}
//                 >
//                   <Ionicons name={f.icon} size={18} color={active ? "#fff" : "#0B1220"} />
//                   <Text style={[styles.gridText, active && styles.gridTextActive]}>{f.label}</Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         </View>
//       </Modalize>

//       {/* ── Search dropdown ────────────────────────────────────── */}
//       {open ? (
//         <>
//           <Pressable style={[styles.backdrop, { top: panelTop }]} onPress={closePanel} />
//           <View style={[styles.card, { top: panelTop }]}>
//             <FlatList
//               data={items}
//               keyExtractor={(x) => x.id}
//               keyboardShouldPersistTaps="always"
//               renderItem={({ item }) => (
//                 <Pressable style={styles.row} onPress={() => pick(item.id, item.main)}>
//                   <View style={styles.rowIcon}>
//                     <Ionicons name="location-outline" size={18} color="#0F172A" />
//                   </View>
//                   <View style={styles.rowTextWrap}>
//                     <Text style={styles.rowMain} numberOfLines={1}>{item.main}</Text>
//                     {!!item.secondary && <Text style={styles.rowSecondary} numberOfLines={1}>{item.secondary}</Text>}
//                   </View>
//                   <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
//                 </Pressable>
//               )}
//               ListEmptyComponent={
//                 <View style={styles.empty}>
//                   <Text style={styles.emptyTitle}>
//                     {q.trim().length === 0 ? "Start typing…"
//                       : q.trim().length < 2 ? "Type at least 2 letters"
//                       : loading ? "Searching…"
//                       : err ? "Couldn't fetch results"
//                       : "No results"}
//                   </Text>
//                   {!!err && <Text style={styles.emptySub}>{err}</Text>}
//                 </View>
//               }
//             />
//           </View>
//         </>
//       ) : null}
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   wrap: { position: "absolute", left: 12, right: 12, zIndex: 9999, elevation: 30 },

//   bar: {
//     height: 54, flexDirection: "row", alignItems: "center", gap: 10,
//     paddingLeft: 10, paddingRight: 8, borderRadius: 999,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
//     shadowColor: "#000", shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: 12 },
//   },
//   barPressed: { transform: [{ scale: 0.995 }], shadowOpacity: 0.14 },

//   iconPill: {
//     width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
//     backgroundColor: "rgba(15,23,42,0.04)", borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
//   },
//   input: { flex: 1, fontSize: 15, fontWeight: "800", color: "#0F172A", paddingVertical: Platform.OS === "ios" ? 10 : 8 },
//   trailingPill: {
//     width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
//     backgroundColor: "rgba(15,23,42,0.04)", borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
//   },
//   trailingSpacer: { width: 32, height: 32 },
//   profile: { width: 44, height: 44, borderRadius: 22, overflow: "hidden", alignItems: "center", justifyContent: "center" },

//   filtersWrap: { position: "absolute", left: 0, right: 0, paddingHorizontal: 12, zIndex: 9997, elevation: 25 },
//   filtersRow: { paddingVertical: 8, paddingRight: 18, gap: 8, flexDirection: "row", alignItems: "center" },

//   // Kind chips
//   kindChip: {
//     flexDirection: "row", alignItems: "center", gap: 6,
//     paddingHorizontal: 10, height: 36, borderRadius: 999, borderWidth: 1,
//     shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 6 },
//   },
//   kindDot: { width: 7, height: 7, borderRadius: 999 },
//   kindChipText: { fontSize: 12, fontWeight: "900", color: "#0B1220" },
//   kindChipTextActive: { color: "#fff" },

//   dividerPill: {
//     width: 1, height: 24, backgroundColor: "rgba(15,23,42,0.15)", borderRadius: 1, marginHorizontal: 2,
//   },

//   // Activity chips
//   chip: {
//     flexDirection: "row", alignItems: "center", gap: 6,
//     paddingHorizontal: 10, height: 36, borderRadius: 999,
//     backgroundColor: "rgba(255,255,255,0.92)", borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
//     shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 6 },
//   },
//   chipActive: { backgroundColor: "rgba(10,132,255,0.95)", borderColor: "rgba(10,132,255,0.25)" },
//   chipText: { fontSize: 12, fontWeight: "900", color: "#0B1220" },
//   chipTextActive: { color: "#fff" },
//   moreChip: { backgroundColor: "rgba(255,255,255,0.88)" },

//   backdrop: {
//     position: "absolute", left: 0, right: 0, bottom: 0,
//     backgroundColor: "rgba(2,6,23,0.18)", zIndex: 9998,
//   },

//   card: {
//     position: "absolute", left: 12, right: 12, maxHeight: 420, borderRadius: 20, overflow: "hidden",
//     backgroundColor: "rgba(255,255,255,0.96)", borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
//     shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 18 },
//     elevation: 20, zIndex: 9999,
//   },
//   row: {
//     paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12,
//     borderTopWidth: 1, borderTopColor: "rgba(15,23,42,0.06)",
//   },
//   rowIcon: {
//     width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
//     backgroundColor: "rgba(15,23,42,0.04)", borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
//   },
//   rowTextWrap: { flex: 1 },
//   rowMain: { color: "#0F172A", fontSize: 14.5, fontWeight: "900" },
//   rowSecondary: { marginTop: 2, color: "#64748B", fontSize: 12.5, fontWeight: "700" },
//   empty: { padding: 16 },
//   emptyTitle: { color: "#334155", fontWeight: "900" },
//   emptySub: { marginTop: 6, color: "#64748B", fontWeight: "700" },

//   // More sheet
//   sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" },
//   handle: { width: 56, height: 5, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.18)", marginTop: 10 },
//   sheetInner: { padding: 16, paddingBottom: 36 },
//   sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
//   sheetTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220", letterSpacing: 0.2 },
//   resetBtn: {
//     flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 34,
//     borderRadius: 999, backgroundColor: "rgba(15,23,42,0.06)",
//   },
//   resetText: { fontSize: 13, fontWeight: "900", color: "#0B1220" },

//   sectionLabel: { fontSize: 11, fontWeight: "900", color: "#64748B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },

//   grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
//   gridChip: {
//     flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 40, borderRadius: 12,
//     backgroundColor: "rgba(255,255,255,0.96)", borderWidth: 1, borderColor: "rgba(15,23,42,0.10)",
//   },
//   gridChipActive: { backgroundColor: "rgba(10,132,255,0.95)", borderColor: "rgba(10,132,255,0.25)" },
//   gridText: { fontSize: 13, fontWeight: "900", color: "#0B1220" },
//   gridTextActive: { color: "#fff" },
// });
// components/SearchHeaderHomeScreen/MapSearchHeader.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, TextInput, StyleSheet, Pressable, FlatList, Text,
  Keyboard, ActivityIndicator, Platform, ScrollView, TouchableOpacity,
  Animated,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { Modalize } from "react-native-modalize";

import ProfileHeaderButton from "./ProfileHeaderButton";
import { fetchAutocomplete, fetchPlaceDetails } from "../AddEventModal/google/places";
import type { Suggestion } from "../AddEventModal/types";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  border:      "rgba(240,235,227,0.95)",
  borderDark:  "rgba(28,26,23,0.10)",
  teal:        "#6ccf3e",
  tealBg:      "#E8FAF7",
  tealText:    "#1A7A6A",
  tealDark:    "#22C55E",
  purple:      "#A78BFA",
  purpleBg:    "#F3F0FF",
  purpleText:  "#5B21B6",
  amber:       "#F59E0B",
  amberBg:     "#FFFBEB",
  amberText:   "#92400E",
  green:       "#22C55E",
  greenText:   "#065F46",
  blue:        "#60A5FA",
  blueText:    "#1D4ED8",
  blueBg:      "#EFF6FF",
};

// ─── Filters ─────────────────────────────────────────────────────────────────
type Filter     = { key: string; label: string; icon: any };
type KindFilter = { key: string; label: string; emoji: string; dotColor: string; activeBg: string; activeText: string; activeBorder: string; icon: any };

const ACTIVITY_FILTERS: Filter[] = [
  { key: "coffee",  label: "Coffee",  icon: "cafe-outline" },
  { key: "yoga",    label: "Yoga",    icon: "body-outline" },
  { key: "running", label: "Running", icon: "fitness-outline" },
  { key: "game",    label: "Game",    icon: "game-controller-outline" },
  { key: "movie",   label: "Movie",   icon: "film-outline" },
  { key: "dinner",  label: "Dinner",  icon: "restaurant-outline" },
  { key: "walking", label: "Walking", icon: "walk-outline" },
  { key: "hiking",  label: "Hiking",  icon: "trail-sign-outline" },
  { key: "music",   label: "Music",   icon: "musical-notes-outline" },
  { key: "party",   label: "Party",   icon: "sparkles-outline" },
];

const KIND_FILTERS: KindFilter[] = [
  {
    key: "free", label: "Free", emoji: "🎁", icon: "gift-outline",
    dotColor: "#22C55E", activeBg: "#DCFCE7", activeText: "#166534", activeBorder: "#22C55E",
  },
  {
    key: "paid", label: "Paid", emoji: "💳", icon: "card-outline",
    dotColor: "#F59E0B", activeBg: "#FEF3C7", activeText: "#92400E", activeBorder: "#F59E0B",
  },
  {
    key: "service", label: "Service", emoji: "💼", icon: "briefcase-outline",
    dotColor: "#8B5CF6", activeBg: "#F3E8FF", activeText: "#5B21B6", activeBorder: "#8B5CF6",
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function MapSearchHeader({
  top,
  onPick,
  placeholder = "Discover events nearby…",
  activeFilter,
  onFilterChange,
}: {
  top: number;
  onPick: (lat: number, lng: number, label?: string) => void;
  placeholder?: string;
  activeFilter: string | null;
  onFilterChange: (key: string | null) => void;
}) {
  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;

  const [q,        setQ]       = useState("");
  const [open,     setOpen]    = useState(false);
  const [focused,  setFocused] = useState(false);
  const [items,    setItems]   = useState<Suggestion[]>([]);
  const [loading,  setLoading] = useState(false);
  const [err,      setErr]     = useState<string | null>(null);

  const inputRef  = useRef<TextInput>(null);
  const moreRef   = useRef<Modalize>(null);
  // Animated value 0 = idle, 1 = focused
  const glowAnim  = useRef(new Animated.Value(0)).current;

  const quickActivity = useMemo(() => ACTIVITY_FILTERS.slice(0, 4), []);
  const restActivity  = useMemo(() => ACTIVITY_FILTERS.slice(4), []);

  // Glow transition on focus/blur
  const triggerGlow = (on: boolean) => {
    Animated.timing(glowAnim, {
      toValue: on ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const barShadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.28] });
  const barShadowRadius  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 22]  });
  const barElevation     = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [6,  14]  });

  const closePanel = () => {
    setOpen(false); setItems([]); setErr(null);
    setFocused(false); triggerGlow(false);
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (!open || !GOOGLE_KEY) return;
    const query = q.trim();
    if (query.length < 2) { setItems([]); setErr(null); return; }
    const t = setTimeout(() => {
      fetchAutocomplete({ key: GOOGLE_KEY, q: query, setLoading, setList: setItems, setErr });
    }, 250);
    return () => clearTimeout(t);
  }, [q, open, GOOGLE_KEY]);

  async function pick(placeId: string, label: string) {
    if (!GOOGLE_KEY) return;
    try {
      setLoading(true); setErr(null);
      const details = await fetchPlaceDetails(GOOGLE_KEY, placeId);
      const lat = details?.latLng?.lat;
      const lng = details?.latLng?.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const finalLabel = details?.formattedAddress || label;
      setQ(finalLabel); setOpen(false); setItems([]);
      Keyboard.dismiss(); triggerGlow(false);
      onPick(lat!, lng!, finalLabel);
    } finally { setLoading(false); }
  }

  const panelTop = top + 66;

  return (
    <>
      {/* ── Search bar ─────────────────────────────────────────── */}
      <View pointerEvents="box-none" style={[S.wrap, { top }]}>
        <Animated.View
          style={[
            S.barOuter,
            {
              shadowOpacity: barShadowOpacity,
              shadowRadius:  barShadowRadius,
              elevation:     barElevation,
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [S.bar, pressed && S.barPressed]}
            onPress={() => { setOpen(true); inputRef.current?.focus(); }}
          >
            {/* Search icon pill */}
            <View style={S.searchIconWrap}>
              <Ionicons name="search" size={18} color="#fff" />
            </View>

            {/* Thin vertical separator */}
            <View style={S.inputSep} />

            <TextInput
              ref={inputRef}
              value={q}
              onChangeText={(t) => { setQ(t); if (!open) setOpen(true); }}
              onFocus={() => { setOpen(true); setFocused(true); triggerGlow(true); }}
              onBlur={() => { setFocused(false); if (!q) triggerGlow(false); }}
              placeholder={GOOGLE_KEY ? placeholder : "Missing googleMapsKey"}
              placeholderTextColor="#AAA8A4"
              style={S.input}
              returnKeyType="search"
              autoCorrect={false}
            />

            {/* Trailing action */}
            {loading ? (
              <View style={S.trailingBtn}>
                <ActivityIndicator size="small" color={C.teal} />
              </View>
            ) : q.trim().length ? (
              <Pressable
                hitSlop={10}
                onPress={() => {
                  setQ(""); setItems([]); setErr(null);
                  setOpen(true); inputRef.current?.focus();
                }}
                style={S.trailingBtn}
              >
                <Ionicons name="close-circle" size={18} color="#C0BAB2" />
              </Pressable>
            ) : (
              <View style={S.trailingSpacer} />
            )}

            {/* Divider before avatar */}
            <View style={S.avatarSep} />

            {/* Profile avatar */}
            <View style={S.profileWrap}>
              <ProfileHeaderButton size={38} />
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* ── Filter chips row ──────────────────────────────────── */}
      <View pointerEvents="box-none" style={[S.filtersWrap, { top: top + 64 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.filtersRow}
        >
          {/* All */}
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => onFilterChange(null)}
            style={[
              S.allChip,
              activeFilter === null
                ? S.allChipActive
                : S.allChipIdle,
            ]}
          >
            <Ionicons
              name="globe-outline"
              size={13}
              color={activeFilter === null ? "#fff" : "#666"}
            />
            <Text style={[S.allChipTxt, activeFilter === null && S.allChipTxtActive]}>
              All
            </Text>
          </TouchableOpacity>

          {/* Kind pills: Free / Paid / Service */}
          {KIND_FILTERS.map((f) => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.82}
                onPress={() => onFilterChange(active ? null : f.key)}
                style={[
                  S.kindChip,
                  active
                    ? { backgroundColor: f.activeBg, borderColor: f.activeBorder + "AA" }
                    : S.kindChipIdle,
                ]}
              >
                <Text style={S.kindChipEmoji}>{f.emoji}</Text>
                <Text style={[S.kindChipTxt, active && { color: f.activeText, fontWeight: "800" }]}>
                  {f.label}
                </Text>
                {active && (
                  <Ionicons name="close-circle" size={13} color={f.activeText} style={{ marginLeft: 1 }} />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Thin vertical separator */}
          <View style={S.chipDivider} />

          {/* Activity filters */}
          {quickActivity.map((f) => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.82}
                onPress={() => onFilterChange(active ? null : f.key)}
                style={[S.actChip, active && S.actChipActive]}
              >
                <Ionicons name={f.icon} size={13} color={active ? C.tealText : "#888"} />
                <Text style={[S.actChipTxt, active && { color: C.tealText, fontWeight: "800" }]}>
                  {f.label}
                </Text>
                {active && <Ionicons name="close-circle" size={12} color={C.tealText} />}
              </TouchableOpacity>
            );
          })}

          {/* More */}
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => moreRef.current?.open()}
            style={S.moreChip}
          >
            <Ionicons name="options-outline" size={13} color="#666" />
            <Text style={S.moreChipTxt}>More</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── More sheet ─────────────────────────────────────────── */}
      <Modalize
        ref={moreRef}
        adjustToContentHeight
        handlePosition="inside"
        modalStyle={S.sheet}
        handleStyle={S.sheetHandle}
      >
        <View style={S.sheetInner}>
          <View style={S.sheetHeader}>
            <Text style={S.sheetTitle}>Filters</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { onFilterChange(null); moreRef.current?.close(); }}
              style={S.resetBtn}
            >
              <Ionicons name="refresh-outline" size={13} color={C.tealText} />
              <Text style={S.resetTxt}>Reset all</Text>
            </TouchableOpacity>
          </View>

          <Text style={S.sheetSectionLbl}>Type</Text>
          <View style={S.grid}>
            {KIND_FILTERS.map((f) => {
              const active = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  activeOpacity={0.85}
                  onPress={() => { onFilterChange(active ? null : f.key); moreRef.current?.close(); }}
                  style={[
                    S.gridChip,
                    active ? { backgroundColor: f.activeBg, borderColor: f.activeBorder + "99" } : {},
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{f.emoji}</Text>
                  <Text style={[S.gridChipTxt, active && { color: f.activeText, fontWeight: "800" }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[S.sheetSectionLbl, { marginTop: 20 }]}>Activity</Text>
          <View style={S.grid}>
            {restActivity.map((f) => {
              const active = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  activeOpacity={0.85}
                  onPress={() => { onFilterChange(active ? null : f.key); moreRef.current?.close(); }}
                  style={[S.gridChip, active && S.gridChipActive]}
                >
                  <Ionicons name={f.icon} size={15} color={active ? C.tealText : "#888"} />
                  <Text style={[S.gridChipTxt, active && { color: C.tealText, fontWeight: "800" }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modalize>

      {/* ── Search dropdown ────────────────────────────────────── */}
      {open ? (
        <>
          <Pressable style={[S.backdrop, { top: panelTop }]} onPress={closePanel} />
          <View style={[S.dropdown, { top: panelTop }]}>
            {/* Dropdown header */}
            {items.length === 0 && (
              <View style={S.ddHeader}>
                <Ionicons name="location-outline" size={13} color={C.teal} />
                <Text style={S.ddHeaderTxt}>
                  {q.trim().length === 0
                    ? "Where do you want to explore?"
                    : q.trim().length < 2
                    ? "Keep typing…"
                    : loading
                    ? "Finding places…"
                    : "No results found"}
                </Text>
              </View>
            )}
            <FlatList
              data={items}
              keyExtractor={(x) => x.id}
              keyboardShouldPersistTaps="always"
              renderItem={({ item, index }) => (
                <Pressable
                  style={[S.ddRow, index === 0 && { borderTopWidth: 0 }]}
                  onPress={() => pick(item.id, item.main)}
                >
                  <View style={S.ddIcon}>
                    <Ionicons name="location" size={15} color={C.tealText} />
                  </View>
                  <View style={S.ddTextWrap}>
                    <Text style={S.ddMain} numberOfLines={1}>{item.main}</Text>
                    {!!item.secondary && (
                      <Text style={S.ddSec} numberOfLines={1}>{item.secondary}</Text>
                    )}
                  </View>
                  <View style={S.ddArrow}>
                    <Ionicons name="chevron-forward" size={13} color="#CCC" />
                  </View>
                </Pressable>
              )}
            />
            {!!err && (
              <View style={S.ddErrorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                <Text style={S.ddErrorTxt}>{err}</Text>
              </View>
            )}
          </View>
        </>
      ) : null}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT   = "#5B4FD4";   // indigo/purple search accent
const ACCENT_L = "#EEF0FF";

const S = StyleSheet.create({
  wrap: { position: "absolute", left: 14, right: 14, zIndex: 9999, elevation: 30 },

  // Outer animated wrapper — carries the shadow so it can animate
  barOuter: {
    borderRadius: 20,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    backgroundColor: "transparent",
  },

  // The actual pill
  bar: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 6, paddingRight: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(220,215,210,0.9)",
    overflow: "hidden",
  },
  barPressed: { transform: [{ scale: 0.995 }] },

  // Search icon: filled accent circle
  searchIconWrap: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: ACCENT,
    marginRight: 2,
    flexShrink: 0,
  },

  inputSep: {
    width: 1, height: 22,
    backgroundColor: "rgba(200,196,190,0.6)",
    marginHorizontal: 10,
    flexShrink: 0,
  },

  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1A17",
    paddingVertical: 0,
    letterSpacing: 0.1,
  },

  trailingBtn: {
    width: 32, height: 32,
    alignItems: "center", justifyContent: "center",
    marginRight: 2,
  },
  trailingSpacer: { width: 32, height: 32, marginRight: 2 },

  avatarSep: {
    width: 1, height: 22,
    backgroundColor: "rgba(200,196,190,0.6)",
    marginHorizontal: 6,
    flexShrink: 0,
  },

  profileWrap: {
    width: 38, height: 38, borderRadius: 13,
    overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: ACCENT + "44",
    flexShrink: 0,
  },

  // ── Filter chips row ────────────────────────────────────────────────────────
  filtersWrap: {
    position: "absolute", left: 0, right: 0,
    paddingHorizontal: 14,
    zIndex: 9997, elevation: 25,
  },
  filtersRow: {
    paddingVertical: 6, paddingRight: 16,
    gap: 8, flexDirection: "row", alignItems: "center",
  },

  // All chip
  allChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 13, height: 34, borderRadius: 999,
    borderWidth: 1.5,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  allChipIdle:       { backgroundColor: "rgba(255,255,255,0.95)", borderColor: "rgba(220,215,210,0.85)" },
  allChipActive:     { backgroundColor: "#1C1A17", borderColor: "#1C1A17" },
  allChipTxt:        { fontSize: 12.5, fontWeight: "700", color: "#666" },
  allChipTxtActive:  { color: "#FFF", fontWeight: "800" },

  // Kind chips (Free / Paid / Service)
  kindChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, height: 34, borderRadius: 999,
    borderWidth: 1.5,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  kindChipIdle: { backgroundColor: "rgba(255,255,255,0.95)", borderColor: "rgba(220,215,210,0.85)" },
  kindChipEmoji: { fontSize: 13 },
  kindChipTxt:   { fontSize: 12.5, fontWeight: "700", color: "#555" },

  // Divider between kind + activity chips
  chipDivider: {
    width: 1, height: 20,
    backgroundColor: "rgba(180,175,168,0.5)",
    borderRadius: 1, marginHorizontal: 2,
  },

  // Activity chips
  actChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, height: 34, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1.5, borderColor: "rgba(220,215,210,0.85)",
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  actChipActive: { backgroundColor: C.tealBg, borderColor: C.teal + "99" },
  actChipTxt:    { fontSize: 12.5, fontWeight: "700", color: "#666" },

  // More chip
  moreChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 13, height: 34, borderRadius: 999,
    backgroundColor: ACCENT_L,
    borderWidth: 1.5, borderColor: ACCENT + "44",
    shadowColor: ACCENT, shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  moreChipTxt: { fontSize: 12.5, fontWeight: "700", color: ACCENT },

  // ── Backdrop ────────────────────────────────────────────────────────────────
  backdrop: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(20,18,15,0.25)", zIndex: 9998,
  },

  // ── Dropdown ────────────────────────────────────────────────────────────────
  dropdown: {
    position: "absolute", left: 14, right: 14, maxHeight: 420,
    borderRadius: 20, overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5, borderColor: "rgba(220,215,210,0.8)",
    shadowColor: ACCENT, shadowOpacity: 0.15, shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 22, zIndex: 9999,
  },
  ddHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(220,215,210,0.5)",
  },
  ddHeaderTxt: { fontSize: 13, fontWeight: "600", color: "#999", flex: 1 },
  ddRow: {
    paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderTopWidth: 1, borderTopColor: "rgba(220,215,210,0.4)",
  },
  ddIcon: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    backgroundColor: ACCENT_L,
    borderWidth: 1, borderColor: ACCENT + "33",
    flexShrink: 0,
  },
  ddTextWrap: { flex: 1 },
  ddMain: { color: "#1C1A17", fontSize: 14.5, fontWeight: "800", letterSpacing: -0.2 },
  ddSec:  { color: "#999", fontSize: 12, fontWeight: "500", marginTop: 2 },
  ddArrow: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F5F4F2",
    flexShrink: 0,
  },
  ddErrorRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: "rgba(220,215,210,0.4)",
  },
  ddErrorTxt: { fontSize: 13, color: "#EF4444", fontWeight: "600", flex: 1 },

  // ── More sheet ──────────────────────────────────────────────────────────────
  sheet:       { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", backgroundColor: "#FFFFFF" },
  sheetHandle: { width: 40, height: 4, borderRadius: 999, backgroundColor: "#E0DDD8", marginTop: 12 },
  sheetInner:  { padding: 22, paddingBottom: 44 },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle:  { fontSize: 20, fontWeight: "900", color: "#1C1A17", letterSpacing: -0.4 },
  resetBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, height: 34, borderRadius: 999,
    backgroundColor: ACCENT_L, borderWidth: 1.5, borderColor: ACCENT + "44",
  },
  resetTxt: { fontSize: 12, fontWeight: "800", color: ACCENT },
  sheetSectionLbl: {
    fontSize: 10.5, fontWeight: "900", color: "#AAA",
    textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  gridChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, height: 42, borderRadius: 14,
    backgroundColor: "#F9F7F4",
    borderWidth: 1.5, borderColor: "rgba(220,215,210,0.8)",
  },
  gridChipActive: { backgroundColor: C.tealBg, borderColor: C.teal + "99" },
  gridChipTxt:    { fontSize: 13.5, fontWeight: "700", color: "#555" },
});