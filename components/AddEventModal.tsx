// components/ModalizeEventSheet.tsx
import React, { useRef, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Modalize } from "react-native-modalize";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (e: { title: string; lat: number; lng: number; emoji: string }) => void;
};

const pickEmoji = (t: string) => {
  const s = t.toLowerCase();
  if (s.includes("run")) return "🏃";
  if (s.includes("walk")) return "🚶";
  if (s.includes("drink") || s.includes("coffee") || s.includes("beer")) return "🍺";
  if (s.includes("gym") || s.includes("workout")) return "🏋️";
  if (s.includes("party")) return "✨";
  if (s.includes("eat") || s.includes("food") || s.includes("dinner")) return "🍕";
  if (s.includes("study") || s.includes("learn")) return "📚";
  if (s.includes("sleep") || s.includes("nap")) return "🌙";
  return "➕";
};

export default function AddEventModal({ visible, onClose, onCreate }: Props) {
  const sheetRef = useRef<Modalize>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [text, setText] = useState("");
  const [placePicked, setPlacePicked] = useState<{ lat: number; lng: number } | null>(null);

  // open/close + reset
  useEffect(() => {
    if (visible) {
      sheetRef.current?.open();
      setStep(1);
      setPlacePicked(null);
      Haptics.selectionAsync();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const emoji = useMemo(() => pickEmoji(text), [text]);
  const disabledNext = text.trim().length === 0;
  const disabledAdd = !placePicked;

  const GOOGLE_KEY = Constants.expoConfig?.extra?.googleMapsKey as string;

  return (
    <Modalize
      ref={sheetRef}
      onClosed={onClose}
      adjustToContentHeight
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      overlayStyle={styles.overlay}
      keyboardAvoidingBehavior={Platform.select({ ios: "padding", android: "height" })}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={16}>
          <Ionicons name="close" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.body}>
        {step === 1 ? (
          <>
            <Text style={styles.title}>I want to…</Text>

            <View style={styles.inputUnderlineWrap}>
              <TextInput
                placeholder="grab coffee, hang out at the park, etc."
                placeholderTextColor="#9CA3AF"
                style={styles.underlineInput}
                value={text}
                onChangeText={setText}
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (!disabledNext) {
                    setStep(2);
                    Haptics.selectionAsync();
                  }
                }}
              />
              <View style={[styles.underline, { backgroundColor: text ? "#E11D48" : "#E5E7EB" }]} />
            </View>

            <TouchableOpacity
              style={[styles.cta, disabledNext && styles.ctaDisabled]}
              disabled={disabledNext}
              onPress={() => {
                setStep(2);
                Haptics.selectionAsync();
              }}
              activeOpacity={disabledNext ? 1 : 0.9}
            >
              <Text style={styles.ctaText}>Next →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Where?</Text>

            <View style={styles.placesWrap}>
              <GooglePlacesAutocomplete
                placeholder="Search for a place"
                fetchDetails
                enablePoweredByContainer={false}
                nearbyPlacesAPI="GooglePlacesSearch"
                onPress={(data, details) => {
                  const lat = details?.geometry?.location?.lat;
                  const lng = details?.geometry?.location?.lng;
                  if (typeof lat === "number" && typeof lng === "number") {
                    setPlacePicked({ lat, lng });
                    Haptics.selectionAsync();
                  }
                }}
                query={{
                  key: GOOGLE_KEY,
                  language: "en",
                }}
                textInputProps={{
                  placeholderTextColor: "#9CA3AF",
                }}
                styles={{
                  textInput: styles.placesInput as any,
                  listView: styles.placesList as any,
                  row: styles.placesRow as any,
                  separator: styles.placesSeparator as any,
                }}
              />
            </View>

            <TouchableOpacity
              style={[styles.cta, disabledAdd && styles.ctaDisabled]}
              disabled={disabledAdd}
              onPress={() => {
                if (!placePicked) return;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onCreate({
                  title: text.trim(),
                  lat: placePicked.lat,
                  lng: placePicked.lng,
                  emoji,
                });
                setText("");
                setPlacePicked(null);
                setStep(1);
                onClose();
              }}
              activeOpacity={disabledAdd ? 1 : 0.9}
            >
              <Text style={styles.ctaText}>Add pin →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modalize>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: "rgba(0,0,0,0.35)" },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 60, height: 6, borderRadius: 3,
    backgroundColor: "#D1D5DB", alignSelf: "center", marginVertical: 10,
  },

  header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 },
  emojiWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
    alignSelf: "center",
  },
  emoji: { fontSize: 26 },
  closeBtn: { position: "absolute", right: 16, top: 6 },

  body: { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111", marginTop: 8, marginBottom: 12 },

  inputUnderlineWrap: { marginTop: 6, marginBottom: 20 },
  underlineInput: { fontSize: 18, color: "#111", paddingVertical: 8 },
  underline: { height: 2, borderRadius: 2 },

  cta: {
    marginTop: 16, height: 50, borderRadius: 16,
    backgroundColor: "#0A84FF", alignItems: "center", justifyContent: "center",
    shadowColor: "#0A84FF", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 6 },
  },
  ctaDisabled: { backgroundColor: "#C7D7FE", shadowOpacity: 0.08 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  placesWrap: { marginTop: 4 },
  placesInput: {
    height: 46, borderRadius: 12, backgroundColor: "#F3F4F6",
    paddingHorizontal: 12, color: "#111", fontSize: 16,
  },
  placesList: { marginTop: 8, borderRadius: 12, overflow: "hidden" },
  placesRow: { paddingVertical: 12, paddingHorizontal: 12 },
  placesSeparator: { backgroundColor: "#E5E7EB", height: StyleSheet.hairlineWidth },
});
