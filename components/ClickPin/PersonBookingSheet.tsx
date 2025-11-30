// components/PersonBookingSheet.tsx
import React, { useMemo } from "react";
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

function pickFirst(...vals: Array<any>) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export default function PersonBookingSheet({ visible, onClose, person }: Props) {
  const details = useMemo(() => {
    if (!person) return null;

    // supports both old + new schema (because we preserved ...e in home normalization)
    const city = pickFirst(person.city, person?.location?.city);
    const region = pickFirst(person.region, person.state, person?.location?.region, person?.location?.state);
    const country = pickFirst(person.country, person?.location?.country);
    const address = pickFirst(
      person.address,
      person?.location?.formattedAddress,
      person?.location?.address
    );

    const when = pickFirst(person.when, person?.date && person?.time ? `${person.date} · ${person.time}` : "", person.date);

    return { city, region, country, address, when };
  }, [person]);

  const locationLine =
    details && (details.city || details.region || details.country)
      ? [details.city, details.region, details.country].filter(Boolean).join(", ")
      : "";

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.sheet}>
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

                      {!!locationLine ? (
                        <Text style={styles.value}>{locationLine}</Text>
                      ) : !!details?.address ? (
                        <Text style={styles.value} numberOfLines={2}>
                          {details.address}
                        </Text>
                      ) : (
                        <Text style={styles.valueMuted}>Location details not available</Text>
                      )}

                      {!!details?.when && (
                        <Text style={styles.whenText} numberOfLines={1}>
                          {details.when}
                        </Text>
                      )}
                    </View>
                  </View>

                  {!!details?.address && (
                    <>
                      <Text style={styles.sectionTitle}>Address</Text>
                      <Text style={styles.about} numberOfLines={3}>
                        {details.address}
                      </Text>
                    </>
                  )}

                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.about}>
                    This is a placeholder profile description. You can replace this text with details like bio, skills,
                    pricing, or availability.
                  </Text>

                  <TouchableOpacity style={styles.bookBtn} activeOpacity={0.9}>
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
    height: "70%",
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
    marginTop: 2,
  },
  valueMuted: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  whenText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
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
