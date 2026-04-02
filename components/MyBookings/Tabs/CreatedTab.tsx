
// // components/MyBookings/Tabs/CreatedTab.tsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   View, Text, ActivityIndicator, Pressable, RefreshControl,
//   Animated, SectionList, SectionListData, Switch, StyleSheet, Alert,
//   Modal, TouchableOpacity,
// } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import Constants from "expo-constants";
// import { useAuth } from "@clerk/clerk-expo";
// import { styles, COLORS } from "../MyBookingScreen.style";
// import { apiFetch } from "../../../lib/apiFetch";

// export type EventKind = "free" | "paid" | "service";

// export type EventDoc = {
//   _id: string;
//   title: string;
//   emoji?: string;
//   description?: string;
//   creatorClerkId: string;
//   kind: EventKind;
//   priceCents: number | null;
//   startsAt?: string | null;
//   date?: string;
//   time?: string;
//   status?: string;
//   attendance?: number | null;
//   attendees?: any[];
//   location?: { city?: string; admin1Code?: string; countryCode?: string };
// };

// type SectionT = { title: string; hint: string; data: EventDoc[] };

// function eventStartMs(ev: EventDoc): number {
//   if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
//   const date = (ev.date ?? "").trim(); const time = (ev.time ?? "").trim();
//   if (date && time) { const t = new Date(`${date}T${time}:00Z`).getTime(); if (Number.isFinite(t)) return t; }
//   if (date) { const t = new Date(`${date}T12:00:00Z`).getTime(); if (Number.isFinite(t)) return t; }
//   return Number.POSITIVE_INFINITY;
// }

// function fmtWhen(ev: EventDoc) {
//   const ms = eventStartMs(ev);
//   if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "No time set";
//   return new Date(ms).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
// }

// function fmtWhere(ev: EventDoc) {
//   const city = ev.location?.city?.trim(); const s = ev.location?.admin1Code?.trim(); const cc = ev.location?.countryCode?.trim();
//   if (!city && !cc) return "Location not set";
//   return `${city ?? ""}${s ? `, ${s}` : ""}${cc ? ` · ${cc}` : ""}`.trim();
// }

// function priceLabel(ev: EventDoc) {
//   if (ev.kind === "free") return "FREE";
//   return `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}`;
// }

// function kindLabel(ev: EventDoc) {
//   if (ev.kind === "service") return "Service";
//   if (ev.kind === "paid") return "Paid event";
//   return "Free event";
// }

// function statusLabel(ev: EventDoc) {
//   return String(ev.status || "active").toLowerCase() === "paused" ? "Paused" : "Active";
// }

// function isEnabled(ev: EventDoc) {
//   return String(ev.status || "active").toLowerCase() !== "paused";
// }

// export default function CreatedTab({
//   created, refreshing, onRefresh,
//   toggleBusyById, onToggleServiceEnabled, onPressEvent,
//   isOngoing = false, onEndEvent,
// }: {
//   created: EventDoc[];
//   refreshing: boolean;
//   onRefresh: () => void;
//   toggleBusyById: Record<string, boolean>;
//   onToggleServiceEnabled: (ev: EventDoc, next: boolean) => void;
//   onPressEvent: (ev: EventDoc) => void;
//   isOngoing?: boolean;
//   onEndEvent?: (ev: EventDoc) => void;
// }) {
//   const sections = useMemo<SectionT[]>(() => {
//     if (created.length === 0) return [];
//     const hint = isOngoing
//       ? "These events have started — check in attendees"
//       : "Events you created that haven't started yet";
//     return [{ title: isOngoing ? "Live Now 🟢" : "Upcoming", hint, data: created }];
//   }, [created, isOngoing]);

//   return (
//     <SectionList
//       sections={sections as SectionListData<EventDoc>[]}
//       keyExtractor={(item) => item._id}
//       contentContainerStyle={styles.list}
//       stickySectionHeadersEnabled={false}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//       ListEmptyComponent={
//         <View style={styles.empty}>
//           <Text style={styles.emptyTitle}>{isOngoing ? "No ongoing events" : "No upcoming events"}</Text>
//           <Text style={styles.emptySub}>{isOngoing ? "Events will appear here when they start." : "Tap + to create your first event."}</Text>
//         </View>
//       }
//       renderSectionHeader={({ section }: any) => (
//         <View style={styles.sectionHeaderWrap}>
//           <View style={styles.sectionHeaderTop}>
//             <Text style={styles.sectionTitle}>{section.title}</Text>
//             {!!section.hint && <Text style={styles.sectionHint}>{section.hint}</Text>}
//           </View>
//           <View style={styles.sectionDivider} />
//         </View>
//       )}
//       renderItem={({ item, index }) => (
//         <EventCard
//           e={item}
//           index={index}
//           showToggle={item.kind === "service"}
//           toggleBusy={!!toggleBusyById[item._id]}
//           onToggle={(next) => onToggleServiceEnabled(item, next)}
//           onPress={() => onPressEvent(item)}
//           isOngoing={isOngoing}
//           onEndEvent={onEndEvent ? () => onEndEvent(item) : undefined}
//         />
//       )}
//       ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//       showsVerticalScrollIndicator={false}
//     />
//   );
// }

