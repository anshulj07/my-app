import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
  otp: string | null;
  eventTitle: string;
  checkedIn?: boolean;
};

export default function OtpModal({ visible, onClose, otp, eventTitle, checkedIn }: Props) {
  const isOtpAvailable = !!otp && !checkedIn;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconWrap, checkedIn && styles.iconWrapSuccess]}>
              <Ionicons 
                name={checkedIn ? "checkmark-circle" : "shield-checkmark"} 
                size={24} 
                color={checkedIn ? "#4ADE80" : "#0A84FF"} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {checkedIn ? "Meetup Started! 🎉" : "Check-in OTP"}
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>{eventTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeCircle}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View style={styles.contentContainer}>
            {checkedIn ? (
              <View style={styles.successState}>
                <View style={styles.successBadge}>
                  <Text style={styles.successText}>✅ You're checked in!</Text>
                </View>
                <Text style={styles.successSub}>Meetup has started. Enjoy your trip!</Text>
              </View>
            ) : isOtpAvailable ? (
              <View style={styles.digitRow}>
                {otp.slice(0, 4).split("").map((digit, i) => (
                  <View key={i} style={styles.digitBox}>
                    <View style={styles.digitGlow} />
                    <Text style={styles.digitText}>{digit}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={32} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyText}>
                  {otp ? "Check-in code unavailable." : "OTP not generated yet.\nPlease contact host."}
                </Text>
              </View>
            )}
          </View>

          {!checkedIn && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.4)" />
              <Text style={styles.instruction}>
                Show this 4-digit code to the host when you meet physically to start the meetup.
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0F172A",
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 30,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(10,132,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(10,132,255,0.2)",
  },
  iconWrapSuccess: {
    backgroundColor: "rgba(74,222,128,0.1)",
    borderColor: "rgba(74,222,128,0.2)",
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600", marginTop: 2 },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  digitRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  digitBox: {
    width: Math.min(60, (SCREEN_WIDTH - 120) / 4), // Responsive width
    aspectRatio: 0.75,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  digitGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  digitText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
  },
  successState: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successBadge: {
    backgroundColor: "rgba(74,222,128,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  successText: {
    color: "#4ADE80",
    fontSize: 16,
    fontWeight: "800",
  },
  successSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 10 },
  emptyText: { color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: "600", textAlign: "center" },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    marginBottom: 24,
  },
  instruction: {
    flex: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  doneBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A84FF",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  doneBtnText: { color: "#FFF", fontWeight: "900", fontSize: 16 },
});
