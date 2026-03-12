// // components/MyBookings/Tabs/CreatedTab.tsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   View, Text, ActivityIndicator, Pressable, RefreshControl,
//   Animated, SectionList, SectionListData, Switch, StyleSheet,
//   Modal, TextInput, TouchableOpacity,
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
//   if (ev.startsAt) {
//     const t = new Date(ev.startsAt).getTime();
//     if (Number.isFinite(t)) return t;
//   }
//   const date = (ev.date ?? "").trim();
//   const time = (ev.time ?? "").trim();
//   if (date && time) {
//     const t = new Date(`${date}T${time}:00Z`).getTime();
//     if (Number.isFinite(t)) return t;
//   }
//   if (date) {
//     const t = new Date(`${date}T12:00:00Z`).getTime();
//     if (Number.isFinite(t)) return t;
//   }
//   return Number.POSITIVE_INFINITY;
// }

// function fmtWhen(ev: EventDoc) {
//   const ms = eventStartMs(ev);
//   if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "No time set";
//   return new Date(ms).toLocaleString(undefined, {
//     weekday: "short", month: "short", day: "numeric",
//     hour: "numeric", minute: "2-digit",
//   });
// }

// function fmtWhere(ev: EventDoc) {
//   const city = ev.location?.city?.trim();
//   const s = ev.location?.admin1Code?.trim();
//   const cc = ev.location?.countryCode?.trim();
//   if (!city && !cc) return "Location not set";
//   return `${city ?? ""}${s ? `, ${s}` : ""}${cc ? ` · ${cc}` : ""}`.trim();
// }

// function priceLabel(ev: EventDoc) {
//   if (ev.kind === "free") return "FREE";
//   return `₹${((ev.priceCents ?? 0) / 100).toFixed(2)}`;
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
// }: {
//   created: EventDoc[];
//   refreshing: boolean;
//   onRefresh: () => void;
//   toggleBusyById: Record<string, boolean>;
//   onToggleServiceEnabled: (ev: EventDoc, next: boolean) => void;
//   onPressEvent: (ev: EventDoc) => void;
// }) {
//   const nowMs = Date.now();

//   const sections = useMemo<SectionT[]>(() => {
//     const upcoming = created.filter((e) => eventStartMs(e) >= nowMs)
//       .sort((a, b) => eventStartMs(a) - eventStartMs(b));
//     const past = created.filter((e) => eventStartMs(e) < nowMs)
//       .sort((a, b) => eventStartMs(b) - eventStartMs(a));
//     const out: SectionT[] = [];
//     if (upcoming.length) out.push({ title: "Upcoming", hint: "Events you created that haven't started", data: upcoming });
//     if (past.length) out.push({ title: "Past", hint: "Events you created earlier", data: past });
//     return out;
//   }, [created, nowMs]);

//   return (
//     <SectionList
//       sections={sections as SectionListData<EventDoc>[]}
//       keyExtractor={(item) => item._id}
//       contentContainerStyle={styles.list}
//       stickySectionHeadersEnabled={false}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//       ListEmptyComponent={
//         <View style={styles.empty}>
//           <Text style={styles.emptyTitle}>No events yet</Text>
//           <Text style={styles.emptySub}>Tap + to create your first event.</Text>
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
//         />
//       )}
//       ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//       showsVerticalScrollIndicator={false}
//     />
//   );
// }

// // ─── Check-in Modal ───────────────────────────────────────────────────────────

// type CheckInResult = {
//   success: boolean;
//   name?: string;
//   phone?: string;
//   checkedInCount?: number;
//   totalAttendees?: number;
//   error?: string;
// };

// function CheckInModal({ visible, onClose, eventId, eventTitle, totalAttendees = 0 }: {
//   visible: boolean;
//   onClose: () => void;
//   eventId: string;
//   eventTitle?: string;
//   totalAttendees?: number;
// }) {
//   const { userId } = useAuth();
//   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [otp, setOtp] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<CheckInResult | null>(null);

//   // Shake animation for wrong OTP
//   const shakeX = useRef(new Animated.Value(0)).current;
//   const triggerShake = () => {
//     Animated.sequence([
//       Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeX, { toValue: 8, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeX, { toValue: -8, duration: 55, useNativeDriver: true }),
//       Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
//     ]).start();
//   };

