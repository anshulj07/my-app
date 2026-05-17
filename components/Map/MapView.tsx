// components/Map/MapView.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, StyleSheet, Platform, Text,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import { buildMapHtml } from "./mapHtml";

export type EventCategory =
  | "walking" | "running" | "pickleball" | "hiking"
  | "fitness" | "networking" | "social" | "sports" | "other";

export type EventPin = {
  _id: string;
  title: string;
  lat: number;
  lng: number;
  emoji: string;
  bannerImage?: string | null;
  bannerUri?: string | null;
  creatorClerkId?: string;
  kind?: "free" | "paid" | "service" | "event_free" | "event_paid";
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
  attendance?: number | null;
  joinPolicy?: "open" | "approval";
  attendees?: any[];
  pendingRequests?: any[];
  startsAt?: string | null;
  description?: string;
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
  // Community discovery fields
  category?: EventCategory | null;
  source?: "eventbrite" | "meetup" | "luma" | "manual";
  sourceUrl?: string | null;
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
    e?.creatorClerkId ?? e?.creatorClerkID ?? e?.creator?.clerkUserId ?? e?.creatorId ?? ""
  ).trim();
  return {
    _id, title, emoji, lat, lng,
    creatorClerkId: creatorClerkId || undefined,
    kind: e?.kind,
    priceCents: e?.priceCents ?? null,
    status: e?.status,
    tags: Array.isArray(e?.tags) ? e.tags : undefined,
    when: e?.when,
    address: e?.address,
    city: e?.city, state: e?.state, region: e?.region, country: e?.country,
    date: e?.date, time: e?.time,
    location: e?.location ?? undefined,
    attendance: typeof e?.attendance === "number" ? e.attendance : (parseInt(String(e?.attendance || ""), 10) || null),
    joinPolicy: e?.joinPolicy ?? undefined,
    attendees: Array.isArray(e?.attendees) ? e.attendees : undefined,
    pendingRequests: Array.isArray(e?.pendingRequests) ? e.pendingRequests : undefined,
    startsAt: e?.startsAt ?? null,
    description: typeof e?.description === "string" ? e.description : undefined,
  };
}

export default function MapView({
  events,
  initialCenter,
  locationStatus = "unknown",
  onPinPress,
  onLocationUpdate,
  onStackOpen,
  onStackClose,
  userId,
}: {
  events: any[];
  initialCenter?: { lat: number; lng: number } | null;
  locationStatus?: "unknown" | "granted" | "denied";
  onPinPress?: (pin: EventPin) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
  onStackOpen?: () => void;
  onStackClose?: () => void;
  userId?: string | null;
}) {
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Map preview is unavailable on web in Expo Go.</Text>
      </View>
    );
  }

  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;
  const webViewRef = useRef<any>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState(false);
  const [stackVisible, setStackVisible] = useState(false);

  // ── Normalize + filter events ──────────────────────────────────────────────
  const safeEvents: EventPin[] = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    const out: EventPin[] = [];
    for (let i = 0; i < list.length; i++) {
      const status = String(list[i]?.status || "active").toLowerCase();
      const isMine = userId && String(list[i]?.creatorClerkId) === userId;
      if (status !== "active" && status !== "live" && (!isMine || status !== "paused")) continue;
      const n = normalizeEvent(list[i], i);
      if (n) out.push(n);
    }
    return out;
  }, [events, userId]);

  // Stable JSON string — used ONLY as change-detection signal, not as key
  const safeEventsJson = useMemo(() => JSON.stringify(safeEvents), [safeEvents]);

  // Keep latest events in a ref so onLoadEnd always reads current value
  const latestEventsRef = useRef<EventPin[]>(safeEvents);
  latestEventsRef.current = safeEvents;

  if (!GOOGLE_KEY) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Missing Google Maps key (extra.googleMapsKey)</Text>
      </View>
    );
  }

  const canFallbackToEvents = locationStatus === "denied";
  const center =
    initialCenter ??
    (canFallbackToEvents && safeEvents[0]
      ? { lat: safeEvents[0].lat, lng: safeEvents[0].lng }
      : { lat: 40.7128, lng: -74.006 });
  const zoom = initialCenter || (canFallbackToEvents && safeEvents[0]) ? 12 : 10;

  // ── HTML built ONCE (no events embedded — events sent via postMessage) ──────
  const initialHtmlCenter = useRef(center);
  const html = useMemo(
    () => buildMapHtml({ googleKey: GOOGLE_KEY, eventsJson: "[]", center: initialHtmlCenter.current, zoom, userId }),
    [GOOGLE_KEY, zoom, userId]   // NOT safeEventsJson — no reload on event changes
  );

  // ── Push event updates via postMessage (no WebView reload) ─────────────────
  useEffect(() => {
    if (!webViewRef.current) return;
    webViewRef.current.postMessage(JSON.stringify({ type: "updateEvents", events: safeEvents }));
  }, [safeEventsJson]); // fires whenever events change

  // ── Location button ────────────────────────────────────────────────────────
  const goToCurrentLocation = async () => {
    if (locLoading) return;
    setLocError(false);
    setLocLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocError(true);
        setLocLoading(false);
        return;
      }

      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last) {
        const { latitude: lat, longitude: lng } = last.coords;
        webViewRef.current?.postMessage(JSON.stringify({ type: "goToLocation", lat, lng }));
        onLocationUpdate?.(lat, lng);
        setLocLoading(false);
      }

      const freshPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000)
      );
      const fresh = await Promise.race([freshPromise, timeoutPromise]).catch(() => null);

      if (fresh) {
        const { latitude: flat, longitude: flng } = fresh.coords;
        webViewRef.current?.postMessage(JSON.stringify({ type: "goToLocation", lat: flat, lng: flng }));
        onLocationUpdate?.(flat, flng);
      } else if (!last) {
        setLocError(true);
      }
    } catch {
      setLocError(true);
    } finally {
      setLocLoading(false);
    }
  };

  // WebView key: only remount when user or location permission changes (NOT events)
  const webViewKey = `map-${userId ?? "anon"}-${locationStatus}`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        source={{ html }}
        key={webViewKey}
        onLoadEnd={() => {
          // Re-send events after (re)load — handles key-change remounts
          webViewRef.current?.postMessage(
            JSON.stringify({ type: "updateEvents", events: latestEventsRef.current })
          );
        }}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg?.type === "log" || msg?.type === "error") {
              console.log("[MapView]", msg.msg || msg.message, msg.extra ?? "");
              return;
            }
            if (msg?.type === "stackOpen") { setStackVisible(true); onStackOpen?.(); return; }
            if (msg?.type === "stackClose") { setStackVisible(false); onStackClose?.(); return; }
            if (msg?.type === "pinClick" && msg.event) {
              const n = normalizeEvent(msg.event, 0);
              if (n) onPinPress?.(n);
            }
          } catch { }
        }}
      />

      {!stackVisible && (
        <TouchableOpacity
          style={[styles.locBtn, locError && styles.locBtnError]}
          onPress={goToCurrentLocation}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {locLoading ? (
            <ActivityIndicator size="small" color="#5B4FD4" />
          ) : (
            <Ionicons
              name={locError ? "location-outline" : "locate"}
              size={22}
              color={locError ? "#DC2626" : "#5B4FD4"}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  locBtn: {
    position: "absolute",
    bottom: 32, left: 20,
    width: 46, height: 46, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.97)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(91,79,212,0.18)",
    shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  locBtnError: {
    borderColor: "rgba(220,38,38,0.25)",
    backgroundColor: "rgba(254,242,242,0.97)",
  },
});
