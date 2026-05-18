// components/MyBookings/MyBookingsScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ActivityIndicator, ScrollView,
  TouchableOpacity, StatusBar, Animated, StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { apiFetch } from "../../lib/apiFetch";
import CreatedTab, { EventDoc } from "./Tabs/CreatedTab";
import GoingTab from "./Tabs/GoingTab";
import PastTab from "./Tabs/PastTab";
import HistorySummaryModal from "../profile/HistorySummaryModal";
import { useNotifications } from "../../context/NotificationContext";
import NotificationSheet from "./NotificationSheet";
import Ionicons from "@expo/vector-icons/Ionicons";

const C = {
  bg:          "#F8FAFC",
  white:       "#FFFFFF",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  ink:         "#111827",
  muted:       "#6B7280",
  accent:      "#6C63FF",
  accentLight: "#EEF2FF",
  red:         "#EF4444",
};

type TabKey = "created" | "going" | "past";

function eventStartMs(ev: EventDoc): number {
  if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
  const date = (ev.date ?? "").trim(); const time = (ev.time ?? "").trim();
  // Using a more robust parser that doesn't force UTC
  if (date && time) { const t = new Date(`${date} ${time}`).getTime(); if (Number.isFinite(t)) return t; }
  if (date) { const t = new Date(date).getTime(); if (Number.isFinite(t)) return t; }
  return Number.POSITIVE_INFINITY;
}

