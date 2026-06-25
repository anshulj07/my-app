// app/newApp/home.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TouchableOpacity, Text, StyleSheet, Platform,
  Modal, View, Pressable, Animated, Dimensions
} from "react-native";
import * as Location from "expo-location";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useAuth } from "@clerk/clerk-expo";

import MapView from "../../components/Map/MapView";
import type { EventPin } from "../../components/Map/MapView";
import MapSearchHeader from "../../components/SearchHeaderHomeScreen/MapSearchHeader";
import ModalizeEventSheet from "../../components/AddEventModal/AddEvent";
import EventsListModal from "../../components/List/EventsListModal";
import EditEventModal from "../../components/EditEventModal/EditEvent";

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#0F0F0F",
  card: "#1A1A1A",
  cardBorder: "#2A2A2A",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.10)",
  inputBg: "#141414",
  inputBorder: "#2C2C2C",
  ink: "#F5F5F5",
  muted: "#888888",
  hint: "#444444",

  // Green accent
  green: "#00E676",
  greenDim: "rgba(0,230,118,0.12)",
  greenGlow: "rgba(0,230,118,0.25)",
  greenText: "#00E676",

  // Purple accent (Standardized to Indigo)
  purple: "#6366F1",
  purpleDim: "#EEF2FF",
  purpleGlow: "rgba(99,102,241,0.15)",
  purpleText: "#4F46E5",


  // Amber for chat
  amber: "#FFB300",
  amberDim: "rgba(255,179,0,0.12)",

  white: "#FFFFFF",
  overlay: "rgba(0,0,0,0.75)",
};

// ─── Helpers (unchanged) ──────────────────────────────────────────────────────
function toNumber(v: any): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function normalizeEvent(e: any): EventPin | null {
  const lat = toNumber(e?.location?.lat ?? e?.lat);
  const lng = toNumber(e?.location?.lng ?? e?.lng);
  if (lat == null || lng == null) return null;
  const rawId = e?._id ?? e?.id ?? e?.eventId ?? "";
  const _id =
    typeof rawId === "string" && rawId.trim() ? rawId.trim()
      : rawId && typeof rawId === "object" && (rawId.$oid || rawId.oid)
        ? String(rawId.$oid || rawId.oid)
        : `${lat}:${lng}:${String(e?.title ?? "")}`;

  return {
    ...(e || {}),
    _id,
    title: e?.title ?? "",
    description: e?.description ?? "",
    lat, lng,
    emoji: e?.emoji ?? "📍",
    bannerImage: e?.bannerImage ?? null,
    bannerUri: e?.bannerUri ?? null,
    when: [e?.date, e?.time].filter(Boolean).join(" · "),
    address: e?.location?.formattedAddress ?? e?.location?.address ?? e?.address ?? "",
    status: e?.status ?? "active",
    // ✅ Needed for live pin detection in map
    startsAt: e?.startsAt ?? null,
    date: e?.date ?? null,
    time: e?.time ?? null,
    endsAt: e?.endsAt ?? null,
    endDate: e?.endDate ?? null,
    endTime: e?.endTime ?? null,
  };
}

type EditEventValue = React.ComponentProps<typeof EditEventModal>["event"];

function toEditableEvent(pin: EventPin): NonNullable<EditEventValue> {
  const loc = ((pin as any)?.location || {}) as any;
  return {
    ...(pin as any),
    location: {
      ...loc,
      lat: loc?.lat ?? pin.lat, lng: loc?.lng ?? pin.lng,
      formattedAddress: loc?.formattedAddress ?? loc?.address ?? (pin as any)?.address ?? "",
      address: loc?.address ?? (pin as any)?.address ?? "",
      placeId: loc?.placeId ?? "",
      city: loc?.city ?? (pin as any)?.city ?? "",
      admin1Code: loc?.admin1Code ?? loc?.stateCode ?? loc?.state ?? "",
      admin1: loc?.admin1 ?? loc?.region ?? loc?.state ?? "",
      countryCode: loc?.countryCode ?? loc?.country ?? "",
      country: loc?.country ?? "",
    },
  } as NonNullable<EditEventValue>;
}

