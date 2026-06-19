// components/Map/MapView.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View, StyleSheet, Platform, Text,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import * as Location from "expo-location";
import Ionicons from "@expo/vector-icons/Ionicons";
import { buildMapHtml } from "./mapHtml";

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
  /** Called with fresh lat/lng whenever the map pans to user's location */
  onLocationUpdate?: (lat: number, lng: number) => void;
  onStackOpen?: () => void;
  /** Called when same-location popup closes — use to show FAB / Nearby / locBtn */
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

  // ✅ NEW — hide RN overlay buttons when stack popup is open
  const [stackVisible, setStackVisible] = useState(false);

  const safeEvents: EventPin[] = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    const out: EventPin[] = [];
    for (let i = 0; i < list.length; i++) {
      const status = String(list[i]?.status || "active").toLowerCase();
      const isMine = userId && String(list[i]?.creatorClerkId) === userId;
      if (status !== "active" && (!isMine || status !== "paused")) continue;
      const n = normalizeEvent(list[i], i);
      if (n) out.push(n);
    }
    return out;
  }, [events, userId]);

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
      : { lat: 22.7196, lng: 75.8577 });
  const zoom = initialCenter || (canFallbackToEvents && safeEvents[0]) ? 12 : 11;
  const safeEventsJson = useMemo(() => JSON.stringify(safeEvents), [safeEvents]);

  // ✅ Use a ref to capture the initial center for the HTML payload.
  // This prevents the WebView from reloading every time 'center' changes.
  const initialHtmlCenter = useRef(center);
  const html = useMemo(
    () => buildMapHtml({ googleKey: GOOGLE_KEY, eventsJson: safeEventsJson, center: initialHtmlCenter.current, zoom }),
    [GOOGLE_KEY, safeEventsJson, zoom] // Removed center.lat/lng from deps
  );

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

      // 1. Try last known position for instant feedback
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last) {
        const { latitude: lat, longitude: lng } = last.coords;
        webViewRef.current?.postMessage(JSON.stringify({ type: "goToLocation", lat, lng }));
        onLocationUpdate?.(lat, lng);
        // Stop spinner early if we have a last known position
        setLocLoading(false);
      }

      // 2. Get fresh position with a timeout to prevent hanging
      const freshPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 8-second timeout for the fresh fix
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000)
      );

      const fresh = await Promise.race([freshPromise, timeoutPromise]).catch((err) => {
        console.log("[MapView] Fresh location failed or timed out:", err.message);
        return null;
      });

      if (fresh) {
        const { latitude: flat, longitude: flng } = fresh.coords;
        webViewRef.current?.postMessage(JSON.stringify({ type: "goToLocation", lat: flat, lng: flng }));
        onLocationUpdate?.(flat, flng);
      } else if (!last) {
        setLocError(true);
      }

    } catch (err) {
      console.log("[MapView] Location error:", err);
      setLocError(true);
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        source={{ html }}
        key={safeEventsJson + locationStatus} // Removed center from key
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg?.type === "log" || msg?.type === "error") {
              console.log("[MapView]", msg.msg || msg.message, msg.extra ?? "");
              return;
            }
            // ✅ Stack popup open — hide RN overlay UI
            if (msg?.type === "stackOpen") {
              setStackVisible(true);
              onStackOpen?.();
              return;
            }
            // ✅ Stack popup closed — show RN overlay UI again
            if (msg?.type === "stackClose") {
              setStackVisible(false);
              onStackClose?.();
              return;
            }
            if (msg?.type === "pinClick" && msg.event) {
              const n = normalizeEvent(msg.event, 0);
              if (n) onPinPress?.(n);
            }
          } catch { }
        }}
      />

      {/* ✅ Location button — hidden when stack popup open */}
      {!stackVisible && (
        <TouchableOpacity
          style={[styles.locBtn, locError && styles.locBtnError]}
          onPress={goToCurrentLocation}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {locLoading ? (
            <ActivityIndicator size="small" color="#0A84FF" />
          ) : (
            <Ionicons
              name={locError ? "location-outline" : "locate"}
              size={22}
              color={locError ? "#DC2626" : "#0A84FF"}
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
    bottom: 116,
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.97)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  locBtnError: {
    borderColor: "rgba(220,38,38,0.25)",
    backgroundColor: "rgba(254,242,242,0.97)",
  },
});