import React, { useEffect, useState, useMemo } from "react";
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform, Dimensions, Animated
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
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
  blue: "#3B82F6",
  blueBg: "#EFF6FF",
};

export default function AttendeesDetail() {
  const router = useRouter();
  const { userId } = useAuth();
  
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
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
      const [evRes, stRes] = await Promise.all([
        fetch(`${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId)}&limit=500`, { 
          method: "GET", headers 
        }),
        fetch(`${API_BASE}/api/users/stats?clerkUserId=${encodeURIComponent(userId)}`, { 
          method: "GET", headers 
        })
      ]);
      
      const evJson = await evRes.json().catch(() => null);
      const stJson = await stRes.json().catch(() => null);
      
      if (!evRes.ok) throw new Error(evJson?.error || "Failed to load events");
      
      // Filter for events that have ended
      const list = (Array.isArray(evJson.createdEvents) ? evJson.createdEvents : [])
        .filter((e: any) => e.status === "ended" || e.status === "completed")
        .sort((a: any, b: any) => new Date(b.endedAt || b.startsAt || 0).getTime() - new Date(a.endedAt || a.startsAt || 0).getTime());
        
      setEvents(list);
      setStats(stJson);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={S.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Attendees Overview</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {/* Analytics Grid */}
        <View style={S.statsGrid}>
          <View style={[S.statCard, { backgroundColor: C.teal }]}>
            <Text style={S.statLabel}>TOTAL GUESTS</Text>
            <Text style={S.statValue}>{stats?.totalAttendees || 0}</Text>
          </View>
          <View style={S.bottomGrid}>
            <View style={[S.miniCard, { backgroundColor: "#fff" }]}>
              <Text style={[S.miniLabel, { color: C.muted }]}>NEW</Text>
              <Text style={S.miniValue}>{stats?.newAttendees || 0}</Text>
            </View>
            <View style={[S.miniCard, { backgroundColor: "#fff" }]}>
              <Text style={[S.miniLabel, { color: C.muted }]}>REPEATED</Text>
              <Text style={S.miniValue}>{stats?.repeatedAttendees || 0}</Text>
            </View>
          </View>
        </View>

        <Text style={S.listTitle}>Attendance History</Text>

        {loading ? (
          <View style={S.center}>
            <ActivityIndicator color={C.teal} size="large" />
            <Text style={S.muted}>Loading history...</Text>
          </View>
        ) : err ? (
          <View style={S.center}>
            <Text style={S.err}>{err}</Text>
            <TouchableOpacity onPress={load} style={S.retry}><Text style={S.retryText}>Retry</Text></TouchableOpacity>
          </View>
        ) : events.length === 0 ? (
          <View style={S.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>👥</Text>
            <Text style={S.emptyTitle}>No past attendees</Text>
            <Text style={S.emptySub}>Guest details will appear here once your events conclude.</Text>
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
              <View style={[S.emojiBox, { backgroundColor: e.kind === "service" ? C.purpleBg : C.blueBg }]}>
                <Text style={{ fontSize: 20 }}>{e.emoji || "📅"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.eventTitle} numberOfLines={1}>{e.title}</Text>
                <View style={S.badgeRow}>
                  <View style={[S.kindBadge, { backgroundColor: e.kind === "paid" ? C.amberBg : C.tealBg }]}>
                    <Text style={[S.kindText, { color: e.kind === "paid" ? C.amberText : C.tealText }]}>
                      {e.kind.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={S.eventDate}>
                    · {new Date(e.endedAt || e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </Text>
                </View>
              </View>
              <View style={S.countBox}>
                <Text style={S.countValue}>{e.finalAttendeeCount ?? (e.attendees?.length || 0)}</Text>
                <Text style={S.countLabel}>GUESTS</Text>
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
  statsGrid: { marginBottom: 25 },
  statCard: {
    borderRadius: 24, padding: 24, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 4 },
  statValue: { color: "#fff", fontSize: 34, fontWeight: "900" },
  bottomGrid: { flexDirection: "row", gap: 12 },
  miniCard: { 
    flex: 1, padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: C.cardBorder,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5,
  },
  miniLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5, marginBottom: 4 },
  miniValue: { fontSize: 20, fontWeight: "900", color: C.ink },
  listTitle: { fontSize: 13, fontWeight: "900", color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 15, marginLeft: 4 },
  eventCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    padding: 14, borderRadius: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: C.cardBorder, gap: 12,
  },
  emojiBox: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  eventTitle: { fontSize: 15, fontWeight: "900", color: C.ink, marginBottom: 4 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  kindBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  kindText: { fontSize: 9, fontWeight: "900" },
  eventDate: { fontSize: 11, color: C.muted, fontWeight: "600" },
  countBox: { alignItems: "center", minWidth: 50 },
  countValue: { fontSize: 18, fontWeight: "900", color: C.ink },
  countLabel: { fontSize: 8, color: C.muted, fontWeight: "900" },
  center: { alignItems: "center", paddingVertical: 60 },
  err: { color: "#EF4444", fontSize: 14, fontWeight: "700", marginBottom: 10 },
  retry: { backgroundColor: C.teal, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99 },
  retryText: { color: "#fff", fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.muted, fontWeight: "600", textAlign: "center", paddingHorizontal: 30 },
});
