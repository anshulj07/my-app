// app/newApp/home.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  TouchableOpacity, Text, StyleSheet, Platform,
  Modal, View, Pressable, Animated,
} from "react-native";
import * as Location from "expo-location";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";

import MapView from "../../components/Map/MapView";
import type { EventPin } from "../../components/Map/MapView";
import MapSearchHeader from "../../components/SearchHeaderHomeScreen/MapSearchHeader";
import ModalizeEventSheet from "../../components/AddEventModal/AddEvent";
import EventsListModal from "../../components/List/EventsListModal";
import PersonBookingSheet from "../../components/ClickPin/PersonBookingSheet";
import EditEventModal from "../../components/EditEventModal/EditEvent";

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg:          "#0F0F0F",
  card:        "#1A1A1A",
  cardBorder:  "#2A2A2A",
  glass:       "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.10)",
  inputBg:     "#141414",
  inputBorder: "#2C2C2C",
  ink:         "#F5F5F5",
  muted:       "#888888",
  hint:        "#444444",

  // Green accent
  green:       "#00E676",
  greenDim:    "rgba(0,230,118,0.12)",
  greenGlow:   "rgba(0,230,118,0.25)",
  greenText:   "#00E676",

  // Purple accent
  purple:      "#7C4DFF",
  purpleDim:   "rgba(124,77,255,0.12)",
  purpleGlow:  "rgba(124,77,255,0.25)",
  purpleText:  "#B388FF",

  // Amber for chat
  amber:       "#FFB300",
  amberDim:    "rgba(255,179,0,0.12)",

  white:       "#FFFFFF",
  overlay:     "rgba(0,0,0,0.75)",
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
    title:       e?.title ?? "",
    description: e?.description ?? "",
    lat, lng,
    emoji:       e?.emoji ?? "📍",
    bannerImage: e?.bannerImage ?? null,
    bannerUri:   e?.bannerUri   ?? null,
    when:        [e?.date, e?.time].filter(Boolean).join(" · "),
    address:     e?.location?.formattedAddress ?? e?.location?.address ?? e?.address ?? "",
    status:      e?.status ?? "active",
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
      address:          loc?.address ?? (pin as any)?.address ?? "",
      placeId:          loc?.placeId ?? "",
      city:             loc?.city ?? (pin as any)?.city ?? "",
      admin1Code:       loc?.admin1Code ?? loc?.stateCode ?? loc?.state ?? "",
      admin1:           loc?.admin1 ?? loc?.region ?? loc?.state ?? "",
      countryCode:      loc?.countryCode ?? loc?.country ?? "",
      country:          loc?.country ?? "",
    },
  } as NonNullable<EditEventValue>;
}

// ─── FAB Picker Option Component ─────────────────────────────────────────────
interface PickerOptionProps {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
  badgeBg: string;
  glowColor: string;
}

