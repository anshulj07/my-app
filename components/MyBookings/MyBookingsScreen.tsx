import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
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
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";

type EventKind = "free" | "service";
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
  location?: { city?: string; admin1Code?: string; countryCode?: string };
};

type TabKey = "created" | "going" | "past";

const FONT = Platform.select({
  ios: {
    regular: "AvenirNext-Regular",
    medium: "AvenirNext-Medium",
    demi: "AvenirNext-DemiBold",
    bold: "AvenirNext-Bold",
    heavy: "AvenirNext-Heavy",
  },
  android: {
    regular: "sans-serif",
    medium: "sans-serif-medium",
    demi: "sans-serif-medium",
    bold: "sans-serif-bold",
    heavy: "sans-serif-black",
  },
  default: {
    regular: "System",
    medium: "System",
    demi: "System",
    bold: "System",
    heavy: "System",
  },
});

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
  if (ev.kind === "service") return `$${((ev.priceCents ?? 0) / 100).toFixed(2)}`;
  return "FREE";
}

function kindLabel(ev: EventDoc) {
  return ev.kind === "service" ? "Service" : "Free event";
}

export default function MyBookingsScreen() {
  const { userId } = useAuth();
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [tab, setTab] = useState<TabKey>("created");
  const [created, setCreated] = useState<EventDoc[]>([]);
  const [goingUpcoming, setGoingUpcoming] = useState<EventDoc[]>([]); // placeholder
  const [past, setPast] = useState<EventDoc[]>([]); // placeholder

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

      // placeholders until you implement bookings
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
      const upcoming = created.filter((e) => eventStartMs(e) >= nowMs).sort((a, b) => eventStartMs(a) - eventStartMs(b));
      const pastCreated = created.filter((e) => eventStartMs(e) < nowMs).sort((a, b) => eventStartMs(b) - eventStartMs(a));

      const out: Array<{ title: string; hint: string; data: EventDoc[] }> = [];
      out.push({ title: "Upcoming", hint: "Events you created that haven’t started", data: upcoming });
      out.push({ title: "Past", hint: "Events you created earlier", data: pastCreated });
      return out.filter((s) => s.data.length > 0);
    }

    const list = tab === "going" ? goingUpcoming : past;
    if (list.length === 0) return [];
    return [{ title: tab === "going" ? "Going" : "Past", hint: "", data: list }];
  }, [tab, created, goingUpcoming, past, nowMs]);

  const counts = useMemo(() => {
    if (tab === "created") {
      const upcoming = created.filter((e) => eventStartMs(e) >= nowMs).length;
      const pastCreated = created.filter((e) => eventStartMs(e) < nowMs).length;
      return { createdTotal: created.length, upcoming, pastCreated };
    }
    return { createdTotal: created.length, upcoming: 0, pastCreated: 0 };
  }, [tab, created, nowMs]);

  const TOP_PAD = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 40;

  return (
    <View style={[styles.screen, { paddingTop: TOP_PAD }]}>
      {/* background blobs */}

      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerLift }] }]}>
        <Text style={styles.title}>My Bookings</Text>

        {/* <View style={styles.statsRow}>
          <Stat label="Created" value={counts.createdTotal} />
          <Stat label="Upcoming" value={counts.upcoming} />
          <Stat label="Past" value={counts.pastCreated} />
        </View> */}

        <View style={styles.tabsWrap} onLayout={(e) => setTabsW(e.nativeEvent.layout.width)}>
          {tabsW > 0 && (
            <Animated.View
              style={[
                styles.tabIndicator,
                { width: tabsW / 3, transform: [{ translateX: indicatorX }] },
              ]}
            />
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {!!section.hint && <Text style={styles.sectionHint}>{section.hint}</Text>}
            </View>
          )}
          renderItem={({ item, index }) => <EventCard e={item} index={index} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Tab({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.tabBtn}
      android_ripple={{ color: "rgba(255,255,255,0.08)" }}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
    </Pressable>
  );
}

