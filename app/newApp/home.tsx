import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView from "../../components/MapView";
import AddEventModal from "../../components/AddEventModal";

type EventPin = { title: string; lat: number; lng: number; emoji: string };

export default function Home() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<EventPin[]>([]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MapView events={events} />

      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)} activeOpacity={0.9}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddEventModal
        visible={open}
        onClose={() => setOpen(false)}
        onCreate={(e) => setEvents((prev) => [...prev, e])}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 40,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A84FF",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  fabText: { color: "#fff", fontSize: 32, fontWeight: "800" },
});