//   const handleClose = () => {
//     setOtp(""); setResult(null); onClose();
//   };

//   const submitOtp = async () => {
//     if (otp.length !== 4 || !API_BASE || !userId) return;
//     setLoading(true); setResult(null);
//     try {
//       const res = await apiFetch(`${API_BASE}/api/events/checkin`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//         },
//         body: JSON.stringify({ eventId, creatorClerkId: userId, otp }),
//       });
//       const json = await res.json().catch(() => null);

//       if (res.ok && json?.ok) {
//         setResult({
//           success: true,
//           name: json.attendee?.name || "Guest",
//           phone: json.attendee?.phone || "",
//           checkedInCount: json.checkedInCount,
//           totalAttendees: json.totalAttendees,
//         });
//         setOtp("");
//       } else {
//         setResult({ success: false, error: json?.error || "Invalid OTP" });
//         triggerShake();
//         setOtp("");
//       }
//     } catch {
//       setResult({ success: false, error: "Network error." });
//       triggerShake();
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
//       <View style={ciStyles.backdrop}>
//         <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
//         <View style={ciStyles.card}>
//           {/* Header */}
//           <View style={ciStyles.header}>
//             <View style={ciStyles.headerIcon}>
//               <Ionicons name="scan-outline" size={20} color="#0A84FF" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={ciStyles.headerTitle}>Check-in Mode</Text>
//               <Text style={ciStyles.headerSub} numberOfLines={1}>{eventTitle || "Event"}</Text>
//             </View>
//             <Pressable onPress={handleClose} hitSlop={10} style={ciStyles.closeBtn}>
//               <Ionicons name="close" size={18} color="rgba(255,255,255,0.65)" />
//             </Pressable>
//           </View>

//           <Text style={ciStyles.instruction}>
//             Ask the attendee for their OTP and enter it below.
//           </Text>

//           {/* OTP Input */}
//           <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
//             <TextInput
//               style={ciStyles.otpInput}
//               value={otp}
//               onChangeText={(t) => { setOtp(t.replace(/\D/g, "").slice(0, 4)); setResult(null); }}
//               placeholder="• • • •"
//               placeholderTextColor="rgba(255,255,255,0.22)"
//               keyboardType="number-pad"
//               maxLength={4}
//               textAlign="center"
//               autoFocus
//               onSubmitEditing={submitOtp}
//             />
//           </Animated.View>

//           {/* Result */}
//           {result && (
//             <View style={[ciStyles.resultBox, result.success ? ciStyles.resultOk : ciStyles.resultErr]}>
//               <Ionicons
//                 name={result.success ? "checkmark-circle" : "close-circle"}
//                 size={22}
//                 color={result.success ? "#4ADE80" : "#F87171"}
//               />
//               <View style={{ flex: 1 }}>
//                 {result.success ? (
//                   <>
//                     <Text style={ciStyles.resultTitle}>✅ Checked in!</Text>
//                     <Text style={ciStyles.resultName}>{result.name}</Text>
//                     {!!result.phone && <Text style={ciStyles.resultMeta}>{result.phone}</Text>}
//                     <Text style={ciStyles.resultCount}>
//                       {result.checkedInCount} / {result.totalAttendees} arrived
//                     </Text>
//                   </>
//                 ) : (
//                   <>
//                     <Text style={ciStyles.resultTitle}>❌ {result.error}</Text>
//                     <Text style={ciStyles.resultMeta}>Ask the attendee to check their OTP.</Text>
//                   </>
//                 )}
//               </View>
//             </View>
//           )}

//           {/* Submit */}
//           <Pressable
//             onPress={submitOtp}
//             disabled={otp.length !== 4 || loading}
//             style={({ pressed }) => [
//               ciStyles.submitBtn,
//               (otp.length !== 4 || loading) && ciStyles.submitDisabled,
//               pressed && ciStyles.submitPressed,
//             ]}
//           >
//             {loading
//               ? <ActivityIndicator color="#fff" />
//               : <Text style={ciStyles.submitText}>Verify OTP</Text>
//             }
//           </Pressable>

//           {totalAttendees > 0 && (
//             <View style={ciStyles.countRow}>
//               <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.38)" />
//               <Text style={ciStyles.countText}>{totalAttendees} registered</Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </Modal>
//   );
// }

// // ─── Event Card ───────────────────────────────────────────────────────────────

