// // components/EventsListModal.tsx
// import React, { useMemo, useState } from "react";
// import {
//   Modal,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   Platform,
// } from "react-native";

// import Ionicons from "@expo/vector-icons/Ionicons";


// type EventPin = {
//   title: string;
//   lat: number;
//   lng: number;
//   emoji: string;
//   when?: string;
//   address?: string;
// };

// function parseDateKey(when?: string) {
//   const d = (when || "").split("·")[0]?.trim();
//   return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "No date";
// }

// function groupByDate(list: EventPin[]) {
//   const m = new Map<string, EventPin[]>();
//   for (const e of list) {
//     const k = parseDateKey(e.when);
//     if (!m.has(k)) m.set(k, []);
//     m.get(k)!.push(e);
//   }
//   const keys = Array.from(m.keys()).sort((a, b) => {
//     if (a === "No date") return 1;
//     if (b === "No date") return -1;
//     return a.localeCompare(b);
//   });
//   return keys.map((k) => ({ date: k, items: m.get(k)! }));
// }

// function splitParts(address?: string) {
//   return (address || "")
//     .split(",")
//     .map((p) => p.trim())
//     .filter(Boolean);
// }

// function isStreetLike(s: string) {
//   const x = (s || "").toLowerCase();
//   return (
//     /\d/.test(x) ||
//     /\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court|hwy|highway|suite|ste|apt|unit|#)\b/.test(
//       x
//     )
//   );
// }

// function extractCityState(address?: string) {
//   const parts = splitParts(address);
//   if (parts.length === 0) return { city: "", state: "" };
//   if (parts.length === 1) return { city: parts[0], state: "" };

//   const p0 = parts[0];
//   const hasStreet = isStreetLike(p0);

//   const city = hasStreet ? parts[1] || "" : parts[0] || "";
//   const statePart = hasStreet ? parts[2] || "" : parts[1] || "";
//   const state = (statePart.split(" ")[0] || "").trim();

//   return { city: city.trim(), state: state.trim() };
// }

// function normalizeCity(s: string) {
//   const x = (s || "").trim().toLowerCase();
//   if (!x) return "";
//   const cleaned = x.replace(/\./g, "").replace(/\s+/g, " ");
//   if (cleaned === "nyc" || cleaned === "new york city" || cleaned === "manhattan") return "new york";
//   return cleaned;
// }

// function normalizeQuery(s: string) {
//   return (s || "")
//     .trim()
//     .toLowerCase()
//     .replace(/\./g, "")
//     .replace(/\s+/g, " ");
// }

// function formatHeaderCity(myCity: string) {
//   const c = (myCity || "").trim();
//   return c ? c : "Unknown";
// }

// function niceDateLabel(key: string) {
//   if (key === "No date") return "No date";
//   // keep it simple: show YYYY-MM-DD as-is (fast + predictable)
//   return key;
// }

// export default function EventsListModal({
//   visible,
//   onClose,
//   events,
//   myCity,
// }: {
//   visible: boolean;
//   onClose: () => void;
//   events: EventPin[];
//   myCity: string;
// }) {
//   const [tab, setTab] = useState<"my" | "other">("my");
//   const [q, setQ] = useState("");

//   const myCityKey = useMemo(() => normalizeCity(myCity), [myCity]);

//   const myCityEvents = useMemo(() => {
//     const base = (events || []).filter((e) => (e.address || "").trim().length > 0);
//     if (!myCityKey) return [];
//     return base.filter((e) => normalizeCity(extractCityState(e.address).city) === myCityKey);
//   }, [events, myCityKey]);

//   const otherCityEvents = useMemo(() => {
//     const base = (events || []).filter((e) => (e.address || "").trim().length > 0);
//     const query = normalizeCity(q);
//     if (!query) return [];
//     return base.filter((e) => {
//       const { city, state } = extractCityState(e.address);
//       const cityKey = normalizeCity(city);
//       const fullKey = normalizeQuery(e.address || "");
//       const cityStateKey = normalizeQuery([city, state].filter(Boolean).join(" "));
//       return cityKey.includes(query) || cityStateKey.includes(query) || fullKey.includes(query);
//     });
//   }, [events, q]);

