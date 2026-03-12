// components/ClickPin/JoinEventButton.tsx
// ✅ Updated: Razorpay payment flow for paid events

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Pressable, StyleSheet, Text, View, ActivityIndicator,
  Modal, TextInput, ScrollView, Keyboard,
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
import PaymentSuccessModal from "../Payment/PaymentSuccessModal";
import PaymentFailureModal from "../Payment/PaymentFailureModal";

type EventKind = "free" | "paid" | "event_free" | "event_paid" | "service";

type Props = {
  eventId:     string;
  kind:        EventKind;
  priceCents?: number | null;
  eventTitle?: string;
  label?:      string;
  onJoined?:   (payload: any) => void;
  disabled?:   boolean;
  joinPolicy?: "open" | "approval";
};

export default function JoinEventButton({
  eventId,
  kind,
  priceCents = null,
  eventTitle = "Event",
  label = "Join event",
  onJoined,
  disabled,
  joinPolicy = "open",
}: Props) {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (EVENT_API_KEY) h["x-api-key"] = EVENT_API_KEY;
    return h;
  }, [EVENT_API_KEY]);

  const isPaid = kind === "paid" || kind === "event_paid";

  // ── state ──────────────────────────────────────────────
  const [loading, setLoading]               = useState(false);
  const [joined, setJoined]                 = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [showForm, setShowForm]             = useState(false);

  // Razorpay states
  const [razorpayVisible, setRazorpayVisible]             = useState(false);
  const [razorpayOrderData, setRazorpayOrderData]         = useState<RazorpayOrderData | null>(null);
  const [successModalVisible, setSuccessModalVisible]     = useState(false);
  const [successCheckInOtp, setSuccessCheckInOtp]         = useState<string | null>(null);
  const [successPaymentId, setSuccessPaymentId]           = useState<string | null>(null);
  const [failureModalVisible, setFailureModalVisible]     = useState(false);
  const [failureErrorMsg, setFailureErrorMsg]             = useState<string | null>(null);

  // Form fields
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [message, setMessage] = useState("");

  // Auto-fill name
  useEffect(() => {
    if ((showForm || razorpayVisible) && user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (fullName) setName(fullName);
    }
  }, [showForm, razorpayVisible, user]);

  // Check if already joined
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

  // ── Razorpay: create order ─────────────────────────────
  const startRazorpayFlow = async () => {
    if (!API_BASE || !userId) return;
    if (!priceCents || priceCents <= 0) {
      Alert.alert("Price Error", "Event price not set. Please contact the host.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount:      priceCents,    // already in paise
          eventId,
          clerkUserId: userId,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.orderId) {
        Alert.alert("Payment Error", json?.error || "Could not initiate payment.");
        return;
      }

      setRazorpayOrderData({
        orderId:     json.orderId,
        amount:      json.amount,
        currency:    json.currency,
        keyId:       json.keyId,
        eventTitle,
        description: `Join ${eventTitle}`,
      });
      setRazorpayVisible(true);
    } catch {
      Alert.alert("Network Error", "Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Razorpay: on payment success ───────────────────────
  const handlePaymentSuccess = async (payload: RazorpaySuccessPayload) => {
    setRazorpayVisible(false);
    setLoading(true);

    try {
      // Step 1: Verify signature on backend
      const verifyRes = await apiFetch(`${API_BASE}/api/payment/verify`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...payload,
          eventId,
          clerkUserId: userId,
          amount:      priceCents,
        }),
      });

      const verifyJson = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok || !verifyJson?.verified) {
        Alert.alert("Verification Failed", "Payment could not be verified. Contact support.");
        return;
      }

      // Step 2: Join event with paymentId
      const email    = user?.primaryEmailAddress?.emailAddress || "";
      const imageUrl = user?.imageUrl || "";
      const fullName = name.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ");

      const joinRes = await apiFetch(`${API_BASE}/api/events/join`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId,
          clerkUserId:        userId,
          name:               fullName,
          email,
          phone:              phone.trim(),
          message:            message.trim(),
          imageUrl,
          razorpayPaymentId:  payload.razorpay_payment_id,
          razorpayOrderId:    payload.razorpay_order_id,
        }),
      });

      const joinJson = await joinRes.json().catch(() => null);
      if (!joinRes.ok) {
        Alert.alert("Join Failed", joinJson?.error || "Payment succeeded but join failed. Contact support.");
        return;
      }

      setJoined(true);
      setSuccessCheckInOtp(joinJson?.checkInOtp || null);
      setSuccessPaymentId(payload.razorpay_payment_id);
      setSuccessModalVisible(true);
      onJoined?.(joinJson);
    } catch {
      Alert.alert("Error", "Something went wrong. Your payment was received — please contact support.");
    } finally {
      setLoading(false);
    }
  };

  // ── Free event: submit join ────────────────────────────
  const submitJoinRequest = async () => {
    if (!name.trim()) { Alert.alert("Name required", "Please enter your name."); return; }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const email    = user?.primaryEmailAddress?.emailAddress || "";
      const imageUrl = user?.imageUrl || "";
      const res = await apiFetch(`${API_BASE}/api/events/join-request`, {
        method: "POST", headers,
        body: JSON.stringify({ eventId, clerkUserId: userId, name: name.trim(), email, phone: phone.trim(), message: message.trim(), imageUrl }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) { Alert.alert("Couldn't send request", json?.error || "Please try again"); return; }
      if (json?.status === "already_joined")  { setJoined(true);          setShowForm(false); return; }
      if (json?.status === "already_pending") { setPendingRequest(true);  setShowForm(false); return; }
      setPendingRequest(true);
      setShowForm(false);
      Alert.alert("Request Sent! 📬", "The host will review your request. You'll get a check-in OTP once admitted.", [{ text: "Got it!" }]);
    } catch {
      Alert.alert("Network error", "Please check your connection and try again.");
    } finally { setLoading(false); }
  };

  const submitJoin = async () => {
    if (joinPolicy === "approval") { await submitJoinRequest(); return; }
    if (!name.trim()) { Alert.alert("Name required", "Please enter your name to join."); return; }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const email    = user?.primaryEmailAddress?.emailAddress || "";
      const imageUrl = user?.imageUrl || "";
      const res = await apiFetch(`${API_BASE}/api/events/join`, {
        method: "POST", headers,
        body: JSON.stringify({ eventId, clerkUserId: userId, name: name.trim(), email, phone: phone.trim(), message: message.trim(), imageUrl }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (json?.error === "Event is full") { setShowForm(false); Alert.alert("Event is full 😔", json?.detail || "No more spots available."); return; }
        Alert.alert("Couldn't join", json?.message || json?.error || "Please try again");
        return;
      }
      setJoined(true);
      setShowForm(false);
      onJoined?.(json);
      const otp = json?.checkInOtp;
      Alert.alert("🎉 You're in!", otp ? `Your check-in OTP is:\n\n${otp}\n\nShow this 4-digit code to the host when you arrive.` : "You're registered for this event!", [{ text: "Got it!" }]);
    } catch {
      Alert.alert("Network error", "Please check your connection and try again.");
    } finally { setLoading(false); }
  };

  // ── onPress ────────────────────────────────────────────
  const onPress = async () => {
    if (disabled || loading || joined) return;
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to continue.");
      router.push("/sign-in" as any);
      return;
    }
    if (isPaid) {
      await startRazorpayFlow();
    } else {
      setShowForm(true);
    }
  };

  // ── Button label & icon ────────────────────────────────
  const buttonLabel =
    pendingRequest     ? "Waiting for Approval" :
    joined             ? "Joined ✓" :
    isPaid && priceCents ? `Pay ₹${(priceCents / 100).toFixed(0)} & Join` :
    label;

  const iconName =
    pendingRequest                    ? "time-outline" :
    joined                            ? "checkmark-circle-outline" :
    isPaid                            ? "card-outline" :
    joinPolicy === "approval"         ? "hourglass-outline" :
    "people-outline";

  const isDisabledBtn = disabled || loading || joined || pendingRequest;

  return (
    <>
      {/* ── Main CTA ── */}
      <Pressable
        onPress={onPress}
        disabled={isDisabledBtn}
        style={({ pressed }) => [
          styles.cta,
          isPaid && !joined && !pendingRequest && styles.ctaPaid,
          isDisabledBtn && styles.ctaDisabled,
          pendingRequest && styles.ctaPending,
          pressed && !isDisabledBtn && styles.ctaPressed,
        ]}
      >
        <View style={styles.ctaGlow} />
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Ionicons name={iconName as any} size={18} color="#fff" />
        }
        <Text style={styles.ctaText}>{buttonLabel}</Text>
      </Pressable>

      {/* ── Free Join Form Sheet ── */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <Pressable style={sheet.backdrop} onPress={() => { Keyboard.dismiss(); setShowForm(false); }}>
          <View style={sheet.sheetWrap} onStartShouldSetResponder={() => true}>
            <View style={sheet.grabberWrap}><View style={sheet.grabber} /></View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={sheet.title}>{joinPolicy === "approval" ? "Request to Join" : "Join Event"}</Text>
              <Text style={sheet.subtitle}>{joinPolicy === "approval" ? "Host will review your request before admitting you." : "Your info will be shared with the host."}</Text>

              <Text style={sheet.label}>Your Name *</Text>
              <TextInput style={sheet.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="rgba(255,255,255,0.30)" autoCapitalize="words" returnKeyType="next" />

              <Text style={sheet.label}>Phone Number</Text>
              <TextInput style={sheet.input} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor="rgba(255,255,255,0.30)" keyboardType="phone-pad" returnKeyType="next" />

              {!!user?.primaryEmailAddress?.emailAddress && (
                <>
                  <Text style={sheet.label}>Email</Text>
                  <View style={[sheet.input, sheet.inputReadonly]}><Text style={sheet.inputReadonlyText}>{user.primaryEmailAddress.emailAddress}</Text></View>
                </>
              )}

              <Text style={sheet.label}>Message to host (optional)</Text>
              <TextInput style={[sheet.input, { height: 80, textAlignVertical: "top" }]} value={message} onChangeText={setMessage} placeholder="Anything the host should know?" placeholderTextColor="rgba(255,255,255,0.30)" multiline maxLength={300} />

              <View style={[sheet.otpBanner, joinPolicy === "approval" && sheet.otpBannerApproval]}>
                <Ionicons name={joinPolicy === "approval" ? "hourglass-outline" : "shield-checkmark-outline"} size={15} color={joinPolicy === "approval" ? "#F59E0B" : "#4ADE80"} />
                <Text style={[sheet.otpBannerText, joinPolicy === "approval" && { color: "rgba(245,158,11,0.8)" }]}>
                  {joinPolicy === "approval" ? "Host will review your request. Once admitted, you'll receive a check-in OTP." : "You'll get a 4-digit check-in OTP after joining. Show it to the host on arrival."}
                </Text>
              </View>

              <Pressable onPress={submitJoin} disabled={loading} style={({ pressed }) => [sheet.submitBtn, loading && sheet.submitDisabled, pressed && !loading && sheet.submitPressed]}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={sheet.submitText}>{joinPolicy === "approval" ? "Send Request" : "Confirm & Join"}</Text>}
              </Pressable>
              <Pressable onPress={() => setShowForm(false)} style={sheet.cancelBtn}><Text style={sheet.cancelText}>Cancel</Text></Pressable>
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* ── Razorpay WebView Sheet ── */}
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
          onDismiss={() => {
            setRazorpayVisible(false);
            setRazorpayOrderData(null);
          }}
          onFailed={(err) => {
            setRazorpayVisible(false);
            setRazorpayOrderData(null);
            setFailureErrorMsg(err || "Payment could not be processed.");
            setFailureModalVisible(true);
          }}
        />
      )}

      {/* ── Payment Success Modal ── */}
      <PaymentSuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        eventTitle={eventTitle}
        amountPaise={priceCents ?? 0}
        checkInOtp={successCheckInOtp}
        paymentId={successPaymentId ?? undefined}
      />

      {/* ── Payment Failure Modal ── */}
      <PaymentFailureModal
        visible={failureModalVisible}
        errorMsg={failureErrorMsg ?? undefined}
        eventTitle={eventTitle}
        onClose={() => setFailureModalVisible(false)}
        onRetry={() => {
          setFailureModalVisible(false);
          // small delay so the modal closes smoothly before Razorpay reopens
          setTimeout(() => startRazorpayFlow(), 350);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cta: {
    height: 56, borderRadius: 18,
    backgroundColor: "rgba(10,132,255,0.92)",
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 10,
    overflow: "hidden", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ctaPaid:    { backgroundColor: "rgba(16,185,129,0.90)", borderColor: "rgba(16,185,129,0.30)" },
  ctaPressed: { transform: [{ scale: 0.992 }], opacity: 0.96 },
  ctaDisabled:{ opacity: 0.55 },
  ctaPending: { backgroundColor: "rgba(245,158,11,0.92)", borderColor: "rgba(245,158,11,0.3)" },
  ctaGlow: {
    position: "absolute", width: 260, height: 260,
    borderRadius: 260, right: -140, top: -160,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  ctaText: { color: "#fff", fontWeight: "950" as any, fontSize: 15 },
});

const sheet = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: "rgba(2,6,23,0.72)", justifyContent: "flex-end" },
  sheetWrap:  { backgroundColor: "#0F172A", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 20, maxHeight: "92%", borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  grabberWrap:{ alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  grabber:    { width: 48, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)" },
  title:      { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 4 },
  subtitle:   { color: "rgba(255,255,255,0.50)", fontSize: 13, fontWeight: "700", marginBottom: 16 },
  label:      { color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: "900", marginBottom: 6, marginTop: 16 },
  input:      { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: "#fff", fontSize: 14, fontWeight: "700" },
  inputReadonly:     { justifyContent: "center", opacity: 0.6 },
  inputReadonlyText: { color: "rgba(255,255,255,0.70)", fontSize: 14, fontWeight: "700" },
  otpBanner:  { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "rgba(74,222,128,0.08)", borderWidth: 1, borderColor: "rgba(74,222,128,0.20)", borderRadius: 14, padding: 12, marginTop: 20 },
  otpBannerApproval: { backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.20)" },
  otpBannerText: { flex: 1, color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: "700", lineHeight: 18 },
  submitBtn:  { height: 54, borderRadius: 16, backgroundColor: "rgba(10,132,255,0.92)", alignItems: "center", justifyContent: "center", marginTop: 20 },
  submitPressed: { opacity: 0.88 },
  submitDisabled:{ opacity: 0.50 },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  cancelBtn:  { height: 46, alignItems: "center", justifyContent: "center", marginTop: 10 },
  cancelText: { color: "rgba(255,255,255,0.45)", fontWeight: "800", fontSize: 14 },
});