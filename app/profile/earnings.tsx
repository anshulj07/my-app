// app/profile/earnings.tsx
import React, { useEffect, useState, useMemo } from "react";
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform, Dimensions, Animated, Image
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const { width: W } = Dimensions.get("window");

const C = {
  bg:       "#F8FAFF",
  dark:     "#1A1C2E",
  white:    "#FFFFFF",
  ink:      "#1A1C2E",
  ink2:     "#4B4E6D",
  muted:    "#8F94B1",
  primary:  "#5252E2",
  accent:   "#22C55E",
  border:   "#EAEFF5",
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
      
      const list = (Array.isArray(json.createdEvents) ? json.createdEvents : [])
        .filter((e: any) => e.kind === "paid")
        .map((e: any) => {
           if (e.finalEarnings === undefined || e.finalEarnings === null) {
              const paidCount = Array.isArray(e.attendees) 
                ? e.attendees.filter((a: any) => a.isPaid || !!a.razorpayPaymentId).length 
                : 0;
              e.calculatedEarnings = paidCount * (e.priceCents || 0);
              e.calculatedAttendees = paidCount;
           } else {
              e.calculatedEarnings = e.finalEarnings;
              e.calculatedAttendees = e.finalAttendeeCount ?? 0;
           }
           return e;
        })
        .filter((e: any) => e.calculatedEarnings > 0 || e.status === "ended" || e.status === "completed")
        .sort((a: any, b: any) => new Date(b.endedAt || b.startsAt || 0).getTime() - new Date(a.endedAt || a.startsAt || 0).getTime());
        
      setEvents(list);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalEarnings = events.reduce((acc, e) => acc + (e.calculatedEarnings || 0), 0);

  const TOP = Platform.OS === "ios" ? 60 : 40;

  return (
    <View style={S.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[S.header, { paddingTop: TOP }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>EARNINGS HISTORY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <LinearGradient colors={["#1C2031", "#2D344B"]} style={S.mainCard}>
          <View style={S.cardLeft}>
            <Text style={S.cardLabel}>TOTAL REVENUE</Text>
            <Text style={S.cardValue}>₹{(totalEarnings / 100).toLocaleString()}</Text>
            <View style={S.countPill}>
              <View style={S.countDot} />
              <Text style={S.countTxt}>{events.length} Paid Events</Text>
            </View>
          </View>
          <View style={S.chartBox}>
            <View style={[S.bar, { height: 18, opacity: 0.3 }]} />
            <View style={[S.bar, { height: 26, opacity: 0.5 }]} />
            <View style={[S.bar, { height: 42, backgroundColor: "#00E5FF" }]} />
            <View style={[S.bar, { height: 30, opacity: 0.7 }]} />
          </View>
        </LinearGradient>

        {/* Section Header */}
        <View style={S.sectionHeader}>
          <Text style={S.sectionTitle}>ACTIVITY BREAKDOWN</Text>
          <View style={S.datePill}><Text style={S.datePillTxt}>MAY 2026</Text></View>
        </View>

        {loading ? (
          <View style={S.center}><ActivityIndicator color={C.primary} size="large" /></View>
        ) : events.length === 0 ? (
          <View style={S.empty}><Text style={S.emptyTxt}>No activity found</Text></View>
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
              style={S.activityCard}
            >
              <View style={S.emojiBox}>
                <Text style={{ fontSize: 24 }}>{e.emoji || "🎟"}</Text>
              </View>
              <View style={S.activityInfo}>
                <Text style={S.activityTitle}>{e.title}</Text>
                <Text style={S.activityDate}>
                  {new Date(e.endedAt || e.startsAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </Text>
              </View>
              <View style={S.activityRight}>
                <Text style={S.activityAmount}>+₹{((e.calculatedEarnings || 0) / 100).toLocaleString()}</Text>
                <Text style={S.activityGuest}>{e.calculatedAttendees || 0} {e.calculatedAttendees === 1 ? "GUEST" : "GUESTS"}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.footerTxt}>Need help with your earnings?</Text>
          <TouchableOpacity style={S.supportBtn}>
            <Text style={S.supportBtnTxt}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={14} color={C.ink2} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { 
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", 
    paddingHorizontal: 20, paddingBottom: 15, backgroundColor: "#F8FAFF" 
  },
  backBtn: { 
    width: 44, height: 44, borderRadius: 15, backgroundColor: "#FFF", 
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  headerTitle: { fontSize: 14, fontFamily: "Outfit_800ExtraBold", color: C.ink2, letterSpacing: 0.5 },
  
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  
  mainCard: { 
    borderRadius: 35, padding: 30, marginTop: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between"
  },
  cardLeft: { flex: 1 },
  cardLabel: { fontSize: 11, fontFamily: "Outfit_600SemiBold", color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 5 },
  cardValue: { fontSize: 48, fontFamily: "Outfit_900Black", color: "#FFF" },
  countPill: { 
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginTop: 15 
  },
  countDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  countTxt: { fontSize: 12, fontFamily: "Outfit_600SemiBold", color: "#FFF" },
  
  chartBox: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  bar: { width: 10, borderRadius: 5, backgroundColor: C.accent },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 35, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: "Outfit_700Bold", color: C.muted, letterSpacing: 0.5 },
  datePill: { backgroundColor: "#EDF2F7", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  datePillTxt: { fontSize: 10, fontFamily: "Outfit_800ExtraBold", color: C.ink2 },

  activityCard: { 
    flexDirection: "row", alignItems: "center", gap: 15,
    backgroundColor: "#FFF", padding: 18, borderRadius: 25, marginBottom: 15,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 15, elevation: 2
  },
  emojiBox: { 
    width: 56, height: 56, borderRadius: 18, backgroundColor: "#F8FAFF", 
    alignItems: "center", justifyContent: "center" 
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 16, fontFamily: "Outfit_700Bold", color: C.ink },
  activityDate: { fontSize: 12, fontFamily: "Outfit_500Medium", color: C.muted, marginTop: 2 },
  activityRight: { alignItems: "flex-end" },
  activityAmount: { fontSize: 16, fontFamily: "Outfit_800ExtraBold", color: C.ink },
  activityGuest: { fontSize: 10, fontFamily: "Outfit_700Bold", color: C.muted, marginTop: 4 },

  footer: { alignItems: "center", marginTop: 40 },
  footerTxt: { fontSize: 13, fontFamily: "Outfit_500Medium", color: C.muted },
  supportBtn: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  supportBtnTxt: { fontSize: 14, fontFamily: "Outfit_800ExtraBold", color: C.ink2 },

  center: { paddingVertical: 40 },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyTxt: { fontSize: 14, fontFamily: "Outfit_600SemiBold", color: C.muted },
});