//   const groupedMy = useMemo(() => groupByDate(myCityEvents), [myCityEvents]);
//   const groupedOther = useMemo(() => groupByDate(otherCityEvents), [otherCityEvents]);
//   const showing = tab === "my" ? groupedMy : groupedOther;

//   const headerPillText = tab === "my" ? `📍 ${formatHeaderCity(myCity)}` : "🌎 Explore";

//   return (
//     <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
//       <View style={styles.root}>
//         {/* Backdrop */}
//         <Pressable style={styles.backdrop} onPress={onClose} />

//         {/* Sheet */}
//         <View style={styles.sheet}>
//           {/* Grabber */}
//           <View style={styles.grabberWrap}>
//             <View style={styles.grabber} />
//           </View>

//           {/* Top header */}
//           <View style={styles.top}>
//             <View style={{ flex: 1 }}>
//               <Text style={styles.hTitle}>Events</Text>
//               <View style={styles.pillRow}>
//                 <View style={styles.headerPill}>
//                   <Text style={styles.headerPillText}>{headerPillText}</Text>
//                 </View>

//                 <View style={styles.countPill}>
//                   <Text style={styles.countPillText}>
//                     {tab === "my" ? myCityEvents.length : otherCityEvents.length}
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.9}>
//               <Text style={styles.closeText}>✕</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Tabs (segmented control) */}
//           <View style={styles.segmentWrap}>
//             <View style={styles.segment}>
//               <TouchableOpacity
//                 activeOpacity={0.9}
//                 onPress={() => setTab("my")}
//                 style={[styles.segmentBtn, tab === "my" && styles.segmentBtnActive]}
//               >
//                 <Text style={[styles.segmentText, tab === "my" && styles.segmentTextActive]}>
//                   Your city
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 activeOpacity={0.9}
//                 onPress={() => setTab("other")}
//                 style={[styles.segmentBtn, tab === "other" && styles.segmentBtnActive]}
//               >
//                 <Text style={[styles.segmentText, tab === "other" && styles.segmentTextActive]}>
//                   Other city
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Search (Other) */}
//           {tab === "other" && (
//             <View style={styles.searchCard}>
//               <Text style={styles.searchLabel}>Search city</Text>
//               <View style={styles.searchRow}>
//                 <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.75)" />

//                 <TextInput
//                   value={q}
//                   onChangeText={setQ}
//                   placeholder="New York, Boston, Potsdam…"
//                   placeholderTextColor="rgba(255,255,255,0.55)"
//                   style={styles.searchInput}
//                   autoCorrect={false}
//                   autoCapitalize="words"
//                   returnKeyType="search"
//                 />

//                 {!!q && (
//                   <TouchableOpacity onPress={() => setQ("")} style={styles.xBtn} activeOpacity={0.9}>
//                     <Text style={styles.xBtnText}>×</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>

//               <Text style={styles.searchHint}>
//                 Tip: “NYC” and “New York” both work.
//               </Text>
//             </View>
//           )}

//           {/* Content */}
//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={{ paddingBottom: 24 }}
//           >
//             {tab === "other" && !q.trim() ? (
//               <View style={styles.emptyWrap}>
//                 <Text style={styles.emptyEmoji}>🗺️</Text>
//                 <Text style={styles.emptyTitle}>Find events anywhere</Text>
//                 <Text style={styles.emptySub}>Search a city to see events grouped by date.</Text>
//               </View>
//             ) : showing.length === 0 ? (
//               <View style={styles.emptyWrap}>
//                 <Text style={styles.emptyEmoji}>{tab === "my" ? "🎈" : "🔎"}</Text>
//                 <Text style={styles.emptyTitle}>No events found</Text>
//                 <Text style={styles.emptySub}>
//                   {tab === "my"
//                     ? myCityKey
//                       ? "Nothing in your city yet."
//                       : "Location is unavailable."
//                     : "Try a different city name."}
//                 </Text>
//               </View>
//             ) : (
//               showing.map((g) => (
//                 <View key={g.date} style={styles.section}>
//                   <View style={styles.sectionHeader}>
//                     <Text style={styles.sectionTitle}>{niceDateLabel(g.date)}</Text>
//                     <View style={styles.sectionLine} />
//                     <Text style={styles.sectionCount}>{g.items.length}</Text>
//                   </View>