// function EventCard({
//   e, index, showToggle, toggleBusy, onToggle, onPress,
// }: {
//   e: EventDoc; index: number;
//   showToggle: boolean; toggleBusy: boolean;
//   onToggle: (next: boolean) => void;
//   onPress: () => void;
// }) {
//   const a = useRef(new Animated.Value(0)).current;
//   const y = useRef(new Animated.Value(10)).current;
//   const [showCheckIn, setShowCheckIn] = useState(false);

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
//       Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
//     ]).start();
//   }, [a, y, index]);

//   const enabled = isEnabled(e);
//   const attendeeCount = Array.isArray(e.attendees) ? e.attendees.length : 0;

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
//         {/* Top */}
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
//                 {toggleBusy
//                   ? <ActivityIndicator size="small" />
//                   : (
//                     <Switch
//                       value={enabled}
//                       onValueChange={onToggle}
//                       trackColor={{ false: "#E2E8F0", true: COLORS.brand }}
//                       thumbColor="#FFFFFF"
//                       ios_backgroundColor="#E2E8F0"
//                     />
//                   )
//                 }
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

//         {/* Action row */}
//         <View style={styles.actionSub}>
//           <View style={styles.actionIconBox}>
//             <Ionicons name="people" size={16} color="#fff" />
//           </View>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.actionTextMain}>
//               {e.kind === "service" ? "View bookings" : "View attendees"}
//               {attendeeCount > 0 ? ` • ${attendeeCount}` : ""}
//             </Text>
//             <Text style={styles.actionTextSub}>Opens details & list</Text>
//           </View>
//           <Ionicons name="arrow-forward" size={16} color={COLORS.brand} />
//         </View>

//         {/* ✅ Check-in Mode button (only free/paid events, not service) */}
//         {e.kind !== "service" && (
//           <TouchableOpacity
//             onPress={(ev) => { ev.stopPropagation?.(); setShowCheckIn(true); }}
//             activeOpacity={0.80}
//             style={ciStyles.checkInBtn}
//           >
//             <Ionicons name="scan-outline" size={14} color="#0A84FF" />
//             <Text style={ciStyles.checkInBtnText}>Check-in Mode</Text>
//             <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.35)" style={{ marginLeft: "auto" }} />
//           </TouchableOpacity>
//         )}
//       </Pressable>

//       {/* Check-in Modal */}
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

// // ─── Check-in Styles ──────────────────────────────────────────────────────────

// const ciStyles = StyleSheet.create({
//   checkInBtn: {
//     flexDirection: "row", alignItems: "center", gap: 8,
//     marginTop: 10, paddingVertical: 10, paddingHorizontal: 12,
//     borderRadius: 12,
//     backgroundColor: "rgba(10,132,255,0.08)",
//     borderWidth: 1, borderColor: "rgba(10,132,255,0.22)",
//   },
//   checkInBtnText: { color: "#0A84FF", fontWeight: "800", fontSize: 13 },

