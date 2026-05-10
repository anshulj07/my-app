// app/event-interest/[eventId].tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ActivityIndicator, Pressable, ScrollView, Image,
  StatusBar, StyleSheet, Dimensions, TouchableOpacity, TextInput, Modal, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../../lib/apiFetch";
import AttendanceSheet from "../../components/MyBookings/AttendanceSheet";


const { width: SW } = Dimensions.get("window");

const C = {
  bg:          "#F8FAFC",
  white:       "#FFFFFF",
  border:      "#E2E8F0",
  ink:         "#111827",
  muted:       "#64748B",
  accent:      "#6C63FF",
  accentLight: "#EEF2FF",
  green:       "#10B981",
  greenBg:     "#ECFDF5",
  blue:        "#3B82F6",
  blueBg:      "#EFF6FF",
  red:         "#EF4444",
  redBg:       "#FEF2F2",
};

function timeAgo(date: string | Date | undefined) {
  if (!date) return "Recently";
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

export default function ManageEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey;

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    if (!API_BASE || !userId || !eventId) return;
    setLoading(true);
    try {
      const headers = { "Content-Type": "application/json", "x-api-key": EVENT_API_KEY || "" };
      const [eRes, rRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/events/${eventId}`, { headers }),
        apiFetch(`${API_BASE}/api/reviews?eventId=${eventId}`, { headers })
      ]);
      const eJson = await eRes.json();
      const rJson = await rRes.json();
      if (eJson.ok) {
        setEventData(eJson.event);
        setAttendees(eJson.event?.attendees || []);
      }
      if (rJson.ok) setReviews(rJson.reviews || []);
    } catch (e) {
      console.log("Load error", e);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, userId, eventId, EVENT_API_KEY]);

  useEffect(() => { load(); }, [load]);

  const handleCancelEvent = () => {
    Alert.alert(
      "Cancel Event?",
      "This will remove the event for everyone. This action cannot be undone.",
      [
        { text: "No, Keep it", style: "cancel" },
        { 
          text: "Yes, Cancel it", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiFetch(`${API_BASE}/api/events/${eventId}`, {
                method: "DELETE",
                headers: { "x-api-key": EVENT_API_KEY || "" }
              });
              if (res.ok) {
                router.back();
              } else {
                alert("Failed to cancel event");
              }
            } catch {
              alert("Error canceling event");
            }
          }
        }
      ]
    );
  };

  const handleEditDetails = () => {
    const kind = eventData?.kind === "service" ? "service" : "event";
    router.push({
      pathname: kind === "service" ? "/edit-service/[eventId]" : "/edit-event/[eventId]",
      params: { eventId }
    } as any);
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length < 4) return;
    setVerifying(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/events/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": EVENT_API_KEY || "" },
        body: JSON.stringify({ eventId, creatorClerkId: userId, otp: otpValue }),
      });
      if (res.ok) {
        alert("Guest Verified!");
        setOtpValue("");
        setShowOtpModal(false);
        load();
      } else {
        const json = await res.json();
        alert(json.error || "Invalid OTP");
      }
    } catch {
      alert("Error verifying OTP");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <View style={[S.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  const revenue = eventData?.priceCents ? ((eventData.priceCents * attendees.length) / 100).toFixed(0) : "0";

  // Unified activity feed
  const activityFeed = [
    ...attendees.map(a => ({ type: 'join' as const, name: a.name || "Guest", time: a.joinedAt, timestamp: new Date(a.joinedAt).getTime() })),
    ...reviews.map(r => ({ type: 'review' as const, name: r.userName || "Guest", time: r.createdAt, stars: r.rating, timestamp: new Date(r.createdAt).getTime() }))
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  return (
    <View style={S.screen}>
      <StatusBar barStyle="dark-content" />
      
      <View style={[S.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 10 }}>
          <Text style={S.headerTitle} numberOfLines={1}>Manage Event</Text>
          <Text style={S.headerSub} numberOfLines={1}>{eventData?.title}</Text>
        </View>
        <TouchableOpacity style={S.iconBtn}><Ionicons name="share-outline" size={22} color={C.ink} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={S.statsGrid}>
          <View style={S.statCard}>
            <View style={S.statHeader}>
              <View style={[S.statIcon, { backgroundColor: C.accentLight }]}><Ionicons name="people" size={18} color={C.accent} /></View>
              <Text style={S.trendText}>+100%</Text>
            </View>
            <Text style={S.statLabel}>BOOKINGS</Text>
            <View style={S.statRow}>
               <Text style={S.statValue}>{attendees.length}</Text>
               <Ionicons name="stats-chart" size={20} color={C.accent + "33"} />
            </View>
          </View>

          <View style={S.statCard}>
            <View style={S.statHeader}>
              <View style={[S.statIcon, { backgroundColor: C.greenBg }]}><Ionicons name="wallet" size={18} color={C.green} /></View>
              <Text style={[S.trendText, { color: C.green }]}>LIVE</Text>
            </View>
            <Text style={S.statLabel}>REVENUE</Text>
            <View style={S.statRow}>
               <Text style={S.statValue}>₹{revenue}</Text>
               <Ionicons name="trending-up" size={20} color={C.green + "33"} />
            </View>
          </View>
        </View>

        <Text style={S.sectionTitle}>MANAGEMENT</Text>
        <View style={S.toolGrid}>
          <ToolBtn icon="create-outline" label="Edit Details" sub="Update metadata" onPress={handleEditDetails} />
          <ToolBtn icon="people-outline" label="Attendance List" sub="Manage guests" onPress={() => setShowAttendeeModal(true)} />
          <ToolBtn icon="megaphone-outline" label="Broadcast" sub="Sent announcement" onPress={() => {}} />
          <ToolBtn icon="scan-outline" label="Check-in" sub="Scan entry codes" onPress={() => setShowOtpModal(true)} />
        </View>

        <TouchableOpacity style={S.cancelCard} onPress={handleCancelEvent}>
          <View style={[S.statIcon, { backgroundColor: C.redBg }]}><Ionicons name="close-circle" size={18} color={C.red} /></View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={S.cancelTitle}>Cancel Event</Text>
            <Text style={S.cancelSub}>This action is permanent</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.muted} />
        </TouchableOpacity>

        <View style={S.feedHeader}>
           <Text style={S.sectionTitle}>ACTIVITY FEED</Text>
           <TouchableOpacity><Text style={S.viewAllText}>View all</Text></TouchableOpacity>
        </View>
        
        <View style={S.feedBox}>
          {activityFeed.length === 0 ? (
            <Text style={[S.muted, { textAlign: 'center', padding: 20 }]}>No recent activity</Text>
          ) : (
            activityFeed.map((item, i) => (
              <FeedItem 
                key={i} 
                name={item.name} 
                action={item.type === 'join' ? "booked a space" : "left a review"} 
                time={timeAgo(item.time)} 
                type={item.type} 
                stars={item.stars} 
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* OTP MODAL */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <View style={S.modalContent}>
            <View style={S.modalHeader}>
               <Text style={S.modalTitle}>Verify Guest OTP</Text>
               <TouchableOpacity onPress={() => setShowOtpModal(false)}><Ionicons name="close" size={24} color={C.ink} /></TouchableOpacity>
            </View>
            <TextInput
              style={S.otpInput}
              placeholder="0 0 0 0"
              keyboardType="number-pad"
              maxLength={4}
              value={otpValue}
              onChangeText={setOtpValue}
              autoFocus
            />
            <TouchableOpacity style={S.submitBtn} onPress={handleVerifyOtp} disabled={verifying}>
               {verifying ? <ActivityIndicator color="#fff" /> : <Text style={S.submitBtnText}>Verify & Check-in</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ATTENDEES MODAL */}
      <AttendanceSheet 
        visible={showAttendeeModal}
        onClose={() => setShowAttendeeModal(false)}
        attendees={attendees}
      />
    </View>

  );
}

function ToolBtn({ icon, label, sub, onPress }: any) {
  return (
    <TouchableOpacity style={S.toolBtn} onPress={onPress}>
      <View style={S.toolIconBox}><Ionicons name={icon} size={22} color={C.accent} /></View>
      <Text style={S.toolLabel}>{label}</Text>
      <Text style={S.toolSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

function FeedItem({ name, action, time, type, stars }: any) {
  return (
    <View style={S.feedItem}>
      <View style={S.feedIcon}>
        <Ionicons name={type === "join" ? "people" : type === "review" ? "star" : "mail"} size={18} color={C.accent} />
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={S.feedText}><Text style={{ fontWeight: "700" }}>{name}</Text> {action}</Text>
        <Text style={S.feedTime}>{time}</Text>
      </View>
      {type === "review" && (
        <View style={{ flexDirection: "row" }}>
          {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={10} color={i <= stars ? "#FFD700" : "#E2E8F0"} />)}
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 20, backgroundColor: C.white },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: C.ink },
  headerSub: { fontSize: 11, color: C.muted, fontWeight: "500", marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row", gap: 15, padding: 20 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 24, padding: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  trendText: { fontSize: 10, fontWeight: "800", color: C.accent },
  statLabel: { fontSize: 10, fontWeight: "800", color: C.muted, letterSpacing: 0.5 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 5 },
  statValue: { fontSize: 24, fontWeight: "900", color: C.ink },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: C.muted, marginLeft: 20, marginTop: 30, marginBottom: 15, letterSpacing: 1 },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", gap: 15, paddingHorizontal: 20 },
  toolBtn: { width: (SW - 55) / 2, backgroundColor: C.white, borderRadius: 24, padding: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  toolIconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  toolLabel: { fontSize: 14, fontWeight: "800", color: C.ink },
  toolSub: { fontSize: 11, color: C.muted, fontWeight: "500", marginTop: 2 },
  cancelCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.redBg + "44", marginHorizontal: 20, marginTop: 20, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: C.red + "11" },
  cancelTitle: { fontSize: 14, fontWeight: "800", color: C.ink },
  cancelSub: { fontSize: 11, color: C.muted, fontWeight: "500" },
  feedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingRight: 20 },
  viewAllText: { fontSize: 12, fontWeight: "700", color: C.accent },
  feedBox: { backgroundColor: C.white, marginHorizontal: 20, borderRadius: 24, padding: 10 },
  feedItem: { flexDirection: "row", alignItems: "center", padding: 15 },
  feedIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" },
  feedText: { fontSize: 13, color: C.ink },
  feedTime: { fontSize: 11, color: C.muted, fontWeight: "500", marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: C.ink },
  otpInput: { backgroundColor: "#F1F5F9", borderRadius: 16, padding: 20, fontSize: 24, fontWeight: "700", textAlign: "center", letterSpacing: 10, marginBottom: 20 },
  submitBtn: { backgroundColor: C.accent, borderRadius: 16, padding: 18, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  attendeeItem: { flexDirection: "row", alignItems: "center", gap: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  attendeeAvatar: { width: 44, height: 44, borderRadius: 22 },
  attendeeName: { fontSize: 15, fontWeight: "800", color: C.ink },
  attendeeSub: { fontSize: 11, color: C.muted, fontWeight: "500", marginTop: 2 },
  profileBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#F8FAFC", borderRadius: 8, borderWidth: 1, borderColor: C.border },
  profileBtnText: { fontSize: 12, fontWeight: "700", color: C.ink },
});