function EventCard({ e, index }: { e: EventDoc; index: number }) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
    ]).start();
  }, [a, y, index]);

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
      <Pressable style={styles.card} android_ripple={{ color: "rgba(255,255,255,0.06)" }}>
        <View style={styles.cardTop}>
          <View style={styles.emojiPill}>
            <Text style={styles.emojiTxt}>{e.emoji || "📍"}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {e.title}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {kindLabel(e)}
            </Text>
          </View>

          <View style={styles.pricePill}>
            <Text style={styles.priceTxt}>{priceLabel(e)}</Text>
          </View>
        </View>

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

        {/* {!!e.description?.trim() && (
          <View style={styles.descWrap}>
            <Text style={styles.descLabel}>About</Text>
            <Text style={styles.descTxt} numberOfLines={3}>
              {e.description.trim()}
            </Text>
          </View>
        )} */}

        {/* <View style={styles.footerRow}>
          <View style={styles.dot} />
          <Text style={styles.footerHint} numberOfLines={1}>
            Tap for details (coming next)
          </Text>
        </View> */}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: "#F7F8FC",
    },
  
    header: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 14,
    },
    title: {
      fontSize: 30,
      color: "#0F172A",
      fontFamily: FONT.heavy,
      letterSpacing: -0.4,
    },
  
    statsRow: {
      marginTop: 12,
      flexDirection: "row",
      gap: 10,
    },
    stat: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E6EAF2",
      shadowColor: "#0B1220",
      shadowOpacity: 0.04,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 10 },
      elevation: 1,
    },
    statValue: {
      color: "#0F172A",
      fontSize: 18,
      fontFamily: FONT.bold,
      letterSpacing: -0.2,
    },
    statLabel: {
      marginTop: 4,
      color: "#64748B",
      fontFamily: FONT.medium,
      fontSize: 12,
    },
  
    tabsWrap: {
      marginTop: 12,
      flexDirection: "row",
      borderRadius: 18,
      padding: 6,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E6EAF2",
      overflow: "hidden",
      shadowColor: "#0B1220",
      shadowOpacity: 0.03,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 1,
    },
    tabIndicator: {
      position: "absolute",
      left: 6,
      top: 6,
      bottom: 6,
      borderRadius: 14,
      backgroundColor: "#F1F5FF",
      borderWidth: 1,
      borderColor: "#D9E2FF",
    },
    tabBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      gap: 3,
    },
    tabText: {
      color: "#475569",
      fontFamily: FONT.demi,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    tabTextActive: {
      color: "#0F172A",
    },
    tabCount: {
      color: "#94A3B8",
      fontFamily: FONT.bold,
      fontSize: 11,
    },
    tabCountActive: {
      color: "#0F172A",
    },
  
    list: {
      paddingHorizontal: 18,
      paddingBottom: 18,
    },
  
    sectionHeader: {
      marginTop: 10,
      marginBottom: 8,
    },
    sectionTitle: {
      color: "#0F172A",
      fontSize: 16,
      fontFamily: FONT.bold,
      letterSpacing: -0.2,
    },
    sectionHint: {
      marginTop: 3,
      color: "#64748B",
      fontFamily: FONT.regular,
      fontSize: 12,
    },
  
    card: {
      borderRadius: 20,
      padding: 14,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E6EAF2",
      shadowColor: "#0B1220",
      shadowOpacity: 0.05,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 12 },
      elevation: 1,
    },
  
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    emojiPill: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F1F5FF",
      borderWidth: 1,
      borderColor: "#D9E2FF",
    },
    emojiTxt: {
      fontSize: 20,
    },
    cardTitle: {
      color: "#0F172A",
      fontFamily: FONT.bold,
      fontSize: 15,
      letterSpacing: -0.15,
    },
    cardSubtitle: {
      marginTop: 2,
      color: "#64748B",
      fontFamily: FONT.medium,
      fontSize: 12,
    },
    pricePill: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "#0F172A",
      borderWidth: 1,
      borderColor: "#0F172A",
    },
    priceTxt: {
      color: "#FFFFFF",
      fontFamily: FONT.bold,
      fontSize: 12,
      letterSpacing: 0.2,
    },
  
    metaGrid: {
      marginTop: 12,
      flexDirection: "row",
      gap: 10,
    },
    metaCell: {
      flex: 1,
      padding: 10,
      borderRadius: 14,
      backgroundColor: "#F8FAFC",
      borderWidth: 1,
      borderColor: "#E6EAF2",
    },
    metaLabel: {
      color: "#94A3B8",
      fontFamily: FONT.medium,
      fontSize: 11,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    metaValue: {
      marginTop: 6,
      color: "#0F172A",
      fontFamily: FONT.demi,
      fontSize: 12,
    },
  
    descWrap: {
      marginTop: 12,
      padding: 10,
      borderRadius: 14,
      backgroundColor: "#F8FAFC",
      borderWidth: 1,
      borderColor: "#E6EAF2",
    },
    descLabel: {
      color: "#94A3B8",
      fontFamily: FONT.medium,
      fontSize: 11,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    descTxt: {
      marginTop: 6,
      color: "#334155",
      fontFamily: FONT.regular,
      fontSize: 13,
      lineHeight: 18,
    },
  
    footerRow: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 999,
      backgroundColor: "#CBD5E1",
    },
    footerHint: {
      color: "#94A3B8",
      fontFamily: FONT.medium,
      fontSize: 12,
    },
  
    empty: {
      marginTop: 10,
      padding: 16,
      borderRadius: 18,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E6EAF2",
      shadowColor: "#0B1220",
      shadowOpacity: 0.04,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 10 },
      elevation: 1,
    },
    emptyTitle: {
      color: "#0F172A",
      fontFamily: FONT.bold,
      fontSize: 16,
    },
    emptySub: {
      marginTop: 6,
      color: "#64748B",
      fontFamily: FONT.regular,
      fontSize: 13,
      lineHeight: 18,
    },
  
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 16,
    },
    muted: { color: "#64748B", fontFamily: FONT.medium },
    err: { color: "#DC2626", fontFamily: FONT.bold, textAlign: "center" },
    retryBtn: {
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: "#0F172A",
      borderWidth: 1,
      borderColor: "#0F172A",
    },
    retryTxt: { color: "#FFFFFF", fontFamily: FONT.bold },
  });
  