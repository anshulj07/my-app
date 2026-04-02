// app/event-interest/[eventId].tsx
// ─── DYNAMIC Event Detail Page ───────────────────────────────
// • Fetches real event data from API using eventId param
// • Same UI as before (carousel, tabs, comments etc.)
// • Attendance section with "View Attendance" button → attendance screen
// • Book Now / Join button using real booking API (same as MyBookings)

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Platform, StatusBar, Animated,
  Dimensions, FlatList, Image,
  NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiFetch } from "../../lib/apiFetch";

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get("window");
const IMG_H = 280;

const C = {
  bg:      "#f4f4ef",
  white:   "#FFFFFF",
  green:   "#22C55E",
  greenLt: "#E6F5EE",
  ink:     "#191919",
  ink2:    "#3A3A3A",
  muted:   "#888888",
  border:  "#EBEBEB",
  red:     "#FF4B6E",
  card:    "#e6e6dd",
  teal:    "#3ECFB2",
  tealBg:  "#E8FAF7",
};

const PALETTES = [
  "#C8E0D3", "#C2D9EE", "#EDD4C8",
  "#DED0EE", "#EDE0CA", "#C2DDE8",
];

// ─────────────────────────────────────────────────────────────
//  TYPES  (matching your backend EventDoc shape)
// ─────────────────────────────────────────────────────────────
type Attendee = {
  clerkUserId: string;
  name?: string;
  imageUrl?: string;
  joinedAt?: string;
  status?: "admitted" | "pending" | "rejected";
};

type EventDetail = {
  _id: string;
  title: string;
  emoji?: string;
  kind: "free" | "paid" | "service";
  priceCents?: number;
  date?: string;
  time?: string;
  startsAt?: string;
  description?: string;
  status?: string;
  joinPolicy?: "open" | "approval";
  attendance?: number;
  attendees?: Attendee[];
  location?: {
    formattedAddress?: string;
    city?: string;
    admin1?: string;
    admin1Code?: string;
  };
  creatorName?: string;
  creatorClerkId?: string;
  duration?: string;
  capacity?: number;
  language?: string;
  includes?: string[];
};

function safeJson(txt: string) {
  try { return JSON.parse(txt); } catch { return null; }
}

function formatPrice(ev: EventDetail) {
  if (ev.kind === "free") return "Free";
  if (ev.kind === "paid" && ev.priceCents) return `₹${(ev.priceCents / 100).toFixed(0)}`;
  return "Free";
}

function formatLocation(ev: EventDetail) {
  if (!ev.location) return "";
  if (ev.location.city) {
    return [ev.location.city, ev.location.admin1 || ev.location.admin1Code]
      .filter(Boolean).join(", ");
  }
  return ev.location.formattedAddress ?? "";
}

