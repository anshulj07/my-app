// components/MyBookings/Tabs/CreatedTab.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ActivityIndicator, Pressable, RefreshControl,
  Animated, SectionList, SectionListData, Switch, StyleSheet, Alert,
  Modal, TouchableOpacity, ScrollView, Platform, Image,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { apiFetch } from "../../../lib/apiFetch";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

// ─────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  inputBorder: "#E8E0D5",
  ink:         "#1C1A17",
  ink2:        "#3D3A34",
  muted:       "#8A8278",
  hint:        "#BCB6AD",
  teal:        "#3ECFB2",
  tealBg:      "#E8FAF7",
  tealText:    "#1A7A6A",
  coral:       "#FF6F6F",
  coralBg:     "#FFF0F0",
  coralText:   "#C0392B",
  amber:       "#F59E0B",
  amberBg:     "#FFFBEB",
  amberText:   "#92400E",
  purple:      "#A78BFA",
  purpleBg:    "#F3F0FF",
  purpleText:  "#5B21B6",
  green:       "#34D399",
  greenBg:     "#ECFDF5",
  greenText:   "#065F46",
  blue:        "#60A5FA",
  blueBg:      "#EFF6FF",
  blueText:    "#1D4ED8",
  error:       "#EF4444",
};
const R = { card: 20, input: 14, pill: 999, badge: 10 };

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
export type EventKind = "free" | "paid" | "service";
export type EventDoc = {
  _id: string; title: string; emoji?: string; description?: string;
  creatorClerkId: string; kind: EventKind; priceCents: number | null;
  startsAt?: string | null; date?: string; time?: string; status?: string;
  attendance?: number | null; attendees?: any[];
  joinPolicy?: "open" | "approval"; // ✅ Added for approval flow tracking
  location?: { city?: string; admin1Code?: string; countryCode?: string };
};
type SectionT = { title: string; hint: string; data: EventDoc[] };

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function eventStartMs(ev: EventDoc): number {
  if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
  const date = (ev.date ?? "").trim(); const time = (ev.time ?? "").trim();
  if (date && time) { const t = new Date(`${date}T${time}:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  if (date) { const t = new Date(`${date}T12:00:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  return Number.POSITIVE_INFINITY;
}
function fmtWhen(ev: EventDoc) {
  const ms = eventStartMs(ev);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "No time set";
  return new Date(ms).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function fmtWhere(ev: EventDoc) {
  const city = ev.location?.city?.trim(); const s = ev.location?.admin1Code?.trim(); const cc = ev.location?.countryCode?.trim();
  if (!city && !cc) return "Location not set";
  return `${city ?? ""}${s ? `, ${s}` : ""}${cc ? ` · ${cc}` : ""}`.trim();
}
function priceLabel(ev: EventDoc) {
  if (ev.kind === "free") return "FREE";
  return `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}`;
}
function kindLabel(ev: EventDoc) {
  if (ev.kind === "service") return "Service";
  if (ev.kind === "paid") return "Paid event";
  return "Free event";
}
function isEnabled(ev: EventDoc) {
  return String(ev.status || "active").toLowerCase() !== "paused";
}

// ─────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────
function getEventState(ev: EventDoc): "upcoming" | "live" | "ended" {
  if (String(ev.status || "").toLowerCase() === "ended") return "ended";
  const ms = eventStartMs(ev);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "upcoming";
  if (ms <= Date.now()) return "live";
  return "upcoming";
}

// ─────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────
export default function CreatedTab({
  created, refreshing, onRefresh,
  toggleBusyById, onToggleServiceEnabled, onPressEvent,
  onEndEvent,
}: {
  created: EventDoc[]; refreshing: boolean; onRefresh: () => void;
  toggleBusyById: Record<string, boolean>;
  onToggleServiceEnabled: (ev: EventDoc, next: boolean) => void;
  onPressEvent: (ev: EventDoc) => void;
  onEndEvent?: (ev: EventDoc) => void;
}) {
  const sections = useMemo<SectionT[]>(() => {
    if (created.length === 0) return [];
    
    const liveItems = created.filter(e => getEventState(e) === "live");
    const upcomingItems = created.filter(e => getEventState(e) === "upcoming");
    
    const res: SectionT[] = [];
    if (liveItems.length > 0) {
      res.push({
        title: "Live Now 🟢",
        hint: "These events have started — check in attendees",
        data: liveItems
      });
    }
    if (upcomingItems.length > 0) {
      res.push({
        title: "Upcoming",
        hint: "Events you created that haven't started yet",
        data: upcomingItems
      });
    }
    return res;
  }, [created]);


  return (
    <SectionList
      sections={sections as SectionListData<EventDoc>[]}
      keyExtractor={(item) => item._id}
      contentContainerStyle={T.list}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.teal} />}
      ListEmptyComponent={
        <View style={T.empty}>
          <View style={T.emptyIcon}>
            <Text style={{ fontSize: 34 }}>🗓️</Text>
          </View>
          <Text style={T.emptyTitle}>No events here</Text>
          <Text style={T.emptySub}>Events will appear here when you create them.</Text>
        </View>
      }

      renderSectionHeader={({ section }: any) => (
        <View style={T.sectionHeaderWrap}>
          <Text style={T.sectionLabel}>{section.title}</Text>
          {!!section.hint && <Text style={T.sectionHint}>{section.hint}</Text>}
          <View style={T.sectionDivider} />
        </View>
      )}
      renderItem={({ item, index }) => (
        <EventCard
          e={item} index={index}
          showToggle={item.kind === "service"}
          toggleBusy={!!toggleBusyById[item._id]}
          onToggle={(next) => onToggleServiceEnabled(item, next)}
          onPress={() => onPressEvent(item)}
          onEndEvent={onEndEvent ? () => onEndEvent(item) : undefined}
        />

      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─────────────────────────────────────────────
//  CHECK-IN MODAL
// ─────────────────────────────────────────────
function CheckInModal({ visible, onClose, eventId, eventTitle, totalAttendees, onVerified }: {
  visible: boolean; onClose: () => void;
  eventId: string; eventTitle?: string; totalAttendees: number;
  onVerified?: () => void;
}) {
  const { userId } = useAuth();
  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [otp, setOtp]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);
  const shakeX = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleClose = () => { setOtp(""); setResult(null); onClose(); };

  const submit = async () => {
    if (otp.length !== 4 || !API_BASE || !userId) return;
    setLoading(true); setResult(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/events/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
        body: JSON.stringify({ eventId, creatorClerkId: userId, otp }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setResult({ ok: true, name: json.attendee?.name || "Guest", phone: json.attendee?.phone || "", count: json.checkedInCount, total: json.totalAttendees });
        setOtp("");
        onVerified?.(); // Refresh background data
      } else {
        setResult({ ok: false, error: json?.error || "Invalid OTP" });
        shake(); setOtp("");
      }
    } catch {
      setResult({ ok: false, error: "Network error" });
      shake();
    } finally { setLoading(false); }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={CI.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={CI.sheet}>
          <View style={CI.grabber} />

          {/* Header */}
          <View style={CI.header}>
            <View style={CI.headerIcon}>
              <Text style={{ fontSize: 22 }}>🔍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={CI.headerTitle}>Guest Check-in</Text>
              <Text style={CI.headerSub} numberOfLines={1}>{eventTitle || "Verification"}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={CI.closeBtn}>
              <Text style={{ fontSize: 18, color: C.muted, fontWeight: "700" }}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Result */}
          <View style={CI.resultContainer}>
            {result ? (
              <View style={[CI.resultBox, result.ok ? CI.resOk : CI.resErr]}>
                <Text style={{ fontSize: 18 }}>{result.ok ? "✅" : "❌"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={CI.resMessage}>{result.ok ? `Verified: ${result.name}` : result.error}</Text>
                  {result.ok && <Text style={CI.resStats}>{result.count} of {result.total} checked in</Text>}
                </View>
                <TouchableOpacity onPress={() => setResult(null)}>
                  <Text style={{ color: C.muted, fontSize: 16 }}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={CI.instruction}>Enter attendee's 4-digit code</Text>
            )}
          </View>

          {/* OTP display */}
          <Animated.View style={[CI.otpRow, { transform: [{ translateX: shakeX }] }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[CI.otpBox, otp.length === i && CI.otpBoxActive]}>
                <Text style={CI.otpText}>{otp[i] || ""}</Text>
                {!otp[i] && <View style={CI.otpDot} />}
              </View>
            ))}
          </Animated.View>

          {/* Numpad */}
          <View style={CI.numpad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
              <TouchableOpacity
                key={i}
                disabled={k === "" || loading}
                style={[CI.key, k === "" && { backgroundColor: "transparent", borderColor: "transparent" }]}
                onPress={() => {
                  if (k === "⌫") { setOtp(p => p.slice(0, -1)); setResult(null); return; }
                  if (typeof k === "number" && otp.length < 4) { setOtp(otp + k); setResult(null); }
                }}
              >
                <Text style={[CI.keyText, k === "" && { opacity: 0 }]}>{k === "⌫" ? "⌫" : k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            disabled={otp.length < 4 || loading}
            onPress={submit}
            activeOpacity={0.85}
            style={[CI.verifyBtn, (otp.length < 4 || loading) && { opacity: 0.4 }]}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={CI.verifyBtnText}>Verify Entry ✓</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
//  LIVE DASHBOARD MODAL
// ─────────────────────────────────────────────
function LiveDashboardModal({ visible, onClose, e, onEndEvent }: {
  visible: boolean; onClose: () => void;
  e: EventDoc; onEndEvent?: () => void;
}) {
  const { userId } = useAuth();
  const router = useRouter();
  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  const headers = { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) };

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [ending,      setEnding]      = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [admitBusy, setAdmitBusy] = useState<Record<string, boolean>>({});
  const [localEvent, setLocalEvent] = useState<EventDoc>(e);
  
  const slideY = useRef(new Animated.Value(500)).current;
  const insets = useSafeAreaInsets();

  const loadEventDetails = async () => {
    if (!API_BASE || !localEvent._id || !userId) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/events/${encodeURIComponent(localEvent._id)}`, {
        method: "GET", headers: { ...headers, "Cache-Control": "no-cache" }
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.event) {
        setLocalEvent(json.event);
        setPendingRequests(json.event.pendingRequests || []);
      }
    } catch (err) {
      console.log("Error loading event live details:", err);
    }
  };

  useEffect(() => {
    setLocalEvent(e);
  }, [e]);

  useEffect(() => {
    if (visible) {
      loadEventDetails();
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 25, stiffness: 180 }).start();
    } else {
      slideY.setValue(500);
      setShowNotifications(false);
    }
  }, [visible]);

  const handleAdmitReject = async (targetClerkId: string, action: "admit" | "reject") => {
    if (!API_BASE || !userId || !localEvent._id) return;
    const busyKey = `${targetClerkId}-${action}`;
    setAdmitBusy(prev => ({ ...prev, [busyKey]: true }));
    try {
      const res = await apiFetch(`${API_BASE}/api/events/admit-request`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId: localEvent._id,
          creatorClerkId: userId,
          requestClerkUserId: targetClerkId,
          action,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Action failed");
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadEventDetails();
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

  const attendees = Array.isArray(localEvent.attendees) ? localEvent.attendees : [];
  const checkedIn = attendees.filter((a: any) => a.checkedIn).length;
  const total     = attendees.length;
  const pct       = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  // 📈 ANALYTICS
  const totalEarnings = attendees.reduce((acc: number, curr: any) => {
    return acc + (localEvent.kind === "paid" ? (localEvent.priceCents || 0) : 0);
  }, 0);

  const handleEndEvent = () => {
    Alert.alert("End Event?", "This will mark the event as ended. Attendees can then rate the experience.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Event 🔴", style: "destructive",
        onPress: async () => {
          if (!API_BASE || !userId) return;
          setEnding(true);
          try {
            const res = await apiFetch(`${API_BASE}/api/events/end-event`, {
              method: "PATCH", headers,
              body: JSON.stringify({ eventId: localEvent._id, creatorClerkId: userId }),
            });
            const json = await res.json().catch(() => null);
            
            if (res.ok) {
              const earnings = (json?.finalEarnings || 0) / 100;
              const count = json?.paidAttendees || 0;
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                "Event Ended",
                `Successfully ended! \n\n💰 Total Earnings: ₹${earnings.toLocaleString()}\n🎟️ Paid Guests: ${count}\n\nYour profile stats have been updated.`,
                [{ text: "Great!", onPress: () => {
                  onClose();
                  onEndEvent?.();
                }}]
              );
            } else {
              throw new Error(json?.error || "Failed to end event");
            }
          } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error", err.message || "Failed to end event");
          } finally { setEnding(false); }
        },
      },
    ]);
  };


  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={LD.overlay}>
        <Animated.View style={[LD.sheet, { transform: [{ translateY: slideY }] }]}>
          {/* Header */}
          <View style={LD.header}>
            <TouchableOpacity onPress={onClose} style={LD.backBtn}>
              <Ionicons name="arrow-back" size={22} color={C.ink} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={LD.headerTitle} numberOfLines={1}>{localEvent.title}</Text>
              <View style={LD.liveIndicator}>
                <View style={LD.liveDot} />
                <Text style={LD.liveText}>LIVE DASHBOARD</Text>
              </View>
            </View>

            {/* Notification Bell Icon */}
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowNotifications(true);
              }}
              style={LD.headerNotifBtn}
            >
              <Ionicons name="notifications-outline" size={24} color={C.ink} />
              {pendingRequests.length > 0 && (
                <View style={LD.notifBadge}>
                  <Text style={LD.notifBadgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleEndEvent} disabled={ending} style={LD.headerEndBtn}>
              {ending ? <ActivityIndicator size="small" color={C.coral} /> : <Text style={LD.headerEndText}>End 🔴</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            
            {/* ─── LIVE ANALYTICS PRO ─── */}
            <View style={LD.summaryRow}>
              {/* Check-in Ring */}
              <View style={LD.summaryCard}>
                <View style={[LD.ringOuter, { width: 70, height: 70, borderRadius: 35 }]}>
                   <Text style={LD.ringPct}>{pct}%</Text>
                </View>
                <Text style={LD.summaryLabel}>CHECKED IN</Text>
              </View>

              {/* Guests Count */}
              <View style={LD.summaryCard}>
                <Text style={LD.summaryValue}>{checkedIn}<Text style={{ fontSize: 16, color: C.hint }}>/{total}</Text></Text>
                <Text style={LD.summaryLabel}>GUESTS ARRIVED</Text>
              </View>

              {/* Earnings (NEW) */}
              {localEvent.kind === "paid" && (
                <View style={[LD.summaryCard, { backgroundColor: C.greenBg, borderColor: C.green + "44" }]}>
                  <Text style={[LD.summaryValue, { color: C.greenText }]} numberOfLines={1} adjustsFontSizeToFit>₹{Math.floor(totalEarnings / 100)}</Text>
                  <Text style={[LD.summaryLabel, { color: C.greenText }]}>TOTAL EARNED</Text>
                </View>
              )}
            </View>

            {/* Action Area */}
            <View style={LD.actionSection}>
              <Text style={LD.sectionTitle}>Check-in Verification</Text>
              <TouchableOpacity
                onPress={() => setShowCheckIn(true)}
                activeOpacity={0.8}
                style={LD.mainVerifyBtn}
              >
                <View style={LD.verifyIconWrap}>
                  <Ionicons name="scan-outline" size={28} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={LD.verifyTitle}>Verify Guest Entry</Text>
                  <Text style={LD.verifySub}>Scan or enter 4-digit code</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.teal} />
              </TouchableOpacity>
            </View>

            {/* Attendees List */}
            <View style={LD.listSection}>
              <View style={LD.listHeader}>
                <Text style={LD.sectionTitle}>Confirmed Attendees</Text>
                <View style={LD.countPill}><Text style={LD.countPillText}>{total}</Text></View>
              </View>

              {total === 0 ? (
                <View style={LD.emptyState}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>⏳</Text>
                  <Text style={LD.emptyTitle}>Waiting for guests...</Text>
                  <Text style={LD.emptySub}>Anyone you admit will appear here instantly.</Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {attendees.map((att: any, i: number) => (
                    <TouchableOpacity 
                      key={att.clerkId || i} 
                      onPress={() => {
                        if (att.clerkId) {
                          router.push({
                            pathname: "/profile/[clerkUserId]",
                            params: { clerkUserId: att.clerkId, name: att.name || "Attendee" }
                          } as any);
                        }
                      }}
                      style={[LD.attendeeCard, att.checkedIn && { borderColor: C.green + "44", backgroundColor: C.greenBg + "22" }]}
                    >
                      {/* Real User Image or Fallback */}
                      <View style={[LD.attIcon, att.imageUrl ? { backgroundColor: "transparent" } : (att.checkedIn ? LD.attIconOk : {})]}>
                        {att.imageUrl ? (
                          <Image source={{ uri: att.imageUrl }} style={{ width: "100%", height: "100%", borderRadius: 12 }} />
                        ) : (
                          <Text style={{ fontSize: 16, fontWeight: "900", color: att.checkedIn ? C.green : C.amber }}>
                            {(att.name || "?").charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={LD.attName}>{att.name || "Guest"}</Text>
                          {/* Payment Status Badge */}
                          <View style={{ backgroundColor: att.isPaid ? C.greenBg : C.blueBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: (att.isPaid ? C.green : C.blue) + "33" }}>
                            <Text style={{ color: att.isPaid ? C.greenText : C.blueText, fontSize: 8, fontWeight: "900" }}>
                              {att.isPaid ? "💰 PAID" : "🆓 FREE"}
                            </Text>
                          </View>
                        </View>
                        <Text style={LD.attMeta}>
                          {att.checkedIn ? `Arrived at ${new Date(att.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Pending Arrival"}
                        </Text>
                      </View>

                      {att.checkedIn ? (
                        <View style={LD.okBadge}>
                          <Text style={LD.okBadgeText}>VERIFIED</Text>
                        </View>
                      ) : (
                        <View style={[LD.okBadge, { backgroundColor: C.amberBg, borderColor: C.amber + "33" }]}>
                          <Text style={[LD.okBadgeText, { color: C.amberText }]}>EXPECTED</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      <CheckInModal
        visible={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        eventId={localEvent._id}
        eventTitle={localEvent.title}
        totalAttendees={total}
        onVerified={loadEventDetails}
      />

      <NotificationModal 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        pending={pendingRequests}
        attendees={attendees}
        eventTitle={localEvent.title}
        eventEmoji={localEvent.emoji || "📍"}
        onAdmit={(id) => handleAdmitReject(id, "admit")}
        onReject={(id) => handleAdmitReject(id, "reject")}
        admitBusy={admitBusy}
      />
    </Modal>
  );
}

// ─────────────────────────────────────────────
//  EVENT CARD
// ─────────────────────────────────────────────

function EventCard({
  e, index, showToggle, toggleBusy, onToggle, onPress, onEndEvent,
}: {
  e: EventDoc; index: number;
  showToggle: boolean; toggleBusy: boolean;
  onToggle: (next: boolean) => void;
  onPress: () => void; onEndEvent?: () => void;
}) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(12)).current;
  const livePulse = useRef(new Animated.Value(1)).current;
  const [showCheckIn,    setShowCheckIn]    = useState(false);
  const [showLiveDash,   setShowLiveDash]   = useState(false);

  const state = getEventState(e);
  const isOngoing = state === "live";


  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 240, delay: Math.min(index * 40, 180), useNativeDriver: true }),
    ]).start();
  }, []);

  // Pulsing animation for LIVE badge
  useEffect(() => {
    if (!isOngoing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1.0,  duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isOngoing]);

  const enabled        = isEnabled(e);
  const attendeeCount  = Array.isArray(e.attendees) ? e.attendees.length : 0;
  const checkedInCount = Array.isArray(e.attendees) ? e.attendees.filter((a: any) => a.checkedIn).length : 0;

  const kindCfg = e.kind === "service"
    ? { accent: C.purple, accentBg: C.purpleBg, accentText: C.purpleText, emoji: "🛠️", label: "Service" }
    : e.kind === "paid"
    ? { accent: C.amber,  accentBg: C.amberBg,  accentText: C.amberText,  emoji: "🎟", label: "Paid event" }
    : { accent: C.teal,   accentBg: C.tealBg,   accentText: C.tealText,   emoji: "🆓", label: "Free event" };

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
      <Pressable
        onPress={() => {
          if (isOngoing) {
            setShowLiveDash(true);
          } else {
            onPress();
          }
        }}
        style={({ pressed }) => [

          T.card,
          isOngoing && { borderColor: C.coral + "88", borderWidth: 2 },
          pressed && { transform: [{ scale: 0.985 }] },
        ]}
      >
        {/* LIVE badge — animated pulse */}
        {isOngoing && (
          <View style={T.liveBadge}>
            <Animated.View style={[T.liveDot, { transform: [{ scale: livePulse }] }]} />
            <Text style={T.liveText}>LIVE NOW</Text>
          </View>
        )}

        {/* Top row */}
        <View style={T.cardTop}>
          <View style={[T.emojiBox, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "33" }]}>
            <Text style={{ fontSize: 24 }}>{e.emoji || kindCfg.emoji}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={T.cardTitle} numberOfLines={1}>{e.title}</Text>
            <View style={T.badgeRow}>
              <View style={[T.badge, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
                <Text style={[T.badgeText, { color: kindCfg.accentText }]}>{kindCfg.label}</Text>
              </View>
              <View style={[T.badge, enabled
                ? { backgroundColor: C.greenBg, borderColor: C.green + "55" }
                : { backgroundColor: C.coralBg, borderColor: C.coral + "55" }]}>
                <Text style={[T.badgeText, { color: enabled ? C.greenText : C.coralText }]}>
                  {enabled ? "✓ Active" : "⏸ Paused"}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", gap: 8 }}>
            <View style={[T.pricePill, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
              <Text style={[T.priceText, { color: kindCfg.accentText }]}>{priceLabel(e)}</Text>
            </View>
            {showToggle && (
              <View>
                {toggleBusy
                  ? <ActivityIndicator size="small" color={C.purple} />
                  : <Switch
                      value={enabled} onValueChange={onToggle}
                      trackColor={{ false: C.inputBorder, true: C.purple }}
                      thumbColor={C.card} ios_backgroundColor={C.inputBorder}
                    />
                }
              </View>
            )}
          </View>
        </View>

        <View style={T.divider} />

        {/* Meta */}
        <View style={T.metaGrid}>
          <View style={T.metaCell}>
            <Text style={T.metaLabel}>📅 When</Text>
            <Text style={T.metaValue} numberOfLines={1}>{fmtWhen(e)}</Text>
          </View>
          <View style={T.metaCell}>
            <Text style={T.metaLabel}>📍 Where</Text>
            <Text style={T.metaValue} numberOfLines={1}>{fmtWhere(e)}</Text>
          </View>
        </View>

        {/* Attendees row */}
        <View style={T.actionRow}>
          <View style={[T.actionIcon, { backgroundColor: C.tealBg, borderColor: C.teal + "55" }]}>
            <Text style={{ fontSize: 15 }}>👥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.actionMain}>
              {e.kind === "service" ? "View bookings" : "View attendees"}
              {attendeeCount > 0 ? ` · ${attendeeCount} joined` : ""}
              {checkedInCount > 0 ? ` · ${checkedInCount} ✓` : ""}
            </Text>
            <Text style={T.actionSub}>Tap card to see full list</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.teal} />
        </View>

        {/* LIVE: Open Live Dashboard */}
        {isOngoing && (
          <Pressable
            onPress={(ev) => { ev.stopPropagation?.(); setShowLiveDash(true); }}
            style={({ pressed }) => [T.ctaBtn, T.liveDashBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={{ fontSize: 14 }}>🎛️</Text>
            <Text style={[T.ctaBtnText, { color: C.coralText }]}>Open Live Dashboard</Text>
            {checkedInCount > 0 && (
              <View style={[T.countPill, { backgroundColor: C.coralBg, borderColor: C.coral + "55" }]}>
                <Text style={{ color: C.coralText, fontSize: 11, fontWeight: "900" }}>{checkedInCount}/{attendeeCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={13} color={C.hint} style={{ marginLeft: "auto" }} />
          </Pressable>
        )}

        {/* Not live: Check-in Mode */}
        {!isOngoing && e.kind !== "service" && (
          <Pressable
            onPress={() => setShowCheckIn(true)}
            style={({ pressed }) => [T.ctaBtn, T.checkInBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={{ fontSize: 14 }}>📲</Text>
            <Text style={[T.ctaBtnText, { color: C.blueText }]}>Check-in Mode</Text>
            {checkedInCount > 0 && (
              <View style={[T.countPill, { backgroundColor: C.blueBg, borderColor: C.blue + "55" }]}>
                <Text style={{ color: C.blueText, fontSize: 11, fontWeight: "900" }}>{checkedInCount}/{attendeeCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={13} color={C.hint} style={{ marginLeft: "auto" }} />
          </Pressable>
        )}
      </Pressable>

      {/* Check-in modal (for non-live) */}
      <CheckInModal
        visible={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        eventId={e._id}
        eventTitle={e.title}
        totalAttendees={attendeeCount}
      />

      {/* Live Dashboard Modal */}
      <LiveDashboardModal
        visible={showLiveDash}
        onClose={() => setShowLiveDash(false)}
        e={e}
        onEndEvent={onEndEvent}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const T = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  empty:     { alignItems: "center", paddingTop: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { color: C.ink, fontSize: 17, fontWeight: "900", marginBottom: 6 },
  emptySub:   { color: C.muted, fontSize: 13, fontWeight: "600", textAlign: "center", paddingHorizontal: 24 },
  sectionHeaderWrap: { paddingTop: 16, paddingBottom: 8 },
  sectionLabel:      { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 1.2 },
  sectionHint:       { fontSize: 12, color: C.hint, fontWeight: "600", marginTop: 2 },
  sectionDivider:    { height: 1.5, backgroundColor: C.cardBorder, marginTop: 10 },
  card: {
    backgroundColor: C.card,
    borderRadius: R.card, borderWidth: 1.5, borderColor: C.cardBorder,
    padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTop:  { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  emojiBox: {
    width: 50, height: 50, borderRadius: 14, flexShrink: 0,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "900", color: C.ink, letterSpacing: -0.2, marginBottom: 6 },
  badgeRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge:     {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, borderWidth: 1.5,
  },
  badgeText: { fontSize: 11, fontWeight: "800" },
  pricePill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: R.pill, borderWidth: 1.5,
  },
  priceText: { fontSize: 12, fontWeight: "900" },
  divider: { height: 1.5, backgroundColor: C.cardBorder, marginBottom: 12 },
  metaGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  metaCell: {
    flex: 1, backgroundColor: C.inputBg, borderRadius: R.input,
    borderWidth: 1.5, borderColor: C.inputBorder, padding: 10,
  },
  metaLabel: { fontSize: 10, fontWeight: "800", color: C.hint, marginBottom: 3 },
  metaValue: { fontSize: 12, fontWeight: "700", color: C.ink2 },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.inputBg, borderRadius: R.input,
    borderWidth: 1.5, borderColor: C.inputBorder,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  actionIcon: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  actionMain: { fontSize: 13, fontWeight: "800", color: C.ink2, marginBottom: 1 },
  actionSub:  { fontSize: 11, fontWeight: "600", color: C.muted },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 6, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: R.input, borderWidth: 1.5,
  },
  ctaBtnText: { fontWeight: "800", fontSize: 13 },
  checkInBtn:  { backgroundColor: C.blueBg, borderColor: C.blue + "55" },
  endBtn:      { backgroundColor: C.coralBg, borderColor: C.coral + "55" },
  liveDashBtn: { backgroundColor: C.coralBg, borderColor: C.coral + "55" },
  countPill:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill, borderWidth: 1.5 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", marginBottom: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill,
    backgroundColor: C.coralBg, borderWidth: 1.5, borderColor: C.coral + "55",
  },
  liveDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: C.coral },
  liveText: { color: C.coralText, fontSize: 11, fontWeight: "900" },
});

const CI = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(28,26,23,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40,
    borderTopWidth: 1.5, borderColor: C.cardBorder,
  },
  grabber: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.inputBorder, alignSelf: "center",
    marginTop: 12, marginBottom: 20,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: C.ink },
  headerSub:   { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  resultContainer: { minHeight: 56, justifyContent: "center", marginBottom: 20 },
  instruction:     { textAlign: "center", color: C.muted, fontSize: 14, fontWeight: "600" },
  resultBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: R.input, borderWidth: 1.5,
  },
  resOk:     { backgroundColor: C.greenBg, borderColor: C.green + "55" },
  resErr:    { backgroundColor: C.coralBg, borderColor: C.coral + "55" },
  resMessage:{ color: C.ink, fontSize: 13, fontWeight: "800" },
  resStats:  { color: C.muted, fontSize: 11, fontWeight: "600", marginTop: 2 },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 28 },
  otpBox: {
    width: 62, height: 76, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  otpBoxActive: { borderColor: C.teal, backgroundColor: C.tealBg },
  otpText: { color: C.ink, fontSize: 32, fontWeight: "900" },
  otpDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.hint },
  numpad: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "space-between", gap: 10, marginBottom: 24,
  },
  key: {
    width: "31%", height: 58, borderRadius: 14,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  keyText: { color: C.ink, fontSize: 22, fontWeight: "700" },
  verifyBtn: {
    height: 54, borderRadius: R.pill, backgroundColor: C.teal,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.teal, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  verifyBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
});

const LD = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.bg },
  sheet:   { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === "android" ? 40 : 60 },
  
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1.5, borderBottomColor: C.cardBorder,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  liveDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.coral },
  liveText:  { color: C.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  headerEndBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    backgroundColor: C.coralBg, borderWidth: 1, borderColor: C.coral + "44",
  },
  headerEndText: { color: C.coralText, fontWeight: "800", fontSize: 13 },

  summaryRow: { flexDirection: "row", gap: 14, padding: 20 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 24, padding: 20,
    borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  summaryLabel: { fontSize: 10, fontWeight: "800", color: C.hint, marginTop: 12, letterSpacing: 1 },
  summaryValue: { 
    fontSize: 24, // Slightly smaller base
    fontWeight: "900", 
    color: C.ink, 
    textAlign: "center" 
  },
  ringOuter: {
    borderWidth: 6, borderColor: C.tealBg,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.card,
  },
  ringPct: { fontSize: 18, fontWeight: "900", color: C.teal },

  actionSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle:  { fontSize: 12, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 },
  mainVerifyBtn: {
    flexDirection: "row", alignItems: "center", gap: 16,
    backgroundColor: C.card, padding: 16, borderRadius: 24,
    borderWidth: 1.5, borderColor: C.teal + "44",
    shadowColor: C.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  verifyIconWrap: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: C.teal, alignItems: "center", justifyContent: "center",
  },
  verifyTitle: { fontSize: 17, fontWeight: "900", color: C.ink },
  verifySub:   { fontSize: 13, color: C.muted, fontWeight: "600", marginTop: 2 },

  listSection: { paddingHorizontal: 20 },
  listHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  countPill:   { backgroundColor: C.inputBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder },
  countPillText: { fontSize: 12, fontWeight: "800", color: C.ink },

  attendeeCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, padding: 14, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.cardBorder,
  },
  attIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.amberBg, alignItems: "center", justifyContent: "center",
  },
  attIconOk: { backgroundColor: C.greenBg },
  attName:   { fontSize: 15, fontWeight: "800", color: C.ink },
  attMeta:   { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
  okBadge:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: C.greenBg },
  okBadgeText: { color: C.greenText, fontSize: 10, fontWeight: "900" },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: C.ink },
  emptySub:   { fontSize: 13, color: C.muted, textAlign: "center", marginTop: 6, paddingHorizontal: 40 },

  headerNotifBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.tealBg, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.coral, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4, borderWidth: 2, borderColor: C.bg,
  },
  notifBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "900" },
});

// ─────────────────────────────────────────────
//  Shared Notification Hub Components (Internal)
// ─────────────────────────────────────────────

function NotificationModal({ 
  visible, onClose, pending, attendees, eventTitle, eventEmoji, onAdmit, onReject, admitBusy
}: {
  visible: boolean; onClose: () => void;
  pending: any[]; attendees: any[]; eventTitle: string; eventEmoji: string;
  onAdmit: (id: string) => void; onReject: (id: string) => void;
  admitBusy: Record<string, boolean>;
}) {
  const insets = useSafeAreaInsets();
  const activity = [...attendees].sort((a,b) => String(b.joinedAt || "").localeCompare(String(a.joinedAt || ""))).slice(0, 10);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#FDFCF8" }}>
        <View style={{ backgroundColor: "#FDFCF8", paddingTop: insets.top + 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20 }}>
            <TouchableOpacity onPress={onClose} style={{
              width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Ionicons name="close" size={20} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#E8FAF7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications" size={30} color="#FBBF24" />
            </View>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827' }}>Notifications</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500' }}>Live requests & activity</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          {pending.length > 0 && (
            <View style={{ marginBottom: 32 }}>
              <View style={NH.sectionTitleRow}>
                <View style={NH.redDot} />
                <Text style={NH.sectionTitle}>JOIN REQUESTS</Text>
                <View style={NH.sectionBadge}><Text style={NH.sectionBadgeText}>{pending.length}</Text></View>
              </View>
              {pending.map(p => (
                <PendingRequestCard key={p.clerkUserId} item={p} onAdmit={() => onAdmit(p.clerkUserId)} onReject={() => onReject(p.clerkUserId)} admitBusy={admitBusy} />
              ))}
            </View>
          )}

          <View>
            <View style={NH.sectionTitleRow}>
              <View style={[NH.redDot, { backgroundColor: "#10B981" }]} />
              <Text style={NH.sectionTitle}>RECENT ACTIVITY</Text>
            </View>
            {activity.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: '#9CA3AF', fontSize: 13 }}>No recent activity yet.</Text></View>
            ) : (
              activity.map((a, i) => (
                <View key={a.clerkId || i} style={NH.activityRow}>
                  <View style={NH.activityAvatar}>
                    {a.imageUrl ? <Image source={{ uri: a.imageUrl }} style={NH.activityImg} /> : <Text style={NH.activityInitial}>{(a.name || "U").charAt(0)}</Text>}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={NH.activityText}><Text style={{ fontWeight: '700' }}>{a.name || "Guest"}</Text> joined your event</Text>
                    <Text style={NH.activityTime}>Just now</Text>
                  </View>
                  <View style={NH.joinedBadge}><Text style={NH.joinedBadgeText}>Joined ✓</Text></View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PendingRequestCard({ item, onAdmit, onReject, admitBusy }: {
  item: any; onAdmit: () => void; onReject: () => void; admitBusy: Record<string, boolean>;
}) {
  const admitKey = `${item.clerkUserId}-admit`;
  const rejectKey = `${item.clerkUserId}-reject`;
  const busy = !!(admitBusy[admitKey] || admitBusy[rejectKey]);

  return (
    <View style={NH.card}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={NH.avatarLarge}>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={NH.imgLarge} /> : (
            <View style={[NH.imgLarge, { backgroundColor: '#B8BCE8', justifyContent: 'center' }]}><Text style={{ textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '700' }}>{(item.name || "P").charAt(0)}</Text></View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={NH.cardTitle}><Text style={{ fontWeight: '700' }}>{item.name || "User"}</Text> wants to join event</Text>
          <Text style={NH.cardTime}>A moment ago</Text>
        </View>
      </View>
      {!!item.message && <View style={NH.msgBox}><Text style={NH.msgText}>"{item.message}"</Text></View>}
      <View style={NH.btnRow}>
        <TouchableOpacity onPress={onAdmit} disabled={busy} style={[NH.admitBtn, busy && { opacity: 0.6 }]}>
          {admitBusy[admitKey] ? <ActivityIndicator color="#fff" size="small" /> : <Text style={NH.admitText}>Admit</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={onReject} disabled={busy} style={[NH.declineBtn, busy && { opacity: 0.6 }]}>
          {admitBusy[rejectKey] ? <ActivityIndicator color="#6B7280" size="small" /> : <Text style={NH.declineText}>Decline</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const NH = StyleSheet.create({
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 12 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#F87171" },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: "#6B7280", letterSpacing: 0.8 },
  sectionBadge: { paddingHorizontal: 8, height: 18, borderRadius: 9, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  sectionBadgeText: { color: "#F87171", fontSize: 10, fontWeight: "900" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.02, elevation: 2 },
  avatarLarge: { width: 44, height: 44, borderRadius: 16, overflow: 'hidden' },
  imgLarge: { width: "100%", height: "100%" },
  cardTitle: { fontSize: 14, color: "#111827", lineHeight: 20 },
  cardTime: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  msgBox: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6" },
  msgText: { fontSize: 13, color: "#4B5563", fontStyle: "italic" },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  admitBtn: { flex: 1, height: 42, borderRadius: 10, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  admitText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  declineBtn: { flex: 1, height: 42, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  declineText: { color: "#6B7280", fontWeight: "600", fontSize: 13 },
  activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#F3F4F6" },
  activityAvatar: { width: 36, height: 36, borderRadius: 14, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  activityImg: { width: '100%', height: '100%' },
  activityInitial: { color: '#5B63D3', fontWeight: '700', fontSize: 15 },
  activityText: { fontSize: 13, color: '#111827' },
  activityTime: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  joinedBadge: { paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  joinedBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '800' },
});