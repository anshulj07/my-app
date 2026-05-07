import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ActivityIndicator, Pressable, ScrollView, Image,
  TouchableOpacity, Platform, StatusBar, UIManager, LayoutAnimation,
  Animated, StyleSheet,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { styles, COLORS } from "./MyBookingScreen.style";
import { apiFetch } from "../../lib/apiFetch";
import CreatedTab, { EventDoc } from "./Tabs/CreatedTab";
import GoingTab from "./Tabs/GoingTab";
import PastTab from "./Tabs/PastTab";
import { useNotifications, NotifItem } from "../../context/NotificationContext";
import NotificationSheet from "./NotificationSheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import PersonBookingSheet from "../ClickPin/PersonBookingSheet";

// ─────────────────────────────────────────────
//  DESIGN TOKENS (for this file only)
// ─────────────────────────────────────────────
const C = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  inputBorder: "#E8E0D5",
  ink:         "#1C1A17",
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
};
const R = { card: 20, input: 14, pill: 999 };

type TabKey = "created" | "going" | "past";

function safeJson(txt: string) {
  try { return JSON.parse(txt); } catch { return null; }
}
function eventStartMs(ev: EventDoc): number {
  if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
  const date = (ev.date ?? "").trim(); const time = (ev.time ?? "").trim();
  if (date && time) { const t = new Date(`${date}T${time}:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  if (date) { const t = new Date(`${date}T12:00:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  return Number.POSITIVE_INFINITY;
}
function eventEndMs(ev: EventDoc): number {
  if (ev.endsAt) { const t = new Date(ev.endsAt).getTime(); if (Number.isFinite(t)) return t; }
  // Fallback: 3 hours after start
  const start = eventStartMs(ev);
  if (Number.isFinite(start)) return start + (3 * 60 * 60 * 1000);
  return Number.POSITIVE_INFINITY;
}

function getEventState(ev: EventDoc): "upcoming" | "ongoing" | "past" {
  const status = String(ev.status || "active").toLowerCase();
  if (status === "ended" || status === "completed") return "past";
  
  const start = eventStartMs(ev);
  const end   = eventEndMs(ev);
  const now   = Date.now();

  if (now > end && end !== Number.POSITIVE_INFINITY) return "past";
  if (now >= start && now <= end) return "ongoing";
  if (now < start) return "upcoming";

  return "upcoming";
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? "1d ago" : `${d}d ago`;
  if (h > 0) return h === 1 ? "1h ago" : `${h}h ago`;
  if (m > 0) return m === 1 ? "1m ago" : `${m}m ago`;
  return "Just now";
}

// ─────────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────────
export default function MyBookingsScreen() {
  const router    = useRouter();
  const { userId } = useAuth();
  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [tab, setTab]               = useState<TabKey>("created");
  const [allCreated, setAllCreated] = useState<EventDoc[]>([]);
  const [goingEvents, setGoingEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr]               = useState<string | null>(null);
  const [admitBusy, setAdmitBusy]   = useState<Record<string, boolean>>({});
  const [showNotifs, setShowNotifs] = useState(false);
  const [toggleBusy, setToggleBusy] = useState<Record<string, boolean>>({});
  const [selectedEventForSheet, setSelectedEventForSheet] = useState<EventDoc | null>(null);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "event" | "service">("all");

  const { notifications, unreadCount, refresh: refreshNotifs, markAsRead, loading: notifsLoading } = useNotifications();

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerLift = useRef(new Animated.Value(10)).current;
  const [tabsW, setTabsW]           = useState(0);
  const indicatorX                  = useRef(new Animated.Value(0)).current;
  const badgeScale                  = useRef(new Animated.Value(1)).current;
  const tabIndex = tab === "created" ? 0 : tab === "going" ? 1 : 2;

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(badgeScale, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.spring(badgeScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [unreadCount]);

  // Derived lists
  const filteredCreated = useMemo(() => {
    let list = allCreated.filter(e => ["upcoming", "ongoing"].includes(getEventState(e)));
    if (filterType === "event")   list = list.filter(e => e.kind !== "service");
    if (filterType === "service") list = list.filter(e => e.kind === "service");
    return list.sort((a, b) => eventStartMs(a) - eventStartMs(b));
  }, [allCreated, filterType]);

  const filteredGoing = useMemo(() => {
    let list = goingEvents.filter(e => getEventState(e) !== "past");
    if (filterType === "event")   list = list.filter(e => e.kind !== "service");
    if (filterType === "service") list = list.filter(e => e.kind === "service");
    return list.sort((a, b) => eventStartMs(a) - eventStartMs(b));
  }, [goingEvents, filterType]);

  const filteredPast = useMemo(() => {
    const pastCreated = allCreated.filter(e => getEventState(e) === "past").map(e => ({ ...e, _role: "created" as const }));
    const pastGoing   = goingEvents.filter(e => getEventState(e) === "past").map(e => ({ ...e, _role: "attended" as const }));
    const seen = new Set<string>();
    let list = [...pastCreated, ...pastGoing]
      .filter(e => { if (seen.has(e._id)) return false; seen.add(e._id); return true; });
    
    if (filterType === "event")   list = list.filter(e => e.kind !== "service");
    if (filterType === "service") list = list.filter(e => e.kind === "service");
    
    return list.sort((a, b) => eventStartMs(b) - eventStartMs(a));
  }, [allCreated, goingEvents, filterType]);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental)
      UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(headerLift, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!tabsW) return;
    Animated.spring(indicatorX, {
      toValue: tabIndex * (tabsW / 3),
      useNativeDriver: true, speed: 18, bounciness: 7,
    }).start();
  }, [tabIndex, tabsW]);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
  }), [EVENT_API_KEY]);

  const load = useCallback(async () => {
    if (!API_BASE) { setErr("Missing API base URL."); setLoading(false); setRefreshing(false); return; }
    if (!userId)   { setErr("Sign in required.");      setLoading(false); setRefreshing(false); return; }
    setErr(null); setLoading(true);
    try {
      const [createdRes, goingRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId)}&limit=500`, { method: "GET", headers }),
        apiFetch(`${API_BASE}/api/bookings/going?clerkUserId=${encodeURIComponent(userId)}`, { method: "GET", headers }),
      ]);
      const createdJson = safeJson(await createdRes.text());
      const goingJson   = safeJson(await goingRes.text());
      if (!createdRes.ok) throw new Error(createdJson?.error || "Failed to fetch events");
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAllCreated(Array.isArray(createdJson?.createdEvents) ? createdJson.createdEvents : []);
      setGoingEvents(Array.isArray(goingJson?.events) ? goingJson.events : []);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [API_BASE, userId, headers]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); refreshNotifs(); }, [load, refreshNotifs]);

  const handleAdmitReject = useCallback(async (item: NotifItem, action: "admit" | "reject") => {
    if (!API_BASE || !userId) return;
    const busyKey = `${item.id}-${action}`;
    setAdmitBusy(m => ({ ...m, [busyKey]: true }));
    try {
      const res = await apiFetch(`${API_BASE}/api/events/admit-request`, {
        method: "POST", headers,
        body: JSON.stringify({ eventId: item.eventId, creatorClerkId: userId, requestClerkUserId: item.userClerkId, action }),
      });
      if (res.ok) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        refreshNotifs();
        if (action === "admit") load();
      }
    } catch {}
    finally { setAdmitBusy(m => { const c = { ...m }; delete c[busyKey]; return c; }); }
  }, [API_BASE, userId, headers, load]);

  const patchServiceEnabled = useCallback(async (ev: EventDoc, next: boolean) => {
    if (!API_BASE || !userId || !ev?._id) return;
    const prev = String(ev.status || "active").toLowerCase();
    const optimistic = next ? "active" : "paused";
    setToggleBusy(m => ({ ...m, [ev._id]: true }));
    setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: optimistic } : x));
    try {
      const res = await apiFetch(`${API_BASE}/api/events/toggle-service`, {
        method: "PATCH", headers,
        body: JSON.stringify({ _id: ev._id, creatorClerkId: userId, enabled: next }),
      });
      const json = safeJson(await res.text().catch(() => ""));
      if (!res.ok) throw new Error(json?.error || "Failed");
      const server = String(json?.status || json?.event?.status || optimistic).toLowerCase();
      setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: server } : x));
    } catch {
      setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: prev } : x));
    } finally {
      setToggleBusy(m => ({ ...m, [ev._id]: false }));
    }
  }, [API_BASE, headers, userId]);

  const endEvent = useCallback(async (ev: EventDoc) => {
    if (!API_BASE || !userId || !ev?._id) return;
    setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: "ended" } : x));
    try {
      await apiFetch(`${API_BASE}/api/events/end-event`, {
        method: "PATCH", headers,
        body: JSON.stringify({ eventId: ev._id, creatorClerkId: userId }),
      });
    } catch {
      setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: "active" } : x));
    }
  }, [API_BASE, headers, userId]);

  const onPressEvent = useCallback((item: EventDoc) => {
    const state = getEventState(item);
    if (state === "past") {
      router.push({
        pathname: "/past-event/[eventId]",
        params: { eventId: item._id }
      });
      return;
    }

    // If coming from "Going" tab, show the booking sheet
    if (tab === "going") {
      setSelectedEventForSheet(item);
      setShowBookingSheet(true);
      return;
    }

    // Default (Created tab) goes to dashboard
    router.push({
      pathname: "/event-interest/[eventId]",
      params: { eventId: item._id, kind: item.kind, title: item.title, emoji: item.emoji || "📍" },
    });
  }, [router, tab]);

  const handleNotifPress = () => {
    setShowNotifs(true);
    markAsRead();
  };

  const TOP_PAD = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 12;

  return (
    <>
    <View style={[S.screen, { paddingTop: TOP_PAD }]}>

      {/* ── HEADER ── */}
      <Animated.View style={[S.header, { opacity: headerFade, transform: [{ translateY: headerLift }] }]}>
        <View style={S.headerInner}>
          {/* Hero icon */}
          <View style={S.heroIcon}>
            <Ionicons name="calendar-outline" size={24} color={C.tealText} />
          </View>

          {/* Title + subtitle */}
          <View style={{ flex: 1 }}>
            <Text style={S.headerTitle}>My Bookings</Text>
            <Text style={S.headerSub}>Created, going & past events</Text>
          </View>

          {/* Bell button */}
          <TouchableOpacity
            onPress={handleNotifPress}
            activeOpacity={0.7}
            style={S.bellBtn}
          >
            <Ionicons
              name={unreadCount > 0 ? "notifications" : "notifications-outline"}
              size={22}
              color={unreadCount > 0 ? C.coral : C.muted}
            />
            {unreadCount > 0 && (
              <Animated.View style={[S.bellBadge, { transform: [{ scale: badgeScale }] }]}>
                <Text style={S.bellBadgeText}>{unreadCount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View
          style={S.tabsWrap}
          onLayout={(e) => setTabsW(e.nativeEvent.layout.width)}
        >
          {tabsW > 0 && (
            <Animated.View style={[S.tabIndicator, { width: tabsW / 3, transform: [{ translateX: indicatorX }] }]} />
          )}
          <TabBtn label="Created" count={filteredCreated.length} active={tab === "created"} onPress={() => setTab("created")} />
          <TabBtn label="Going"   count={filteredGoing.length}   active={tab === "going"}   onPress={() => setTab("going")}   highlight={filteredGoing.length > 0} />
          <TabBtn label="Past"    count={filteredPast.length}    active={tab === "past"}    onPress={() => setTab("past")} />
        </View>

        {/* Sub-Filters (All, Event, Service) */}
        <View style={S.subFilterRow}>
          {[
            { id: "all",     label: "All",     icon: "apps" },
            { id: "event",   label: "Events",  icon: "calendar" },
            { id: "service", label: "Services",icon: "construct" },
          ].map(f => {
            const active = filterType === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setFilterType(f.id as any);
                }}
                activeOpacity={0.7}
                style={[S.subFilterPill, active && S.subFilterPillActive]}
              >
                <Ionicons name={f.icon as any} size={14} color={active ? "#fff" : C.muted} />
                <Text style={[S.subFilterText, active && S.subFilterTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <NotificationSheet
        visible={showNotifs}
        onClose={() => setShowNotifs(false)}
        items={notifications}
        loading={notifsLoading}
        admitBusy={admitBusy}
        onAdmit={item => handleAdmitReject(item, "admit")}
        onReject={item => handleAdmitReject(item, "reject")}
        onMarkRead={markAsRead}
        onPressEvent={eventId => {
          setShowNotifs(false);
          const ev = allCreated.find(e => e._id === eventId) || goingEvents.find(e => e._id === eventId);
          if (ev) onPressEvent(ev);
        }}
      />

      {/* ── CONTENT ── */}
      {loading ? (
        <View style={S.center}>
          <ActivityIndicator color={C.teal} size="large" />
          <Text style={S.loadingText}>Loading your events…</Text>
        </View>
      ) : err ? (
        <View style={S.center}>
          <View style={S.errIcon}><Text style={{ fontSize: 32 }}>😕</Text></View>
          <Text style={S.errText}>{err}</Text>
          <Pressable style={S.retryBtn} onPress={load}>
            <Text style={S.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : tab === "going" ? (
        <GoingTab going={filteredGoing} refreshing={refreshing} onRefresh={onRefresh} onPressEvent={onPressEvent} />
      ) : tab === "past" ? (
        <PastTab past={filteredPast} refreshing={refreshing} onRefresh={onRefresh} onPressEvent={onPressEvent} />
      ) : (
        <CreatedTab
          created={filteredCreated}
          refreshing={refreshing}
          onRefresh={onRefresh}
          toggleBusyById={toggleBusy}
          onToggleServiceEnabled={patchServiceEnabled}
          onPressEvent={onPressEvent}
          onEndEvent={endEvent}
        />
      )}
    </View>

    <PersonBookingSheet
      visible={showBookingSheet}
      onClose={() => setShowBookingSheet(false)}
      person={selectedEventForSheet as any}
    />
    </>
  );
}

// ─────────────────────────────────────────────
//  TAB BUTTON
// ─────────────────────────────────────────────
function TabBtn({ label, count, active, onPress, highlight }: {
  label: string; count: number; active: boolean; onPress: () => void; highlight?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={S.tabBtn}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center" }}>
        <Text style={[S.tabText, active && S.tabTextActive]} numberOfLines={1}>{label}</Text>
        {highlight && !active && (
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.coral }} />
        )}
        {count > 0 && (
          <View style={[S.tabCountPill, active && S.tabCountPillActive]}>
            <Text style={[S.tabCountText, active && S.tabCountTextActive]}>{count}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
//  SCREEN STYLES
// ─────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.card,
    borderBottomWidth: 1.5,
    borderBottomColor: C.cardBorder,
    paddingBottom: 20, // Increased
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // Increased
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18, // Added more space before tabs
  },
  heroIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: C.ink, letterSpacing: -0.4 },
  headerSub:   { fontSize: 13, color: C.muted, fontWeight: "600", marginTop: 2 },

  // Bell
  bellBtn: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  bellBtnActive: { backgroundColor: C.teal, borderColor: C.teal },
  bellBadge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: C.coral,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.card,
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  // Tabs
  tabsWrap: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: R.pill,
    padding: 5,
    backgroundColor: "#F5F0FF",
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    overflow: "hidden",
    marginBottom: 4, // Added space before sub-filters
  },
  tabIndicator: {
    position: "absolute", left: 4, top: 4, bottom: 4,
    borderRadius: R.pill, backgroundColor: C.teal,
    shadowColor: C.teal, shadowOpacity: 0.35,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  tabBtn:      { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: R.pill },
  tabText:     { color: C.muted, fontWeight: "800", fontSize: 13 },
  tabTextActive: { color: "#FFFFFF" },
  tabCountPill: {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: R.pill, paddingHorizontal: 5, paddingVertical: 1,
  },
  tabCountPillActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountText:       { color: C.muted, fontSize: 10, fontWeight: "900" },
  tabCountTextActive: { color: "#fff" },

  // Sub-Filters
  subFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20, // Increased from 16
    paddingHorizontal: 20, // Increased from 18
  },
  subFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Increased gap inside pill
    paddingHorizontal: 16, // Increased
    paddingVertical: 10, // Increased
    borderRadius: 14, // Slightly rounder
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
  },
  subFilterPillActive: {
    backgroundColor: C.teal,
    borderColor: C.teal,
  },
  subFilterText: {
    fontSize: 12,
    fontWeight: "800",
    color: C.muted,
  },
  subFilterTextActive: {
    color: "#fff",
  },

  // Loading / error
  center:      { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  loadingText: { color: C.muted, fontWeight: "700", fontSize: 13, marginTop: 12 },
  errIcon:     {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.coralBg, borderWidth: 1.5, borderColor: C.coral + "44",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  errText:  { color: C.coralText, fontWeight: "800", fontSize: 15, textAlign: "center" },
  retryBtn: {
    marginTop: 16, paddingHorizontal: 28, paddingVertical: 12, borderRadius: R.pill,
    backgroundColor: C.teal,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  retryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
});