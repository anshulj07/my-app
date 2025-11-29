// components/ModalizeEventSheet.tsx
import React, { useRef, useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Modalize } from "react-native-modalize";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AddEventModal({ visible, onClose }: Props) {
  const sheetRef = useRef<Modalize>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (visible) {
      sheetRef.current?.open();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  // Auto-icon detection
  const getIcon = () => {
    const t = text.toLowerCase();
    if (t.includes("run")) return "walk-outline";
    if (t.includes("drink")) return "beer-outline";
    if (t.includes("gym") || t.includes("workout")) return "barbell-outline";
    if (t.includes("party")) return "sparkles-outline";
    if (t.includes("walk")) return "walk-outline";
    if (t.includes("eat") || t.includes("food")) return "pizza-outline";
    if (t.includes("study") || t.includes("learn")) return "book-outline";
    if (t.includes("sleep") || t.includes("nap")) return "moon-outline";
    return "add-circle-outline";
  };

  return (
    <Modalize
      ref={sheetRef}
      onClosed={onClose}
      adjustToContentHeight
      handleStyle={styles.handle}
      modalStyle={styles.modal}
      keyboardAvoidingBehavior="padding"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Create Event</Text>

        <View style={styles.row}>
          <Ionicons name={getIcon()} size={30} color="#007AFF" />
          <TextInput
            placeholder="Describe your activity..."
            style={styles.input}
            value={text}
            onChangeText={setText}
          />
        </View>

        <Text style={styles.hint}>Your pin will be created on map</Text>
      </View>
    </Modalize>
  );
}

const styles = StyleSheet.create({
  modal: {
    paddingTop: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "white",
  },
  handle: {
    width: 60,
    height: 5,
    backgroundColor: "#CCC",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    padding: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    marginLeft: 12,
    flex: 1,
    fontSize: 17,
  },
  hint: {
    marginTop: 12,
    color: "#777",
    fontSize: 14,
  },
});
