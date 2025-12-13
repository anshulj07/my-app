import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  eventId: string;                 // required
  label?: string;                  // default: "Join event"
  onJoined?: (payload: any) => void; // optional callback after success
  disabled?: boolean;              // optional external disable
};

export default function JoinEventButton({ eventId, label = "Join event", onJoined, disabled }: Props) {
  const router = useRouter();
  const { userId } = useAuth();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (EVENT_API_KEY) h["x-api-key"] = EVENT_API_KEY;
    return h;
  }, [EVENT_API_KEY]);

  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  // Optional: check if already joined (prevents duplicate joins + nicer UX)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!API_BASE || !userId || !eventId) return;

        const url =
          `${API_BASE}/api/events/is-joined?eventId=${encodeURIComponent(eventId)}` +
          `&clerkUserId=${encodeURIComponent(userId)}`;

        const res = await fetch(url, { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined });
        const json = await res.json().catch(() => null);

        if (!cancelled && res.ok) setJoined(!!json?.joined);
      } catch {
        // ignore (don’t block UI)
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, EVENT_API_KEY, userId, eventId]);

  const join = async () => {
    if (disabled || loading) return;

    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to join this event");
      router.push("/sign-in" as any);
      return;
    }

    if (!API_BASE) {
      Alert.alert("Config error", "API base URL is missing (apiBaseUrl)");
      return;
    }

    if (!eventId) {
      Alert.alert("Missing event", "Event ID not found");
      return;
    }

    try {
      setLoading(true);

      // Backend should upsert / prevent duplicates (unique index on eventId+clerkUserId)
      const res = await fetch(`${API_BASE}/api/events/join`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId,
          clerkUserId: userId,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        Alert.alert("Couldn’t join", json?.message || "Please try again");
        return;
      }

      setJoined(true);
      onJoined?.(json);
      Alert.alert("Joined!", "You’re registered for this event");
    } catch {
      Alert.alert("Network error", "Please try again");
    } finally {
      setLoading(false);
    }
  };

  const text = joined ? "Joined" : label;

  return (
    <Pressable
      onPress={join}
      disabled={disabled || loading || joined}
      style={({ pressed }) => [
        styles.cta,
        (disabled || loading || joined) && styles.ctaDisabled,
        pressed && !(disabled || loading || joined) && styles.ctaPressed,
      ]}
    >
      <View style={styles.ctaGlow} />
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Ionicons name={joined ? "checkmark-circle-outline" : "people-outline"} size={18} color="#fff" />
      )}
      <Text style={styles.ctaText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cta: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(10,132,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ctaPressed: { transform: [{ scale: 0.992 }], opacity: 0.96 },
  ctaDisabled: { opacity: 0.55 },
  ctaGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    right: -140,
    top: -160,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  ctaText: { color: "#fff", fontWeight: "950" as any, fontSize: 15 },
});
