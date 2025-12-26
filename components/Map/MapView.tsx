// components/Map/MapView.tsx
import React, { useMemo } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import { buildMapHtml } from "./mapHtml";

/**
 * IMPORTANT:
 * We preserve creatorClerkId (and other fields) so clicking a pin
 * sends them to PersonBookingSheet -> isCreator works.
 */
export type EventPin = {
  _id: string;
  title: string;
  lat: number;
  lng: number;
  emoji: string;

  creatorClerkId?: string;

  kind?: "free" | "service";
  priceCents?: number | string | null;
  status?: string;
  tags?: string[];

  when?: string;
  address?: string;

  city?: string;
  state?: string;
  region?: string;
  country?: string;
  date?: string;
  time?: string;

  location?: {
    city?: string;
    state?: string;
    region?: string;
    country?: string;

    address?: string;
    formattedAddress?: string;
    placeId?: string;

    lat?: number | string;
    lng?: number | string;
  };
};

function toNumber(v: any): number | null {
  const n =
    typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function normalizeEvent(e: any, i: number): EventPin | null {
  const lat = toNumber(e?.lat ?? e?.location?.lat);
  const lng = toNumber(e?.lng ?? e?.location?.lng);
  if (lat == null || lng == null) return null;

  const title = typeof e?.title === "string" ? e.title : "";
  const emoji = typeof e?.emoji === "string" && e.emoji.trim() ? e.emoji : "📍";

  const rawId = e?._id ?? e?.id ?? e?.eventId ?? "";

  const _id =
    typeof rawId === "string" && rawId.trim()
      ? rawId.trim()
      : rawId && typeof rawId === "object" && (rawId.$oid || rawId.oid)
        ? String(rawId.$oid || rawId.oid)
        : `${i}-${lat}-${lng}-${title}`;


  const creatorClerkId = String(
    e?.creatorClerkId ??
    e?.creatorClerkID ??
    e?.creator?.clerkUserId ??
    e?.creatorId ??
    ""
  ).trim();

  return {
    // keep event identity
    _id,
    title,
    emoji,
    lat,
    lng,

    // ✅ keep creator info so sheet can show "Edit event"
    creatorClerkId: creatorClerkId || undefined,

    // keep other fields used by sheet UI
    kind: e?.kind,
    priceCents: e?.priceCents ?? null,
    status: e?.status,
    tags: Array.isArray(e?.tags) ? e.tags : undefined,

    when: e?.when,
    address: e?.address,

    city: e?.city,
    state: e?.state,
    region: e?.region,
    country: e?.country,
    date: e?.date,
    time: e?.time,

    location: e?.location ?? undefined,
  };
}

export default function MapView({
  events,
  initialCenter,
  locationStatus = "unknown",
  onPinPress,
}: {
  events: any[];
  initialCenter?: { lat: number; lng: number } | null;
  locationStatus?: "unknown" | "granted" | "denied";
  onPinPress?: (pin: EventPin) => void;
}) {
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Map preview is unavailable on web in Expo Go.</Text>
      </View>
    );
  }

  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;

  const safeEvents: EventPin[] = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    const out: EventPin[] = [];
    for (let i = 0; i < list.length; i++) {
      // filter here
      if (String(list[i]?.status || "active").toLowerCase() !== "active") continue;

      const n = normalizeEvent(list[i], i);
      if (n) out.push(n);
    }
    return out;
  }, [events]);


  if (!GOOGLE_KEY) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Missing Google Maps key (extra.googleMapsKey)</Text>
      </View>
    );
  }

  // Avoid snapping to random event-city while waiting for location.
  const canFallbackToEvents = locationStatus === "denied";

  const center =
    initialCenter ??
    (canFallbackToEvents && safeEvents[0]
      ? { lat: safeEvents[0].lat, lng: safeEvents[0].lng }
      : { lat: 0, lng: 0 });

  const zoom = initialCenter || (canFallbackToEvents && safeEvents[0]) ? 12 : 2;

  // Ensure _id exists (normalizeEvent already guarantees it)
  const safeEventsJson = useMemo(() => JSON.stringify(safeEvents), [safeEvents]);

  const html = useMemo(
    () =>
      buildMapHtml({
        googleKey: GOOGLE_KEY,
        eventsJson: safeEventsJson,
        center,
        zoom,
      }),
    [GOOGLE_KEY, safeEventsJson, center.lat, center.lng, zoom]
  );

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        source={{ html, baseUrl: "https://localhost" }}
        key={safeEventsJson + JSON.stringify(center) + locationStatus}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);

            if (msg?.type === "log") {
              console.log("[MapView]", msg.msg, msg.extra ?? "");
              return;
            }

            if (msg?.type === "pinClick" && msg.event) {
              const n = normalizeEvent(msg.event, 0);
              if (n) onPinPress?.(n);
            }
          } catch { }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
});
