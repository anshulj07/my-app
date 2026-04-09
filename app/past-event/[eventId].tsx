import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Platform, StatusBar, Animated, Dimensions,
  RefreshControl
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { apiFetch } from "../../lib/apiFetch";
import RatingModal from "../../components/MyBookings/RatingModal";

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
  tealText:    "#1A7A6A",
  amber:       "#F59E0B",
  amberBg:     "#FFFBEB",
  amberText:   "#92400E",
  green:       "#34D399",
  greenBg:     "#ECFDF5",
  greenText:   "#065F46",
  coral:       "#FF6F6F",
  coralBg:     "#FFF0F0",
  coralText:   "#C0392B",
  blue:        "#60A5FA",
  blueBg:      "#EFF6FF",
  blueText:    "#1D4ED8",
};

const { width } = Dimensions.get("window");

export default function PastEventDetailScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams();
  const { userId } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showRating, setShowRating] = useState(false);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  const headers = { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) };

  const loadData = async () => {
    if (!eventId || !API_BASE) return;
    try {
      const base = API_BASE.replace(/\/$/, "");
      const [evRes, revRes] = await Promise.all([
        apiFetch(`${base}/api/events/${eventId}`, { headers }),
        apiFetch(`${base}/api/reviews?eventId=${eventId}`, { headers })
      ]);
      
      const evJson = await evRes.json().catch(() => ({}));
      const revJson = await revRes.json().catch(() => ({}));
      
      if (evRes.ok && evJson.event) {
        setEvent(evJson.event);
      } else {
        setEvent(null);
      }
      
      if (revRes.ok && revJson.reviews) {
        setReviews(revJson.reviews);
      }
    } catch (err) {
      console.error("Failed to load past event data:", err);
      setEvent(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [eventId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ─────────────────────────────────────────────
  //  ANALYTICS HELPERS
  // ─────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!event) return null;
    const attendees  = Array.isArray(event.attendees) ? event.attendees : [];
    const checkedIn  = attendees.filter((a: any) => a.checkedIn).length;
    const total      = attendees.length;
    const isHost     = event.creatorClerkId === userId;
    
    const avgRating  = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";
      
    const revenue = event.kind === "paid" ? checkedIn * ((event.priceCents || 0) / 100) : 0;
    
    // Star breakdown for e-commerce style
    const breakdown = [5, 4, 3, 2, 1].map(s => {
      const count = reviews.filter(r => Math.round(r.rating) === s).length;
      return { stars: s, pct: reviews.length > 0 ? (count / reviews.length) * 100 : 0 };
    });

    // All review images
    const allImages = reviews.reduce((acc: string[], r: any) => {
      if (Array.isArray(r.images)) return [...acc, ...r.images];
      return acc;
    }, []);

    return { total, checkedIn, isHost, avgRating, revenue, breakdown, allImages };
  }, [event, reviews, userId]);

  if (loading) {
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" color={C.teal} />
        <Text style={S.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={S.center}>
        <Text style={S.errText}>Event not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
          <Text style={S.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isHost = stats?.isHost;

  return (
    <View style={S.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.headerBack}>
          <Ionicons name="arrow-back" size={24} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={S.headerTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={S.headerSub}>EVENT ARCHIVE</Text>
        </View>
        <View style={S.roleBadge}>
          <Text style={S.roleText}>{isHost ? "HOST" : "ATTENDEE"}</Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.teal} />}
      >
        {/* Hero Section */}
        <View style={S.hero}>
          <View style={S.emojiContainer}>
            <Text style={S.heroEmoji}>{event.emoji || "📍"}</Text>
          </View>
          <View style={S.heroContent}>
            <Text style={S.heroTitle}>{event.title}</Text>
            <View style={S.heroMeta}>
              <Ionicons name="calendar-outline" size={14} color={C.muted} />
              <Text style={S.heroMetaText}>
                {new Date(event.startsAt || event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Analytics Grid */}
        <View style={S.statsGrid}>
          <View style={S.statCard}>
            <View style={[S.statIcon, { backgroundColor: C.tealBg }]}>
              <Ionicons name="people" size={20} color={C.teal} />
            </View>
            <Text style={S.statValue}>{stats?.checkedIn}<Text style={S.statTotal}>/{stats?.total}</Text></Text>
            <Text style={S.statLabel}>Checked In</Text>
          </View>

          <View style={S.statCard}>
            <View style={[S.statIcon, { backgroundColor: C.amberBg }]}>
              <Ionicons name="star" size={20} color={C.amber} />
            </View>
            <Text style={S.statValue}>{stats?.avgRating}</Text>
            <Text style={S.statLabel}>Avg Rating</Text>
          </View>

          {isHost && event.kind === "paid" && (
            <View style={[S.statCard, { backgroundColor: C.greenBg, borderColor: C.green + "33" }]}>
              <View style={[S.statIcon, { backgroundColor: "#FFF" }]}>
                <Ionicons name="wallet" size={20} color={C.green} />
              </View>
              <Text style={[S.statValue, { color: C.greenText }]}>₹{stats?.revenue.toFixed(0)}</Text>
              <Text style={[S.statLabel, { color: C.greenText }]}>Revenue</Text>
            </View>
          )}
        </View>

        {/* Photo Gallery (Aggregated) */}
        {stats?.allImages && stats.allImages.length > 0 && (
          <View style={S.section}>
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>Event Gallery</Text>
              <Text style={S.sectionCount}>{stats.allImages.length} Photos</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.galleryScroll}>
              {stats.allImages.map((img: string, idx: number) => (
                <View key={idx} style={S.galleryItem}>
                  <Image source={{ uri: img }} style={S.galleryImg} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Rating Breakdown (E-commerce style) */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Community Rating</Text>
          <View style={S.ratingHub}>
            <View style={S.ratingBig}>
              <Text style={S.ratingScore}>{stats?.avgRating}</Text>
              <View style={S.starsRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Ionicons 
                    key={s} 
                    name={s <= Math.round(Number(stats?.avgRating)) ? "star" : "star-outline"} 
                    size={16} 
                    color={C.amber} 
                  />
                ))}
              </View>
              <Text style={S.ratingCount}>{reviews.length} reviews</Text>
            </View>
            
            <View style={S.breakdown}>
              {stats?.breakdown.map(b => (
                <View key={b.stars} style={S.breakdownRow}>
                  <Text style={S.breakdownStar}>{b.stars} ★</Text>
                  <View style={S.barOuter}>
                    <View style={[S.barInner, { width: `${b.pct}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Reviews Feed */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={S.sectionTitle}>User Reviews</Text>
            {!isHost && (
              <TouchableOpacity onPress={() => setShowRating(true)} style={S.writeBtn}>
                <Text style={S.writeBtnText}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>

          {reviews.length === 0 ? (
            <View style={S.emptyReviews}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
              <Text style={S.emptyTitle}>No reviews yet</Text>
              <Text style={S.emptySub}>Be the first to share your experience!</Text>
            </View>
          ) : (
            <View style={S.reviewFeed}>
              {reviews.map((rev, idx) => {
                const attendees = Array.isArray(event.attendees) ? event.attendees : [];
                const person = attendees.find((a: any) => a.clerkId === rev.reviewerId || a.clerkUserId === rev.reviewerId);
                const name = person?.name || rev.reviewerName || "Verified Attendee";
                const pfp  = person?.imageUrl || null;
                
                return (
                  <View key={idx} style={S.reviewCard}>
                    <View style={S.reviewHeader}>
                      <View style={[S.reviewerAvatar, !pfp && { backgroundColor: C.teal }]}>
                        {pfp ? (
                          <Image source={{ uri: typeof pfp === 'string' ? pfp : pfp.url }} style={S.avatarImg} />
                        ) : (
                          <Text style={S.avatarText}>{name[0].toUpperCase()}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={S.reviewerName}>{name}</Text>
                          <View style={S.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color={C.teal} />
                            <Text style={S.verifiedText}>Verified</Text>
                          </View>
                        </View>
                        <Text style={S.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <View style={S.revStars}>
                        <Ionicons name="star" size={14} color={C.amber} />
                        <Text style={S.revScore}>{rev.rating}</Text>
                      </View>
                    </View>
                    {rev.comment && (
                      <Text style={S.reviewText}>"{rev.comment}"</Text>
                    )}
                    {rev.images && rev.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.revImages} contentContainerStyle={{ gap: 8 }}>
                        {rev.images.map((img: string, i: number) => (
                          <Image key={i} source={{ uri: img }} style={S.revImg} />
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

      {/* Submission Modal */}
      <RatingModal 
        visible={showRating}
        onClose={() => { setShowRating(false); loadData(); }}
        event={event}
      />
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  loadingText: { marginTop: 16, color: C.muted, fontWeight: "600" },
  errText: { fontSize: 18, color: C.ink, fontWeight: "800", marginBottom: 20 },

  header: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 60 : 20, paddingBottom: 20,
    backgroundColor: C.card, borderBottomWidth: 1.5, borderColor: C.cardBorder,
  },
  headerBack: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center", backgroundColor: C.inputBg,
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: C.ink },
  headerSub: { fontSize: 10, color: C.hint, fontWeight: "800", letterSpacing: 1 },
  roleBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: C.blueBg, borderWidth: 1, borderColor: C.blue + "44",
  },
  roleText: { color: C.blueText, fontSize: 10, fontWeight: "900" },

  hero: {
    flexDirection: "row", alignItems: "center", gap: 20, padding: 20,
    backgroundColor: C.card, marginBottom: 12,
  },
  emojiContainer: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.inputBg, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: C.cardBorder,
  },
  heroEmoji: { fontSize: 36 },
  heroContent: { flex: 1 },
  heroTitle: { fontSize: 22, fontWeight: "900", color: C.ink, marginBottom: 8 },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroMetaText: { fontSize: 13, color: C.muted, fontWeight: "600" },

  statsGrid: { flexDirection: "row", gap: 12, padding: 20 },
  statCard: {
    flex: 1, backgroundColor: C.card, padding: 16, borderRadius: 24,
    borderWidth: 1.5, borderColor: C.cardBorder, alignItems: "center",
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  statValue: { fontSize: 20, fontWeight: "900", color: C.ink, marginBottom: 4 },
  statTotal: { fontSize: 12, color: C.hint },
  statLabel: { fontSize: 10, fontWeight: "800", color: C.muted, textTransform: "uppercase" },

  section: { backgroundColor: C.card, paddingVertical: 24, paddingHorizontal: 20, marginBottom: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: C.ink, textTransform: "uppercase", letterSpacing: 0.8 },
  sectionCount: { fontSize: 12, color: C.hint, fontWeight: "700" },

  galleryScroll: { gap: 12 },
  galleryItem: { width: 140, height: 180, borderRadius: 20, overflow: "hidden", backgroundColor: C.inputBg },
  galleryImg: { width: "100%", height: "100%" },

  ratingHub: { flexDirection: "row", alignItems: "center", gap: 24 },
  ratingBig: { alignItems: "center", gap: 4 },
  ratingScore: { fontSize: 48, fontWeight: "900", color: C.ink },
  starsRow: { flexDirection: "row", gap: 2 },
  ratingCount: { fontSize: 12, color: C.hint, fontWeight: "700", marginTop: 4 },

  breakdown: { flex: 1, gap: 8 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  breakdownStar: { fontSize: 11, fontWeight: "800", color: C.muted, width: 25 },
  barOuter: { flex: 1, height: 6, backgroundColor: C.inputBg, borderRadius: 3, overflow: "hidden" },
  barInner: { height: "100%", backgroundColor: C.amber, borderRadius: 3 },

  writeBtn: {
    backgroundColor: C.amberBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: C.amber + "33",
  },
  writeBtnText: { color: C.amberText, fontSize: 12, fontWeight: "800" },

  reviewFeed: { gap: 16 },
  reviewCard: {
    padding: 16, backgroundColor: C.inputBg, borderRadius: 20,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  reviewerAvatar: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: C.teal,
    alignItems: "center", justifyContent: "center",
  },
  avatarText:    { color: "#FFF", fontSize: 14, fontWeight: "900" },
  avatarImg:     { width: "100%", height: "100%" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.tealBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: C.teal + "22" },
  verifiedText:  { fontSize: 9, fontWeight: "900", color: C.tealText, textTransform: "uppercase", letterSpacing: 0.5 },

  reviewerName: { fontSize: 14, fontWeight: "800", color: C.ink },
  reviewDate: { fontSize: 11, color: C.hint, marginTop: 2 },
  revStars: { 
    flexDirection: "row", alignItems: "center", gap: 4, 
    backgroundColor: C.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  revScore: { fontSize: 12, fontWeight: "900", color: C.ink },
  reviewText: { fontSize: 14, color: C.muted, lineHeight: 20, fontStyle: "italic" },
  revImages: { marginTop: 12 },
  revImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: C.hint },

  emptyReviews: { alignItems: "center", paddingVertical: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.ink, marginBottom: 4 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: "center" },

  backBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: C.teal },
  backBtnText: { color: "#FFF", fontWeight: "800" },
});
