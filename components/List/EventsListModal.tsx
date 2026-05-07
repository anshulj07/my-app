// components/List/EventsListModal.tsx
import React, { useMemo, useState, useEffect } from "react";
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
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const { width: W } = Dimensions.get("window");

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function getEventCity(e: EventPin): string {
  const locCity = (e?.location?.city || "").trim();
  if (locCity) return locCity;
  const addr = (e?.location?.formattedAddress || e?.address || "").trim();
  if (!addr) return "";
  const parts = addr.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return parts[0] || "";
}

function normalize(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Haversine distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getDayLabel(dateStr: string) {
  if (!dateStr || dateStr === "No date") return "Upcoming";
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T12:00:00");
    target.setHours(0, 0, 0, 0);

    const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff > 1 && diff < 7) {
      return target.toLocaleDateString("en-IN", { weekday: "long" });
    }
    return target.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getKindBadge(kind?: string, priceCents?: number | string | null) {
  const k = (kind || "free").toLowerCase();
  if (k === "service")
    return { label: "BOOK", color: "#C084FC", bg: "rgba(139,92,246,0.15)" };
  if (k === "paid" || k === "event_paid") {
    const price = priceCents ? `₹${Math.round(Number(priceCents) / 100)}` : "PAID";
    return { label: price, color: "#FACC15", bg: "rgba(234,179,8,0.15)" };
  }
  return { label: "FREE", color: "#4ADE80", bg: "rgba(34,197,94,0.12)" };
}

type KindFilter = "all" | "free" | "paid" | "service";

// ─── Component ──────────────────────────────────────────────────────────────

export default function EventsListModal({
  visible,
  onClose,
  events,
  myCity,
  myLoc,
  onPinPress,
}: {
  visible: boolean;
  onClose: () => void;
  events: EventPin[];
  myCity: string;
  myLoc: { lat: number; lng: number } | null;
  onPinPress?: (pin: EventPin) => void;
}) {
  const { userId } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<"city" | "other">("city");
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const processedEvents = useMemo(() => {
    let list = (events || []).filter(e => {
      const st = String((e as any).status || "active").toLowerCase();
      const isMine = userId && String((e as any).creatorClerkId) === userId;
      return st === "active" || st === "live" || (st === "paused" && isMine);
    });

    // 1. Kind Filter
    if (kindFilter !== "all") {
      list = list.filter(e => {
        const k = (e.kind || "free").toLowerCase();
        if (kindFilter === "free") return k === "free" || k === "event_free";
        if (kindFilter === "paid") return k === "paid" || k === "event_paid";
        if (kindFilter === "service") return k === "service";
        return true;
      });
    }

    // 2. Location Scope Filter (City vs All)
    const myCityNorm = normalize(myCity);
    if (myCityNorm && !q) {
      if (scopeFilter === "city") {
        list = list.filter(e => normalize(getEventCity(e)).includes(myCityNorm));
      }
      // If scopeFilter is "other" (renamed to "all" internally for clarity), show everything.
    }

    // 3. Search Filter (Overrides location scope)
    const query = normalize(q);
    if (query) {
      list = list.filter(e => {
        const city = normalize(getEventCity(e));
        const addr = normalize(e?.location?.formattedAddress || e?.address || "");
        const title = normalize(e.title);
        return city.includes(query) || addr.includes(query) || title.includes(query);
      });
    }

    // 4. Attach metadata (Distance)
    const withMeta = list.map(e => {
      let dist = 0;
      if (myLoc) dist = getDistance(myLoc.lat, myLoc.lng, e.lat, e.lng);
      return { ...e, _distance: dist };
    });

    // 5. Sort by date, then distance
    withMeta.sort((a, b) => {
      const da = a.date || "9999";
      const db = b.date || "9999";
      if (da !== db) return da.localeCompare(db);
      return a._distance - b._distance;
    });

    // 6. Group by Day Label
    const groups: { label: string; items: any[] }[] = [];
    withMeta.forEach(e => {
      const label = getDayLabel(e.date || "");
      let g = groups.find(x => x.label === label);
      if (!g) {
        g = { label, items: [] };
        groups.push(g);
      }
      g.items.push(e);
    });

    return groups;
  }, [events, kindFilter, scopeFilter, q, myLoc, myCity]);

  const kindPills: { key: KindFilter; label: string; color: string }[] = [
    { key: "all",     label: "All",       color: "#FFFFFF" },
    { key: "free",    label: "Free",      color: "#4ADE80" },
    { key: "paid",    label: "Paid",      color: "#FACC15" },
    { key: "service", label: "Service",   color: "#C084FC" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.root}>
        <Pressable style={S.backdrop} onPress={onClose} />

        <BlurView intensity={Platform.OS === "ios" ? 80 : 100} tint="dark" style={S.sheet}>
          <LinearGradient colors={["rgba(20,20,20,0.4)", "rgba(10,10,10,0.8)"]} style={S.gradient}>
            
            {/* Grabber */}
            <View style={S.grabberWrap}>
              <View style={S.grabber} />
            </View>

            {/* Header */}
            <View style={S.header}>
              <View>
                <Text style={S.title}>Events Nearby</Text>
                <Text style={S.subtitle}>
                  {q ? `Searching for "${q}"` : `Discover what's happening in ${myCity || "your city"}`}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={S.closeBtn}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={S.searchBox}>
              <View style={S.searchInner}>
                <Ionicons name="search" size={18} color="#666" />
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search events, cities, venues..."
                  placeholderTextColor="#555"
                  style={S.searchInput}
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
                {!!q && Platform.OS !== "ios" && (
                  <TouchableOpacity onPress={() => setQ("")}>
                    <Ionicons name="close-circle" size={18} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Scope & Kind Filter */}
            <View style={S.actionRow}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={S.filterScroll}
                style={{ flexGrow: 0 }}
              >
                {/* City vs All Toggle */}
                <View style={S.scopeContainer}>
                  <TouchableOpacity
                    onPress={() => setScopeFilter("city")}
                    style={[S.scopeBtn, scopeFilter === "city" && S.scopeBtnActive]}
                  >
                    <Ionicons name="navigate" size={14} color={scopeFilter === "city" ? "#FFF" : "#666"} />
                    <Text style={[S.scopeBtnText, scopeFilter === "city" && S.scopeBtnActiveText]}>
                      {myCity || "Nearby"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setScopeFilter("other")}
                    style={[S.scopeBtn, scopeFilter === "other" && S.scopeBtnActive]}
                  >
                    <Ionicons name="planet" size={14} color={scopeFilter === "other" ? "#FFF" : "#666"} />
                    <Text style={[S.scopeBtnText, scopeFilter === "other" && S.scopeBtnActiveText]}>
                      All Cities
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={S.vDivider} />

                {/* Filter Icon */}
                <TouchableOpacity 
                  style={[S.filterIconBtn, showFilterOptions && S.filterIconBtnActive]} 
                  onPress={() => setShowFilterOptions(!showFilterOptions)}
                >
                  <Ionicons name="options" size={18} color={showFilterOptions ? "#00E676" : "#888"} />
                  {kindFilter !== "all" && <View style={S.filterBadge} />}
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Kind Filter Row (Appears below) */}
            {showFilterOptions && (
              <View style={S.filterOptionsRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
                  {kindPills.map(p => (
                    <TouchableOpacity
                      key={p.key}
                      onPress={() => { setKindFilter(p.key); }}
                      style={[
                        S.filterPill,
                        kindFilter === p.key && { backgroundColor: p.color + "20", borderColor: p.color + "60" }
                      ]}
                    >
                      <View style={[S.pillDot, { backgroundColor: p.color }]} />
                      <Text style={[S.filterPillText, kindFilter === p.key && { color: p.color }]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* List */}
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={S.listContent}
            >
              {processedEvents.length === 0 ? (
                <View style={S.empty}>
                  <View style={S.emptyIcon}>
                    <Ionicons name="calendar-outline" size={40} color="#333" />
                  </View>
                  <Text style={S.emptyTitle}>No events found</Text>
                  <Text style={S.emptySub}>
                    Try adjusting your search or filters to find more events.
                  </Text>
                  {q && (
                    <TouchableOpacity style={S.clearBtn} onPress={() => setQ("")}>
                      <Text style={S.clearBtnText}>Clear Search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                processedEvents.map(group => (
                  <View key={group.label} style={S.section}>
                    <View style={S.sectionHeader}>
                      <Text style={S.sectionLabel}>{group.label}</Text>
                      <View style={S.sectionLine} />
                    </View>

                    {group.items.map((e, idx) => {
                      const badge = getKindBadge(e.kind, e.priceCents);
                      const city = getEventCity(e);
                      const time = e.time || "";
                      const dist = e._distance < 1 ? `${(e._distance * 1000).toFixed(0)}m` : `${e._distance.toFixed(1)}km`;

                      return (
                        <TouchableOpacity
                          key={`${e._id ?? e.title}-${idx}`}
                          style={S.card}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (onPinPress) {
                              onPinPress(e);
                            } else {
                              onClose();
                              router.push({
                                pathname: "/newApp/event-detail" as any,
                                params: { eventId: e._id || "", kind: e.kind || "free", title: e.title || "Event", emoji: e.emoji || "📍" },
                              });
                            }
                          }}
                        >
                          {/* Emoji / Icon */}
                          <View style={S.cardEmojiWrap}>
                            <Text style={S.cardEmoji}>{e.emoji || "📍"}</Text>
                            <View style={S.emojiGlow} />
                          </View>

                          {/* Info */}
                          <View style={S.cardInfo}>
                            <Text numberOfLines={1} style={S.cardTitle}>{e.title}</Text>
                            <View style={S.cardMeta}>
                              <Text style={S.metaText}>{city}</Text>
                              {time && (
                                <>
                                  <View style={S.dot} />
                                  <Text style={S.metaText}>{time}</Text>
                                </>
                              )}
                              <View style={S.dot} />
                              <Text style={S.metaText}>{dist} away</Text>
                            </View>
                          </View>

                          {/* Badge */}
                          <View style={[S.badge, { backgroundColor: badge.bg, borderColor: badge.color + "30" }]}>
                            <Text style={[S.badgeText, { color: badge.color }]}>{badge.label}</Text>
                          </View>
                          
                          <Ionicons name="chevron-forward" size={14} color="#444" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>

          </LinearGradient>
        </BlurView>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    height: "90%",
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  gradient: { flex: 1 },
  grabberWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" },
  
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "900", color: "#FFF", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: "#888", marginTop: 4 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },

  searchBox: { paddingHorizontal: 20, marginBottom: 16 },
  searchInner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 14 : 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: { flex: 1, marginLeft: 12, color: "#FFF", fontSize: 15, fontWeight: "600" },

  filterScroll: { paddingHorizontal: 20, gap: 10, paddingBottom: 15 },
  filterPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  filterPillText: { fontSize: 13, fontWeight: "800", color: "#888" },
  vDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "center", marginHorizontal: 8 },
  
  scopeContainer: { 
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.06)", 
    borderRadius: 14, padding: 4, gap: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" 
  },
  scopeBtn: { 
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 
  },
  scopeBtnActive: { backgroundColor: "rgba(255,255,255,0.1)" },
  scopeBtnText: { fontSize: 13, fontWeight: "800", color: "#666" },
  scopeBtnActiveText: { color: "#FFF" },

  filterIconBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)"
  },
  filterIconBtnActive: { borderColor: "rgba(0,230,118,0.4)", backgroundColor: "rgba(0,230,118,0.05)" },
  filterBadge: { 
    position: "absolute", top: 10, right: 10, width: 6, height: 6, 
    borderRadius: 3, backgroundColor: "#00E676", borderWidth: 1, borderColor: "#000" 
  },
  kindOptions: { flexDirection: "row", gap: 8, marginLeft: 8 },
  actionRow: { marginBottom: 12 },
  filterOptionsRow: { 
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
    marginBottom: 12
  },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  sectionLabel: { fontSize: 13, fontWeight: "900", color: "#555", textTransform: "uppercase", letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.05)" },

  card: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },
  cardEmojiWrap: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center",
    marginRight: 14,
  },
  emojiGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)",
    transform: [{ scale: 1.1 }],
  },
  cardEmoji: { fontSize: 24, zIndex: 1 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#FFF", marginBottom: 4 },
  cardMeta: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 12, fontWeight: "600", color: "#666" },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#333", marginHorizontal: 6 },
  
  badge: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "900" },

  empty: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
  emptyIcon: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: "rgba(255,255,255,0.03)", 
    alignItems: "center", justifyContent: "center", marginBottom: 20 
  },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: "#FFF", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
  clearBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)" },
  clearBtnText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
});
