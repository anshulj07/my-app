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
  SectionList,
  SectionListData,
  Switch,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { styles } from "./MyBookingScreen.style";

type EventKind = "free" | "paid" | "service";

type EventDoc = {
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

  // optional fields if you already store them
  attendance?: number | null; // max people
  attendees?: string[];       // array of clerk userIds

  location?: { city?: string; admin1Code?: string; countryCode?: string };
};

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

function fmtWhen(ev: EventDoc) {
  const ms = eventStartMs(ev);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "No time set";
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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
  return `$${((ev.priceCents ?? 0) / 100).toFixed(2)}`;
}

function kindLabel(ev: EventDoc) {
  if (ev.kind === "service") return "Service";
  if (ev.kind === "paid") return "Paid event";
  return "Free event";
}

function statusLabel(ev: EventDoc) {
  const s = String(ev.status || "active").toLowerCase();
  return s === "paused" ? "Paused" : "Active";
}

function isEnabled(ev: EventDoc) {
  return String(ev.status || "active").toLowerCase() !== "paused";
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
    const url = `${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId || "")}&limit=500`;
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
      const { createdEvents } = await fetchMyEvents();
      const sorted = createdEvents.slice().sort((a, b) => eventStartMs(a) - eventStartMs(b));

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCreated(sorted);

      setGoingUpcoming([]);
      setPast([]);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong while loading events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE, userId, fetchMyEvents]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const nowMs = Date.now();

  const sections = useMemo(() => {
    if (tab === "created") {
      const upcoming = created
        .filter((e) => eventStartMs(e) >= nowMs)
        .sort((a, b) => eventStartMs(a) - eventStartMs(b));

      const pastCreated = created
        .filter((e) => eventStartMs(e) < nowMs)
        .sort((a, b) => eventStartMs(b) - eventStartMs(a));

      const out: Array<{ title: string; hint: string; data: EventDoc[] }> = [];
      out.push({ title: "Upcoming", hint: "Events you created that haven’t started", data: upcoming });
      out.push({ title: "Past", hint: "Events you created earlier", data: pastCreated });

      return out.filter((s) => s.data.length > 0);
    }

    const list = tab === "going" ? goingUpcoming : past;
    if (list.length === 0) return [];
    return [{ title: tab === "going" ? "Going" : "Past", hint: "", data: list }];
  }, [tab, created, goingUpcoming, past, nowMs]);

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
          <Tab label="Going" count={0} active={tab === "going"} onPress={() => setTab("going")} />
          <Tab label="Past" count={0} active={tab === "past"} onPress={() => setTab("past")} />
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
      ) : (
        <SectionList
          sections={sections as SectionListData<EventDoc>[]}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptySub}>Explore events to get started.</Text>
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
              showToggle={tab === "created" && item.kind === "service"}
              toggleBusy={!!toggleBusy[item._id]}
              onToggle={(next) => patchServiceEnabled(item, next)}
              onPress={() => {
                router.push({
                  pathname: "/event-interest/[eventId]",
                  params: {
                    eventId: item._id,
                    kind: item.kind,
                    title: item.title,
                    emoji: item.emoji || "📍",
                  },
                });
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function Tab({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tabBtn} android_ripple={{ color: "rgba(255,255,255,0.08)" }}>
      <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
    </Pressable>
  );
}

function EventCard({
  e,
  index,
  showToggle,
  toggleBusy,
  onToggle,
  onPress,
}: {
  e: EventDoc;
  index: number;
  showToggle: boolean;
  toggleBusy: boolean;
  onToggle: (next: boolean) => void;
  onPress: () => void;
}) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
    ]).start();
  }, [a, y, index]);

  const enabled = isEnabled(e);
  const statusTxt = statusLabel(e);

  const actionLabel = e.kind === "service" ? "View bookings" : "View interested people";
  const actionIcon = e.kind === "service" ? "calendar" : "people";

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
        style={({ pressed }) => [
          styles.card,
          {
            borderWidth: 1,
            borderColor: pressed ? "rgba(10,132,255,0.65)" : "rgba(255,255,255,0.10)",
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        {/* TOP ROW */}
        <View style={styles.cardTop}>
          <View style={styles.emojiPill}>
            <Text style={styles.emojiTxt}>{e.emoji || "📍"}</Text>
          </View>

          <View style={{ flex: 1 }}>
            {/* Title row + chevron */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {e.title}
              </Text>

              {/* ✅ Click affordance */}
              <Ionicons
                name="chevron-forward"
                size={18}
                color="rgba(226,232,240,0.80)"
                style={{ marginLeft: "auto" }}
              />
            </View>

            {/* Badges */}
            <View style={styles.badgesRow}>
              <View style={[styles.badge, e.kind === "service" ? styles.badgeService : styles.badgeFree]}>
                <Ionicons
                  name={e.kind === "service" ? "sparkles" : e.kind === "paid" ? "card" : "leaf"}
                  size={12}
                  color="#fff"
                />
                <Text style={styles.badgeText}>{kindLabel(e)}</Text>
              </View>

              <View style={[styles.badge, enabled ? styles.badgeActive : styles.badgePaused]}>
                <Ionicons name={enabled ? "checkmark" : "pause"} size={12} color="#fff" />
                <Text style={styles.badgeText}>{statusTxt}</Text>
              </View>
            </View>
          </View>

          {/* Right column: price + toggle */}
          <View style={styles.rightCol}>
            <View style={styles.pricePill}>
              <Text style={styles.priceTxt}>{priceLabel(e)}</Text>
            </View>

            {showToggle ? (
              <View style={styles.toggleWrap}>
                {toggleBusy ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Switch
                    value={enabled}
                    onValueChange={onToggle}
                    trackColor={{
                      false: "rgba(148,163,184,0.22)",
                      true: "rgba(10,132,255,0.55)",
                    }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(148,163,184,0.22)"
                  />
                )}
              </View>
            ) : null}
          </View>
        </View>

        {/* META GRID */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>When</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {fmtWhen(e)}
            </Text>
          </View>

          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Where</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {fmtWhere(e)}
            </Text>
          </View>
        </View>

        {/* ✅ Bottom action bar (looks like a button) */}
        <View
          style={{
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >

          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(0, 0, 0, 0.95)", fontWeight: "900", fontSize: 13 }}>
              {actionLabel}
            </Text>
            <Text style={{ color: "rgba(0, 0, 0, 0.95)", fontSize: 12, marginTop: 2 }}>
              Opens details & list
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={16} color="rgba(0, 0, 0, 0.85)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}
