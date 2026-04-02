
// // components/Map/MapView.tsx
// import React, { useMemo, useRef, useState } from "react";
// import {
//   View, StyleSheet, Platform, Text,
//   TouchableOpacity, ActivityIndicator,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import Constants from "expo-constants";
// import * as Location from "expo-location";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { buildMapHtml } from "./mapHtml";

// /**
//  * IMPORTANT:
//  * We preserve creatorClerkId (and other fields) so clicking a pin
//  * sends them to PersonBookingSheet -> isCreator works.
//  */
// export type EventPin = {
//   _id: string;
//   title: string;
//   lat: number;
//   lng: number;
//   emoji: string;

//   creatorClerkId?: string;

//   kind?: "free" | "paid" | "service" | "event_free" | "event_paid";
//   priceCents?: number | string | null;
//   status?: string;
//   tags?: string[];

//   when?: string;
//   address?: string;

//   city?: string;
//   state?: string;
//   region?: string;
//   country?: string;
//   date?: string;
//   time?: string;

//   // ✅ Capacity & join policy
//   attendance?: number | null;       // max people (null = unlimited)
//   joinPolicy?: "open" | "approval"; // open = direct join, approval = host must approve
//   attendees?: any[];
//   pendingRequests?: any[];
//   startsAt?: string | null;
//   description?: string;

//   location?: {
//     city?: string;
//     state?: string;
//     region?: string;
//     country?: string;
//     address?: string;
//     formattedAddress?: string;
//     placeId?: string;
//     lat?: number | string;
//     lng?: number | string;
//   };
// };

// function toNumber(v: any): number | null {
//   const n =
//     typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
//   return Number.isFinite(n) ? n : null;
// }

// function normalizeEvent(e: any, i: number): EventPin | null {
//   const lat = toNumber(e?.lat ?? e?.location?.lat);
//   const lng = toNumber(e?.lng ?? e?.location?.lng);
//   if (lat == null || lng == null) return null;

//   const title = typeof e?.title === "string" ? e.title : "";
//   const emoji = typeof e?.emoji === "string" && e.emoji.trim() ? e.emoji : "📍";

//   const rawId = e?._id ?? e?.id ?? e?.eventId ?? "";

//   const _id =
//     typeof rawId === "string" && rawId.trim()
//       ? rawId.trim()
//       : rawId && typeof rawId === "object" && (rawId.$oid || rawId.oid)
//         ? String(rawId.$oid || rawId.oid)
//         : `${i}-${lat}-${lng}-${title}`;

//   const creatorClerkId = String(
//     e?.creatorClerkId ??
//     e?.creatorClerkID ??
//     e?.creator?.clerkUserId ??
//     e?.creatorId ??
//     ""
//   ).trim();

//   return {
//     _id,
//     title,
//     emoji,
//     lat,
//     lng,
//     creatorClerkId: creatorClerkId || undefined,
//     kind: e?.kind,
//     priceCents: e?.priceCents ?? null,
//     status: e?.status,
//     tags: Array.isArray(e?.tags) ? e.tags : undefined,
//     when: e?.when,
//     address: e?.address,
//     city: e?.city,
//     state: e?.state,
//     region: e?.region,
//     country: e?.country,
//     date: e?.date,
//     time: e?.time,
//     location: e?.location ?? undefined,
//     // ✅ Capacity & join policy
//     attendance: typeof e?.attendance === "number" ? e.attendance : (parseInt(String(e?.attendance || ""), 10) || null),
//     joinPolicy: e?.joinPolicy ?? undefined,
//     attendees: Array.isArray(e?.attendees) ? e.attendees : undefined,
//     pendingRequests: Array.isArray(e?.pendingRequests) ? e.pendingRequests : undefined,
//     startsAt: e?.startsAt ?? null,
//     description: typeof e?.description === "string" ? e.description : undefined,
//   };
// }

// export default function MapView({
//   events,
//   initialCenter,
//   locationStatus = "unknown",
//   onPinPress,
//   onLocationUpdate,
// }: {
//   events: any[];
//   initialCenter?: { lat: number; lng: number } | null;
//   locationStatus?: "unknown" | "granted" | "denied";
//   onPinPress?: (pin: EventPin) => void;
//   onLocationUpdate?: (lat: number, lng: number) => void; // optional: notify parent
// }) {
//   if (Platform.OS === "web") {
//     return (
//       <View style={[styles.container, styles.center]}>
//         <Text>Map preview is unavailable on web in Expo Go.</Text>
//       </View>
//     );
//   }

//   const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;

//   // ✅ WebView ref — needed to postMessage for panning map
//   const webViewRef = useRef<any>(null);

//   // ✅ Location button states
//   const [locLoading, setLocLoading] = useState(false);
//   const [locError, setLocError] = useState(false);

//   const safeEvents: EventPin[] = useMemo(() => {
//     const list = Array.isArray(events) ? events : [];
//     const out: EventPin[] = [];
//     for (let i = 0; i < list.length; i++) {
//       if (String(list[i]?.status || "active").toLowerCase() !== "active") continue;
//       const n = normalizeEvent(list[i], i);
//       if (n) out.push(n);
//     }
//     return out;
//   }, [events]);

//   if (!GOOGLE_KEY) {
//     return (
//       <View style={[styles.container, styles.center]}>
//         <Text>Missing Google Maps key (extra.googleMapsKey)</Text>
//       </View>
//     );
//   }

