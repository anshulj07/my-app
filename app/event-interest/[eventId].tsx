//D:\mYapp1\frontend\app\event-interest\[eventId].tsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  View, Text, ActivityIndicator, Pressable, FlatList, Image,
  SectionList, RefreshControl, StatusBar, Platform, StyleSheet, Dimensions,
  LayoutAnimation, UIManager, Animated, TouchableOpacity, Modal, ScrollView, TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle, G } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

const { width: W } = Dimensions.get("window");

type EventKind = "free" | "paid" | "service";

type AttendeeRow = {
  clerkId: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  imageUrl?: string;
  joinedAt?: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
};

type BookingRow = {
  _id: string;
  customerClerkId?: string;
  customerName?: string;
  customerEmail?: string;
  whenISO?: string;
  notes?: string;
};

type EventDoc = {
  _id: string;
  title: string;
  emoji?: string;
  kind: EventKind;
  attendance?: number | null;
  views?: number;
  attendees?: any[];
  pendingRequests?: any[];
  creatorClerkId?: string;
};

function safeJson(txt: string) { try { return JSON.parse(txt); } catch { return null; } }

function dateKey(iso?: string) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function fmtJoinedAt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// Animated Donut Chart Component
function DonutChart({ checkedInPct, uncheckedPct, remainingPct }: { 
  checkedInPct: number; 
  uncheckedPct: number; 
  remainingPct: number;
}) {
  const animatedCheckedIn = useRef(new Animated.Value(0)).current;
  const animatedUnchecked = useRef(new Animated.Value(0)).current;
  const animatedRemaining = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedCheckedIn, {
        toValue: checkedInPct,
        duration: 1200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedUnchecked, {
        toValue: uncheckedPct,
        duration: 1200,
        delay: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedRemaining, {
        toValue: remainingPct,
        duration: 1200,
        delay: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, [checkedInPct, uncheckedPct, remainingPct]);

  const size = 200;
  const strokeWidth = 35;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [currentCheckedIn, setCurrentCheckedIn] = useState(0);
  const [currentUnchecked, setCurrentUnchecked] = useState(0);
  const [currentRemaining, setCurrentRemaining] = useState(0);

  useEffect(() => {
    const listenerId1 = animatedCheckedIn.addListener(({ value }) => setCurrentCheckedIn(value));
    const listenerId2 = animatedUnchecked.addListener(({ value }) => setCurrentUnchecked(value));
    const listenerId3 = animatedRemaining.addListener(({ value }) => setCurrentRemaining(value));

    return () => {
      animatedCheckedIn.removeListener(listenerId1);
      animatedUnchecked.removeListener(listenerId2);
      animatedRemaining.removeListener(listenerId3);
    };
  }, []);

  const checkedInArc = (currentCheckedIn / 100) * circumference;
  const uncheckedArc = (currentUnchecked / 100) * circumference;
  const remainingArc = (currentRemaining / 100) * circumference;

  return (
    <View style={{ position: 'relative' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
  {/* Checked In */}
  <Circle
    cx={size / 2}
    cy={size / 2}
    r={radius}
    stroke="#2E3B8E"
    strokeWidth={strokeWidth}
    fill="none"
    strokeDasharray={`${checkedInArc} ${circumference}`}
    strokeDashoffset={0}
    strokeLinecap="butt"
  />

  {/* Unchecked */}
  <Circle
    cx={size / 2}
    cy={size / 2}
    r={radius}
    stroke="#5B63D3"
    strokeWidth={strokeWidth}
    fill="none"
    strokeDasharray={`${uncheckedArc} ${circumference}`}
    strokeDashoffset={-checkedInArc}
    strokeLinecap="butt"
  />

  {/* Remaining */}
  <Circle
    cx={size / 2}
    cy={size / 2}
    r={radius}
    stroke="#B8BCE8"
    strokeWidth={strokeWidth}
    fill="none"
    strokeDasharray={`${remainingArc} ${circumference}`}
    strokeDashoffset={-(checkedInArc + uncheckedArc)}
    strokeLinecap="butt"
  />
</G>

      </Svg>
    </View>
  );
}



export default function EventInterestScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const params = useLocalSearchParams<{ eventId: string; kind: EventKind; title?: string; emoji?: string }>();
  const eventId = String(params.eventId || "");
  const kind = (String(params.kind || "free") as EventKind);
  const titleParam = String(params.title || "");
  const emojiParam = String(params.emoji || "📍");

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
  }), [EVENT_API_KEY]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventDoc | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AttendeeRow[]>([]);
  const [bookingSections, setBookingSections] = useState<Array<{ title: string; data: BookingRow[] }>>([]);
  const [admitBusy, setAdmitBusy] = useState<Record<string, boolean>>({});
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    if (!API_BASE) { setErr("Missing API base URL."); setLoading(false); setRefreshing(false); return; }
    if (!userId) { setErr("You must be signed in."); setLoading(false); setRefreshing(false); return; }
    if (!eventId) { setErr("Missing event ID."); setLoading(false); setRefreshing(false); return; }

    setErr(null); setLoading(true);

    try {
      if (kind === "service") {
        const res = await fetch(
          `${API_BASE}/api/bookings/service-bookings?eventId=${encodeURIComponent(eventId)}&creatorClerkId=${encodeURIComponent(userId)}`,
          { method: "GET", headers }
        );
        const json = safeJson(await res.text());
        if (!res.ok) throw new Error(json?.error || "Failed to fetch service bookings");

        const list: BookingRow[] = Array.isArray(json?.bookings) ? json.bookings : [];
        const map = new Map<string, BookingRow[]>();
        for (const b of list) {
          const k = dateKey(b.whenISO);
          map.set(k, [...(map.get(k) || []), b]);
        }
        const sections = Array.from(map.entries())
          .map(([k, v]) => ({ title: k, data: v.sort((a, b) => String(a.whenISO || "").localeCompare(String(b.whenISO || ""))) }))
          .sort((a, b) => a.title.localeCompare(b.title));
        setBookingSections(sections);
        setAttendees([]);
      } else {
        const res = await fetch(
          `${API_BASE}/api/events/${encodeURIComponent(eventId)}`,
          { method: "GET", headers }
        );
        const json = safeJson(await res.text());
        if (!res.ok) throw new Error(json?.error || "Event not found");

        const ev = json?.event;
        setEventData(ev);

        const raw = Array.isArray(ev?.attendees) ? ev.attendees : [];

        const list: AttendeeRow[] = raw
          .map((a: any) => {
            if (!a) return null;
            if (typeof a === "string") return { clerkId: a };
            return {
              clerkId: String(a.clerkId || a.clerkUserId || a.id || ""),
              name: typeof a.name === "string" ? a.name : "",
              email: typeof a.email === "string" ? a.email : "",
              phone: typeof a.phone === "string" ? a.phone : "",
              message: typeof a.message === "string" ? a.message : "",
              imageUrl: (a.imageUrl || a.avatar || a.photo) || "",
              joinedAt: typeof a.joinedAt === "string" ? a.joinedAt : "",
              checkedIn: !!a.checkedIn,
              checkedInAt: a.checkedInAt || null,
            };
          })
          .filter((a: any) => a && a.clerkId) as AttendeeRow[];

        setAttendees(list);
        setBookingSections([]);

        const rawPending = Array.isArray(ev?.pendingRequests) ? ev.pendingRequests : [];
        const pendingList: AttendeeRow[] = rawPending.map((p: any) => ({
          clerkId: String(p.clerkUserId || ""),
          name: p.name || "",
          message: p.message || "",
          imageUrl: (p.imageUrl || p.avatar || p.photo) || "",
          joinedAt: p.requestedAt || "",
          email: p.email || "",
          phone: p.phone || "",
        })).filter((p: AttendeeRow) => p.clerkId);
        setPendingRequests(pendingList);
      }
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [API_BASE, userId, eventId, kind, headers]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const handleAdmitReject = async (targetClerkId: string, action: "admit" | "reject") => {
    if (!API_BASE || !userId || !eventId) return;
    const busyKey = `${targetClerkId}-${action}`;
    setAdmitBusy(prev => ({ ...prev, [busyKey]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/events/admit-request`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId,
          creatorClerkId: userId,
          requestClerkUserId: targetClerkId,
          action,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Action failed");
      
      if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental)
        UIManager.setLayoutAnimationEnabledExperimental(true);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      await load();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert(e.message);
    } finally {
      setAdmitBusy(prev => {
        const next = { ...prev };
        delete next[busyKey];
        return next;
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 4) {
      alert("Please enter a valid 4-digit OTP");
      return;
    }
    if (!API_BASE || !userId || !eventId) return;

    setVerifying(true);
    try {
      const res = await fetch(`${API_BASE}/api/events/checkin`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId,
          creatorClerkId: userId,
          otp: otpValue,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Verification failed");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert(`Verified: ${json.attendee?.name || "Guest"}`);
      setOtpValue("");
      setShowOtpModal(false);
      await load();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert(e.message);
    } finally {
      setVerifying(false);
    }
  };

  // Calculate percentages based on actual attendance data
  const totalAttendees = attendees.length;
  const checkedInCount = attendees.filter((a) => a.checkedIn).length;
  const uncheckedCount = totalAttendees - checkedInCount;
  const capacity = eventData?.attendance || null;
  
  // Calculate percentages
  let checkedInPct = 0;
  let uncheckedPct = 0;
  let remainingPct = 0;

  if (capacity && capacity > 0) {
    // If capacity is set, calculate based on total capacity
    checkedInPct = Math.round((checkedInCount / capacity) * 100);
    uncheckedPct = Math.round((uncheckedCount / capacity) * 100);
    remainingPct = Math.max(0, 100 - checkedInPct - uncheckedPct);
  } else if (totalAttendees > 0) {
    // If no capacity, show only checked in vs unchecked
    checkedInPct = Math.round((checkedInCount / totalAttendees) * 100);
    uncheckedPct = Math.round((uncheckedCount / totalAttendees) * 100);
    remainingPct = 0;
  }

  // For service events, eventData is never fetched — only the host navigates here, so always true
  const isHost = kind === "service" ? true : userId === eventData?.creatorClerkId;

  const headerTitle = kind === "service" ? "Service Bookings" : "Manage Attendees";
  const currentTitle = eventData?.title || titleParam;
  const currentEmoji = eventData?.emoji || emojiParam;

  const TOP_PAD = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 40;

  return (
    <View style={[sc.screen, { paddingTop: TOP_PAD }]}>
      <StatusBar barStyle="dark-content" translucent />
      
      {/* Header */}
      <View style={sc.header}>
        <Pressable onPress={() => router.back()} style={sc.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={sc.emojiText}>{currentEmoji}</Text>
            <Text style={sc.eventTitle} numberOfLines={1}>{currentTitle}</Text>
          </View>
          <Text style={sc.headerActionText}>{headerTitle}</Text>
        </View>

        {isHost && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity 
              style={[sc.notifBtn, { backgroundColor: "#E0E7FF" }]} 
              onPress={() => setShowOtpModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="key-outline" size={22} color="#5B63D3" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={sc.notifBtn} 
              onPress={() => setShowNotifications(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color="#111827" />
              {pendingRequests.length > 0 && (
                <View style={sc.notifBadge}>
                  <Text style={sc.notifBadgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={sc.center}>
          <ActivityIndicator color="#5B63D3" size="large" />
          <Text style={sc.muted}>Loading dashboard…</Text>
        </View>
      ) : err ? (
        <View style={sc.center}>
          <View style={sc.errorIcon}>
            <Ionicons name="alert-circle" size={40} color="#F87171" />
          </View>
          <Text style={sc.errText}>{err}</Text>
          <Pressable onPress={load} style={sc.retryBtn}><Text style={sc.retryText}>Retry</Text></Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {kind === "service" ? (
            <SectionList
              sections={bookingSections}
              keyExtractor={(item) => item._id}
              contentContainerStyle={sc.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B63D3" />}
              ListEmptyComponent={<EmptyCard title="No bookings yet" sub="When users book your service, they'll appear here." />}
              renderSectionHeader={({ section }) => (
                <View style={sc.sectionHead}>
                  <Text style={sc.sectionTitle}>{section.title}</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <View style={sc.card}>
                  <View style={sc.cardTopRow}>
                    <View style={sc.avatarBox}>
                      <Text style={sc.avatarText}>{(item.customerName || "?").charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sc.cardName}>{item.customerName || "Customer"}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: "/newApp/chat/[userId]",
                          params: {
                            userId: item.customerClerkId,
                            name: item.customerName || "Customer",
                          },
                        } as any);
                      }}
                      style={sc.chatBtnSmall}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#5B63D3" />
                    </TouchableOpacity>
                  </View>
                  {!!item.whenISO && (
                    <View style={sc.metaRow}>
                      <Ionicons name="time-outline" size={14} color="rgba(0,0,0,0.4)" />
                      <Text style={sc.cardMeta}>{new Date(item.whenISO).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    </View>
                  )}
                  {!!item.notes && (
                    <View style={sc.notesBox}>
                      <Text style={sc.notesText}>"{item.notes}"</Text>
                    </View>
                  )}
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            <FlatList
              data={attendees}
              keyExtractor={(x) => x.clerkId}
              contentContainerStyle={sc.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B63D3" />}
              ListHeaderComponent={
                <View>
                  {/* Analytics Dashboard moved inside FlatList Header */}
                  <View style={{ marginBottom: 24 }}>
                    {/* Engagement Stat */}
                    <View style={sc.engagementCard}>
                      <View style={sc.engagementInfo}>
                        <Text style={sc.engagementLabel}>EVENT ENGAGEMENT</Text>
                        <Text style={sc.engagementValue}>{eventData?.views || 0}<Text style={sc.engagementUnit}> views</Text></Text>
                      </View>
                      <View style={sc.engagementIcon}>
                        <Ionicons name="eye" size={24} color="#5B63D3" />
                      </View>
                    </View>

                    {/* Metric Grid */}
                    <View style={sc.metricRow}>
                      <View style={sc.metricCard}>
                        <Text style={sc.metricValue}>{capacity || "∞"}</Text>
                        <Text style={sc.metricLabel}>Total Spots</Text>
                      </View>
                      <View style={sc.metricCard}>
                        <Text style={[sc.metricValue, { color: "#5B63D3" }]}>{totalAttendees}</Text>
                        <Text style={sc.metricLabel}>Joined</Text>
                      </View>
                      <View style={sc.metricCard}>
                        <Text style={[sc.metricValue, { color: "#2E3B8E" }]}>{checkedInCount}</Text>
                        <Text style={sc.metricLabel}>Verified</Text>
                      </View>
                    </View>

                    {/* Progress Card (Donut only) */}
                    <View style={sc.progContainer}>
                      <View style={sc.progHeader}>
                        <Text style={sc.progTitle}>Admission Progress</Text>
                        <Text style={sc.progSub}>{checkedInCount} verified out of {totalAttendees} joined</Text>
                      </View>
                      <View style={sc.chartWrapper}>
                        <DonutChart checkedInPct={checkedInPct} uncheckedPct={uncheckedPct} remainingPct={remainingPct} />
                        <View style={{ position: 'absolute', alignItems: 'center' }}>
                          <Text style={{ fontSize: 24, fontWeight: '900', color: '#1F2937' }}>{checkedInCount}</Text>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Verified</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Join Requests and Activity are now in the Notification Hub icon */}
                  <View style={sc.listHeaderRow}>
                    <Ionicons name="people" size={18} color="#1F2937" />
                    <Text style={sc.listLabel}>Attendance List ({attendees.length})</Text>
                  </View>
                </View>
              }
              ListEmptyComponent={<EmptyCard title="No attendees yet" sub="When users join your event, their details will show up here." />}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [sc.card, item.checkedIn && sc.cardChecked, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }]}
                  onPress={() => {
                    if (item.clerkId) {
                      router.push({
                        pathname: "/profile/[clerkUserId]",
                        params: {
                          clerkUserId: item.clerkId,
                          name: item.name || "",
                          imageUrl: item.imageUrl || "",
                        },
                      } as any);
                    }
                  }}
                >
                  <View style={sc.cardTopRow}>
                    <View style={sc.avatarBox}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={sc.avatarImage} />
                      ) : (
                        <Text style={[sc.avatarText, item.checkedIn && { color: "#2E3B8E" }]}>
                          {(item.name || "G").charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sc.cardName}>{item.name || "Guest"}</Text>
                      <Text style={sc.cardTime}>Joined {fmtJoinedAt(item.joinedAt)}</Text>
                    </View>
                    {item.checkedIn ? (
                      <View style={sc.checkedInBadge}>
                        <Ionicons name="checkmark-done" size={12} color="#2E3B8E" />
                        <Text style={sc.checkedInBadgeText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={sc.joinedBadgeBadge}>
                        <Ionicons name="people-outline" size={12} color="#6B7280" />
                        <Text style={sc.joinedBadgeBadgeText}>Joined</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: "/newApp/chat/[userId]",
                          params: {
                            userId: item.clerkId,
                            name: item.name || "Guest",
                            avatarUrl: item.imageUrl || "",
                          },
                        } as any);
                      }}
                      style={sc.chatBtnSmall}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#5B63D3" />
                    </TouchableOpacity>

                    <Ionicons name="chevron-forward" size={14} color="rgba(148,163,184,0.3)" style={{ marginLeft: 4 }} />
                  </View>


                  {!!item.message && (
                    <View style={sc.notesBox}>
                      <Ionicons name="chatbubble-ellipses" size={12} color="#94A3B8" style={{ marginTop: 2 }} />
                      <Text style={sc.notesText}>{item.message}</Text>
                    </View>
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
          <NotificationModal 
            visible={showNotifications} 
            onClose={() => setShowNotifications(false)} 
            pending={pendingRequests}
            attendees={attendees}
            eventTitle={currentTitle}
            eventEmoji={currentEmoji}
            onAdmit={(id) => handleAdmitReject(id, "admit")}
            onReject={(id) => handleAdmitReject(id, "reject")}
            admitBusy={admitBusy}
          />

          {/* OTP Verification Modal */}
          <Modal visible={showOtpModal} animationType="fade" transparent statusBarTranslucent>
            <View style={sc.modalOverlay}>
              <View style={sc.otpContent}>
                <Text style={sc.otpTitle}>Verify Attendee</Text>
                <Text style={sc.otpSub}>Ask the guest for their 4-digit check-in OTP</Text>
                
                <TextInput
                  style={sc.otpInput}
                  placeholder="0 0 0 0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otpValue}
                  onChangeText={setOtpValue}
                  autoFocus
                />

                <View style={sc.otpBtnRow}>
                  <TouchableOpacity 
                    onPress={() => { setShowOtpModal(false); setOtpValue(""); }} 
                    style={sc.otpCancelBtn}
                  >
                    <Text style={sc.otpCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleVerifyOtp} 
                    disabled={verifying || otpValue.length !== 4}
                    style={[sc.otpSubmitBtn, (verifying || otpValue.length !== 4) && { opacity: 0.6 }]}
                  >
                    {verifying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={sc.otpSubmitText}>Verify</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}

function NotificationModal({ 
  visible, onClose, pending, attendees, eventTitle, eventEmoji, onAdmit, onReject, admitBusy
}: {
  visible: boolean;
  onClose: () => void;
  pending: AttendeeRow[];
  attendees: AttendeeRow[];
  eventTitle: string;
  eventEmoji: string;
  onAdmit: (id: string) => void;
  onReject: (id: string) => void;
  admitBusy: Record<string, boolean>;
}) {
  const insets = useSafeAreaInsets();
  
  // Recent activity: attendees sorted by joinedAt
  const activity = [...attendees].sort((a,b) => String(b.joinedAt || "").localeCompare(String(a.joinedAt || ""))).slice(0, 10);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#FDFCF8" }}>
        {/* Header Section from Screenshot */}
        <View style={{ backgroundColor: "#FDFCF8", paddingTop: insets.top + 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20 }}>
            <TouchableOpacity 
              onPress={onClose} 
              style={[sc.backBtn, { backgroundColor: '#F3F4F6', borderWidth: 0 }]}
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
            <View style={{ 
              width: 56, height: 56, borderRadius: 16, 
              backgroundColor: '#E8FAF7', 
              alignItems: 'center', justifyContent: 'center' 
            }}>
              <Ionicons name="notifications" size={30} color="#FBBF24" />
            </View>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827' }}>Notifications</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500' }}>Requests & recent activity</Text>
            </View>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Join Requests */}
          {pending.length > 0 && (
            <View style={{ marginBottom: 32 }}>
              <View style={sc.notifSectionTitleRow}>
                <View style={sc.redDot} />
                <Text style={sc.notifSectionTitle}>JOIN REQUESTS</Text>
                <View style={sc.notifSectionBadge}>
                  <Text style={sc.notifSectionBadgeText}>{pending.length}</Text>
                </View>
              </View>
              {pending.map(p => (
                <PendingRequestCard 
                  key={p.clerkId} 
                  item={p} 
                  onAdmit={() => onAdmit(p.clerkId)} 
                  onReject={() => onReject(p.clerkId)} 
                  admitBusy={admitBusy}
                  eventEmoji={eventEmoji}
                  eventTitle={eventTitle}
                />
              ))}
            </View>
          )}

          {/* Recent Activity */}
          <View>
            <View style={sc.notifSectionTitleRow}>
              <View style={[sc.redDot, { backgroundColor: "#10B981" }]} />
              <Text style={sc.notifSectionTitle}>RECENT ACTIVITY</Text>
            </View>
            {activity.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No recent activity yet.</Text>
              </View>
            ) : (
              activity.map(a => (
                <View key={a.clerkId} style={sc.notifActivityRow}>
                  <View style={sc.notifActivityAvatar}>
                    {a.imageUrl ? (
                      <Image source={{ uri: a.imageUrl }} style={sc.notifActivityImg} />
                    ) : (
                      <Text style={sc.notifActivityInitial}>{(a.name || "U").charAt(0)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={sc.notifActivityText}>
                      <Text style={{ fontWeight: '700' }}>{a.name || "Guest"}</Text> joined your event
                    </Text>
                    <Text style={sc.notifActivityTime}>{fmtJoinedAt(a.joinedAt)}</Text>
                  </View>
                  <View style={sc.joinedBadge}>
                    <Text style={sc.joinedBadgeText}>Joined ✓</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PendingRequestCard({ item, onAdmit, onReject, admitBusy, eventEmoji, eventTitle }: {
  item: AttendeeRow;
  onAdmit: () => void;
  onReject: () => void;
  admitBusy: Record<string, boolean>;
  eventEmoji?: string;
  eventTitle?: string;
}) {
  const admitKey = `${item.clerkId}-admit`;
  const rejectKey = `${item.clerkId}-reject`;
  const busy = !!(admitBusy[admitKey] || admitBusy[rejectKey]);

  return (
    <View style={sc.notifCard}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={sc.notifAvatarLarge}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={sc.notifImgLarge} />
          ) : (
            <View style={[sc.notifImgLarge, { backgroundColor: '#B8BCE8', justifyContent: 'center' }]}>
              <Text style={{ textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '700' }}>
                {(item.name || "P").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sc.notifCardTitle}>
            <Text style={{ fontWeight: '700' }}>{item.name || "User"}</Text> wants to join {eventEmoji} {eventTitle}
          </Text>
          <Text style={sc.notifCardTime}>{fmtJoinedAt(item.joinedAt)}</Text>
        </View>
      </View>

      {!!item.message && (
        <View style={sc.notifMsgBox}>
          <Text style={sc.notifMsgText}>"{item.message}"</Text>
        </View>
      )}

      <View style={sc.notifBtnRow}>
        <Pressable
          onPress={onAdmit}
          disabled={busy}
          style={({ pressed }) => [sc.notifAdmitBtn, busy && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}
        >
          {admitBusy[admitKey] ? <ActivityIndicator color="#fff" size="small" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={sc.notifAdmitText}>Admit</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={onReject}
          disabled={busy}
          style={({ pressed }) => [sc.notifDeclineBtn, busy && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}
        >
          {admitBusy[rejectKey] ? <ActivityIndicator color="#6B7280" size="small" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="close" size={16} color="#6B7280" />
              <Text style={sc.notifDeclineText}>Decline</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function EmptyCard({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={sc.emptyCard}>
      <Ionicons name="hourglass-outline" size={40} color="#D1D5DB" />
      <Text style={sc.emptyTitle}>{title}</Text>
      <Text style={sc.emptySub}>{sub}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 20, gap: 14 },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center",
  },
  emojiText: { fontSize: 20 },
  eventTitle: { color: "#1F2937", fontSize: 18, fontWeight: "700", flex: 1 },
  headerActionText: { color: "#6B7280", fontSize: 13, fontWeight: "600", marginTop: 1 },

  notifBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#E8FAF7", alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "#F87171", alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: "#F8F9FA",
  },
  notifBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "900" },

  notifHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
  },
  notifHeaderTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  notifHeaderSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  notifSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 12 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F87171" },
  notifSectionTitle: { fontSize: 12, fontWeight: "800", color: "#6B7280", letterSpacing: 0.5 },
  notifSectionBadge: {
    paddingHorizontal: 8, height: 18, borderRadius: 9,
    backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center",
  },
  notifSectionBadgeText: { color: "#F87171", fontSize: 11, fontWeight: "900" },

  notifCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  notifAvatarLarge: { width: 44, height: 44, borderRadius: 18, overflow: 'hidden' },
  notifImgLarge: { width: "100%", height: "100%" },
  notifCardTitle: { fontSize: 14, color: "#111827", lineHeight: 20 },
  notifCardTime: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  notifMsgBox: {
    marginTop: 14, padding: 14, borderRadius: 14,
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6",
  },
  notifMsgText: { fontSize: 13, color: "#4B5563", fontStyle: "italic" },
  notifBtnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  notifAdmitBtn: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: "#10B981", alignItems: "center", justifyContent: "center",
  },
  notifAdmitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  notifDeclineBtn: {
    flex: 1, height: 44, borderRadius: 12,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center",
  },
  notifDeclineText: { color: "#6B7280", fontWeight: "600", fontSize: 14 },

  notifActivityRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 20, padding: 16, marginBottom: 12,
  },
  notifActivityAvatar: { width: 40, height: 40, borderRadius: 16, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  notifActivityImg: { width: '100%', height: '100%' },
  notifActivityInitial: { color: '#5B63D3', fontWeight: '700', fontSize: 16 },
  notifActivityText: { fontSize: 13, color: '#111827', lineHeight: 18 },
  notifActivityTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  joinedBadge: {
    paddingHorizontal: 10, height: 24, borderRadius: 12,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
  },
  joinedBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '800' },

  chartContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  chartWrapper: {
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  legendContainer: {
    width: "100%",
    gap: 12,
  },


  list: { paddingHorizontal: 16, paddingBottom: 100 },
  listHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 4 },
  listLabel: { color: "#1F2937", fontSize: 15, fontWeight: "700" },

  sectionHead: { marginTop: 20, marginBottom: 10, paddingHorizontal: 4 },
  sectionTitle: { color: "#5B63D3", fontWeight: "700", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 },

  card: {
    padding: 16, borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  cardChecked: {
    backgroundColor: "rgba(46,59,142,0.03)",
    borderColor: "rgba(46,59,142,0.15)",
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBox: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "rgba(91,99,211,0.07)",
    borderWidth: 1.5, borderColor: "rgba(91,99,211,0.15)",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarText: { color: "#5B63D3", fontSize: 18, fontWeight: "700" },
  cardName: { color: "#1F2937", fontWeight: "700", fontSize: 15 },
  cardTime: { color: "#6B7280", fontSize: 11, fontWeight: "500", marginTop: 2 },

  checkedInBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "rgba(46,59,142,0.1)",
    borderWidth: 1, borderColor: "rgba(46,59,142,0.2)",
  },
  checkedInBadgeText: { color: "#2E3B8E", fontSize: 10, fontWeight: "700" },
  pendingBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  pendingBadgeText: { color: "#6B7280", fontSize: 10, fontWeight: "600" },
  joinedBadgeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  joinedBadgeBadgeText: { color: "#6B7280", fontSize: 10, fontWeight: "700" },

  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
    padding: 24,
  },
  otpContent: {
    width: "100%", backgroundColor: "#fff",
    borderRadius: 24, padding: 24,
    alignItems: "center",
  },
  otpTitle: { fontSize: 20, fontWeight: "900", color: "#111827", marginBottom: 8 },
  otpSub: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 },
  otpInput: {
    width: "100%", height: 60, backgroundColor: "#F3F4F6",
    borderRadius: 16, textAlign: "center", fontSize: 32,
    fontWeight: "900", color: "#111827", letterSpacing: 10,
    marginBottom: 24,
  },
  otpBtnRow: { flexDirection: "row", gap: 12, width: "100%" },
  otpCancelBtn: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  otpCancelText: { color: "#4B5563", fontWeight: "600" },
  otpSubmitBtn: {
    flex: 2, height: 48, borderRadius: 14,
    backgroundColor: "#5B63D3", alignItems: "center", justifyContent: "center",
  },
  otpSubmitText: { color: "#fff", fontWeight: "700" },

  contactRow: { flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" },
  contactChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1, borderColor: "#E5E7EB",
    maxWidth: W * 0.5,
  },
  contactChipText: { color: "#4B5563", fontSize: 11, fontWeight: "500" },

  notesBox: {
    marginTop: 14, padding: 12, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    flexDirection: "row", gap: 8,
  },
  notesText: { color: "#4B5563", fontSize: 12, fontWeight: "500", lineHeight: 18, flex: 1 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  cardMeta: { color: "#6B7280", fontSize: 12, fontWeight: "500" },

  admitBtn: {
    flex: 1, height: 42, borderRadius: 12,
    backgroundColor: "#5B63D3", alignItems: "center", justifyContent: "center",
  },
  admitText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  rejectBtn: {
    flex: 1, height: 42, borderRadius: 12,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  rejectText: { color: "#4B5563", fontWeight: "600", fontSize: 13 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  errorIcon: { marginBottom: 16 },
  errText: { color: "#EF4444", fontWeight: "600", textAlign: "center", lineHeight: 22 },
  muted: { color: "#6B7280", marginTop: 14, fontWeight: "500" },
  retryBtn: {
    marginTop: 20, paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 12, backgroundColor: "rgba(91,99,211,0.1)",
    borderWidth: 1, borderColor: "rgba(91,99,211,0.3)",
  },
  retryText: { color: "#5B63D3", fontWeight: "700" },

  engagementCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(91,99,211,0.06)", borderRadius: 20,
    padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(91,99,211,0.1)",
  },
  engagementInfo: { flex: 1 },
  engagementLabel: { fontSize: 10, fontWeight: "800", color: "#5B63D3", letterSpacing: 1, marginBottom: 4 },
  engagementValue: { fontSize: 24, fontWeight: "900", color: "#1F2937" },
  engagementUnit: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  engagementIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },

  metricRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  metricValue: { fontSize: 20, fontWeight: "900", color: "#1F2937", marginBottom: 4 },
  metricLabel: { fontSize: 10, fontWeight: "800", color: "#6B7280", textTransform: "uppercase" },

  progContainer: { backgroundColor: "#fff", padding: 20, borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  progHeader: { marginBottom: 16 },
  progTitle: { fontSize: 15, fontWeight: "800", color: "#1F2937", marginBottom: 4 },
  progSub: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  progBarOuter: { height: 12, backgroundColor: "#F3F4F6", borderRadius: 6, flexDirection: "row", overflow: "hidden" },
  progSegment: { height: "100%" },
  progLegend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  legItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legDot: { width: 8, height: 8, borderRadius: 4 },
  legText: { fontSize: 11, fontWeight: "600", color: "#4B5563" },

  emptyCard: {
    paddingVertical: 40, alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB",
    marginTop: 10,
  },
  emptyTitle: { color: "#1F2937", fontWeight: "700", fontSize: 16, marginTop: 12 },
  emptySub: { color: "#6B7280", marginTop: 6, fontWeight: "500", textAlign: "center", paddingHorizontal: 30 },
  chatBtnSmall: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(91,99,211,0.08)",
    alignItems: "center", justifyContent: "center",
    marginLeft: 8,
  },
});
