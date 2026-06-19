// components/Payment/PaymentFailureModal.tsx
import React, { useEffect, useRef } from "react";
import {
  Modal, View, Text, StyleSheet,
  TouchableOpacity, Animated, Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width: W } = Dimensions.get("window");

type Props = {
  visible:    boolean;
  onClose:    () => void;
  onRetry:    () => void;
  errorMsg?:  string;
  eventTitle?: string;
  details?:   string;
};

export default function PaymentFailureModal({
  visible, onClose, onRetry, errorMsg, eventTitle, details,
}: Props) {
  const scale   = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Detect if this is a test mode step-unknown error
  const isTestModeError = details?.includes("STEP_UNKNOWN") || details?.includes("unknown");

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, damping: 14, mass: 0.8, stiffness: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.75);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Animated.View style={[s.card, { transform: [{ scale }], opacity }]}>

          {/* Icon */}
          <View style={s.iconWrap}>
            <View style={s.iconRing}>
              <Ionicons name="close" size={38} color="#F87171" />
            </View>
          </View>

          {/* Title */}
          <Text style={s.title}>Payment Failed 😞</Text>
          {!!eventTitle && (
            <Text style={s.subtitle} numberOfLines={2}>{eventTitle}</Text>
          )}

          {/* Error detail */}
          <View style={s.errorBox}>
            <Ionicons name="warning-outline" size={15} color="#F59E0B" />
            <Text style={s.errorText}>
              {errorMsg || "Payment could not be processed. Please try again."}
            </Text>
          </View>

          {/* Test mode hint — shown when it's a test card error */}
          {!!isTestModeError && (
            <View style={s.testBox}>
              <Text style={s.testTitle}>🧪 Test Mode — Inhe Use Karo:</Text>
              <View style={s.testRow}>
                <Text style={s.testLabel}>Easy UPI</Text>
                <Text style={s.testVal}>success@razorpay</Text>
              </View>
              <View style={[s.testRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(14,165,233,0.15)" }]}>
                <Text style={[s.testLabel, { color: "rgba(255,255,255,0.35)" }]}>— ya card —</Text>
              </View>
              <View style={s.testRow}>
                <Text style={s.testLabel}>Card</Text>
                <Text style={s.testVal}>4111 1111 1111 1111</Text>
              </View>
              <View style={s.testRow}>
                <Text style={s.testLabel}>Expiry</Text>
                <Text style={s.testVal}>12/28 (ya koi future)</Text>
              </View>
              <View style={s.testRow}>
                <Text style={s.testLabel}>CVV</Text>
                <Text style={s.testVal}>123</Text>
              </View>
              <View style={s.testRow}>
                <Text style={s.testLabel}>OTP</Text>
                <Text style={s.testVal}>1234</Text>
              </View>
            </View>
          )}

          {/* Tips */}
          {!isTestModeError && (
            <View style={s.tipsList}>
              {[
                "Check your UPI / card details",
                "Ensure sufficient balance",
                "Try a different payment method",
              ].map((tip) => (
                <View key={tip} style={s.tipRow}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="rgba(255,255,255,0.35)" />
                  <Text style={s.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTAs */}
          <TouchableOpacity onPress={onRetry} style={s.retryBtn} activeOpacity={0.85}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={s.cancelBtn} activeOpacity={0.75}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.90)",
    alignItems: "center", justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%", maxWidth: 380,
    backgroundColor: "#0F172A",
    borderRadius: 32, padding: 28,
    alignItems: "center",
    borderWidth: 1, borderColor: "rgba(248,113,113,0.15)",
    shadowColor: "#F87171", shadowOpacity: 0.15, shadowRadius: 30, shadowOffset: { width: 0, height: 20 },
  },
  iconWrap:  { marginBottom: 20 },
  iconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(248,113,113,0.10)",
    borderWidth: 2, borderColor: "rgba(248,113,113,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  title: {
    color: "#fff", fontSize: 22, fontWeight: "900",
    textAlign: "center", marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.50)", fontSize: 14,
    fontWeight: "700", textAlign: "center", marginBottom: 16,
  },
  errorBox: {
    width: "100%", flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1, borderColor: "rgba(245,158,11,0.20)",
    borderRadius: 14, padding: 12, marginBottom: 20,
  },
  errorText: {
    flex: 1, color: "rgba(245,158,11,0.90)",
    fontSize: 13, fontWeight: "700", lineHeight: 18,
  },
  tipsList: { width: "100%", gap: 8, marginBottom: 24 },
  tipRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  tipText:  { color: "rgba(255,255,255,0.40)", fontSize: 12, fontWeight: "600" },

  retryBtn: {
    width: "100%", height: 54, borderRadius: 18,
    backgroundColor: "#EF4444",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#EF4444", shadowOpacity: 0.30, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  retryText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  cancelBtn: {
    marginTop: 12, height: 44,
    alignItems: "center", justifyContent: "center", width: "100%",
  },
  cancelText: { color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "800" },

  // Test mode section
  testBox: {
    width: "100%",
    backgroundColor: "rgba(14,165,233,0.08)",
    borderWidth: 1, borderColor: "rgba(14,165,233,0.25)",
    borderRadius: 14, padding: 14, marginBottom: 20, gap: 6,
  },
  testTitle: {
    color: "#38BDF8", fontSize: 12, fontWeight: "800",
    marginBottom: 6,
  },
  testRow: {
    flexDirection: "row", justifyContent: "space-between", gap: 8,
  },
  testLabel: {
    color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", minWidth: 50,
  },
  testVal: {
    color: "#fff", fontSize: 11, fontWeight: "800", flex: 1, textAlign: "right",
  },
  testNote: {
    color: "rgba(56,189,248,0.70)", fontSize: 11, fontWeight: "700",
    marginTop: 4, textAlign: "center",
  },
});