//   // Modal
//   backdrop: {
//     flex: 1, backgroundColor: "rgba(2,6,23,0.76)",
//     alignItems: "center", justifyContent: "center", padding: 20,
//   },
//   card: {
//     width: "100%", maxWidth: 360,
//     backgroundColor: "#0F172A",
//     borderRadius: 28, padding: 22,
//     borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
//     shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 24,
//     shadowOffset: { width: 0, height: 12 },
//   },
//   header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
//   headerIcon: {
//     width: 42, height: 42, borderRadius: 14,
//     backgroundColor: "rgba(10,132,255,0.14)",
//     borderWidth: 1, borderColor: "rgba(10,132,255,0.25)",
//     alignItems: "center", justifyContent: "center",
//   },
//   headerTitle: { color: "#fff", fontWeight: "900", fontSize: 15 },
//   headerSub: { color: "rgba(255,255,255,0.48)", fontSize: 12, fontWeight: "700", marginTop: 2 },
//   closeBtn: {
//     width: 32, height: 32, borderRadius: 10,
//     backgroundColor: "rgba(255,255,255,0.06)",
//     alignItems: "center", justifyContent: "center",
//   },
//   instruction: {
//     color: "rgba(255,255,255,0.55)", fontSize: 13,
//     fontWeight: "700", lineHeight: 18, marginBottom: 18,
//   },
//   otpInput: {
//     backgroundColor: "rgba(255,255,255,0.06)",
//     borderWidth: 2, borderColor: "rgba(10,132,255,0.40)",
//     borderRadius: 18, height: 70,
//     color: "#fff", fontSize: 34, fontWeight: "900",
//     letterSpacing: 12, marginBottom: 14,
//   },
//   resultBox: {
//     flexDirection: "row", alignItems: "flex-start", gap: 10,
//     padding: 12, borderRadius: 14, marginBottom: 14, borderWidth: 1,
//   },
//   resultOk: { backgroundColor: "rgba(74,222,128,0.09)", borderColor: "rgba(74,222,128,0.22)" },
//   resultErr: { backgroundColor: "rgba(248,113,113,0.09)", borderColor: "rgba(248,113,113,0.22)" },
//   resultTitle: { color: "#fff", fontWeight: "900", fontSize: 13 },
//   resultName: { color: "#fff", fontWeight: "800", fontSize: 15, marginTop: 3 },
//   resultMeta: { color: "rgba(255,255,255,0.50)", fontWeight: "700", fontSize: 12, marginTop: 2 },
//   resultCount: { color: "rgba(255,255,255,0.40)", fontWeight: "700", fontSize: 12, marginTop: 5 },
//   submitBtn: {
//     height: 50, borderRadius: 14,
//     backgroundColor: "rgba(10,132,255,0.92)",
//     alignItems: "center", justifyContent: "center",
//   },
//   submitDisabled: { opacity: 0.42 },
//   submitPressed: { opacity: 0.85 },
//   submitText: { color: "#fff", fontWeight: "900", fontSize: 15 },
//   countRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "center" },
//   countText: { color: "rgba(255,255,255,0.36)", fontSize: 12, fontWeight: "700" },
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
import { styles, COLORS } from "../MyBookingScreen.style";
import { apiFetch } from "../../../lib/apiFetch";

export type EventKind = "free" | "paid" | "service";

export type EventDoc = {
  _id: string;
  title: string;
  emoji?: string;
  description?: string;
  creatorClerkId: string;
  kind: EventKind;
  priceCents: number | null;
  startsAt?: string | null;
  date?: string;
  time?: string;
  status?: string;
  attendance?: number | null;
  attendees?: any[];
  location?: { city?: string; admin1Code?: string; countryCode?: string };
};

type SectionT = { title: string; hint: string; data: EventDoc[] };

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

function statusLabel(ev: EventDoc) {
  return String(ev.status || "active").toLowerCase() === "paused" ? "Paused" : "Active";
}

function isEnabled(ev: EventDoc) {
  return String(ev.status || "active").toLowerCase() !== "paused";
}

