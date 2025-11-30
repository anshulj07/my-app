// components/PersonBookingSheet.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import type { EventPin } from "../Map/MapView";

type Props = {
  visible: boolean;
  onClose: () => void;
  person?: EventPin | null;
};

export default function PersonBookingSheet({ visible, onClose, person }: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.sheet}>
              {/* Handle no selection */}
              {!person ? (
                <Text style={styles.placeholder}>No person selected</Text>
              ) : (
                <>
                  <View style={styles.handle} />
                  <Text style={styles.name}>{person.title}</Text>

                  <View style={styles.row}>
                    <Text style={styles.emoji}>{person.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Location</Text>
                      <Text style={styles.value}>
                        lat: {person.lat.toFixed(4)}, lng: {person.lng.toFixed(4)}
                      </Text>
                    </View>
                  </View>

                  {/* You can replace this with real profile fields later */}
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.about}>
                    This is a placeholder profile description. You can replace this
                    text with details like bio, skills, pricing, or availability.
                  </Text>

                  <TouchableOpacity style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>Book this person</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "70%", // 👈 covers 70% of screen from bottom
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CCC",
    marginBottom: 12,
  },
  placeholder: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  label: {
    fontSize: 12,
    color: "#555",
  },
  value: {
    fontSize: 14,
    color: "#111",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
  },
  about: {
    fontSize: 14,
    color: "#333",
    marginBottom: 20,
  },
  bookBtn: {
    marginTop: "auto",
    backgroundColor: "#0A84FF",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
