// MyBookingsScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Platform,
  StatusBar,
  UIManager,
  LayoutAnimation,
  Animated,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { styles } from "./MyBookingScreen.style";

import CreatedTab, { EventDoc } from "./Tabs/CreatedTab";
import GoingTab from "./Tabs/GoingTab";
import PastTab from "./Tabs/PastTab";

type TabKey = "created" | "going" | "past";

function safeJson(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

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


export default function MyBookingsScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [tab, setTab] = useState<TabKey>("created");

  const [created, setCreated] = useState<EventDoc[]>([]);
  const [goingUpcoming, setGoingUpcoming] = useState<EventDoc[]>([]);
  const [past, setPast] = useState<EventDoc[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [toggleBusy, setToggleBusy] = useState<Record<string, boolean>>({});

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerLift = useRef(new Animated.Value(10)).current;

  const [tabsW, setTabsW] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabIndex = tab === "created" ? 0 : tab === "going" ? 1 : 2;


  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(headerLift, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [headerFade, headerLift]);

  useEffect(() => {
    if (!tabsW) return;
    Animated.spring(indicatorX, {
      toValue: tabIndex * (tabsW / 3),
      useNativeDriver: true,
      speed: 18,
      bounciness: 7,
    }).start();
  }, [tabIndex, tabsW, indicatorX]);

  const headers = useMemo(() => {
    return {
      "Content-Type": "application/json",
      ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
    };
  }, [EVENT_API_KEY]);

  const fetchMyEvents = useCallback(async () => {
    const url = `${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(
      userId || ""
    )}&limit=500`;
    const res = await fetch(url, { method: "GET", headers });
    const txt = await res.text();
    const json = safeJson(txt);
    if (!res.ok) throw new Error(json?.error || json?.detail || "Failed to fetch your events");

    return {
      createdEvents: Array.isArray(json?.createdEvents) ? (json.createdEvents as EventDoc[]) : [],
      goingEvents: Array.isArray(json?.goingEvents) ? (json.goingEvents as EventDoc[]) : [],
      pastEvents: Array.isArray(json?.pastEvents) ? (json.pastEvents as EventDoc[]) : [],
    };
  }, [API_BASE, headers, userId]);

  const fetchGoingEvents = useCallback(async () => {
    const url = `${API_BASE}/api/bookings/going?clerkUserId=${encodeURIComponent(userId || "")}&limit=500`;
    const res = await fetch(url, { method: "GET", headers });
    const txt = await res.text();
    const json = safeJson(txt);
    if (!res.ok) throw new Error(json?.error || json?.detail || "Failed to fetch going events");

    return Array.isArray(json?.goingEvents) ? (json.goingEvents as EventDoc[]) : [];
  }, [API_BASE, headers, userId]);

  const load = useCallback(async () => {
    if (!API_BASE) {
      setErr("Missing API base URL (extra.apiBaseUrl).");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!userId) {
      setErr("You must be signed in.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      const [createdResp, goingResp] = await Promise.all([fetchMyEvents(), fetchGoingEvents()]);

      const createdSorted = createdResp.createdEvents
        .slice()
        .sort((a, b) => eventStartMs(a) - eventStartMs(b));

      const now = Date.now();

      const goingUpcomingOnly = goingResp
        .filter((e) => eventStartMs(e) >= now)
        .sort((a, b) => eventStartMs(a) - eventStartMs(b));

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      setCreated(createdSorted);
      setGoingUpcoming(goingUpcomingOnly);

      setPast(
        (createdResp.pastEvents || [])
          .slice()
          .sort((a, b) => eventStartMs(b) - eventStartMs(a))
      );
    } catch (e: any) {
      setErr(e?.message || "Something went wrong while loading events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE, userId, fetchMyEvents, fetchGoingEvents]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  // ✅ Toggle API (Created -> Service only)
  const patchServiceEnabled = useCallback(
    async (ev: EventDoc, next: boolean) => {
      if (!API_BASE || !userId) return;
      if (!ev?._id) return;

      const prevStatus = String(ev.status || "active").toLowerCase();
      const optimisticStatus = next ? "active" : "paused";

      setToggleBusy((m) => ({ ...m, [ev._id]: true }));
      setCreated((prev) => prev.map((x) => (x._id === ev._id ? { ...x, status: optimisticStatus } : x)));

      try {
        const res = await fetch(`${API_BASE}/api/events/toggle-service`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            _id: ev._id,
            creatorClerkId: userId,
            enabled: next,
          }),
        });

        const txt = await res.text().catch(() => "");
        const json = safeJson(txt);

        if (!res.ok) throw new Error(json?.error || json?.detail || txt || "Failed to toggle service");

        const serverStatus = String(json?.status || json?.event?.status || optimisticStatus).toLowerCase();
        setCreated((prev) => prev.map((x) => (x._id === ev._id ? { ...x, status: serverStatus } : x)));
      } catch {
        setCreated((prev) => prev.map((x) => (x._id === ev._id ? { ...x, status: prevStatus } : x)));
      } finally {
        setToggleBusy((m) => ({ ...m, [ev._id]: false }));
      }
    },
    [API_BASE, headers, userId]
  );

  const TOP_PAD = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 40;

  const onPressEvent = useCallback(
    (item: EventDoc) => {
      router.push({
        pathname: "/event-interest/[eventId]",
        params: {
          eventId: item._id,
          kind: item.kind,
          title: item.title,
          emoji: item.emoji || "📍",
        },
      });
    },
    [router]
  );

  return (
    <View style={[styles.screen, { paddingTop: TOP_PAD }]}>
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerLift }] }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.title}>My Bookings</Text>
            <Text style={styles.subTitle}>Manage your created events & services</Text>
          </View>
        </View>

        <View style={styles.tabsWrap} onLayout={(e) => setTabsW(e.nativeEvent.layout.width)}>
          {tabsW > 0 && (
            <Animated.View style={[styles.tabIndicator, { width: tabsW / 3, transform: [{ translateX: indicatorX }] }]} />
          )}
          <Tab label="Created" count={created.length} active={tab === "created"} onPress={() => setTab("created")} />
          <Tab label="Going" count={goingUpcoming.length} active={tab === "going"} onPress={() => setTab("going")} />
          <Tab label="Past" count={past.length} active={tab === "past"} onPress={() => setTab("past")} />
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : err ? (
        <View style={styles.center}>
          <Text style={styles.err}>{err}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      ) : tab === "created" ? (
        <CreatedTab
          created={created}
          refreshing={refreshing}
          onRefresh={onRefresh}
          toggleBusyById={toggleBusy}
          onToggleServiceEnabled={patchServiceEnabled}
          onPressEvent={onPressEvent}
        />
      ) : tab === "going" ? (
        <GoingTab going={goingUpcoming} refreshing={refreshing} onRefresh={onRefresh} onPressEvent={onPressEvent} />
      ) : (
        <PastTab past={past} refreshing={refreshing} onRefresh={onRefresh} onPressEvent={onPressEvent} />
      )}
    </View>
  );
}

function Tab({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn} android_ripple={{ color: "rgba(255,255,255,0.08)" }}>
      <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
    </Pressable>
  );
}
