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
type KindFilter = { key: string; label: string; dotColor: string; activeBg: string; activeText: string };

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
  { key: "free",    label: "Free",    dotColor: C.teal,   activeBg: C.tealBg,   activeText: C.tealText },
  { key: "paid",    label: "Paid",    dotColor: C.amber,  activeBg: C.amberBg,  activeText: C.amberText },
  { key: "service", label: "Service", dotColor: C.purple, activeBg: C.purpleBg, activeText: C.purpleText },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function MapSearchHeader({
  top,
  onPick,
  placeholder = "Search places…",
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

  const [q,       setQ]       = useState("");
  const [open,    setOpen]    = useState(false);
  const [items,   setItems]   = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const moreRef  = useRef<Modalize>(null);

  const quickActivity = useMemo(() => ACTIVITY_FILTERS.slice(0, 4), []);
  const restActivity  = useMemo(() => ACTIVITY_FILTERS.slice(4), []);

  const closePanel = () => { setOpen(false); setItems([]); setErr(null); Keyboard.dismiss(); };

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
      const details  = await fetchPlaceDetails(GOOGLE_KEY, placeId);
      const lat = details?.latLng?.lat;
      const lng = details?.latLng?.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const finalLabel = details?.formattedAddress || label;
      setQ(finalLabel); setOpen(false); setItems([]);
      Keyboard.dismiss();
      onPick(lat!, lng!, finalLabel);
    } finally { setLoading(false); }
  }

  const panelTop = top + 62;

  return (
    <>
      {/* ── Search bar ── */}
      <View pointerEvents="box-none" style={[S.wrap, { top }]}>
        <Pressable
          style={({ pressed }) => [S.bar, pressed && S.barPressed]}
          onPress={() => { setOpen(true); inputRef.current?.focus(); }}
        >
          <View style={S.searchIconWrap}>
            <Ionicons name="search" size={17} color={C.teal} />
          </View>

          <TextInput
            ref={inputRef}
            value={q}
            onChangeText={(t) => { setQ(t); if (!open) setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={GOOGLE_KEY ? placeholder : "Missing googleMapsKey"}
            placeholderTextColor={C.hint}
            style={S.input}
            returnKeyType="search"
            autoCorrect={false}
          />

          {loading ? (
            <View style={S.trailingBtn}><ActivityIndicator size="small" color={C.teal} /></View>
          ) : q.trim().length ? (
            <Pressable
              hitSlop={10}
              onPress={() => { setQ(""); setItems([]); setErr(null); setOpen(true); inputRef.current?.focus(); }}
              style={S.trailingBtn}
            >
              <Ionicons name="close" size={15} color={C.muted} />
            </Pressable>
          ) : (
            <View style={S.trailingSpacer} />
          )}

          <View style={S.profileWrap}>
            <ProfileHeaderButton size={40} />
          </View>
        </Pressable>
      </View>

      {/* ── Filter chips row ── */}
      <View pointerEvents="box-none" style={[S.filtersWrap, { top: top + 60 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filtersRow}>

          {/* Kind pills */}
          {KIND_FILTERS.map((f) => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.88}
                onPress={() => onFilterChange(active ? null : f.key)}
                style={[
                  S.kindChip,
                  active
                    ? { backgroundColor: f.activeBg, borderColor: f.dotColor + "88" }
                    : { backgroundColor: "rgba(255,255,255,0.95)", borderColor: C.border },
                ]}
              >
                <View style={[S.kindDot, { backgroundColor: active ? f.dotColor : f.dotColor + "99" }]} />
                <Text style={[S.kindChipTxt, active && { color: f.activeText, fontWeight: "900" }]}>
                  {f.label}
                </Text>
                {active && <Ionicons name="close" size={11} color={f.activeText} />}
              </TouchableOpacity>
            );
          })}

          {/* Vertical divider */}
          <View style={S.divider} />

          {/* Activity filters */}
          {quickActivity.map((f) => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.88}
                onPress={() => onFilterChange(active ? null : f.key)}
                style={[S.actChip, active && S.actChipActive]}
              >
                <Ionicons name={f.icon} size={14} color={active ? C.tealText : C.muted} />
                <Text style={[S.actChipTxt, active && { color: C.tealText, fontWeight: "900" }]}>
                  {f.label}
                </Text>
                {active && <Ionicons name="close" size={11} color={C.tealText} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => moreRef.current?.open()}
            style={S.moreChip}
          >
            <Ionicons name="options-outline" size={14} color={C.muted} />
            <Text style={S.actChipTxt}>More</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>

      {/* ── More sheet ── */}
      <Modalize
        ref={moreRef}
        adjustToContentHeight
        handlePosition="inside"
        modalStyle={S.sheet}
        handleStyle={S.sheetHandle}
      >
        <View style={S.sheetInner}>
          <View style={S.sheetHeader}>
            <Text style={S.sheetTitle}>More filters</Text>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => { onFilterChange(null); moreRef.current?.close(); }}
              style={S.resetBtn}
            >
              <Ionicons name="refresh-outline" size={14} color={C.tealText} />
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
                  activeOpacity={0.88}
                  onPress={() => { onFilterChange(active ? null : f.key); moreRef.current?.close(); }}
                  style={[
                    S.gridChip,
                    active
                      ? { backgroundColor: f.activeBg, borderColor: f.dotColor + "88" }
                      : {},
                  ]}
                >
                  <View style={[S.kindDot, { backgroundColor: active ? f.dotColor : f.dotColor + "99" }]} />
                  <Text style={[S.gridChipTxt, active && { color: f.activeText, fontWeight: "900" }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[S.sheetSectionLbl, { marginTop: 18 }]}>Activity</Text>
          <View style={S.grid}>
            {restActivity.map((f) => {
              const active = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  activeOpacity={0.88}
                  onPress={() => { onFilterChange(active ? null : f.key); moreRef.current?.close(); }}
                  style={[S.gridChip, active && S.gridChipActive]}
                >
                  <Ionicons name={f.icon} size={16} color={active ? C.tealText : C.muted} />
                  <Text style={[S.gridChipTxt, active && { color: C.tealText, fontWeight: "900" }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modalize>

      {/* ── Search dropdown ── */}
      {open ? (
        <>
          <Pressable style={[S.backdrop, { top: panelTop }]} onPress={closePanel} />
          <View style={[S.dropdown, { top: panelTop }]}>
            <FlatList
              data={items}
              keyExtractor={(x) => x.id}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <Pressable style={S.ddRow} onPress={() => pick(item.id, item.main)}>
                  <View style={S.ddIcon}>
                    <Ionicons name="location-outline" size={16} color={C.teal} />
                  </View>
                  <View style={S.ddTextWrap}>
                    <Text style={S.ddMain} numberOfLines={1}>{item.main}</Text>
                    {!!item.secondary && (
                      <Text style={S.ddSec} numberOfLines={1}>{item.secondary}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={C.hint} />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={S.ddEmpty}>
                  <Text style={S.ddEmptyTxt}>
                    {q.trim().length === 0 ? "Start typing…"
                      : q.trim().length < 2 ? "Type at least 2 letters"
                      : loading ? "Searching…"
                      : err ? "Couldn't fetch results"
                      : "No results"}
                  </Text>
                  {!!err && <Text style={S.ddEmptySub}>{err}</Text>}
                </View>
              }
            />
          </View>
        </>
      ) : null}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  wrap: { position: "absolute", left: 12, right: 12, zIndex: 9999, elevation: 30 },

  // Search bar — warm white pill with teal accent
  bar: {
    height: 52, flexDirection: "row", alignItems: "center", gap: 10,
    paddingLeft: 10, paddingRight: 8, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1.5, borderColor: "rgba(240,235,227,0.9)",
    shadowColor: C.teal,
    shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  barPressed: { transform: [{ scale: 0.996 }] },

  searchIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.tealBg,
    borderWidth: 1, borderColor: C.teal + "44",
  },
  input: {
    flex: 1, fontSize: 14, fontWeight: "700", color: C.ink,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  trailingBtn: {
    width: 30, height: 30, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(240,235,227,0.6)",
    borderWidth: 1, borderColor: "rgba(240,235,227,0.9)",
  },
  trailingSpacer: { width: 30, height: 30 },
  profileWrap: {
    width: 40, height: 40, borderRadius: 20,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.teal + "55",
  },

  // Filter chips row
  filtersWrap: { position: "absolute", left: 0, right: 0, paddingHorizontal: 12, zIndex: 9997, elevation: 25 },
  filtersRow:  { paddingVertical: 8, paddingRight: 16, gap: 7, flexDirection: "row", alignItems: "center" },

  // Kind chips
  kindChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 11, height: 34, borderRadius: 999, borderWidth: 1.5,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  kindDot:    { width: 7, height: 7, borderRadius: 999 },
  kindChipTxt:{ fontSize: 12, fontWeight: "700", color: C.muted },

  divider: { width: 1, height: 22, backgroundColor: "rgba(28,26,23,0.12)", borderRadius: 1, marginHorizontal: 2 },

  // Activity chips
  actChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, height: 34, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1.5, borderColor: "rgba(240,235,227,0.9)",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  actChipActive: { backgroundColor: C.tealBg, borderColor: C.teal + "88" },
  actChipTxt:    { fontSize: 12, fontWeight: "700", color: C.muted },
  moreChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, height: 34, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1.5, borderColor: "rgba(240,235,227,0.9)",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // Backdrop
  backdrop: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(28,26,23,0.18)", zIndex: 9998,
  },

  // Dropdown
  dropdown: {
    position: "absolute", left: 12, right: 12, maxHeight: 400,
    borderRadius: 20, overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5, borderColor: "rgba(240,235,227,0.9)",
    shadowColor: C.teal, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 12 },
    elevation: 20, zIndex: 9999,
  },
  ddRow: {
    paddingHorizontal: 14, paddingVertical: 13,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderTopWidth: 1, borderTopColor: "rgba(240,235,227,0.8)",
  },
  ddIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.tealBg,
    borderWidth: 1, borderColor: C.teal + "44",
  },
  ddTextWrap: { flex: 1 },
  ddMain:     { color: C.ink,  fontSize: 14, fontWeight: "800" },
  ddSec:      { color: C.muted, fontSize: 12, fontWeight: "600", marginTop: 2 },
  ddEmpty:    { padding: 18 },
  ddEmptyTxt: { color: C.muted, fontWeight: "700", fontSize: 14 },
  ddEmptySub: { marginTop: 6, color: C.hint, fontWeight: "600", fontSize: 12 },

  // More sheet
  sheet:       { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", backgroundColor: "#FFFFFF" },
  sheetHandle: { width: 44, height: 4, borderRadius: 999, backgroundColor: "rgba(240,235,227,1)", marginTop: 12 },
  sheetInner:  { padding: 20, paddingBottom: 40 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  sheetTitle:  { fontSize: 17, fontWeight: "900", color: C.ink, letterSpacing: -0.3 },
  resetBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, height: 34, borderRadius: 999,
    backgroundColor: C.tealBg,
    borderWidth: 1.5, borderColor: C.teal + "44",
  },
  resetTxt:        { fontSize: 12, fontWeight: "800", color: C.tealText },
  sheetSectionLbl: { fontSize: 11, fontWeight: "800", color: C.hint, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 },
  grid:            { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, height: 40, borderRadius: 12,
    backgroundColor: "rgba(250,247,242,1)",
    borderWidth: 1.5, borderColor: "rgba(240,235,227,0.9)",
  },
  gridChipActive: { backgroundColor: C.tealBg, borderColor: C.teal + "88" },
  gridChipTxt:    { fontSize: 13, fontWeight: "700", color: C.muted },
});