// // ─── Check-in Modal ───────────────────────────────────────────────────────────

// function CheckInModal({ visible, onClose, eventId, eventTitle, totalAttendees }: {
//   visible: boolean; onClose: () => void;
//   eventId: string; eventTitle?: string; totalAttendees: number;
// }) {
//   const { userId } = useAuth();
//   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [otp, setOtp] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<any>(null);
//   const shakeX = useRef(new Animated.Value(0)).current;

//   const shake = () => {
//     Animated.sequence([
//       Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeX, { toValue: 8, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeX, { toValue: -8, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
//     ]).start();
//   };

//   const handleClose = () => { setOtp(""); setResult(null); onClose(); };

//   const submit = async () => {
//     if (otp.length !== 4 || !API_BASE || !userId) return;
//     setLoading(true); setResult(null);
//     try {
//       const res = await apiFetch(`${API_BASE}/api/events/checkin`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
//         body: JSON.stringify({ eventId, creatorClerkId: userId, otp }),
//       });
//       const json = await res.json().catch(() => null);
//       if (res.ok && json?.ok) {
//         setResult({ ok: true, name: json.attendee?.name || "Guest", phone: json.attendee?.phone || "", count: json.checkedInCount, total: json.totalAttendees });
//         setOtp("");
//       } else {
//         setResult({ ok: false, error: json?.error || "Invalid OTP" });
//         shake(); setOtp("");
//       }
//     } catch {
//       setResult({ ok: false, error: "Network error" });
//       shake();
//     } finally { setLoading(false); }
//   };

//   if (!visible) return null;

//   return (
//     <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
//       <View style={ciSt.overlay}>
//         <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
//         <View style={ciSt.card}>
//           <View style={ciSt.grabber} />
          
//           {/* Header */}
//           <View style={ciSt.header}>
//             <View style={{ flex: 1 }}>
//               <Text style={ciSt.headerTitle}>Guest Check-in</Text>
//               <Text style={ciSt.headerSub} numberOfLines={1}>{eventTitle || "Verification"}</Text>
//             </View>
//             <TouchableOpacity onPress={handleClose} style={ciSt.closeCircle}>
//               <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
//             </TouchableOpacity>
//           </View>

//           {/* Result Area */}
//           <View style={ciSt.resultContainer}>
//             {result ? (
//               <View style={[ciSt.resultBox, result.ok ? ciSt.resOk : ciSt.resErr]}>
//                 <Ionicons name={result.ok ? "checkmark-circle" : "alert-circle"} size={22} color={result.ok ? "#4ADE80" : "#F87171"} />
//                 <View style={{ flex: 1 }}>
//                   <Text style={ciSt.resMessage}>{result.ok ? `Verified: ${result.name}` : result.error}</Text>
//                   {result.ok && <Text style={ciSt.resStats}>{result.count} of {result.total} checked in</Text>}
//                 </View>
//                 <TouchableOpacity onPress={() => setResult(null)}>
//                   <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.2)" />
//                 </TouchableOpacity>
//               </View>
//             ) : (
//               <Text style={ciSt.instruction}>Enter attendee's 4-digit code</Text>
//             )}
//           </View>

//           {/* OTP display */}
//           <Animated.View style={[ciSt.otpContainer, { transform: [{ translateX: shakeX }] }]}>
//             {[0, 1, 2, 3].map((i) => (
//               <View key={i} style={[ciSt.otpBox, otp.length === i && ciSt.otpBoxActive]}>
//                 <Text style={ciSt.otpText}>{otp[i] || ""}</Text>
//                 {!otp[i] && <View style={ciSt.otpDot} />}
//               </View>
//             ))}
//           </Animated.View>

