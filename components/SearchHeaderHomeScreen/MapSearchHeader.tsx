// app/components/Map/MapSearchHeader.tsx
import React, { useEffect,useMemo, useRef, useState } from "react";
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
import ProfileHeaderButton from "./ProfileHeaderButton";
import { ScrollView, TouchableOpacity } from "react-native";
import { Modalize } from "react-native-modalize";

// ✅ reuse your shared google places helpers
import { fetchAutocomplete, fetchPlaceDetails } from "../AddEventModal/google/places";
import type { Suggestion } from "../AddEventModal/types";
type Filter = { key: string; label: string; icon: any };

const ALL_FILTERS: Filter[] = [
  { key: "coffee", label: "Coffee", icon: "cafe-outline" },
  { key: "yoga", label: "Yoga", icon: "body-outline" },
  { key: "running", label: "Running", icon: "fitness-outline" },
  { key: "game", label: "Game", icon: "game-controller-outline" },
  { key: "movie", label: "Movie", icon: "film-outline" },
  { key: "dinner", label: "Dinner", icon: "restaurant-outline" },

  { key: "walking", label: "Walking", icon: "walk-outline" },
  { key: "hiking", label: "Hiking", icon: "trail-sign-outline" },
  { key: "music", label: "Music", icon: "musical-notes-outline" },
  { key: "party", label: "Party", icon: "sparkles-outline" },
];


