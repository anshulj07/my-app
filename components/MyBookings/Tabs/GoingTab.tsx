

// // components/MyBookings/Tabs/GoingTab.tsx
// import React, { useEffect, useRef, useState } from "react";
// import {
//   View, Text, Image, Pressable, RefreshControl, Animated,
//   SectionList, SectionListData, StyleSheet, TouchableOpacity,
// } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { styles, COLORS } from "../MyBookingScreen.style";
// import OtpModal from "../../CheckIn/OtpModal";
// import type { EventDoc } from "./CreatedTab";

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

// export default function GoingTab({
//   going,
//   refreshing,
//   onRefresh,
//   onPressEvent,
// }: {
//   going: EventDoc[];
//   refreshing: boolean;
//   onRefresh: () => void;
//   onPressEvent: (ev: EventDoc) => void;
// }) {
//   const sections: SectionT[] = going.length
//     ? [{ title: "Going", hint: "Upcoming events you're attending", data: going }]
//     : [];

//   return (
//     <SectionList
//       sections={sections as SectionListData<EventDoc>[]}
//       keyExtractor={(item) => item._id}
//       contentContainerStyle={styles.list}
//       stickySectionHeadersEnabled={false}
//       refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
//       ListEmptyComponent={
//         <View style={styles.empty}>
//           <Text style={styles.emptyTitle}>Nothing here</Text>
//           <Text style={styles.emptySub}>You're not going to any events yet.</Text>
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
//         <EventCard e={item} index={index} onPress={() => onPressEvent(item)} />
//       )}
//       ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//       showsVerticalScrollIndicator={false}
//     />
//   );
// }

// // ─── OTP Modal ───────────────────────────────────────────────────────────────

// // OtpModal is now imported from ../../CheckIn/OtpModal

// // ─── Event Card ───────────────────────────────────────────────────────────────

// function EventCard({ e, index, onPress }: { e: EventDoc; index: number; onPress: () => void }) {
//   const a = useRef(new Animated.Value(0)).current;
//   const y = useRef(new Animated.Value(10)).current;
//   const [showOtp, setShowOtp] = useState(false);

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
//       Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
//     ]).start();
//   }, [a, y, index]);

//   // ✅ OTP stored in EventDoc
//   const myOtp: string | null = (e as any)?.myCheckInOtp ?? (e as any)?.checkInOtp ?? null;
//   const isCheckedIn = !!(e as any)?.myCheckedIn;
//   const isPending = (e as any)?.myJoinStatus === "pending";

//   // ✅ Attendees list (others who are going)
//   const attendees: Array<{ clerkId: string; name: string; imageUrl?: string }> =
//     Array.isArray(e.attendees) ? e.attendees : [];
//   const visibleAttendees = attendees.slice(0, 5);
//   const extraCount = attendees.length - visibleAttendees.length;

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
//         {/* Pending badge */}
//         {isPending && (
//           <View style={goingSt.pendingBadge}>
//             <Text style={goingSt.pendingText}>⏳ Pending Approval</Text>
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
//             </View>
//           </View>

//           <View style={styles.rightCol}>
//             <View style={styles.pricePill}>
//               <Text style={styles.priceTxt}>{priceLabel(e)}</Text>
//             </View>
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

//         {/* ✅ Attendees row — who else is going */}
//         {attendees.length > 0 && (
//           <View style={goingSt.attendeesRow}>
//             <View style={goingSt.avatarStack}>
//               {visibleAttendees.map((att, idx) => (
//                 <View
//                   key={att.clerkId || idx}
//                   style={[goingSt.avatarCircle, { marginLeft: idx === 0 ? 0 : -10, zIndex: visibleAttendees.length - idx }]}
//                 >
//                   {att.imageUrl ? (
//                     <Image
//                       source={{ uri: typeof att.imageUrl === "string" ? att.imageUrl : (att.imageUrl as any)?.url || "" }}
//                       style={goingSt.avatarImg}
//                     />
//                   ) : (
//                     <Text style={goingSt.avatarInitial}>
//                       {(att.name || "?")[0].toUpperCase()}
//                     </Text>
//                   )}
//                 </View>
//               ))}
//               {extraCount > 0 && (
//                 <View style={[goingSt.avatarCircle, goingSt.avatarExtra, { marginLeft: -10 }]}>
//                   <Text style={goingSt.avatarExtraText}>+{extraCount}</Text>
//                 </View>
//               )}
//             </View>
//             <Text style={goingSt.goingCountText}>
//               {attendees.length === 1 ? "1 person going" : `${attendees.length} people going`}
//             </Text>
//           </View>
//         )}