//           {/* Numpad */}
//           <View style={ciSt.numpad}>
//             {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
//               <TouchableOpacity
//                 key={i}
//                 disabled={k === "" || loading}
//                 style={[ciSt.key, (k === "" || k === "⌫") && ciSt.keyTransparent]}
//                 onPress={() => {
//                   if (k === "⌫") { setOtp(p => p.slice(0, -1)); setResult(null); return; }
//                   if (otp.length < 4) {
//                     setOtp(otp + k);
//                     setResult(null);
//                   }
//                 }}
//               >
//                 {k === "⌫" ? (
//                   <Ionicons name="backspace-outline" size={24} color="#FFF" />
//                 ) : (
//                   <Text style={ciSt.keyText}>{k}</Text>
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Submit */}
//           <TouchableOpacity
//             disabled={otp.length < 4 || loading}
//             onPress={submit}
//             activeOpacity={0.8}
//             style={[ciSt.verifyBtn, (otp.length < 4 || loading) && ciSt.verifyBtnDisabled]}
//           >
//             {loading ? <ActivityIndicator color="#FFF" /> : <Text style={ciSt.verifyBtnText}>Verify Entry</Text>}
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// // ─── Event Card ───────────────────────────────────────────────────────────────

// function EventCard({
//   e, index, showToggle, toggleBusy, onToggle, onPress,
//   isOngoing, onEndEvent,
// }: {
//   e: EventDoc; index: number;
//   showToggle: boolean; toggleBusy: boolean;
//   onToggle: (next: boolean) => void;
//   onPress: () => void;
//   isOngoing: boolean;
//   onEndEvent?: () => void;
// }) {
//   const a = useRef(new Animated.Value(0)).current;
//   const y = useRef(new Animated.Value(10)).current;
//   const [showCheckIn, setShowCheckIn] = useState(false);

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
//       Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
//     ]).start();
//   }, []);

//   const enabled = isEnabled(e);
//   const attendeeCount = Array.isArray(e.attendees) ? e.attendees.length : 0;
//   const checkedInCount = Array.isArray(e.attendees) ? e.attendees.filter((a: any) => a.checkedIn).length : 0;

//   const confirmEnd = () => {
//     Alert.alert("End Event?", "This will move the event to Past. Attendees won't be able to join after this.", [
//       { text: "Cancel", style: "cancel" },
//       { text: "End Event", style: "destructive", onPress: onEndEvent },
//     ]);
//   };

//   // ✅ Delete with warning if attendees exist


//   return (
//     <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
//       <Pressable
//         onPress={onPress}
//         android_ripple={{ color: "rgba(255,255,255,0.08)" }}
//         style={({ pressed }) => [
//           styles.card,
//           { borderColor: pressed ? COLORS.brand : COLORS.border },
//           pressed && { transform: [{ scale: 0.98 }] },
//         ]}
//       >
//         {/* LIVE badge */}
//         {isOngoing && (
//           <View style={cardSt.liveBadge}>
//             <View style={cardSt.liveDot} />
//             <Text style={cardSt.liveText}>LIVE</Text>
//           </View>
//         )}

//         {/* Top row */}
//         <View style={styles.cardTop}>
//           <View style={styles.emojiPill}>
//             <Text style={styles.emojiTxt}>{e.emoji || "📍"}</Text>
//           </View>
//           <View style={{ flex: 1 }}>
//             <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
//               <Text style={styles.cardTitle} numberOfLines={1}>{e.title}</Text>
//               <Ionicons name="chevron-forward" size={18} color="#CBD5E1" style={{ marginLeft: "auto" }} />
//             </View>
//             <View style={styles.badgesRow}>
//               <View style={StyleSheet.flatten([styles.badge, e.kind === "service" ? styles.badgeService : styles.badgeFree])}>
//                 <Ionicons name={e.kind === "service" ? "sparkles" : e.kind === "paid" ? "card" : "leaf"} size={12} color="#fff" />
//                 <Text style={styles.badgeText}>{kindLabel(e)}</Text>
//               </View>
//               <View style={StyleSheet.flatten([styles.badge, enabled ? styles.badgeActive : styles.badgePaused])}>
//                 <Ionicons name={enabled ? "checkmark" : "pause"} size={12} color="#fff" />
//                 <Text style={styles.badgeText}>{statusLabel(e)}</Text>
//               </View>
//             </View>
//           </View>
//           <View style={styles.rightCol}>
//             <View style={styles.pricePill}>
//               <Text style={styles.priceTxt}>{priceLabel(e)}</Text>
//             </View>
//             {showToggle && (
//               <View style={styles.toggleWrap}>
//                 {toggleBusy ? <ActivityIndicator size="small" /> : (
//                   <Switch
//                     value={enabled} onValueChange={onToggle}
//                     trackColor={{ false: "#E2E8F0", true: COLORS.brand }}
//                     thumbColor="#FFFFFF" ios_backgroundColor="#E2E8F0"
//                   />
//                 )}
//               </View>
//             )}
//           </View>
//         </View>

