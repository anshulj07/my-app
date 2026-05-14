import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, Modal, 
  ActivityIndicator, StyleSheet, Platform 
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { apiFetch } from "../../lib/apiFetch";
import { useAuth } from "@clerk/clerk-expo";

const C = {
  purple:      "#6366F1",
  purpleBg:    "#EEF2FF",
  ink:         "#0F172A",
  muted:       "#64748B",
  white:       "#FFFFFF",
  red:         "#EF4444",
  green:       "#10B981",
  border:      "#E2E8F0",
};

interface Props {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle?: string;
  onSuccess?: () => void;
}

export default function OtpVerifyModal({ visible, onClose, eventId, eventTitle, onSuccess }: Props) {
  const { userId } = useAuth();
  const [otpValue, setOtpValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey;

  const handleVerifyOtp = async () => {
    if (otpValue.length < 6 || !userId || !API_BASE) return;
    setVerifying(true);
    setMsg({ text: "", type: "" });

    try {
      const res = await apiFetch(`${API_BASE}/api/events/checkin`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "x-api-key": EVENT_API_KEY || "" 
        },
        body: JSON.stringify({ 
          eventId, 
          creatorClerkId: userId, 
          otp: otpValue 
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setMsg({ text: "✓ Guest Verified Successfully!", type: "success" });
        setTimeout(() => {
          setOtpValue("");
          setMsg({ text: "", type: "" });
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setMsg({ text: json.error || "Invalid OTP", type: "error" });
      }
    } catch (err) {
      setMsg({ text: "Connection error", type: "error" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.modalOverlay}>
        <View style={S.modalContent}>
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>Verify Guest OTP</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={C.ink} />
            </TouchableOpacity>
          </View>

          {eventTitle && <Text style={S.modalSub}>{eventTitle}</Text>}
          
          <Text style={S.modalLabel}>Enter the 6-digit code from guest's booking</Text>
          
          <TextInput
            style={S.otpInput}
            placeholder="0 0 0 0 0 0"
            placeholderTextColor="#CBD5E1"
            keyboardType="number-pad"
            maxLength={6}
            value={otpValue}
            onChangeText={setOtpValue}
            autoFocus
          />

          {msg.text ? (
            <Text style={[S.msgText, msg.type === "error" ? { color: C.red } : { color: C.green }]}>
              {msg.text}
            </Text>
          ) : null}

          <TouchableOpacity 
            style={[S.submitBtn, (otpValue.length < 6 || verifying) && { opacity: 0.6 }]} 
            onPress={handleVerifyOtp} 
            disabled={verifying || otpValue.length < 6}
          >
            {verifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={S.submitText}>Verify & Check-in</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 20,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20, fontWeight: "800", color: C.ink,
  },
  modalSub: {
    fontSize: 14, fontWeight: "600", color: C.muted, marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14, fontWeight: "500", color: C.muted, marginBottom: 16,
  },
  otpInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 16, padding: 16, fontSize: 24,
    fontWeight: "800", color: C.purple,
    textAlign: "center", letterSpacing: 10,
    marginBottom: 16,
  },
  msgText: {
    textAlign: "center", fontSize: 14, fontWeight: "700", marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: C.purple, borderRadius: 16, height: 56,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.purple, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitText: {
    color: "#fff", fontSize: 16, fontWeight: "800",
  },
});
