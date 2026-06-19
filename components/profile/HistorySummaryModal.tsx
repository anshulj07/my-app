import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, ScrollView, Image,
  Modal, ActivityIndicator, Platform, StyleSheet, Dimensions
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { apiFetch } from "../../lib/apiFetch";

// ─────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  ink:         "#1C1A17",
  muted:       "#8A8278",
  hint:        "#BCB6AD",
  teal:        "#3ECFB2",
  tealBg:      "#E8FAF7",
  amber:       "#F59E0B",
  amberBg:     "#FFFBEB",
  amberText:   "#92400E",
  green:       "#34D399",
  greenBg:     "#ECFDF5",
  greenText:   "#065F46",
};

export interface SummaryEventData {
  _id: string;
  title: string;
  emoji?: string;
  kind: "free" | "paid" | "service";
  priceCents?: number | null;
  attendees?: any[];
}

interface HistorySummaryModalProps {
  visible: boolean;
  onClose: () => void;
  event: SummaryEventData | null;
}

export default function HistorySummaryModal({ visible, onClose, event: e }: HistorySummaryModalProps) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
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
      setReviews([]);
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

  if (!e) return null;

  const attendees = Array.isArray(e.attendees) ? e.attendees : [];
  const checkedIn = attendees.filter((a: any) => a.checkedIn).length;
  const total = attendees.length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const estimatedRevenue = e.kind === "paid" ? checkedIn * ((e.priceCents || 0) / 100) : 0;

  const renderStars = (rating: number, size = 16) => (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons key={s} name={s <= rating ? "star" : "star-outline"} size={size} color={s <= rating ? C.amber : C.hint} />
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={S.overlay}>
        <Animated.View style={[S.sheet, { transform: [{ translateY: slideY }] }]}>
          {/* Header */}
          <View style={S.header}>
            <TouchableOpacity onPress={onClose} style={S.backBtn}>
              <Ionicons name="arrow-back" size={22} color={C.ink} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={S.headerTitle} numberOfLines={1}>{e.title}</Text>
              <Text style={S.headerSub}>MEETUP SUMMARY</Text>
            </View>
            <View style={S.endedBadge}>
              <Text style={S.endedText}>CONCLUDED</Text>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Stats Overview */}
            <View style={S.statsGrid}>
              <View style={S.statCard}>
                <View style={[S.iconBox, { backgroundColor: C.tealBg }]}>
                  <Ionicons name="people" size={20} color={C.teal} />
                </View>
                <Text style={S.statValue}>{checkedIn}<Text style={{ fontSize: 13, color: C.hint }}>/{total}</Text></Text>
                <Text style={S.statLabel}>Guests Checked-in</Text>
              </View>
              <View style={S.statCard}>
                <View style={[S.iconBox, { backgroundColor: C.amberBg }]}>
                  <Ionicons name="star" size={20} color={C.amber} />
                </View>
                <Text style={S.statValue}>{avgRating}</Text>
                {renderStars(Math.round(Number(avgRating)), 12)}
                <Text style={S.statLabel}>Avg Experience</Text>
              </View>
            </View>

            {/* Revenue Highlights (if paid) */}
            {e.kind === "paid" && (
              <View style={S.revenueCard}>
                <View style={S.revInfo}>
                  <Text style={S.revLabel}>Total Revenue Generated</Text>
                  <Text style={S.revValue}>₹{estimatedRevenue.toFixed(0)}</Text>
                </View>
                <View style={[S.iconBox, { backgroundColor: C.greenBg, width: 48, height: 48 }]}>
                  <Ionicons name="wallet" size={22} color={C.green} />
                </View>
              </View>
            )}

            {/* Feedback Section */}
            <View style={S.feedbackSection}>
              <Text style={S.sectionTitle}>Guest Feedback ({reviews.length})</Text>
              {loading ? (
                <ActivityIndicator size="large" color={C.teal} style={{ marginTop: 20 }} />
              ) : reviews.length === 0 ? (
                <View style={S.emptyFeedback}>
                  <Text style={{ fontSize: 40, marginBottom: 10 }}>📝</Text>
                  <Text style={S.emptyFeedbackTitle}>No reviews yet</Text>
                  <Text style={S.emptyFeedbackSub}>Ratings will appear here as guests submit them.</Text>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  {reviews.map((r, i) => {
                    const attendee = attendees.find(a => a.clerkId === r.reviewerId || a.clerkUserId === r.reviewerId);
                    return (
                      <View key={i} style={S.reviewCard}>
                        <View style={S.reviewHeader}>
                          <View style={S.reviewerAvatar}>
                            <Text style={S.avatarText}>{(attendee?.name || "G")[0]}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={S.reviewerName}>{attendee?.name || "Guest"}</Text>
                            <Text style={S.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                          </View>
                          {renderStars(r.rating, 14)}
                        </View>
                        {!!r.comment && (
                          <Text style={S.reviewComment}>"{r.comment}"</Text>
                        )}

                        {/* Review Images */}
                        {Array.isArray(r.images) && r.images.length > 0 && (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.reviewImagesScroll} contentContainerStyle={{ gap: 8 }}>
                            {r.images.map((imgUrl: string, imgIdx: number) => (
                              <View key={imgIdx} style={S.reviewImageWrap}>
                                <Image source={{ uri: imgUrl }} style={S.reviewImage} />
                              </View>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet:   { flex: 1, backgroundColor: C.bg, marginTop: Platform.OS === "ios" ? 44 : 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },

  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 20,
    borderBottomWidth: 1.5, borderBottomColor: C.cardBorder,
    backgroundColor: C.card,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  headerSub:   { color: C.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginTop: 2 },
  endedBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.cardBorder,
  },
  endedText: { color: C.hint, fontSize: 10, fontWeight: "900" },

  statsGrid: { flexDirection: "row", gap: 14, padding: 20 },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 24, padding: 20,
    borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  statValue: { fontSize: 26, fontWeight: "900", color: C.ink, marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: "700", color: C.muted, textAlign: "center" },

  revenueCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    marginHorizontal: 20, marginBottom: 24, padding: 20,
    backgroundColor: C.card, borderRadius: 24,
    borderWidth: 1.5, borderColor: C.cardBorder,
  },
  revInfo:  { flex: 1 },
  revLabel: { fontSize: 11, fontWeight: "800", color: C.muted, marginBottom: 4, textTransform: "uppercase" },
  revValue: { fontSize: 24, fontWeight: "900", color: C.greenText },

  feedbackSection: { paddingHorizontal: 20 },
  sectionTitle:    { fontSize: 12, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 16 },
  
  reviewCard: {
    backgroundColor: C.card, padding: 16, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.cardBorder,
    marginBottom: 12,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  reviewerAvatar: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.inputBg, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: C.ink, fontSize: 14, fontWeight: "900" },
  reviewerName: { fontSize: 14, fontWeight: "800", color: C.ink },
  reviewDate: { fontSize: 11, color: C.hint, marginTop: 2 },
  reviewComment: { fontSize: 13, color: C.muted, fontStyle: "italic", lineHeight: 20, marginTop: 4 },
  reviewImagesScroll: { marginTop: 12 },
  reviewImageWrap: { width: 90, height: 90, borderRadius: 12, overflow: "hidden", backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.cardBorder },
  reviewImage: { width: "100%", height: "100%" },

  emptyFeedback: { alignItems: "center", paddingVertical: 40 },
  emptyFeedbackTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginBottom: 4 },
  emptyFeedbackSub: { fontSize: 13, color: C.muted, textAlign: "center", paddingHorizontal: 40 },
});
