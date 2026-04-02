// components/Payment/PaymentSuccessModal.tsx
// Payment success ke baad dikhta hai — OTP bhi show karta hai

import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  visible:     boolean;
  onClose:     () => void;
  eventTitle:  string;
  amountPaise: number;
  checkInOtp?: string | null;
  paymentId?:  string;
};

export default function PaymentSuccessModal({
  visible,
  onClose,
  eventTitle,
  amountPaise,
  checkInOtp,
  paymentId,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 14,
          mass: 0.8,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const amountRupees = (amountPaise / 100).toFixed(0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconWrap}>
            <View style={styles.iconRing}>
              <Ionicons name="checkmark" size={36} color="#4ADE80" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Payment Successful! 🎉</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {eventTitle}
          </Text>

          {/* Amount */}
          <View style={styles.amountRow}>
            <View style={styles.amountPill}>
              <Ionicons name="wallet" size={14} color="#4ADE80" />
              <Text style={styles.amountText}>₹{amountRupees} paid</Text>
            </View>
          </View>

          {/* OTP Section */}
          {checkInOtp ? (
            <View style={styles.otpSection}>
              <View style={styles.otpHeader}>
                <Ionicons name="shield-checkmark" size={16} color="#0A84FF" />
                <Text style={styles.otpHeaderText}>Your Check-in OTP</Text>
              </View>
              <View style={styles.otpDigits}>
                {checkInOtp.slice(0, 4).split("").map((digit, i) => (
                  <View key={i} style={styles.digitBox}>
                    <Text style={styles.digitText}>{digit}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.otpHint}>
                Show this 4-digit code to the host when you meet physically.
              </Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={14} color="#F59E0B" />
              <Text style={styles.pendingText}>
                OTP will be generated after host confirmation
              </Text>
            </View>
          )}

          {/* Payment ID (small) */}
          {paymentId && (
            <Text style={styles.paymentId}>
              Ref: {paymentId.slice(-12)}
            </Text>
          )}

          {/* CTA */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.doneBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Awesome, Let's Go!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0F172A",
    borderRadius: 32,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
  },

  iconWrap: {
    marginBottom: 20,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(74,222,128,0.10)",
    borderWidth: 2,
    borderColor: "rgba(74,222,128,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },

  amountRow: {
    marginBottom: 20,
  },
  amountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74,222,128,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.20)",
  },
  amountText: {
    color: "#4ADE80",
    fontSize: 15,
    fontWeight: "900",
  },

  otpSection: {
    width: "100%",
    backgroundColor: "rgba(10,132,255,0.06)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(10,132,255,0.15)",
    alignItems: "center",
    marginBottom: 16,
  },
  otpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  otpHeaderText: {
    color: "#0A84FF",
    fontSize: 13,
    fontWeight: "900",
  },
  otpDigits: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  digitBox: {
    width: Math.min(58, (SCREEN_WIDTH - 160) / 4),
    aspectRatio: 0.75,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  digitText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },
  otpHint: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.20)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  pendingText: {
    color: "rgba(245,158,11,0.85)",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },

  paymentId: {
    color: "rgba(255,255,255,0.20)",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: 0.5,
  },

  doneBtn: {
    width: "100%",
    height: 54,
    borderRadius: 18,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A84FF",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});