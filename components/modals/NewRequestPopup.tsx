import React, { useEffect, useState } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotifications, NotifItem } from "../../context/NotificationContext";
import { Audio } from "expo-av";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { apiFetch } from "../../lib/apiFetch";
import { useAuth } from "@clerk/clerk-expo";
import { MotiView } from "moti";

const { width: SW } = Dimensions.get("window");

const C = {
  bg: "#FFFFFF",
  ink: "#0F172A",
  muted: "#64748B",
  accent: "#3ECFB2", // Teal
  red: "#FF4D4D",
  border: "#E2E8F0",
  overlay: "rgba(15, 23, 42, 0.4)",
};

export default function NewRequestPopup() {
  const { notifications, refresh } = useNotifications();
  const { userId } = useAuth();
  const [lastPopupTime, setLastPopupTime] = useState<number | null>(null);
  const [currentPopup, setCurrentPopup] = useState<NotifItem | null>(null);
  const [loadingAction, setLoadingAction] = useState<"admit" | "reject" | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const router = useRouter();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey;

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const stored = await AsyncStorage.getItem(`@last_popup_time_${userId}`);
      if (stored) setLastPopupTime(parseInt(stored, 10));
      else setLastPopupTime(0); // Show pending requests even on first open
    })();
  }, [userId]);

  useEffect(() => {
    if (lastPopupTime === null || currentPopup !== null || !userId) return;

    const tenMinsAgo = Date.now() - 10 * 60 * 1000;

    const unshown = notifications.filter(
      (n) => n.type === "pending" && 
             new Date(n.timestamp).getTime() > lastPopupTime &&
             new Date(n.timestamp).getTime() > tenMinsAgo // Only show if request is less than 10 mins old
    );

    if (unshown.length > 0) {
      const sorted = [...unshown].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const nextPopup = sorted[0];

      setCurrentPopup(nextPopup);
      playNotificationSound();
    }
  }, [notifications, lastPopupTime, currentPopup, userId]);

  // Auto-dismiss the popup after 10 minutes if the user doesn't interact with it
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (currentPopup) {
      timeout = setTimeout(() => {
        closeAndNext(currentPopup.timestamp);
      }, 10 * 60 * 1000); // 10 mins
    }
    return () => clearTimeout(timeout);
  }, [currentPopup]);

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
        { shouldPlay: true }
      );
      setSound(sound);
    } catch (e) {
      console.log("Failed to play sound", e);
    }
  };

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const closeAndNext = async (ts: string) => {
    if (!userId) return;
    const newTime = new Date(ts).getTime();
    setLastPopupTime(newTime);
    await AsyncStorage.setItem(`@last_popup_time_${userId}`, newTime.toString());
    setCurrentPopup(null);
  };

  const handleAction = async (action: "admit" | "reject") => {
    if (!currentPopup || !userId) return;
    setLoadingAction(action);
    try {
      const res = await apiFetch(`${API_BASE}/api/events/admit-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": EVENT_API_KEY || "",
        },
        body: JSON.stringify({
          eventId: currentPopup.eventId,
          creatorClerkId: userId,
          requestClerkUserId: currentPopup.userClerkId,
          action,
        }),
      });
      if (res.ok) {
        await refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
      closeAndNext(currentPopup.timestamp);
    }
  };

  if (!currentPopup) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={S.overlay}>
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 14 }}
          style={S.card}
        >
          {/* Header */}
          <View style={S.header}>
            <View style={S.badge}>
              <Ionicons name="notifications" size={12} color="#fff" />
              <Text style={S.badgeText}>New Request</Text>
            </View>
            <TouchableOpacity onPress={() => closeAndNext(currentPopup.timestamp)}>
              <Ionicons name="close" size={24} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={S.userInfo}>
            <Image
              source={{ uri: currentPopup.userImageUrl || "https://i.pravatar.cc/150" }}
              style={S.avatar}
            />
            <View style={S.userDetails}>
              <Text style={S.userName}>{currentPopup.userName}</Text>
              <Text style={S.eventContext}>
                wants to join <Text style={S.eventHighlight}>{currentPopup.eventTitle}</Text> {currentPopup.eventEmoji}
              </Text>
            </View>
          </View>

          {currentPopup.message ? (
            <View style={S.messageBox}>
              <Text style={S.messageText}>"{currentPopup.message}"</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={S.actions}>
            <TouchableOpacity
              style={[S.actionBtn, S.rejectBtn]}
              onPress={() => handleAction("reject")}
              disabled={loadingAction !== null}
            >
              {loadingAction === "reject" ? (
                <ActivityIndicator color={C.red} size="small" />
              ) : (
                <Text style={S.rejectBtnText}>Decline</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[S.actionBtn, S.acceptBtn]}
              onPress={() => handleAction("admit")}
              disabled={loadingAction !== null}
            >
              {loadingAction === "admit" ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={S.acceptBtnText}>Accept</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={S.profileBtn}
            onPress={() => {
              closeAndNext(currentPopup.timestamp);
            }}
          >
            <Text style={S.profileBtnText}>Dismiss & View Later</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: C.bg,
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: C.ink,
    marginBottom: 4,
  },
  eventContext: {
    fontSize: 14,
    color: C.muted,
    lineHeight: 20,
  },
  eventHighlight: {
    fontWeight: "700",
    color: C.ink,
  },
  messageBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  messageText: {
    fontSize: 14,
    color: C.muted,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    backgroundColor: "#FEE2E2",
  },
  rejectBtnText: {
    color: C.red,
    fontSize: 15,
    fontWeight: "700",
  },
  acceptBtn: {
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  profileBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  profileBtnText: {
    color: C.muted,
    fontSize: 14,
    fontWeight: "600",
  },
});
