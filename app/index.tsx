// app/index.tsx
import React, { useMemo, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView from "../components/MapView";
import ModalizeEventSheet from "../components/AddEventModal";

type EventPin = { title: string; lat: number; lng: number; emoji: string; when?: string };

export default function Home() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<EventPin[]>([]);

  const fabSize = useMemo(() => (Platform.OS === "ios" ? 60 : 64), []);

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
          setEvents((prev) => [...prev, e]); // e = { title, lat, lng, emoji, when? }
          setOpen(false);
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
