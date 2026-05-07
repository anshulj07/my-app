// components/ClickPin/JoinEventButton.tsx
// ✅ Updated: New booking UI — Spots selector → Payment → Confirmation

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Pressable, StyleSheet, Text, View, ActivityIndicator,
  Modal, TextInput, ScrollView, Keyboard, Image, TouchableOpacity,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiFetch } from "../../lib/apiFetch";
import RazorpaySheet, {
  type RazorpayOrderData,
  type RazorpaySuccessPayload,
} from "../Payment/RazorpaySheet";
// import PaymentSuccessModal from "../Payment/PaymentSuccessModal";
import PaymentFailureModal from "../Payment/PaymentFailureModal";

/* ─── tokens ─── */
const C = {
  bg:          "#FFFFFF",
  surface:     "#F7F7F7",
  border:      "rgba(0,0,0,0.08)",
  ink:         "#0F0F0F",
  ink2:        "#2C2C2C",
  muted:       "#717171",
  hint:        "#C0C0C0",
  green:       "#1DB954",
  greenSoft:   "rgba(29,185,84,0.10)",
  greenBorder: "rgba(29,185,84,0.28)",
  greenDark:   "#0F9640",
  amber:       "#F59E0B",
  amberSoft:   "rgba(245,158,11,0.10)",
  red:         "#EF4444",
};

type EventKind = "free" | "paid" | "event_free" | "event_paid" | "service";
type Screen = "booking" | "payment" | "confirmed";

type Props = {
  eventId:     string;
  kind:        EventKind;
  priceCents?: number | null;
  eventTitle?: string;
  label?:      string;
  eventLocation?: string; 
  onJoined?:   (payload: any) => void;
  disabled?:   boolean;
  joinPolicy?: "open" | "approval";
  creatorClerkId?: string;
  startDate?: string;
  endDate?: string;
  durationHrs?: number;
  customTrigger?: (onPress: () => React.ReactNode) => React.ReactNode;
};