function getEventState(ev: EventDoc): "upcoming" | "ongoing" | "past" {
  const status = String(ev.status || "active").toLowerCase();
  if (status === "ended" || status === "completed" || status === "past") return "past";
  if (status === "live" || status === "ongoing") return "ongoing";
  
  const start = eventStartMs(ev);
  if (!Number.isFinite(start) || start === Number.POSITIVE_INFINITY) return "upcoming";
  
  const now = Date.now();
  const endTs = ev.endsAt ? new Date(ev.endsAt).getTime() : start + (4 * 3600000); // Default 4 hours duration
  
  if (now > endTs) return "past";
  if (now >= start && now <= endTs) return "ongoing";
  
  return "upcoming";
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const onboardingComplete = user?.unsafeMetadata?.onboardingComplete === true;
  const insets = useSafeAreaInsets();
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey;

  const [tab, setTab] = useState<TabKey>("created");
  const [allCreated, setAllCreated] = useState<EventDoc[]>([]);
  const [goingEvents, setGoingEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "event" | "service">("all");
  const [showNotifs, setShowNotifs] = useState(false);
  const [admitBusy, setAdmitBusy] = useState<Record<string, boolean>>({});
  
  const { notifications, unreadCount, refresh: refreshNotifs, markAsRead, loading: notifsLoading } = useNotifications();

  const [tabsW, setTabsW] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabIndex = tab === "created" ? 0 : tab === "going" ? 1 : 2;

  useEffect(() => {
    if (!tabsW) return;
    Animated.spring(indicatorX, {
      toValue: tabIndex * (tabsW / 3),
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [tabIndex, tabsW]);

  const load = useCallback(async () => {
    console.log("[MyBookingsScreen] load called. API_BASE:", API_BASE, "userId:", userId, "onboardingComplete:", onboardingComplete);
    if (!API_BASE || !userId) {
      console.log("[MyBookingsScreen] load aborted: missing API_BASE or userId");
      return;
    }
    setLoading(true);
    try {
      const headers = { "Content-Type": "application/json", "x-api-key": EVENT_API_KEY || "" };
      console.log("[MyBookingsScreen] Fetching bookings from:", `${API_BASE}/api/bookings/...`);
      const [cRes, gRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/bookings/my-bookings?clerkUserId=${userId}`, { headers }),
        apiFetch(`${API_BASE}/api/bookings/going?clerkUserId=${userId}`, { headers }),
      ]);
      console.log("[MyBookingsScreen] Fetch responses received. my-bookings status:", cRes.status, "going status:", gRes.status);
      
      const cJson = await cRes.json();
      const gJson = await gRes.json();
      
      setAllCreated(cJson.createdEvents || []);
      setGoingEvents(gJson.events || []);
    } catch (e) {
      console.error("[MyBookingsScreen] Load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE, userId, EVENT_API_KEY]);

  useEffect(() => { load(); }, [load]);
  const [summaryModal, setSummaryModal] = useState<{ visible: boolean; event: EventDoc | null }>({ visible: false, event: null });

  const onRefresh = () => { setRefreshing(true); load(); refreshNotifs(); };

  const handleEventPress = (ev: EventDoc) => {
    const isPast = getEventState(ev) === "past";
    // Card clicks ALWAYS open the premium detail page
    router.push({
      pathname: "/newApp/event-detail",
      params: { 
        eventId: ev._id, 
        title: ev.title, 
        emoji: ev.emoji,
        isPast: isPast ? "true" : "false"
      }
    });
  };

  const handleSummaryPress = (ev: EventDoc) => {
    // Specifically open the Summary Modal
    setSummaryModal({ visible: true, event: ev });
  };

  const handleManagePress = (ev: EventDoc) => {
    // For created tab: Manage button opens dashboard
    router.push({
      pathname: "/event-interest/[eventId]",
      params: { eventId: ev._id, kind: ev.kind, title: ev.title, emoji: ev.emoji || "📍" },
    });
  };

  const handleAdmitNotif = async (item: any) => {
    if (!API_BASE || !userId) return;
    const key = `${item.id}-admit`;
    setAdmitBusy(prev => ({ ...prev, [key]: true }));
    try {
      const res = await apiFetch(`${API_BASE}/api/events/admit-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": EVENT_API_KEY || "" },
        body: JSON.stringify({
          eventId: item.eventId,
          creatorClerkId: userId,
          requestClerkUserId: item.userClerkId,
          action: "admit",
        }),
      });
      if (res.ok) {
        refreshNotifs();
        load();
      }
    } catch (e) {
      console.log("Admit error", e);
    } finally {
      setAdmitBusy(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRejectNotif = async (item: any) => {
    if (!API_BASE || !userId) return;
    const key = `${item.id}-reject`;
    setAdmitBusy(prev => ({ ...prev, [key]: true }));
    try {
      const res = await apiFetch(`${API_BASE}/api/events/admit-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": EVENT_API_KEY || "" },
        body: JSON.stringify({
          eventId: item.eventId,
          creatorClerkId: userId,
          requestClerkUserId: item.userClerkId,
          action: "reject",
        }),
      });
      if (res.ok) {
        refreshNotifs();
      }
    } catch (e) {
      console.log("Reject error", e);
    } finally {
      setAdmitBusy(prev => ({ ...prev, [key]: false }));
    }
  };

  const handlePressNotifEvent = (eventId: string) => {
    router.push({
      pathname: "/newApp/event-detail",
      params: { eventId }
    });
  };

  const handlePressUser = (clerkUserId: string) => {
    router.push({
      pathname: "/profile/[clerkUserId]",
      params: { clerkUserId }
    });
  };

  const filteredCreated = useMemo(() => {
    let list = allCreated.filter(e => getEventState(e) !== "past");
    if (filterType === "event") list = list.filter(e => e.kind !== "service");
    if (filterType === "service") list = list.filter(e => e.kind === "service");
    return list;
  }, [allCreated, filterType]);

  const filteredGoing = useMemo(() => {
    let list = goingEvents.filter(e => getEventState(e) !== "past");
    if (filterType === "event") list = list.filter(e => e.kind !== "service");
    if (filterType === "service") list = list.filter(e => e.kind === "service");
    return list;
  }, [goingEvents, filterType]);

  const filteredPast = useMemo(() => {
    let list = [...allCreated, ...goingEvents].filter(e => getEventState(e) === "past");
    if (filterType === "event") list = list.filter(e => e.kind !== "service");
    if (filterType === "service") list = list.filter(e => e.kind === "service");
    return list;
  }, [allCreated, goingEvents, filterType]);

  const TOP = insets.top + 20;

  return (
    <View style={S.screen}>
      <StatusBar barStyle="dark-content" />
      
      {/* ── HEADER ── */}
      <View style={[S.header, { paddingTop: TOP }]}>
        <View style={S.headerInner}>
          <View style={S.headerIconBox}>
            <Ionicons name="calendar" size={24} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.headerTitle}>My Bookings</Text>
            <Text style={S.headerSub}>Manage your nomad journey</Text>
          </View>
          <TouchableOpacity style={S.iconBtn} onPress={() => setShowNotifs(true)}>
            <Ionicons name="notifications-outline" size={22} color={C.ink} />
            {unreadCount > 0 && <View style={S.notifBadge} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── TABS ── */}
      <View style={S.tabsContainer} onLayout={e => setTabsW(e.nativeEvent.layout.width)}>
        {tabsW > 0 && (
          <Animated.View style={[S.tabIndicator, { width: tabsW / 3, transform: [{ translateX: indicatorX }] }]} />
        )}
        <TabBtn label="Created" active={tab === "created"} onPress={() => setTab("created")} count={filteredCreated.length} />
        <TabBtn label="Going" active={tab === "going"} onPress={() => setTab("going")} count={filteredGoing.length} />
        <TabBtn label="Past" active={tab === "past"} onPress={() => setTab("past")} count={filteredPast.length} />
      </View>

      {/* ── FILTERS ── */}
      <View style={S.filterRow}>
        <FilterPill label="All" icon="grid" active={filterType === "all"} onPress={() => setFilterType("all")} />
        <FilterPill label="Events" icon="calendar-outline" active={filterType === "event"} onPress={() => setFilterType("event")} />
        <FilterPill label="Services" icon="construct-outline" active={filterType === "service"} onPress={() => setFilterType("service")} />
      </View>

      {/* ── CONTENT ── */}
      <View style={{ flex: 1, marginTop: 10 }}>
        {loading ? (
          <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 50 }} />
        ) : tab === "created" ? (
          <CreatedTab 
            created={filteredCreated} 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            onPressEvent={handleEventPress} 
            onManageEvent={handleManagePress}
          />
        ) : tab === "going" ? (
          <GoingTab going={filteredGoing} refreshing={refreshing} onRefresh={onRefresh} onPressEvent={handleEventPress} />
        ) : (
          <PastTab 
            past={filteredPast} 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            onPressEvent={handleEventPress} 
            onSummaryEvent={handleSummaryPress}
          />
        )}
      </View>

      <NotificationSheet
        visible={showNotifs}
        onClose={() => setShowNotifs(false)}
        items={notifications}
        loading={notifsLoading}
        onMarkRead={markAsRead}
        admitBusy={admitBusy}
        onAdmit={handleAdmitNotif}
        onReject={handleRejectNotif}
        onPressEvent={handlePressNotifEvent}
        onPressUser={handlePressUser}
      />

      <HistorySummaryModal 
        visible={summaryModal.visible} 
        onClose={() => setSummaryModal({ ...summaryModal, visible: false })} 
        event={summaryModal.event} 
      />
    </View>
  );
}

function TabBtn({ label, active, onPress, count }: any) {
  return (
    <TouchableOpacity style={S.tabBtn} onPress={onPress}>
      <Text style={[S.tabText, active && S.tabTextActive]}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={[S.countBadge, active && S.countBadgeActive]}>
          <Text style={[S.countText, active && S.countTextActive]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function FilterPill({ label, icon, active, onPress }: any) {
  return (
    <TouchableOpacity style={[S.filterPill, active && S.filterPillActive]} onPress={onPress}>
      <Ionicons name={icon} size={14} color={active ? "#fff" : C.muted} />
      <Text style={[S.filterPillText, active && S.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.white, paddingBottom: 15 },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 15, paddingHorizontal: 20 },
  headerIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: C.ink },
  headerSub: { fontSize: 13, color: C.muted, fontWeight: "500", marginTop: 2 },

  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  notifBadge: { position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: C.red, borderWidth: 1.5, borderColor: C.white },

  tabsContainer: {
    flexDirection: "row", marginHorizontal: 20, marginTop: 25,
    backgroundColor: "#F1F5F9", borderRadius: 14, padding: 4, position: "relative",
  },
  tabIndicator: {
    position: "absolute", top: 4, left: 4, bottom: 4,
    backgroundColor: C.white, borderRadius: 10,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  tabBtn: { flex: 1, height: 38, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  tabText: { fontSize: 13, fontWeight: "700", color: C.muted },
  tabTextActive: { color: C.accent },
  countBadge: { backgroundColor: "#E2E8F0", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  countBadgeActive: { backgroundColor: C.accentLight },
  countText: { fontSize: 10, fontWeight: "800", color: C.muted },
  countTextActive: { color: C.accent },

  filterRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 20, gap: 10 },
  filterPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
  },
  filterPillActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterPillText: { fontSize: 12, fontWeight: "700", color: C.muted },
  filterPillTextActive: { color: C.white },
});