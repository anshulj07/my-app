// app/newtab/home.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import * as Location from "expo-location";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  const when = [e?.date, e?.time].filter(Boolean).join(" · ");
  const address = e?.location?.formattedAddress ?? e?.location?.address ?? e?.address ?? "";

  return {
    ...e,
    title: e?.title ?? "",
    lat,
    lng,
    emoji: e?.emoji ?? "📍",
    when,
    address,
  };
}

// ✅ infer the exact "event" prop type from EditEventModal (no manual EditableEvent import)
type EditEventValue = React.ComponentProps<typeof EditEventModal>["event"];

function toEditableEvent(pin: EventPin): NonNullable<EditEventValue> {
  const loc = ((pin as any)?.location || {}) as any;

  return {
    ...(pin as any),
    // make sure location matches what your EditEventModal expects
    location: {
      ...loc,
      lat: loc?.lat ?? pin.lat,
      lng: loc?.lng ?? pin.lng,

      formattedAddress: loc?.formattedAddress ?? loc?.address ?? (pin as any)?.address ?? "",
      address: loc?.address ?? (pin as any)?.address ?? "",
      placeId: loc?.placeId ?? "",

      // normalize common variants so the edit modal has what it needs
      city: loc?.city ?? (pin as any)?.city ?? "",
      admin1Code: loc?.admin1Code ?? loc?.stateCode ?? loc?.state ?? "",
      admin1: loc?.admin1 ?? loc?.region ?? loc?.state ?? "",
      countryCode: loc?.countryCode ?? loc?.country ?? "",
      country: loc?.country ?? "",
    },
  } as NonNullable<EditEventValue>;
}

export default function Home() {
  const insets = useSafeAreaInsets();


  const [open, setOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [events, setEvents] = useState<EventPin[]>([]);
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [myCity, setMyCity] = useState("");
  const [locStatus, setLocStatus] = useState<"unknown" | "granted" | "denied">("unknown");

  const [selectedPin, setSelectedPin] = useState<EventPin | null>(null);
  const [showPersonSheet, setShowPersonSheet] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EditEventValue>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const eventMatchesFilter = useCallback((ev: any, filterKey: string) => {
    const key = filterKey.toLowerCase();
    const kind = String(ev?.kind ?? "").toLowerCase(); // your API uses "kind"
    const tags = Array.isArray(ev?.tags) ? ev.tags.map(String).join(" ").toLowerCase() : "";
    const title = String(ev?.title ?? "").toLowerCase();
    return kind.includes(key) || tags.includes(key) || title.includes(key);
  }, []);

  const filteredEvents = useMemo(() => {
    if (!activeFilter) return events;
    return events.filter((ev: any) => eventMatchesFilter(ev, activeFilter));
  }, [events, activeFilter, eventMatchesFilter]);


  const fabSize = useMemo(() => (Platform.OS === "ios" ? 60 : 64), []);
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const loadEvents = useCallback(async () => {
    if (!API_BASE) return;

    const url = `${API_BASE.replace(/\/$/, "")}/api/events/get-events?limit=200`;
    const res = await fetch(url, {
      headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
    });

    const text = await res.text();
    if (!res.ok) {
      console.log("[Home] loadEvents failed", res.status, url);
      console.log("[Home] body (first 200 chars):", text.slice(0, 200));
      return;
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      console.log("[Home] Expected JSON but got:", text.slice(0, 200));
      return;
    }

    const list = Array.isArray(json?.events) ? json.events : [];
    const normalized = list.map(normalizeEvent).filter(Boolean) as EventPin[];
    setEvents(normalized);
  }, [API_BASE, EVENT_API_KEY]);

  const loadMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocStatus("denied");
        return;
      }
      setLocStatus("granted");

      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = cur.coords.latitude;
      const lng = cur.coords.longitude;
      setMyLoc({ lat, lng });

      const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const r = rev?.[0];
      setMyCity((r?.city || "").trim());
    } catch (e: any) {
      console.log("[Home] loadMyLocation error", e?.message ?? String(e));
    }
  }, []);

  useEffect(() => {
    loadMyLocation();
    loadEvents();
  }, [loadEvents, loadMyLocation]);

    const mapKey = myLoc
    ? `${myLoc.lat.toFixed(6)}:${myLoc.lng.toFixed(6)}:${activeFilter ?? "all"}`
    : `init:${activeFilter ?? "all"}`;


  return (
    <>
      <MapView
        key={mapKey}
        events={filteredEvents}
        initialCenter={myLoc}
        locationStatus={locStatus}
        onPinPress={(pin) => {
          setSelectedPin(pin as any);
          setShowPersonSheet(true);
        }}
      />

      <MapSearchHeader
  top={insets.top + 10}
  onPick={(lat, lng) => setMyLoc({ lat, lng })}
  activeFilter={activeFilter}
  onFilterChange={setActiveFilter}
/>


      <PersonBookingSheet
        visible={showPersonSheet}
        person={selectedPin}
        onClose={() => setShowPersonSheet(false)}
        onEditDetails={(ev) => {
          setShowPersonSheet(false); // ✅ close pin sheet first
          setEditEvent(toEditableEvent(ev));
          setEditOpen(true);
        }}
      />

      <EditEventModal
        visible={editOpen}
        event={editEvent}
        onClose={() => {
          setEditOpen(false);
          setEditEvent(null);
        }}
        onUpdated={() => {
          setEditOpen(false);
          setEditEvent(null);
          loadEvents(); // refresh pins
        }}
        onDeleted={() => {
          setEditOpen(false);
          setEditEvent(null);
          loadEvents(); // refresh pins
        }}
      />

      <TouchableOpacity
        style={[styles.fab, { width: fabSize, height: fabSize, borderRadius: fabSize / 2 }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.9}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.listPill} activeOpacity={0.92} onPress={() => setShowList(true)}>
        <Ionicons name="list" size={18} color="#fff" />
        <Text style={styles.listPillText}>Nearby</Text>
      </TouchableOpacity>

      <EventsListModal visible={showList} onClose={() => setShowList(false)} events={filteredEvents as any} myCity={myCity} />

      <ModalizeEventSheet
        visible={open}
        onClose={() => setOpen(false)}
        onCreate={(e: any) => {
          const n = normalizeEvent(e) ?? (e as EventPin);
          setEvents((prev) => [n, ...prev]);
          setOpen(false);
          loadEvents();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 40,
    right: 30,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A84FF",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  fabText: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: -2 },

  listPill: {
    position: "absolute",
    bottom: 44,
    left: "50%",
    transform: [{ translateX: -62 }],
    width: 124,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "rgba(17, 24, 39, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  listPillText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