//   const canFallbackToEvents = locationStatus === "denied";

//   const center =
//     initialCenter ??
//     (canFallbackToEvents && safeEvents[0]
//       ? { lat: safeEvents[0].lat, lng: safeEvents[0].lng }
//       : { lat: 22.7196, lng: 75.8577 }); // ✅ Default: Indore (was 0,0)

//   const zoom = initialCenter || (canFallbackToEvents && safeEvents[0]) ? 12 : 11;

//   const safeEventsJson = useMemo(() => JSON.stringify(safeEvents), [safeEvents]);

//   const html = useMemo(
//     () =>
//       buildMapHtml({
//         googleKey: GOOGLE_KEY,
//         eventsJson: safeEventsJson,
//         center,
//         zoom,
//       }),
//     [GOOGLE_KEY, safeEventsJson, center.lat, center.lng, zoom]
//   );

//   // ✅ Current location button — press karo, GPS lo, map pan karo
//   const goToCurrentLocation = async () => {
//     if (locLoading) return;
//     setLocError(false);
//     setLocLoading(true);

//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         setLocError(true);
//         setLocLoading(false);
//         return;
//       }

//       const pos = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.Balanced,
//       });

//       const lat = pos.coords.latitude;
//       const lng = pos.coords.longitude;

//       // ✅ postMessage to Google Maps WebView — pan + show blue dot
//       webViewRef.current?.postMessage(
//         JSON.stringify({ type: "goToLocation", lat, lng })
//       );

//       // notify parent if needed (e.g. to update initialCenter)
//       onLocationUpdate?.(lat, lng);
//     } catch {
//       setLocError(true);
//     } finally {
//       setLocLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <WebView
//         ref={webViewRef}
//         originWhitelist={["*"]}
//         javaScriptEnabled
//         domStorageEnabled
//         source={{ html, baseUrl: "https://localhost" }}
//         key={safeEventsJson + JSON.stringify(center) + locationStatus}
//         onMessage={(e) => {
//           try {
//             const msg = JSON.parse(e.nativeEvent.data);

//             if (msg?.type === "log") {
//               console.log("[MapView]", msg.msg, msg.extra ?? "");
//               return;
//             }

//             if (msg?.type === "pinClick" && msg.event) {
//               const n = normalizeEvent(msg.event, 0);
//               if (n) onPinPress?.(n);
//             }
//           } catch { }
//         }}
//       />

//       {/* ✅ Current Location Button — floating over map, bottom-right */}
//       <TouchableOpacity
//         style={[styles.locBtn, locError && styles.locBtnError]}
//         onPress={goToCurrentLocation}
//         activeOpacity={0.85}
//         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//       >
//         {locLoading ? (
//           <ActivityIndicator size="small" color="#0A84FF" />
//         ) : (
//           <Ionicons
//             name={locError ? "location-outline" : "locate"}
//             size={22}
//             color={locError ? "#DC2626" : "#0A84FF"}
//           />
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   center: { alignItems: "center", justifyContent: "center" },

//   // ✅ Positioned above FAB (FAB sits ~bottom:40+56 = 96, we go 116 to give gap)
//   locBtn: {
//     position: "absolute",
//     bottom: 116,
//     right: 18,
//     width: 46,
//     height: 46,
//     borderRadius: 14,
//     backgroundColor: "rgba(255,255,255,0.97)",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "rgba(15,23,42,0.10)",
//     shadowColor: "#000",
//     shadowOpacity: 0.13,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 6 },
//     elevation: 8,
//   },
//   locBtnError: {
//     borderColor: "rgba(220,38,38,0.25)",
//     backgroundColor: "rgba(254,242,242,0.97)",
//   },
// });
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
}: {
  events: any[];
  initialCenter?: { lat: number; lng: number } | null;
  locationStatus?: "unknown" | "granted" | "denied";
  onPinPress?: (pin: EventPin) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
  /** Called when same-location popup opens — use to hide FAB / Nearby / locBtn */
  onStackOpen?: () => void;
  /** Called when same-location popup closes — use to show FAB / Nearby / locBtn */
  onStackClose?: () => void;
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

  const canFallbackToEvents = locationStatus === "denied";
  const center =
    initialCenter ??
    (canFallbackToEvents && safeEvents[0]
      ? { lat: safeEvents[0].lat, lng: safeEvents[0].lng }
      : { lat: 22.7196, lng: 75.8577 });
  const zoom = initialCenter || (canFallbackToEvents && safeEvents[0]) ? 12 : 11;
  const safeEventsJson = useMemo(() => JSON.stringify(safeEvents), [safeEvents]);
  const html = useMemo(
    () => buildMapHtml({ googleKey: GOOGLE_KEY, eventsJson: safeEventsJson, center, zoom }),
    [GOOGLE_KEY, safeEventsJson, center.lat, center.lng, zoom]
  );

  const goToCurrentLocation = async () => {
    if (locLoading) return;
    setLocError(false);
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocError(true); setLocLoading(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      webViewRef.current?.postMessage(JSON.stringify({ type: "goToLocation", lat, lng }));
      onLocationUpdate?.(lat, lng);
    } catch { setLocError(true); }
    finally { setLocLoading(false); }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
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