function PickerOption({ onPress, iconName, iconColor, iconBg, borderColor, glowColor, title, subtitle, badgeText, badgeColor, badgeBg }: any) {
  return (
    <TouchableOpacity style={[P.option, { borderColor }]} activeOpacity={0.8} onPress={onPress}>
      <BlurView intensity={20} style={[P.optionGlow, { backgroundColor: glowColor }]} />
      <View style={[P.iconWrap, { backgroundColor: iconBg, borderColor }]}>
        <Ionicons name={iconName as any} size={24} color={iconColor} />
      </View>
      <View style={P.optionBody}>
        <Text style={P.optionTitle}>{title}</Text>
        <Text style={P.optionSub}>{subtitle}</Text>
      </View>
      <View style={[P.badge, { backgroundColor: badgeBg, borderColor }]}>
        <Text style={[P.badgeText, { color: badgeColor }]}>{badgeText}</Text>
      </View>
    </TouchableOpacity>
  );
}


// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Home() {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [defaultKind, setDefaultKind] = useState<"event_free">("event_free");
  const [showPicker, setShowPicker] = useState(false);

  const [events, setEvents] = useState<EventPin[]>([]);
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [myCity, setMyCity] = useState("");
  const [searchLabel, setSearchLabel] = useState<string | null>(null);
  const [locStatus, setLocStatus] = useState<"unknown" | "granted" | "denied">("unknown");
  // ✅ Don't render map until we have a real location OR permission is denied
  const [locReady, setLocReady] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EditEventValue>(null);

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [mapStackOpen, setMapStackOpen] = useState(false);

  const fabSize = useMemo(() => (Platform.OS === "ios" ? 58 : 62), []);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  // ✅ FIX: Use refs for location so loadEvents doesn't recreate on every GPS update
  const myLocRef = useRef<{ lat: number; lng: number } | null>(null);
  // ✅ FIX: In-flight guard — prevents duplicate concurrent fetches
  const isFetchingRef = useRef(false);
  // ✅ Delta sync: track last successful fetch time
  const lastFetchRef = useRef<number>(0);

  // Keep ref in sync with state
  useEffect(() => {
    myLocRef.current = myLoc;
  }, [myLoc]);

  // FAB pulse animation
  const fabPulse = useMemo(() => new Animated.Value(1), []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 1.00, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ✅ FIX: loadEvents no longer depends on myLoc — reads from ref instead
  // This prevents the polling useEffect from restarting on every GPS update
  const loadEvents = useCallback(async (customLat?: number, customLng?: number) => {
    if (!API_BASE) return [];
    // ✅ Skip if a fetch is already in flight
    if (isFetchingRef.current) return [];

    const loc = myLocRef.current;
    const lat = customLat ?? loc?.lat;
    const lng = customLng ?? loc?.lng;

    const baseQuery = `?limit=100`;

    isFetchingRef.current = true;
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/events/get-events${baseQuery}`, {
        headers: {
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
          "ngrok-skip-browser-warning": "1",
        },
      });

      let dbEvents: EventPin[] = [];
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        dbEvents = (Array.isArray(json?.events) ? json.events : []).map(normalizeEvent).filter(Boolean) as EventPin[];
        setEvents(dbEvents);
        lastFetchRef.current = Date.now();
      }

      return dbEvents;
    } catch {
      return [];
    } finally {
      isFetchingRef.current = false;
    }
  }, [API_BASE, EVENT_API_KEY]); // ✅ myLoc removed from deps — uses ref now

  const loadMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocStatus("denied");
        setLocReady(true); // ✅ Permission denied — still show map (events fallback)
        loadEvents();
        return;
      }
      setLocStatus("granted");

      let resolvedLat: number | null = null;
      let resolvedLng: number | null = null;

      // 1. Try last known position for instant map jump
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last) {
        resolvedLat = last.coords.latitude;
        resolvedLng = last.coords.longitude;
        myLocRef.current = { lat: resolvedLat, lng: resolvedLng };
        setMyLoc({ lat: resolvedLat, lng: resolvedLng });
        setLocReady(true); // ✅ We have a cached location — show map immediately
        loadEvents(resolvedLat, resolvedLng);
        Location.reverseGeocodeAsync({ latitude: resolvedLat, longitude: resolvedLng })
          .then(rev => {
            const c = (rev?.[0]?.city || rev?.[0]?.district || rev?.[0]?.subregion || rev?.[0]?.name || "").trim();
            if (c) setMyCity(c);
          })
          .catch(() => { });
      }

      // 2. Get fresh GPS fix with a timeout and High accuracy
      const freshPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000)
      );

      const fresh = await Promise.race([freshPromise, timeoutPromise]).catch(() => null);

      if (fresh) {
        const { latitude: flat, longitude: flng } = fresh.coords;
        // ✅ Only update loc if meaningfully different (>50m) to avoid re-renders
        const prev = myLocRef.current;
        const dist = prev ? Math.abs(flat - prev.lat) + Math.abs(flng - prev.lng) : 1;
        if (dist > 0.0005) { // ~50m threshold
          myLocRef.current = { lat: flat, lng: flng };
          setMyLoc({ lat: flat, lng: flng });
        }
        if (!last) {
          setLocReady(true); // ✅ Fresh GPS fix — map will update
          loadEvents(flat, flng);
        }

        const rev = await Location.reverseGeocodeAsync({ latitude: flat, longitude: flng }).catch(() => null);
        if (rev?.[0]) {
          const c = (rev[0].city || rev[0].district || rev[0].subregion || rev[0].name || "").trim();
          if (c) setMyCity(c);
        }
      } else if (!last) {
        // No last known and fresh timed out — show map anyway (events fallback)
        setLocReady(true);
        loadEvents();
      }
    } catch (err) {
      console.log("[Home] Location load error:", err);
      setLocReady(true); // ✅ On any error, still show the map
      loadEvents();
    }
  }, [loadEvents]);

  useEffect(() => {
    loadMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ FIX: Polling every 30s (was 15s). loadEvents is now stable — won't restart on GPS changes
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    // ✅ Show active events + live events (started but status still "active")
    const now = Date.now();
    const active = events.filter(e => {
      const st = String(e.status ?? "active").toLowerCase();
      const isMine = userId && String(e.creatorClerkId) === userId;

      // ✅ AUTOMATIC ENDING: If event has an end time and it's in the past, hide it.
      // ⚠️ EXCEPTION: Services never "end" automatically based on time. They stay on map.
      if (e.kind !== "service" && e.endsAt) {
        const endTs = new Date(e.endsAt).getTime();
        if (Number.isFinite(endTs) && now > endTs) return false;
      }

      return st === "active" || st === "live" || (st === "paused" && isMine);
    });
    if (!activeFilter) return active;
    return active.filter(e => {
      const kind = String((e as any).kind ?? "").toLowerCase(), f = activeFilter.toLowerCase();
      if (f === "free" || f === "event_free") return kind === "free" || kind === "event_free";
      if (f === "paid" || f === "event_paid") return kind === "paid" || kind === "event_paid";
      return true;
    });
  }, [events, activeFilter, userId]);

  // ✅ FIX: mapKey no longer includes activeFilter — filter changes now go via postMessage
  // Only bump pinsVersion when events are truly added/deleted (not just filtered)
  const [pinsVersion, setPinsVersion] = useState(0);
  const mapKey = `map:${pinsVersion}`;

  const onPinPress = useCallback((pin: EventPin) => {
    router.push({
      pathname: "/newApp/event-detail",
      params: {
        eventId: pin._id,
        title: pin.title,
        emoji: pin.emoji,
        bannerUri: pin.bannerUri || (pin as any).bannerImage || "",
        date: pin.date || "",
        time: pin.time || "",
        formattedAddress: pin.address || "",
        creatorName: (pin as any).creatorName || "",
        creatorAvatar: (pin as any).creatorAvatar || "",
        creatorClerkId: pin.creatorClerkId || "",
        kind: (pin as any).kind || "event",
        priceCents: String((pin as any).priceCents ?? 0),
        joinPolicy: (pin as any).joinPolicy || "anyone_can_join",
        eventStr: JSON.stringify(pin)
      }
    });
  }, [router]);

  // ✅ Stable callbacks for MapView — wrapped in useCallback to prevent prop churn
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    const prev = myLocRef.current;
    const dist = prev ? Math.abs(lat - prev.lat) + Math.abs(lng - prev.lng) : 1;
    if (dist > 0.0005) { // Only update state if moved >50m
      myLocRef.current = { lat, lng };
      setMyLoc({ lat, lng });
    }
  }, []);

  const handleStackOpen = useCallback(() => setMapStackOpen(true), []);
  const handleStackClose = useCallback(() => setMapStackOpen(false), []);

  return (
    <>
      {/* ✅ Only render map after real location is known — prevents hardcoded Indore fallback */}
      {locReady && (
        <MapView
          key={mapKey}
          events={filteredEvents}
          initialCenter={myLoc}
          searchLabel={searchLabel}
          locationStatus={locStatus}
          onPinPress={onPinPress}
          userId={userId}
          onLocationUpdate={handleLocationUpdate}
          onStackOpen={handleStackOpen}
          onStackClose={handleStackClose}
        />
      )}

      <MapSearchHeader
        top={insets.top + 10}
        onPick={(lat, lng, label) => {
          setMyLoc({ lat, lng });
          setSearchLabel(label ?? null);
        }}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* ── Chat button ───────────────────────────────── */}
      <TouchableOpacity
        style={[OL.chatBtn, { top: insets.top + 14 }]}
        onPress={() => router.push("/newApp/chat" as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={18} color={C.amber} />
      </TouchableOpacity>

      {/* ── Sheets ───────────────────────────────────── */}
      <EditEventModal
        visible={editOpen} event={editEvent}
        onClose={() => { setEditOpen(false); setEditEvent(null); }}
        onUpdated={() => { setEditOpen(false); setEditEvent(null); loadEvents(); }}
        onDeleted={() => { setEditOpen(false); setEditEvent(null); loadEvents(); }}
      />

      {/* ── FAB ──────────────────────────────────────── */}
      {!mapStackOpen && (
        <Animated.View style={[OL.fabGlow, { transform: [{ scale: fabPulse }] }]} pointerEvents="none" />
      )}
      {!mapStackOpen && (
        <TouchableOpacity
          style={[OL.fab, { width: fabSize, height: fabSize, borderRadius: fabSize / 2 }]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color="#000" />
        </TouchableOpacity>
      )}

      {/* ── Nearby pill ──────────────────────────────── */}
      {!mapStackOpen && (
        <TouchableOpacity style={OL.nearbyPill} activeOpacity={0.88} onPress={() => setShowList(true)}>
          <Ionicons name="map-outline" size={15} color={C.greenText} />
          <Text style={OL.nearbyText}>Nearby</Text>
        </TouchableOpacity>
      )}

      <EventsListModal
        visible={showList} onClose={() => setShowList(false)}
        events={filteredEvents as any} myCity={myCity}
        myLoc={myLoc}
        onPinPress={onPinPress as any}
      />

      {/* ── FAB Picker Modal ─────────────────────────── */}
      <Modal visible={showPicker} transparent animationType="none" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={P.backdrop} onPress={() => setShowPicker(false)}>
          <Pressable style={P.sheet} onPress={() => { }}>

            {/* Handle */}
            <View style={P.grabber} />

            {/* Header */}
            <View style={P.headerRow}>
              <View>
                <Text style={P.heading}>Create something</Text>
                <Text style={P.subheading}>What do you want to put on the map?</Text>
              </View>
              <TouchableOpacity style={P.closeBtn} onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={P.divider} />

            {/* Option — Event */}
            <PickerOption
              onPress={() => { setDefaultKind("event_free"); setShowPicker(false); setTimeout(() => setOpen(true), 120); }}
              iconName="calendar"
              iconColor={C.purpleText}
              iconBg={C.purpleDim}
              borderColor={C.purple + "30"}
              glowColor={C.purpleGlow}
              title="Event"
              subtitle="Free or paid · People join & attend"
              badgeText="Free / Paid"
              badgeColor={C.purpleText}
              badgeBg={C.purpleDim}
            />

            {/* Cancel */}
            <TouchableOpacity style={P.cancelBtn} activeOpacity={0.8} onPress={() => setShowPicker(false)}>
              <Text style={P.cancelText}>Cancel</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>

      <ModalizeEventSheet
        visible={open} onClose={() => setOpen(false)} defaultKind={defaultKind}
        onCreate={(e: any) => {
          const n = normalizeEvent(e) ?? (e as EventPin);
          setEvents(prev => [n, ...prev]);
          setOpen(false);
          loadEvents();
        }}
      />
    </>
  );
}

// ─── Overlay styles ───────────────────────────────────────────────────────────
const OL = StyleSheet.create({
  chatBtn: {
    position: "absolute", left: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 6 },
    elevation: 8, zIndex: 10,
  },
  fabGlow: {
    position: "absolute", bottom: Platform.OS === "ios" ? 40 : 30, right: 12,
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: C.greenGlow,
    zIndex: 9,
  },
  fab: {
    position: "absolute", bottom: Platform.OS === "ios" ? 50 : 40, right: 22,
    backgroundColor: C.green,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 15, zIndex: 10,
  },
  nearbyPill: {
    position: "absolute", bottom: Platform.OS === "ios" ? 60 : 50, left: "50%",
    transform: [{ translateX: -58 }],
    width: 116, height: 44,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 8 },
    elevation: 10, zIndex: 10,
  },
  nearbyText: { color: C.greenText, fontWeight: "700", fontSize: 13, letterSpacing: 0.3 },
});

// ─── Picker sheet styles ──────────────────────────────────────────────────────
const P = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingHorizontal: 24, paddingBottom: 60, paddingTop: 12,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20,
    elevation: 10,
  },
  grabber: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: "#E0E0E0",
    alignSelf: "center", marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  heading: { fontSize: 24, fontWeight: "900", color: "#111111", letterSpacing: -0.6 },
  subheading: { fontSize: 14, fontWeight: "500", color: "#666666", marginTop: 4 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F5F5F5",
    borderWidth: 1, borderColor: "#EEEEEE",
    alignItems: "center", justifyContent: "center",
  },
  divider: {
    height: 1, backgroundColor: "#F0F0F0", marginBottom: 20,
  },

  // Option card
  option: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 20, borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#6366F1", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  optionGlow: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    borderRadius: 999,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  optionBody: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: "800", color: "#111111", letterSpacing: -0.2 },
  optionSub: { fontSize: 12, fontWeight: "500", color: "#888888", marginTop: 3 },

  badge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, flexShrink: 0,
  },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },

  // Cancel
  cancelBtn: {
    marginTop: 8, height: 58, borderRadius: 24,
    backgroundColor: "#F5F7FF",
    borderWidth: 1, borderColor: "#E0E7FF",
    alignItems: "center", justifyContent: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "800", color: "#6366F1" },
});