//         {/* Meta */}
//         <View style={styles.metaGrid}>
//           <View style={styles.metaCell}>
//             <Text style={styles.metaLabel}>When</Text>
//             <Text style={styles.metaValue} numberOfLines={1}>{fmtWhen(e)}</Text>
//           </View>
//           <View style={styles.metaCell}>
//             <Text style={styles.metaLabel}>Where</Text>
//             <Text style={styles.metaValue} numberOfLines={1}>{fmtWhere(e)}</Text>
//           </View>
//         </View>

//         {/* Attendees row */}
//         <View style={styles.actionSub}>
//           <View style={styles.actionIconBox}>
//             <Ionicons name="people" size={16} color="#fff" />
//           </View>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.actionTextMain}>
//               {e.kind === "service" ? "View bookings" : "View attendees"}
//               {attendeeCount > 0 ? ` · ${attendeeCount} joined` : ""}
//               {checkedInCount > 0 ? ` · ${checkedInCount} ✓` : ""}
//             </Text>
//             <Text style={styles.actionTextSub}>Tap to see full list</Text>
//           </View>
//           <Ionicons name="arrow-forward" size={16} color={COLORS.brand} />
//         </View>

//         {/* Check-in Mode */}
//         {e.kind !== "service" && (
//           <Pressable
//             onPress={() => setShowCheckIn(true)}
//             style={({ pressed }) => [cardSt.actionBtn, cardSt.checkInBtn, pressed && { opacity: 0.80 }]}
//           >
//             <Ionicons name="scan-outline" size={14} color="#0A84FF" />
//             <Text style={[cardSt.actionBtnText, { color: "#0A84FF" }]}>Check-in Mode</Text>
//             {checkedInCount > 0 && (
//               <View style={cardSt.checkInCount}>
//                 <Text style={cardSt.checkInCountText}>{checkedInCount}/{attendeeCount}</Text>
//               </View>
//             )}
//             <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.35)" style={{ marginLeft: "auto" }} />
//           </Pressable>
//         )}

//         {/* End Event — only ongoing */}
//         {isOngoing && onEndEvent && (
//           <Pressable
//             onPress={confirmEnd}
//             style={({ pressed }) => [cardSt.actionBtn, cardSt.endBtn, pressed && { opacity: 0.80 }]}
//           >
//             <Ionicons name="stop-circle-outline" size={14} color="#F87171" />
//             <Text style={[cardSt.actionBtnText, { color: "#F87171" }]}>End Event</Text>
//           </Pressable>
//         )}


//       </Pressable>

//       <CheckInModal
//         visible={showCheckIn}
//         onClose={() => setShowCheckIn(false)}
//         eventId={e._id}
//         eventTitle={e.title}
//         totalAttendees={attendeeCount}
//       />
//     </Animated.View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const cardSt = StyleSheet.create({
//   liveBadge: {
//     flexDirection: "row", alignItems: "center", gap: 5,
//     alignSelf: "flex-start", marginBottom: 8,
//     paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
//     backgroundColor: "rgba(74,222,128,0.15)",
//     borderWidth: 1, borderColor: "rgba(74,222,128,0.30)",
//   },
//   liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },
//   liveText: { color: "#4ADE80", fontSize: 11, fontWeight: "900" },

//   actionBtn: {
//     flexDirection: "row", alignItems: "center", gap: 8,
//     marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
//     borderWidth: 1,
//   },
//   actionBtnText: { fontWeight: "800", fontSize: 13 },

//   checkInBtn: { backgroundColor: "rgba(10,132,255,0.08)", borderColor: "rgba(10,132,255,0.22)" },
//   checkInCount: { backgroundColor: "rgba(10,132,255,0.20)", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
//   checkInCountText: { color: "#0A84FF", fontSize: 11, fontWeight: "900" },

//   endBtn: { backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.22)" },
// });

