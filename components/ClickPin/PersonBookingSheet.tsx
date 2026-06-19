import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal, View, Text, StyleSheet, Pressable, Image,
  ActivityIndicator, ScrollView, Animated, Easing,
  Platform, Switch, Alert, Share, TouchableOpacity, Linking,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { EventPin } from "../Map/MapView";
import JoinEventButton from "./JoinEventButton";
import { apiFetch } from "../../lib/apiFetch";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const C = {
  pageBg: "#FFFFFF",
  surface: "#F8F9FA",
  card: "#FFFFFF",
  border: "rgba(0,0,0,0.06)",
  sep: "rgba(0,0,0,0.04)",
  ink: "#111827",
  ink2: "#374151",
  muted: "#6B7280",
  hint: "#9CA3AF",

  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.08)",
  greenBorder: "rgba(16,185,129,0.20)",
  greenDark: "#059669",

  amber: "#F59E0B",
  amberSoft: "rgba(245,158,11,0.08)",
  red: "#EF4444",
  redSoft: "rgba(239,68,68,0.08)",
  accent: "#10B981",
  accentSoft: "rgba(16,185,129,0.08)",
  accentText: "#047857",
  blue: "#3B82F6",
  blueSoft: "rgba(59,130,246,0.08)",
  blueBorder: "rgba(59,130,246,0.20)",
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function parseDateObj(ev: any): Date | null {
  if (ev?.startsAt) {
    const t = new Date(ev.startsAt);
    if (Number.isFinite(t.getTime())) return t;
  }
  if (typeof ev?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
    const [y, m, d] = ev.date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  return null;
}
function fmtLong(ev: any) {
  const d = parseDateObj(ev);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function fmtShort(ev: any) {
  const d = parseDateObj(ev);
  if (!d) return "";
  const day = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const date = d.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
  const time = (ev as any)?.time ? ` · ${(ev as any).time}` : "";
  const endTime = (ev as any)?.endTime ? ` - ${(ev as any).endTime}` : "";
  return `${day}, ${date}${time}${endTime}`;
}
function pick(...vs: any[]) {
  for (const v of vs) if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}
function fromCents(c: any) {
  const n = typeof c === "string" ? Number(c) : c;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? (n / 100).toFixed(0) : "";
}
function fromCentsLabel(c: any) {
  const v = fromCents(c);
  return v ? `₹${v}` : "";
}
function t12(t24: string) {
  if (!t24) return "";
  try {
    const [h, m] = t24.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return t24;
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
  } catch { return t24; }
}

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Props = {
  visible: boolean;
  onClose: () => void;
  person?: EventPin | null;
  onEditDetails?: (ev: EventPin) => void;
  onStatusChanged?: (id: string, s: string) => void;
  onDeleteEvent?: (id: string) => void;
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function PersonBookingSheet({
  visible, onClose, person,
  onEditDetails, onStatusChanged, onDeleteEvent,
}: Props) {
  const router = useRouter();
  const { userId } = useAuth();

  const eventId = String(
    (person as any)?._id?.$oid || (person as any)?._id?.oid ||
    (person as any)?._id || (person as any)?.id || (person as any)?.eventId || ""
  );
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;
  const creatorClerkId =
    (person as any)?.creatorClerkId || (person as any)?.creator?.clerkUserId || (person as any)?.creatorId || "";

  const kind: "free" | "service" | "paid" | "event_free" | "event_paid" =
    ((person as any)?.kind || "free") as any;
  const isPaid = kind === "paid" || kind === "event_paid";
  const priceLabel = fromCentsLabel((person as any)?.priceCents);
  const priceCents: number | null = (person as any)?.priceCents ?? null;
  const isCreator = !!userId && !!creatorClerkId && String(userId) === String(creatorClerkId);
  const bannerImg = (person as any)?.bannerUri || (person as any)?.bannerImage || (person as any)?.imageUrl || (person as any)?.coverImage || (person as any)?.image || "";

  /* ── state ── */
  const [statusLocal, setStatusLocal] = useState("active");
  const [isLive, setIsLive] = useState(false);
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [togglingService, setTogglingService] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creator, setCreator] = useState<any>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const descText = pick((person as any)?.description, (person as any)?.desc, "");

  useEffect(() => {
    if (!visible || !person) return;
    const s = String((person as any)?.status || "active");
    setStatusLocal(s);
    setServiceEnabled(s.toLowerCase() !== "paused");
    setSaved(false);

    // ✅ Sync "Live" logic with Map (time-based)
    const st = s.toLowerCase();
    if (st === "live") {
      setIsLive(true);
    } else if (st === "ended" || st === "cancelled") {
      setIsLive(false);
    } else {
      // Time-based check (same as mapHtml.ts)
      const startsAt = (person as any)?.startsAt;
      const date = (person as any)?.date;
      const time = (person as any)?.time;

      let startMs = 0;
      if (startsAt) {
        startMs = new Date(startsAt).getTime();
      } else if (date && time) {
        // Try local time format first
        startMs = new Date(`${date}T${time}:00`).getTime();
        // If that fails (e.g. invalid date string), try fallback
        if (isNaN(startMs)) startMs = new Date(`${date} ${time}`).getTime();
      } else if (date) {
        startMs = new Date(`${date}T00:00:00`).getTime();
      }

      if (startMs && !isNaN(startMs) && startMs <= Date.now()) {
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    }
  }, [visible, eventId, person, statusLocal]);

  useEffect(() => {
    if (!visible || !API_BASE || !creatorClerkId) return;
    let dead = false;
    (async () => {
      setLoadingCreator(true);
      try {
        const r = await apiFetch(
          `${API_BASE}/api/users/get-user?clerkUserId=${encodeURIComponent(creatorClerkId)}`,
          { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined }
        );
        const j = await r.json().catch(() => null);
        if (!dead) setCreator(r.ok ? j?.user ?? null : null);
      } catch { if (!dead) setCreator(null); }
      finally { if (!dead) setLoadingCreator(false); }
    })();
    return () => { dead = true; };
  }, [visible, API_BASE, EVENT_API_KEY, creatorClerkId]);

  const creatorName = pick(
    creator?.profile?.firstName && creator?.profile?.lastName
      ? `${creator.profile.firstName} ${creator.profile.lastName}` : "",
    creator?.profile?.firstName, "Organizer"
  );
  const creatorAbout = pick(creator?.profile?.about, "");
  const creatorPhoto = creator?.profile?.photos?.[0] || "";

  const D = useMemo(() => {
    if (!person) return null;
    const loc = (person as any)?.location || {};
    const address = pick(loc.formattedAddress, loc.address, (person as any)?.address, "");
    const city = pick(loc.city, (person as any)?.city);
    const region = pick(loc.admin1Code, loc.admin1, (person as any)?.region, (person as any)?.state);
    const country = pick(loc.countryCode, loc.country, (person as any)?.country);
    const lat = loc.lat || (person as any)?.lat;
    const lng = loc.lng || (person as any)?.lng;
    const attendees = Array.isArray((person as any)?.attendees) ? (person as any).attendees : [];
    const pending = Array.isArray((person as any)?.pendingRequests) ? (person as any).pendingRequests : [];
    const cap = (person as any)?.attendance;
    const durationHardcoded = (person as any)?.duration || (person as any)?.totalHours;
    
    let durationLabel = "";
    
    // 1. Try to calculate from time / endTime strings FIRST (more reliable for display)
    if ((person as any)?.time && (person as any)?.endTime) {
      try {
        const [h1, m1] = (person as any).time.split(":").map(Number);
        const [h2, m2] = (person as any).endTime.split(":").map(Number);
        if (!isNaN(h1) && !isNaN(m1) && !isNaN(h2) && !isNaN(m2)) {
          let totalMins = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (totalMins < 0) totalMins += 24 * 60; // handle overnight
          
          if (totalMins < 60) durationLabel = `${totalMins} min`;
          else {
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            durationLabel = m > 0 ? `${h}h ${m}m` : `${h} hrs`;
          }
        }
      } catch (err) {}
    }

    // 2. Try to calculate from startsAt / endsAt if no label yet
    if (!durationLabel && (person as any)?.startsAt && (person as any)?.endsAt) {
      const s = new Date((person as any).startsAt);
      const e = new Date((person as any).endsAt);
      const diffMs = e.getTime() - s.getTime();
      if (diffMs > 0) {
        const totalMins = Math.round(diffMs / 60000);
        if (totalMins < 60) durationLabel = `${totalMins} min`;
        else {
          const h = Math.floor(totalMins / 60);
          const m = totalMins % 60;
          durationLabel = m > 0 ? `${h}h ${m}m` : `${h} hrs`;
        }
      }
    }
    
    // 3. Fallback to hardcoded duration if still empty
    if (!durationLabel && durationHardcoded) {
      durationLabel = `${durationHardcoded} hrs`;
    }

    const dateShortRaw = fmtShort(person);
    const dateOnly = parseDateObj(person)?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) || "";
    
    const startT = (person as any)?.time;
    const endT = (person as any)?.endTime;
    
    // Cleaner time range: "1:40 - 2:00 PM" instead of "1:40 PM - 2:00 PM" if both are same suffix
    let timeRange = "";
    if (startT) {
      const s12 = t12(startT);
      const e12 = endT ? t12(endT) : "";
      if (e12) {
        const [sTime, sSuff] = s12.split(" ");
        const [eTime, eSuff] = e12.split(" ");
        if (sSuff === eSuff) timeRange = `${sTime} - ${e12}`;
        else timeRange = `${s12} - ${e12}`;
      } else {
        timeRange = s12;
      }
    }

    return {
      address,
      venueLine: address.split(",")[0] || "",
      cityLine: [city, region, country].filter(Boolean).join(", "),
      dateLong: fmtLong(person),
      dateShort: dateShortRaw,
      dateOnly,
      timeRange,
      lat, lng,
      tags: Array.isArray((person as any)?.tags) ? (person as any).tags as string[] : [],
      joined: attendees.length,
      capacity: typeof cap === "number" ? cap : parseInt(String(cap || ""), 10) || null,
      isPending: !!userId && pending.some((p: any) => String(p.clerkUserId) === String(userId)),
      joinPolicy: (person as any)?.joinPolicy as "open" | "approval" | undefined,
      attendees,
      spotsLeft: cap ? Math.max(0, cap - attendees.length) : null,
      durationLabel,
    };
  }, [person, userId]);

  const staticMapUrl = useMemo(() => {
    if (!D?.lat || !D?.lng || !GOOGLE_KEY) return null;
    const lat = Number(D.lat), lng = Number(D.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&scale=2&markers=color:0x1DB954%7C${lat},${lng}&style=feature:poi%7Cvisibility:off&key=${GOOGLE_KEY}`;
  }, [D?.lat, D?.lng, GOOGLE_KEY]);

  const openMaps = () => {
    if (!D?.lat || !D?.lng) return;
    const lat = Number(D.lat), lng = Number(D.lng);
    const label = encodeURIComponent(D.venueLine || "Location");
    const iosUrl = `maps://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
    const andUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const native = Platform.OS === "ios" ? iosUrl : andUrl;
    Linking.canOpenURL(native).then(ok => Linking.openURL(ok ? native : webUrl)).catch(() => Linking.openURL(webUrl));
  };

  const openAttendees = () => {
    close(() => {
      router.push({ pathname: "/event/[eventId]/attendees" as any, params: { eventId } });
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: (person as any)?.title || "Check out this service",
        message: `${(person as any)?.title || "Service"}${D?.dateLong ? `\n📅 ${D.dateLong}` : ""}${D?.address ? `\n📍 ${D.address}` : ""}\n\nJoin on assisto!`,
      });
    } catch { }
  };

  const handleDelete = () => {
    Alert.alert("Delete Service?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          if (!API_BASE || !eventId || !userId) return;
          try {
            await apiFetch(`${API_BASE}/api/events/delete-event`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
              body: JSON.stringify({ eventId, creatorClerkId: userId }),
            });
            close(() => onDeleteEvent?.(eventId));
          } catch { Alert.alert("Error", "Failed to delete."); }
        },
      },
    ]);
  };

  const patchService = async (next: boolean) => {
    if (!API_BASE || !eventId || !creatorClerkId) return;
    const pe = serviceEnabled, ps = statusLocal, op = next ? "active" : "paused";
    setServiceEnabled(next); setStatusLocal(op); onStatusChanged?.(eventId, op);
    try {
      setTogglingService(true);
      const r = await apiFetch(`${API_BASE}/api/events/toggle-service`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
        body: JSON.stringify({ _id: eventId, creatorClerkId, enabled: next }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Failed");
      const ns = String(j?.status || j?.event?.status || op);
      setStatusLocal(ns); setServiceEnabled(ns.toLowerCase() !== "paused");
      onStatusChanged?.(eventId, ns);
    } catch { setServiceEnabled(pe); setStatusLocal(ps); onStatusChanged?.(eventId, ps); }
    finally { setTogglingService(false); }
  };

  /* ── animations ── */
  const slideY = useRef(new Animated.Value(900)).current;
  const dimA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    slideY.setValue(900); dimA.setValue(0);
    Animated.parallel([
      Animated.timing(dimA, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, tension: 65, friction: 13, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const close = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(dimA, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 900, duration: 230, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) { onClose(); after?.(); } });
  };

  const navigateToProfile = () => {
    if (!creatorClerkId) return;
    close(() => {
      router.push({
        pathname: "/profile/[clerkUserId]",
        params: { clerkUserId: creatorClerkId, name: creatorName, imageUrl: creatorPhoto },
      } as any);
    });
  };

  const platformFee = priceCents ? Math.round(priceCents * 0.10) : 1000;

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <Modal
      transparent visible={visible} animationType="none"
      onRequestClose={() => close()}
      presentationStyle="overFullScreen" statusBarTranslucent hardwareAccelerated
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => close()}>
        <Animated.View style={[S.dim, { opacity: dimA }]} />
      </Pressable>

      <Animated.View style={[S.sheet, { transform: [{ translateY: slideY }] }]}>
        {!person ? (
          <View style={S.empty}>
            <Text style={S.emptyT}>Nothing selected</Text>
            <Pressable onPress={() => close()} style={S.emptyBtn}>
              <Text style={S.emptyBtnT}>Close</Text>
            </Pressable>
          </View>
        ) : (<>

          {/* ── NAV BAR ── */}
          <View style={S.topNav}>
            <Pressable onPress={() => close()} hitSlop={12} style={S.navBackBtn}>
              <Ionicons name="chevron-back" size={20} color={C.ink} />
              <Text style={S.navBackText}>{kind === "service" ? "Book Service" : "Book Event"}</Text>
            </Pressable>
            <Pressable onPress={() => close()} hitSlop={16} style={S.navCloseBtn}>
              <Ionicons name="close" size={20} color={C.muted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            {/* ── BANNER ── */}
            <View style={S.bannerWrap}>
              {bannerImg ? (
                <Image source={{ uri: bannerImg }} style={S.bannerImg} resizeMode="cover" />
              ) : (
                <View style={S.bannerDefault}>
                  <Text style={S.bannerEmoji}>{(person as any)?.emoji || "📍"}</Text>
                </View>
              )}
            </View>

            {/* ── CREATOR TOOLS: AVAILABILITY TOGGLE ── */}
            {isCreator && kind === "service" && (
              <View style={S.topToggleSection}>
                <View style={[S.toggleCard, !serviceEnabled && S.toggleCardPaused]}>
                  <View style={S.toggleIconBox}>
                    <Ionicons 
                      name={serviceEnabled ? "flash" : "pause-circle"} 
                      size={20} 
                      color={serviceEnabled ? C.green : C.amber} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.toggleLabel}>Availability Status</Text>
                    <Text style={[S.toggleSub, { color: serviceEnabled ? C.green : C.amber }]}>
                      {serviceEnabled ? "Accepting bookings" : "Service is paused"}
                    </Text>
                  </View>
                  {togglingService ? (
                    <ActivityIndicator color={C.green} size="small" />
                  ) : (
                    <Switch
                      value={serviceEnabled}
                      onValueChange={patchService}
                      trackColor={{ false: C.hint, true: C.green }}
                      thumbColor="#fff"
                    />
                  )}
                </View>
              </View>
            )}

            {/* ── TITLE ── */}
            <View style={S.titleSection}>
              <Text style={S.mainTitle} numberOfLines={2}>
                {(person as any)?.title || "Untitled Service"}
              </Text>
              
              {/* ✅ Tags / Companion Type */}
              {Array.isArray((person as any)?.tags) && (person as any).tags.length > 0 && (
                <View style={[S.heroChips, { marginTop: 12 }]}>
                  {(person as any).tags.map((t: string) => (
                    <View key={t} style={S.tagChip}>
                      <Text style={S.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ✅ SERVICE DESCRIPTION */}
            {!!descText && (
              <View style={S.section}>
                <Text style={S.sectionHeader}>About this Service</Text>
                <View style={S.sectionBody}>
                  <Text style={S.detailDesc}>{descText}</Text>
                </View>
              </View>
            )}

            {/* ✅ MEETING STYLE */}
            {!!(person as any)?.serviceMetadata?.meetupStyle && (
              <View style={S.section}>
                <Text style={S.sectionHeader}>Meeting Style</Text>
                <View style={[S.sectionBody, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
                  <Ionicons name="location" size={16} color={C.green} />
                  <Text style={S.detailDesc}>
                    {((person as any)?.serviceMetadata?.meetupStyle === "my_area") ? "Guest meets at my area" : 
                     ((person as any)?.serviceMetadata?.meetupStyle === "go_to_guest") ? "I go to guest's location" : 
                     "We decide on chat"}
                  </Text>
                </View>
              </View>
            )}



            {/* ── ORDER SUMMARY (Matches Screenshot) ── */}
            <View style={S.section}>
              <Text style={S.sectionHeader}>Order Summary</Text>
              <View style={S.orderCard}>
                {/* Organizer Row */}
                <TouchableOpacity style={S.orderOrgRow} activeOpacity={0.7} onPress={navigateToProfile}>
                  <View style={S.orderOrgAvatar}>
                    {creatorPhoto
                      ? <Image source={{ uri: creatorPhoto }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                      : (
                        <View style={S.orderOrgAvatarFallback}>
                          <Text style={S.orderOrgInitial}>{creatorName.charAt(0).toUpperCase()}</Text>
                        </View>
                      )
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.orderOrgName}>{creatorName}</Text>
                    <Text style={S.orderOrgSub}>Organizer • Verified</Text>
                  </View>
                  <View style={S.verifiedBadge}>
                    <Ionicons name="checkmark-sharp" size={10} color={C.green} />
                    <Text style={S.verifiedText}>Verified</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={C.hint} style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                <View style={S.orderDivider} />

                {/* Item Row */}
                <View style={S.orderRow}>
                  <Text style={S.orderRowLabel}>{(person as any)?.title || "Service"}</Text>
                  <Text style={S.orderRowValue}>{isPaid ? priceLabel : "Free"}</Text>
                </View>
                <View style={S.orderRow}>
                  <Text style={S.orderRowLabel}>1 x {kind === "service" ? "Booking" : "Spot"}</Text>
                  <Text style={S.orderRowValue}> </Text>
                </View>

                <View style={S.orderDivider} />

                {/* Fee Row */}
                <View style={S.orderRow}>
                  <Text style={S.orderRowLabel}>Platform Fee</Text>
                  <Text style={S.orderRowValue}>₹{(platformFee / 100).toFixed(0)}</Text>
                </View>

                <View style={S.totalDivider} />

                {/* Total Row */}
                <View style={S.orderRow}>
                  <Text style={[S.orderRowLabel, { fontWeight: "800", color: C.ink }]}>Total</Text>
                  <Text style={[S.orderRowValue, { fontWeight: "800", color: C.green }]}>
                    {isPaid ? priceLabel : "Free"}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── SERVICE DETAILS ── */}
            <View style={S.section}>
              <Text style={S.sectionHeader}>{kind === "service" ? "Service Details" : "Event Details"}</Text>
              <View style={S.detailsCard}>
                {/* Tags */}
                {D?.tags && D.tags.length > 0 && (
                  <View style={S.tagsRow}>
                    {D.tags.map((t, i) => (
                      <View key={i} style={S.tagChip}>
                        <Text style={S.tagChipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Description */}
                {!!descText && (
                  <Text style={S.detailDesc}>{descText}</Text>
                )}

                <View style={S.orderDivider} />

                {/* Triple Info */}
                <View style={S.infoTriple}>
                  {!!D?.dateOnly && (
                    <View style={S.infoTripleItem}>
                      <View style={S.infoTripleIcon}>
                        <Ionicons name="calendar" size={18} color={C.green} />
                      </View>
                      <Text style={S.infoTripleLabel}>{D.dateOnly}</Text>
                      <Text style={S.infoTripleSub}>Date</Text>
                    </View>
                  )}
                  {!!D?.timeRange && (
                    <View style={S.infoTripleItem}>
                      <View style={[S.infoTripleIcon, { backgroundColor: C.blueSoft }]}>
                        <Ionicons name="time" size={18} color={C.blue} />
                      </View>
                      <Text style={S.infoTripleLabel}>{D.timeRange}</Text>
                      <Text style={S.infoTripleSub}>Time</Text>
                    </View>
                  )}
                  {!!D?.durationLabel && (
                    <View style={S.infoTripleItem}>
                      <View style={[S.infoTripleIcon, { backgroundColor: "rgba(139,92,246,0.1)" }]}>
                        <Ionicons name="timer" size={18} color="#8B5CF6" />
                      </View>
                      <Text style={[S.infoTripleLabel, { color: "#8B5CF6" }]}>{D.durationLabel}</Text>
                      <Text style={S.infoTripleSub}>Duration</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* ── HOST PROFILE ── */}
            {!!creatorAbout && (
              <View style={S.section}>
                <Text style={S.sectionHeader}>About the Host</Text>
                <View style={S.detailsCard}>
                  <Text style={S.detailDesc}>{creatorAbout}</Text>
                </View>
              </View>
            )}

            {/* ── SERVICE POLICIES ── */}
            {kind === "service" && (
              <View style={S.section}>
                <Text style={S.sectionHeader}>Service Policies</Text>
                <View style={S.detailsCard}>
                  <View style={S.policyRow}>
                    <Ionicons name="walk" size={18} color={C.muted} />
                    <Text style={S.policyText}>
                      Meetup Style: <Text style={{ fontWeight: "700", color: C.ink }}>
                        {(person as any)?.serviceMetadata?.meetupStyle === "go_to_guest" ? "I travel to you" : 
                         (person as any)?.serviceMetadata?.meetupStyle === "decide_on_chat" ? "Decide in chat" : "My preferred area"}
                      </Text>
                    </Text>
                  </View>
                  <View style={[S.policyRow, { marginTop: 12 }]}>
                    <Ionicons name="timer-outline" size={18} color={C.muted} />
                    <Text style={S.policyText}>
                      Minimum Booking: <Text style={{ fontWeight: "700", color: C.ink }}>
                        {(person as any)?.serviceMetadata?.minDuration || "1 hr"}
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── WEEKLY SCHEDULE ── */}
            {kind === "service" && (person as any)?.serviceMetadata?.schedule && (
              <View style={S.section}>
                <Text style={S.sectionHeader}>Weekly Availability</Text>
                <View style={S.detailsCard}>
                  {(person as any)?.serviceMetadata?.schedule?.map((day: any, idx: number) => (
                    <View key={idx} style={[S.scheduleRow, idx > 0 && { marginTop: 10 }]}>
                      <Text style={[S.scheduleDay, !day.active && { color: C.hint }]}>{day.day}</Text>
                      <View style={[S.scheduleLine, !day.active && { backgroundColor: C.border }]} />
                      <Text style={[S.scheduleTime, !day.active && { color: C.hint }]}>
                        {day.active ? `${day.start} - ${day.end}` : "Unavailable"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── LOCATION ── */}
            {!!(D?.venueLine || D?.cityLine) && (
              <View style={S.section}>
                <Text style={S.sectionHeader}>Location</Text>
                <View style={S.mapCard}>
                  {staticMapUrl ? (
                    <Pressable onPress={openMaps}>
                      <Image source={{ uri: staticMapUrl }} style={S.mapImg} resizeMode="cover" />
                    </Pressable>
                  ) : (
                    <Pressable onPress={openMaps} style={S.mapFallback}>
                      <Ionicons name="location" size={24} color={C.green} />
                      <Text style={S.mapTapText}>Tap to open Maps</Text>
                    </Pressable>
                  )}
                  <View style={S.mapFooter}>
                    <View style={S.mapAccentBar} />
                    <View style={{ flex: 1 }}>
                      <Text style={S.mapVenue} numberOfLines={1}>{D?.venueLine}</Text>
                      <Text style={S.mapCity} numberOfLines={1}>{D?.cityLine}</Text>
                    </View>
                    <Pressable onPress={openMaps} style={S.mapOpenBtn}>
                      <Text style={S.mapOpenBtnText}>Open ↗</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* ── HELP ── */}
            {isCreator && (
              <View style={S.section}>
                <TouchableOpacity style={S.supportCard} activeOpacity={0.7}>
                  <Ionicons name="help-circle-outline" size={20} color={C.muted} />
                  <Text style={S.supportText}>Need help managing this service?</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.hint} />
                </TouchableOpacity>
              </View>
            )}

            {/* ── DELETE ── */}
            {isCreator && (
              <Pressable onPress={handleDelete} style={S.deleteRow}>
                <Ionicons name="trash-outline" size={14} color={C.hint} />
                <Text style={S.deleteText}>Delete this service</Text>
              </Pressable>
            )}

          </ScrollView>

          {/* ── CTA BAR (Matches Screenshot) ── */}
          <View style={S.ctaBar}>
            {isCreator && !isLive && (
              <Pressable onPress={() => close(() => onEditDetails?.(person!))} style={S.ctaMainBtn}>
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={S.ctaBtnText}>
                  {kind === "service" ? "Edit Service Details" : "Edit Event Details"}
                </Text>
              </Pressable>
            )}

            {!isCreator && (
              <JoinEventButton
                eventId={eventId}
                kind={kind as any}
                priceCents={priceCents}
                eventTitle={String((person as any)?.title || "Service")}
                eventLocation={D?.address || "-"}
                label="Book Now"
                joinPolicy={((person as any)?.joinPolicy || "open") as any}
                onJoined={() => close()}
                disabled={kind === "service" && statusLocal.toLowerCase() === "paused"}
                creatorClerkId={creatorClerkId}
                startDate={(person as any)?.startDate}
                endDate={(person as any)?.endDate}
              />
            )}
            <View style={S.ctaFootnoteRow}>
              <Ionicons name="lock-closed" size={11} color={C.hint} />
              <Text style={S.ctaFootnoteText}>
                {isPaid ? " Secure payment via Razorpay" : " Protected by assisto • No payment needed"}
              </Text>
            </View>
          </View>

        </>)}
      </Animated.View>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   STYLES (Matched to Screenshot)
───────────────────────────────────────────── */
const S = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.50)" },

  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    height: "96%",
    backgroundColor: C.pageBg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: "hidden",
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyT: { color: C.ink, fontSize: 17, fontWeight: "900", marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 999, backgroundColor: C.green },
  emptyBtnT: { color: "#fff", fontWeight: "900", fontSize: 15 },

  /* NAV */
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, height: 60,
    backgroundColor: C.pageBg,
    borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.03)",
  },
  navBackBtn: { flexDirection: "row", alignItems: "center", gap: 10 },
  navBackText: { fontSize: 17, fontWeight: "700", color: C.ink },
  slotChipBooked: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    opacity: 0.7,
  },
  slotText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.ink2,
  },
  slotTextActive: {
    color: "#fff",
  },
  slotTextBooked: {
    color: C.hint,
    fontSize: 12,
  },
  navCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
  },

  /* BANNER */
  bannerWrap: { width: "100%", height: 210, backgroundColor: "#eee" },
  bannerImg: { width: "100%", height: "100%" },
  bannerDefault: { width: "100%", height: "100%", backgroundColor: "#333", alignItems: "center", justifyContent: "center" },
  bannerEmoji: { fontSize: 60 },

  /* TITLE */
  titleSection: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  mainTitle: { fontSize: 26, fontWeight: "800", color: C.ink, lineHeight: 32 },

  /* TOGGLE */
  topToggleSection: { paddingHorizontal: 16, marginTop: 10 },
  toggleCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.greenSoft, borderRadius: 16,
    borderWidth: 1, borderColor: C.greenBorder, padding: 14, gap: 12,
  },
  toggleCardPaused: { backgroundColor: C.amberSoft, borderColor: C.amberSoft },
  toggleIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  toggleLabel: { fontSize: 15, fontWeight: "700", color: C.ink },
  toggleSub: { fontSize: 12, fontWeight: "600", marginTop: 2 },

  /* SECTIONS */
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: { fontSize: 17, fontWeight: "700", color: C.ink, marginBottom: 12 },

  /* CARDS */
  orderCard: {
    backgroundColor: "#fff", borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  detailsCard: {
    backgroundColor: "#fff", borderRadius: 20,
    borderWidth: 1, borderColor: C.border, padding: 20,
  },

  /* ORGANIZER ROW */
  orderOrgRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  orderOrgAvatarFallback: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  orderOrgInitial: { fontSize: 14, fontWeight: "800", color: C.ink },
  orderOrgName: { fontSize: 15, fontWeight: "700", color: C.ink },
  orderOrgSub: { fontSize: 12, color: C.muted, marginTop: 1 },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.greenSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: C.green },

  /* DIVIDERS */
  orderDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.04)", marginVertical: 14 },
  totalDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 14 },

  /* ROWS */
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderRowLabel: { fontSize: 15, color: C.muted, fontWeight: "500" },
  orderRowValue: { fontSize: 15, color: C.ink, fontWeight: "700" },

  /* TAGS */
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  tagChip: { backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tagChipText: { fontSize: 13, fontWeight: "600", color: C.muted },
  detailDesc: { fontSize: 15, color: C.muted, lineHeight: 22 },

  /* POLICIES */
  policyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  policyText: { fontSize: 14, color: C.muted, fontWeight: "500" },

  /* SCHEDULE */
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  scheduleDay: { fontSize: 13, fontWeight: "700", color: C.ink2, width: 40 },
  scheduleLine: { flex: 1, height: 1, backgroundColor: C.sep },
  scheduleTime: { fontSize: 13, fontWeight: "600", color: C.muted },

  /* TRIPLE INFO */
  infoTriple: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  infoTripleItem: { flex: 1, alignItems: "center" },
  infoTripleIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.greenSoft, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  infoTripleLabel: { fontSize: 12, fontWeight: "700", color: C.ink, textAlign: "center" },
  infoTripleSub: { fontSize: 11, color: C.muted, marginTop: 2, fontWeight: "600" },

  /* MAP */
  mapCard: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  mapImg: { width: "100%", height: 150 },
  mapFallback: { height: 150, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", gap: 8 },
  mapTapText: { fontSize: 13, fontWeight: "700", color: C.muted },
  mapFooter: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#fff", gap: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.03)" },
  mapAccentBar: { width: 3, height: 34, borderRadius: 2, backgroundColor: C.green },
  mapVenue: { fontSize: 14, fontWeight: "700", color: C.ink },
  mapCity: { fontSize: 12, color: C.muted, marginTop: 2 },
  mapOpenBtn: { backgroundColor: C.greenSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  mapOpenBtnText: { fontSize: 12, fontWeight: "700", color: C.green },

  /* SUPPORT */
  supportCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, backgroundColor: C.surface },
  supportText: { flex: 1, fontSize: 14, fontWeight: "600", color: C.muted },
  deleteRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 20 },
  deleteText: { fontSize: 13, color: C.hint, fontWeight: "600" },

  /* CTA BAR */
  ctaBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)",
  },
  ctaMainBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    height: 56, borderRadius: 16, backgroundColor: C.green,
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  ctaBtnText: { fontSize: 17, fontWeight: "800", color: "#fff" },
  ctaFootnoteRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, gap: 4 },
  ctaFootnoteText: { fontSize: 12, color: C.hint, fontWeight: "500" },
});