// components/MyBookings/Tabs/GoingTab.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Image, Pressable, RefreshControl, Animated,
  SectionList, SectionListData, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import OtpModal from "../../CheckIn/OtpModal";
import type { EventDoc } from "./CreatedTab";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import RatingModal from "../RatingModal";

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

function getEventState(ev: EventDoc): "upcoming" | "live" | "ended" {
  if (String(ev.status || "").toLowerCase() === "ended") return "ended";
  const ms = eventStartMs(ev);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "upcoming";
  if (ms <= Date.now()) return "live";
  return "upcoming";
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

// RatingModal is now imported from ../RatingModal.tsx

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
        <EventCard e={item} index={index} onPressEvent={onPressEvent} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─────────────────────────────────────────────
//  EVENT CARD
// ─────────────────────────────────────────────
function EventCard({ e, index, onPressEvent }: { e: EventDoc; index: number; onPressEvent: (ev: EventDoc) => void }) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(12)).current;
  const livePulse = useRef(new Animated.Value(1)).current;
  const [showOtp,    setShowOtp]    = useState(false);

  const state = getEventState(e);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
    ]).start();
  }, [a, y, index]);

  useEffect(() => {
    if (state !== "live") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [state]);

  const myOtp       = (e as any)?.myCheckInOtp ?? (e as any)?.checkInOtp ?? null;
  const isCheckedIn = !!(e as any)?.myCheckedIn;
  const isPending   = (e as any)?.myJoinStatus === "pending";

  const attendees: Array<{ clerkId: string; name: string; imageUrl?: string }> =
    Array.isArray(e.attendees) ? e.attendees : [];
  const visibleAttendees = attendees.slice(0, 5);
  const extraCount       = attendees.length - visibleAttendees.length;

  const kindCfg = e.kind === "service"
    ? { accent: C.purple, accentBg: C.purpleBg, accentText: C.purpleText }
    : e.kind === "paid"
    ? { accent: C.amber,  accentBg: C.amberBg,  accentText: C.amberText }
    : { accent: C.teal,   accentBg: C.tealBg,   accentText: C.tealText };

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
      <Pressable
        onPress={() => onPressEvent(e)}
        style={({ pressed }) => [
          T.card,
          state === "live" && { borderColor: C.coral + "88", borderWidth: 2 },
          state === "ended" && { borderColor: C.muted + "55", opacity: 0.85 },
          pressed && { transform: [{ scale: 0.985 }] },
        ]}
      >
        {/* LIVE banner */}
        {state === "live" && (
          <View style={T.liveBanner}>
            <Animated.View style={[T.liveDot, { transform: [{ scale: livePulse }] }]} />
            <Text style={T.liveBannerText}>🔴 Happening Now!</Text>
          </View>
        )}

        {/* ENDED banner */}
        {state === "ended" && (
          <View style={T.endedBanner}>
            <Text style={T.endedBannerText}>✓ Event ended</Text>
          </View>
        )}

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
                <Text style={[T.badgeText, { color: kindCfg.accentText }]}>{kindLabel(e)}</Text>
              </View>

              {/* Approval Status Badge */}
              {isPending ? (
                <View style={[T.badge, { backgroundColor: C.amberBg, borderColor: C.amber + "55" }]}>
                  <Text style={[T.badgeText, { color: C.amberText }]}>
                    {(e as any).isPaid ? "💰 Paid • Waiting Approval" : "⏳ Waiting Approval"}
                  </Text>
                </View>
              ) : (e.joinPolicy === "approval" ? (
                <View style={[T.badge, { backgroundColor: C.greenBg, borderColor: C.green + "55" }]}>
                  <Text style={[T.badgeText, { color: C.greenText }]}>✅ Approved by Host</Text>
                </View>
              ) : null)}

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

        {/* LIVE: Prominent OTP button */}
        {state === "live" && !isPending && (
          <TouchableOpacity
            onPress={(ev) => { ev.stopPropagation?.(); setShowOtp(true); }}
            activeOpacity={0.8}
            style={T.liveOtpBtn}
          >
            <Text style={{ fontSize: 18 }}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={T.liveOtpTitle}>Show My Check-in OTP</Text>
              <Text style={T.liveOtpSub}>Show this to the host to get verified</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.coralText} />
          </TouchableOpacity>
        )}

        {/* ENDED: Rate button */}
        {state === "ended" && !isPending && (
          <TouchableOpacity
            onPress={(ev) => { ev.stopPropagation?.(); onPressEvent(e); }}
            activeOpacity={0.8}
            style={T.rateBtn}
          >
            <Text style={{ fontSize: 18 }}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={T.rateBtnTitle}>Rate this event</Text>
              <Text style={T.rateBtnSub}>Share your experience with the community</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.amberText} />
          </TouchableOpacity>
        )}

        {/* Upcoming: OTP button */}
        {state === "upcoming" && !isPending && (
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

  // LIVE banner
  liveBanner: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.input,
    backgroundColor: C.coralBg, borderWidth: 1.5, borderColor: C.coral + "55",
  },
  liveDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: C.coral },
  liveBannerText:{ color: C.coralText, fontSize: 13, fontWeight: "900" },

  // Ended banner
  endedBanner: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.input,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
  },
  endedBannerText: { color: C.muted, fontSize: 12, fontWeight: "700" },

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

  // LIVE OTP button — big & prominent
  liveOtpBtn: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: R.input,
    backgroundColor: C.coralBg, borderWidth: 2, borderColor: C.coral + "88",
  },
  liveOtpTitle: { color: C.coralText, fontWeight: "900", fontSize: 14 },
  liveOtpSub:   { color: C.coral + "99", fontWeight: "600", fontSize: 11, marginTop: 2 },

  // Rate button
  rateBtn: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4,
    paddingVertical: 14, paddingHorizontal: 14, borderRadius: R.input,
    backgroundColor: C.amberBg, borderWidth: 1.5, borderColor: C.amber + "55",
  },
  rateBtnTitle: { color: C.amberText, fontWeight: "900", fontSize: 14 },
  rateBtnSub:   { color: C.amberText + "99", fontWeight: "600", fontSize: 11, marginTop: 2 },

  // Upcoming OTP button
  otpBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: R.input,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "55",
  },
  otpBtnText: { fontWeight: "800", fontSize: 13 },
});

