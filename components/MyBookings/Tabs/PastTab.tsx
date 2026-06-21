// components/MyBookings/Tabs/PastTab.tsx
import React from "react";
import {
  View, Text, Image, RefreshControl,
  SectionList, StyleSheet, TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { EventDoc } from "./CreatedTab";

const C = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#F1F5F9",
  ink: "#111827",
  muted: "#6B7280",
  accent: "#6C63FF",
  accentLight: "#EEF2FF",
  purple: "#F5F3FF",
  purpleText: "#7C3AED",
  blue: "#EFF6FF",
  blueText: "#2563EB",
};

export default function PastTab({
  past, refreshing, onRefresh, onPressEvent, onSummaryEvent,
}: {
  past: EventDoc[]; refreshing: boolean;
  onRefresh: () => void; onPressEvent: (ev: EventDoc) => void;
  onSummaryEvent?: (ev: EventDoc) => void;
}) {
  const sections: any[] = past.length ? [{ title: "PAST EVENTS 🍪", data: past }] : [];

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item._id}
      contentContainerStyle={T.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      ListEmptyComponent={
        <View style={T.empty}>
          <View style={T.emptyImgBox}>
            <Ionicons name="time-outline" size={60} color={C.muted} />
          </View>
          <Text style={T.emptyTitle}>No Past Events</Text>
          <Text style={T.emptySub}>Your past experiences will show up here.</Text>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={T.sectionTitle}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <EventCard
          e={item}
          onPress={() => onPressEvent(item)}
          onSummary={() => onSummaryEvent?.(item)}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

function EventCard({ e, onPress, onSummary }: { e: EventDoc; onPress: () => void; onSummary: () => void }) {
  const banner = e.bannerUri || e.bannerImage || "";
  const price = e.priceCents ? `₹${(e.priceCents / 100).toFixed(0)}` : "FREE";

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
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.05)" }} />
        <View style={T.badgeLeft}>
          <View style={T.endedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
            <Text style={T.badgeText}>Ended {e.kind === "service" ? "Service" : "Event"}</Text>
          </View>
        </View>
        <View style={T.badgeRight}>
          <View style={T.priceBadge}>
            <Text style={T.priceText}>{price}</Text>
          </View>
        </View>
      </View>

      {/* CONTENT SECTION */}
      <View style={T.body}>
        <View style={T.titleRow}>
          <Text style={T.title}>{e.title || "Event"}</Text>
          <Ionicons name="share-social-outline" size={20} color={C.accent} />
        </View>

        <View style={T.tagRow}>
          <View style={[T.tag, { backgroundColor: C.blue }]}>
            <Text style={[T.tagText, { color: C.blueText }]}>Paid event</Text>
          </View>
          <View style={[T.tag, { backgroundColor: C.purple }]}>
            <Ionicons name="bookmark" size={10} color={C.purpleText} />
            <Text style={[T.tagText, { color: C.purpleText }]}>Attended</Text>
          </View>
        </View>

        {/* INFO GRID */}
        <View style={T.grid}>
          <View style={T.gridCell}>
            <Text style={T.gridLabel}>WHEN</Text>
            <Text style={T.gridValue}>{e.date || "Past"}</Text>
          </View>
          <View style={T.gridCell}>
            <Text style={T.gridLabel}>WHERE</Text>
            <Text style={T.gridValue} numberOfLines={1}>{e.location?.city || "Unknown"}</Text>
          </View>
        </View>

        {/* ACTION BUTTON */}
        <TouchableOpacity style={T.summaryBtn} onPress={(ev) => {
          ev.stopPropagation();
          onSummary();
        }}>
          <Ionicons name="document-text-outline" size={18} color={C.ink} />
          <Text style={T.summaryBtnText}>View Summary</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const T = StyleSheet.create({
  list: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: C.muted, marginBottom: 15, textTransform: "uppercase", letterSpacing: 0.5 },

  card: {
    backgroundColor: C.white, borderRadius: 28, marginBottom: 25,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 15, elevation: 3,
    overflow: "hidden",
  },
  imgContainer: { width: "100%", height: 160 },
  img: { width: "100%", height: "100%" },
  badgeLeft: { position: "absolute", top: 12, left: 12 },
  badgeRight: { position: "absolute", top: 12, right: 12 },
  endedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(108,99,255,0.85)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  priceBadge: { backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  priceText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  body: { padding: 20 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "800", color: C.ink, flex: 1, marginRight: 10 },

  tagRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  tag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: "800" },

  grid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  gridCell: { flex: 1, backgroundColor: "#F8FAFC", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#F1F5F9" },
  gridLabel: { fontSize: 8, fontWeight: "900", color: C.muted, marginBottom: 4, letterSpacing: 0.5 },
  gridValue: { fontSize: 11, fontWeight: "700", color: C.ink },

  summaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#EFF6FF", paddingVertical: 14, borderRadius: 16
  },
  summaryBtnText: { fontSize: 14, fontWeight: "800", color: C.ink },

  empty: { alignItems: "center", justifyContent: "center", marginTop: 80 },
  emptyImgBox: { width: 120, height: 120, borderRadius: 30, backgroundColor: C.white, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: "center", paddingHorizontal: 40 },
});
