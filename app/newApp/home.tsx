// app/newApp/home.tsx
// ✏️ FIXED:
//   1. activeFilter now passed to MapView (was set but never used)
//   2. FAB color updated to brand pink (#FF4D6D) — consistent white theme
//   3. Chat icon top-left → router.push("/newApp/chat")
//   4. ProfileHeaderButton stays top-right

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  TouchableOpacity, Text, StyleSheet, Platform,
  Modal, View, Pressable,
} from "react-native";
import * as Location from "expo-location";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import MapView from "../../components/Map/MapView";
import type { EventPin } from "../../components/Map/MapView";
import MapSearchHeader from "../../components/SearchHeaderHomeScreen/MapSearchHeader";

import ModalizeEventSheet from "../../components/AddEventModal/AddEvent";
import EventsListModal from "../../components/List/EventsListModal";
import PersonBookingSheet from "../../components/ClickPin/PersonBookingSheet";
import EditEventModal from "../../components/EditEventModal/EditEvent";

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
    typeof rawId === "string" && rawId.trim()
      ? rawId.trim()
      : rawId && typeof rawId === "object" && (rawId.$oid || rawId.oid)
        ? String(rawId.$oid || rawId.oid)
        : `${lat}:${lng}:${String(e?.title ?? "")}`;

  const when    = [e?.date, e?.time].filter(Boolean).join(" · ");
  const address = e?.location?.formattedAddress ?? e?.location?.address ?? e?.address ?? "";

  return {
    ...(e || {}),
    _id,
    title:       e?.title       ?? "",
    description: e?.description ?? "",
    lat, lng,
    emoji:  e?.emoji  ?? "📍",
    when, address,
    status: e?.status ?? "active",
  };
}

type EditEventValue = React.ComponentProps<typeof EditEventModal>["event"];