// const ciSt = StyleSheet.create({
//   overlay: {
//     flex: 1, backgroundColor: "rgba(2,6,23,0.8)",
//     justifyContent: "flex-end",
//   },
//   card: {
//     backgroundColor: "#0F172A",
//     borderTopLeftRadius: 32, borderTopRightRadius: 32,
//     paddingHorizontal: 24, paddingBottom: 40,
//     borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)",
//   },
//   grabber: {
//     width: 40, height: 4, borderRadius: 2,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     alignSelf: "center", marginTop: 12, marginBottom: 20,
//   },
//   header: {
//     flexDirection: "row", alignItems: "center", marginBottom: 24,
//   },
//   headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "900" },
//   headerSub: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600", marginTop: 2 },
//   closeCircle: {
//     width: 32, height: 32, borderRadius: 16,
//     backgroundColor: "rgba(255,255,255,0.05)",
//     alignItems: "center", justifyContent: "center",
//   },
//   resultContainer: {
//     height: 60, justifyContent: "center", marginBottom: 20,
//   },
//   instruction: {
//     textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "600",
//   },
//   resultBox: {
//     flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1,
//   },
//   resOk: { backgroundColor: "rgba(74,222,128,0.08)", borderColor: "rgba(74,222,128,0.2)" },
//   resErr: { backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.2)" },
//   resMessage: { color: "#FFF", fontSize: 13, fontWeight: "800" },
//   resStats: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "600", marginTop: 2 },
//   otpContainer: {
//     flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 30,
//   },
//   otpBox: {
//     width: 60, height: 75, borderRadius: 16,
//     backgroundColor: "rgba(255,255,255,0.03)",
//     borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
//     alignItems: "center", justifyContent: "center",
//   },
//   otpBoxActive: {
//     borderColor: "#0A84FF", backgroundColor: "rgba(10,132,255,0.05)",
//   },
//   otpText: { color: "#FFF", fontSize: 32, fontWeight: "900" },
//   otpDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)" },
//   numpad: {
//     flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 30,
//   },
//   key: {
//     width: "31%", height: 60, borderRadius: 15,
//     backgroundColor: "rgba(255,255,255,0.03)",
//     alignItems: "center", justifyContent: "center",
//   },
//   keyTransparent: { backgroundColor: "transparent" },
//   keyText: { color: "#FFF", fontSize: 24, fontWeight: "700" },
//   verifyBtn: {
//     height: 56, borderRadius: 18, backgroundColor: "#0A84FF",
//     alignItems: "center", justifyContent: "center",
//     shadowColor: "#0A84FF", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
//   },
//   verifyBtnDisabled: { opacity: 0.4, backgroundColor: "rgba(255,255,255,0.05)" },
//   verifyBtnText: { color: "#FFF", fontSize: 16, fontWeight: "900" },
// });


// components/MyBookings/Tabs/CreatedTab.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ActivityIndicator, Pressable, RefreshControl,
  Animated, SectionList, SectionListData, Switch, StyleSheet, Alert,
  Modal, TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "../../../lib/apiFetch";

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
  error:       "#EF4444",
};
const R = { card: 20, input: 14, pill: 999, badge: 10 };

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
export type EventKind = "free" | "paid" | "service";
export type EventDoc = {
  _id: string; title: string; emoji?: string; description?: string;
  creatorClerkId: string; kind: EventKind; priceCents: number | null;
  startsAt?: string | null; date?: string; time?: string; status?: string;
  attendance?: number | null; attendees?: any[];
  location?: { city?: string; admin1Code?: string; countryCode?: string };
};
type SectionT = { title: string; hint: string; data: EventDoc[] };

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
function isEnabled(ev: EventDoc) {
  return String(ev.status || "active").toLowerCase() !== "paused";
}

