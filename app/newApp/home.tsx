// app/newtab/home.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import * as Location from "expo-location";
import MapView from "../../components/Map/MapView";
import ModalizeEventSheet from "../../components/Map/AddEventModal";
import EventsListModal from "../../components/List/EventsListModal";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import PersonBookingSheet from "../../components/ClickPin/PersonBookingSheet";
import type { EventPin } from "../../components/Map/MapView";


function toNumber(v: any): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/**
 * Normalizes API event into the pin shape MapView expects:
 * - Supports BOTH old schema (e.lat/e.lng) and new schema (e.location.lat/e.location.lng)
 */
function normalizeEvent(e: any): EventPin | null {
  const lat = toNumber(e?.location?.lat ?? e?.lat);
  const lng = toNumber(e?.location?.lng ?? e?.lng);
  if (lat == null || lng == null) return null;

  const when = [e?.date, e?.time].filter(Boolean).join(" · ");
  const address =
    e?.location?.formattedAddress ??
    e?.location?.address ??
    e?.address ??
    "";

  return {
    ...e, // preserve extra fields
    title: e?.title ?? "",
    lat,
    lng,
    emoji: e?.emoji ?? "📍",
    when,
    address,
  };
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [events, setEvents] = useState<EventPin[]>([]);
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [myCity, setMyCity] = useState("");
  const [locStatus, setLocStatus] = useState<"unknown" | "granted" | "denied">("unknown");

  const [selectedPin, setSelectedPin] = useState<EventPin | null>(null);
  const [showPersonSheet, setShowPersonSheet] = useState(false);

  const fabSize = useMemo(() => (Platform.OS === "ios" ? 60 : 64), []);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const loadEvents = useCallback(async () => {
    if (!API_BASE) return;

    const url = `${API_BASE}/api/events/get-events?limit=200`;

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
      console.log("[Home] URL:", url);
      return;
    }

    const list = Array.isArray(json?.events) ? json.events : [];

    // ✅ KEY FIX: normalize new schema -> keeps top-level lat/lng for MapView
    const normalized = list.map(normalizeEvent).filter(Boolean) as EventPin[];
    setEvents(normalized);
  }, [API_BASE, EVENT_API_KEY]);

  const loadMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocStatus("denied");
        console.log("[Home] Location permission denied");
        return;
      }
      setLocStatus("granted");

      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords?.latitude && last?.coords?.longitude) {
        const lat = last.coords.latitude;
        const lng = last.coords.longitude;
        setMyLoc({ lat, lng });
        console.log("[Home] Last known loc", { lat, lng });
      }

      const cur = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = cur.coords.latitude;
      const lng = cur.coords.longitude;
      setMyLoc({ lat, lng });
      console.log("[Home] Current loc", { lat, lng });

      const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const r = rev?.[0];
      const cityOnly = (r?.city || "").trim();
      setMyCity(cityOnly);
      console.log("[Home] City", cityOnly, r);
    } catch (e: any) {
      console.log("[Home] loadMyLocation error", e?.message ?? String(e));
    }
  }, []);

  useEffect(() => {
    loadMyLocation();
    loadEvents();
  }, [loadEvents, loadMyLocation]);

  return (
    <>
      <MapView
        events={events}
        initialCenter={myLoc}
        locationStatus={locStatus}
        onPinPress={(pin) => {
          setSelectedPin(pin as any);
          setShowPersonSheet(true);
        }}
      />

      <PersonBookingSheet
        visible={showPersonSheet}
        person={selectedPin}
        onClose={() => setShowPersonSheet(false)}
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

      <EventsListModal
        visible={showList}
        onClose={() => setShowList(false)}
        events={events as any}
        myCity={myCity}
      />

      <ModalizeEventSheet
        visible={open}
        onClose={() => setOpen(false)}
        onCreate={(e: any) => {
          // normalize newly-created event too (handles new schema safely)
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
