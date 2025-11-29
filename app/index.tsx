// app/index.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView from "../components/MapView";
import ModalizeEventSheet from "../components/AddEventModal";
import Constants from "expo-constants";

type EventPin = { title: string; lat: number; lng: number; emoji: string; when?: string };

export default function Home() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<EventPin[]>([]);

  const fabSize = useMemo(() => (Platform.OS === "ios" ? 60 : 64), []);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const loadEvents = useCallback(async () => {
    if (!API_BASE) return;

    const res = await fetch(`${API_BASE}/api/events/get-events?limit=200`, {
      headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
    });

    const json = await res.json();
    const list = Array.isArray(json?.events) ? json.events : [];

    setEvents(
      list.map((e: any) => ({
        title: e.title,
        lat: e.lat,
        lng: e.lng,
        emoji: e.emoji ?? "📍",
        when: [e.date, e.time].filter(Boolean).join(" · "),
      }))
    );
  }, [API_BASE, EVENT_API_KEY]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MapView events={events} />

      <TouchableOpacity
        style={[styles.fab, { width: fabSize, height: fabSize, borderRadius: fabSize / 2 }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.9}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <ModalizeEventSheet
        visible={open}
        onClose={() => setOpen(false)}
        onCreate={(e: EventPin) => {
          setEvents((prev) => [e, ...prev]);
          setOpen(false);
          loadEvents();
        }}
      />
    </GestureHandlerRootView>
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
});
