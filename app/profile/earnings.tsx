import React, { useEffect, useState, useMemo } from "react";
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform, Dimensions, Animated, Image
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const { width: W } = Dimensions.get("window");

// Design Tokens (Matching Profile)
const C = {
  purple: "#8B5CF6",
  purpleBg: "#F5F3FF",
  teal: "#0D9488",
  tealBg: "#F0FDFA",
  tealText: "#0F766E",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberText: "#92400E",
  ink: "#111827",
  muted: "#6B7280",
  card: "#FFFFFF",
  cardBorder: "#E5E7EB",
  inputBg: "#F9FAFB",
};

export default function EarningsDetail() {
  const router = useRouter();
  const { userId } = useAuth();
  
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
  }), [EVENT_API_KEY]);

  const load = async () => {
    if (!API_BASE || !userId) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId)}&limit=500`, { 
        method: "GET", headers 
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load data");
      
      // Filter for events that have ended and had a price
      const list = (Array.isArray(json.createdEvents) ? json.createdEvents : [])
        .filter((e: any) => (e.status === "ended" || e.status === "completed") && e.kind === "paid")
        .sort((a: any, b: any) => new Date(b.endedAt || b.startsAt || 0).getTime() - new Date(a.endedAt || a.startsAt || 0).getTime());
        
      setEvents(list);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalEarnings = events.reduce((acc, e) => acc + (e.finalEarnings || 0), 0);

  return (
    <View style={S.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Earnings History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={S.summaryCard}>
          <Text style={S.summaryLabel}>TOTAL REVENUE</Text>
          <Text style={S.summaryValue}>₹{(totalEarnings / 100).toLocaleString()}</Text>
          <View style={S.summaryMeta}>
            <View style={S.metaPill}>
              <Ionicons name="calendar" size={12} color={C.tealText} />
              <Text style={S.metaText}>{events.length} Paid Events</Text>
            </View>
          </View>
        </View>

        <Text style={S.listTitle}>Breakdown per Event</Text>

        {loading ? (
          <View style={S.center}>
            <ActivityIndicator color={C.teal} size="large" />
            <Text style={S.muted}>Calculating totals...</Text>
          </View>
        ) : err ? (
          <View style={S.center}>
            <Text style={S.err}>{err}</Text>
            <TouchableOpacity onPress={load} style={S.retry}><Text style={S.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : events.length === 0 ? (
          <View style={S.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💰</Text>
            <Text style={S.emptyTitle}>No earnings yet</Text>
            <Text style={S.emptySub}>End your ongoing paid events to see your revenue breakdown here.</Text>
          </View>
        ) : (
          events.map((e, i) => (
            <TouchableOpacity 
              key={e._id} 
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/event-interest/[eventId]",
                  params: { eventId: e._id, kind: e.kind, title: e.title, emoji: e.emoji || "📍" }
                } as any);
              }}
              style={S.eventCard}
            >
              <View style={[S.emojiBox, { backgroundColor: C.tealBg }]}>
                <Text style={{ fontSize: 20 }}>{e.emoji || "🎟"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.eventTitle} numberOfLines={1}>{e.title}</Text>
                <Text style={S.eventDate}>
                  {new Date(e.endedAt || e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={S.amount}>+₹{((e.finalEarnings || 0) / 100).toLocaleString()}</Text>
                <Text style={S.guests}>{e.finalAttendeeCount || 0} guests</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20, paddingBottom: 15,
    backgroundColor: "#fff", borderBottomWidth: 1, borderColor: C.cardBorder,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: C.inputBg },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  scroll: { padding: 20, paddingBottom: 60 },
  summaryCard: {
    backgroundColor: C.teal, borderRadius: 24, padding: 24, marginBottom: 25,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  summaryLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 8 },
  summaryValue: { color: "#fff", fontSize: 34, fontWeight: "900" },
  summaryMeta: { flexDirection: "row", marginTop: 15 },
  metaPill: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  listTitle: { fontSize: 13, fontWeight: "900", color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 15, marginLeft: 4 },
  eventCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    padding: 14, borderRadius: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: C.cardBorder, gap: 12,
  },
  emojiBox: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  eventTitle: { fontSize: 15, fontWeight: "900", color: C.ink, marginBottom: 2 },
  eventDate: { fontSize: 12, color: C.muted, fontWeight: "600" },
  amount: { fontSize: 16, fontWeight: "900", color: C.teal, marginBottom: 2 },
  guests: { fontSize: 11, color: C.muted, fontWeight: "700" },
  center: { alignItems: "center", paddingVertical: 60 },
  err: { color: "#EF4444", fontSize: 14, fontWeight: "700", marginBottom: 10 },
  retry: { backgroundColor: C.teal, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99 },
  retryText: { color: "#fff", fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.muted, fontWeight: "600", textAlign: "center", paddingHorizontal: 30 },
});