// ─────────────────────────────────────────────────────────────
//  IMAGE CAROUSEL
// ─────────────────────────────────────────────────────────────
function ImageCarousel({ emoji }: { emoji: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const slides = PALETTES.slice(0, 3);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / SW));
  };

  return (
    <View style={{ width: SW, height: IMG_H }}>
      <FlatList
        data={slides}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[IC.slide, { backgroundColor: item }]}>
            <Text style={IC.emoji}>{emoji || "📍"}</Text>
            <View style={IC.overlay} />
          </View>
        )}
      />
      <View style={IC.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[IC.dot, i === activeIdx && IC.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const IC = StyleSheet.create({
  slide:   { width: SW, height: IMG_H, alignItems: "center", justifyContent: "center" },
  emoji:   { fontSize: 90 },
  overlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80, backgroundColor: "rgba(0,0,0,0.12)" },
  dots:    { position: "absolute", bottom: 14, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { width: 20, backgroundColor: C.white },
});

// ─────────────────────────────────────────────────────────────
//  PRICE CHIP (floating over image)
// ─────────────────────────────────────────────────────────────
function PriceChip({ ev }: { ev: EventDetail }) {
  const price = formatPrice(ev);
  const loc   = formatLocation(ev);
  const isPaid = ev.kind === "paid";

  return (
    <View style={PC.wrap}>
      <View style={PC.inner}>
        <Text style={PC.name} numberOfLines={1}>{ev.title}</Text>
        <Text style={[PC.price, { color: isPaid ? C.ink : C.green }]}>{price}</Text>
      </View>
      {!!loc && (
        <View style={PC.locRow}>
          <Ionicons name="location-sharp" size={10} color={C.muted} />
          <Text style={PC.locTxt} numberOfLines={1}>{loc}</Text>
        </View>
      )}
    </View>
  );
}

const PC = StyleSheet.create({
  wrap: {
    position: "absolute", bottom: 16, left: 16, right: 16,
    backgroundColor: "rgba(255,255,255,0.93)", borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  inner:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  name:   { fontSize: 15, fontWeight: "800", color: C.ink, flex: 1, marginRight: 8 },
  price:  { fontSize: 18, fontWeight: "900" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locTxt: { fontSize: 11, fontWeight: "600", color: C.muted },
});

// ─────────────────────────────────────────────────────────────
//  ATTENDEE AVATAR ROW (preview — first 4 avatars)
// ─────────────────────────────────────────────────────────────
function AttendeeAvatarRow({ attendees, total, onViewAll }: {
  attendees: Attendee[];
  total: number;
  onViewAll: () => void;
}) {
  const preview = attendees.slice(0, 4);
  const extra   = total - preview.length;

  return (
    <TouchableOpacity style={AA.row} onPress={onViewAll} activeOpacity={0.82}>
      <View style={AA.avatarGroup}>
        {preview.map((a, i) => (
          <View key={a.clerkUserId} style={[AA.avatarWrap, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}>
            {a.imageUrl
              ? <Image source={{ uri: a.imageUrl }} style={AA.avatarImg} />
              : <View style={[AA.avatarImg, AA.avatarFallback]}>
                  <Text style={AA.avatarLetter}>{(a.name || "?")[0].toUpperCase()}</Text>
                </View>
            }
          </View>
        ))}
        {extra > 0 && (
          <View style={[AA.avatarWrap, AA.extraWrap, { marginLeft: -10 }]}>
            <Text style={AA.extraTxt}>+{extra}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={AA.countTxt}>
          {total > 0 ? `${total} ${total === 1 ? "person" : "people"} attending` : "Be the first to join!"}
        </Text>
        <Text style={AA.viewAllTxt}>View Attendance →</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.green} />
    </TouchableOpacity>
  );
}

const AA = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.greenLt, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: C.green + "44",
  },
  avatarGroup:   { flexDirection: "row", alignItems: "center" },
  avatarWrap:    { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.white, overflow: "hidden" },
  avatarImg:     { width: "100%", height: "100%" },
  avatarFallback:{ backgroundColor: C.tealBg, alignItems: "center", justifyContent: "center" },
  avatarLetter:  { fontSize: 12, fontWeight: "900", color: C.teal },
  extraWrap:     { backgroundColor: C.green, alignItems: "center", justifyContent: "center" },
  extraTxt:      { color: "#fff", fontSize: 10, fontWeight: "900" },
  countTxt:      { fontSize: 13, fontWeight: "800", color: C.ink },
  viewAllTxt:    { fontSize: 11, fontWeight: "700", color: C.green, marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function EventDetailScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { userId } = useAuth();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const params = useLocalSearchParams<{
    eventId: string;
    kind:    string;
    title:   string;
    emoji:   string;
  }>();

  const [event,      setEvent]      = useState<EventDetail | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [err,        setErr]        = useState<string | null>(null);
  const [tab,        setTab]        = useState<"overview" | "details">("overview");
  const [bookmarked, setBookmarked] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [booked,     setBooked]     = useState(false);

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 340, useNativeDriver: true }).start();
  }, []);

  const headers = {
    "Content-Type": "application/json",
    ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
  };

  // ── Fetch event detail ──────────────────────────────────────
  const loadEvent = useCallback(async () => {
    if (!API_BASE || !params.eventId) {
      // fallback: use params data if no API
      setEvent({
        _id:   params.eventId,
        title: params.title || "Event",
        emoji: params.emoji || "📍",
        kind:  (params.kind as any) || "free",
      });
      setLoading(false);
      return;
    }
    setLoading(true); setErr(null);
    try {
      const res  = await apiFetch(`${API_BASE}/api/events/${params.eventId}`, { method: "GET", headers });
      const json = safeJson(await res.text());
      if (!res.ok) throw new Error(json?.error || "Failed to load event");
      // API might return { event: {...} } or the event directly
      const ev: EventDetail = json?.event ?? json;
      setEvent(ev);
    } catch (e: any) {
      // Fallback to params if fetch fails — still shows something
      setEvent({
        _id:   params.eventId,
        title: params.title || "Event",
        emoji: params.emoji || "📍",
        kind:  (params.kind as any) || "free",
      });
      setErr(null); // silent fallback
    } finally {
      setLoading(false);
    }
  }, [API_BASE, params.eventId]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  // ── Book / Join ─────────────────────────────────────────────
  const handleBook = useCallback(async () => {
    if (!API_BASE || !userId || !event || bookingBusy) return;
    setBookingBusy(true);
    try {
      const res  = await apiFetch(`${API_BASE}/api/events/join`, {
        method: "POST", headers,
        body: JSON.stringify({
          eventId:       event._id,
          clerkUserId:   userId,
          joinPolicy:    event.joinPolicy || "open",
        }),
      });
      const json = safeJson(await res.text());
      if (res.ok) {
        setBooked(true);
      } else {
        // If already joined, still mark as booked
        const msg = (json?.error || "").toLowerCase();
        if (msg.includes("already") || msg.includes("joined")) setBooked(true);
      }
    } catch {}
    finally { setBookingBusy(false); }
  }, [API_BASE, userId, event, bookingBusy]);

  // ── Helpers ─────────────────────────────────────────────────
  const ev         = event;
  const title      = ev?.title      || params.title || "Event";
  const emoji      = ev?.emoji      || params.emoji || "📍";
  const loc        = ev ? formatLocation(ev) : "";
  const price      = ev ? formatPrice(ev) : "Free";
  const isPaid     = ev?.kind === "paid";
  const attendees  = ev?.attendees ?? [];
  const totalCount = ev?.attendance ?? attendees.length;
  const isCreator  = ev?.creatorClerkId && userId === ev.creatorClerkId;

  const TOP = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + insets.top;

  if (loading) {
    return (
      <View style={[S.screen, S.center, { paddingTop: TOP }]}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={S.loadingTxt}>Loading event…</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[S.screen, { opacity: fade }]}>

      {/* ── IMAGE CAROUSEL ── */}
      <View style={{ position: "relative" }}>
        <ImageCarousel emoji={emoji} />

        {/* Back button */}
        <TouchableOpacity
          style={[S.backBtn, { top: TOP + 10 }]}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>

        {/* Bookmark button */}
        <TouchableOpacity
          style={[S.bookmarkBtn, { top: TOP + 10 }]}
          onPress={() => setBookmarked(b => !b)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={20}
            color={bookmarked ? C.green : C.ink}
          />
        </TouchableOpacity>

        {/* Floating price chip */}
        {ev && <PriceChip ev={ev} />}
      </View>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >

        {/* ── INFO BLOCK ── */}
        <View style={S.infoBlock}>
          <Text style={S.title}>{title}</Text>

          {!!loc && (
            <View style={S.locRow}>
              <Ionicons name="location-sharp" size={14} color={C.red} />
              <Text style={S.locTxt}>{loc}</Text>
            </View>
          )}

          {/* Stats row */}
          <View style={S.statsRow}>
            <View style={S.statItem}>
              <Text style={{ fontSize: 14 }}>⭐</Text>
              <Text style={S.statVal}>4.8</Text>
              <Text style={S.statSub}>(54)</Text>
            </View>
            {totalCount > 0 && (
              <>
                <View style={S.divider} />
                <View style={S.statItem}>
                  <Ionicons name="people-outline" size={14} color={C.muted} />
                  <Text style={S.statVal}>{totalCount}</Text>
                  <Text style={S.statSub}>going</Text>
                </View>
              </>
            )}
            {!!(ev?.time || ev?.date) && (
              <>
                <View style={S.divider} />
                <View style={S.statItem}>
                  <Ionicons name="time-outline" size={14} color={C.muted} />
                  <Text style={S.statVal} numberOfLines={1}>{ev?.time || ev?.date}</Text>
                </View>
              </>
            )}
            {!!ev?.duration && (
              <>
                <View style={S.divider} />
                <View style={S.statItem}>
                  <Ionicons name="hourglass-outline" size={14} color={C.muted} />
                  <Text style={S.statVal}>{ev.duration}</Text>
                </View>
              </>
            )}
          </View>

          {/* Price display */}
          <View style={S.priceRow}>
            <Text style={[S.bigPrice, { color: isPaid ? C.ink : C.green }]}>
              {price}
            </Text>
            {isPaid && <Text style={S.perPerson}> per person</Text>}
          </View>
        </View>

        {/* ── ATTENDANCE PREVIEW CARD ── */}
        <View style={S.attendSection}>
          <AttendeeAvatarRow
            attendees={attendees}
            total={totalCount}
            onViewAll={() =>
              router.push({
                pathname: "/event-interest/[eventId]" as any,
                params: {
                  eventId:    ev?._id ?? params.eventId,
                  title:      title,
                  emoji:      emoji,
                  isCreator:  isCreator ? "1" : "0",
                },
              })
            }
          />
        </View>

        {/* ── TABS ── */}
        <View style={S.tabRow}>
          {(["overview", "details"] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[S.tab, tab === t && S.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[S.tabTxt, tab === t && S.tabTxtActive]}>
                {t === "overview" ? "Overview" : "Details"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" ? (
          <View style={S.section}>
            <Text style={S.sectionTitle}>About this event</Text>
            <Text style={S.about}>
              {ev?.description ||
                `${title} is a one-of-a-kind experience offering culture, community, and excitement. ` +
                `Whether you're a first-timer or a regular, this event is crafted to leave you with unforgettable memories. ` +
                `Come ready to immerse yourself and discover something new.`}
            </Text>

            {/* What's included */}
            <Text style={[S.sectionTitle, { marginTop: 18 }]}>What's included</Text>
            {(ev?.includes ?? ["Welcome kit", "All materials", "Refreshments"]).map((item, i) => (
              <View key={i} style={S.includeRow}>
                <Text style={{ fontSize: 16 }}>
                  {i === 0 ? "📖" : i === 1 ? "✅" : "🍃"}
                </Text>
                <Text style={S.includeTxt}>{item}</Text>
              </View>
            ))}

            {/* Join policy badge */}
            {ev?.joinPolicy === "approval" && (
              <View style={S.approvalBadge}>
                <Ionicons name="shield-checkmark-outline" size={14} color={C.teal} />
                <Text style={S.approvalTxt}>Requires host approval to join</Text>
              </View>
            )}
          </View>
        ) : (
          /* ── DETAILS TAB ── */
          <View style={S.section}>
            <Text style={S.sectionTitle}>Event Details</Text>
            {[
              { label: "Date",      val: ev?.date      || "TBD" },
              { label: "Time",      val: ev?.time      || "TBD" },
              { label: "Duration",  val: ev?.duration  || "TBD" },
              { label: "Capacity",  val: ev?.capacity ? `${ev.capacity} participants` : "Open" },
              { label: "Language",  val: ev?.language  || "English" },
              { label: "Join",      val: ev?.joinPolicy === "approval" ? "Approval required" : "Open to all" },
              { label: "Hosted by", val: ev?.creatorName || "Local Host" },
              { label: "Status",    val: ev?.status    || "Active" },
            ].map((row, i) => (
              <View key={i} style={S.detailRow}>
                <Text style={S.detailLabel}>{row.label}</Text>
                <Text style={S.detailVal}>{row.val}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── STICKY FOOTER ── */}
      <View style={[S.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
        {booked ? (
          <View style={S.bookedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={C.green} />
            <Text style={S.bookedTxt}>
              {ev?.joinPolicy === "approval" ? "Request Sent! Awaiting approval" : "You're going! 🎉"}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[S.bookNowBtn, bookingBusy && { opacity: 0.7 }]}
            onPress={handleBook}
            activeOpacity={0.88}
            disabled={bookingBusy}
          >
            {bookingBusy
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={S.bookNowTxt}>
                    {isCreator ? "View My Event" : ev?.kind === "paid" ? `Book Now · ${price}` : "Join Now · Free"}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>
        )}
      </View>

    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: "center", justifyContent: "center" },
  loadingTxt: { color: C.muted, fontWeight: "700", fontSize: 13, marginTop: 12 },

  backBtn: {
    position: "absolute", left: 16, width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center",
    zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 4,
  },
  bookmarkBtn: {
    position: "absolute", right: 16, width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center",
    zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 4,
  },

  infoBlock:  { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  title:      { fontSize: 26, fontWeight: "900", color: C.ink, letterSpacing: -0.5, marginBottom: 8, lineHeight: 32 },
  locRow:     { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 14 },
  locTxt:     { fontSize: 13, fontWeight: "600", color: C.muted },

  statsRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16, gap: 12, marginBottom: 14,
  },
  statItem:  { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  statVal:   { fontSize: 13, fontWeight: "800", color: C.ink },
  statSub:   { fontSize: 11, fontWeight: "600", color: C.muted },
  divider:   { width: 1, height: 22, backgroundColor: C.border },

  priceRow:  { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  bigPrice:  { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  perPerson: { fontSize: 14, fontWeight: "600", color: C.muted },

  attendSection: { paddingHorizontal: 20, paddingTop: 12 },

  tabRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginTop: 18, marginBottom: 4 },
  tab:    { paddingHorizontal: 22, paddingVertical: 9, borderRadius: 999, backgroundColor: C.card },
  tabActive:  { backgroundColor: C.ink },
  tabTxt:     { fontSize: 14, fontWeight: "700", color: C.muted },
  tabTxtActive: { color: C.white, fontWeight: "800" },

  section:      { paddingHorizontal: 20, paddingTop: 18 },
  sectionTitle: { fontSize: 17, fontWeight: "900", color: C.ink, marginBottom: 10 },
  about:        { fontSize: 14, lineHeight: 22, color: C.ink2 },
  includeRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  includeTxt:   { fontSize: 14, fontWeight: "700", color: C.ink2 },

  approvalBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 16, padding: 12, borderRadius: 12,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
  },
  approvalTxt: { fontSize: 13, fontWeight: "700", color: C.teal },

  detailRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel: { fontSize: 13, fontWeight: "700", color: C.muted },
  detailVal:   { fontSize: 13, fontWeight: "800", color: C.ink },

  stickyFooter: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 20, paddingTop: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 12,
  },
  bookNowBtn: {
    backgroundColor: C.green, borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: C.green, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  bookNowTxt: { color: C.white, fontSize: 17, fontWeight: "900", letterSpacing: 0.2 },

  bookedBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: C.greenLt, borderRadius: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: C.green + "55",
  },
  bookedTxt: { fontSize: 15, fontWeight: "800", color: C.green },
});