// ─────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────
export default function CreatedTab({
  created, refreshing, onRefresh,
  toggleBusyById, onToggleServiceEnabled, onPressEvent,
  isOngoing = false, onEndEvent,
}: {
  created: EventDoc[]; refreshing: boolean; onRefresh: () => void;
  toggleBusyById: Record<string, boolean>;
  onToggleServiceEnabled: (ev: EventDoc, next: boolean) => void;
  onPressEvent: (ev: EventDoc) => void;
  isOngoing?: boolean; onEndEvent?: (ev: EventDoc) => void;
}) {
  const sections = useMemo<SectionT[]>(() => {
    if (created.length === 0) return [];
    const hint = isOngoing
      ? "These events have started — check in attendees"
      : "Events you created that haven't started yet";
    return [{ title: isOngoing ? "Live Now 🟢" : "Upcoming", hint, data: created }];
  }, [created, isOngoing]);

  return (
    <SectionList
      sections={sections as SectionListData<EventDoc>[]}
      keyExtractor={(item) => item._id}
      contentContainerStyle={T.list}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.teal} />}
      ListEmptyComponent={
        <View style={T.empty}>
          <View style={T.emptyIcon}>
            <Text style={{ fontSize: 34 }}>{isOngoing ? "📡" : "🗓️"}</Text>
          </View>
          <Text style={T.emptyTitle}>{isOngoing ? "No ongoing events" : "No upcoming events"}</Text>
          <Text style={T.emptySub}>{isOngoing ? "Events will appear here when they start." : "Tap + to create your first event."}</Text>
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
          showToggle={item.kind === "service"}
          toggleBusy={!!toggleBusyById[item._id]}
          onToggle={(next) => onToggleServiceEnabled(item, next)}
          onPress={() => onPressEvent(item)}
          isOngoing={isOngoing}
          onEndEvent={onEndEvent ? () => onEndEvent(item) : undefined}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─────────────────────────────────────────────
//  CHECK-IN MODAL
// ─────────────────────────────────────────────
function CheckInModal({ visible, onClose, eventId, eventTitle, totalAttendees }: {
  visible: boolean; onClose: () => void;
  eventId: string; eventTitle?: string; totalAttendees: number;
}) {
  const { userId } = useAuth();
  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [otp, setOtp]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);
  const shakeX = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleClose = () => { setOtp(""); setResult(null); onClose(); };

  const submit = async () => {
    if (otp.length !== 4 || !API_BASE || !userId) return;
    setLoading(true); setResult(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/events/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
        body: JSON.stringify({ eventId, creatorClerkId: userId, otp }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setResult({ ok: true, name: json.attendee?.name || "Guest", phone: json.attendee?.phone || "", count: json.checkedInCount, total: json.totalAttendees });
        setOtp("");
      } else {
        setResult({ ok: false, error: json?.error || "Invalid OTP" });
        shake(); setOtp("");
      }
    } catch {
      setResult({ ok: false, error: "Network error" });
      shake();
    } finally { setLoading(false); }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={CI.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={CI.sheet}>
          <View style={CI.grabber} />

          {/* Header */}
          <View style={CI.header}>
            <View style={CI.headerIcon}>
              <Text style={{ fontSize: 22 }}>🔍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={CI.headerTitle}>Guest Check-in</Text>
              <Text style={CI.headerSub} numberOfLines={1}>{eventTitle || "Verification"}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={CI.closeBtn}>
              <Text style={{ fontSize: 18, color: C.muted, fontWeight: "700" }}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Result */}
          <View style={CI.resultContainer}>
            {result ? (
              <View style={[CI.resultBox, result.ok ? CI.resOk : CI.resErr]}>
                <Text style={{ fontSize: 18 }}>{result.ok ? "✅" : "❌"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={CI.resMessage}>{result.ok ? `Verified: ${result.name}` : result.error}</Text>
                  {result.ok && <Text style={CI.resStats}>{result.count} of {result.total} checked in</Text>}
                </View>
                <TouchableOpacity onPress={() => setResult(null)}>
                  <Text style={{ color: C.muted, fontSize: 16 }}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={CI.instruction}>Enter attendee's 4-digit code</Text>
            )}
          </View>

          {/* OTP display */}
          <Animated.View style={[CI.otpRow, { transform: [{ translateX: shakeX }] }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[CI.otpBox, otp.length === i && CI.otpBoxActive]}>
                <Text style={CI.otpText}>{otp[i] || ""}</Text>
                {!otp[i] && <View style={CI.otpDot} />}
              </View>
            ))}
          </Animated.View>

          {/* Numpad */}
          <View style={CI.numpad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
              <TouchableOpacity
                key={i}
                disabled={k === "" || loading}
                style={[CI.key, k === "" && { backgroundColor: "transparent", borderColor: "transparent" }]}
                onPress={() => {
                  if (k === "⌫") { setOtp(p => p.slice(0, -1)); setResult(null); return; }
                  if (typeof k === "number" && otp.length < 4) { setOtp(otp + k); setResult(null); }
                }}
              >
                <Text style={[CI.keyText, k === "" && { opacity: 0 }]}>{k === "⌫" ? "⌫" : k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            disabled={otp.length < 4 || loading}
            onPress={submit}
            activeOpacity={0.85}
            style={[CI.verifyBtn, (otp.length < 4 || loading) && { opacity: 0.4 }]}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={CI.verifyBtnText}>Verify Entry ✓</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
//  EVENT CARD
// ─────────────────────────────────────────────
function EventCard({
  e, index, showToggle, toggleBusy, onToggle, onPress, isOngoing, onEndEvent,
}: {
  e: EventDoc; index: number;
  showToggle: boolean; toggleBusy: boolean;
  onToggle: (next: boolean) => void;
  onPress: () => void; isOngoing: boolean; onEndEvent?: () => void;
}) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(12)).current;
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
    ]).start();
  }, []);

  const enabled        = isEnabled(e);
  const attendeeCount  = Array.isArray(e.attendees) ? e.attendees.length : 0;
  const checkedInCount = Array.isArray(e.attendees) ? e.attendees.filter((a: any) => a.checkedIn).length : 0;

  // kind config
  const kindCfg = e.kind === "service"
    ? { accent: C.purple, accentBg: C.purpleBg, accentText: C.purpleText, emoji: "🛠️", label: "Service" }
    : e.kind === "paid"
    ? { accent: C.amber,  accentBg: C.amberBg,  accentText: C.amberText,  emoji: "🎟", label: "Paid event" }
    : { accent: C.teal,   accentBg: C.tealBg,   accentText: C.tealText,   emoji: "🆓", label: "Free event" };

  const confirmEnd = () => {
    Alert.alert("End Event?", "This will move the event to Past. Attendees won't be able to join after this.", [
      { text: "Cancel", style: "cancel" },
      { text: "End Event", style: "destructive", onPress: onEndEvent },
    ]);
  };

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [T.card, pressed && { transform: [{ scale: 0.985 }], borderColor: C.teal }]}
      >
        {/* LIVE badge */}
        {isOngoing && (
          <View style={T.liveBadge}>
            <View style={T.liveDot} />
            <Text style={T.liveText}>LIVE</Text>
          </View>
        )}

        {/* Top row */}
        <View style={T.cardTop}>
          <View style={[T.emojiBox, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "33" }]}>
            <Text style={{ fontSize: 24 }}>{e.emoji || kindCfg.emoji}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={T.cardTitle} numberOfLines={1}>{e.title}</Text>
            <View style={T.badgeRow}>
              {/* Kind badge */}
              <View style={[T.badge, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
                <Text style={[T.badgeText, { color: kindCfg.accentText }]}>{kindCfg.label}</Text>
              </View>
              {/* Status badge */}
              <View style={[T.badge, enabled
                ? { backgroundColor: C.greenBg, borderColor: C.green + "55" }
                : { backgroundColor: C.coralBg, borderColor: C.coral + "55" }]}>
                <Text style={[T.badgeText, { color: enabled ? C.greenText : C.coralText }]}>
                  {enabled ? "✓ Active" : "⏸ Paused"}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            {/* Price */}
            <View style={[T.pricePill, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
              <Text style={[T.priceText, { color: kindCfg.accentText }]}>{priceLabel(e)}</Text>
            </View>
            {/* Toggle */}
            {showToggle && (
              <View>
                {toggleBusy
                  ? <ActivityIndicator size="small" color={C.purple} />
                  : <Switch
                      value={enabled} onValueChange={onToggle}
                      trackColor={{ false: C.inputBorder, true: C.purple }}
                      thumbColor={C.card} ios_backgroundColor={C.inputBorder}
                    />
                }
              </View>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={T.divider} />

        {/* Meta grid */}
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

        {/* Attendees row */}
        <View style={T.actionRow}>
          <View style={[T.actionIcon, { backgroundColor: C.tealBg, borderColor: C.teal + "55" }]}>
            <Text style={{ fontSize: 15 }}>👥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.actionMain}>
              {e.kind === "service" ? "View bookings" : "View attendees"}
              {attendeeCount > 0 ? ` · ${attendeeCount} joined` : ""}
              {checkedInCount > 0 ? ` · ${checkedInCount} ✓` : ""}
            </Text>
            <Text style={T.actionSub}>Tap to see full list</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.teal} />
        </View>

        {/* Check-in button */}
        {e.kind !== "service" && (
          <Pressable
            onPress={() => setShowCheckIn(true)}
            style={({ pressed }) => [T.ctaBtn, T.checkInBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={{ fontSize: 14 }}>📲</Text>
            <Text style={[T.ctaBtnText, { color: C.blueText }]}>Check-in Mode</Text>
            {checkedInCount > 0 && (
              <View style={[T.countPill, { backgroundColor: C.blueBg, borderColor: C.blue + "55" }]}>
                <Text style={{ color: C.blueText, fontSize: 11, fontWeight: "900" }}>{checkedInCount}/{attendeeCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={13} color={C.hint} style={{ marginLeft: "auto" }} />
          </Pressable>
        )}

        {/* End event button */}
        {isOngoing && onEndEvent && (
          <Pressable
            onPress={confirmEnd}
            style={({ pressed }) => [T.ctaBtn, T.endBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={{ fontSize: 14 }}>⏹️</Text>
            <Text style={[T.ctaBtnText, { color: C.coralText }]}>End Event</Text>
          </Pressable>
        )}
      </Pressable>

      <CheckInModal
        visible={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        eventId={e._id}
        eventTitle={e.title}
        totalAttendees={attendeeCount}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const T = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

  // Empty
  empty:     { alignItems: "center", paddingTop: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { color: C.ink, fontSize: 17, fontWeight: "900", marginBottom: 6 },
  emptySub:   { color: C.muted, fontSize: 13, fontWeight: "600", textAlign: "center", paddingHorizontal: 24 },

  // Section header
  sectionHeaderWrap: { paddingTop: 16, paddingBottom: 8 },
  sectionLabel:      { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 1.2 },
  sectionHint:       { fontSize: 12, color: C.hint, fontWeight: "600", marginTop: 2 },
  sectionDivider:    { height: 1.5, backgroundColor: C.cardBorder, marginTop: 10 },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop:  { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  emojiBox: {
    width: 50, height: 50, borderRadius: 14, flexShrink: 0,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "900", color: C.ink, letterSpacing: -0.2, marginBottom: 6 },
  badgeRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge:     {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, borderWidth: 1.5,
  },
  badgeText: { fontSize: 11, fontWeight: "800" },
  pricePill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: R.pill, borderWidth: 1.5,
  },
  priceText: { fontSize: 12, fontWeight: "900" },

  divider: { height: 1.5, backgroundColor: C.cardBorder, marginBottom: 12 },

  // Meta
  metaGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  metaCell: {
    flex: 1, backgroundColor: C.inputBg, borderRadius: R.input,
    borderWidth: 1.5, borderColor: C.inputBorder, padding: 10,
  },
  metaLabel: { fontSize: 10, fontWeight: "800", color: C.hint, marginBottom: 3 },
  metaValue: { fontSize: 12, fontWeight: "700", color: C.ink2 },

  // Attendees action row
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.inputBg, borderRadius: R.input,
    borderWidth: 1.5, borderColor: C.inputBorder,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  actionIcon: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  actionMain: { fontSize: 13, fontWeight: "800", color: C.ink2, marginBottom: 1 },
  actionSub:  { fontSize: 11, fontWeight: "600", color: C.muted },

  // CTA buttons
  ctaBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 6, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: R.input, borderWidth: 1.5,
  },
  ctaBtnText: { fontWeight: "800", fontSize: 13 },
  checkInBtn: { backgroundColor: C.blueBg, borderColor: C.blue + "55" },
  endBtn:     { backgroundColor: C.coralBg, borderColor: C.coral + "55" },
  countPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, borderWidth: 1.5 },

  // Live badge
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", marginBottom: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill,
    backgroundColor: C.greenBg, borderWidth: 1.5, borderColor: C.green + "55",
  },
  liveDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  liveText: { color: C.greenText, fontSize: 11, fontWeight: "900" },
});

// ─────────────────────────────────────────────
//  CHECK-IN MODAL STYLES
// ─────────────────────────────────────────────
const CI = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(28,26,23,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40,
    borderTopWidth: 1.5, borderColor: C.cardBorder,
  },
  grabber: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.inputBorder, alignSelf: "center",
    marginTop: 12, marginBottom: 20,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: C.ink },
  headerSub:   { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },

  resultContainer: { minHeight: 56, justifyContent: "center", marginBottom: 20 },
  instruction:     { textAlign: "center", color: C.muted, fontSize: 14, fontWeight: "600" },
  resultBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: R.input, borderWidth: 1.5,
  },
  resOk:     { backgroundColor: C.greenBg, borderColor: C.green + "55" },
  resErr:    { backgroundColor: C.coralBg, borderColor: C.coral + "55" },
  resMessage:{ color: C.ink, fontSize: 13, fontWeight: "800" },
  resStats:  { color: C.muted, fontSize: 11, fontWeight: "600", marginTop: 2 },

  otpRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 28 },
  otpBox: {
    width: 62, height: 76, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  otpBoxActive: { borderColor: C.teal, backgroundColor: C.tealBg },
  otpText: { color: C.ink, fontSize: 32, fontWeight: "900" },
  otpDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.hint },

  numpad: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "space-between", gap: 10, marginBottom: 24,
  },
  key: {
    width: "31%", height: 58, borderRadius: 14,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  keyText: { color: C.ink, fontSize: 22, fontWeight: "700" },

  verifyBtn: {
    height: 54, borderRadius: R.pill, backgroundColor: C.teal,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.teal, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  verifyBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
});