// components/EventsListModal.tsx
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type EventPin = {
  title: string;
  lat: number;
  lng: number;
  emoji: string;
  when?: string;
  address?: string;
};

function parseDateKey(when?: string) {
  const d = (when || "").split("·")[0]?.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "No date";
}

function groupByDate(list: EventPin[]) {
  const m = new Map<string, EventPin[]>();
  for (const e of list) {
    const k = parseDateKey(e.when);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(e);
  }
  const keys = Array.from(m.keys()).sort((a, b) => {
    if (a === "No date") return 1;
    if (b === "No date") return -1;
    return a.localeCompare(b);
  });
  return keys.map((k) => ({ date: k, items: m.get(k)! }));
}

function splitParts(address?: string) {
  return (address || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function isStreetLike(s: string) {
  const x = (s || "").toLowerCase();
  return (
    /\d/.test(x) ||
    /\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court|hwy|highway|suite|ste|apt|unit|#)\b/.test(
      x
    )
  );
}

// Handles:
// "Potsdam, NY, USA" -> { city: "Potsdam", state: "NY" }
// "14 Market St, Potsdam, NY 13676, USA" -> { city: "Potsdam", state: "NY" }
// "NYC" -> { city: "NYC", state: "" }
function extractCityState(address?: string) {
  const parts = splitParts(address);
  if (parts.length === 0) return { city: "", state: "" };
  if (parts.length === 1) return { city: parts[0], state: "" };

  const p0 = parts[0];
  const hasStreet = isStreetLike(p0);

  const city = hasStreet ? parts[1] || "" : parts[0] || "";
  const statePart = hasStreet ? parts[2] || "" : parts[1] || "";
  const state = (statePart.split(" ")[0] || "").trim(); // "NY 13676" -> "NY"

  return { city: city.trim(), state: state.trim() };
}

function normalizeCity(s: string) {
  const x = (s || "").trim().toLowerCase();
  if (!x) return "";
  const cleaned = x.replace(/\./g, "").replace(/\s+/g, " ");
  if (cleaned === "nyc" || cleaned === "new york city" || cleaned === "manhattan") return "new york";
  return cleaned;
}

function normalizeQuery(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

export default function EventsListModal({
  visible,
  onClose,
  events,
  myCity,
}: {
  visible: boolean;
  onClose: () => void;
  events: EventPin[];
  myCity: string;
}) {
  const [tab, setTab] = useState<"my" | "other">("my");
  const [q, setQ] = useState("");

  const myCityKey = useMemo(() => normalizeCity(myCity), [myCity]);

  const myCityEvents = useMemo(() => {
    const base = (events || []).filter((e) => (e.address || "").trim().length > 0);
    if (!myCityKey) return []; // show none if we don't know city
    return base.filter((e) => normalizeCity(extractCityState(e.address).city) === myCityKey);
  }, [events, myCityKey]);

  const otherCityEvents = useMemo(() => {
    const base = (events || []).filter((e) => (e.address || "").trim().length > 0);
    const query = normalizeCity(q);
    if (!query) return [];

    return base.filter((e) => {
      const { city, state } = extractCityState(e.address);
      const cityKey = normalizeCity(city);
      const fullKey = normalizeQuery(e.address || "");
      const cityStateKey = normalizeQuery([city, state].filter(Boolean).join(" ")); // "new york ny"
      return cityKey.includes(query) || cityStateKey.includes(query) || fullKey.includes(query);
    });
  }, [events, q]);

  const groupedMy = useMemo(() => groupByDate(myCityEvents), [myCityEvents]);
  const groupedOther = useMemo(() => groupByDate(otherCityEvents), [otherCityEvents]);
  const showing = tab === "my" ? groupedMy : groupedOther;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Events</Text>
              <Text style={styles.sub}>
                {tab === "my"
                  ? myCityKey
                    ? `Your city: ${myCity}`
                    : "Your city: (unknown) — enable location"
                  : "Search a city to view events"}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.9}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setTab("my")}
              style={[styles.tab, tab === "my" && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === "my" && styles.tabTextActive]}>Your city</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setTab("other")}
              style={[styles.tab, tab === "other" && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === "other" && styles.tabTextActive]}>Other city</Text>
            </TouchableOpacity>
          </View>

          {tab === "other" && (
            <View style={styles.searchWrap}>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search city (e.g., New York)"
                placeholderTextColor="#94A3B8"
                style={styles.search}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
              />
              {!!q && (
                <TouchableOpacity onPress={() => setQ("")} style={styles.clearBtn} activeOpacity={0.9}>
                  <Text style={styles.clearText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
            {tab === "other" && !q.trim() ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>Search a city</Text>
                <Text style={styles.emptySub}>Type “New York”, “NYC”, “Boston”, etc.</Text>
              </View>
            ) : showing.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptySub}>
                  {tab === "my"
                    ? myCityKey
                      ? "No events in your city yet."
                      : "Location not available."
                    : "Try another city name."}
                </Text>
              </View>
            ) : (
              showing.map((g) => (
                <View key={g.date} style={styles.group}>
                  <Text style={styles.groupTitle}>{g.date}</Text>

                  {g.items.map((e, idx) => {
                    const { city, state } = extractCityState(e.address);
                    const cityText = [city, state].filter(Boolean).join(", ") || "Unknown city";

                    return (
                      <View key={`${e.title}-${e.lat}-${e.lng}-${idx}`} style={styles.row}>
                        <Text style={styles.emoji}>{e.emoji ?? "📍"}</Text>
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={styles.rowTitle}>
                            {e.title}
                          </Text>
                          <Text numberOfLines={1} style={styles.rowSub}>
                            {cityText}
                            {e.when ? `  ·  ${e.when}` : ""}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.45)", justifyContent: "flex-end", padding: 14 },
  sheet: { backgroundColor: "#fff", borderRadius: 22, maxHeight: "96%", minHeight: "82%", overflow: "hidden" },

  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  sub: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#64748B" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100,116,139,0.10)",
  },
  closeText: { fontSize: 22, fontWeight: "900", color: "#0F172A", lineHeight: 22 },

  tabs: { flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#0A84FF", borderColor: "#0A84FF" },
  tabText: { fontWeight: "900", color: "#0F172A" },
  tabTextActive: { color: "#fff" },

  searchWrap: {
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  search: { flex: 1, color: "#0F172A", fontWeight: "800" },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100,116,139,0.12)",
  },
  clearText: { color: "#334155", fontSize: 18, fontWeight: "900", lineHeight: 18 },

  emptyWrap: { padding: 18 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  emptySub: { marginTop: 6, color: "#64748B", fontWeight: "700" },

  group: { paddingHorizontal: 14, paddingTop: 14 },
  groupTitle: { fontWeight: "900", color: "#0F172A", marginBottom: 10, fontSize: 13 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  emoji: { fontSize: 20, width: 28, textAlign: "center" },
  rowTitle: { fontWeight: "900", color: "#0F172A" },
  rowSub: { marginTop: 2, color: "#64748B", fontWeight: "700", fontSize: 12 },
});
