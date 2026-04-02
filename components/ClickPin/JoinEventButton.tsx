// // components/ClickPin/JoinEventButton.tsx
// // ✅ Updated: Razorpay payment flow for paid events

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Alert, Pressable, StyleSheet, Text, View, ActivityIndicator,
//   Modal, TextInput, ScrollView, Keyboard,
// } from "react-native";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import Constants from "expo-constants";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { apiFetch } from "../../lib/apiFetch";
// import RazorpaySheet, {
//   type RazorpayOrderData,
//   type RazorpaySuccessPayload,
// } from "../Payment/RazorpaySheet";
// import PaymentSuccessModal from "../Payment/PaymentSuccessModal";
// import PaymentFailureModal from "../Payment/PaymentFailureModal";

// type EventKind = "free" | "paid" | "event_free" | "event_paid" | "service";

// type Props = {
//   eventId:     string;
//   kind:        EventKind;
//   priceCents?: number | null;
//   eventTitle?: string;
//   label?:      string;
//   onJoined?:   (payload: any) => void;
//   disabled?:   boolean;
//   joinPolicy?: "open" | "approval";
// };

// export default function JoinEventButton({
//   eventId,
//   kind,
//   priceCents = null,
//   eventTitle = "Event",
//   label = "Join event",
//   onJoined,
//   disabled,
//   joinPolicy = "open",
// }: Props) {
//   const router = useRouter();
//   const { userId } = useAuth();
//   const { user } = useUser();

//   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const headers = useMemo(() => {
//     const h: Record<string, string> = { "Content-Type": "application/json" };
//     if (EVENT_API_KEY) h["x-api-key"] = EVENT_API_KEY;
//     return h;
//   }, [EVENT_API_KEY]);

//   const isPaid = kind === "paid" || kind === "event_paid";

//   // ── state ──────────────────────────────────────────────
//   const [loading, setLoading]               = useState(false);
//   const [joined, setJoined]                 = useState(false);
//   const [pendingRequest, setPendingRequest] = useState(false);
//   const [showForm, setShowForm]             = useState(false);

//   // Razorpay states
//   const [razorpayVisible, setRazorpayVisible]             = useState(false);
//   const [razorpayOrderData, setRazorpayOrderData]         = useState<RazorpayOrderData | null>(null);
//   const [successModalVisible, setSuccessModalVisible]     = useState(false);
//   const [successCheckInOtp, setSuccessCheckInOtp]         = useState<string | null>(null);
//   const [successPaymentId, setSuccessPaymentId]           = useState<string | null>(null);
//   const [failureModalVisible, setFailureModalVisible]     = useState(false);
//   const [failureErrorMsg, setFailureErrorMsg]             = useState<string | null>(null);

//   // Form fields
//   const [name, setName]       = useState("");
//   const [phone, setPhone]     = useState("");
//   const [message, setMessage] = useState("");

//   // Auto-fill name
//   useEffect(() => {
//     if ((showForm || razorpayVisible) && user) {
//       const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
//       if (fullName) setName(fullName);
//     }
//   }, [showForm, razorpayVisible, user]);

