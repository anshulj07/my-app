// import React, { useEffect, useRef } from "react";
// import { View, Text, Pressable, RefreshControl, Animated, SectionList, SectionListData } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { styles, COLORS } from "../MyBookingScreen.style";
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
//   const d = new Date(ms);
//   return d.toLocaleString(undefined, {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
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
//   return `$${((ev.priceCents ?? 0) / 100).toFixed(2)}`;
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
//     ? [{ title: "Going", hint: "Upcoming events you’re attending", data: going }]
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
//           <Text style={styles.emptySub}>You’re not going to any events yet.</Text>
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

// function EventCard({ e, index, onPress }: { e: EventDoc; index: number; onPress: () => void }) {
//   const a = useRef(new Animated.Value(0)).current;
//   const y = useRef(new Animated.Value(10)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
//       Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
//     ]).start();
//   }, [a, y, index]);

//   return (
//     <Animated.View style={StyleSheet.flatten([{ opacity: a, transform: [{ translateY: y }] }])}>
//       <Pressable
//         onPress={onPress}
//         android_ripple={{ color: "rgba(255,255,255,0.08)" }}
//         style={({ pressed }) => StyleSheet.flatten([
//           styles.card,
//           {
//             borderColor: pressed ? COLORS.brand : COLORS.border,
//             transform: [{ scale: pressed ? 0.98 : 1 }],
//           },
//         ])}
//       >
//         <View style={styles.cardTop}>
//           <View style={styles.emojiPill}>
//             <Text style={styles.emojiTxt}>{e.emoji || "📍"}</Text>
//           </View>

//           <View style={{ flex: 1 }}>
//             <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
//               <Text style={styles.cardTitle} numberOfLines={1}>
//                 {e.title}
//               </Text>
//               <Ionicons
//                 name="chevron-forward"
//                 size={18}
//                 color="#CBD5E1"
//                 style={{ marginLeft: "auto" }}
//               />
//             </View>

//             <View style={styles.badgesRow}>
//               <View style={StyleSheet.flatten([styles.badge, e.kind === "service" ? styles.badgeService : styles.badgeFree])}>
//                 <Ionicons
//                   name={e.kind === "service" ? "sparkles" : e.kind === "paid" ? "card" : "leaf"}
//                   size={12}
//                   color="#fff"
//                 />
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

//         <View style={styles.metaGrid}>
//           <View style={styles.metaCell}>
//             <Text style={styles.metaLabel}>When</Text>
//             <Text style={styles.metaValue} numberOfLines={1}>
//               {fmtWhen(e)}
//             </Text>
//           </View>

//           <View style={styles.metaCell}>
//             <Text style={styles.metaLabel}>Where</Text>
//             <Text style={styles.metaValue} numberOfLines={1}>
//               {fmtWhere(e)}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.actionSub}>
//           <View style={[styles.actionIconBox, { backgroundColor: COLORS.blue }]}>
//             <Ionicons name="calendar" size={16} color="#fff" />
//           </View>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.actionTextMain}>View Ticket Details</Text>
//             <Text style={styles.actionTextSub}>Check-in info & entry QR</Text>
//           </View>
//           <Ionicons name="arrow-forward" size={16} color={COLORS.blue} />
//         </View>
//       </Pressable>
//     </Animated.View>
//   );
// }









// components/MyBookings/Tabs/GoingTab.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Image, Pressable, RefreshControl, Animated,
  SectionList, SectionListData, StyleSheet, TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles, COLORS } from "../MyBookingScreen.style";
import OtpModal from "../../CheckIn/OtpModal";
import type { EventDoc } from "./CreatedTab";

type SectionT = { title: string; hint: string; data: EventDoc[] };

function eventStartMs(ev: EventDoc): number {
  if (ev.startsAt) {
    const t = new Date(ev.startsAt).getTime();
    if (Number.isFinite(t)) return t;
  }
  const date = (ev.date ?? "").trim();
  const time = (ev.time ?? "").trim();
  if (date && time) {
    const t = new Date(`${date}T${time}:00Z`).getTime();
    if (Number.isFinite(t)) return t;
  }
  if (date) {
    const t = new Date(`${date}T12:00:00Z`).getTime();
    if (Number.isFinite(t)) return t;
  }
  return Number.POSITIVE_INFINITY;
}

