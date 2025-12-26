import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";

type EventKind = "free" | "paid" | "service";

type Props = {
  eventId: string;                   // required
  kind: EventKind;                   // required (so we know what flow to run)
  priceCents?: number | null;        // optional (useful for payment UI)
  label?: string;                    // default: "Join event"
  onJoined?: (payload: any) => void; // callback after free join success
  disabled?: boolean;                // external disable
};

export default function JoinEventButton({
  eventId,
  kind,
  priceCents = null,
  label = "Join event",
  onJoined,
  disabled,
}: Props) {
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

  // check joined ONLY matters for free events (for paid/service you might have a different "purchased" check)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (kind !== "free") return;
        if (!API_BASE || !userId || !eventId) return;

        const url =
          `${API_BASE}/api/events/is-joined?eventId=${encodeURIComponent(eventId)}` +
          `&clerkUserId=${encodeURIComponent(userId)}`;

        const res = await fetch(url, {
          headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
        });
        const json = await res.json().catch(() => null);

        if (!cancelled && res.ok) setJoined(!!json?.joined);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, EVENT_API_KEY, userId, eventId, kind]);

  const startPaymentFlow = async () => {
    // ✅ Placeholder payment flow
    // Replace this with your Stripe/PayU/etc checkout screen or a WebView URL.
    // Example:
    // router.push({ pathname: "/checkout", params: { eventId, kind, priceCents: String(priceCents ?? 0) } } as any);

    const dollars = priceCents != null ? (priceCents / 100).toFixed(2) : "0.00";
    Alert.alert(
      "Payment required",
      `${kind === "service" ? "Service" : "Paid"} event • $${dollars}\n\n(Placeholder) Redirect to payment gateway here.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            // placeholder navigation
            router.push(
              ({
                pathname: "/payment/checkout",
                params: { eventId, kind, amount: String(priceCents ?? 0) },
              } as any)
            );
          },
        },
      ]
    );
  };

  const joinFreeEvent = async () => {
    if (!API_BASE) {
      Alert.alert("Config error", "API base URL is missing (apiBaseUrl)");
      return;
    }
    if (!eventId) {
      Alert.alert("Missing event", "Event ID not found");
      return;
    }

    // Backend should push userId into attendees[] (and prevent duplicates)
    const res = await fetch(`${API_BASE}/api/events/join-event`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventId,
        clerkUserId: userId,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      Alert.alert("Couldn’t join", json?.message || json?.error || "Please try again");
      return;
    }

    setJoined(true);
    onJoined?.(json);
    Alert.alert("Joined!", "You’re registered for this event");
  };

  const onPress = async () => {
    if (disabled || loading || joined) return;

    if (!userId) {
      Alert.alert("Sign in required", "Please sign in to continue");
      router.push("/sign-in" as any);
      return;
    }

    try {
      setLoading(true);

      if (kind === "free") {
        await joinFreeEvent();
      } else {
        await startPaymentFlow();
      }
    } catch {
      Alert.alert("Network error", "Please try again");
    } finally {
      setLoading(false);
    }
  };

  const buttonText =
    joined && kind === "free" ? "Joined" : kind === "service" || kind === "paid" ? "Continue to payment" : label;

  const iconName =
    loading ? null : joined && kind === "free" ? "checkmark-circle-outline" : kind === "free" ? "people-outline" : "card-outline";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading || (joined && kind === "free")}
      style={({ pressed }) => [
        styles.cta,
        (disabled || loading || (joined && kind === "free")) && styles.ctaDisabled,
        pressed && !(disabled || loading || (joined && kind === "free")) && styles.ctaPressed,
      ]}
    >
      <View style={styles.ctaGlow} />

      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Ionicons name={iconName as any} size={18} color="#fff" />
      )}

      <Text style={styles.ctaText}>{buttonText}</Text>
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