export default function MapSearchHeader({
  top,
  onPick,
  placeholder = "Search Anshul",
  activeFilter,
  onFilterChange,
}: {
  top: number;
  onPick: (lat: number, lng: number, label?: string) => void;
  placeholder?: string;

  // ✅ new
  activeFilter: string | null;
  onFilterChange: (key: string | null) => void;
}) {

  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
    const moreRef = useRef<Modalize>(null);
  const quick = useMemo(() => ALL_FILTERS.slice(0, 6), []);
  const rest = useMemo(() => ALL_FILTERS.slice(6), []);


  const closePanel = () => {
    setOpen(false);
    setItems([]);
    setErr(null);
    Keyboard.dismiss();
  };

  // Autocomplete (debounced) — via shared helper
  useEffect(() => {
    if (!open) return;
    if (!GOOGLE_KEY) return;

    const query = q.trim();

    // don't show anything until user types
    if (query.length === 0) {
      setItems([]);
      setErr(null);
      return;
    }

    // small guard to reduce calls
    if (query.length < 2) {
      setItems([]);
      setErr(null);
      return;
    }

    const t = setTimeout(() => {
      fetchAutocomplete({
        key: GOOGLE_KEY,
        q: query,
        setLoading,
        setList: setItems,
        setErr,
      });
    }, 250);

    return () => clearTimeout(t);
  }, [q, open, GOOGLE_KEY]);

  async function pick(placeId: string, label: string) {
    if (!GOOGLE_KEY) return;

    try {
      setLoading(true);
      setErr(null);

      const details = await fetchPlaceDetails(GOOGLE_KEY, placeId);
      const lat = details?.latLng?.lat;
      const lng = details?.latLng?.lng;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const finalLabel = details?.formattedAddress || label;

      setQ(finalLabel);
      setOpen(false);
      setItems([]);
      Keyboard.dismiss();
      onPick(lat!, lng!, finalLabel);
    } finally {
      setLoading(false);
    }
  }

  const panelTop = top + 62; // below the bar

  return (
    <>
      {/* bar */}
      <View pointerEvents="box-none" style={[styles.wrap, { top }]}>
        {/* entire bar clickable */}
        <Pressable
          style={({ pressed }) => [styles.bar, pressed && styles.barPressed]}
          onPress={() => {
            setOpen(true);
            inputRef.current?.focus();
          }}
        >
          <View style={styles.iconPill}>
            <Ionicons name="search" size={18} color="#0F172A" />
          </View>

          <TextInput
            ref={inputRef}
            value={q}
            onChangeText={(t) => {
              setQ(t);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={GOOGLE_KEY ? placeholder : "Missing googleMapsKey"}
            placeholderTextColor="#94A3B8"
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
          />

          {loading ? (
            <View style={styles.trailingPill}>
              <ActivityIndicator size="small" />
            </View>
          ) : q.trim().length ? (
            <Pressable
              hitSlop={10}
              onPress={() => {
                setQ("");
                setItems([]);
                setErr(null);
                setOpen(true);
                inputRef.current?.focus();
              }}
              style={styles.trailingPill}
            >
              <Ionicons name="close" size={16} color="#334155" />
            </Pressable>
          ) : (
            <View style={styles.trailingSpacer} />
          )}

          <View style={styles.profile}>
            <ProfileHeaderButton size={44} />
          </View>
        </Pressable>
      </View>

            {/* filters row */}
      <View pointerEvents="box-none" style={[styles.filtersWrap, { top: top + 58 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {quick.map((f) => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.9}
                onPress={() => onFilterChange(active ? null : f.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons name={f.icon} size={16} color={active ? "#fff" : "#0B1220"} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                {active ? <Ionicons name="close" size={14} color="#fff" /> : null}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => moreRef.current?.open()}
            style={[styles.chip, styles.moreChip]}
          >
            <Ionicons name="options-outline" size={16} color="#0B1220" />
            <Text style={styles.chipText}>More</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* More sheet */}
      <Modalize
        ref={moreRef}
        adjustToContentHeight
        handlePosition="inside"
        modalStyle={styles.sheet}
        handleStyle={styles.handle}
      >
        <View style={styles.sheetInner}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>More filters</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                onFilterChange(null);
                moreRef.current?.close();
              }}
              style={styles.resetBtn}
            >
              <Ionicons name="refresh-outline" size={16} color="#0B1220" />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {rest.map((f) => {
              const active = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  activeOpacity={0.9}
                  onPress={() => {
                    onFilterChange(active ? null : f.key);
                    moreRef.current?.close();
                  }}
                  style={[styles.gridChip, active && styles.gridChipActive]}
                >
                  <Ionicons name={f.icon} size={18} color={active ? "#fff" : "#0B1220"} />
                  <Text style={[styles.gridText, active && styles.gridTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modalize>


      {/* dropdown */}
      {open ? (
        <>
          {/* Backdrop starts BELOW the bar */}
          <Pressable style={[styles.backdrop, { top: panelTop }]} onPress={closePanel} />

          <View style={[styles.card, { top: panelTop }]}>
            <FlatList
              data={items}
              keyExtractor={(x) => x.id}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <Pressable style={styles.row} onPress={() => pick(item.id, item.main)}>
                  <View style={styles.rowIcon}>
                    <Ionicons name="location-outline" size={18} color="#0F172A" />
                  </View>

                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowMain} numberOfLines={1}>
                      {item.main}
                    </Text>
                    {!!item.secondary ? (
                      <Text style={styles.rowSecondary} numberOfLines={1}>
                        {item.secondary}
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>
                    {q.trim().length === 0
                      ? "Start typing…"
                      : q.trim().length < 2
                      ? "Type at least 2 letters"
                      : loading
                      ? "Searching…"
                      : err
                      ? "Couldn’t fetch results"
                      : "No results"}
                  </Text>

                  {!!err ? <Text style={styles.emptySub}>{err}</Text> : null}
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

  // ✅ upgraded "glassy" pill bar
  bar: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  barPressed: {
    transform: [{ scale: 0.995 }],
    shadowOpacity: 0.14,
  },

  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.04)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },

  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },

  trailingPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.04)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },
  trailingSpacer: { width: 32, height: 32 },

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
    backgroundColor: "rgba(2,6,23,0.18)",
    zIndex: 9998,
  },

  // ✅ upgraded dropdown card
  card: {
    position: "absolute",
    left: 12,
    right: 12,
    maxHeight: 420,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 20,
    zIndex: 9999,
  },

  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,23,42,0.06)",
  },

  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.04)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },

  rowTextWrap: { flex: 1 },
  rowMain: { color: "#0F172A", fontSize: 14.5, fontWeight: "900" },
  rowSecondary: { marginTop: 2, color: "#64748B", fontSize: 12.5, fontWeight: "700" },

  empty: { padding: 16 },
  emptyTitle: { color: "#334155", fontWeight: "900" },
  emptySub: { marginTop: 6, color: "#64748B", fontWeight: "700" },
    filtersWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 9997,
    elevation: 25,
  },
  filtersRow: {
    paddingVertical: 8,
    paddingRight: 18,
    gap: 10,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  chipActive: {
    backgroundColor: "rgba(10,132,255,0.95)",
    borderColor: "rgba(10,132,255,0.25)",
    shadowOpacity: 0.18,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B1220",
    letterSpacing: 0.2,
  },
  chipTextActive: { color: "#fff" },
  moreChip: { backgroundColor: "rgba(255,255,255,0.88)" },

  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  handle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.18)",
    marginTop: 10,
  },
  sheetInner: { padding: 16, paddingBottom: 22 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220", letterSpacing: 0.2 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.06)",
  },
  resetText: { fontSize: 13, fontWeight: "900", color: "#0B1220" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  gridChipActive: {
    backgroundColor: "rgba(10,132,255,0.95)",
    borderColor: "rgba(10,132,255,0.25)",
  },
  gridText: { fontSize: 13, fontWeight: "900", color: "#0B1220" },
  gridTextActive: { color: "#fff" },

});
