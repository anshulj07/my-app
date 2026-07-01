import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Modal, StyleSheet, KeyboardAvoidingView, Platform, Dimensions, Alert
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiFetch } from "../../lib/apiFetch";
import Constants from "expo-constants";

const { width: SW } = Dimensions.get("window");

const C = {
  bg:      "#F8FAFC",
  white:   "#FFFFFF",
  ink:     "#0F172A",
  muted:   "#64748B",
  accent:  "#6366F1",
  border:  "#E2E8F0",
  red:     "#EF4444",
};

interface BroadcastModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  hostClerkUserId: string;
  onSuccess?: () => void;
}

export default function BroadcastModal({ visible, onClose, eventId, hostClerkUserId, onSuccess }: BroadcastModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey;

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("Empty Message", "Please write a message to broadcast.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/events/broadcast`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": EVENT_API_KEY || ""
        },
        body: JSON.stringify({
          eventId,
          fromClerkUserId: hostClerkUserId,
          text: message.trim(),
        }),
      });

      let data: any = {};
      let textResponse = "";
      try {
        textResponse = await res.text();
        data = JSON.parse(textResponse);
      } catch (e) {
        console.log("Failed to parse JSON. Raw response:", textResponse);
      }

      if (res.ok) {
        Alert.alert("Success", data.message || `Broadcast sent to ${data.count || 0} attendees.`);
        setMessage("");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const errorMsg = data.error || `HTTP ${res.status}: ${textResponse.slice(0, 100)}`;
        Alert.alert("Error", errorMsg || "Failed to send broadcast");
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.message || "Something went wrong while sending the broadcast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={S.overlay} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={S.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <View style={S.modalContent}>
          <View style={S.header}>
            <Text style={S.title}>Broadcast Message</Text>
            <TouchableOpacity onPress={onClose} style={S.closeBtn}>
              <Ionicons name="close" size={24} color={C.ink} />
            </TouchableOpacity>
          </View>

          <Text style={S.subtitle}>
            Send a direct message to all attendees of this event.
          </Text>

          <TextInput
            style={S.input}
            placeholder="Type your message here..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={5}
            value={message}
            onChangeText={setMessage}
            autoFocus
          />

          <TouchableOpacity 
            style={[S.sendBtn, (!message.trim() || loading) && { opacity: 0.5 }]} 
            onPress={handleSend}
            disabled={!message.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <>
                <Ionicons name="send" size={18} color={C.white} />
                <Text style={S.sendBtnText}>Send to All</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  dismissArea: {
    flex: 1
  },
  modalContent: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: C.ink,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: C.muted,
    marginBottom: 20,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: C.ink,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  sendBtn: {
    backgroundColor: C.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  sendBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
