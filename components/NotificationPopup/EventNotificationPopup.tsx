
// components/NotificationPopup/EventNotificationPopup.tsx
import React, { useEffect, useRef } from "react";
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { AppNotification } from "../../lib/useNotifications";

const { width } = Dimensions.get("window");

type Props = {
  notification: AppNotification | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
};

export default function EventNotificationPopup({ notification, onClose, onMarkRead }: Props) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (notification) {
      scale.setValue(0.85);
      opacity.setValue(0);
      translateY.setValue(40);

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
      ]).start();
    }
  }, [notification]);

  if (!notification) return null;

  const isApproved =
    notification.type === "event_approved" ||
    notification.type === "service_approved";

  const isService =
    notification.type === "service_approved" ||
    notification.type === "service_rejected";

  const handleClose = () => {
    onMarkRead(notification._id);
    onClose();
  };

  // Colors
  const approvedColor = "#10B981";
  const rejectedColor = "#EF4444";
  const accentColor = isApproved ? approvedColor : rejectedColor;

  const approvedBg = "#ECFDF5";
  const rejectedBg = "#FEF2F2";
  const iconBg = isApproved ? approvedBg : rejectedBg;

  return (
    <Modal visible={!!notification} transparent animationType="none" statusBarTranslucent>
      <View style={s.overlay}>
        <Animated.View
          style={[
            s.card,
            {
              transform: [{ scale }, { translateY }],
              opacity,
              borderTopColor: accentColor,
            },
          ]}
        >
          {/* Top accent bar */}
          <View style={[s.accentBar, { backgroundColor: accentColor }]} />

          {/* Icon circle */}
          <View style={[s.iconCircleOuter, { backgroundColor: iconBg }]}>
            <View style={[s.iconCircleInner, { backgroundColor: accentColor + "22" }]}>
              <Ionicons
                name={isApproved ? "checkmark-circle" : "close-circle"}
                size={52}
                color={accentColor}
              />
            </View>
          </View>

          {/* Type badge */}
          <View style={[s.typeBadge, { backgroundColor: accentColor + "15", borderColor: accentColor + "30" }]}>
            <Text style={[s.typeBadgeText, { color: accentColor }]}>
              {isService ? "🛠  Service" : "📅  Event"}
            </Text>
          </View>

          {/* Status label */}
          <Text style={[s.statusLabel, { color: accentColor }]}>
            {isApproved ? "APPROVED" : "NOT APPROVED"}
          </Text>

          {/* Title */}
          <Text style={s.title}>
            {isApproved
              ? (isService ? "Your service is live! 🎉" : "Your event is live! 🎉")
              : (isService ? "Service not approved" : "Event not approved")}
          </Text>

          {/* Event/Service name pill */}
          <View style={s.namePill}>
            <Text style={s.namePillText} numberOfLines={2}>
              "{notification.eventTitle}"
            </Text>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Message */}
          <Text style={s.message}>
            {isApproved
              ? (isService
                  ? "People can now find and book your service on MyApp."
                  : "People can now find and join your event on MyApp.")
              : (isService
                  ? "Your service did not meet our guidelines."
                  : "Your event did not meet our guidelines.")}
          </Text>

          {/* Rejection reason box */}
          {!isApproved && notification.moderatorNote ? (
            <View style={s.reasonBox}>
              <View style={s.reasonHeader}>
                <Ionicons name="information-circle" size={14} color="#EF4444" />
                <Text style={s.reasonLabel}>Reason </Text>
              </View>
              <Text style={s.reasonText}>{notification.moderatorNote}</Text>
            </View>
          ) : null}

          {/* Buttons */}
          <View style={s.btnRow}>
            {!isApproved && (
              <TouchableOpacity style={s.secondaryBtn} onPress={handleClose}>
                <Text style={s.secondaryBtnText}>Dismiss</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                s.primaryBtn,
                { backgroundColor: accentColor },
                isApproved && { flex: 1 },
              ]}
              onPress={handleClose}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isApproved ? "arrow-forward-circle" : "checkmark"}
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={s.primaryBtnText}>
                {isApproved ? (isService ? "View Service" : "View Event") : "Got it"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 28,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
  },
  accentBar: {
    width: "100%",
    height: 5,
    marginBottom: 28,
  },
  iconCircleOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 8,
    opacity: 0.7,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 14,
    lineHeight: 28,
  },
  namePill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  namePillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 20,
  },
  divider: {
    width: "85%",
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 28,
    marginBottom: 20,
  },
  reasonBox: {
    width: "88%",
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: 0.3,
  },
  reasonText: {
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 19,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    width: "100%",
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryBtnText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "700",
  },
});