//                   {g.items.map((e, idx) => {
//                     const { city, state } = extractCityState(e.address);
//                     const cityText = [city, state].filter(Boolean).join(", ") || "Unknown city";

//                     return (
//                       <View key={`${e.title}-${e.lat}-${e.lng}-${idx}`} style={styles.card}>
//                         <View style={styles.cardLeft}>
//                           <View style={styles.emojiBubble}>
//                             <Text style={styles.emojiText}>{e.emoji ?? "📍"}</Text>
//                           </View>
//                         </View>

//                         <View style={styles.cardMid}>
//                           <Text numberOfLines={1} style={styles.cardTitle}>
//                             {e.title}
//                           </Text>
//                           <Text numberOfLines={1} style={styles.cardMeta}>
//                             {cityText}
//                             {e.when ? `  •  ${e.when}` : ""}
//                           </Text>
//                         </View>

//                         <View style={styles.cardRight}>
//                           <View style={styles.chevron}>
//                             <Text style={styles.chevronText}>›</Text>
//                           </View>
//                         </View>
//                       </View>
//                     );
//                   })}
//                 </View>
//               ))
//             )}
//           </ScrollView>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1, justifyContent: "flex-end" },
//   backdrop: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(2,6,23,0.60)",
//   },

//   sheet: {
//     backgroundColor: "#0B1220",
//     borderTopLeftRadius: 26,
//     borderTopRightRadius: 26,
//     minHeight: "86%",
//     maxHeight: "96%",
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOpacity: 0.35,
//     shadowRadius: 24,
//     shadowOffset: { width: 0, height: -12 },
//   },

//   grabberWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
//   grabber: { width: 54, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)" },

//   top: {
//     paddingHorizontal: 16,
//     paddingTop: 8,
//     paddingBottom: 10,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   hTitle: {
//     color: "#fff",
//     fontSize: 22,
//     fontWeight: "900",
//     letterSpacing: 0.2,
//   },

//   pillRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
//   headerPill: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 999,
//     backgroundColor: "rgba(255,255,255,0.10)",
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(255,255,255,0.10)",
//   },
//   headerPillText: { color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 12 },

//   countPill: {
//     minWidth: 34,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     borderRadius: 999,
//     backgroundColor: "rgba(10,132,255,0.22)",
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(10,132,255,0.35)",
//   },
//   countPillText: { color: "#fff", fontWeight: "900", fontSize: 12 },

//   closeBtn: {
//     width: 42,
//     height: 42,
//     borderRadius: 14,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(255,255,255,0.10)",
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(255,255,255,0.12)",
//   },
//   closeText: { color: "#fff", fontSize: 16, fontWeight: "900" },

//   segmentWrap: { paddingHorizontal: 16, paddingBottom: 10 },
//   segment: {
//     flexDirection: "row",
//     backgroundColor: "rgba(255,255,255,0.08)",
//     borderRadius: 999,
//     padding: 4,
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(255,255,255,0.10)",
//   },
//   segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
//   segmentBtnActive: {
//     backgroundColor: "rgba(10,132,255,0.95)",
//     shadowColor: "#0A84FF",
//     shadowOpacity: 0.35,
//     shadowRadius: 14,
//     shadowOffset: { width: 0, height: 10 },
//   },
//   segmentText: { color: "rgba(255,255,255,0.80)", fontWeight: "900" },
//   segmentTextActive: { color: "#fff" },