// ─────────────────────────────────────────────
//  RATING MODAL STYLES
// ─────────────────────────────────────────────
const RT = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(28,26,23,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 44,
    borderTopWidth: 1.5, borderColor: C.cardBorder,
  },
  grabber: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.inputBorder, alignSelf: "center",
    marginTop: 12, marginBottom: 24,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  headerIcon: {
    width: 50, height: 50, borderRadius: 15,
    backgroundColor: C.amberBg, borderWidth: 1.5, borderColor: C.amber + "55",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "900", color: C.ink, letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },

  starsLabel: { textAlign: "center", fontSize: 14, fontWeight: "700", color: C.muted, marginBottom: 16, height: 20 },
  starsRow:   { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  star:       { fontSize: 38 },

  input: {
    backgroundColor: C.inputBg, borderRadius: R.input, borderWidth: 1.5, borderColor: C.inputBorder,
    padding: 14, color: C.ink, fontSize: 14, fontWeight: "600", minHeight: 80,
    textAlignVertical: "top", marginBottom: 6,
  },
  charCount: { textAlign: "right", color: C.hint, fontSize: 11, fontWeight: "600", marginBottom: 20 },

  submitBtn: {
    height: 54, borderRadius: R.pill, backgroundColor: C.amber,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.amber, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "900" },

  imageSection: { marginBottom: 20 },
  imageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  imageTitle:   { fontSize: 13, fontWeight: "800", color: C.ink, textTransform: "uppercase", letterSpacing: 0.5 },
  imageLimit:   { fontSize: 12, fontWeight: "700", color: C.hint },
  imageScroll:  { gap: 12 },
  addPhotoBtn: {
    width: 70, height: 70, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  addPhotoText: { fontSize: 10, fontWeight: "800", color: C.muted, marginTop: 4 },
  imagePreview: { width: 70, height: 70, borderRadius: 16, overflow: "hidden" },
  previewImg:   { width: "100%", height: "100%" },
  removeImgBtn: { position: "absolute", top: 2, right: 2, backgroundColor: "#FFF", borderRadius: 10 },

  successState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  successTitle: { color: C.ink, fontSize: 22, fontWeight: "900" },
  successSub:   { color: C.muted, fontSize: 14, fontWeight: "600", textAlign: "center" },
});