function PickerOption({
  onPress, iconName, iconColor, iconBg, borderColor,
  title, subtitle, badgeText, badgeColor, badgeBg, glowColor,
}: PickerOptionProps) {
  const scale = useMemo(() => new Animated.Value(1), []);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[P.option, { borderColor }]}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {/* Glow layer */}
        <View style={[P.optionGlow, { backgroundColor: glowColor }]} />

        {/* Icon */}
        <View style={[P.iconWrap, { backgroundColor: iconBg, borderColor }]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>

        {/* Text */}
        <View style={P.optionBody}>
          <Text style={P.optionTitle}>{title}</Text>
          <Text style={P.optionSub}>{subtitle}</Text>
        </View>

        {/* Badge */}
        <View style={[P.badge, { backgroundColor: badgeBg, borderColor: badgeColor + "55" }]}>
          <Text style={[P.badgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={16} color={C.hint} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [open,        setOpen]        = useState(false);
  const [showList,    setShowList]    = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  const [defaultKind, setDefaultKind] = useState<"event_free" | "service">("event_free");

  const [events,    setEvents]    = useState<EventPin[]>([]);
  const [myLoc,     setMyLoc]     = useState<{ lat: number; lng: number } | null>(null);
  const [myCity,    setMyCity]    = useState("");
  const [locStatus, setLocStatus] = useState<"unknown" | "granted" | "denied">("unknown");

  const [selectedPin,     setSelectedPin]     = useState<EventPin | null>(null);
  const [showPersonSheet, setShowPersonSheet] = useState(false);
  const [editOpen,        setEditOpen]        = useState(false);
  const [editEvent,       setEditEvent]       = useState<EditEventValue>(null);
  const [activeFilter,    setActiveFilter]    = useState<string | null>(null);
  const [mapStackOpen,    setMapStackOpen]    = useState(false);

  const fabSize = useMemo(() => (Platform.OS === "ios" ? 58 : 62), []);

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

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

  const loadEvents = useCallback(async () => {
    if (!API_BASE) return;
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/events/get-events?limit=200`, {
      headers: { ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}), "ngrok-skip-browser-warning": "1" },
    });
    const text = await res.text();
    if (!res.ok) return;
    try {
      const json = JSON.parse(text);
      setEvents((Array.isArray(json?.events) ? json.events : []).map(normalizeEvent).filter(Boolean) as EventPin[]);
    } catch {}
  }, [API_BASE, EVENT_API_KEY]);

  const loadMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocStatus("denied"); return; }
      setLocStatus("granted");
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setMyLoc({ lat: cur.coords.latitude, lng: cur.coords.longitude });
      const rev = await Location.reverseGeocodeAsync({ latitude: cur.coords.latitude, longitude: cur.coords.longitude });
      setMyCity((rev?.[0]?.city || "").trim());
    } catch {}
  }, []);

  useEffect(() => { loadMyLocation(); loadEvents(); }, [loadEvents, loadMyLocation]);

  const filteredEvents = useMemo(() => {
    const active = events.filter(e => String(e.status ?? "active").toLowerCase() === "active");
    if (!activeFilter) return active;
    return active.filter(e => {
      const kind = String((e as any).kind ?? "").toLowerCase(), f = activeFilter.toLowerCase();
      if (f === "free"  || f === "event_free") return kind === "free"  || kind === "event_free";
      if (f === "paid"  || f === "event_paid") return kind === "paid"  || kind === "event_paid";
      if (f === "service") return kind === "service";
      return true;
    });
  }, [events, activeFilter]);

  const [pinsVersion, setPinsVersion] = useState(0);
  const mapKey = myLoc
    ? `${myLoc.lat.toFixed(6)}:${myLoc.lng.toFixed(6)}:${activeFilter ?? "all"}:${pinsVersion}`
    : `init:${activeFilter ?? "all"}:${pinsVersion}`;

  const onPinPress = useCallback((pin: EventPin) => {
    const raw = (pin as any)?._id ?? (pin as any)?.id ?? "";
    const id  = typeof raw === "string" ? raw.trim() : String(raw?.$oid || raw?.oid || "");
    setSelectedPin((events.find(e => String(e._id) === id) || pin) as any);
    setShowPersonSheet(true);
  }, [events]);

  const onStatusChanged = useCallback((id: string, nextStatus: string) => {
    const idStr = String(id).trim(), ns = String(nextStatus || "").trim() || "active";
    setEvents(prev => prev.map(e => String(e._id) === idStr ? { ...e, status: ns } as any : e));
    setSelectedPin(prev => prev && String(prev._id) === idStr ? { ...prev, status: ns } as any : prev);
    setPinsVersion(v => v + 1);
  }, []);

  return (
    <>
      <MapView
        key={mapKey}
        events={filteredEvents}
        initialCenter={myLoc}
        locationStatus={locStatus}
        onPinPress={onPinPress}
        onStackOpen={() => setMapStackOpen(true)}
        onStackClose={() => setMapStackOpen(false)}
      />

      <MapSearchHeader
        top={insets.top + 10}
        onPick={(lat, lng) => setMyLoc({ lat, lng })}
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
      <PersonBookingSheet
        visible={showPersonSheet} person={selectedPin}
        onClose={() => setShowPersonSheet(false)}
        onEditDetails={ev => { setShowPersonSheet(false); setEditEvent(toEditableEvent(ev)); setEditOpen(true); }}
        onStatusChanged={onStatusChanged}
        onDeleteEvent={eventId => {
          setEvents(prev => prev.filter(e => String(e._id || "") !== eventId));
          setPinsVersion(v => v + 1);
          setShowPersonSheet(false);
        }}
      />
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
      />

      {/* ── FAB Picker Modal ─────────────────────────── */}
      <Modal visible={showPicker} transparent animationType="none" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={P.backdrop} onPress={() => setShowPicker(false)}>
          <Pressable style={P.sheet} onPress={() => {}}>

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
              iconColor={C.greenText}
              iconBg={C.greenDim}
              borderColor={C.green + "30"}
              glowColor={C.greenGlow}
              title="Event"
              subtitle="Free or paid · People join & attend"
              badgeText="Free / Paid"
              badgeColor={C.greenText}
              badgeBg={C.greenDim}
            />

            {/* Option — Service */}
            <PickerOption
              onPress={() => { setDefaultKind("service"); setShowPicker(false); setTimeout(() => setOpen(true), 120); }}
              iconName="briefcase"
              iconColor={C.purpleText}
              iconBg={C.purpleDim}
              borderColor={C.purple + "30"}
              glowColor={C.purpleGlow}
              title="Service"
              subtitle="Bookable slots · Clients book you"
              badgeText="Bookable"
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
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: C.amberDim,
    borderWidth: 1, borderColor: C.amber + "40",
    alignItems: "center", justifyContent: "center",
    shadowColor: C.amber, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 5, zIndex: 10,
  },
  fabGlow: {
    position: "absolute", bottom: 28, right: 12,
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: C.greenGlow,
    zIndex: 9,
  },
  fab: {
    position: "absolute", bottom: 38, right: 22,
    backgroundColor: C.green,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.green, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 10, zIndex: 10,
  },
  nearbyPill: {
    position: "absolute", bottom: 42, left: "50%",
    transform: [{ translateX: -58 }],
    width: 116, height: 42,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(76, 80, 78, 0.7)",
    borderWidth: 1, borderColor: C.green + "40",
    shadowColor: C.green, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6, zIndex: 10,
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
    backgroundColor: "#111111",
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  grabber: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: "#333",
    alignSelf: "center", marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  heading:    { fontSize: 22, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
  subheading: { fontSize: 13, fontWeight: "400", color: C.muted, marginTop: 4 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 999,
    backgroundColor: "#1E1E1E",
    borderWidth: 1, borderColor: "#2C2C2C",
    alignItems: "center", justifyContent: "center",
  },
  divider: {
    height: 1, backgroundColor: "#1E1E1E", marginBottom: 16,
  },

  // Option card
  option: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 20,
    backgroundColor: "#303230",
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
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
  optionTitle: { fontSize: 16, fontWeight: "700", color: C.ink, letterSpacing: -0.2 },
  optionSub:   { fontSize: 12, fontWeight: "400", color: C.muted, marginTop: 3 },

  badge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, flexShrink: 0,
  },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },

  // Cancel
  cancelBtn: {
    marginTop: 4, paddingVertical: 15, borderRadius: 16,
    backgroundColor: "#d4cece",
    borderWidth: 1, borderColor: "#e7c4c4",
    alignItems: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "600", color: C.muted },
});