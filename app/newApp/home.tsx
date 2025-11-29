// app/home.tsx
import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView from "../../components/MapView";
import AddEventModal from "../../components/AddEventModal";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

type EventPin = { title: string; lat: number; lng: number; emoji: string };

export default function Home() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<EventPin[]>([]);
  const router = useRouter();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MapView events={events} />
      <TouchableOpacity
        style={styles.profileBtn}
        onPress={() => router.push("/newApp/profile")}
        activeOpacity={0.9}
        hitSlop={12}
      >
        <Ionicons name="person-circle-outline" size={30} color="#111" />
      </TouchableOpacity>


      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)}>
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
    bottom: 40, right: 30, width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#0A84FF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#0A84FF", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 8 },
  },
  fabText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  profileBtn: {
  position: "absolute",
  top: 55,
  left: 16,
  width: 46,
  height: 46,
  borderRadius: 16,
  backgroundColor: "#fff",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.14,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
},

});