//   searchCard: {
//     marginHorizontal: 16,
//     borderRadius: 18,
//     padding: 14,
//     backgroundColor: "rgba(255,255,255,0.08)",
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(255,255,255,0.10)",
//     marginBottom: 10,
//   },
//   searchLabel: { color: "rgba(255,255,255,0.85)", fontWeight: "900", fontSize: 12, marginBottom: 10 },
//   searchRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 14,
//     paddingHorizontal: 12,
//     paddingVertical: Platform.OS === "ios" ? 12 : 10,
//     backgroundColor: "rgba(2,6,23,0.55)",
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(255,255,255,0.10)",
//     gap: 8,
//   },
//   searchIcon: { color: "rgba(255,255,255,0.75)", fontWeight: "900" },
//   searchInput: { flex: 1, color: "#fff", fontWeight: "900" },
//   xBtn: {
//     width: 30,
//     height: 30,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(255,255,255,0.12)",
//   },
//   xBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", lineHeight: 18 },
//   searchHint: { marginTop: 10, color: "rgba(255,255,255,0.55)", fontWeight: "700", fontSize: 12 },

//   section: { paddingHorizontal: 16, paddingTop: 12 },
//   sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
//   sectionTitle: { color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 13 },
//   sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.10)" },
//   sectionCount: { color: "rgba(255,255,255,0.60)", fontWeight: "900", fontSize: 12 },

//   card: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     padding: 14,
//     borderRadius: 18,
//     backgroundColor: "rgba(255,255,255,0.08)",
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(255,255,255,0.10)",
//     marginBottom: 10,
//   },
//   cardLeft: {},
//   emojiBubble: {
//     width: 44,
//     height: 44,
//     borderRadius: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(10,132,255,0.18)",
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(10,132,255,0.30)",
//   },
//   emojiText: { fontSize: 20 },

//   cardMid: { flex: 1 },
//   cardTitle: { color: "#fff", fontWeight: "900", fontSize: 14 },
//   cardMeta: { marginTop: 4, color: "rgba(255,255,255,0.65)", fontWeight: "800", fontSize: 12 },

//   cardRight: {},
//   chevron: {
//     width: 34,
//     height: 34,
//     borderRadius: 14,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(255,255,255,0.08)",
//     borderWidth: StyleSheet.hairlineWidth,
//     borderColor: "rgba(255,255,255,0.10)",
//   },
//   chevronText: { color: "rgba(255,255,255,0.85)", fontSize: 22, fontWeight: "900", marginTop: -2 },

//   emptyWrap: { paddingHorizontal: 16, paddingTop: 32, paddingBottom: 22, alignItems: "center" },
//   emptyEmoji: { fontSize: 34, marginBottom: 10 },
//   emptyTitle: { color: "#fff", fontWeight: "900", fontSize: 18, textAlign: "center" },
//   emptySub: {
//     marginTop: 8,
//     color: "rgba(255,255,255,0.65)",
//     fontWeight: "700",
//     textAlign: "center",
//     lineHeight: 18,
//   },
// });














// components/List/EventsListModal.tsx
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
  _id?: string;
  title: string;
  lat: number;
  lng: number;
  emoji: string;
  kind?: string;
  priceCents?: number | string | null;
  when?: string;
  address?: string;
  date?: string;
  time?: string;
  location?: {
    city?: string;
    state?: string;
    admin1?: string;
    countryCode?: string;
    formattedAddress?: string;
    address?: string;
  };
};

// ✅ Get city from event — tries location.city first, then parses formattedAddress
function getEventCity(e: EventPin): string {
  const locCity = (e?.location?.city || "").trim();
  if (locCity) return locCity;

  const addr = (e?.location?.formattedAddress || e?.address || "").trim();
  if (!addr) return "";

  // "Kalani Nagar, Indore, Madhya Pradesh 452005, India" → parts[1] = "Indore"
  const parts = addr.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return parts[0] || "";
}