function fmtWhen(ev: EventDoc) {
  const ms = eventStartMs(ev);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "No time set";
  return new Date(ms).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function fmtWhere(ev: EventDoc) {
  const city = ev.location?.city?.trim();
  const s = ev.location?.admin1Code?.trim();
  const cc = ev.location?.countryCode?.trim();
  if (!city && !cc) return "Location not set";
  return `${city ?? ""}${s ? `, ${s}` : ""}${cc ? ` · ${cc}` : ""}`.trim();
}

function priceLabel(ev: EventDoc) {
  if (ev.kind === "free") return "FREE";
  return `₹${((ev.priceCents ?? 0) / 100).toFixed(2)}`;
}

function kindLabel(ev: EventDoc) {
  if (ev.kind === "service") return "Service";
  if (ev.kind === "paid") return "Paid event";
  return "Free event";
}

export default function GoingTab({
  going,
  refreshing,
  onRefresh,
  onPressEvent,
}: {
  going: EventDoc[];
  refreshing: boolean;
  onRefresh: () => void;
  onPressEvent: (ev: EventDoc) => void;
}) {
  const sections: SectionT[] = going.length
    ? [{ title: "Going", hint: "Upcoming events you're attending", data: going }]
    : [];

  return (
    <SectionList
      sections={sections as SectionListData<EventDoc>[]}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here</Text>
          <Text style={styles.emptySub}>You're not going to any events yet.</Text>
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
        <EventCard e={item} index={index} onPress={() => onPressEvent(item)} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─── OTP Modal ───────────────────────────────────────────────────────────────

// OtpModal is now imported from ../../CheckIn/OtpModal

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ e, index, onPress }: { e: EventDoc; index: number; onPress: () => void }) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(10)).current;
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
    ]).start();
  }, [a, y, index]);

  // ✅ OTP stored in EventDoc
  const myOtp: string | null = (e as any)?.myCheckInOtp ?? (e as any)?.checkInOtp ?? null;
  const isCheckedIn = !!(e as any)?.myCheckedIn;
  const isPending = (e as any)?.myJoinStatus === "pending";

  // ✅ Attendees list (others who are going)
  const attendees: Array<{ clerkId: string; name: string; imageUrl?: string }> =
    Array.isArray(e.attendees) ? e.attendees : [];
  const visibleAttendees = attendees.slice(0, 5);
  const extraCount = attendees.length - visibleAttendees.length;

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
        {/* Pending badge */}
        {isPending && (
          <View style={goingSt.pendingBadge}>
            <Text style={goingSt.pendingText}>⏳ Pending Approval</Text>
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
            </View>
          </View>

          <View style={styles.rightCol}>
            <View style={styles.pricePill}>
              <Text style={styles.priceTxt}>{priceLabel(e)}</Text>
            </View>
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

        {/* ✅ Attendees row — who else is going */}
        {attendees.length > 0 && (
          <View style={goingSt.attendeesRow}>
            <View style={goingSt.avatarStack}>
              {visibleAttendees.map((att, idx) => (
                <View
                  key={att.clerkId || idx}
                  style={[goingSt.avatarCircle, { marginLeft: idx === 0 ? 0 : -10, zIndex: visibleAttendees.length - idx }]}
                >
                  {att.imageUrl ? (
                    <Image
                      source={{ uri: typeof att.imageUrl === "string" ? att.imageUrl : (att.imageUrl as any)?.url || "" }}
                      style={goingSt.avatarImg}
                    />
                  ) : (
                    <Text style={goingSt.avatarInitial}>
                      {(att.name || "?")[0].toUpperCase()}
                    </Text>
                  )}
                </View>
              ))}
              {extraCount > 0 && (
                <View style={[goingSt.avatarCircle, goingSt.avatarExtra, { marginLeft: -10 }]}>
                  <Text style={goingSt.avatarExtraText}>+{extraCount}</Text>
                </View>
              )}
            </View>
            <Text style={goingSt.goingCountText}>
              {attendees.length === 1 ? "1 person going" : `${attendees.length} people going`}
            </Text>
          </View>
        )}

        {/* ✅ OTP / Check-in button (only for joined, not pending) */}
        {!isPending && (
          <TouchableOpacity
            onPress={(ev) => { ev.stopPropagation?.(); setShowOtp(true); }}
            activeOpacity={0.80}
            style={[otpSheet.otpBtn, isCheckedIn && { backgroundColor: "rgba(74,222,128,0.08)", borderColor: "rgba(74,222,128,0.20)" }]}
          >
            <Ionicons
              name={isCheckedIn ? "checkmark-circle" : "shield-checkmark-outline"}
              size={14}
              color={isCheckedIn ? "#4ADE80" : "#4ADE80"}
            />
            <Text style={[otpSheet.otpBtnText, isCheckedIn && { color: "#4ADE80" }]}>
              {isCheckedIn ? "Meetup Started 🎉" : "My Check-in OTP"}
            </Text>
            <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.35)" style={{ marginLeft: "auto" }} />
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

// ─── Going Tab Styles ───────────────────────────────────────────────────────
const goingSt = StyleSheet.create({
  pendingBadge: {
    flexDirection: "row", alignItems: "center",
    alignSelf: "flex-start", marginBottom: 8,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
    backgroundColor: "rgba(251,191,36,0.12)",
    borderWidth: 1, borderColor: "rgba(251,191,36,0.28)",
  },
  pendingText: { color: "#FBB924", fontSize: 11, fontWeight: "800" },

  attendeesRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 10, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(255,77,109,0.20)",
    borderWidth: 1.5, borderColor: "#0F172A",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 26, height: 26, borderRadius: 13 },
  avatarInitial: { color: "#FF4D6D", fontSize: 10, fontWeight: "900" },
  avatarExtra: { backgroundColor: "rgba(255,255,255,0.08)" },
  avatarExtraText: { color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: "900" },
  goingCountText: { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", flex: 1 },
});

// ─── OTP Styles ──────────────────────────────────────────────────────────────

const otpSheet = StyleSheet.create({
  // Button inside card
  otpBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 10, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(74,222,128,0.08)",
    borderWidth: 1, borderColor: "rgba(74,222,128,0.20)",
  },
  otpBtnText: { color: "#4ADE80", fontWeight: "800", fontSize: 13 },

  // Modal
  backdrop: {
    flex: 1, backgroundColor: "rgba(2,6,23,0.85)",
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  card: {
    width: "100%", maxWidth: 360,
    backgroundColor: "#0F172A",
    borderRadius: 32, padding: 24,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
  },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 24,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "rgba(74,222,128,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(74,222,128,0.25)",
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600", marginTop: 2 },
  closeCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },

  otpContainer: {
    paddingVertical: 12, alignItems: "center", marginBottom: 24,
  },
  digitRow: {
    flexDirection: "row", gap: 12,
  },
  digitBox: {
    width: 64, height: 80, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  digitGlow: {
    position: "absolute", top: -20, left: -20, right: -20, bottom: -20,
    backgroundColor: "rgba(74,222,128,0.03)",
  },
  digitText: {
    color: "#FFF", fontSize: 42, fontWeight: "900",
  },

  emptyState: { alignItems: "center", gap: 12, paddingVertical: 10 },
  emptyText: { color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: "600", textAlign: "center" },

  infoBox: {
    flexDirection: "row", gap: 10, padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16, marginBottom: 24,
  },
  instruction: {
    flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "600", lineHeight: 18,
  },

  doneBtn: {
    height: 56, borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center", justifyContent: "center",
  },
  doneBtnText: { color: "#000", fontWeight: "900", fontSize: 16 },
});