function toEditableEvent(pin: EventPin): NonNullable<EditEventValue> {
  const loc = ((pin as any)?.location || {}) as any;
  return {
    ...(pin as any),
    location: {
      ...loc,
      lat:              loc?.lat              ?? pin.lat,
      lng:              loc?.lng              ?? pin.lng,
      formattedAddress: loc?.formattedAddress ?? loc?.address ?? (pin as any)?.address ?? "",
      address:          loc?.address          ?? (pin as any)?.address ?? "",
      placeId:          loc?.placeId          ?? "",
      city:             loc?.city             ?? (pin as any)?.city    ?? "",
      admin1Code:       loc?.admin1Code       ?? loc?.stateCode ?? loc?.state ?? "",
      admin1:           loc?.admin1           ?? loc?.region   ?? loc?.state  ?? "",
      countryCode:      loc?.countryCode      ?? loc?.country  ?? "",
      country:          loc?.country          ?? "",
    },
  } as NonNullable<EditEventValue>;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();

  const [open,        setOpen]        = useState(false);
  const [showList,    setShowList]    = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  const [defaultKind, setDefaultKind] = useState<"event_free" | "service">("event_free");

  const [events,    setEvents]    = useState<EventPin[]>([]);
  const [myLoc,     setMyLoc]     = useState<{ lat: number; lng: number } | null>(null);
  const [myCity,    setMyCity]    = useState("");
  const [locStatus, setLocStatus] = useState<"unknown" | "granted" | "denied">("unknown");

  const [selectedPin,       setSelectedPin]       = useState<EventPin | null>(null);
  const [showPersonSheet,   setShowPersonSheet]   = useState(false);
  const [editOpen,          setEditOpen]          = useState(false);
  const [editEvent,         setEditEvent]         = useState<EditEventValue>(null);

  // ✅ FIXED: activeFilter is now passed into MapView (was set but never used before)
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fabSize = useMemo(() => (Platform.OS === "ios" ? 60 : 64), []);

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const loadEvents = useCallback(async () => {
    if (!API_BASE) return;
    const url = `${API_BASE.replace(/\/$/, "")}/api/events/get-events?limit=200`;
    const res = await fetch(url, {
      headers: {
        ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        "ngrok-skip-browser-warning": "1",
      },
    });
    const text = await res.text();
    if (!res.ok) { console.log("[Home] loadEvents failed", res.status); return; }
    let json: any;
    try { json = JSON.parse(text); } catch { return; }
    const list       = Array.isArray(json?.events) ? json.events : [];
    const normalized = list.map(normalizeEvent).filter(Boolean) as EventPin[];
    setEvents(normalized);
  }, [API_BASE, EVENT_API_KEY]);

  const loadMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocStatus("denied"); return; }
      setLocStatus("granted");
      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = cur.coords;
      setMyLoc({ lat, lng });
      const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      setMyCity((rev?.[0]?.city || "").trim());
    } catch (e: any) {
      console.log("[Home] location error", e?.message);
    }
  }, []);

  useEffect(() => { loadMyLocation(); loadEvents(); }, [loadEvents, loadMyLocation]);

  // ✅ Filter events: if activeFilter set, only show matching kind; else show all active
  const filteredEvents = useMemo(() => {
    const active = events.filter(e => String(e.status ?? "active").toLowerCase() === "active");
    if (!activeFilter) return active;
    return active.filter(e => {
      const kind = String((e as any).kind ?? "").toLowerCase();
      const f    = activeFilter.toLowerCase();
      if (f === "free"    || f === "event_free")  return kind === "free"  || kind === "event_free";
      if (f === "paid"    || f === "event_paid")  return kind === "paid"  || kind === "event_paid";
      if (f === "service")                        return kind === "service";
      return true;
    });
  }, [events, activeFilter]);

  const [pinsVersion, setPinsVersion] = useState(0);
  const mapKey = myLoc
    ? `${myLoc.lat.toFixed(6)}:${myLoc.lng.toFixed(6)}:${activeFilter ?? "all"}:${pinsVersion}`
    : `init:${activeFilter ?? "all"}:${pinsVersion}`;

  const onPinPress = useCallback((pin: EventPin) => {
    const raw  = (pin as any)?._id ?? (pin as any)?.id ?? "";
    const id   = typeof raw === "string" ? raw.trim() : String(raw?.$oid || raw?.oid || "");
    const full = events.find(e => String(e._id) === id) || pin;
    setSelectedPin(full as any);
    setShowPersonSheet(true);
  }, [events]);

  const onStatusChanged = useCallback((id: string, nextStatus: string) => {
    const idStr = String(id).trim();
    const ns    = String(nextStatus || "").trim() || "active";
    setEvents(prev => prev.map(e => String(e._id) === idStr ? { ...e, status: ns } as any : e));
    setSelectedPin(prev => prev && String(prev._id) === idStr ? { ...prev, status: ns } as any : prev);
    setPinsVersion(v => v + 1);
  }, []);

  return (
    <>
      {/* ✅ Map now receives filteredEvents (respects activeFilter) */}
      <MapView
        key={mapKey}
        events={filteredEvents}
        initialCenter={myLoc}
        locationStatus={locStatus}
        onPinPress={onPinPress}
      />

      <MapSearchHeader
        top={insets.top + 10}
        onPick={(lat, lng) => setMyLoc({ lat, lng })}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* ✅ Chat button — top left */}
      <TouchableOpacity
        style={[styles.chatBtn, { top: insets.top + 14 }]}
        onPress={() => router.push("/newApp/chat" as any)}
        activeOpacity={0.88}
      >
        <Ionicons name="chatbubble-ellipses" size={20} color="#FF4D6D" />
      </TouchableOpacity>

      <PersonBookingSheet
        visible={showPersonSheet}
        person={selectedPin}
        onClose={() => setShowPersonSheet(false)}
        onEditDetails={ev => {
          setShowPersonSheet(false);
          setEditEvent(toEditableEvent(ev));
          setEditOpen(true);
        }}
        onStatusChanged={onStatusChanged}
        onDeleteEvent={eventId => {
          setEvents(prev => prev.filter(e => String(e._id || "") !== eventId));
          setPinsVersion(v => v + 1);
          setShowPersonSheet(false);
        }}
      />

      <EditEventModal
        visible={editOpen}
        event={editEvent}
        onClose={() => { setEditOpen(false); setEditEvent(null); }}
        onUpdated={() => { setEditOpen(false); setEditEvent(null); loadEvents(); }}
        onDeleted={() => { setEditOpen(false); setEditEvent(null); loadEvents(); }}
      />

      {/* FAB — create event */}
      <TouchableOpacity
        style={[styles.fab, { width: fabSize, height: fabSize, borderRadius: fabSize / 2 }]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.9}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Nearby pill */}
      <TouchableOpacity style={styles.listPill} activeOpacity={0.92} onPress={() => setShowList(true)}>
        <Ionicons name="list" size={18} color="#fff" />
        <Text style={styles.listPillText}>Nearby</Text>
      </TouchableOpacity>

      <EventsListModal
        visible={showList}
        onClose={() => setShowList(false)}
        events={filteredEvents as any}
        myCity={myCity}
      />

      {/* FAB type picker */}
      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={fabStyles.backdrop} onPress={() => setShowPicker(false)}>
          <View style={fabStyles.sheet}>
            <View style={fabStyles.grabber} />
            <Text style={fabStyles.title}>What do you want to create?</Text>
            <TouchableOpacity
              style={fabStyles.option} activeOpacity={0.85}
              onPress={() => { setDefaultKind("event_free"); setShowPicker(false); setTimeout(() => setOpen(true), 120); }}
            >
              <View style={[fabStyles.iconBubble, { backgroundColor: "rgba(255,77,109,0.15)" }]}>
                <Text style={fabStyles.iconText}>🎉</Text>
              </View>
              <View style={fabStyles.optionText}>
                <Text style={fabStyles.optionTitle}>Event</Text>
                <Text style={fabStyles.optionSub}>Free or paid — people join</Text>
              </View>
              <Text style={fabStyles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={fabStyles.option} activeOpacity={0.85}
              onPress={() => { setDefaultKind("service"); setShowPicker(false); setTimeout(() => setOpen(true), 120); }}
            >
              <View style={[fabStyles.iconBubble, { backgroundColor: "rgba(139,92,246,0.18)" }]}>
                <Text style={fabStyles.iconText}>🛠️</Text>
              </View>
              <View style={fabStyles.optionText}>
                <Text style={fabStyles.optionTitle}>Service</Text>
                <Text style={fabStyles.optionSub}>Bookable slots — clients book</Text>
              </View>
              <Text style={fabStyles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <ModalizeEventSheet
        visible={open}
        onClose={() => setOpen(false)}
        defaultKind={defaultKind}
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

const styles = StyleSheet.create({
  chatBtn: {
    position:   "absolute",
    left:       16,
    width:      42,
    height:     42,
    borderRadius: 13,
    backgroundColor: "#FFF1F5",
    borderWidth: 1,
    borderColor: "#FFD1DC",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF4D6D",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 10,
  },
  fab: {
    position: "absolute", bottom: 40, right: 30,
    backgroundColor: "#FF4D6D",          // ✅ white theme brand color
    alignItems: "center", justifyContent: "center",
    shadowColor: "#FF4D6D",
    shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: -2 },

  listPill: {
    position:  "absolute",
    bottom:    44,
    left:      "50%",
    transform: [{ translateX: -62 }],
    width: 124, height: 46,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 999,
    backgroundColor: "rgba(17, 24, 39, 0.72)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 }, elevation: 10,
  },
  listPillText: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 0.2 },
});

const fabStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(2,6,23,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 14,
  },
  grabber: { width: 48, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.20)", alignSelf: "center", marginBottom: 20 },
  title: { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 16 },
  option: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", marginBottom: 12,
  },
  iconBubble: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 26 },
  optionText: { flex: 1 },
  optionTitle: { color: "#fff", fontSize: 16, fontWeight: "900" },
  optionSub:   { color: "rgba(255,255,255,0.60)", fontSize: 13, fontWeight: "700", marginTop: 3 },
  arrow: { color: "rgba(255,255,255,0.50)", fontSize: 26, fontWeight: "900" },
});