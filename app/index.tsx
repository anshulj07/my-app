import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useState } from "react";
import ModalizeEventSheet from "../components/AddEventModal";
import MapView from "@/components/MapView";

export default function Home() {
  const [openSheet, setOpenSheet] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* MAP will go here */}
      <MapView />

      {/* Floating + button */}
      <TouchableOpacity style={styles.fab} onPress={() => setOpenSheet(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <ModalizeEventSheet
        visible={openSheet}
        onClose={() => setOpenSheet(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 40,
    right: 30,
    backgroundColor: "#007AFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabText: {
    fontSize: 32,
    color: "white",
    fontWeight: "bold",
  },
});