function normalizeCity(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function parseDateKey(e: EventPin) {
  if (e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) return e.date;
  const d = (e.when || "").split("·")[0]?.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "No date";
}

function groupByDate(list: EventPin[]) {
  const m = new Map<string, EventPin[]>();
  for (const e of list) {
    const k = parseDateKey(e);
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

function niceDateLabel(key: string) {
  if (key === "No date") return "No date";
  try {
    const d = new Date(key + "T12:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return key;
  }
}

function getKindBadge(kind?: string, priceCents?: number | string | null) {
  const k = (kind || "free").toLowerCase();
  if (k === "service")
    return { label: "BOOK", bg: "rgba(139,92,246,0.22)", border: "rgba(139,92,246,0.45)", text: "#C084FC" };
  if (k === "paid" || k === "event_paid") {
    const price = priceCents ? `₹${Math.round(Number(priceCents) / 100)}` : "PAID";
    return { label: price, bg: "rgba(234,179,8,0.18)", border: "rgba(234,179,8,0.40)", text: "#FACC15" };
  }
  return { label: "FREE", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.35)", text: "#4ADE80" };
}

type KindFilter = "all" | "free" | "paid" | "service";

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
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const myCityKey = useMemo(() => normalizeCity(myCity), [myCity]);

  // ✅ Kind filter
  const kindFiltered = useMemo(() => {
    if (kindFilter === "all") return events || [];
    return (events || []).filter((e) => {
      const k = (e.kind || "free").toLowerCase();
      if (kindFilter === "free") return k === "free" || k === "event_free";
      if (kindFilter === "paid") return k === "paid" || k === "event_paid";
      if (kindFilter === "service") return k === "service";
      return true;
    });
  }, [events, kindFilter]);

  // ✅ Your city — uses location.city, not address parsing
  const myCityEvents = useMemo(() => {
    if (!myCityKey) return kindFiltered;
    return kindFiltered.filter((e) => {
      const evCity = normalizeCity(getEventCity(e));
      return evCity.includes(myCityKey);
    });
  }, [kindFiltered, myCityKey]);

  // ✅ Other city search
  const otherCityEvents = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    if (!query) return [];
    return kindFiltered.filter((e) => {
      const evCity = normalizeCity(getEventCity(e));
      const fullAddr = (e?.location?.formattedAddress || e?.address || "").toLowerCase();
      return evCity.includes(query) || fullAddr.includes(query);
    });
  }, [kindFiltered, q]);

  const groupedMy = useMemo(() => groupByDate(myCityEvents), [myCityEvents]);
  const groupedOther = useMemo(() => groupByDate(otherCityEvents), [otherCityEvents]);
  const showing = tab === "my" ? groupedMy : groupedOther;
  const count = tab === "my" ? myCityEvents.length : otherCityEvents.length;

  const kindPills: { key: KindFilter; label: string; color: string }[] = [
    { key: "all",     label: "All",       color: "#fff"    },
    { key: "free",    label: "⚪ Free",   color: "#4ADE80" },
    { key: "paid",    label: "🟡 Paid",   color: "#FACC15" },
    { key: "service", label: "🟣 Service",color: "#C084FC" },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.top}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hTitle}>Events Nearby</Text>
              <View style={styles.pillRow}>
                <View style={styles.headerPill}>
                  <Text style={styles.headerPillText}>
                    {tab === "my" ? `📍 ${(myCity || "Your city").trim()}` : "🌎 Explore"}
                  </Text>
                </View>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{count}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.9}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Kind filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kindRow}
            style={{ maxHeight: 44 }}
          >
            {kindPills.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setKindFilter(p.key)}
                activeOpacity={0.8}
                style={[
                  styles.kindPill,
                  kindFilter === p.key && { borderColor: p.color, backgroundColor: `${p.color}22` },
                ]}
              >
                <Text style={[styles.kindPillText, kindFilter === p.key && { color: p.color }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Your city / Other city tabs */}
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

          {/* Search — Other city only */}
          {tab === "other" && (
            <View style={styles.searchCard}>
              <Text style={styles.searchLabel}>Search city</Text>
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.75)" />
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Indore, Delhi, Mumbai…"
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
            </View>
          )}

          {/* Events list */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {tab === "other" && !q.trim() ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🗺️</Text>
                <Text style={styles.emptyTitle}>Find events anywhere</Text>
                <Text style={styles.emptySub}>Search a city to see events.</Text>
              </View>
            ) : showing.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>{tab === "my" ? "📍" : "🔎"}</Text>
                <Text style={styles.emptyTitle}>No events found</Text>
                <Text style={styles.emptySub}>
                  {tab === "my"
                    ? myCityKey ? "Nothing in your city yet." : "Location unavailable."
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
                    const cityText = getEventCity(e) || "Unknown city";
                    const badge = getKindBadge(e.kind, e.priceCents);
                    const whenText = e.when || (e.date ? `${e.date}${e.time ? " · " + e.time : ""}` : "");

                    return (
                      <View key={`${e._id ?? e.title}-${idx}`} style={styles.card}>
                        <View style={styles.emojiBubble}>
                          <Text style={styles.emojiText}>{e.emoji ?? "📍"}</Text>
                        </View>

                        <View style={styles.cardMid}>
                          <Text numberOfLines={1} style={styles.cardTitle}>{e.title}</Text>
                          <Text numberOfLines={1} style={styles.cardMeta}>
                            {cityText}{whenText ? `  •  ${whenText}` : ""}
                          </Text>
                        </View>

                        <View style={[styles.kindBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                          <Text style={[styles.kindBadgeText, { color: badge.text }]}>{badge.label}</Text>
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.60)" },
  sheet: {
    backgroundColor: "#0B1220",
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    minHeight: "86%", maxHeight: "96%", overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 24,
    shadowOffset: { width: 0, height: -12 },
  },
  grabberWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  grabber: { width: 54, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)" },
  top: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  hTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  pillRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  headerPill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)",
  },
  headerPillText: { color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 12 },
  countPill: {
    minWidth: 34, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "rgba(10,132,255,0.22)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(10,132,255,0.35)",
  },
  countPillText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  closeBtn: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)",
  },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  kindRow: { paddingHorizontal: 16, gap: 8, flexDirection: "row", alignItems: "center", paddingBottom: 10 },
  kindPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  kindPillText: { color: "rgba(255,255,255,0.75)", fontWeight: "800", fontSize: 12 },
  segmentWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  segment: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999, padding: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)",
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  segmentBtnActive: {
    backgroundColor: "rgba(10,132,255,0.95)",
    shadowColor: "#0A84FF", shadowOpacity: 0.35, shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  segmentText: { color: "rgba(255,255,255,0.80)", fontWeight: "900" },
  segmentTextActive: { color: "#fff" },
  searchCard: {
    marginHorizontal: 16, borderRadius: 18, padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)", marginBottom: 10,
  },
  searchLabel: { color: "rgba(255,255,255,0.85)", fontWeight: "900", fontSize: 12, marginBottom: 10 },
  searchRow: {
    flexDirection: "row", alignItems: "center", borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: "rgba(2,6,23,0.55)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)", gap: 8,
  },
  searchInput: { flex: 1, color: "#fff", fontWeight: "900" },
  xBtn: {
    width: 30, height: 30, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  xBtnText: { color: "#fff", fontSize: 18, fontWeight: "900", lineHeight: 18 },
  section: { paddingHorizontal: 16, paddingTop: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  sectionTitle: { color: "rgba(255,255,255,0.92)", fontWeight: "900", fontSize: 13 },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.10)" },
  sectionCount: { color: "rgba(255,255,255,0.60)", fontWeight: "900", fontSize: 12 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
    borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)", marginBottom: 10,
  },
  emojiBubble: {
    width: 44, height: 44, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(10,132,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(10,132,255,0.30)",
  },
  emojiText: { fontSize: 20 },
  cardMid: { flex: 1 },
  cardTitle: { color: "#fff", fontWeight: "900", fontSize: 14 },
  cardMeta: { marginTop: 4, color: "rgba(255,255,255,0.65)", fontWeight: "800", fontSize: 12 },
  kindBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  kindBadgeText: { fontSize: 10, fontWeight: "900" },
  emptyWrap: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 22, alignItems: "center" },
  emptyEmoji: { fontSize: 34, marginBottom: 10 },
  emptyTitle: { color: "#fff", fontWeight: "900", fontSize: 18, textAlign: "center" },
  emptySub: { marginTop: 8, color: "rgba(255,255,255,0.65)", fontWeight: "700", textAlign: "center", lineHeight: 18 },
});