//         {/* ✅ OTP / Check-in button (only for joined, not pending) */}
//         {!isPending && (
//           <TouchableOpacity
//             onPress={(ev) => { ev.stopPropagation?.(); setShowOtp(true); }}
//             activeOpacity={0.80}
//             style={[otpSheet.otpBtn, isCheckedIn && { backgroundColor: "rgba(74,222,128,0.08)", borderColor: "rgba(74,222,128,0.20)" }]}
//           >
//             <Ionicons
//               name={isCheckedIn ? "checkmark-circle" : "shield-checkmark-outline"}
//               size={14}
//               color={isCheckedIn ? "#4ADE80" : "#4ADE80"}
//             />
//             <Text style={[otpSheet.otpBtnText, isCheckedIn && { color: "#4ADE80" }]}>
//               {isCheckedIn ? "Meetup Started 🎉" : "My Check-in OTP"}
//             </Text>
//             <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.35)" style={{ marginLeft: "auto" }} />
//           </TouchableOpacity>
//         )}
//       </Pressable>

//       <OtpModal
//         visible={showOtp}
//         onClose={() => setShowOtp(false)}
//         otp={myOtp}
//         eventTitle={e.title || "Event"}
//         checkedIn={isCheckedIn}
//       />
//     </Animated.View>
//   );
// }

// // ─── Going Tab Styles ───────────────────────────────────────────────────────
// const goingSt = StyleSheet.create({
//   pendingBadge: {
//     flexDirection: "row", alignItems: "center",
//     alignSelf: "flex-start", marginBottom: 8,
//     paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
//     backgroundColor: "rgba(251,191,36,0.12)",
//     borderWidth: 1, borderColor: "rgba(251,191,36,0.28)",
//   },
//   pendingText: { color: "#FBB924", fontSize: 11, fontWeight: "800" },

//   attendeesRow: {
//     flexDirection: "row", alignItems: "center", gap: 10,
//     marginTop: 10, paddingVertical: 8, paddingHorizontal: 12,
//     borderRadius: 12,
//     backgroundColor: "rgba(255,255,255,0.03)",
//     borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
//   },
//   avatarStack: { flexDirection: "row", alignItems: "center" },
//   avatarCircle: {
//     width: 26, height: 26, borderRadius: 13,
//     backgroundColor: "rgba(255,77,109,0.20)",
//     borderWidth: 1.5, borderColor: "#0F172A",
//     alignItems: "center", justifyContent: "center",
//     overflow: "hidden",
//   },
//   avatarImg: { width: 26, height: 26, borderRadius: 13 },
//   avatarInitial: { color: "#FF4D6D", fontSize: 10, fontWeight: "900" },
//   avatarExtra: { backgroundColor: "rgba(255,255,255,0.08)" },
//   avatarExtraText: { color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: "900" },
//   goingCountText: { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", flex: 1 },
// });

// // ─── OTP Styles ──────────────────────────────────────────────────────────────

// const otpSheet = StyleSheet.create({
//   // Button inside card
//   otpBtn: {
//     flexDirection: "row", alignItems: "center", gap: 8,
//     marginTop: 10, paddingVertical: 10, paddingHorizontal: 12,
//     borderRadius: 12,
//     backgroundColor: "rgba(74,222,128,0.08)",
//     borderWidth: 1, borderColor: "rgba(74,222,128,0.20)",
//   },
//   otpBtnText: { color: "#4ADE80", fontWeight: "800", fontSize: 13 },

//   // Modal
//   backdrop: {
//     flex: 1, backgroundColor: "rgba(2,6,23,0.85)",
//     alignItems: "center", justifyContent: "center", padding: 24,
//   },
//   card: {
//     width: "100%", maxWidth: 360,
//     backgroundColor: "#0F172A",
//     borderRadius: 32, padding: 24,
//     borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
//     shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 30,
//     shadowOffset: { width: 0, height: 20 },
//   },
//   header: {
//     flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24,
//   },
//   iconWrap: {
//     width: 48, height: 48, borderRadius: 16,
//     backgroundColor: "rgba(74,222,128,0.15)",
//     alignItems: "center", justifyContent: "center",
//     borderWidth: 1, borderColor: "rgba(74,222,128,0.25)",
//   },
//   headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
//   headerSub: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600", marginTop: 2 },
//   closeCircle: {
//     width: 32, height: 32, borderRadius: 16,
//     backgroundColor: "rgba(255,255,255,0.06)",
//     alignItems: "center", justifyContent: "center",
//   },

