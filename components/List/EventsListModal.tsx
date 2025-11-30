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
  Platform,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";


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

function extractCityState(address?: string) {
  const parts = splitParts(address);
  if (parts.length === 0) return { city: "", state: "" };
  if (parts.length === 1) return { city: parts[0], state: "" };

  const p0 = parts[0];
  const hasStreet = isStreetLike(p0);

  const city = hasStreet ? parts[1] || "" : parts[0] || "";
  const statePart = hasStreet ? parts[2] || "" : parts[1] || "";
  const state = (statePart.split(" ")[0] || "").trim();

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

function formatHeaderCity(myCity: string) {
  const c = (myCity || "").trim();
  return c ? c : "Unknown";
}

function niceDateLabel(key: string) {
  if (key === "No date") return "No date";
  // keep it simple: show YYYY-MM-DD as-is (fast + predictable)
  return key;
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
    if (!myCityKey) return [];
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
      const cityStateKey = normalizeQuery([city, state].filter(Boolean).join(" "));
      return cityKey.includes(query) || cityStateKey.includes(query) || fullKey.includes(query);
    });
  }, [events, q]);

  const groupedMy = useMemo(() => groupByDate(myCityEvents), [myCityEvents]);
  const groupedOther = useMemo(() => groupByDate(otherCityEvents), [otherCityEvents]);
  const showing = tab === "my" ? groupedMy : groupedOther;

  const headerPillText = tab === "my" ? `📍 ${formatHeaderCity(myCity)}` : "🌎 Explore";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet */}
        <View style={styles.sheet}>
          {/* Grabber */}
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Top header */}
          <View style={styles.top}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hTitle}>Events</Text>
              <View style={styles.pillRow}>
                <View style={styles.headerPill}>
                  <Text style={styles.headerPillText}>{headerPillText}</Text>
                </View>

                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>
                    {tab === "my" ? myCityEvents.length : otherCityEvents.length}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.9}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs (segmented control) */}
          <View style={styles.segmentWrap}>
            <View style={styles.segment}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setTab("my")}
                style={[styles.segmentBtn, tab === "my" && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, tab === "my" && styles.segmentTextActive]}>
                  Your city
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setTab("other")}
                style={[styles.segmentBtn, tab === "other" && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, tab === "other" && styles.segmentTextActive]}>
                  Other city
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search (Other) */}
          {tab === "other" && (
            <View style={styles.searchCard}>
              <Text style={styles.searchLabel}>Search city</Text>
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.75)" />

                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="New York, Boston, Potsdam…"
                  placeholderTextColor="rgba(255,255,255,0.55)"
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="search"
                />

                {!!q && (
                  <TouchableOpacity onPress={() => setQ("")} style={styles.xBtn} activeOpacity={0.9}>
                    <Text style={styles.xBtnText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.searchHint}>
                Tip: “NYC” and “New York” both work.
              </Text>
            </View>
          )}

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {tab === "other" && !q.trim() ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🗺️</Text>
                <Text style={styles.emptyTitle}>Find events anywhere</Text>
                <Text style={styles.emptySub}>Search a city to see events grouped by date.</Text>
              </View>
            ) : showing.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>{tab === "my" ? "🎈" : "🔎"}</Text>
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptySub}>
                  {tab === "my"
                    ? myCityKey
                      ? "Nothing in your city yet."
                      : "Location is unavailable."
                    : "Try a different city name."}
                </Text>
              </View>
            ) : (
              showing.map((g) => (
                <View key={g.date} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{niceDateLabel(g.date)}</Text>
                    <View style={styles.sectionLine} />
                    <Text style={styles.sectionCount}>{g.items.length}</Text>
                  </View>

                  {g.items.map((e, idx) => {
                    const { city, state } = extractCityState(e.address);
                    const cityText = [city, state].filter(Boolean).join(", ") || "Unknown city";

                    return (
                      <View key={`${e.title}-${e.lat}-${e.lng}-${idx}`} style={styles.card}>
                        <View style={styles.cardLeft}>
                          <View style={styles.emojiBubble}>
                            <Text style={styles.emojiText}>{e.emoji ?? "📍"}</Text>
                          </View>
                        </View>

                        <View style={styles.cardMid}>
                          <Text numberOfLines={1} style={styles.cardTitle}>
                            {e.title}
                          </Text>
                          <Text numberOfLines={1} style={styles.cardMeta}>
                            {cityText}
                            {e.when ? `  •  ${e.when}` : ""}
                          </Text>
                        </View>

                        <View style={styles.cardRight}>
                          <View style={styles.chevron}>
                            <Text style={styles.chevronText}>›</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.60)",
  },

  sheet: {
    backgroundColor: "#0B1220",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    minHeight: "86%",
    maxHeight: "96%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -12 },
  },

  grabberWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  grabber: { width: 54, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)" },

  top: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  pillRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  headerPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  headerPillText: { color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 12 },

  countPill: {
    minWidth: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(10,132,255,0.22)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,132,255,0.35)",
  },
  countPillText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  segmentWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  segment: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  segmentBtnActive: {
    backgroundColor: "rgba(10,132,255,0.95)",
    shadowColor: "#0A84FF",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  segmentText: { color: "rgba(255,255,255,0.80)", fontWeight: "900" },
  segmentTextActive: { color: "#fff" },

  searchCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
  },
  searchLabel: { color: "rgba(255,255,255,0.85)", fontWeight: "900", fontSize: 12, marginBottom: 10 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: "rgba(2,6,23,0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 8,
  },
  searchIcon: { color: "rgba(255,255,255,0.75)", fontWeight: "900" },
  searchInput: { flex: 1, color: "#fff", fontWeight: "900" },
  xBtn: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  xBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", lineHeight: 18 },
  searchHint: { marginTop: 10, color: "rgba(255,255,255,0.55)", fontWeight: "700", fontSize: 12 },

  section: { paddingHorizontal: 16, paddingTop: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  sectionTitle: { color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 13 },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.10)" },
  sectionCount: { color: "rgba(255,255,255,0.60)", fontWeight: "900", fontSize: 12 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
  },
  cardLeft: {},
  emojiBubble: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,132,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,132,255,0.30)",
  },
  emojiText: { fontSize: 20 },

  cardMid: { flex: 1 },
  cardTitle: { color: "#fff", fontWeight: "900", fontSize: 14 },
  cardMeta: { marginTop: 4, color: "rgba(255,255,255,0.65)", fontWeight: "800", fontSize: 12 },

  cardRight: {},
  chevron: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  chevronText: { color: "rgba(255,255,255,0.85)", fontSize: 22, fontWeight: "900", marginTop: -2 },

  emptyWrap: { paddingHorizontal: 16, paddingTop: 32, paddingBottom: 22, alignItems: "center" },
  emptyEmoji: { fontSize: 34, marginBottom: 10 },
  emptyTitle: { color: "#fff", fontWeight: "900", fontSize: 18, textAlign: "center" },
  emptySub: {
    marginTop: 8,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
});
