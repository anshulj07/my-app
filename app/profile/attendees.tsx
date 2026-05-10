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
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import AttendanceSheet from "../../components/MyBookings/AttendanceSheet";


const { width: W } = Dimensions.get("window");

// Design Tokens (Matching Profile)
const C = {
  purple: "#6366F1",
  purpleGradient: ["#6366F1", "#8B5CF6"] as const,
  purpleBg: "#EEF2FF",
  teal: "#0D9488",
  tealBg: "#F0FDFA",
  tealText: "#0F766E",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberText: "#92400E",
  ink: "#111827",
  muted: "#6B7280",
  lightMuted: "#9CA3AF",
  card: "#FFFFFF",
  cardBorder: "#F3F4F6",
  inputBg: "#F9FAFB",
  blue: "#3B82F6",
  blueBg: "#EFF6FF",
  font: "Outfit_500Medium",
  fontBold: "Outfit_700Bold",
  fontExtraBold: "Outfit_800ExtraBold",
};

export default function AttendeesDetail() {
  const router = useRouter();
  const { userId } = useAuth();
  
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [attendeesList, setAttendeesList] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"new" | "repeated" | null>(null);
  const [showSheet, setShowSheet] = useState(false);
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
      
      const allCreated = evJson.createdEvents || [];
      
      // Local calculation for accurate New/Repeated stats
      const seen = new Map<string, number>();
      let totalCount = 0;
      allCreated.forEach((ev: any) => {
        const atts = Array.isArray(ev.attendees) ? ev.attendees : [];
        atts.forEach((a: any) => {
          const id = a.clerkId || a.clerkUserId;
          if (id) {
            totalCount++;
            seen.set(id, (seen.get(id) || 0) + 1);
          }
        });
      });
      
      let repeatedCount = 0;
      let newCount = 0;
      const uniqueAttendees: any[] = [];

      seen.forEach((count, id) => {
        if (count > 1) repeatedCount++;
        else newCount++;

        // Find guest info from event history
        let name = "Guest";
        let imageUrl = "";
        for (const ev of allCreated) {
          const a = ev.attendees?.find((att: any) => (att.clerkId || att.clerkUserId) === id);
          if (a) {
            name = a.name || name;
            imageUrl = a.imageUrl || imageUrl;
            break;
          }
        }
        uniqueAttendees.push({ id, name, imageUrl, count, isRepeated: count > 1 });
      });
      
      setAttendeesList(uniqueAttendees);
      
      const localStats = {
        totalAttendees: totalCount,
        newAttendees: newCount,
        repeatedAttendees: repeatedCount,
        ...stJson
      };

      // Filter for events that have ended for the list display
      const list = allCreated
        .filter((e: any) => e.status === "ended" || e.status === "completed")
        .sort((a: any, b: any) => new Date(b.endedAt || b.startsAt || 0).getTime() - new Date(a.endedAt || a.startsAt || 0).getTime());
        
      setEvents(list);
      setStats(localStats);
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
          <Ionicons name="arrow-back" size={22} color={C.purple} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Attendees Overview</Text>
        <TouchableOpacity style={S.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={C.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {/* Analytics Card */}
        <LinearGradient 
          colors={C.purpleGradient} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={S.mainStatCard}
        >
          <Text style={S.mainStatLabel}>Total Guests</Text>
          <View style={S.mainStatValueRow}>
            <Text style={S.mainStatValue}>{stats?.totalAttendees || 0}</Text>
            <Text style={S.mainStatSubValue}>confirmed</Text>
          </View>
        </LinearGradient>

        <View style={S.miniStatsRow}>
          <TouchableOpacity 
            style={S.miniStatCard} 
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedFilter("new");
              setShowSheet(true);
            }}

          >
            <View style={S.miniStatIconBox}>
               <Ionicons name="person-add" size={18} color={C.purple} />
            </View>
            <View>
              <Text style={S.miniStatLabel}>New</Text>
              <Text style={S.miniStatValue}>{stats?.newAttendees || 0}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={S.miniStatCard} 
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedFilter("repeated");
              setShowSheet(true);
            }}

          >
            <View style={S.miniStatIconBox}>
               <Ionicons name="people" size={18} color={C.purple} />
            </View>
            <View>
              <Text style={S.miniStatLabel}>Repeated</Text>
              <Text style={S.miniStatValue}>{stats?.repeatedAttendees || 0}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={S.sectionHeader}>
          <Text style={S.sectionTitle}>Attendance History</Text>
          <TouchableOpacity><Text style={S.viewAll}>View All</Text></TouchableOpacity>
        </View>

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
              <View style={S.eventImageWrapper}>
                <Image 
                  source={{ uri: e.bannerUri || e.coverPhoto }} 
                  style={S.eventImage}
                  contentFit="cover"
                />
                <View style={[S.kindBadge, { backgroundColor: e.kind === "paid" ? C.purple : "#fff" }]}>
                   <Text style={[S.kindText, { color: e.kind === "paid" ? "#fff" : C.purple }]}>
                     {e.kind.toUpperCase()}
                   </Text>
                </View>
              </View>
              
              <View style={S.eventInfo}>
                <Text style={S.eventTitle} numberOfLines={1}>{e.title}</Text>
                <Text style={S.eventDate}>
                   <Ionicons name="calendar-outline" size={12} color={C.lightMuted} /> {new Date(e.endedAt || e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </View>

              <View style={S.guestBadge}>
                 <Ionicons name="people-outline" size={14} color={C.purple} />
                 <Text style={S.guestBadgeText}>{e.finalAttendeeCount ?? (e.attendees?.length || 0)} guests</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Grow Your Circle */}
        <View style={S.growCard}>
           <View style={S.growIconCircle}>
             <Ionicons name="people" size={24} color={C.purple} />
           </View>
           <Text style={S.growTitle}>Grow Your Circle</Text>
           <Text style={S.growSub}>Host more events to see your community thrive and analytics grow.</Text>
        </View>
      </ScrollView>

      <AttendanceSheet 
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        attendees={attendeesList.filter(a => selectedFilter === "new" ? !a.isRepeated : a.isRepeated).map(a => ({
          ...a,
          imageUrl: a.imageUrl,
          name: a.name,
          joinedAt: undefined, // Or pass something relevant
        }))}
      />
    </View>

  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20, paddingBottom: 15,
  },
  backBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#F3F4F6" },
  notifBtn: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: C.fontExtraBold, color: C.purple, textAlign: "center", flex: 1 },
  scroll: { padding: 20, paddingBottom: 100 },
  
  mainStatCard: {
    borderRadius: 32, padding: 28, marginBottom: 20,
    shadowColor: C.purple, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  mainStatLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: C.fontBold, marginBottom: 8 },
  mainStatValueRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  mainStatValue: { color: "#fff", fontSize: 48, fontFamily: C.fontExtraBold },
  mainStatSubValue: { color: "rgba(255,255,255,0.8)", fontSize: 16, fontFamily: C.fontBold },

  miniStatsRow: { flexDirection: "row", gap: 12, marginBottom: 30 },
  miniStatCard: { 
    flex: 1, flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 24, backgroundColor: "#fff", 
    borderWidth: 1, borderColor: "#F3F4F6",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  miniStatIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.purpleBg, alignItems: "center", justifyContent: "center" },
  miniStatLabel: { fontSize: 12, fontFamily: C.fontBold, color: C.muted, marginBottom: 2 },
  miniStatValue: { fontSize: 20, fontFamily: C.fontExtraBold, color: C.ink },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: C.fontExtraBold, color: C.ink },
  viewAll: { fontSize: 13, fontFamily: C.fontBold, color: C.purple },

  eventCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    padding: 12, borderRadius: 24, marginBottom: 16,
    borderWidth: 1, borderColor: "#F3F4F6", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  eventImageWrapper: { position: "relative" },
  eventImage: { width: 70, height: 70, borderRadius: 18, backgroundColor: "#F3F4F6" },
  kindBadge: { 
    position: "absolute", top: 4, left: 4, 
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  kindText: { fontSize: 8, fontFamily: C.fontExtraBold },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15, fontFamily: C.fontBold, color: C.ink, marginBottom: 6 },
  eventDate: { fontSize: 12, fontFamily: C.font, color: C.muted },
  guestBadge: { 
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.purpleBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  guestBadgeText: { fontSize: 11, fontFamily: C.fontBold, color: C.purple },

  growCard: {
    marginTop: 20, padding: 30, borderRadius: 32,
    borderWidth: 2, borderColor: "#F3F4F6", borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  growIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.purpleBg, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  growTitle: { fontSize: 16, fontFamily: C.fontBold, color: C.ink, marginBottom: 8 },
  growSub: { fontSize: 13, fontFamily: C.font, color: C.muted, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

  center: { alignItems: "center", paddingVertical: 60 },
  err: { color: "#EF4444", fontSize: 14, fontFamily: C.fontBold, marginBottom: 10 },
  retry: { backgroundColor: C.purple, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 },
  retryText: { color: "#fff", fontFamily: C.fontBold },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontFamily: C.fontBold, color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: C.font, color: C.muted, textAlign: "center", paddingHorizontal: 40 },

  modalContent: { padding: 24, paddingBottom: 60 },
  modalTitle: { fontSize: 24, fontFamily: C.fontExtraBold, color: C.ink, marginBottom: 8 },
  modalSub: { fontSize: 14, fontFamily: C.font, color: C.muted, marginBottom: 24 },
  attendeeList: { gap: 16 },
  attendeeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  attendeeAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#F3F4F6" },
  attendeeName: { fontSize: 16, fontFamily: C.fontBold, color: C.ink },
  attendeeStatus: { fontSize: 12, fontFamily: C.font, color: C.muted },
});