export default function JoinEventButton({
  eventId,
  kind,
  priceCents = null,
  eventTitle = "Event",
  label = "Join event",
  eventLocation = "-", 
  onJoined,
  disabled,
  joinPolicy = "open",
  creatorClerkId,
  startDate,
  endDate,
  durationHrs = 1,
  customTrigger,
}: Props) {
  const router    = useRouter();
  const { userId } = useAuth();
  const { user }  = useUser();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (EVENT_API_KEY) h["x-api-key"] = EVENT_API_KEY;
    return h;
  }, [EVENT_API_KEY]);

  const isPaid = kind === "paid" || kind === "event_paid" || kind === "service";
  const pricePerSpot = priceCents ? priceCents / 100 : 0;
  const platformFeeFixed = 10; // ₹10 flat platform fee

  /* ── state ── */
  const [loading, setLoading]               = useState(false);
  const [joined,  setJoined]                = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [screen, setScreen]                 = useState<Screen>("booking");

  // Spots / Duration
  const [spots, setSpots] = useState(1);
  const [duration, setDuration] = useState(durationHrs);

  useEffect(() => {
    if (durationHrs !== duration) setDuration(durationHrs);
  }, [durationHrs]);

  // Confirmation data
  const [confirmOtp,       setConfirmOtp]       = useState<string | null>(null);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);

  // Form fields
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [message, setMessage] = useState("");

  // Razorpay (kept for actual payment processing)
  const [razorpayVisible,   setRazorpayVisible]   = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<RazorpayOrderData | null>(null);
  const [failureModalVisible, setFailureModalVisible] = useState(false);
  const [failureErrorMsg,     setFailureErrorMsg]     = useState<string | null>(null);
  const [failureDetails,      setFailureDetails]      = useState<string | null>(null);

  // Booking result tracking
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  // Slots
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots,   setBookedSlots]   = useState<any[]>([]);

  // Totals
  const subtotal   = pricePerSpot * (kind === "service" ? duration : spots);
  const totalPaise = (subtotal + platformFeeFixed) * 100;

  // Helpers
  const t12 = (t24: string) => {
    if (!t24) return "";
    try {
      const [h, m] = t24.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return t24;
      const suffix = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
    } catch { return t24; }
  };

  /* ── auto-fill name ── */
  useEffect(() => {
    if (showModal && user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (fullName) setName(fullName);
    }
  }, [showModal, user]);

  /* ── check already joined ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!API_BASE || !userId || !eventId) return;
        const url = `${API_BASE}/api/events/is-joined?eventId=${encodeURIComponent(eventId)}&clerkUserId=${encodeURIComponent(userId)}`;
        const res = await apiFetch(url, {
          headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
        });
        const json = await res.json().catch(() => null);
        if (!cancelled && res.ok) {
          setJoined(!!json?.joined);
          setPendingRequest(!!json?.pending);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [API_BASE, EVENT_API_KEY, userId, eventId]);

  /* ── open sheet ── */
  const onPress = async () => {
    if (disabled || loading || joined || pendingRequest) return;
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to continue.");
      router.push("/sign-in" as any);
      return;
    }
    setScreen("booking");
    setSpots(1);
    setDuration(durationHrs);
    setSelectedSlot(null);
    setShowModal(true);

    // Fetch booked slots if service
    if (kind === "service" && API_BASE && eventId) {
      try {
        const r = await apiFetch(`${API_BASE}/api/bookings/service-bookings?eventId=${eventId}&creatorClerkId=${creatorClerkId}`, {
          headers: headers,
        });
        const j = await r.json().catch(() => null);
        if (r.ok) setBookedSlots(Array.isArray(j?.bookings) ? j.bookings : []);
      } catch {}
    }
  };

  /* ── Confirm Booking → go to payment or free join ── */
  const handleConfirmBooking = async () => {
    if (isPaid) {
      setScreen("payment");
    } else {
      await doFreeJoin();
    }
  };

  /* ── Free join ── */
  const doFreeJoin = async () => {
    if (!name.trim()) { Alert.alert("Name required", "Please enter your name to join."); return; }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const email    = user?.primaryEmailAddress?.emailAddress || "";
      const imageUrl = user?.imageUrl || "";

      if (joinPolicy === "approval") {
        const res = await apiFetch(`${API_BASE}/api/events/join-request`, {
          method: "POST", headers,
          body: JSON.stringify({ eventId, clerkUserId: userId, name: name.trim(), email, phone: phone.trim(), message: message.trim(), imageUrl }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) { Alert.alert("Couldn't send request", json?.error || "Please try again"); return; }
        setPendingRequest(true);
        setShowModal(false);
        Alert.alert("Request Sent! 📬", "The host will review your request.", [{ text: "Got it!" }]);
        return;
      }

      const res = await apiFetch(`${API_BASE}/api/events/join`, {
        method: "POST", headers,
        body: JSON.stringify({ eventId, clerkUserId: userId, name: name.trim(), email, phone: phone.trim(), message: message.trim(), imageUrl }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        Alert.alert("Couldn't join", json?.message || json?.error || "Please try again");
        return;
      }
      setJoined(true);
      setConfirmOtp(json?.checkInOtp || null);
      setScreen("confirmed");
      onJoined?.(json);
    } catch {
      Alert.alert("Network error", "Please check your connection and try again.");
    } finally { setLoading(false); }
  };

  /* ── Paid: Pay button ── */
  const handlePay = async () => {
    if (!API_BASE || !userId || !creatorClerkId) return;
    if (!priceCents || priceCents <= 0) {
      Alert.alert("Price Error", "Event price not set.");
      return;
    }
    setLoading(true);
    try {
      // Step 1: Create booking record + Razorpay order
      const res = await apiFetch(`${API_BASE}/api/bookings/create`, {
        method: "POST", headers,
        body: JSON.stringify({ 
          bookerId:    userId,
          hostId:      creatorClerkId,
          eventId:     eventId,
          type:        kind.includes("service") ? "service" : "event",
          startDate:   startDate || new Date().toISOString().split("T")[0],
          endDate:     endDate   || startDate || new Date().toISOString().split("T")[0],
          pricePerDay: totalPaise, // backend expects the final amount for the order
          bookerName:  name.trim(),
          bookerEmail: user?.primaryEmailAddress?.emailAddress || "",
          bookerPhone: phone.trim(),
          bookerImageUrl: user?.imageUrl || "",
          notes:       message.trim(),
          startTime:   selectedSlot || null,
          duration:    kind === "service" ? duration : null,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.payment?.orderId) {
        Alert.alert("Booking Error", json?.error || "Could not initiate booking.");
        return;
      }

      setActiveBookingId(json.bookingId);
      setRazorpayOrderData({
        orderId:     json.payment.orderId,
        amount:      json.payment.amount,
        currency:    json.payment.currency,
        keyId:       json.payment.keyId,
        eventTitle,
        description: `Join ${eventTitle}`,
      });
      setRazorpayVisible(true);
    } catch {
      Alert.alert("Network Error", "Please check your connection.");
    } finally { setLoading(false); }
  };

  /* ── Razorpay success ── */
  const handlePaymentSuccess = async (payload: RazorpaySuccessPayload) => {
    setRazorpayVisible(false);
    setLoading(true);
    try {
      // Step 2: Verify payment on backend
      const verifyRes = await apiFetch(`${API_BASE}/api/bookings/verify-payment`, {
        method: "POST", headers,
        body: JSON.stringify({ 
          ...payload, 
          bookingId: activeBookingId 
        }),
      });
      const verifyJson = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok || !verifyJson?.ok) {
        Alert.alert("Verification Failed", verifyJson?.error || "Payment could not be verified.");
        return;
      }

      setJoined(true);
      setConfirmOtp(verifyJson?.checkInOtp || null);
      setConfirmPaymentId(payload.razorpay_payment_id);
      setScreen("confirmed");
      onJoined?.(verifyJson);

      // ✅ Auto-close modal after 3 seconds so user returns to the event/map
      setTimeout(() => {
        setShowModal(false);
      }, 3000);
    } catch {
      Alert.alert("Error", "Something went wrong during verification. Contact support.");
    } finally { setLoading(false); }
  };

  /* ── Leave / Cancel Request ── */
  const handleLeave = async () => {
    if (!API_BASE || !userId || !eventId) return;
    const actionTxt = pendingRequest ? "cancel your request" : "leave this event";
    
    Alert.alert(
      "Are you sure?",
      `Do you really want to ${actionTxt}?`,
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const res = await apiFetch(`${API_BASE}/api/events/leave`, {
                method: "POST", headers,
                body: JSON.stringify({ eventId, clerkUserId: userId }),
              });
              const json = await res.json().catch(() => null);
              if (!res.ok) {
                Alert.alert("Error", json?.error || "Failed to process request");
                return;
              }
              setJoined(false);
              setPendingRequest(false);
              Alert.alert("Success", pendingRequest ? "Request cancelled." : "You have left the event.");
            } catch {
              Alert.alert("Network Error", "Please check your connection.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  /* ── button state ── */
  const buttonLabel =
    pendingRequest     ? "Waiting for Approval" :
    joined             ? "You're In ✓" :
    kind === "service" ? "Book Now" :
    isPaid && priceCents ? `Pay ₹${pricePerSpot.toFixed(0)} & Join` :
    joinPolicy === "approval" ? "Request to Join" :
    label;

  const isDisabledBtn = disabled || loading || joined || pendingRequest;

  /* ═══════════════════════════════════
     RENDER
  ═══════════════════════════════════ */
  return (
    <>
      {/* ── MAIN CTA BUTTON ── */}
      {customTrigger ? (
        customTrigger(onPress)
      ) : (
        <Pressable
          onPress={onPress}
          disabled={isDisabledBtn}
          style={({ pressed }) => [
            B.cta,
            joined        && B.ctaJoined,
            pendingRequest && B.ctaPending,
            isDisabledBtn  && B.ctaDisabled,
            pressed && !isDisabledBtn && B.ctaPressed,
          ]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons
                  name={
                    pendingRequest ? "time-outline" :
                    joined         ? "checkmark-circle" :
                    isPaid         ? "card-outline" :
                    "people-outline"
                  }
                  size={18} color="#fff"
                />
                <Text style={B.ctaText}>{buttonLabel}</Text>
              </>
          }
        </Pressable>
      )}

      {(joined || pendingRequest) && (
        <TouchableOpacity 
          onPress={handleLeave}
          disabled={loading}
          style={[B.cancelCta, loading && { opacity: 0.5 }]}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#EF4444" size="small" />
          ) : (
            <Text style={B.cancelCtaText}>
              {pendingRequest ? "Cancel My Join Request" : "Leave this Event"}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* ═══════════════════════════════════
          BOOKING MODAL
      ═══════════════════════════════════ */}
      <Modal
        visible={showModal} transparent animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={M.backdrop}>
          <View style={M.sheet}>

            {/* ── Header ── */}
            <View style={M.header}>
              <Pressable hitSlop={12} onPress={() => {
                if (screen === "payment") { setScreen("booking"); }
                else { setShowModal(false); }
              }} style={M.headerBack}>
                <Ionicons name="chevron-back" size={18} color={C.ink} />
              </Pressable>
              <Text style={M.headerTitle}>
                {screen === "booking"   ? "Book Event" :
                 screen === "payment"   ? "Payment" :
                 "Booking Confirmed"}
              </Text>
              <Pressable hitSlop={12} onPress={() => setShowModal(false)} style={M.headerClose}>
                <Ionicons name="close" size={18} color={C.muted} />
              </Pressable>
            </View>

            {/* ═══ SCREEN: BOOKING ═══ */}
            {screen === "booking" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={M.body}
              >
                {/* ── SERVICE SLOT SELECTION ── */}
                {kind === "service" && (
                  <View style={M.section}>
                    <Text style={M.sectionTitle}>Select Start Time</Text>
                    <View style={M.slotsGrid}>
                      {(() => {
                        // For now we just generate some sample hours. 
                        // In a real app we'd use the host's actual schedule.
                        const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
                        return slots.map(s => {
                          const hour = parseInt(s.split(":")[0]);
                          const isBooked = bookedSlots.some(b => {
                            const bStart = parseInt((b.startTime || "00:00").split(":")[0]);
                            const bDur = b.duration || 1;
                            return hour >= bStart && hour < bStart + bDur;
                          });
                          const active = selectedSlot === s;
                          return (
                            <TouchableOpacity
                              key={s}
                              disabled={isBooked}
                              onPress={() => setSelectedSlot(s)}
                              style={[M.slotBtn, active && M.slotBtnActive, isBooked && M.slotBtnBooked]}
                            >
                              <Text style={[M.slotBtnTxt, active && M.slotBtnTxtActive, isBooked && M.slotBtnTxtBooked]}>
                                {isBooked ? "Booked" : t12(s)}
                              </Text>
                            </TouchableOpacity>
                          );
                        });
                      })()}
                    </View>
                  </View>
                )}

                {/* Spots / Duration selector */}
                {isPaid && (
                  <View style={M.section}>
                    <Text style={M.sectionTitle}>Number of spots</Text>
                    <View style={M.spotCard}>
                      <View style={M.spotRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={M.spotLabel}>{kind === "service" ? "Duration" : "Spot"}</Text>
                          <Text style={M.spotPrice}>₹{pricePerSpot.toFixed(0)}{kind === "service" ? "/hr" : ""}</Text>
                        </View>
                        <View style={M.spotCounter}>
                          <TouchableOpacity
                            onPress={() => {
                              if (kind === "service") setDuration(d => Math.max(1, d - 1));
                              else setSpots(s => Math.max(1, s - 1));
                            }}
                            style={[M.counterBtn, (kind === "service" ? duration : spots) <= 1 && { opacity: 0.35 }]}
                            disabled={(kind === "service" ? duration : spots) <= 1}
                          >
                            <Ionicons name="remove" size={16} color={C.ink} />
                          </TouchableOpacity>
                          <Text style={M.counterVal}>{kind === "service" ? duration : spots}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              if (kind === "service") setDuration(d => d + 1);
                              else setSpots(s => s + 1);
                            }}
                            style={M.counterBtn}
                          >
                            <Ionicons name="add" size={16} color={C.ink} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={M.divider} />

                      <View style={M.summaryRow}>
                        <Text style={M.summaryLabel}>
                          {kind === "service" ? `${duration} x Hour` : `${spots} x Spot`}
                        </Text>
                        <Text style={M.summaryVal}>₹{subtotal.toFixed(0)}</Text>
                      </View>
                      <View style={M.summaryRow}>
                        <Text style={M.summaryLabel}>Platform Fee</Text>
                        <Text style={M.summaryVal}>₹{platformFeeFixed}</Text>
                      </View>

                      <View style={M.divider} />

                      <View style={M.summaryRow}>
                        <Text style={[M.summaryLabel, { color: C.ink, fontWeight: "800" }]}>Total</Text>
                        <Text style={[M.summaryVal, { color: C.green, fontWeight: "900", fontSize: 16 }]}>
                          ₹{(subtotal + platformFeeFixed).toFixed(0)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Free event order summary */}
                {!isPaid && (
                  <View style={M.section}>
                    <View style={M.freeCard}>
                      <View style={M.freeRow}>
                        <Text style={M.freeLabel}>{eventTitle}</Text>
                        <Text style={[M.freeVal, { color: C.green }]}>Free</Text>
                      </View>
                      <View style={M.divider} />
                      <View style={M.freeRow}>
                        <Text style={M.freeLabel}>Platform Fee</Text>
                        <Text style={M.freeVal}>₹{platformFeeFixed}</Text>
                      </View>
                      <View style={M.divider} />
                      <View style={M.freeRow}>
                        <Text style={[M.freeLabel, { fontWeight: "800", color: C.ink }]}>Total</Text>
                        <View style={M.totalFreeChip}>
                          <Text style={M.totalFreeChipText}>$0 • Free</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cancellation policy */}
                <View style={M.section}>
                  <View style={M.policyCard}>
                    <Text style={M.policyTitle}>Cancellation Policy</Text>
                    <Text style={M.policyText}>
                      Free Cancellation upto 24 hours before the event. No refund after that.
                    </Text>
                  </View>
                </View>

                {/* Name field */}
                <View style={M.section}>
                  <Text style={M.fieldLabel}>Your Name *</Text>
                  <TextInput
                    style={M.input}
                    value={name} onChangeText={setName}
                    placeholder="Full name"
                    placeholderTextColor={C.hint}
                    autoCapitalize="words"
                  />
                  {!!user?.primaryEmailAddress?.emailAddress && (
                    <>
                      <Text style={[M.fieldLabel, { marginTop: 12 }]}>Email</Text>
                      <View style={[M.input, { justifyContent: "center" }]}>
                        <Text style={{ color: C.muted, fontSize: 14 }}>
                          {user.primaryEmailAddress.emailAddress}
                        </Text>
                      </View>
                    </>
                  )}
                  <Text style={[M.fieldLabel, { marginTop: 12 }]}>Phone (optional)</Text>
                  <TextInput
                    style={M.input}
                    value={phone} onChangeText={setPhone}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={C.hint}
                    keyboardType="phone-pad"
                  />
                  <Text style={[M.fieldLabel, { marginTop: 12 }]}>Message to host (optional)</Text>
                  <TextInput
                    style={[M.input, { height: 72, textAlignVertical: "top", paddingTop: 12 }]}
                    value={message} onChangeText={setMessage}
                    placeholder="Anything the host should know?"
                    placeholderTextColor={C.hint}
                    multiline maxLength={300}
                  />
                </View>

                <View style={{ height: 16 }} />

                {/* Confirm button */}
                <View style={M.footer}>
                  <TouchableOpacity
                    onPress={handleConfirmBooking}
                    disabled={loading || (kind === "service" && !selectedSlot)}
                    style={[M.confirmBtn, (loading || (kind === "service" && !selectedSlot)) && { opacity: 0.6 }]}
                    activeOpacity={0.88}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <>
                          <Text style={M.confirmBtnText}>
                            {kind === "service" ? `Pay ₹${(subtotal + platformFeeFixed).toFixed(0)} & Book` : "Confirm Booking"}
                          </Text>
                          <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowModal(false)} style={M.cancelBtn}>
                    <Text style={M.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            )}

            {/* ═══ SCREEN: PAYMENT ═══ */}
            {screen === "payment" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={M.body}
              >

                {/* Order summary */}
                <View style={M.section}>
                  <Text style={M.sectionTitle}>Order Summary</Text>
                  <View style={M.spotCard}>
                    <View style={M.summaryRow}>
                      <Text style={M.summaryLabel}>
                        {kind === "service" ? `${duration} x Hour` : `${spots} x Spot`}
                      </Text>
                      <Text style={M.summaryVal}>₹{subtotal.toFixed(0)}</Text>
                    </View>
                    <View style={M.summaryRow}>
                      <Text style={M.summaryLabel}>Platform Fee</Text>
                      <Text style={M.summaryVal}>₹{platformFeeFixed}</Text>
                    </View>
                    <View style={M.divider} />
                    <View style={M.summaryRow}>
                      <Text style={[M.summaryLabel, { fontWeight: "800", color: C.ink }]}>Total</Text>
                      <Text style={[M.summaryVal, { color: C.green, fontWeight: "900", fontSize: 16 }]}>
                        ₹{(subtotal + platformFeeFixed).toFixed(0)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Razorpay info banner */}
                <View style={M.section}>
                  <View style={M.rzpBanner}>
                    <Ionicons name="shield-checkmark" size={20} color="#0A84FF" />
                    <View style={{ flex: 1 }}>
                      <Text style={M.rzpBannerTitle}>Powered by Razorpay</Text>
                      <Text style={M.rzpBannerSub}>
                        Pay securely via Card, UPI, Netbanking or Wallet — choose inside the payment screen
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ height: 16 }} />

                {/* Pay button */}
                <View style={M.footer}>
                  <TouchableOpacity
                    onPress={handlePay}
                    disabled={loading}
                    style={[M.confirmBtn, loading && { opacity: 0.6 }]}
                    activeOpacity={0.88}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <>
                          <Ionicons name="lock-closed" size={16} color="#fff" />
                          <Text style={M.confirmBtnText}>Pay ₹{(subtotal + platformFeeFixed).toFixed(0)} →</Text>
                        </>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setScreen("booking")} style={M.cancelBtn}>
                    <Text style={M.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            )}


            {/* ═══ SCREEN: CONFIRMED ═══ */}
            {screen === "confirmed" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[M.body, { alignItems: "center" }]}
              >
                {/* Big checkmark */}
                <View style={M.confirmCircle}>
                  <Ionicons name="checkmark" size={52} color={C.green} />
                </View>
                <Text style={M.confirmTitle}>Booking Confirmed!</Text>
                <Text style={M.confirmSub}>Your tickets are ready. Show QR at the entry.</Text>

                {/* Ticket card */}
                <View style={M.ticketCard}>
                  <View style={M.ticketHeader}>
                    <View style={M.ticketDot} />
                    <Text style={M.ticketStatus}>● Confirmed</Text>
                  </View>
                  <Text style={M.ticketEventName}>{eventTitle}</Text>

                  <View style={M.ticketDashedLine} />

                  <View style={M.ticketGrid}>
                    <View style={M.ticketCell}>
                      <Text style={M.ticketCellLabel}>Attendee</Text>
                      <Text style={M.ticketCellVal}>{name || "You"}</Text>
                    </View>
                    <View style={M.ticketCell}>
                      <Text style={M.ticketCellLabel}>{kind === "service" ? "Duration" : "Tickets"}</Text>
                      <Text style={M.ticketCellVal}>
                        {kind === "service" ? `${duration} Hours` : `${spots} x General`}
                      </Text>
                    </View>
                    <View style={M.ticketCell}>
                      <Text style={M.ticketCellLabel}>Location</Text>
                      <Text style={M.ticketCellVal} numberOfLines={1}>
                        {eventLocation || "-"}
                      </Text>
                    </View>
                    <View style={M.ticketCell}>
                      <Text style={M.ticketCellLabel}>Amount</Text>
                      <Text style={[M.ticketCellVal, { color: C.green }]}>
                        {isPaid ? `₹${(subtotal + platformFeeFixed).toFixed(0)}` : "Free"}
                      </Text>
                    </View>
                  </View>

                  {/* Barcode area */}
                  <View style={M.barcodeWrap}>
                    {confirmOtp ? (
                      <View style={M.otpBox}>
                        <Text style={M.otpLabel}>Check-in OTP</Text>
                        <Text style={M.otpCode}>{confirmOtp}</Text>
                        <Text style={M.otpHint}>Show this code to the host on arrival</Text>
                      </View>
                    ) : (
                      <View style={M.barcodeMock}>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <View key={i} style={[M.barcodeBar, { width: [1,2,1,3,1,2,1,1,3,2,1,2,1,1,2,3,1,2,1,1,2,1,3,2][i] * 2, opacity: 0.8 }]} />
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Buttons */}
                <View style={{ width: "100%", gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={M.confirmBtn} activeOpacity={0.88} onPress={() => setShowModal(false)}>
                    <Text style={M.confirmBtnText}>Show QR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={M.cancelBtn} activeOpacity={0.88} onPress={() => setShowModal(false)}>
                    <Text style={[M.cancelBtnText, { color: C.muted }]}>All Tickets</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 32 }} />
              </ScrollView>
            )}

          </View>
        </View>
      </Modal>

      {/* ── Razorpay (actual payment processor) ── */}
      {razorpayOrderData && (
        <RazorpaySheet
          visible={razorpayVisible}
          orderData={razorpayOrderData}
          userInfo={{
            name:  name.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" "),
            email: user?.primaryEmailAddress?.emailAddress || "",
            phone: phone.trim(),
          }}
          onSuccess={handlePaymentSuccess}
          onDismiss={() => { setRazorpayVisible(false); setRazorpayOrderData(null); }}
          onFailed={(err, extra) => {
            setRazorpayVisible(false); setRazorpayOrderData(null);
            setFailureErrorMsg(err || "Payment could not be processed.");
            setFailureDetails(typeof extra === 'string' ? extra : JSON.stringify(extra) || null);
            console.error("Razorpay Failure:", err, extra);
            setFailureModalVisible(true);
          }}
        />
      )}

      {/* ── Failure Modal ── */}
      <PaymentFailureModal
        visible={failureModalVisible}
        errorMsg={failureErrorMsg ?? undefined}
        details={failureDetails ?? undefined}
        eventTitle={eventTitle || "Payment"}
        onClose={() => setFailureModalVisible(false)}
        onRetry={() => {
          setFailureModalVisible(false);
          // short delay before retrying
          setTimeout(() => handlePay(), 400);
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */

// Main CTA button
const B = StyleSheet.create({
  cta: {
    height: 52, borderRadius: 14,
    backgroundColor: C.green,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  ctaJoined:   { backgroundColor: "rgba(29,185,84,0.7)" },
  ctaPending:  { backgroundColor: C.amber },
  ctaDisabled: { opacity: 0.50 },
  ctaPressed:  { transform: [{ scale: 0.98 }], opacity: 0.94 },
  ctaText:     { color: "#fff", fontWeight: "800", fontSize: 15 },
  cancelCta: {
    marginTop: 12,
    height: 48, borderRadius: 14,
    borderWidth: 1.5, borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    alignItems: "center", justifyContent: "center",
  },
  cancelCtaText: { color: "#EF4444", fontWeight: "700", fontSize: 14 },
});

// Modal
const M = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "94%",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerBack: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    flex: 1, textAlign: "center",
    fontSize: 16, fontWeight: "800", color: C.ink,
  },
  headerClose: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
  },

  body:         { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 },

  /* Spot card */
  spotCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 16,
  },
  spotRow:   { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  spotLabel: { fontSize: 14, fontWeight: "700", color: C.ink },
  spotPrice: { fontSize: 12, color: C.muted, marginTop: 2 },
  spotCounter: { flexDirection: "row", alignItems: "center", gap: 14 },
  counterBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  counterVal: { fontSize: 16, fontWeight: "800", color: C.ink, minWidth: 20, textAlign: "center" },
  divider:    { height: 1, backgroundColor: C.border, marginVertical: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: C.muted, fontWeight: "500" },
  summaryVal:   { fontSize: 13, color: C.ink2, fontWeight: "700" },

  /* Free card */
  freeCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 16,
  },
  freeRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  freeLabel: { fontSize: 13, color: C.muted, fontWeight: "500" },
  freeVal:   { fontSize: 13, color: C.ink2, fontWeight: "700" },
  totalFreeChip: {
    backgroundColor: "rgba(29,185,84,0.10)", borderWidth: 1,
    borderColor: "rgba(29,185,84,0.28)", paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 999,
  },
  totalFreeChipText: { fontSize: 12, fontWeight: "800", color: C.green },

  /* Policy */
  policyCard: {
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, padding: 14,
  },
  policyTitle: { fontSize: 13, fontWeight: "700", color: C.ink2, marginBottom: 4 },
  policyText:  { fontSize: 12, color: C.muted, lineHeight: 18 },

  /* Fields */
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    color: C.ink, fontSize: 14, fontWeight: "600",
  },

  /* Payment method */
  payMethodCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  payMethodRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  payMethodRowActive: { backgroundColor: "rgba(29,185,84,0.05)" },
  payMethodIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  payMethodLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: C.muted },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: C.hint, alignItems: "center", justifyContent: "center",
  },
  radioOuterActive: { borderColor: C.green, backgroundColor: C.green },
  radioDot:         { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#fff" },

  /* Footer buttons */
  footer:     { gap: 10 },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 54, borderRadius: 14, backgroundColor: C.green,
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 10, elevation: 5,
  },
  confirmBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  cancelBtn:      { height: 46, alignItems: "center", justifyContent: "center" },
  cancelBtnText:  { fontSize: 14, fontWeight: "700", color: C.muted },

  /* Razorpay banner */
  rzpBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: "rgba(10,132,255,0.07)",
    borderWidth: 1, borderColor: "rgba(10,132,255,0.18)",
    borderRadius: 14, padding: 14,
  },
  rzpBannerTitle: { fontSize: 13, fontWeight: "800", color: "#0A84FF", marginBottom: 3 },
  rzpBannerSub:   { fontSize: 12, color: C.muted, fontWeight: "500", lineHeight: 17 },

  /* Confirmed screen */
  confirmCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: C.green,
    alignItems: "center", justifyContent: "center",
    marginTop: 16, marginBottom: 16,
  },
  confirmTitle: { fontSize: 24, fontWeight: "900", color: C.ink, marginBottom: 6 },
  confirmSub:   { fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 24, fontWeight: "500" },

  /* Ticket */
  ticketCard: {
    width: "100%", backgroundColor: C.bg,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  ticketHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  ticketDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  ticketStatus: { fontSize: 12, fontWeight: "700", color: C.green },
  ticketEventName: { fontSize: 20, fontWeight: "900", color: C.ink, marginBottom: 4 },
  ticketDashedLine: {
    height: 1, borderWidth: 1, borderColor: C.border,
    borderStyle: "dashed", marginVertical: 14,
  },
  ticketGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 16,
  },
  ticketCell:      { width: "45%" },
  ticketCellLabel: { fontSize: 10, color: C.hint, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  ticketCellVal:   { fontSize: 13, fontWeight: "700", color: C.ink2 },

  /* Barcode */
  barcodeWrap: { alignItems: "center", paddingTop: 8 },
  barcodeMock: { flexDirection: "row", gap: 2, height: 48, alignItems: "center" },
  barcodeBar:  { height: "100%", backgroundColor: C.ink2, borderRadius: 1 },
  otpBox:      { alignItems: "center", gap: 4, paddingVertical: 8 },
  otpLabel:    { fontSize: 11, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  otpCode:     { fontSize: 36, fontWeight: "900", color: C.green, letterSpacing: 8 },
  otpHint:     { fontSize: 11, color: C.muted, textAlign: "center" },

  // Slots
  slotsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8,
  },
  slotBtn: {
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: 10, backgroundColor: "#F3F4F6",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    minWidth: "22%", alignItems: "center",
  },
  slotBtnActive: {
    backgroundColor: C.green, borderColor: C.green,
  },
  slotBtnBooked: {
    backgroundColor: "#E5E7EB", opacity: 0.6,
  },
  slotBtnTxt: { fontSize: 13, fontWeight: "700", color: C.ink2 },
  slotBtnTxtActive: { color: "#fff" },
  slotBtnTxtBooked: { color: C.hint, fontSize: 11 },
});