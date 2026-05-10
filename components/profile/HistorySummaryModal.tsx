import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, ScrollView, Image,
  Modal, ActivityIndicator, Platform, StyleSheet, Dimensions, StatusBar, Share
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../../lib/apiFetch";
import AttendanceSheet from "../MyBookings/AttendanceSheet";


const { width: SW } = Dimensions.get("window");

const C = {
  bg:          "#F7F8F4",
  white:       "#FFFFFF",
  ink:         "#191919",
  muted:       "#888888",
  accent:      "#6C63FF",
  accentLight: "#EEF2FF",
  border:      "#EEEEEE",
  gold:        "#F59E0B",
  blue:        "#3B82F6",
};

export interface SummaryEventData {
  _id: string;
  title: string;
  emoji?: string;
  kind: "free" | "paid" | "service";
  priceCents?: number | null;
  attendees?: any[];
  location?: { formattedAddress?: string; city?: string };
  bannerUri?: string;
  bannerImage?: string;
}

interface HistorySummaryModalProps {
  visible: boolean;
  onClose: () => void;
  event: SummaryEventData | null;
}

export default function HistorySummaryModal({ visible, onClose, event: e }: HistorySummaryModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showAttendance, setShowAttendance] = useState(false);
  const slideY = useRef(new Animated.Value(Dimensions.get("window").height)).current;


  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  const headers = { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) };

  useEffect(() => {
    if (visible && e) {
      setLoading(true);
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 25, stiffness: 180 }).start();
      fetchReviews();
    } else {
      Animated.timing(slideY, { toValue: Dimensions.get("window").height, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, e]);

  const fetchReviews = async () => {
    if (!e || !API_BASE) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/reviews?eventId=${e._id}`, { headers });
      const json = await res.json();
      if (json.ok && json.reviews) setReviews(json.reviews);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: e?.title || "Event Summary",
        message: `Check out the summary for ${e?.title}!`,
      });
    } catch {}
  };

  if (!e) return null;

  const attendees = Array.isArray(e.attendees) ? e.attendees : [];
  const checkedIn = attendees.filter((a: any) => a.checkedIn).length;
  const totalGuests = attendees.length || 0;
  const progress = totalGuests > 0 ? Math.min(1, checkedIn / totalGuests) : 0;
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const revenue = e.priceCents ? ((e.priceCents * checkedIn) / 100).toFixed(0) : "0";
  
  const banner = e.bannerUri || e.bannerImage || "";

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={S.overlay}>
        <Animated.View style={[S.sheet, { transform: [{ translateY: slideY }] }]}>
          <StatusBar barStyle="dark-content" />
          
          {/* HEADER */}
          <View style={[S.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={onClose} style={S.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={C.ink} />
            </TouchableOpacity>
            <Text style={S.headerTitle}>Summary</Text>
            <TouchableOpacity onPress={handleShare} style={S.iconBtn}>
              <Ionicons name="share-outline" size={24} color={C.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            
            {/* HERO IMAGE */}
            <View style={S.heroContainer}>
               {banner ? (
                 <Image source={{ uri: banner }} style={S.heroImg} />
               ) : (
                 <View style={[S.heroImg, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 80 }}>{e.emoji || "📍"}</Text>
                 </View>
               )}
               <View style={S.concludedBadge}>
                 <Text style={S.concludedText}>Concluded</Text>
               </View>
            </View>

            {/* TITLE & LOC */}
            <View style={S.infoSection}>
               <Text style={S.title}>{e.title}</Text>
               <View style={S.locRow}>
                  <Ionicons name="location-outline" size={16} color={C.muted} />
                  <Text style={S.locText}>{e.location?.formattedAddress || "Venue Location"}</Text>
               </View>
            </View>

            {/* STATS CARDS */}
            <View style={S.statsGrid}>
               {/* Attendance */}
               <TouchableOpacity 
                 style={S.statCard} 
                 activeOpacity={0.7}
                 onPress={() => setShowAttendance(true)}
               >
                  <View style={S.statHeader}>
                    <Text style={S.statLabel}>Attendance</Text>
                    <Ionicons name="people" size={16} color={C.accent} />
                  </View>
                  <Text style={S.statMain}>{checkedIn} <Text style={S.statSub}>/ {totalGuests} guests</Text></Text>
                  <View style={S.progressBg}>
                    <View style={[S.progressFill, { width: `${progress * 100}%` }]} />
                  </View>
               </TouchableOpacity>


               {/* Earnings / Revenue */}
               <View style={[S.statCard, S.engagementCard]}>
                  <View style={S.statHeader}>
                    <Text style={[S.statLabel, { color: '#fff' }]}>Total Earnings</Text>
                    <Ionicons name="wallet" size={16} color="#fff" />
                  </View>
                  <Text style={[S.statMain, { color: '#fff' }]}>₹{revenue}</Text>
                  <Text style={S.statHint}>{checkedIn} paid check-ins</Text>
               </View>
            </View>

            {/* RATING & ENGAGEMENT */}
            <View style={S.ratingCard}>
               <View style={{ flex: 1 }}>
                  <Text style={S.statLabel}>Avg. Rating</Text>
                  <View style={S.ratingRow}>
                    <Text style={S.ratingMain}>{avgRating}</Text>
                    <View style={S.starsRow}>
                       {[1,2,3,4,5].map(s => <Ionicons key={s} name="star" size={14} color={s <= Math.round(Number(avgRating)) ? C.gold : C.border} />)}
                    </View>
                  </View>
               </View>
               <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={S.statLabel}>Engagement</Text>
                  <View style={[S.row, { marginTop: 5 }]}>
                    <Ionicons name="trending-up" size={18} color={C.accent} />
                    <Text style={[S.statMain, { marginLeft: 5, fontSize: 24 }]}>High</Text>
                  </View>
               </View>
            </View>

            {/* FEEDBACK SECTION */}
            <View style={S.feedbackHeader}>
               <Text style={S.sectionTitle}>Guest Feedback ({reviews.length})</Text>
               <TouchableOpacity><Text style={S.seeAll}>See All</Text></TouchableOpacity>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 20, gap: 15 }}
            >
              {reviews.length > 0 ? reviews.map((r, i) => (
                <View key={i} style={S.feedbackCard}>
                   <View style={S.feedbackUser}>
                      <Image source={{ uri: r.userAvatar || `https://i.pravatar.cc/100?u=${i}` }} style={S.feedbackAvatar} />
                      <View>
                        <Text style={S.feedbackName}>{r.userName || "Guest"}</Text>
                        <View style={S.starsRow}>
                           {[1,2,3,4,5].map(s => <Ionicons key={s} name="star" size={10} color={s <= r.rating ? C.gold : C.border} />)}
                        </View>
                      </View>
                   </View>
                   <Text style={S.feedbackComment} numberOfLines={3}>"{r.comment}"</Text>
                </View>
              )) : (
                <View style={[S.feedbackCard, { width: SW - 40, alignItems: 'center' }]}>
                   <Text style={C.muted}>No feedback yet</Text>
                </View>
              )}
            </ScrollView>

          </ScrollView>

        </Animated.View>
      </View>

      <AttendanceSheet 
        visible={showAttendance}
        onClose={() => setShowAttendance(false)}
        attendees={attendees}
      />
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet:   { flex: 1, backgroundColor: C.bg, marginTop: Platform.OS === "ios" ? 0 : 0 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, backgroundColor: C.bg },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: C.ink },

  heroContainer: { marginHorizontal: 20, marginTop: 15, height: 200, borderRadius: 32, overflow: "hidden" },
  heroImg: { width: "100%", height: "100%" },
  concludedBadge: { 
    position: "absolute", top: 15, left: 15, 
    backgroundColor: C.accent + "CC", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 
  },
  concludedText: { color: "#fff", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },

  infoSection: { paddingHorizontal: 25, marginTop: 20 },
  title: { fontSize: 28, fontWeight: "900", color: C.ink },
  locRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  locText: { fontSize: 14, color: C.muted, fontWeight: "600" },

  statsGrid: { flexDirection: "row", gap: 15, paddingHorizontal: 25, marginTop: 25 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 24, padding: 15, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  engagementCard: { backgroundColor: C.accent },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  statLabel: { fontSize: 12, fontWeight: "800", color: C.muted },
  statMain: { fontSize: 20, fontWeight: "900", color: C.ink },
  statSub: { fontSize: 12, color: C.muted, fontWeight: "600" },
  statHint: { fontSize: 10, color: "#EEF2FF", fontWeight: "700", marginTop: 5 },
  
  progressBg: { height: 6, backgroundColor: C.accentLight, borderRadius: 3, marginTop: 12, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: C.accent, borderRadius: 3 },

  ratingCard: { 
    flexDirection: "row", alignItems: "center", backgroundColor: C.white, 
    marginHorizontal: 25, marginTop: 15, padding: 20, borderRadius: 24,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 
  },
  ratingRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 5 },
  ratingMain: { fontSize: 32, fontWeight: "900", color: C.ink },
  starsRow: { flexDirection: "row", gap: 2 },
  
  miniChart: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 40 },
  chartBar: { width: 6, borderRadius: 3 },

  feedbackHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 25, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: C.ink },
  seeAll: { fontSize: 12, fontWeight: "800", color: C.accent },

  feedbackCard: { 
    width: SW * 0.7, backgroundColor: C.white, borderRadius: 24, padding: 15,
    borderWidth: 1, borderColor: C.border 
  },
  feedbackUser: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  feedbackAvatar: { width: 36, height: 36, borderRadius: 18 },
  feedbackName: { fontSize: 13, fontWeight: "800", color: C.ink },
  feedbackComment: { fontSize: 12, color: C.muted, lineHeight: 18, fontStyle: "italic" },

  footer: { 
    position: "absolute", bottom: 0, left: 0, right: 0, 
    backgroundColor: C.bg, paddingHorizontal: 25, paddingTop: 15, gap: 12 
  },
  outlineBtn: { 
    height: 56, borderRadius: 18, borderWidth: 2, borderColor: C.accent, 
    alignItems: "center", justifyContent: "center" 
  },
  outlineBtnText: { color: C.accent, fontSize: 16, fontWeight: "800" },
  solidBtn: { 
    height: 56, borderRadius: 18, backgroundColor: C.accent, 
    alignItems: "center", justifyContent: "center",
    shadowColor: C.accent, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
  },
  solidBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