//   otpContainer: {
//     paddingVertical: 12, alignItems: "center", marginBottom: 24,
//   },
//   digitRow: {
//     flexDirection: "row", gap: 12,
//   },
//   digitBox: {
//     width: 64, height: 80, borderRadius: 18,
//     backgroundColor: "rgba(255,255,255,0.04)",
//     borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
//     alignItems: "center", justifyContent: "center",
//     overflow: "hidden",
//   },
//   digitGlow: {
//     position: "absolute", top: -20, left: -20, right: -20, bottom: -20,
//     backgroundColor: "rgba(74,222,128,0.03)",
//   },
//   digitText: {
//     color: "#FFF", fontSize: 42, fontWeight: "900",
//   },

//   emptyState: { alignItems: "center", gap: 12, paddingVertical: 10 },
//   emptyText: { color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: "600", textAlign: "center" },

//   infoBox: {
//     flexDirection: "row", gap: 10, padding: 16,
//     backgroundColor: "rgba(255,255,255,0.03)",
//     borderRadius: 16, marginBottom: 24,
//   },
//   instruction: {
//     flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "600", lineHeight: 18,
//   },

//   doneBtn: {
//     height: 56, borderRadius: 18,
//     backgroundColor: "#FFF",
//     alignItems: "center", justifyContent: "center",
//   },
//   doneBtnText: { color: "#000", fontWeight: "900", fontSize: 16 },
// });
// components/MyBookings/Tabs/GoingTab.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Image, Pressable, RefreshControl, Animated,
  SectionList, SectionListData, StyleSheet, TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import OtpModal from "../../CheckIn/OtpModal";
