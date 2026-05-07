import React, { useState, useMemo, useEffect } from "react";
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  Image, Animated, ActivityIndicator, Pressable, Platform,
  Dimensions, TextInput, KeyboardAvoidingView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { apiFetch } from "../../lib/apiFetch";
import { styles, C } from "./ServiceDetailFlow.styles";
import RazorpaySheet, {
  type RazorpayOrderData,
  type RazorpaySuccessPayload,
} from "../Payment/RazorpaySheet";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Review {
  id: string;
  name: string;
  subtitle: string;
  rating: number;
  text: string;
  date: string;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    name: "Priya Singh",
    subtitle: "Mumbai",
    rating: 5,
    text: "Amazing experience! Rahul really knows the hidden gems of the city. We had the best chai and heard such cool stories. Highly recommend!",
    date: "2 days ago"
  },
  {
    id: "2",
    name: "Amit Kumar",
    subtitle: "Delhi",
    rating: 5,
    text: "Very professional and friendly. Made my business trip feel like a mini vacation. 10/10!",
    date: "1 week ago"
  }
];

interface ServiceDetailFlowProps {
  visible: boolean;
  service: any; // The service object from the pin
  creator: any; // The user object of the host
  onClose: () => void;
  onBookingConfirmed?: () => void;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function fromCents(c: any) {
  const n = Number(c);
  return !isNaN(n) && n > 0 ? `₹${(n / 100).toLocaleString("en-IN")}` : "";
}

function getDayName(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatTime(time24: string) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

function Calendar({ 
  schedule, 
  blockedDates, 
  selectedDate, 
  onSelect 
}: { 
  schedule: any[], 
  blockedDates: string[], 
  selectedDate: string | null,
  onSelect: (dateStr: string) => void 
}) {
  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const monthName = viewDate.toLocaleString("default", { month: "long" });
  const year = viewDate.getFullYear();

  const daysInMonth = new Date(year, viewDate.getMonth() + 1, 0).getDate();
  const firstDayRaw = new Date(year, viewDate.getMonth(), 1).getDay(); // 0 is Sun
  const startOffset = (firstDayRaw === 0 ? 6 : firstDayRaw - 1); // M=0...S=6

  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isAvailable = (d: number) => {
    const date = new Date(year, viewDate.getMonth(), d);
    const dateStr = date.toISOString().split("T")[0];
    
    // Past dates check
    const todayStr = now.toISOString().split("T")[0];
    if (dateStr < todayStr) return false;

    // Blocked dates check
    if (blockedDates.includes(dateStr)) return false;

    // Schedule check
    const dayName = getDayName(date);
    const dayConfig = schedule.find(s => s.day === dayName);
    return !!dayConfig?.active;
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, viewDate.getMonth() - 1, 1))}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName} {year}</Text>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, viewDate.getMonth() + 1, 1))}>
          <Ionicons name="chevron-forward" size={20} color={C.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysRow}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <Text key={i} style={styles.weekDayLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((d, i) => {
          if (d === null) return <View key={`empty-${i}`} style={styles.dayCell} />;
          const active = isAvailable(d);
          const date = new Date(year, viewDate.getMonth(), d);
          const dateStr = date.toISOString().split("T")[0];
          const isSelected = selectedDate === dateStr;

          return (
            <TouchableOpacity
              key={d}
              disabled={!active}
              onPress={() => onSelect(dateStr)}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                !active && styles.dayCellDisabled
              ]}
            >
              <Text style={[
                styles.dayCellText, 
                isSelected && styles.dayCellTextSelected,
                active && !isSelected && styles.dayCellTextActive
              ]}>{d}</Text>
              {active && !isSelected && <View style={styles.availableDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export default function ServiceDetailFlow({ visible, service, creator, onClose, onBookingConfirmed }: ServiceDetailFlowProps) {
  const { userId } = useAuth();
  const { user } = useUser();
  const [step, setStep] = useState(0); // 0=Detail, 1=Date, 2=Time, 3=Confirm, 4=Success
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(2); // Default 2 hours
  const [startTime, setStartTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking & Payment State
  const [razorpayVisible, setRazorpayVisible] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<RazorpayOrderData | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [confirmOtp, setConfirmOtp] = useState<string | null>(null);

  // Contact Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const metadata = service?.serviceMetadata || {};
  const schedule = metadata.schedule || [];
  const blockedDates = metadata.blockedDates || [];
  const minDurStr = metadata.minDuration || "1 hr";
  const minDur = parseInt(minDurStr) || 1;

  // Animation
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const sheetTranslateY = React.useRef(new Animated.Value(H)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      setSelectedDate(null);
      setStartTime(null);
      setDuration(Math.max(2, minDur));
      
      // Pre-fill user info
      if (user) {
        const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
        setName(full || "");
      }

      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, user]);

  const closeFlow = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: H, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => step === 0 ? closeFlow() : setStep(s => s - 1);

  const priceCents = Number(service?.priceCents || 0);
  const totalPrice = (priceCents * duration) / 100;
  const platformFee = 100; // Mock fee
  const finalTotal = totalPrice + platformFee;

  const dayOfWeek = selectedDate ? getDayName(new Date(selectedDate)) : "";
  const dayConfig = schedule.find(s => s.day === dayOfWeek);

  // Time Slot Logic
  const timeSlots = useMemo(() => {
    if (!dayConfig || !dayConfig.active) return [];
    const slots = [];
    const [startH] = dayConfig.start.split(":").map(Number);
    const [endH] = dayConfig.end.split(":").map(Number);
    
    // Latest start time is endH - duration
    const latestStart = endH - duration;
    
    for (let h = startH; h <= latestStart; h++) {
      slots.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return slots;
  }, [dayConfig, duration]);

  const handlePay = async () => {
    const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
    const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
    const creatorClerkId = creator?.clerkUserId || creator?.id || "";

    if (!API_BASE || !userId || !creatorClerkId) {
      Alert.alert("Configuration Error", "Could not identify host or API base.");
      return;
    }

    setIsSubmitting(true);
    try {
      const totalInPaise = finalTotal * 100;

      // 1. Create booking + Razorpay order
      const res = await apiFetch(`${API_BASE}/api/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY && { "x-api-key": EVENT_API_KEY }),
        },
        body: JSON.stringify({
          bookerId: userId,
          hostId: creatorClerkId,
          eventId: String(service?._id?.$oid || service?._id?.oid || service?._id || service?.id || ""),
          type: "service",
          startDate: selectedDate,
          endDate: selectedDate, // services are 1-day events usually
          startTime: startTime,
          duration: duration,
          pricePerDay: totalInPaise,
          bookerName: name.trim(),
          bookerEmail: user?.primaryEmailAddress?.emailAddress || "",
          bookerPhone: phone,
          bookerImageUrl: user?.imageUrl || "",
          notes: `Booking for ${duration} hours at ${formatTime(startTime || "")}`,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.payment?.orderId) {
        Alert.alert("Booking Failed", json?.error || "Could not initiate payment.");
        return;
      }

      setActiveBookingId(json.bookingId);
      setRazorpayOrderData({
        orderId: json.payment.orderId,
        amount: json.payment.amount,
        currency: json.payment.currency,
        keyId: json.payment.keyId,
        eventTitle: service.title || "Service Booking",
        description: `Booking with ${creator?.profile?.firstName || "Host"}`,
      });
      setRazorpayVisible(true);
    } catch (err) {
      Alert.alert("Network Error", "Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (payload: RazorpaySuccessPayload) => {
    const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
    const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

    setRazorpayVisible(false);
    setIsSubmitting(true);
    try {
      // 2. Verify payment
      const verifyRes = await apiFetch(`${API_BASE}/api/bookings/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY && { "x-api-key": EVENT_API_KEY }),
        },
        body: JSON.stringify({
          ...payload,
          bookingId: activeBookingId,
        }),
      });

      const verifyJson = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok || !verifyJson?.ok) {
        Alert.alert("Verification Failed", "Payment could not be verified. Contact support.");
        return;
      }

      setConfirmOtp(verifyJson.checkInOtp || null);
      setStep(4); // SUCCESS
      onBookingConfirmed?.();
    } catch (err) {
      Alert.alert("Error", "Something went wrong during verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={C.text} />
        <Text style={styles.backText}>{step === 0 ? "Back" : "Previous"}</Text>
      </TouchableOpacity>
      {step > 0 && step < 4 && (
        <Text style={styles.stepIndicator}>Step {step} of 3</Text>
      )}
      <TouchableOpacity onPress={closeFlow} style={styles.closeBtn}>
        <Ionicons name="close" size={24} color={C.muted} />
      </TouchableOpacity>
    </View>
  );

  const renderDetail = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Profile Photo */}
      <View style={styles.photoContainer}>
        {creator?.profile?.photos?.[0] ? (
          <Image source={{ uri: creator.profile.photos[0] }} style={styles.heroPhoto} />
        ) : (
          <View style={[styles.heroPhoto, styles.photoPlaceholder]}>
            <Ionicons name="person" size={80} color="#DDD" />
          </View>
        )}
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={C.white} />
          <Text style={styles.verifiedText}>ID VERIFIED</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Name & Title */}
        <Text style={styles.profileName}>{creator?.profile?.firstName || "Rahul"}, 24</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={C.muted} />
          <Text style={styles.locationText}>{service?.location?.city || "Bhopal"}, India</Text>
        </View>

        {/* Trust Signals */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Text style={styles.trustVal}>⭐ 4.8</Text>
            <Text style={styles.trustLabel}>Rating</Text>
          </View>
          <View style={styles.trustSep} />
          <View style={styles.trustItem}>
            <Text style={styles.trustVal}>12</Text>
            <Text style={styles.trustLabel}>Meets</Text>
          </View>
          <View style={styles.trustSep} />
          <View style={styles.trustItem}>
            <Text style={styles.trustVal}>⚡ Fast</Text>
            <Text style={styles.trustLabel}>Reply</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Headline */}
        <Text style={styles.headline}>"{service?.title}"</Text>
        
        {/* Tags */}
        <View style={styles.tagsRow}>
          {(service?.tags || []).map((t: string) => (
            <View key={t} style={styles.tagChip}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>{service?.description || "I love meeting new people and sharing stories..."}</Text>
        <TouchableOpacity><Text style={styles.readMore}>Read more ↓</Text></TouchableOpacity>

        <View style={styles.divider} />

        {/* Availability */}
        <Text style={styles.sectionTitle}>Availability</Text>
        <View style={styles.daysRow}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => {
            const active = schedule.find((s: any) => s.day === d)?.active;
            return (
              <View key={d} style={styles.dayCol}>
                <Text style={styles.dayNameLabel}>{d}</Text>
                {active ? (
                  <Ionicons name="checkmark-circle" size={18} color={C.purple} />
                ) : (
                  <Ionicons name="close-circle-outline" size={18} color="#EEE" />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Reviews */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Reviews · 12</Text>
          <TouchableOpacity><Text style={styles.viewAll}>See all →</Text></TouchableOpacity>
        </View>
        {MOCK_REVIEWS.map(r => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <View>
                <Text style={styles.reviewName}>{r.name}, {r.subtitle}</Text>
                <Text style={styles.reviewStars}>{"⭐".repeat(r.rating)}</Text>
              </View>
              <Text style={styles.reviewDate}>{r.date}</Text>
            </View>
            <Text style={styles.reviewText}>{r.text}</Text>
          </View>
        ))}

        <View style={styles.divider} />
        <TouchableOpacity style={styles.reportRow}>
          <Ionicons name="warning-outline" size={16} color={C.muted} />
          <Text style={styles.reportText}>Report this profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDatePicker = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pick a Date</Text>
      <Text style={styles.stepSub}>Only available days shown based on host's schedule</Text>
      
      <Calendar 
        schedule={schedule} 
        blockedDates={blockedDates} 
        onSelect={setSelectedDate}
        selectedDate={selectedDate}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: C.purple }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#DDD" }]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>
    </View>
  );

  const renderTimeDuration = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>How long?</Text>
      
      {/* Duration */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>DURATION (Min {minDurStr})</Text>
        <View style={styles.durationRow}>
          {[2, 3, 4, 6, 8].map(h => (
            <TouchableOpacity 
              key={h} 
              onPress={() => setDuration(h)}
              style={[styles.durChip, duration === h && styles.durChipSelected]}
            >
              <Text style={[styles.durText, duration === h && styles.durTextSelected]}>{h} hr</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>START TIME (Available {dayConfig?.start} – {dayConfig?.end})</Text>
        {timeSlots.length > 0 ? (
          <View style={styles.timeGrid}>
            {timeSlots.map(t => (
              <TouchableOpacity 
                key={t} 
                onPress={() => setStartTime(t)}
                style={[styles.timeChip, startTime === t && styles.timeChipSelected]}
              >
                <Text style={[styles.timeText, startTime === t && styles.timeTextSelected]}>
                  {formatTime(t)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.errorBanner}>
            Host unavailable for {duration} hours on this day.
          </Text>
        )}
      </View>

      <View style={styles.pricePanel}>
        <Text style={styles.priceLabel}>Price Breakdown</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceKey}>{duration} hrs × {fromCents(priceCents)}</Text>
          <Text style={styles.priceVal}>₹{totalPrice}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceKey}>Platform fee</Text>
          <Text style={styles.priceVal}>₹{platformFee}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalKey}>Total</Text>
          <Text style={styles.totalVal}>₹{finalTotal}</Text>
        </View>
      </View>
    </View>
  );

  const renderConfirm = () => (
    <ScrollView 
      style={styles.stepContent} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 160 }} // Extra space for footer
    >
      <Text style={styles.stepTitle}>Confirm Booking</Text>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryProfile}>
           {creator?.profile?.photos?.[0] ? (
            <Image source={{ uri: creator.profile.photos[0] }} style={styles.summaryAvatar} />
          ) : (
            <View style={styles.summaryAvatar} />
          )}
          <View>
            <Text style={styles.summaryName}>{creator?.profile?.firstName || "Rahul"}</Text>
            <Text style={styles.summaryLoc}>📍 {service?.location?.city || "Bhopal"}</Text>
          </View>
        </View>
        <View style={styles.summaryDetails}>
          <View style={styles.summaryItem}>
            <Ionicons name="calendar-outline" size={16} color={C.muted} />
            <Text style={styles.summaryText}>
              {new Date(selectedDate!).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="time-outline" size={16} color={C.muted} />
            <Text style={styles.summaryText}>{formatTime(startTime!)} ({duration} hours)</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="location-outline" size={16} color={C.muted} />
            <Text style={styles.summaryText}>Meeting Style: {metadata.meetupStyle || "My Area"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.paymentBox}>
        <Text style={styles.payLabel}>CONFIRM YOUR DETAILS</Text>
        <TextInput
          style={styles.contactInput}
          value={name}
          onChangeText={setName}
          placeholder="Your Name"
          placeholderTextColor="#999"
        />
        <TextInput
          style={[styles.contactInput, { marginTop: 10 }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone Number (WhatsApp preferred)"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />
        
        <Text style={[styles.payLabel, { marginTop: 24 }]}>PAY WITH</Text>
        <View style={styles.razorpayCard}>
          <Ionicons name="card" size={24} color={C.purple} />
          <View>
            <Text style={styles.rzpTitle}>UPI / Cards / Wallet</Text>
            <Text style={styles.rzpSub}>Powered by Razorpay</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" style={{ marginLeft: "auto" }} />
        </View>
      </View>

      <View style={styles.escrowNotice}>
        <Ionicons name="lock-closed" size={20} color={C.purple} />
        <Text style={styles.escrowText}>
          <Text style={{ fontWeight: "700" }}>🔒 Safe & Secure payment</Text>{"\n"}
          Money released to host only after meetup is confirmed by you.
        </Text>
      </View>
    </ScrollView>
  );

  const renderSuccess = () => (
    <View style={styles.successView}>
      <View style={styles.confetti}>
        <Text style={{ fontSize: 60 }}>🎉</Text>
      </View>
      <Text style={styles.successTitle}>Booking Confirmed!</Text>
      <Text style={styles.successSub}>
        {creator?.profile?.firstName || "Rahul"} has been notified. You'll get a confirmation once they accept.
      </Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Ionicons name="calendar" size={18} color={C.purple} />
          <Text style={styles.summaryText}>
            {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Today"}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="time" size={18} color={C.purple} />
          <Text style={styles.summaryText}>{formatTime(startTime || "")} ({duration} hours)</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="location" size={18} color={C.purple} />
          <Text style={styles.summaryText}>{service?.location?.city || "Bhopal"}</Text>
        </View>
        {confirmOtp && (
          <View style={[styles.summaryItem, { marginTop: 12, padding: 12, backgroundColor: C.purpleBg, borderRadius: 12 }]}>
            <Text style={{ fontWeight: "800", color: C.purple }}>OTP: {confirmOtp}</Text>
          </View>
        )}
      </View>

      <View style={styles.nextSteps}>
        <Text style={styles.nextTitle}>WHAT HAPPENS NEXT</Text>
        {[
          "1. Host accepts booking",
          "2. You get OTP for meetup",
          "3. Share OTP at meetup",
          "4. Money released to host"
        ].map(t => <Text key={t} style={styles.nextItem}>{t}</Text>)}
      </View>

      <View style={styles.successActions}>
        <TouchableOpacity style={styles.primaryAction} onPress={closeFlow}>
          <Text style={styles.primaryActionText}>View Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Message {creator?.profile?.firstName || "Rahul"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (step === 4) return null;
    const isDisabled = (step === 1 && !selectedDate) || (step === 2 && !startTime);
    
    return (
      <View style={styles.footer}>
        {step === 0 ? (
          <View style={styles.footerInner}>
            <View>
              <Text style={styles.footerPrice}>{fromCents(priceCents)}/hr</Text>
              <Text style={styles.footerPriceSub}>platform fee inclusive</Text>
            </View>
            <TouchableOpacity style={styles.bookBtn} onPress={handleNext}>
              <Text style={styles.bookBtnText}>Book Now →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            disabled={isDisabled || isSubmitting}
            style={[styles.nextActionBtn, isDisabled && styles.nextBtnDisabled]} 
            onPress={step === 3 ? handlePay : handleNext}
          >
            {isSubmitting ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.nextActionText}>
                {step === 3 ? `Pay ₹${finalTotal.toLocaleString("en-IN")} →` : "Continue →"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleBack}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {renderHeader()}
          {step === 0 && renderDetail()}
          {step === 1 && renderDatePicker()}
          {step === 2 && renderTimeDuration()}
          {step === 3 && renderConfirm()}
          {step === 4 && renderSuccess()}
          {renderFooter()}
        </KeyboardAvoidingView>
      </Animated.View>

      {/* RAZORPAY INTEGRATION */}
      {razorpayOrderData && (
        <RazorpaySheet
          visible={razorpayVisible}
          orderData={razorpayOrderData}
          userInfo={{
            name: name,
            email: user?.primaryEmailAddress?.emailAddress || "",
            phone: phone,
          }}
          onSuccess={handlePaymentSuccess}
          onDismiss={() => {
            setRazorpayVisible(false);
            setRazorpayOrderData(null);
          }}
          onFailed={(err) => {
            setRazorpayVisible(false);
            setRazorpayOrderData(null);
            Alert.alert("Payment Failed", err);
          }}
        />
      )}
    </Modal>
  );
}

const H = Dimensions.get("window").height;
