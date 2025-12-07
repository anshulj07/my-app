// app/components/Map/MapSearchHeader.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  Text,
  Keyboard,
  ActivityIndicator,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import ProfileHeaderButton from "../ProfileHeaderButton";

type Suggestion = { place_id: string; description: string };

export default function MapSearchHeader({
  top,
  onPick,
  placeholder = "Search location",
}: {
  top: number;
  onPick: (lat: number, lng: number, label?: string) => void;
  placeholder?: string;
}) {
  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const closePanel = () => {
    setOpen(false);
    setItems([]);
    Keyboard.dismiss();
  };

  // Autocomplete (debounced)
  useEffect(() => {
    if (!open) return;
    if (!GOOGLE_KEY) return;

    const query = q.trim();

    // ✅ don't show "type 2 letters" on first focus; only after user starts typing
    if (query.length === 0) {
      setItems([]);
      return;
    }

    if (query.length < 2) {
      setItems([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);

        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
          `input=${encodeURIComponent(query)}` +
          `&key=${encodeURIComponent(GOOGLE_KEY)}` +
          `&types=geocode`;

        const res = await fetch(url);
        const j: any = await res.json().catch(() => ({}));
        const preds = Array.isArray(j?.predictions) ? j.predictions : [];

        setItems(
          preds
            .map((p: any) => ({
              place_id: String(p.place_id || ""),
              description: String(p.description || ""),
            }))
            .filter((x: Suggestion) => x.place_id && x.description)
        );
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q, open, GOOGLE_KEY]);

  async function pick(place_id: string, description: string) {
    if (!GOOGLE_KEY) return;

    try {
      setLoading(true);

      const url =
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${encodeURIComponent(place_id)}` +
        `&fields=geometry` +
        `&key=${encodeURIComponent(GOOGLE_KEY)}`;

      const res = await fetch(url);
      const j: any = await res.json().catch(() => ({}));
      const loc = j?.result?.geometry?.location;

      const lat = typeof loc?.lat === "number" ? loc.lat : Number(loc?.lat);
      const lng = typeof loc?.lng === "number" ? loc.lng : Number(loc?.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      setQ(description);
      setOpen(false);
      setItems([]);
      Keyboard.dismiss();
      onPick(lat, lng, description);
    } finally {
      setLoading(false);
    }
  }

  const panelTop = top + 62; // below the bar

  return (
    <>
      {/* bar */}
      <View pointerEvents="box-none" style={[styles.wrap, { top }]}>
        {/* Make entire bar clickable to focus input */}
        <Pressable
          style={styles.bar}
          onPress={() => {
            setOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Ionicons name="search" size={20} color="#6B7280" />

          <TextInput
            ref={inputRef}
            value={q}
            onChangeText={(t) => {
              setQ(t);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={GOOGLE_KEY ? placeholder : "Missing googleMapsKey"}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
          />

          {loading ? (
            <ActivityIndicator size="small" />
          ) : q.trim().length ? (
            <Pressable
              hitSlop={10}
              onPress={() => {
                setQ("");
                setItems([]);
                setOpen(true);
                inputRef.current?.focus();
              }}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}

          <View style={styles.profile}>
            <ProfileHeaderButton size={44} />
          </View>
        </Pressable>
      </View>

      {/* ✅ NOT a Modal anymore => keyboard won't disappear */}
      {open ? (
        <>
          {/* Backdrop starts BELOW the bar so it can't "steal" the initial tap */}
          <Pressable
            style={[styles.backdrop, { top: panelTop }]}
            onPress={closePanel}
          />

          <View style={[styles.card, { top: panelTop }]}>
            <FlatList
              data={items}
              keyExtractor={(x) => x.place_id}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <Pressable style={styles.row} onPress={() => pick(item.place_id, item.description)}>
                  <Ionicons name="location-outline" size={18} color="#6B7280" />
                  <Text style={styles.rowText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {q.trim().length === 0
                      ? "Start typing…"
                      : q.trim().length < 2
                      ? "Type at least 2 letters"
                      : loading
                      ? "Searching…"
                      : "No results"}
                  </Text>
                </View>
              }
            />
          </View>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 30,
  },
  bar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  profile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(2,6,23,0.25)",
    zIndex: 9998,
  },
  card: {
    position: "absolute",
    left: 12,
    right: 12,
    maxHeight: 420,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 20,
    zIndex: 9999,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,23,42,0.06)",
  },
  rowText: { flex: 1, color: "#111827", fontSize: 14, fontWeight: "700" },
  empty: { padding: 16 },
  emptyText: { color: "#6B7280", fontWeight: "700" },
});