import type { EventDoc } from "./CreatedTab";

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
};
const R = { card: 20, input: 14, pill: 999 };

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────
export default function GoingTab({
  going, refreshing, onRefresh, onPressEvent,
}: {
  going: EventDoc[]; refreshing: boolean;
  onRefresh: () => void; onPressEvent: (ev: EventDoc) => void;
}) {
  const sections: SectionT[] = going.length
    ? [{ title: "Going ✈️", hint: "Upcoming events you're attending", data: going }]
    : [];

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
            <Text style={{ fontSize: 34 }}>🎟️</Text>
          </View>
          <Text style={T.emptyTitle}>Nothing here yet</Text>
          <Text style={T.emptySub}>You're not going to any events yet. Explore to find one!</Text>
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
        <EventCard e={item} index={index} onPress={() => onPressEvent(item)} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─────────────────────────────────────────────
//  EVENT CARD
// ─────────────────────────────────────────────
function EventCard({ e, index, onPress }: { e: EventDoc; index: number; onPress: () => void }) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(12)).current;
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
    ]).start();
  }, [a, y, index]);

  const myOtp       = (e as any)?.myCheckInOtp ?? (e as any)?.checkInOtp ?? null;
  const isCheckedIn = !!(e as any)?.myCheckedIn;
  const isPending   = (e as any)?.myJoinStatus === "pending";

  const attendees: Array<{ clerkId: string; name: string; imageUrl?: string }> =
    Array.isArray(e.attendees) ? e.attendees : [];
  const visibleAttendees = attendees.slice(0, 5);
  const extraCount       = attendees.length - visibleAttendees.length;

  // Kind config
  const kindCfg = e.kind === "service"
    ? { accent: C.purple, accentBg: C.purpleBg, accentText: C.purpleText, label: "Service" }
    : e.kind === "paid"
    ? { accent: C.amber,  accentBg: C.amberBg,  accentText: C.amberText,  label: "Paid event" }
    : { accent: C.teal,   accentBg: C.tealBg,   accentText: C.tealText,   label: "Free event" };

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [T.card, pressed && { transform: [{ scale: 0.985 }], borderColor: C.teal }]}
      >
        {/* Pending badge */}
        {isPending && (
          <View style={T.pendingBadge}>
            <Text style={{ fontSize: 12 }}>⏳</Text>
            <Text style={T.pendingText}>Pending Approval</Text>
          </View>
        )}

        {/* Top row */}
        <View style={T.cardTop}>
          <View style={[T.emojiBox, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "33" }]}>
            <Text style={{ fontSize: 24 }}>{e.emoji || "📍"}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={T.cardTitle} numberOfLines={1}>{e.title}</Text>
            <View style={T.badgeRow}>
              <View style={[T.badge, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
                <Text style={[T.badgeText, { color: kindCfg.accentText }]}>{kindCfg.label}</Text>
              </View>
              {isCheckedIn && (
                <View style={[T.badge, { backgroundColor: C.greenBg, borderColor: C.green + "55" }]}>
                  <Text style={[T.badgeText, { color: C.greenText }]}>✓ Checked in</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[T.pricePill, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
            <Text style={[T.priceText, { color: kindCfg.accentText }]}>{priceLabel(e)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={T.divider} />

        {/* Meta */}
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
        {attendees.length > 0 && (
          <View style={T.attendeesRow}>
            <View style={T.avatarStack}>
              {visibleAttendees.map((att, idx) => (
                <View
                  key={att.clerkId || idx}
                  style={[T.avatarCircle, { marginLeft: idx === 0 ? 0 : -10, zIndex: visibleAttendees.length - idx }]}
                >
                  {att.imageUrl ? (
                    <Image
                      source={{ uri: typeof att.imageUrl === "string" ? att.imageUrl : (att.imageUrl as any)?.url || "" }}
                      style={T.avatarImg}
                    />
                  ) : (
                    <Text style={T.avatarInitial}>{(att.name || "?")[0].toUpperCase()}</Text>
                  )}
                </View>
              ))}
              {extraCount > 0 && (
                <View style={[T.avatarCircle, T.avatarExtra, { marginLeft: -10 }]}>
                  <Text style={T.avatarExtraText}>+{extraCount}</Text>
                </View>
              )}
            </View>
            <Text style={T.goingCount}>
              {attendees.length === 1 ? "1 person going" : `${attendees.length} people going`}
            </Text>
          </View>
        )}

        {/* OTP button */}
        {!isPending && (
          <TouchableOpacity
            onPress={(ev) => { ev.stopPropagation?.(); setShowOtp(true); }}
            activeOpacity={0.8}
            style={[T.otpBtn, isCheckedIn && { backgroundColor: C.greenBg, borderColor: C.green + "55" }]}
          >
            <Text style={{ fontSize: 15 }}>{isCheckedIn ? "🎉" : "🔐"}</Text>
            <Text style={[T.otpBtnText, { color: isCheckedIn ? C.greenText : C.tealText }]}>
              {isCheckedIn ? "Meetup Started!" : "My Check-in OTP"}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={C.hint} style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        )}
      </Pressable>

      <OtpModal
        visible={showOtp}
        onClose={() => setShowOtp(false)}
        otp={myOtp}
        eventTitle={e.title || "Event"}
        checkedIn={isCheckedIn}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const T = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

  empty:     { alignItems: "center", paddingTop: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { color: C.ink, fontSize: 17, fontWeight: "900", marginBottom: 6 },
  emptySub:   { color: C.muted, fontSize: 13, fontWeight: "600", textAlign: "center", paddingHorizontal: 24 },

  sectionHeaderWrap: { paddingTop: 16, paddingBottom: 8 },
  sectionLabel:      { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 1.2 },
  sectionHint:       { fontSize: 12, color: C.hint, fontWeight: "600", marginTop: 2 },
  sectionDivider:    { height: 1.5, backgroundColor: C.cardBorder, marginTop: 10 },

  card: {
    backgroundColor: C.card,
    borderRadius: R.card, borderWidth: 1.5, borderColor: C.cardBorder,
    padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTop:   { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  emojiBox:  { width: 50, height: 50, borderRadius: 14, flexShrink: 0, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "900", color: C.ink, letterSpacing: -0.2, marginBottom: 6 },
  badgeRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge:     { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, borderWidth: 1.5 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  pricePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.pill, borderWidth: 1.5 },
  priceText: { fontSize: 12, fontWeight: "900" },

  divider:  { height: 1.5, backgroundColor: C.cardBorder, marginBottom: 12 },
  metaGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  metaCell: { flex: 1, backgroundColor: C.inputBg, borderRadius: R.input, borderWidth: 1.5, borderColor: C.inputBorder, padding: 10 },
  metaLabel:{ fontSize: 10, fontWeight: "800", color: C.hint, marginBottom: 3 },
  metaValue:{ fontSize: 12, fontWeight: "700", color: C.ink2 },

  pendingBadge: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", marginBottom: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill,
    backgroundColor: C.amberBg, borderWidth: 1.5, borderColor: C.amber + "55",
  },
  pendingText: { color: C.amberText, fontSize: 11, fontWeight: "800" },

  attendeesRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginBottom: 10, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: R.input, backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
  },
  avatarStack:    { flexDirection: "row", alignItems: "center" },
  avatarCircle:   {
    width: 26, height: 26, borderRadius: 13, overflow: "hidden",
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.card,
    alignItems: "center", justifyContent: "center",
  },
  avatarImg:      { width: 26, height: 26, borderRadius: 13 },
  avatarInitial:  { color: C.tealText, fontSize: 10, fontWeight: "900" },
  avatarExtra:    { backgroundColor: C.inputBorder },
  avatarExtraText:{ color: C.muted, fontSize: 9, fontWeight: "900" },
  goingCount:     { color: C.muted, fontSize: 11, fontWeight: "700", flex: 1 },

  otpBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: R.input,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "55",
  },
  otpBtnText: { fontWeight: "800", fontSize: 13 },
});