export default function CreatedTab({
  created, refreshing, onRefresh,
  toggleBusyById, onToggleServiceEnabled, onPressEvent,
  isOngoing = false, onEndEvent,
}: {
  created: EventDoc[];
  refreshing: boolean;
  onRefresh: () => void;
  toggleBusyById: Record<string, boolean>;
  onToggleServiceEnabled: (ev: EventDoc, next: boolean) => void;
  onPressEvent: (ev: EventDoc) => void;
  isOngoing?: boolean;
  onEndEvent?: (ev: EventDoc) => void;
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
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{isOngoing ? "No ongoing events" : "No upcoming events"}</Text>
          <Text style={styles.emptySub}>{isOngoing ? "Events will appear here when they start." : "Tap + to create your first event."}</Text>
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
        <EventCard
          e={item}
          index={index}
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

// ─── Check-in Modal ───────────────────────────────────────────────────────────

function CheckInModal({ visible, onClose, eventId, eventTitle, totalAttendees }: {
  visible: boolean; onClose: () => void;
  eventId: string; eventTitle?: string; totalAttendees: number;
}) {
  const { userId } = useAuth();
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
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
      <View style={ciSt.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={ciSt.card}>
          <View style={ciSt.grabber} />
          
          {/* Header */}
          <View style={ciSt.header}>
            <View style={{ flex: 1 }}>
              <Text style={ciSt.headerTitle}>Guest Check-in</Text>
              <Text style={ciSt.headerSub} numberOfLines={1}>{eventTitle || "Verification"}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={ciSt.closeCircle}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {/* Result Area */}
          <View style={ciSt.resultContainer}>
            {result ? (
              <View style={[ciSt.resultBox, result.ok ? ciSt.resOk : ciSt.resErr]}>
                <Ionicons name={result.ok ? "checkmark-circle" : "alert-circle"} size={22} color={result.ok ? "#4ADE80" : "#F87171"} />
                <View style={{ flex: 1 }}>
                  <Text style={ciSt.resMessage}>{result.ok ? `Verified: ${result.name}` : result.error}</Text>
                  {result.ok && <Text style={ciSt.resStats}>{result.count} of {result.total} checked in</Text>}
                </View>
                <TouchableOpacity onPress={() => setResult(null)}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={ciSt.instruction}>Enter attendee's 4-digit code</Text>
            )}
          </View>

          {/* OTP display */}
          <Animated.View style={[ciSt.otpContainer, { transform: [{ translateX: shakeX }] }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[ciSt.otpBox, otp.length === i && ciSt.otpBoxActive]}>
                <Text style={ciSt.otpText}>{otp[i] || ""}</Text>
                {!otp[i] && <View style={ciSt.otpDot} />}
              </View>
            ))}
          </Animated.View>

          {/* Numpad */}
          <View style={ciSt.numpad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
              <TouchableOpacity
                key={i}
                disabled={k === "" || loading}
                style={[ciSt.key, (k === "" || k === "⌫") && ciSt.keyTransparent]}
                onPress={() => {
                  if (k === "⌫") { setOtp(p => p.slice(0, -1)); setResult(null); return; }
                  if (otp.length < 4) {
                    setOtp(otp + k);
                    setResult(null);
                  }
                }}
              >
                {k === "⌫" ? (
                  <Ionicons name="backspace-outline" size={24} color="#FFF" />
                ) : (
                  <Text style={ciSt.keyText}>{k}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            disabled={otp.length < 4 || loading}
            onPress={submit}
            activeOpacity={0.8}
            style={[ciSt.verifyBtn, (otp.length < 4 || loading) && ciSt.verifyBtnDisabled]}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={ciSt.verifyBtnText}>Verify Entry</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  e, index, showToggle, toggleBusy, onToggle, onPress,
  isOngoing, onEndEvent,
}: {
  e: EventDoc; index: number;
  showToggle: boolean; toggleBusy: boolean;
  onToggle: (next: boolean) => void;
  onPress: () => void;
  isOngoing: boolean;
  onEndEvent?: () => void;
}) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(10)).current;
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
    ]).start();
  }, []);

  const enabled = isEnabled(e);
  const attendeeCount = Array.isArray(e.attendees) ? e.attendees.length : 0;
  const checkedInCount = Array.isArray(e.attendees) ? e.attendees.filter((a: any) => a.checkedIn).length : 0;

  const confirmEnd = () => {
    Alert.alert("End Event?", "This will move the event to Past. Attendees won't be able to join after this.", [
      { text: "Cancel", style: "cancel" },
      { text: "End Event", style: "destructive", onPress: onEndEvent },
    ]);
  };

  // ✅ Delete with warning if attendees exist


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
        {/* LIVE badge */}
        {isOngoing && (
          <View style={cardSt.liveBadge}>
            <View style={cardSt.liveDot} />
            <Text style={cardSt.liveText}>LIVE</Text>
          </View>
        )}

        {/* Top row */}
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
              <View style={StyleSheet.flatten([styles.badge, e.kind === "service" ? styles.badgeService : styles.badgeFree])}>
                <Ionicons name={e.kind === "service" ? "sparkles" : e.kind === "paid" ? "card" : "leaf"} size={12} color="#fff" />
                <Text style={styles.badgeText}>{kindLabel(e)}</Text>
              </View>
              <View style={StyleSheet.flatten([styles.badge, enabled ? styles.badgeActive : styles.badgePaused])}>
                <Ionicons name={enabled ? "checkmark" : "pause"} size={12} color="#fff" />
                <Text style={styles.badgeText}>{statusLabel(e)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightCol}>
            <View style={styles.pricePill}>
              <Text style={styles.priceTxt}>{priceLabel(e)}</Text>
            </View>
            {showToggle && (
              <View style={styles.toggleWrap}>
                {toggleBusy ? <ActivityIndicator size="small" /> : (
                  <Switch
                    value={enabled} onValueChange={onToggle}
                    trackColor={{ false: "#E2E8F0", true: COLORS.brand }}
                    thumbColor="#FFFFFF" ios_backgroundColor="#E2E8F0"
                  />
                )}
              </View>
            )}
          </View>
        </View>

        {/* Meta */}
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

        {/* Attendees row */}
        <View style={styles.actionSub}>
          <View style={styles.actionIconBox}>
            <Ionicons name="people" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTextMain}>
              {e.kind === "service" ? "View bookings" : "View attendees"}
              {attendeeCount > 0 ? ` · ${attendeeCount} joined` : ""}
              {checkedInCount > 0 ? ` · ${checkedInCount} ✓` : ""}
            </Text>
            <Text style={styles.actionTextSub}>Tap to see full list</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={COLORS.brand} />
        </View>

        {/* Check-in Mode */}
        {e.kind !== "service" && (
          <Pressable
            onPress={() => setShowCheckIn(true)}
            style={({ pressed }) => [cardSt.actionBtn, cardSt.checkInBtn, pressed && { opacity: 0.80 }]}
          >
            <Ionicons name="scan-outline" size={14} color="#0A84FF" />
            <Text style={[cardSt.actionBtnText, { color: "#0A84FF" }]}>Check-in Mode</Text>
            {checkedInCount > 0 && (
              <View style={cardSt.checkInCount}>
                <Text style={cardSt.checkInCountText}>{checkedInCount}/{attendeeCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.35)" style={{ marginLeft: "auto" }} />
          </Pressable>
        )}

        {/* End Event — only ongoing */}
        {isOngoing && onEndEvent && (
          <Pressable
            onPress={confirmEnd}
            style={({ pressed }) => [cardSt.actionBtn, cardSt.endBtn, pressed && { opacity: 0.80 }]}
          >
            <Ionicons name="stop-circle-outline" size={14} color="#F87171" />
            <Text style={[cardSt.actionBtnText, { color: "#F87171" }]}>End Event</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardSt = StyleSheet.create({
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", marginBottom: 8,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
    backgroundColor: "rgba(74,222,128,0.15)",
    borderWidth: 1, borderColor: "rgba(74,222,128,0.30)",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },
  liveText: { color: "#4ADE80", fontSize: 11, fontWeight: "900" },

  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnText: { fontWeight: "800", fontSize: 13 },

  checkInBtn: { backgroundColor: "rgba(10,132,255,0.08)", borderColor: "rgba(10,132,255,0.22)" },
  checkInCount: { backgroundColor: "rgba(10,132,255,0.20)", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  checkInCountText: { color: "#0A84FF", fontSize: 11, fontWeight: "900" },

  endBtn: { backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.22)" },
});

const ciSt = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(2,6,23,0.8)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  grabber: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "center", marginTop: 12, marginBottom: 20,
  },
  header: {
    flexDirection: "row", alignItems: "center", marginBottom: 24,
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600", marginTop: 2 },
  closeCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center",
  },
  resultContainer: {
    height: 60, justifyContent: "center", marginBottom: 20,
  },
  instruction: {
    textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: "600",
  },
  resultBox: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 1,
  },
  resOk: { backgroundColor: "rgba(74,222,128,0.08)", borderColor: "rgba(74,222,128,0.2)" },
  resErr: { backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.2)" },
  resMessage: { color: "#FFF", fontSize: 13, fontWeight: "800" },
  resStats: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "600", marginTop: 2 },
  otpContainer: {
    flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 30,
  },
  otpBox: {
    width: 60, height: 75, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  otpBoxActive: {
    borderColor: "#0A84FF", backgroundColor: "rgba(10,132,255,0.05)",
  },
  otpText: { color: "#FFF", fontSize: 32, fontWeight: "900" },
  otpDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)" },
  numpad: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 30,
  },
  key: {
    width: "31%", height: 60, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center", justifyContent: "center",
  },
  keyTransparent: { backgroundColor: "transparent" },
  keyText: { color: "#FFF", fontSize: 24, fontWeight: "700" },
  verifyBtn: {
    height: 56, borderRadius: 18, backgroundColor: "#0A84FF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#0A84FF", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  verifyBtnDisabled: { opacity: 0.4, backgroundColor: "rgba(255,255,255,0.05)" },
  verifyBtnText: { color: "#FFF", fontSize: 16, fontWeight: "900" },
});


