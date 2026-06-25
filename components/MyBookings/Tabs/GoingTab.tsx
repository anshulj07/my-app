// components/MyBookings/Tabs/GoingTab.tsx
import React from "react";
import {
  View, Text, Image, RefreshControl,
  SectionList, StyleSheet, TouchableOpacity,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { EventDoc } from "./CreatedTab";

const { width: SW } = Dimensions.get("window");

const C = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#F1F5F9",
  ink: "#0F172A",
  muted: "#64748B",
  accent: "#6366F1",
  accentLight: "#EEF2FF",
  gold: "#F59E0B",
  green: "#10B981",
  red: "#EF4444",
};

export default function GoingTab({
  going, refreshing, onRefresh, onPressEvent,
}: {
  going: EventDoc[]; refreshing: boolean;
  onRefresh: () => void; onPressEvent: (ev: EventDoc) => void;
}) {
  const sections: any[] = going.length ? [{ title: "Upcoming Events", data: going }] : [];

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item._id}
      contentContainerStyle={T.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      ListEmptyComponent={
        <View style={T.empty}>
          <View style={T.emptyImgBox}>
            <Ionicons name="calendar-outline" size={60} color={C.accent} />
          </View>
          <Text style={T.emptyTitle}>Nothing Upcoming</Text>
          <Text style={T.emptySub}>You haven't booked any nomad experiences yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <EventCard e={item} onPress={() => onPressEvent(item)} />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

function EventCard({ e, onPress }: { e: EventDoc; onPress: () => void }) {
  const banner = e.bannerUri || e.bannerImage || "";
  const isPaid = e.kind === "paid" || e.kind === "event_paid" || (e.priceCents && e.priceCents > 0);

  // LIVE Logic
  const start = evStartMs(e);
  const now = Date.now();
  const endTs = e.endsAt ? new Date(e.endsAt).getTime() : start + (4 * 3600000);
  const isLive = (e.status?.toLowerCase() === "live" || e.status?.toLowerCase() === "ongoing") || (now >= start && now <= endTs);

  function evStartMs(ev: EventDoc): number {
    if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
    const date = (ev.date ?? "").trim(); const time = (ev.time ?? "").trim();
    if (date && time) { const t = new Date(`${date} ${time}`).getTime(); if (Number.isFinite(t)) return t; }
    if (date) { const t = new Date(date).getTime(); if (Number.isFinite(t)) return t; }
    return Number.POSITIVE_INFINITY;
  }
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={T.card}>
      {/* IMAGE SECTION */}
      <View style={T.imgContainer}>
        {banner ? (
          <Image source={{ uri: banner }} style={T.img} />
        ) : (
          <View style={[T.img, { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ fontSize: 40 }}>{e.emoji || "📍"}</Text>
          </View>
        )}
        {/* Top Badges */}
        <View style={T.topBadgeRow}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[T.priceBadge, { backgroundColor: isPaid ? C.gold : C.green }]}>
              <Text style={T.priceBadgeText}>
                {isPaid ? "PAID" : "FREE"} EVENT
              </Text>
            </View>
            {isLive && (
              <View style={[T.liveBadge, { marginLeft: 8 }]}>
                <View style={T.liveDot} />
                <Text style={T.liveBadgeText}>LIVE EVENT</Text>
              </View>
            )}
          </View>
        </View>
        <View style={T.bannerOverlay} />
      </View>

      {/* CONTENT SECTION */}
      <View style={T.body}>
        <Text style={T.title} numberOfLines={1}>{e.title || "Untitled Event"}</Text>

        <View style={T.infoGrid}>
          {/* WHEN */}
          <View style={T.infoBox}>
            <Text style={T.infoLabel}>WHEN</Text>
            <View style={T.infoValueRow}>
              <Ionicons name="calendar-clear" size={14} color={C.accent} />
              <Text style={T.infoValueText}>{e.date || "TBD"}</Text>
            </View>
            <Text style={T.infoSub}>{e.time || "09:00 AM"}</Text>
          </View>

          {/* WHERE */}
          <View style={T.infoBox}>
            <Text style={T.infoLabel}>WHERE</Text>
            <View style={T.infoValueRow}>
              <Ionicons name="location" size={14} color={C.accent} />
              <Text style={T.infoValueText} numberOfLines={1}>{e.location?.city || "TBD"}</Text>
            </View>
            <Text style={T.infoSub} numberOfLines={1}>{e.location?.formattedAddress || "Venue TBD"}</Text>
          </View>
        </View>

        {/* FOOTER ROW */}
        <View style={T.footer}>
          <View style={T.attendeeSummary}>
            <View style={T.miniStack}>
              {[1, 2, 3].map(i => (
                <Image
                  key={i}
                  source={{ uri: `https://i.pravatar.cc/100?u=${i}` }}
                  style={[T.miniAvatar, { marginLeft: i === 1 ? 0 : -8 }]}
                />
              ))}
            </View>
            <Text style={T.attendeeText}>{e.attendees?.length || 0} attending</Text>
          </View>

          <TouchableOpacity style={T.viewPassBtn} onPress={onPress}>
            <Text style={T.viewPassText}>VIEW PASS</Text>
            <Ionicons name="arrow-forward" size={14} color={C.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const T = StyleSheet.create({
  list: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: C.white, borderRadius: 24, marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 15, elevation: 5,
    overflow: "hidden",
  },
  imgContainer: { width: "100%", height: 150 },
  img: { width: "100%", height: "100%" },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.05)" },

  topBadgeRow: { position: "absolute", top: 12, left: 12, zIndex: 10 },
  priceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priceBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Outfit_900Black", letterSpacing: 0.5 },

  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "#EF4444" },
  liveBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Outfit_900Black", letterSpacing: 0.5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },

  body: { padding: 18 },
  title: { fontSize: 20, fontFamily: "Outfit_900Black", color: C.ink, marginBottom: 18 },

  infoGrid: { flexDirection: "row", gap: 15, marginBottom: 20 },
  infoBox: { flex: 1, backgroundColor: "#F8FAFC", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#F1F5F9" },
  infoLabel: { fontSize: 9, fontFamily: "Outfit_800ExtraBold", color: C.muted, letterSpacing: 1, marginBottom: 6 },
  infoValueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoValueText: { fontSize: 13, fontFamily: "Outfit_800ExtraBold", color: C.ink, flex: 1 },
  infoSub: { fontSize: 10, color: C.muted, fontFamily: "Outfit_600SemiBold", marginTop: 2 },

  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 15, borderTopWidth: 1, borderTopColor: "#F1F5F9"
  },
  attendeeSummary: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniStack: { flexDirection: "row" },
  miniAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#fff" },
  attendeeText: { fontSize: 11, fontFamily: "Outfit_700Bold", color: C.muted },

  viewPassBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewPassText: { fontSize: 11, fontFamily: "Outfit_900Black", color: C.accent },

  empty: { alignItems: "center", justifyContent: "center", marginTop: 80 },
  emptyImgBox: { width: 100, height: 100, borderRadius: 30, backgroundColor: C.white, alignItems: "center", justifyContent: "center", marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  emptyTitle: { fontSize: 18, fontFamily: "Outfit_800ExtraBold", color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: "center", paddingHorizontal: 40, fontFamily: "Outfit_500Medium" },
});