// app/newApp/event-detail.tsx
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Platform, StatusBar, Animated, BackHandler,
  Dimensions, Image, Share, Modal, TextInput, Alert
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiFetch } from "../../lib/apiFetch";
import JoinEventButton from "../../components/ClickPin/JoinEventButton";
import AttendanceSheet from "../../components/MyBookings/AttendanceSheet";


const { width: SW } = Dimensions.get("window");
const IMG_H = 320;
const PAD = 20;

const C = {
  bg:      "#F7F8F4",
  white:   "#FFFFFF",
  accent:  "#6C63FF",
  ink:     "#111827",
  ink2:    "#374151",
  muted:   "#6B7280",
  border:  "#E5E7EB",
  gold:    "#F59E0B",
  green:   "#10B981",
  red:     "#EF4444",
};

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{ eventId: string; title: string; emoji: string; booking?: string; isPast?: string }>();

  const [event, setEvent] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey;

  const loadAll = useCallback(async () => {
    if (!API_BASE || !params.eventId) return;
    try {
      const [eRes, rRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/events/${params.eventId}`, {
          method: "GET", headers: { "x-api-key": EVENT_API_KEY || "" },
        }),
        apiFetch(`${API_BASE}/api/reviews?eventId=${params.eventId}`, {
          method: "GET", headers: { "x-api-key": EVENT_API_KEY || "" },
        })
      ]);
      const eJson = await eRes.json();
      const rJson = await rRes.json();
      setEvent(eJson?.event ?? eJson);
      if (rJson.ok) setReviews(rJson.reviews || []);
    } catch (err) {
      console.log("Load error", err);
    } finally {
      setLoading(false);
    }
  }, [params.eventId, API_BASE, EVENT_API_KEY]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ✅ Android hardware back button — always go exactly one page back
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.back();
      return true; // prevents default (app exit)
    });
    return () => sub.remove();
  }, [router]);

  const handleVerifyOtp = async () => {
    if (otpValue.length < 4) return;
    setVerifying(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/events/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": EVENT_API_KEY || "" },
        body: JSON.stringify({ eventId: params.eventId, creatorClerkId: userId, otp: otpValue }),
      });
      if (res.ok) {
        Alert.alert("Success", "Guest Verified!");
        setOtpValue("");
        setShowOtpModal(false);
        loadAll();
      } else {
        const json = await res.json();
        Alert.alert("Error", json.error || "Invalid OTP");
      }
    } catch {
      Alert.alert("Error", "Error verifying OTP");
    } finally {
      setVerifying(false);
    }
  };

  const submitReview = async () => {
    if (!newComment.trim() || !userId || !event) return;
    setSubmitting(true);
    const hostId = event.clerkUserId || event.creatorClerkId;

    try {
      const res = await apiFetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": EVENT_API_KEY || "" },
        body: JSON.stringify({
          eventId: params.eventId,
          reviewerId: userId,
          hostId: hostId,
          rating: newRating,
          comment: newComment,
        }),
      });
      if (res.ok) {
        setNewComment("");
        setNewRating(5);
        setShowReviewModal(false);
        loadAll();
      } else {
        const errJson = await res.json();
        Alert.alert("Error", errJson.error || "Failed to submit review");
      }
    } catch (e) {
      Alert.alert("Error", "Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: event?.title || "Check out this event",
        message: `Join me at ${event?.title || "this event"}! \n\nAssisto App`,
      });
    } catch {}
  };

  const handleEdit = () => {
    const kind = event?.kind === "service" ? "service" : "event";
    router.push({
      pathname: kind === "service" ? "/edit-service/[eventId]" : "/edit-event/[eventId]",
      params: { eventId: params.eventId }
    } as any);
  };

  const ev = event;
  const kind = ev?.kind || "event";
  const isService = kind === "service";

  const title = ev?.title || params.title || "Event";
  const banner = ev?.bannerUri || (ev as any)?.bannerImage || "";
  const attendees = ev?.attendees ?? [];
  const price = ev?.kind === "free" ? "Free" : `₹${((ev?.priceCents ?? 0)/100).toFixed(0)}`;
  const isHost = userId === (ev?.creatorClerkId || ev?.clerkUserId);

  const joinedInfo = useMemo(() => {
    if (!userId || !ev?.attendees) return null;
    return (ev.attendees as any[]).find(a => (a.clerkId || a.clerkUserId || a.userId) === userId);
  }, [userId, ev?.attendees]);

  const isJoined = !!joinedInfo;
  const isPast   = params.isPast === "true" || ev?.status === "completed" || ev?.status === "past";



  const handleLeave = async () => {
    Alert.alert(
      "Leave Event",
      "Are you sure you want to cancel your registration?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await apiFetch(`${API_BASE}/api/events/leave`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": EVENT_API_KEY || "" },
                body: JSON.stringify({
                  eventId: params.eventId,
                  clerkUserId: userId
                }),
              });
              if (res.ok) {
                Alert.alert("Cancelled", "You have left the event.");
                loadAll();
              } else {
                const json = await res.json();
                Alert.alert("Error", json.error || "Failed to leave");
              }
            } catch {
              Alert.alert("Error", "Something went wrong");
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  // Header Animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [IMG_H - 100, IMG_H - 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  if (loading) {
    return (
      <View style={[S.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <View style={S.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* STICKY HEADER */}
      <Animated.View style={[S.stickyHeader, { height: insets.top + 55, opacity: headerOpacity }]}>
        <View style={[S.stickyInner, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={S.navIconBtn}>
            <Ionicons name="chevron-back" size={24} color={C.ink} />
          </TouchableOpacity>
          <Text style={S.stickyTitle} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={handleShare} style={S.navIconBtn}>
            <Ionicons name="share-social-outline" size={22} color={C.ink} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        
        {/* HERO BANNER */}
        <View style={S.bannerContainer}>
          {banner ? (
            <Image source={{ uri: banner }} style={S.banner} resizeMode="cover" />
          ) : (
            <View style={[S.banner, { backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ fontSize: 80 }}>{ev?.emoji || "📍"}</Text>
            </View>
          )}
          <View style={S.bannerOverlay} />
          
          <TouchableOpacity 
            style={[S.circleBtn, { position: "absolute", left: PAD, top: insets.top + 10 }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={C.ink} />
          </TouchableOpacity>

          <View style={{ position: "absolute", right: PAD, top: insets.top + 10 }}>
            <TouchableOpacity style={S.circleBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* FLOATING INFO CARD */}
        <View style={S.floatingCard}>
          <View style={S.rowBetween}>
            <View style={S.categoryTag}>
              <Text style={S.categoryText}>{(ev?.kind || "Event").toUpperCase()}</Text>
            </View>
            <View style={S.ratingBadge}>
              <Ionicons name="star" size={14} color={C.gold} />
              <Text style={S.ratingText}>{ev?.rating || "4.8"}</Text>
            </View>
          </View>
          
          <Text style={S.mainTitle}>{title}</Text>
          
          <View style={[S.row, { gap: 20, marginTop: 12 }]}>
            <View style={S.row}>
              <Ionicons name={isService ? "calendar-clear-outline" : "calendar-outline"} size={16} color={C.accent} />
              <Text style={S.statText}>{ev?.date || (isService ? "Flexible Schedule" : "TBD")}</Text>
            </View>
            <View style={S.row}>
              <Ionicons name={isService ? "timer-outline" : "time-outline"} size={16} color={C.accent} />
              <Text style={S.statText}>{isService ? (ev?.duration || "1 Hour Session") : (ev?.time || "TBD")}</Text>
            </View>
          </View>

          {ev?.maxCapacity && (
            <View style={[S.row, { marginTop: 12, backgroundColor: "#F1F5F9", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }]}>
              <Ionicons name="people-outline" size={14} color={C.ink2} />
              <Text style={[S.statText, { fontSize: 11, color: C.ink2 }]}>
                {attendees.length} / {ev.maxCapacity} {isService ? "Spots Booked" : "Joined"}
              </Text>
            </View>
          )}
        </View>

        {/* ── JOINED OTP DISPLAY ── */}
        {isJoined && (
          <View style={[S.section, { marginTop: 20 }]}>
            <View style={S.otpCard}>
              <View style={S.row}>
                <Ionicons name="ticket" size={20} color={C.accent} />
                <Text style={S.otpLabel}>Your Check-in OTP</Text>
              </View>
              <Text style={S.otpValue}>{joinedInfo?.checkInOtp || "----"}</Text>
              <Text style={S.otpSub}>Show this to the host at the entrance</Text>
            </View>
          </View>
        )}

        {/* HOST ROW */}
        <View style={S.hostCard}>
          <Image source={{ uri: ev?.creatorAvatar || "https://i.pravatar.cc/100" }} style={S.hostImg} />
          <View style={{ flex: 1 }}>
            <Text style={S.hostName}>{ev?.creatorName || "Local Host"}</Text>
            <Text style={S.hostSub}>HOST & ORGANIZER</Text>
          </View>
          <TouchableOpacity style={S.messageBtn}>
            <Text style={S.messageBtnText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* ABOUT THE EVENT */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>About the {isService ? "Service" : "Event"}</Text>
          <Text style={S.aboutText}>
            {ev?.description || `Experience an unforgettable ${isService ? "service" : "evening"}. Join us for a perfect blend of networking, music, and great vibes.`}
          </Text>
        </View>

        {/* WHAT TO EXPECT GRID */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>What to Expect</Text>
          <View style={S.grid}>
            {[
              { label: isService ? "Expertise" : "Fiber WiFi", sub: isService ? "CERTIFIED" : "100 MBPS", icon: isService ? "ribbon" : "wifi" },
              { label: "Networking", sub: "ALL NOMADS", icon: "people" },
              { label: "High Quality", sub: "TOP RATED", icon: "star" },
              { label: isService ? "Duration" : "Co-working", sub: isService ? "1 HOUR" : "FAST ACCESS", icon: isService ? "time" : "laptop" },
            ].map((item, i) => (
              <View key={i} style={S.gridItem}>
                <View style={S.gridIconBox}>
                  <Ionicons name={item.icon as any} size={24} color={C.accent} />
                </View>
                <Text style={S.gridLabel}>{item.label}</Text>
                <Text style={S.gridSub}>{item.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* WHO'S GOING / ATTENDEES */}
        <View style={S.section}>
          <View style={S.rowBetween}>
            <Text style={S.sectionTitle}>{isService ? "Recent Clients" : "Who's Going"}</Text>
            <TouchableOpacity onPress={() => setShowAttendeesModal(true)}>
              <Text style={S.seeAll}>See All ({attendees.length})</Text>
            </TouchableOpacity>
          </View>
          <View style={S.attendeeRow}>
            <View style={S.avatarStack}>
              {attendees.slice(0, 4).map((att: any, i: number) => (
                <View key={i} style={[S.avatarWrap, { marginLeft: i === 0 ? 0 : -15 }]}>
                  <Image source={{ uri: att.userAvatar || `https://i.pravatar.cc/100?u=${i}` }} style={S.avatar} />
                </View>
              ))}
              {attendees.length > 4 && (
                <View style={[S.avatarWrap, S.extraAvatar, { marginLeft: -15 }]}>
                  <Text style={S.extraText}>+{attendees.length - 4}</Text>
                </View>
              )}
            </View>
            <Text style={S.goingCountText}>
              {attendees.length > 0 
                ? `${attendees.length} ${isService ? "people have booked this" : "people have already joined"}` 
                : isService ? "Be the first one to book!" : "Be the first one to join!"}
            </Text>
          </View>
        </View>

        {/* REVIEWS SECTION */}
        <View style={S.section}>
          <View style={S.rowBetween}>
            <View>
              <Text style={S.sectionTitle}>Reviews</Text>
              <Text style={S.reviewStats}>{reviews.length || 0} reviews • 4.8 avg</Text>
            </View>
            <TouchableOpacity style={S.writeBtn} onPress={() => setShowReviewModal(true)}>
              <Ionicons name="create-outline" size={16} color={C.accent} />
              <Text style={S.writeBtnText}>Write</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingRight: 20, paddingTop: 15 }}>
            {reviews.length > 0 ? (
              <>
                {reviews.slice(0, 10).map((r, i) => (
                  <View key={i} style={S.reviewCard}>
                    <View style={S.rowBetween}>
                      <View style={S.row}>
                        <Image source={{ uri: r.userAvatar || "https://i.pravatar.cc/100" }} style={S.reviewAvatar} />
                        <View style={{ marginLeft: 10 }}>
                          <Text style={S.reviewName}>{r.userName || "Guest"}</Text>
                          <Text style={S.reviewTime}>3 weeks ago</Text>
                        </View>
                      </View>
                      <View style={S.row}>
                        {[1,2,3,4,5].map(s => <Ionicons key={s} name="star" size={12} color={s <= (r.rating || 5) ? C.gold : C.border} />)}
                      </View>
                    </View>
                    <Text style={S.reviewComment} numberOfLines={3}>"{r.comment || "Amazing experience!"}"</Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={[S.reviewCard, { width: SW - 80, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={S.muted}>No reviews yet. Be the first!</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* LOCATION */}
        <View style={S.section}>
          <View style={S.rowBetween}>
            <Text style={S.sectionTitle}>Location</Text>
            <TouchableOpacity><Text style={S.directions}>DIRECTIONS</Text></TouchableOpacity>
          </View>
          <View style={S.row}>
            <Ionicons name="location" size={14} color={C.red} />
            <Text style={S.locText}>{ev?.location?.formattedAddress || "Ubud, Bali"}</Text>
          </View>
          <View style={S.squareMap}>
             <Image 
              source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=${ev?.location?.lat || 22.7196},${ev?.location?.lng || 75.8577}&zoom=14&size=600x400&scale=2&markers=color:purple%7C${ev?.location?.lat || 22.7196},${ev?.location?.lng || 75.8577}&key=${(Constants.expoConfig?.extra as any)?.googleMapsKey}` }} 
              style={StyleSheet.absoluteFill} 
            />
          </View>
        </View>

      </Animated.ScrollView>

      {/* STICKY FOOTER */}
      <View style={[S.footer, { paddingBottom: insets.bottom + 10 }]}>
        {isPast ? (
          // ── PAST EVENT VIEW ──
          !isHost && isJoined ? (
            <>
              <View>
                <Text style={S.footerLabel}>Experience</Text>
                <Text style={[S.footerPrice, { color: C.gold }]}>Completed</Text>
              </View>
              <TouchableOpacity style={S.reserveBtn} onPress={() => setShowReviewModal(true)}>
                <Ionicons name="star-outline" size={20} color="#fff" />
                <Text style={S.reserveText}>Rate & Review</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="checkmark-done-circle" size={24} color={C.muted} />
                <Text style={{ fontSize: 16, fontFamily: "Outfit_700Bold", color: C.muted }}>This {isService ? "service" : "event"} has ended</Text>
              </View>
            </View>
          )
        ) : !isHost ? (
          // ── ACTIVE EVENT (GUEST) ──
          <>
            <View>
              {isJoined ? (
                <>
                  <Text style={S.footerLabel}>Status</Text>
                  <Text style={[S.footerPrice, { color: C.green }]}>Registered</Text>
                </>
              ) : (
                <>
                  <Text style={S.footerLabel}>Starts From</Text>
                  <Text style={S.footerPrice}>{price} <Text style={S.perPerson}>/ person</Text></Text>
                </>
              )}
            </View>
            <JoinEventButton
              eventId={params.eventId}
              kind={kind as any}
              priceCents={ev?.priceCents}
              eventTitle={title}
              eventLocation={ev?.location?.formattedAddress}
              creatorClerkId={ev?.creatorClerkId || ev?.clerkUserId}
              startDate={ev?.date}
              durationHrs={ev?.durationHours || 1}
              autoOpen={params.booking === "true"}
              onJoined={() => loadAll()}
              customTrigger={(onPress) => (
                <TouchableOpacity 
                  style={[S.reserveBtn, isJoined && { backgroundColor: C.red }]} 
                  onPress={isJoined ? handleLeave : onPress}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={S.reserveText}>{isJoined ? "Cancel Booking" : isService ? "Book Now" : "Join Now"}</Text>
                      {!isJoined && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                      {isJoined && <Ionicons name="close-circle" size={18} color="#fff" />}
                    </>
                  )}
                </TouchableOpacity>
              )}
            />
          </>
        ) : (
          // ── ACTIVE EVENT (HOST) ──
          <View style={S.hostActionsRow}>
            <TouchableOpacity style={S.editBtn} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color={C.ink} />
              <Text style={S.editBtnText}>Edit {isService ? "Service" : "Event"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.verifyBtn} onPress={() => setShowOtpModal(true)}>
              <Ionicons name="scan-outline" size={20} color="#fff" />
              <Text style={S.verifyBtnText}>Verify OTP</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* OTP VERIFY MODAL */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <View style={S.modalContent}>
            <View style={S.modalHeader}>
               <Text style={S.modalTitle}>Verify Guest OTP</Text>
               <TouchableOpacity onPress={() => setShowOtpModal(false)}><Ionicons name="close" size={24} color={C.ink} /></TouchableOpacity>
            </View>
            <Text style={S.modalLabel}>Enter the 4-digit code from guest's booking</Text>
            <TextInput
              style={S.otpInput}
              placeholder="0 0 0 0"
              keyboardType="number-pad"
              maxLength={4}
              value={otpValue}
              onChangeText={setOtpValue}
              autoFocus
            />
            <TouchableOpacity style={S.submitReviewBtn} onPress={handleVerifyOtp} disabled={verifying}>
               {verifying ? <ActivityIndicator color="#fff" /> : <Text style={S.submitReviewText}>Verify & Check-in</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* REVIEW MODAL */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <View style={S.modalContent}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color={C.ink} />
              </TouchableOpacity>
            </View>

            <Text style={S.modalLabel}>How was your experience?</Text>
            <View style={S.starPicker}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setNewRating(s)}>
                  <Ionicons name={s <= newRating ? "star" : "star-outline"} size={36} color={C.gold} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={S.modalLabel}>Share your thoughts</Text>
            <TextInput
              style={S.modalInput}
              placeholder="Tell us what you liked..."
              multiline
              numberOfLines={4}
              value={newComment}
              onChangeText={setNewComment}
            />

            <TouchableOpacity 
              style={[S.submitReviewBtn, (!newComment.trim() || submitting) && { opacity: 0.5 }]} 
              onPress={submitReview}
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={S.submitReviewText}>Submit Review</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ATTENDEES MODAL */}
      <AttendanceSheet 
        visible={showAttendeesModal}
        onClose={() => setShowAttendeesModal(false)}
        attendees={attendees}
      />
    </View>

  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  stickyHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    backgroundColor: "#fff", zIndex: 100,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 5,
  },
  stickyInner: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15 },
  stickyTitle: { fontSize: 16, fontFamily: "Outfit_700Bold", color: C.ink, flex: 1, textAlign: "center" },
  navIconBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },

  bannerContainer: { width: SW, height: IMG_H },
  banner: { width: "100%", height: "100%" },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.12)" },
  
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
    zIndex: 10
  },

  floatingCard: {
    backgroundColor: "#fff", marginTop: -40, marginHorizontal: PAD, borderRadius: 24, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, elevation: 10,
  },
  categoryTag: { backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { color: C.accent, fontSize: 10, fontFamily: "Outfit_700Bold" },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontFamily: "Outfit_700Bold", color: C.ink },
  mainTitle: { fontSize: 26, fontFamily: "Outfit_700Bold", color: C.ink, marginTop: 10 },
  statText: { fontSize: 13, fontFamily: "Outfit_500Medium", color: C.ink2, marginLeft: 6 },

  section: { paddingHorizontal: PAD, marginTop: 30 },
  sectionTitle: { fontSize: 20, fontFamily: "Outfit_700Bold", color: C.ink, marginBottom: 15 },
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  highlightItem: { flexDirection: "row", alignItems: "center", gap: 15, marginBottom: 15 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  highlightLabel: { fontSize: 14, fontFamily: "Outfit_600SemiBold", color: C.ink },
  highlightVal: { fontSize: 12, color: C.muted, fontFamily: "Outfit_500Medium" },

  seeAll: { color: C.accent, fontSize: 13, fontFamily: "Outfit_600SemiBold" },
  attendeeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarStack: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#fff", overflow: "hidden" },
  avatar: { width: "100%", height: "100%" },
  extraAvatar: { backgroundColor: C.accent, justifyContent: "center", alignItems: "center" },
  extraText: { color: "#fff", fontSize: 10, fontFamily: "Outfit_700Bold" },
  goingCountText: { fontSize: 12, color: C.muted, fontFamily: "Outfit_500Medium" },

  hostCard: {
    flexDirection: "row", alignItems: "center", gap: 15,
    backgroundColor: "#F8FAFC", marginHorizontal: PAD, marginTop: 25,
    padding: 15, borderRadius: 20, borderWidth: 1, borderColor: "#F1F5F9",
  },
  hostImg: { width: 50, height: 50, borderRadius: 25 },
  hostName: { fontSize: 16, fontFamily: "Outfit_700Bold", color: C.ink },
  hostSub: { fontSize: 10, fontFamily: "Outfit_700Bold", color: C.muted, marginTop: 2 },
  messageBtn: { backgroundColor: "#fff", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  messageBtnText: { fontSize: 13, fontFamily: "Outfit_600SemiBold", color: C.ink },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  gridItem: { width: (SW - PAD * 2 - 15) / 2, backgroundColor: "#F8FAFC", padding: 15, borderRadius: 20, alignItems: "center" },
  gridIconBox: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  gridLabel: { fontSize: 14, fontFamily: "Outfit_600SemiBold", color: C.ink },
  gridSub: { fontSize: 10, color: C.muted, fontFamily: "Outfit_500Medium", marginTop: 2 },

  aboutText: { fontSize: 14, color: C.ink2, lineHeight: 22, fontFamily: "Outfit_400Regular" },
  readMore: { color: C.accent, fontFamily: "Outfit_700Bold", fontSize: 12, marginTop: 5 },

  directions: { color: C.accent, fontSize: 11, fontFamily: "Outfit_700Bold" },
  locText: { fontSize: 13, color: C.muted, fontFamily: "Outfit_500Medium", marginLeft: 6, marginBottom: 12 },
  squareMap: { width: SW - PAD * 2, height: 200, borderRadius: 24, overflow: "hidden", backgroundColor: "#F1F5F9" },

  // Joined OTP Card
  otpCard: {
    backgroundColor: C.accent + "08",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: C.accent + "44",
    alignItems: "center",
  },
  otpLabel: { fontSize: 14, fontFamily: "Outfit_700Bold", color: C.accent, marginLeft: 8 },
  otpValue: { fontSize: 40, fontFamily: "Outfit_900Black", color: C.ink, letterSpacing: 10, marginVertical: 8 },
  otpSub: { fontSize: 11, color: C.muted, fontFamily: "Outfit_600SemiBold" },

  // Reviews
  reviewCard: {
    width: SW * 0.75, backgroundColor: C.white, borderRadius: 20, padding: 15,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, elevation: 2,
  },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewName: { fontSize: 13, fontFamily: "Outfit_700Bold", color: C.ink },
  reviewTime: { fontSize: 10, color: C.muted, fontFamily: "Outfit_400Regular" },
  reviewComment: { fontSize: 12, color: C.ink2, fontStyle: "italic", marginTop: 10, lineHeight: 18, fontFamily: "Outfit_400Regular" },
  
  reviewStats: { fontSize: 12, color: C.muted, fontFamily: "Outfit_600SemiBold", marginTop: -10, marginBottom: 15 },
  writeBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.accent + "11", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  writeBtnText: { color: C.accent, fontSize: 12, fontFamily: "Outfit_700Bold" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  modalTitle: { fontSize: 20, fontFamily: "Outfit_700Bold", color: C.ink },
  modalLabel: { fontSize: 14, fontFamily: "Outfit_600SemiBold", color: C.ink, marginBottom: 10, marginTop: 10 },
  starPicker: { flexDirection: "row", gap: 10, marginBottom: 20 },
  modalInput: { backgroundColor: "#F8FAFC", borderRadius: 16, padding: 15, fontSize: 14, color: C.ink, minHeight: 120, textAlignVertical: "top", borderWidth: 1, borderColor: C.border, fontFamily: "Outfit_400Regular" },
  submitReviewBtn: { backgroundColor: C.accent, borderRadius: 16, padding: 18, alignItems: "center", marginTop: 25, shadowColor: C.accent, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitReviewText: { color: "#fff", fontSize: 16, fontFamily: "Outfit_700Bold" },

  // Attendees Modal
  attendeeItem: { flexDirection: "row", alignItems: "center", gap: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  attendeeAvatar: { width: 44, height: 44, borderRadius: 22 },
  attendeeName: { fontSize: 15, fontFamily: "Outfit_700Bold", color: C.ink },
  attendeeSub: { fontSize: 11, color: C.muted, fontFamily: "Outfit_400Regular", marginTop: 2 },

  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F1F5F9",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: PAD, paddingTop: 15,
  },
  footerLabel: { fontSize: 11, fontFamily: "Outfit_600SemiBold", color: C.muted },
  footerPrice: { fontSize: 20, fontFamily: "Outfit_700Bold", color: C.ink },
  perPerson: { fontSize: 12, color: C.muted, fontFamily: "Outfit_400Regular" },
  reserveBtn: { 
    backgroundColor: C.accent, 
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 25, paddingVertical: 15, borderRadius: 18,
    shadowColor: C.accent, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
    flex: 1, marginLeft: 20, justifyContent: "center"
  },
  reserveText: { color: "#fff", fontSize: 16, fontFamily: "Outfit_700Bold" },

  hostActionsRow: { flexDirection: "row", gap: 12, flex: 1 },
  editBtn: { 
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#F1F5F9", paddingVertical: 15, borderRadius: 18,
    borderWidth: 1, borderColor: "#E2E8F0"
  },
  editBtnText: { color: C.ink, fontSize: 15, fontFamily: "Outfit_700Bold" },
  verifyBtn: { 
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.accent, paddingVertical: 15, borderRadius: 18,
    shadowColor: C.accent, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  verifyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Outfit_700Bold" },

  otpInput: { 
    backgroundColor: "#F8FAFC", borderRadius: 16, padding: 20, 
    fontSize: 32, fontFamily: "Outfit_900Black", textAlign: "center", 
    letterSpacing: 15, color: C.ink, marginVertical: 20,
    borderWidth: 1, borderColor: C.border
  },
});