//   // Check if already joined
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       try {
//         if (!API_BASE || !userId || !eventId) return;
//         const url = `${API_BASE}/api/events/is-joined?eventId=${encodeURIComponent(eventId)}&clerkUserId=${encodeURIComponent(userId)}`;
//         const res = await apiFetch(url, {
//           headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
//         });
//         const json = await res.json().catch(() => null);
//         if (!cancelled && res.ok) {
//           setJoined(!!json?.joined);
//           setPendingRequest(!!json?.pending);
//         }
//       } catch {}
//     })();
//     return () => { cancelled = true; };
//   }, [API_BASE, EVENT_API_KEY, userId, eventId]);

//   // ── Razorpay: create order ─────────────────────────────
//   const startRazorpayFlow = async () => {
//     if (!API_BASE || !userId) return;
//     if (!priceCents || priceCents <= 0) {
//       Alert.alert("Price Error", "Event price not set. Please contact the host.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await apiFetch(`${API_BASE}/api/payment/create-order`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify({
//           amount:      priceCents,    // already in paise
//           eventId,
//           clerkUserId: userId,
//         }),
//       });

//       const json = await res.json().catch(() => null);
//       if (!res.ok || !json?.orderId) {
//         Alert.alert("Payment Error", json?.error || "Could not initiate payment.");
//         return;
//       }

//       setRazorpayOrderData({
//         orderId:     json.orderId,
//         amount:      json.amount,
//         currency:    json.currency,
//         keyId:       json.keyId,
//         eventTitle,
//         description: `Join ${eventTitle}`,
//       });
//       setRazorpayVisible(true);
//     } catch {
//       Alert.alert("Network Error", "Please check your connection and try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Razorpay: on payment success ───────────────────────
//   const handlePaymentSuccess = async (payload: RazorpaySuccessPayload) => {
//     setRazorpayVisible(false);
//     setLoading(true);

//     try {
//       // Step 1: Verify signature on backend
//       const verifyRes = await apiFetch(`${API_BASE}/api/payment/verify`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify({
//           ...payload,
//           eventId,
//           clerkUserId: userId,
//           amount:      priceCents,
//         }),
//       });

//       const verifyJson = await verifyRes.json().catch(() => null);
//       if (!verifyRes.ok || !verifyJson?.verified) {
//         Alert.alert("Verification Failed", "Payment could not be verified. Contact support.");
//         return;
//       }

//       // Step 2: Join event with paymentId
//       const email    = user?.primaryEmailAddress?.emailAddress || "";
//       const imageUrl = user?.imageUrl || "";
//       const fullName = name.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ");

//       const joinRes = await apiFetch(`${API_BASE}/api/events/join`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify({
//           eventId,
//           clerkUserId:        userId,
//           name:               fullName,
//           email,
//           phone:              phone.trim(),
//           message:            message.trim(),
//           imageUrl,
//           razorpayPaymentId:  payload.razorpay_payment_id,
//           razorpayOrderId:    payload.razorpay_order_id,
//         }),
//       });

//       const joinJson = await joinRes.json().catch(() => null);
//       if (!joinRes.ok) {
//         Alert.alert("Join Failed", joinJson?.error || "Payment succeeded but join failed. Contact support.");
//         return;
//       }

//       setJoined(true);
//       setSuccessCheckInOtp(joinJson?.checkInOtp || null);
//       setSuccessPaymentId(payload.razorpay_payment_id);
//       setSuccessModalVisible(true);
//       onJoined?.(joinJson);
//     } catch {
//       Alert.alert("Error", "Something went wrong. Your payment was received — please contact support.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Free event: submit join ────────────────────────────
//   const submitJoinRequest = async () => {
//     if (!name.trim()) { Alert.alert("Name required", "Please enter your name."); return; }
//     Keyboard.dismiss();
//     setLoading(true);
//     try {
//       const email    = user?.primaryEmailAddress?.emailAddress || "";
//       const imageUrl = user?.imageUrl || "";
//       const res = await apiFetch(`${API_BASE}/api/events/join-request`, {
//         method: "POST", headers,
//         body: JSON.stringify({ eventId, clerkUserId: userId, name: name.trim(), email, phone: phone.trim(), message: message.trim(), imageUrl }),
//       });
//       const json = await res.json().catch(() => null);
//       if (!res.ok) { Alert.alert("Couldn't send request", json?.error || "Please try again"); return; }
//       if (json?.status === "already_joined")  { setJoined(true);          setShowForm(false); return; }
//       if (json?.status === "already_pending") { setPendingRequest(true);  setShowForm(false); return; }
//       setPendingRequest(true);
//       setShowForm(false);
//       Alert.alert("Request Sent! 📬", "The host will review your request. You'll get a check-in OTP once admitted.", [{ text: "Got it!" }]);
//     } catch {
//       Alert.alert("Network error", "Please check your connection and try again.");
//     } finally { setLoading(false); }
//   };

//   const submitJoin = async () => {
//     if (joinPolicy === "approval") { await submitJoinRequest(); return; }
//     if (!name.trim()) { Alert.alert("Name required", "Please enter your name to join."); return; }
//     Keyboard.dismiss();
//     setLoading(true);
//     try {
//       const email    = user?.primaryEmailAddress?.emailAddress || "";
//       const imageUrl = user?.imageUrl || "";
//       const res = await apiFetch(`${API_BASE}/api/events/join`, {
//         method: "POST", headers,
//         body: JSON.stringify({ eventId, clerkUserId: userId, name: name.trim(), email, phone: phone.trim(), message: message.trim(), imageUrl }),
//       });
//       const json = await res.json().catch(() => null);
//       if (!res.ok) {
//         if (json?.error === "Event is full") { setShowForm(false); Alert.alert("Event is full 😔", json?.detail || "No more spots available."); return; }
//         Alert.alert("Couldn't join", json?.message || json?.error || "Please try again");
//         return;
//       }
//       setJoined(true);
//       setShowForm(false);
//       onJoined?.(json);
//       const otp = json?.checkInOtp;
//       Alert.alert("🎉 You're in!", otp ? `Your check-in OTP is:\n\n${otp}\n\nShow this 4-digit code to the host when you arrive.` : "You're registered for this event!", [{ text: "Got it!" }]);
//     } catch {
//       Alert.alert("Network error", "Please check your connection and try again.");
//     } finally { setLoading(false); }
//   };

//   // ── onPress ────────────────────────────────────────────
//   const onPress = async () => {
//     if (disabled || loading || joined) return;
//     if (!userId) {
//       Alert.alert("Sign in required", "Please sign in to continue.");
//       router.push("/sign-in" as any);
//       return;
//     }
//     if (isPaid) {
//       await startRazorpayFlow();
//     } else {
//       setShowForm(true);
//     }
//   };

//   // ── Button label & icon ────────────────────────────────
//   const buttonLabel =
//     pendingRequest     ? "Waiting for Approval" :
//     joined             ? "Joined ✓" :
//     isPaid && priceCents ? `Pay ₹${(priceCents / 100).toFixed(0)} & Join` :
//     label;

//   const iconName =
//     pendingRequest                    ? "time-outline" :
//     joined                            ? "checkmark-circle-outline" :
//     isPaid                            ? "card-outline" :
//     joinPolicy === "approval"         ? "hourglass-outline" :
//     "people-outline";

//   const isDisabledBtn = disabled || loading || joined || pendingRequest;

//   return (
//     <>
//       {/* ── Main CTA ── */}
//       <Pressable
//         onPress={onPress}
//         disabled={isDisabledBtn}
//         style={({ pressed }) => [
//           styles.cta,
//           isPaid && !joined && !pendingRequest && styles.ctaPaid,
//           isDisabledBtn && styles.ctaDisabled,
//           pendingRequest && styles.ctaPending,
//           pressed && !isDisabledBtn && styles.ctaPressed,
//         ]}
//       >
//         <View style={styles.ctaGlow} />
//         {loading
//           ? <ActivityIndicator color="#fff" />
//           : <Ionicons name={iconName as any} size={18} color="#fff" />
//         }
//         <Text style={styles.ctaText}>{buttonLabel}</Text>
//       </Pressable>

//       {/* ── Free Join Form Sheet ── */}
//       <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
//         <Pressable style={sheet.backdrop} onPress={() => { Keyboard.dismiss(); setShowForm(false); }}>
//           <View style={sheet.sheetWrap} onStartShouldSetResponder={() => true}>
//             <View style={sheet.grabberWrap}><View style={sheet.grabber} /></View>
//             <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
//               <Text style={sheet.title}>{joinPolicy === "approval" ? "Request to Join" : "Join Event"}</Text>
//               <Text style={sheet.subtitle}>{joinPolicy === "approval" ? "Host will review your request before admitting you." : "Your info will be shared with the host."}</Text>

//               <Text style={sheet.label}>Your Name *</Text>
//               <TextInput style={sheet.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="rgba(255,255,255,0.30)" autoCapitalize="words" returnKeyType="next" />

//               <Text style={sheet.label}>Phone Number</Text>
//               <TextInput style={sheet.input} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor="rgba(255,255,255,0.30)" keyboardType="phone-pad" returnKeyType="next" />

//               {!!user?.primaryEmailAddress?.emailAddress && (
//                 <>
//                   <Text style={sheet.label}>Email</Text>
//                   <View style={[sheet.input, sheet.inputReadonly]}><Text style={sheet.inputReadonlyText}>{user.primaryEmailAddress.emailAddress}</Text></View>
//                 </>
//               )}

//               <Text style={sheet.label}>Message to host (optional)</Text>
//               <TextInput style={[sheet.input, { height: 80, textAlignVertical: "top" }]} value={message} onChangeText={setMessage} placeholder="Anything the host should know?" placeholderTextColor="rgba(255,255,255,0.30)" multiline maxLength={300} />

//               <View style={[sheet.otpBanner, joinPolicy === "approval" && sheet.otpBannerApproval]}>
//                 <Ionicons name={joinPolicy === "approval" ? "hourglass-outline" : "shield-checkmark-outline"} size={15} color={joinPolicy === "approval" ? "#F59E0B" : "#4ADE80"} />
//                 <Text style={[sheet.otpBannerText, joinPolicy === "approval" && { color: "rgba(245,158,11,0.8)" }]}>
//                   {joinPolicy === "approval" ? "Host will review your request. Once admitted, you'll receive a check-in OTP." : "You'll get a 4-digit check-in OTP after joining. Show it to the host on arrival."}
//                 </Text>
//               </View>

//               <Pressable onPress={submitJoin} disabled={loading} style={({ pressed }) => [sheet.submitBtn, loading && sheet.submitDisabled, pressed && !loading && sheet.submitPressed]}>
//                 {loading ? <ActivityIndicator color="#fff" /> : <Text style={sheet.submitText}>{joinPolicy === "approval" ? "Send Request" : "Confirm & Join"}</Text>}
//               </Pressable>
//               <Pressable onPress={() => setShowForm(false)} style={sheet.cancelBtn}><Text style={sheet.cancelText}>Cancel</Text></Pressable>
//               <View style={{ height: 32 }} />
//             </ScrollView>
//           </View>
//         </Pressable>
//       </Modal>

//       {/* ── Razorpay WebView Sheet ── */}
//       {razorpayOrderData && (
//         <RazorpaySheet
//           visible={razorpayVisible}
//           orderData={razorpayOrderData}
//           userInfo={{
//             name:  name.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" "),
//             email: user?.primaryEmailAddress?.emailAddress || "",
//             phone: phone.trim(),
//           }}
//           onSuccess={handlePaymentSuccess}
//           onDismiss={() => {
//             setRazorpayVisible(false);
//             setRazorpayOrderData(null);
//           }}
//           onFailed={(err) => {
//             setRazorpayVisible(false);
//             setRazorpayOrderData(null);
//             setFailureErrorMsg(err || "Payment could not be processed.");
//             setFailureModalVisible(true);
//           }}
//         />
//       )}

//       {/* ── Payment Success Modal ── */}
//       <PaymentSuccessModal
//         visible={successModalVisible}
//         onClose={() => setSuccessModalVisible(false)}
//         eventTitle={eventTitle}
//         amountPaise={priceCents ?? 0}
//         checkInOtp={successCheckInOtp}
//         paymentId={successPaymentId ?? undefined}
//       />

//       {/* ── Payment Failure Modal ── */}
//       <PaymentFailureModal
//         visible={failureModalVisible}
//         errorMsg={failureErrorMsg ?? undefined}
//         eventTitle={eventTitle}
//         onClose={() => setFailureModalVisible(false)}
//         onRetry={() => {
//           setFailureModalVisible(false);
//           // small delay so the modal closes smoothly before Razorpay reopens
//           setTimeout(() => startRazorpayFlow(), 350);
//         }}
//       />
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   cta: {
//     height: 56, borderRadius: 18,
//     backgroundColor: "rgba(10,132,255,0.92)",
//     alignItems: "center", justifyContent: "center",
//     flexDirection: "row", gap: 10,
//     overflow: "hidden", borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.12)",
//   },
//   ctaPaid:    { backgroundColor: "rgba(16,185,129,0.90)", borderColor: "rgba(16,185,129,0.30)" },
//   ctaPressed: { transform: [{ scale: 0.992 }], opacity: 0.96 },
//   ctaDisabled:{ opacity: 0.55 },
//   ctaPending: { backgroundColor: "rgba(245,158,11,0.92)", borderColor: "rgba(245,158,11,0.3)" },
//   ctaGlow: {
//     position: "absolute", width: 260, height: 260,
//     borderRadius: 260, right: -140, top: -160,
//     backgroundColor: "rgba(255,255,255,0.18)",
//   },
//   ctaText: { color: "#fff", fontWeight: "950" as any, fontSize: 15 },
// });

// const sheet = StyleSheet.create({
//   backdrop:   { flex: 1, backgroundColor: "rgba(2,6,23,0.72)", justifyContent: "flex-end" },
//   sheetWrap:  { backgroundColor: "#0F172A", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 20, maxHeight: "92%", borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
//   grabberWrap:{ alignItems: "center", paddingTop: 12, paddingBottom: 8 },
//   grabber:    { width: 48, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)" },
//   title:      { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 4 },
//   subtitle:   { color: "rgba(255,255,255,0.50)", fontSize: 13, fontWeight: "700", marginBottom: 16 },
//   label:      { color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: "900", marginBottom: 6, marginTop: 16 },
//   input:      { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: "#fff", fontSize: 14, fontWeight: "700" },
//   inputReadonly:     { justifyContent: "center", opacity: 0.6 },
//   inputReadonlyText: { color: "rgba(255,255,255,0.70)", fontSize: 14, fontWeight: "700" },
//   otpBanner:  { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "rgba(74,222,128,0.08)", borderWidth: 1, borderColor: "rgba(74,222,128,0.20)", borderRadius: 14, padding: 12, marginTop: 20 },
//   otpBannerApproval: { backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.20)" },
//   otpBannerText: { flex: 1, color: "rgba(255,255,255,0.70)", fontSize: 12, fontWeight: "700", lineHeight: 18 },
//   submitBtn:  { height: 54, borderRadius: 16, backgroundColor: "rgba(10,132,255,0.92)", alignItems: "center", justifyContent: "center", marginTop: 20 },
//   submitPressed: { opacity: 0.88 },
//   submitDisabled:{ opacity: 0.50 },
//   submitText: { color: "#fff", fontWeight: "900", fontSize: 15 },
//   cancelBtn:  { height: 46, alignItems: "center", justifyContent: "center", marginTop: 10 },
//   cancelText: { color: "rgba(255,255,255,0.45)", fontWeight: "800", fontSize: 14 },
// });
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
import PaymentSuccessModal from "../Payment/PaymentSuccessModal";
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
type PaymentMethod = "card" | "upi" | "wallet";

type Props = {
  eventId:     string;
  kind:        EventKind;
  priceCents?: number | null;
  eventTitle?: string;
  label?:      string;
    eventLocation?: string; // ✅ ADD THIS
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
  eventLocation = "-", // ✅ ADD THIS
  onJoined,
  disabled,
  joinPolicy = "open",
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

  const isPaid = kind === "paid" || kind === "event_paid";
  const pricePerSpot = priceCents ? priceCents / 100 : 0;
  const platformFeeFixed = 10; // ₹10 flat platform fee

  /* ── state ── */
  const [loading, setLoading]               = useState(false);
  const [joined,  setJoined]                = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [screen, setScreen]                 = useState<Screen>("booking");

  // Spots
  const [spots, setSpots] = useState(1);

  // Payment method
  const [payMethod, setPayMethod] = useState<PaymentMethod>("card");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv,    setCardCvv]    = useState("");

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

  // Totals
  const subtotal   = pricePerSpot * spots;
  const totalPaise = (subtotal + platformFeeFixed) * 100;

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
  const onPress = () => {
    if (disabled || loading || joined || pendingRequest) return;
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to continue.");
      router.push("/sign-in" as any);
      return;
    }
    setScreen("booking");
    setSpots(1);
    setCardNumber(""); setCardExpiry(""); setCardCvv("");
    setShowModal(true);
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
    if (!API_BASE || !userId) return;
    if (!priceCents || priceCents <= 0) {
      Alert.alert("Price Error", "Event price not set.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST", headers,
        body: JSON.stringify({ amount: totalPaise, eventId, clerkUserId: userId }),
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
      Alert.alert("Network Error", "Please check your connection.");
    } finally { setLoading(false); }
  };

  /* ── Razorpay success ── */
  const handlePaymentSuccess = async (payload: RazorpaySuccessPayload) => {
    setRazorpayVisible(false);
    setLoading(true);
    try {
      const verifyRes = await apiFetch(`${API_BASE}/api/payment/verify`, {
        method: "POST", headers,
        body: JSON.stringify({ ...payload, eventId, clerkUserId: userId, amount: totalPaise }),
      });
      const verifyJson = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok || !verifyJson?.verified) {
        Alert.alert("Verification Failed", "Payment could not be verified.");
        return;
      }
      const email    = user?.primaryEmailAddress?.emailAddress || "";
      const imageUrl = user?.imageUrl || "";
      const fullName = name.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(" ");
      const joinRes = await apiFetch(`${API_BASE}/api/events/join`, {
        method: "POST", headers,
        body: JSON.stringify({
          eventId, clerkUserId: userId, name: fullName, email,
          phone: phone.trim(), message: message.trim(), imageUrl,
          razorpayPaymentId: payload.razorpay_payment_id,
          razorpayOrderId:   payload.razorpay_order_id,
        }),
      });
      const joinJson = await joinRes.json().catch(() => null);
      if (!joinRes.ok) {
        Alert.alert("Join Failed", joinJson?.error || "Payment succeeded but join failed.");
        return;
      }
      setJoined(true);
      setConfirmOtp(joinJson?.checkInOtp || null);
      setConfirmPaymentId(payload.razorpay_payment_id);
      setScreen("confirmed");
      onJoined?.(joinJson);
    } catch {
      Alert.alert("Error", "Something went wrong. Contact support.");
    } finally { setLoading(false); }
  };

  /* ── format card number ── */
  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0,2)} / ${d.slice(2)}` : d;
  };

  /* ── button state ── */
  const buttonLabel =
    pendingRequest     ? "Waiting for Approval" :
    joined             ? "You're In ✓" :
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

                {/* Spots selector (paid only) */}
                {isPaid && (
                  <View style={M.section}>
                    <Text style={M.sectionTitle}>Number of spots</Text>
                    <View style={M.spotCard}>
                      <View style={M.spotRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={M.spotLabel}>Spot</Text>
                          <Text style={M.spotPrice}>₹{pricePerSpot.toFixed(0)}</Text>
                        </View>
                        <View style={M.spotCounter}>
                          <TouchableOpacity
                            onPress={() => setSpots(s => Math.max(1, s - 1))}
                            style={[M.counterBtn, spots <= 1 && { opacity: 0.35 }]}
                            disabled={spots <= 1}
                          >
                            <Ionicons name="remove" size={16} color={C.ink} />
                          </TouchableOpacity>
                          <Text style={M.counterVal}>{spots}</Text>
                          <TouchableOpacity
                            onPress={() => setSpots(s => s + 1)}
                            style={M.counterBtn}
                          >
                            <Ionicons name="add" size={16} color={C.ink} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={M.divider} />

                      <View style={M.summaryRow}>
                        <Text style={M.summaryLabel}>{spots} x Spot</Text>
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
                    disabled={loading}
                    style={[M.confirmBtn, loading && { opacity: 0.6 }]}
                    activeOpacity={0.88}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <>
                          <Text style={M.confirmBtnText}>Confirm Booking</Text>
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
                      <Text style={M.summaryLabel}>{spots} x Spot</Text>
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

                {/* Payment method */}
                <View style={M.section}>
                  <Text style={M.sectionTitle}>Payment Method</Text>
                  <View style={M.payMethodCard}>
                    {(["card", "upi", "wallet"] as PaymentMethod[]).map((method) => {
                      const iconName = method === "card" ? "card" : method === "upi" ? "phone-portrait" : "wallet";
                      const label    = method === "card" ? "Card" : method === "upi" ? "UPI" : "Wallet";
                      const isActive = payMethod === method;
                      return (
                        <TouchableOpacity
                          key={method}
                          onPress={() => setPayMethod(method)}
                          style={[M.payMethodRow, isActive && M.payMethodRowActive]}
                          activeOpacity={0.8}
                        >
                          <View style={[M.payMethodIcon, isActive && { backgroundColor: C.greenSoft, borderColor: C.greenBorder }]}>
                            <Ionicons name={iconName as any} size={18} color={isActive ? C.green : C.muted} />
                          </View>
                          <Text style={[M.payMethodLabel, isActive && { color: C.ink, fontWeight: "700" }]}>
                            {label}
                          </Text>
                          <View style={[M.radioOuter, isActive && M.radioOuterActive]}>
                            {isActive && <View style={M.radioDot} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Card fields */}
                {payMethod === "card" && (
                  <View style={M.section}>
                    <Text style={M.sectionTitle}>Card Number</Text>
                    <TextInput
                      style={M.input}
                      value={cardNumber}
                      onChangeText={v => setCardNumber(formatCard(v))}
                      placeholder="•••• •••• •••• ••••"
                      placeholderTextColor={C.hint}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={M.fieldLabel}>Expiry</Text>
                        <TextInput
                          style={M.input}
                          value={cardExpiry}
                          onChangeText={v => setCardExpiry(formatExpiry(v))}
                          placeholder="MM / YY"
                          placeholderTextColor={C.hint}
                          keyboardType="numeric"
                          maxLength={7}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={M.fieldLabel}>CVV</Text>
                        <TextInput
                          style={M.input}
                          value={cardCvv}
                          onChangeText={v => setCardCvv(v.replace(/\D/g,"").slice(0,4))}
                          placeholder="•••"
                          placeholderTextColor={C.hint}
                          keyboardType="numeric"
                          secureTextEntry
                          maxLength={4}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* UPI field */}
                {payMethod === "upi" && (
                  <View style={M.section}>
                    <Text style={M.fieldLabel}>UPI ID</Text>
                    <TextInput
                      style={M.input}
                      placeholder="yourname@upi"
                      placeholderTextColor={C.hint}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                )}

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
                          <Text style={M.confirmBtnText}>Pay →</Text>
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
                      <Text style={M.ticketCellLabel}>Tickets</Text>
                      <Text style={M.ticketCellVal}>{spots} x General</Text>
                    </View>
                    <View style={M.ticketCell}>
                      <Text style={M.ticketCellLabel}>Location</Text>
<Text style={M.ticketCellVal} numberOfLines={1}>
  {eventLocation || "-"}
</Text>                    </View>
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
          onFailed={(err) => {
            setRazorpayVisible(false); setRazorpayOrderData(null);
            setFailureErrorMsg(err || "Payment could not be processed.");
            setFailureModalVisible(true);
          }}
        />
      )}

      {/* ── Failure Modal ── */}
      <PaymentFailureModal
        visible={failureModalVisible}
        errorMsg={failureErrorMsg ?? undefined}
        eventTitle={eventTitle}
        onClose={() => setFailureModalVisible(false)}
        onRetry={() => { setFailureModalVisible(false); setTimeout(() => handlePay(), 350); }}
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
});