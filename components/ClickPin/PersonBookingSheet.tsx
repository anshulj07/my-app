// // components/ClickPin/PersonBookingSheet.tsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   Modal, View, Text, StyleSheet, Pressable, Image,
//   ActivityIndicator, ScrollView, Animated, Easing,
//   Platform, Switch, Alert, Share, TouchableOpacity, Linking,
// } from "react-native";
// import Constants from "expo-constants";
// import { useAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import type { EventPin } from "../Map/MapView";
// import JoinEventButton from "./JoinEventButton";
// import { apiFetch } from "../../lib/apiFetch";

// /* ─────────────────────────────────────────────
//    DESIGN TOKENS
//    Purple accent (like your profile screen)
//    Clean white light theme
// ───────────────────────────────────────────── */
// const C = {
//   pageBg:  "#FFFFFF",
//   surface: "#F4F4F8",
//   card:    "#FFFFFF",
//   border:  "rgba(0,0,0,0.07)",
//   sep:     "rgba(0,0,0,0.05)",

//   ink:   "#0F0F0F",
//   ink2:  "#2C2C2C",
//   muted: "#717171",
//   hint:  "#C0C0C0",

//   // ── SINGLE ACCENT — purple (matches your app's purple) ──
//   accent:      "#6C5CE7",           // rich purple
//   accentDeep:  "#5A4BD1",           // pressed / border
//   accentSoft:  "rgba(108,92,231,0.09)",
//   accentText:  "#4C3DB5",
//   // gradient endpoints for banner bg
//   gradStart:   "#7C6FF0",
//   gradEnd:     "#9B59B6",

//   // ── Semantic (status only) ──
//   green:      "#10B981",
//   greenSoft:  "rgba(16,185,129,0.09)",
//   amber:      "#F59E0B",
//   amberSoft:  "rgba(245,158,11,0.09)",
//   red:        "#EF4444",
//   redSoft:    "rgba(239,68,68,0.09)",
//   purpleAlt:  "#8B5CF6",            // approval badge only
//   purpleAltSoft: "rgba(139,92,246,0.09)",
// };

// /* ─────────────────────────────────────────────
//    HELPERS
// ───────────────────────────────────────────── */
// function parseDateObj(ev: any): Date | null {
//   if (ev?.startsAt) {
//     const t = new Date(ev.startsAt);
//     if (Number.isFinite(t.getTime())) return t;
//   }
//   if (typeof ev?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
//     const [y, m, d] = ev.date.split("-").map(Number);
//     return new Date(Date.UTC(y, m - 1, d));
//   }
//   return null;
// }
// function fmtLong(ev: any) {
//   const d = parseDateObj(ev);
//   if (!d) return "";
//   return d.toLocaleDateString("en-US", {
//     weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
//   });
// }
// function fmtChip(ev: any) {
//   const d = parseDateObj(ev);
//   if (!d) return "";
//   const mo  = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
//   const day = d.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });
//   const time = (ev as any)?.time ? `, ${(ev as any).time}` : "";
//   return `${mo} ${day}${time}`;
// }
// function pick(...vs: any[]) {
//   for (const v of vs) if (typeof v === "string" && v.trim()) return v.trim();
//   return "";
// }
// function fromCents(c: any) {
//   const n = typeof c === "string" ? Number(c) : c;
//   return typeof n === "number" && Number.isFinite(n) && n > 0
//     ? `₹${(n / 100).toFixed(0)}`
//     : "";
// }

// /* ─────────────────────────────────────────────
//    TYPES
// ───────────────────────────────────────────── */
// type Props = {
//   visible: boolean;
//   onClose: () => void;
//   person?: EventPin | null;
//   onEditDetails?: (ev: EventPin) => void;
//   onStatusChanged?: (id: string, s: string) => void;
//   onDeleteEvent?: (id: string) => void;
// };

// /* ─────────────────────────────────────────────
//    COMPONENT
// ───────────────────────────────────────────── */
// export default function PersonBookingSheet({
//   visible, onClose, person,
//   onEditDetails, onStatusChanged, onDeleteEvent,
// }: Props) {
//   const router     = useRouter();
//   const { userId } = useAuth();

//   const eventId = String(
//     (person as any)?._id?.$oid || (person as any)?._id?.oid ||
//     (person as any)?._id || (person as any)?.id || (person as any)?.eventId || ""
//   );
//   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
//   const GOOGLE_KEY    = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;
//   const creatorClerkId =
//     (person as any)?.creatorClerkId || (person as any)?.creator?.clerkUserId || (person as any)?.creatorId || "";

//   const kind: "free" | "service" | "paid" | "event_free" | "event_paid" =
//     ((person as any)?.kind || "free") as any;
//   const isPaid     = kind === "paid" || kind === "event_paid";
//   const priceLabel = fromCents((person as any)?.priceCents);
//   const priceCents: number | null = (person as any)?.priceCents ?? null;
//   const isCreator  = !!userId && !!creatorClerkId && String(userId) === String(creatorClerkId);

//   const kindLabel = kind === "service" ? "Service" : isPaid ? "Paid" : "Free";
//   const kindEmoji = kind === "service" ? "🛠️" : isPaid ? "🎟️" : "🎉";
//   const bannerImg = (person as any)?.imageUrl || (person as any)?.coverImage || (person as any)?.image || "";

//   /* ── state ── */
//   const [statusLocal,     setStatusLocal]     = useState("active");
//   const [serviceEnabled,  setServiceEnabled]  = useState(true);
//   const [togglingService, setTogglingService] = useState(false);
//   const [descExpanded,    setDescExpanded]    = useState(false);
//   const [saved,           setSaved]           = useState(false);
//   const [creator,         setCreator]         = useState<any>(null);
//   const [loadingCreator,  setLoadingCreator]  = useState(false);
//   const descText = pick((person as any)?.description, (person as any)?.desc, "");

//   useEffect(() => {
//     if (!visible || !person) return;
//     const s = String((person as any)?.status || "active");
//     setStatusLocal(s); setServiceEnabled(s.toLowerCase() !== "paused");
//     setDescExpanded(false); setSaved(false);
//   }, [visible, eventId, person]);

//   useEffect(() => {
//     if (!visible || !API_BASE || !creatorClerkId) return;
//     let dead = false;
//     (async () => {
//       setLoadingCreator(true);
//       try {
//         const r = await apiFetch(
//           `${API_BASE}/api/users/get-user?clerkUserId=${encodeURIComponent(creatorClerkId)}`,
//           { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined }
//         );
//         const j = await r.json().catch(() => null);
//         if (!dead) setCreator(r.ok ? j?.user ?? null : null);
//       } catch { if (!dead) setCreator(null); }
//       finally  { if (!dead) setLoadingCreator(false); }
//     })();
//     return () => { dead = true; };
//   }, [visible, API_BASE, EVENT_API_KEY, creatorClerkId]);

//   const creatorName  = pick(
//     creator?.profile?.firstName && creator?.profile?.lastName
//       ? `${creator.profile.firstName} ${creator.profile.lastName}` : "",
//     creator?.profile?.firstName, "Organizer"
//   );
//   const creatorAbout = pick(creator?.profile?.about, "");
//   const creatorPhoto = creator?.profile?.photos?.[0] || "";

//   const D = useMemo(() => {
//     if (!person) return null;
//     const loc     = (person as any)?.location || {};
//     const address = pick(loc.formattedAddress, loc.address, (person as any)?.address, "");
//     const city    = pick(loc.city, (person as any)?.city);
//     const region  = pick(loc.admin1Code, loc.admin1, (person as any)?.region, (person as any)?.state);
//     const country = pick(loc.countryCode, loc.country, (person as any)?.country);
//     const lat     = loc.lat || (person as any)?.lat;
//     const lng     = loc.lng || (person as any)?.lng;
//     const attendees = Array.isArray((person as any)?.attendees) ? (person as any).attendees : [];
//     const pending   = Array.isArray((person as any)?.pendingRequests) ? (person as any).pendingRequests : [];
//     const cap       = (person as any)?.attendance;
//     return {
//       address,
//       venueLine:  address.split(",")[0] || "",
//       cityLine:   [city, region, country].filter(Boolean).join(", "),
//       dateLong:   fmtLong(person),
//       dateChip:   fmtChip(person),
//       lat, lng,
//       tags:       Array.isArray((person as any)?.tags) ? (person as any).tags as string[] : [],
//       joined:     attendees.length,
//       capacity:   typeof cap === "number" ? cap : parseInt(String(cap || ""), 10) || null,
//       isPending:  !!userId && pending.some((p: any) => String(p.clerkUserId) === String(userId)),
//       joinPolicy: (person as any)?.joinPolicy as "open" | "approval" | undefined,
//       attendees,
//     };
//   }, [person, userId]);

//   const staticMapUrl = useMemo(() => {
//     if (!D?.lat || !D?.lng || !GOOGLE_KEY) return null;
//     const lat = Number(D.lat), lng = Number(D.lng);
//     if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
//     return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&scale=2&markers=color:0x6C5CE7%7C${lat},${lng}&style=feature:poi%7Cvisibility:off&key=${GOOGLE_KEY}`;
//   }, [D?.lat, D?.lng, GOOGLE_KEY]);

//   const openAttendees = () => {
//     close(() => {
//       router.push({ pathname: "/event/[eventId]/attendees" as any, params: { eventId } });
//     });
//   };

//   const openMaps = () => {
//     if (!D?.lat || !D?.lng) return;
//     const lat = Number(D.lat), lng = Number(D.lng);
//     const label  = encodeURIComponent(D.venueLine || "Event location");
//     const iosUrl = `maps://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
//     const andUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
//     const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
//     const native = Platform.OS === "ios" ? iosUrl : andUrl;
//     Linking.canOpenURL(native).then(ok => Linking.openURL(ok ? native : webUrl)).catch(() => Linking.openURL(webUrl));
//   };

//   const handleShare = async () => {
//     try {
//       await Share.share({
//         title: (person as any)?.title || "Check out this event",
//         message: `${(person as any)?.title || "Event"}${D?.dateLong ? `\n📅 ${D.dateLong}` : ""}${D?.address ? `\n📍 ${D.address}` : ""}\n\nJoin on Assisto!`,
//       });
//     } catch {}
//   };

//   const handleDelete = () => {
//     Alert.alert("Delete Event?", "This cannot be undone.", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Delete", style: "destructive", onPress: async () => {
//           if (!API_BASE || !eventId || !userId) return;
//           try {
//             await apiFetch(`${API_BASE}/api/events/delete-event`, {
//               method: "DELETE",
//               headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
//               body: JSON.stringify({ eventId, creatorClerkId: userId }),
//             });
//             close(() => onDeleteEvent?.(eventId));
//           } catch { Alert.alert("Error", "Failed to delete."); }
//         },
//       },
//     ]);
//   };

//   const patchService = async (next: boolean) => {
//     if (!API_BASE || !eventId || !creatorClerkId) return;
//     const pe = serviceEnabled, ps = statusLocal, op = next ? "active" : "paused";
//     setServiceEnabled(next); setStatusLocal(op); onStatusChanged?.(eventId, op);
//     try {
//       setTogglingService(true);
//       const r = await apiFetch(`${API_BASE}/api/events/toggle-service`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
//         body: JSON.stringify({ _id: eventId, creatorClerkId, enabled: next }),
//       });
//       const j = await r.json().catch(() => ({}));
//       if (!r.ok) throw new Error(j?.error || "Failed");
//       const ns = String(j?.status || j?.event?.status || op);
//       setStatusLocal(ns); setServiceEnabled(ns.toLowerCase() !== "paused");
//       onStatusChanged?.(eventId, ns);
//     } catch { setServiceEnabled(pe); setStatusLocal(ps); onStatusChanged?.(eventId, ps); }
//     finally { setTogglingService(false); }
//   };

//   /* ── animations ── */
//   const slideY = useRef(new Animated.Value(900)).current;
//   const dimA   = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (!visible) return;
//     slideY.setValue(900); dimA.setValue(0);
//     Animated.parallel([
//       Animated.timing(dimA,   { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
//       Animated.spring(slideY, { toValue: 0, tension: 65, friction: 13, useNativeDriver: true }),
//     ]).start();
//   }, [visible]);

//   const close = (after?: () => void) => {
//     Animated.parallel([
//       Animated.timing(dimA,   { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
//       Animated.timing(slideY, { toValue: 900, duration: 230, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
//     ]).start(({ finished }) => { if (finished) { onClose(); after?.(); } });
//   };

//   const isActive = statusLocal.toLowerCase() === "active";
//   const isFull   = !!(D?.capacity && D.joined >= D.capacity);
//   const pct      = D?.capacity ? Math.min(100, (D.joined / D.capacity) * 100) : 100;

//   /* ─────────────────────────────────────────
//      RENDER
//   ───────────────────────────────────────── */
//   return (
//     <Modal
//       transparent visible={visible} animationType="none"
//       onRequestClose={() => close()}
//       presentationStyle="overFullScreen" statusBarTranslucent hardwareAccelerated
//     >
//       <Pressable style={StyleSheet.absoluteFill} onPress={() => close()}>
//         <Animated.View style={[S.dim, { opacity: dimA }]} />
//       </Pressable>

//       <Animated.View style={[S.sheet, { transform: [{ translateY: slideY }] }]}>
//         {!person ? (
//           <View style={S.empty}>
//             <Text style={S.emptyT}>Nothing selected</Text>
//             <Pressable onPress={() => close()} style={S.emptyBtn}>
//               <Text style={S.emptyBtnT}>Close</Text>
//             </Pressable>
//           </View>
//         ) : (<>

//           {/* ── FLOATING TOP NAV ── */}
//           <View style={S.topNav}>
//             <Pressable onPress={() => close()} hitSlop={12} style={S.navBtn}>
//               <Ionicons name="chevron-back" size={20} color={C.ink} />
//             </Pressable>
//             <View style={{ flexDirection: "row", gap: 8 }}>
//               <Pressable onPress={handleShare} style={S.navBtn}>
//                 <Ionicons name="share-outline" size={18} color={C.ink} />
//               </Pressable>
//               <Pressable
//                 onPress={() => setSaved(v => !v)}
//                 style={[S.navBtn, saved && { backgroundColor: C.accentSoft, borderColor: C.accent + "55" }]}
//               >
//                 <Ionicons
//                   name={saved ? "bookmark" : "bookmark-outline"}
//                   size={18}
//                   color={saved ? C.accent : C.ink}
//                 />
//               </Pressable>
//             </View>
//           </View>

//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             bounces
//             contentContainerStyle={{ paddingBottom: 130 }}
//           >

//             {/* ── BANNER ── */}
//             <View style={S.bannerWrap}>
//               {bannerImg ? (
//                 <Image source={{ uri: bannerImg }} style={S.bannerImg} resizeMode="cover" />
//               ) : (
//                 // purple gradient bg (mimics your app's purple gradient banner)
//                 <View style={S.bannerDefault}>
//                   {/* soft gradient effect via layered views */}
//                   <View style={S.bannerGradLayer1} />
//                   <View style={S.bannerGradLayer2} />
//                   {/* decorative circles */}
//                   <View style={S.bCircle1} />
//                   <View style={S.bCircle2} />
//                   <View style={S.bCircle3} />
//                   {/* big emoji */}
//                   <Text style={S.bannerEmoji}>{(person as any)?.emoji || "📍"}</Text>
//                 </View>
//               )}
//               {/* kind badge — bottom right */}
//               <View style={S.bannerBadge}>
//                 <Text style={S.bannerBadgeEmoji}>{kindEmoji}</Text>
//                 <Text style={S.bannerBadgeText}>{kindLabel.toUpperCase()}</Text>
//               </View>
//             </View>

//             {/* ── TITLE BLOCK ── */}
//             <View style={S.titleBlock}>
//               {/* status pills */}
//               <View style={S.titleMeta}>
//                 {isCreator && (
//                   <View style={[S.metaPill, { backgroundColor: C.accentSoft, borderColor: C.accent + "44" }]}>
//                     <Ionicons name="shield-checkmark" size={11} color={C.accent} />
//                     <Text style={[S.metaPillText, { color: C.accentText }]}>You're hosting</Text>
//                   </View>
//                 )}
//                 <View style={[
//                   S.metaPill,
//                   isActive
//                     ? { backgroundColor: C.greenSoft, borderColor: C.green + "44" }
//                     : { backgroundColor: C.amberSoft, borderColor: C.amber + "44" },
//                 ]}>
//                   <View style={[S.metaDot, { backgroundColor: isActive ? C.green : C.amber }]} />
//                   <Text style={[S.metaPillText, { color: isActive ? C.green : C.amber }]}>
//                     {isActive ? "Live" : "Paused"}
//                   </Text>
//                 </View>
//               </View>

//               <Text style={S.eventTitle} numberOfLines={3}>
//                 {(person as any)?.title || "Untitled Event"}
//               </Text>

//               {!!descText && (
//                 <Text style={S.descSnippet} numberOfLines={descExpanded ? 0 : 3}>
//                   {descText}
//                 </Text>
//               )}
//               {!!descText && descText.length > 120 && (
//                 <Pressable onPress={() => setDescExpanded(v => !v)} style={{ marginTop: 6 }}>
//                   <Text style={S.readMore}>
//                     {descExpanded ? "Show less ↑" : "Read more ↓"}
//                   </Text>
//                 </Pressable>
//               )}

//               {!!D?.dateChip && (
//                 <ScrollView
//                   horizontal showsHorizontalScrollIndicator={false}
//                   style={{ marginTop: 14 }}
//                   contentContainerStyle={{ gap: 8, paddingRight: 4 }}
//                 >
//                   <View style={S.dateChipOn}>
//                     <Ionicons name="calendar" size={12} color="#fff" />
//                     <Text style={S.dateChipOnText}>{D.dateChip}</Text>
//                   </View>
//                   <View style={S.dateChipOff}>
//                     <Text style={S.dateChipOffText}>All dates</Text>
//                   </View>
//                 </ScrollView>
//               )}
//             </View>

//             {/* ── DATE + LOCATION + PRICE ── */}
//             <View style={S.infoCard}>
//               {!!D?.dateLong && (
//                 <>
//                   <View style={S.infoRow}>
//                     <View style={[S.infoIcon, { backgroundColor: C.accentSoft }]}>
//                       <Ionicons name="calendar" size={18} color={C.accent} />
//                     </View>
//                     <View style={S.infoBody}>
//                       <Text style={S.infoTitle}>{D.dateLong}</Text>
//                       {(person as any)?.time && <Text style={S.infoSub}>{(person as any).time}</Text>}
//                     </View>
//                     <Ionicons name="chevron-forward" size={14} color={C.hint} />
//                   </View>
//                   <View style={S.rowSep} />
//                 </>
//               )}

//               <View style={S.infoRow}>
//                 <View style={[S.infoIcon, { backgroundColor: "rgba(239,68,68,0.09)" }]}>
//                   <Ionicons name="location" size={18} color={C.red} />
//                 </View>
//                 <View style={S.infoBody}>
//                   <Text style={S.infoTitle} numberOfLines={1}>{D?.venueLine || "Location not set"}</Text>
//                   {!!D?.cityLine && <Text style={S.infoSub} numberOfLines={1}>{D.cityLine}</Text>}
//                 </View>
//                 <Pressable onPress={openMaps} hitSlop={10}>
//                   <Ionicons name="map-outline" size={18} color={C.accent} />
//                 </Pressable>
//               </View>

//               {(kind === "service" || isPaid) && !!priceLabel && (
//                 <>
//                   <View style={S.rowSep} />
//                   <View style={S.infoRow}>
//                     <View style={[S.infoIcon, { backgroundColor: C.accentSoft }]}>
//                       <Ionicons name="pricetag" size={18} color={C.accent} />
//                     </View>
//                     <View style={S.infoBody}>
//                       <Text style={[S.infoTitle, { color: C.accent, fontWeight: "900" }]}>{priceLabel}</Text>
//                       <Text style={S.infoSub}>{kind === "service" ? "per session" : "per person"}</Text>
//                     </View>
//                   </View>
//                 </>
//               )}
//             </View>

//             {/* ── ORGANISER ── */}
//             <View style={S.card}>
//               <Text style={S.cardTitle}>Organizer</Text>
//               <Pressable
//                 onPress={() => {
//                   if (!creatorClerkId) return;
//                   router.push({
//                     pathname: "/profile/[clerkUserId]",
//                     params: { clerkUserId: creatorClerkId, name: creatorName, imageUrl: creatorPhoto },
//                   } as any);
//                 }}
//                 style={({ pressed }) => [S.orgRow, pressed && { opacity: 0.78 }]}
//               >
//                 <View style={S.orgAvatarWrap}>
//                   {creatorPhoto
//                     ? <Image source={{ uri: creatorPhoto }} style={S.orgAvatar} />
//                     : (
//                       <View style={[S.orgAvatarFallback, { backgroundColor: C.accentSoft }]}>
//                         <Text style={[S.orgInitial, { color: C.accent }]}>
//                           {creatorName.charAt(0).toUpperCase()}
//                         </Text>
//                       </View>
//                     )
//                   }
//                   {/* purple ring around avatar — like your profile photo */}
//                   <View style={S.orgAvatarRing} />
//                   <View style={[S.onlineDot, { backgroundColor: C.green }]} />
//                 </View>
//                 <View style={{ flex: 1 }}>
//                   <Text style={S.orgName}>{creatorName}</Text>
//                   {!!creatorAbout && <Text style={S.orgAbout} numberOfLines={1}>{creatorAbout}</Text>}
//                   {isCreator && (
//                     <View style={S.superBadge}>
//                       <Ionicons name="shield-checkmark" size={11} color={C.accent} />
//                       <Text style={S.superBadgeText}>Super Organizer</Text>
//                     </View>
//                   )}
//                 </View>
//                 {loadingCreator
//                   ? <ActivityIndicator size="small" color={C.accent} />
//                   : <Ionicons name="chevron-forward" size={14} color={C.hint} />
//                 }
//               </Pressable>
//             </View>

//             {/* ── WHO'S GOING ── */}
//             {kind === "free" && D && (
//               <View style={S.card}>
//                 <View style={S.cardTitleRow}>
//                   <Text style={S.cardTitle}>Who's Going</Text>
//                   <View style={[
//                     S.joinStatusPill,
//                     isFull
//                       ? { backgroundColor: C.redSoft,       borderColor: C.red + "33" }
//                       : D.joinPolicy === "approval"
//                       ? { backgroundColor: C.purpleAltSoft, borderColor: C.purpleAlt + "33" }
//                       : { backgroundColor: C.greenSoft,     borderColor: C.green + "33" },
//                   ]}>
//                     <View style={[S.joinDot, {
//                       backgroundColor: isFull ? C.red : D.joinPolicy === "approval" ? C.purpleAlt : C.green,
//                     }]} />
//                     <Text style={[S.joinStatusText, {
//                       color: isFull ? C.red : D.joinPolicy === "approval" ? C.purpleAlt : C.green,
//                     }]}>
//                       {isFull ? "Full" : D.joinPolicy === "approval" ? "Approval" : "Open"}
//                     </Text>
//                   </View>
//                 </View>

//                 <TouchableOpacity activeOpacity={0.8} onPress={openAttendees} style={S.goingRow}>
//                   <View style={S.avatarStack}>
//                     {D.attendees.slice(0, 5).map((a: any, i: number) => {
//                       const palettes = [C.accent, "#F97316", "#10B981", "#8B5CF6", "#EC4899"];
//                       return (
//                         <View key={i} style={[S.stackAvatar, {
//                           left: i * 26, zIndex: 10 - i,
//                           borderColor: C.card, backgroundColor: palettes[i % 5],
//                         }]}>
//                           {a?.profilePhoto
//                             ? <Image source={{ uri: a.profilePhoto }} style={S.stackAvatarImg} />
//                             : <Text style={S.stackLetter}>{(a?.name || "?").charAt(0).toUpperCase()}</Text>
//                           }
//                         </View>
//                       );
//                     })}
//                     {D.joined > 5 && (
//                       <View style={[S.stackAvatar, {
//                         left: 5 * 26, zIndex: 0,
//                         borderColor: C.card, backgroundColor: C.surface,
//                       }]}>
//                         <Text style={[S.stackLetter, { color: C.muted, fontSize: 10 }]}>+{D.joined - 5}</Text>
//                       </View>
//                     )}
//                   </View>
//                   <View style={{ marginLeft: Math.min(D.joined, 6) * 26 + 12, flex: 1 }}>
//                     <Text style={S.goingCount}>
//                       <Text style={{ color: C.accent, fontWeight: "900" }}>{D.joined}</Text>
//                       {D.capacity ? ` / ${D.capacity}` : ""} going
//                     </Text>
//                     <Text style={S.goingTap}>See who's going →</Text>
//                   </View>
//                 </TouchableOpacity>

//                 {D.capacity && (
//                   <View style={{ marginTop: 16 }}>
//                     <View style={S.barTrack}>
//                       <View style={[S.barFill, {
//                         width: `${pct}%` as any,
//                         backgroundColor: isFull ? C.red : pct > 75 ? C.amber : C.accent,
//                       }]} />
//                     </View>
//                     <View style={S.barRow}>
//                       <Text style={S.barLabel}>{D.joined} going</Text>
//                       <Text style={[S.barLabel, { color: isFull ? C.red : C.muted }]}>
//                         {isFull ? "🔴 Sold out" : `${D.capacity - D.joined} spots left`}
//                       </Text>
//                     </View>
//                   </View>
//                 )}

//                 {D.isPending && (
//                   <View style={S.pendingBanner}>
//                     <View style={S.pendingIcon}>
//                       <Text style={{ fontSize: 18 }}>⏳</Text>
//                     </View>
//                     <View style={{ flex: 1 }}>
//                       <Text style={S.pendingT}>Awaiting host approval</Text>
//                       <Text style={S.pendingS}>You'll be notified once admitted.</Text>
//                     </View>
//                   </View>
//                 )}
//               </View>
//             )}

//             {/* ── MAP ── */}
//             {(D?.venueLine || D?.cityLine) && (
//               <View style={S.card}>
//                 <Text style={S.cardTitle}>Location</Text>
//                 <View style={S.mapCard}>
//                   {staticMapUrl ? (
//                     <Pressable onPress={openMaps}>
//                       <Image source={{ uri: staticMapUrl }} style={S.mapImg} resizeMode="cover" />
//                     </Pressable>
//                   ) : (
//                     <Pressable onPress={openMaps} style={S.mapFallback}>
//                       <View style={[S.road, { top: "47%", width: "100%", height: 3 }]} />
//                       <View style={[S.road, { left: "40%", height: "100%", width: 2 }]} />
//                       <View style={[S.road, { top: "70%", width: "100%", height: 1.5, opacity: 0.5 }]} />
//                       <View style={[S.mapBlock, { top: "6%",  left: "5%",  width: "22%", height: "28%" }]} />
//                       <View style={[S.mapBlock, { bottom: "6%", right: "6%", width: "28%", height: "20%" }]} />
//                       <View style={[S.mapBlock, { top: "10%", right: "12%", width: "18%", height: "18%" }]} />
//                       <View style={S.mapPinWrap}>
//                         <View style={S.mapPinPulse} />
//                         <View style={S.mapPinCircle}>
//                           <Ionicons name="location" size={18} color="#fff" />
//                         </View>
//                       </View>
//                       <View style={S.mapTapHint}>
//                         <Text style={S.mapTapHintText}>Tap to open maps ↗</Text>
//                       </View>
//                     </Pressable>
//                   )}
//                   <View style={S.mapFooter}>
//                     <View style={S.mapAccentBar} />
//                     <View style={{ flex: 1 }}>
//                       <Text style={S.mapVenue} numberOfLines={1}>{D.venueLine}</Text>
//                       {!!D.cityLine && <Text style={S.mapCity} numberOfLines={1}>{D.cityLine}</Text>}
//                     </View>
//                     <Pressable onPress={openMaps} style={S.mapOpenBtn}>
//                       <Text style={S.mapOpenBtnText}>Open ↗</Text>
//                     </Pressable>
//                   </View>
//                 </View>
//               </View>
//             )}

//             {/* ── TAGS ── */}
//             {!!D?.tags?.length && (
//               <View style={S.card}>
//                 <View style={S.tagsWrap}>
//                   {D.tags.map((t, i) => (
//                     <View key={i} style={S.tagPill}>
//                       <Text style={S.tagText}>#{t}</Text>
//                     </View>
//                   ))}
//                 </View>
//               </View>
//             )}

//             {/* ── SERVICE TOGGLE ── */}
//             {isCreator && kind === "service" && (
//               <View style={S.card}>
//                 <View style={S.toggleRow}>
//                   <View style={{ flex: 1 }}>
//                     <Text style={S.toggleLabel}>Availability</Text>
//                     <Text style={S.toggleSub}>
//                       {serviceEnabled ? "Accepting bookings" : "Paused — not accepting"}
//                     </Text>
//                   </View>
//                   {togglingService
//                     ? <ActivityIndicator color={C.accent} />
//                     : (
//                       <Switch
//                         value={serviceEnabled} onValueChange={patchService}
//                         trackColor={{ false: C.hint, true: C.accent }}
//                         thumbColor={C.card} ios_backgroundColor={C.hint}
//                       />
//                     )
//                   }
//                 </View>
//               </View>
//             )}

//             {/* ── DELETE ── */}
//             {isCreator && (
//               <Pressable
//                 onPress={handleDelete}
//                 style={({ pressed }) => [S.deleteRow, pressed && { opacity: 0.55 }]}
//               >
//                 <Ionicons name="trash-outline" size={13} color={C.hint} />
//                 <Text style={S.deleteText}>Delete this event</Text>
//               </Pressable>
//             )}

//           </ScrollView>

//           {/* ── CTA BAR ── */}
//           <View style={S.ctaBar}>
//             <View style={S.ctaLeft}>
//               <Text style={S.ctaPrice}>
//                 {(isPaid || kind === "service") && priceLabel ? priceLabel : "Free"}
//               </Text>
//               {(isPaid || kind === "service") && !!priceLabel
//                 ? <Text style={S.ctaPriceSub}>{kind === "service" ? "/session" : "/person"}</Text>
//                 : <Text style={S.ctaPriceSub}>no charge</Text>
//               }
//             </View>
//             <View style={{ flex: 1 }}>
//               {isCreator ? (
//                 <Pressable
//                   onPress={() => close(() => onEditDetails?.(person))}
//                   style={({ pressed }) => [S.ctaBtn, pressed && { opacity: 0.85 }]}
//                 >
//                   <Ionicons name="create-outline" size={16} color="#fff" />
//                   <Text style={S.ctaBtnText}>Edit Event</Text>
//                 </Pressable>
//               ) : kind === "free" ? (
//                 <JoinEventButton
//                   eventId={String((person as any)?._id || (person as any)?.id || "")}
//                   kind={((person as any)?.kind || "free") as any}
//                   priceCents={(person as any)?.priceCents ?? null}
//                   joinPolicy={((person as any)?.joinPolicy || "open") as any}
//                   onJoined={() => close()}
//                 />
//               ) : (
//                 <JoinEventButton
//                   eventId={eventId} kind={kind as any} priceCents={priceCents}
//                   eventTitle={String((person as any)?.title || "Event")}
//                   joinPolicy={((person as any)?.joinPolicy || "open") as any}
//                   onJoined={() => close()}
//                   disabled={kind === "service" && statusLocal.toLowerCase() === "paused"}
//                 />
//               )}
//             </View>
//           </View>

//         </>)}
//       </Animated.View>
//     </Modal>
//   );
// }

// /* ─────────────────────────────────────────────
//    STYLES
// ───────────────────────────────────────────── */
// const S = StyleSheet.create({
//   dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.52)" },

//   sheet: {
//     position: "absolute", left: 0, right: 0, bottom: 0,
//     height: "96%",
//     backgroundColor: C.pageBg,
//     borderTopLeftRadius: 22, borderTopRightRadius: 22,
//     overflow: "hidden",
//     shadowColor: "#000", shadowOffset: { width: 0, height: -6 },
//     shadowOpacity: 0.10, shadowRadius: 24, elevation: 24,
//   },

//   empty:     { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
//   emptyT:    { color: C.ink, fontSize: 17, fontWeight: "900", marginBottom: 16 },
//   emptyBtn:  { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 999, backgroundColor: C.accent },
//   emptyBtnT: { color: "#fff", fontWeight: "900", fontSize: 15 },

//   /* TOP NAV */
//   topNav: {
//     position: "absolute", top: Platform.OS === "ios" ? 14 : 8,
//     left: 14, right: 14,
//     flexDirection: "row", alignItems: "center", justifyContent: "space-between",
//     zIndex: 200,
//   },
//   navBtn: {
//     width: 36, height: 36, borderRadius: 18,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     alignItems: "center", justifyContent: "center",
//     borderWidth: 1, borderColor: "rgba(0,0,0,0.09)",
//     shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
//   },

//   /* BANNER */
//   bannerWrap:    { height: 230, width: "100%", overflow: "hidden", position: "relative" },
//   bannerImg:     { width: "100%", height: "100%" },
//   bannerDefault: {
//     width: "100%", height: "100%",
//     backgroundColor: C.gradStart,     // base purple
//     alignItems: "center", justifyContent: "center", overflow: "hidden",
//   },
//   // layered gradient simulation
//   bannerGradLayer1: {
//     position: "absolute", left: 0, top: 0, right: 0, bottom: 0,
//     backgroundColor: C.gradEnd, opacity: 0.55,
//   },
//   bannerGradLayer2: {
//     position: "absolute", left: 0, top: 0, width: "60%", height: "100%",
//     backgroundColor: C.gradStart, opacity: 0.5,
//   },
//   bCircle1: {
//     position: "absolute", width: 260, height: 260, borderRadius: 130,
//     backgroundColor: "#fff", opacity: 0.06, top: -100, right: -70,
//   },
//   bCircle2: {
//     position: "absolute", width: 180, height: 180, borderRadius: 90,
//     backgroundColor: "#fff", opacity: 0.05, bottom: -70, left: -40,
//   },
//   bCircle3: {
//     position: "absolute", width: 100, height: 100, borderRadius: 50,
//     backgroundColor: "#fff", opacity: 0.04, top: 20, left: 10,
//   },
//   bannerEmoji: { fontSize: 82, zIndex: 2 },

//   bannerBadge: {
//     position: "absolute", bottom: 14, right: 14,
//     flexDirection: "row", alignItems: "center", gap: 5,
//     backgroundColor: "rgba(255,255,255,0.20)",
//     borderWidth: 1, borderColor: "rgba(255,255,255,0.30)",
//     paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
//   },
//   bannerBadgeEmoji: { fontSize: 11 },
//   bannerBadgeText:  { fontSize: 10, fontWeight: "900", color: "#fff", letterSpacing: 0.8 },

//   /* TITLE BLOCK */
//   titleBlock: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14 },
//   titleMeta:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
//   metaPill: {
//     flexDirection: "row", alignItems: "center", gap: 5,
//     paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1,
//   },
//   metaDot:     { width: 7, height: 7, borderRadius: 3.5 },
//   metaPillText:{ fontSize: 12, fontWeight: "700" },
//   eventTitle: {
//     fontSize: 26, fontWeight: "900", color: C.ink,
//     letterSpacing: -0.6, lineHeight: 32, marginBottom: 10,
//   },
//   descSnippet: { fontSize: 14, color: C.muted, lineHeight: 21 },
//   readMore:    { fontSize: 13, fontWeight: "800", color: C.accent },
//   dateChipOn: {
//     flexDirection: "row", alignItems: "center", gap: 6,
//     paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
//     backgroundColor: C.accent,
//   },
//   dateChipOnText:  { color: "#fff", fontWeight: "800", fontSize: 13 },
//   dateChipOff: {
//     paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
//     backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
//   },
//   dateChipOffText: { fontSize: 13, fontWeight: "600", color: C.muted },

//   /* INFO CARD */
//   infoCard: {
//     marginHorizontal: 14, marginTop: 4,
//     backgroundColor: C.card, borderRadius: 16,
//     borderWidth: 0.5, borderColor: C.border, overflow: "hidden",
//     shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04, shadowRadius: 5, elevation: 2,
//   },
//   infoRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
//   rowSep:   { height: 0.5, backgroundColor: C.sep, marginHorizontal: 14 },
//   infoIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
//   infoBody: { flex: 1 },
//   infoTitle:{ fontSize: 14, fontWeight: "700", color: C.ink2 },
//   infoSub:  { fontSize: 12, color: C.muted, marginTop: 2 },

//   /* GENERIC CARD */
//   card: {
//     marginHorizontal: 14, marginTop: 10,
//     backgroundColor: C.card, borderRadius: 16,
//     borderWidth: 0.5, borderColor: C.border, padding: 16,
//     shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
//   },
//   cardTitle:    { fontSize: 16, fontWeight: "800", color: C.ink, marginBottom: 14 },
//   cardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },

//   /* ORGANISER */
//   orgRow: {
//     flexDirection: "row", alignItems: "center", gap: 14,
//     padding: 12, borderRadius: 14, backgroundColor: C.surface,
//   },
//   orgAvatarWrap:    { position: "relative", flexShrink: 0 },
//   orgAvatar:        { width: 50, height: 50, borderRadius: 25 },
//   orgAvatarFallback:{ width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
//   orgAvatarRing: {
//     // purple ring around avatar (like your profile screenshot)
//     position: "absolute", top: -2.5, left: -2.5,
//     width: 55, height: 55, borderRadius: 27.5,
//     borderWidth: 2.5, borderColor: C.accent, opacity: 0.55,
//   },
//   orgInitial: { fontSize: 22, fontWeight: "900" },
//   onlineDot: {
//     position: "absolute", bottom: 1, right: 1,
//     width: 13, height: 13, borderRadius: 6.5,
//     borderWidth: 2, borderColor: C.card,
//   },
//   orgName:  { fontSize: 15, fontWeight: "800", color: C.ink, marginBottom: 2 },
//   orgAbout: { fontSize: 12, color: C.muted },
//   superBadge: {
//     flexDirection: "row", alignItems: "center", gap: 4,
//     alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3,
//     borderRadius: 999, backgroundColor: C.accentSoft, marginTop: 5,
//   },
//   superBadgeText: { fontSize: 11, fontWeight: "700", color: C.accentText },

//   /* GOING */
//   joinStatusPill: {
//     flexDirection: "row", alignItems: "center", gap: 5,
//     paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1,
//   },
//   joinDot:       { width: 7, height: 7, borderRadius: 3.5 },
//   joinStatusText:{ fontSize: 11, fontWeight: "700" },
//   goingRow: { flexDirection: "row", alignItems: "center", minHeight: 50, position: "relative" },
//   avatarStack: { position: "absolute", left: 0, flexDirection: "row", height: 42 },
//   stackAvatar: {
//     position: "absolute", width: 40, height: 40, borderRadius: 20,
//     borderWidth: 2.5, overflow: "hidden", alignItems: "center", justifyContent: "center",
//   },
//   stackAvatarImg: { width: 40, height: 40 },
//   stackLetter:    { color: "#fff", fontWeight: "900", fontSize: 14 },
//   goingCount: { fontSize: 15, fontWeight: "700", color: C.ink2 },
//   goingTap:   { fontSize: 12, fontWeight: "700", color: C.accent, marginTop: 3 },
//   barTrack:   { height: 5, backgroundColor: C.surface, borderRadius: 999, overflow: "hidden" },
//   barFill:    { height: "100%" as any, borderRadius: 999 },
//   barRow:     { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
//   barLabel:   { fontSize: 11, fontWeight: "600", color: C.muted },
//   pendingBanner: {
//     flexDirection: "row", alignItems: "center", gap: 12,
//     marginTop: 14, padding: 12, borderRadius: 12,
//     backgroundColor: "#FFFBEC", borderWidth: 1, borderColor: "rgba(180,83,9,0.25)",
//   },
//   pendingIcon: {
//     width: 38, height: 38, borderRadius: 10,
//     backgroundColor: C.amberSoft, alignItems: "center", justifyContent: "center",
//   },
//   pendingT: { fontSize: 13, fontWeight: "800", color: "#92400E" },
//   pendingS: { fontSize: 11, color: "#92400E", opacity: 0.75, marginTop: 2 },

//   /* MAP */
//   mapCard:    { borderRadius: 14, overflow: "hidden", borderWidth: 0.5, borderColor: C.border },
//   mapImg:     { width: "100%", height: 160 },
//   mapFallback:{
//     height: 160, backgroundColor: C.accentSoft,
//     alignItems: "center", justifyContent: "center",
//     position: "relative", overflow: "hidden",
//   },
//   road:     { position: "absolute", backgroundColor: "rgba(255,255,255,0.85)" },
//   mapBlock: { position: "absolute", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.45)" },
//   mapPinWrap:  { alignItems: "center", justifyContent: "center" },
//   mapPinPulse: { position: "absolute", width: 58, height: 58, borderRadius: 29, backgroundColor: C.accent + "28" },
//   mapPinCircle:{
//     width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent,
//     alignItems: "center", justifyContent: "center",
//     borderWidth: 3, borderColor: "#fff",
//     shadowColor: C.accent, shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
//   },
//   mapTapHint:     { position: "absolute", bottom: 10, left: 0, right: 0, alignItems: "center" },
//   mapTapHintText: { fontSize: 11, fontWeight: "700", color: C.accentText },
//   mapFooter: {
//     flexDirection: "row", alignItems: "center",
//     paddingHorizontal: 14, paddingVertical: 13,
//     backgroundColor: C.card, gap: 12,
//     borderTopWidth: 0.5, borderTopColor: C.border,
//   },
//   mapAccentBar:   { width: 3, height: 36, borderRadius: 2, backgroundColor: C.accent },
//   mapVenue:       { fontSize: 14, fontWeight: "800", color: C.ink },
//   mapCity:        { fontSize: 12, color: C.muted, marginTop: 2 },
//   mapOpenBtn: {
//     paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
//     backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent + "44",
//   },
//   mapOpenBtnText: { fontSize: 12, fontWeight: "800", color: C.accentText },

//   /* TAGS */
//   tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
//   tagPill: {
//     paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
//     backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accent + "44",
//   },
//   tagText: { fontSize: 13, fontWeight: "700", color: C.accentText },

//   /* TOGGLE */
//   toggleRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
//   toggleLabel:{ fontSize: 15, fontWeight: "700", color: C.ink },
//   toggleSub:  { fontSize: 12, color: C.muted, marginTop: 3 },

//   /* DELETE */
//   deleteRow: {
//     flexDirection: "row", alignItems: "center", justifyContent: "center",
//     gap: 8, paddingVertical: 20, marginHorizontal: 14,
//   },
//   deleteText: { fontSize: 13, color: C.hint, fontWeight: "600" },

//   /* CTA BAR */
//   ctaBar: {
//     position: "absolute", bottom: 0, left: 0, right: 0,
//     flexDirection: "row", alignItems: "center",
//     paddingHorizontal: 20, paddingTop: 14,
//     paddingBottom: Platform.OS === "ios" ? 36 : 18,
//     backgroundColor: C.pageBg,
//     borderTopWidth: 0.5, borderTopColor: C.border, gap: 18,
//     shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.05, shadowRadius: 8, elevation: 8,
//   },
//   ctaLeft:     { minWidth: 58 },
//   ctaPrice:    { fontSize: 22, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
//   ctaPriceSub: { fontSize: 11, color: C.muted, marginTop: 1 },
//   ctaBtn: {
//     flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
//     height: 52, borderRadius: 14,
//     // purple gradient button — like your app's Verify button
//     backgroundColor: C.accent,
//     shadowColor: C.accent, shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.30, shadowRadius: 12, elevation: 7,
//   },
//   ctaBtnText: { fontSize: 16, fontWeight: "900", color: "#fff" },
// });
// components/ClickPin/PersonBookingSheet.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal, View, Text, StyleSheet, Pressable, Image,
  ActivityIndicator, ScrollView, Animated, Easing,
  Platform, Switch, Alert, Share, TouchableOpacity, Linking,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { EventPin } from "../Map/MapView";
import JoinEventButton from "./JoinEventButton";
import { apiFetch } from "../../lib/apiFetch";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const C = {
  pageBg: "#FFFFFF",
  surface: "#F7F7F7",
  card: "#FFFFFF",
  border: "rgba(0,0,0,0.07)",
  sep: "rgba(0,0,0,0.05)",
  ink: "#0F0F0F",
  ink2: "#2C2C2C",
  muted: "#717171",
  hint: "#C0C0C0",

  green: "#1DB954",
  greenSoft: "rgba(29,185,84,0.10)",
  greenBorder: "rgba(29,185,84,0.30)",
  greenDark: "#0F9640",

  amber: "#F59E0B",
  amberSoft: "rgba(245,158,11,0.09)",
  red: "#EF4444",
  redSoft: "rgba(239,68,68,0.09)",
  accent: "#1DB954",
  accentSoft: "rgba(29,185,84,0.09)",
  accentText: "#0F9640",
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function parseDateObj(ev: any): Date | null {
  if (ev?.startsAt) {
    const t = new Date(ev.startsAt);
    if (Number.isFinite(t.getTime())) return t;
  }
  if (typeof ev?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
    const [y, m, d] = ev.date.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  return null;
}
function fmtLong(ev: any) {
  const d = parseDateObj(ev);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function fmtShort(ev: any) {
  const d = parseDateObj(ev);
  if (!d) return "";
  const day = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const date = d.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
  const time = (ev as any)?.time ? ` • ${(ev as any).time}` : "";
  return `${day}, ${date}${time}`;
}
function pick(...vs: any[]) {
  for (const v of vs) if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}
function fromCents(c: any) {
  const n = typeof c === "string" ? Number(c) : c;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? (n / 100).toFixed(0) : "";
}
function fromCentsLabel(c: any) {
  const v = fromCents(c);
  return v ? `₹${v}` : "";
}

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type Props = {
  visible: boolean;
  onClose: () => void;
  person?: EventPin | null;
  onEditDetails?: (ev: EventPin) => void;
  onStatusChanged?: (id: string, s: string) => void;
  onDeleteEvent?: (id: string) => void;
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function PersonBookingSheet({
  visible, onClose, person,
  onEditDetails, onStatusChanged, onDeleteEvent,
}: Props) {
  const router = useRouter();
  const { userId } = useAuth();

  const eventId = String(
    (person as any)?._id?.$oid || (person as any)?._id?.oid ||
    (person as any)?._id || (person as any)?.id || (person as any)?.eventId || ""
  );
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;
  const creatorClerkId =
    (person as any)?.creatorClerkId || (person as any)?.creator?.clerkUserId || (person as any)?.creatorId || "";

  const kind: "free" | "service" | "paid" | "event_free" | "event_paid" =
    ((person as any)?.kind || "free") as any;
  const isPaid = kind === "paid" || kind === "event_paid";
  const priceLabel = fromCentsLabel((person as any)?.priceCents);
  const priceCents: number | null = (person as any)?.priceCents ?? null;
  const isCreator = !!userId && !!creatorClerkId && String(userId) === String(creatorClerkId);
  const bannerImg = (person as any)?.imageUrl || (person as any)?.coverImage || (person as any)?.image || "";

  /* ── state ── */
  const [statusLocal, setStatusLocal] = useState("active");
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [togglingService, setTogglingService] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creator, setCreator] = useState<any>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const descText = pick((person as any)?.description, (person as any)?.desc, "");

  useEffect(() => {
    if (!visible || !person) return;
    const s = String((person as any)?.status || "active");
    setStatusLocal(s); setServiceEnabled(s.toLowerCase() !== "paused");
    setSaved(false);
  }, [visible, eventId, person]);

  useEffect(() => {
    if (!visible || !API_BASE || !creatorClerkId) return;
    let dead = false;
    (async () => {
      setLoadingCreator(true);
      try {
        const r = await apiFetch(
          `${API_BASE}/api/users/get-user?clerkUserId=${encodeURIComponent(creatorClerkId)}`,
          { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined }
        );
        const j = await r.json().catch(() => null);
        if (!dead) setCreator(r.ok ? j?.user ?? null : null);
      } catch { if (!dead) setCreator(null); }
      finally { if (!dead) setLoadingCreator(false); }
    })();
    return () => { dead = true; };
  }, [visible, API_BASE, EVENT_API_KEY, creatorClerkId]);

  const creatorName = pick(
    creator?.profile?.firstName && creator?.profile?.lastName
      ? `${creator.profile.firstName} ${creator.profile.lastName}` : "",
    creator?.profile?.firstName, "Organizer"
  );
  const creatorAbout = pick(creator?.profile?.about, "");
  const creatorPhoto = creator?.profile?.photos?.[0] || "";

  const D = useMemo(() => {
    if (!person) return null;
    const loc = (person as any)?.location || {};
    const address = pick(loc.formattedAddress, loc.address, (person as any)?.address, "");
    const city = pick(loc.city, (person as any)?.city);
    const region = pick(loc.admin1Code, loc.admin1, (person as any)?.region, (person as any)?.state);
    const country = pick(loc.countryCode, loc.country, (person as any)?.country);
    const lat = loc.lat || (person as any)?.lat;
    const lng = loc.lng || (person as any)?.lng;
    const attendees = Array.isArray((person as any)?.attendees) ? (person as any).attendees : [];
    const pending = Array.isArray((person as any)?.pendingRequests) ? (person as any).pendingRequests : [];
    const cap = (person as any)?.attendance;
    return {
      address,
      venueLine: address.split(",")[0] || "",
      cityLine: [city, region, country].filter(Boolean).join(", "),
      dateLong: fmtLong(person),
      dateShort: fmtShort(person),
      lat, lng,
      tags: Array.isArray((person as any)?.tags) ? (person as any).tags as string[] : [],
      joined: attendees.length,
      capacity: typeof cap === "number" ? cap : parseInt(String(cap || ""), 10) || null,
      isPending: !!userId && pending.some((p: any) => String(p.clerkUserId) === String(userId)),
      joinPolicy: (person as any)?.joinPolicy as "open" | "approval" | undefined,
      attendees,
      spotsLeft: cap ? Math.max(0, cap - attendees.length) : null,
    };
  }, [person, userId]);

  const staticMapUrl = useMemo(() => {
    if (!D?.lat || !D?.lng || !GOOGLE_KEY) return null;
    const lat = Number(D.lat), lng = Number(D.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&scale=2&markers=color:0x1DB954%7C${lat},${lng}&style=feature:poi%7Cvisibility:off&key=${GOOGLE_KEY}`;
  }, [D?.lat, D?.lng, GOOGLE_KEY]);

  const openMaps = () => {
    if (!D?.lat || !D?.lng) return;
    const lat = Number(D.lat), lng = Number(D.lng);
    const label = encodeURIComponent(D.venueLine || "Event location");
    const iosUrl = `maps://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
    const andUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const native = Platform.OS === "ios" ? iosUrl : andUrl;
    Linking.canOpenURL(native).then(ok => Linking.openURL(ok ? native : webUrl)).catch(() => Linking.openURL(webUrl));
  };

  const openAttendees = () => {
    close(() => {
      router.push({ pathname: "/event/[eventId]/attendees" as any, params: { eventId } });
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: (person as any)?.title || "Check out this event",
        message: `${(person as any)?.title || "Event"}${D?.dateLong ? `\n📅 ${D.dateLong}` : ""}${D?.address ? `\n📍 ${D.address}` : ""}\n\nJoin on Assisto!`,
      });
    } catch { }
  };

  const handleDelete = () => {
    Alert.alert("Delete Event?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          if (!API_BASE || !eventId || !userId) return;
          try {
            await apiFetch(`${API_BASE}/api/events/delete-event`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
              body: JSON.stringify({ eventId, creatorClerkId: userId }),
            });
            close(() => onDeleteEvent?.(eventId));
          } catch { Alert.alert("Error", "Failed to delete."); }
        },
      },
    ]);
  };

  const patchService = async (next: boolean) => {
    if (!API_BASE || !eventId || !creatorClerkId) return;
    const pe = serviceEnabled, ps = statusLocal, op = next ? "active" : "paused";
    setServiceEnabled(next); setStatusLocal(op); onStatusChanged?.(eventId, op);
    try {
      setTogglingService(true);
      const r = await apiFetch(`${API_BASE}/api/events/toggle-service`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
        body: JSON.stringify({ _id: eventId, creatorClerkId, enabled: next }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Failed");
      const ns = String(j?.status || j?.event?.status || op);
      setStatusLocal(ns); setServiceEnabled(ns.toLowerCase() !== "paused");
      onStatusChanged?.(eventId, ns);
    } catch { setServiceEnabled(pe); setStatusLocal(ps); onStatusChanged?.(eventId, ps); }
    finally { setTogglingService(false); }
  };

  /* ── animations ── */
  const slideY = useRef(new Animated.Value(900)).current;
  const dimA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    slideY.setValue(900); dimA.setValue(0);
    Animated.parallel([
      Animated.timing(dimA, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, tension: 65, friction: 13, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const close = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(dimA, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 900, duration: 230, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) { onClose(); after?.(); } });
  };

  const isActive = statusLocal.toLowerCase() === "active";
  const isFull = !!(D?.capacity && D.joined >= D.capacity);
  const pct = D?.capacity ? Math.min(100, (D.joined / D.capacity) * 100) : 100;
  const platformFee = priceCents ? Math.round(priceCents * 0.10) : 1000; // 10% or ₹10

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <Modal
      transparent visible={visible} animationType="none"
      onRequestClose={() => close()}
      presentationStyle="overFullScreen" statusBarTranslucent hardwareAccelerated
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => close()}>
        <Animated.View style={[S.dim, { opacity: dimA }]} />
      </Pressable>

      <Animated.View style={[S.sheet, { transform: [{ translateY: slideY }] }]}>
        {!person ? (
          <View style={S.empty}>
            <Text style={S.emptyT}>Nothing selected</Text>
            <Pressable onPress={() => close()} style={S.emptyBtn}>
              <Text style={S.emptyBtnT}>Close</Text>
            </Pressable>
          </View>
        ) : (<>

          {/* ── TOP NAV BAR ── */}
          <View style={S.topNav}>
            <Pressable onPress={() => close()} hitSlop={12} style={S.navBackBtn}>
              <Ionicons name="chevron-back" size={18} color={C.ink} />
              <Text style={S.navBackText}>Book Event</Text>
            </Pressable>
            <Pressable onPress={() => close()} hitSlop={16} style={S.navCloseBtn}>
              <Ionicons name="close" size={18} color={C.muted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces
            contentContainerStyle={{ paddingBottom: 140 }}
          >

            {/* ── BANNER ── */}
            <View style={S.bannerWrap}>
              {bannerImg ? (
                <Image source={{ uri: bannerImg }} style={S.bannerImg} resizeMode="cover" />
              ) : (
                <View style={S.bannerDefault}>
                  <Text style={S.bannerEmoji}>{(person as any)?.emoji || "📍"}</Text>
                </View>
              )}
       </View>     
{/* ✅ Ab ye banner ke niche hai */}
<View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
  <Text style={S.bannerTitle} numberOfLines={2}>
    {(person as any)?.title || "Untitled Event"}
  </Text>
</View>
              {/* <View style={S.bannerOverlay}>
                <Text style={S.bannerTitle} numberOfLines={2}>{(person as any)?.title || "Untitled Event"}</Text>
                <View style={S.bannerMeta}> */}
                  {/* <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.85)" />
                  <Text style={S.bannerMetaText}>
                    {D?.venueLine || "Location"} • {D?.dateShort || ""}
                  </Text> */}
                 
          

            {/* ── FREE EVENT BADGE ── */}
            {!isPaid && (
              <View style={S.freeBadgeRow}>
                <View style={S.freeBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={C.green} />
                  <Text style={S.freeBadgeText}>This event is </Text>
                  <Text style={[S.freeBadgeText, { color: C.green, fontWeight: "800" }]}>Completely Free</Text>
                </View>
              </View>
            )}

            {/* ── ORDER SUMMARY ── */}
            <View style={S.section}>
              <Text style={S.sectionTitle}>Order Summary</Text>

              <View style={S.orderCard}>
                {/* Organizer row */}
                <View style={S.orderOrgRow}>
                  <View style={S.orderOrgAvatar}>
                    {creatorPhoto
                      ? <Image source={{ uri: creatorPhoto }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                      : (
                        <View style={[S.orderOrgAvatarFallback]}>
                          <Text style={S.orderOrgInitial}>{creatorName.charAt(0).toUpperCase()}</Text>
                        </View>
                      )
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.orderOrgName}>{creatorName}</Text>
                    <Text style={S.orderOrgSub}>
                      {loadingCreator ? "Loading…" : "Events Hosted • Verified"}
                    </Text>
                  </View>
                  {!loadingCreator && (
                    <View style={S.verifiedBadge}>
                      <Ionicons name="checkmark" size={10} color={C.green} />
                      <Text style={S.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>

                <View style={S.orderDivider} />

                {/* Event line */}
                <View style={S.orderRow}>
                  <Text style={S.orderRowLabel}>{(person as any)?.title || "Event"}</Text>
                  <Text style={S.orderRowValue}>
                    {isPaid ? priceLabel : "Free"}
                  </Text>
                </View>
                <View style={S.orderRow}>
                  <Text style={S.orderRowLabel}>1 x Spot</Text>
                  <Text style={S.orderRowValue}> </Text>
                </View>

                <View style={S.orderDivider} />

                <View style={S.orderRow}>
                  <Text style={S.orderRowLabel}>Platform Fee</Text>
                  <Text style={S.orderRowValue}>₹{(platformFee / 100).toFixed(0)}</Text>
                </View>

                <View style={[S.orderDivider, { marginVertical: 8 }]} />

                <View style={S.orderRow}>
                  <Text style={[S.orderRowLabel, { fontWeight: "800", color: C.ink }]}>Total</Text>
                  {isPaid ? (
                    <Text style={[S.orderRowValue, { fontWeight: "800", color: C.green }]}>
                      {priceLabel}
                    </Text>
                  ) : (
                    <View style={S.totalFreePill}>
                      <Text style={S.totalFreePillText}>$0 • Free</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* ── EVENT DETAILS ── */}
            <View style={S.section}>
              <Text style={S.sectionTitle}>Event Details</Text>
              <View style={S.detailsCard}>
                {/* Tags / amenities */}
                {D?.tags && D.tags.length > 0 && (
                  <View style={S.tagsRow}>
                    {D.tags.map((t, i) => (
                      <View key={i} style={S.tagChip}>
                        <Text style={S.tagChipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Description */}
                {!!descText && (
                  <Text style={S.detailDesc} numberOfLines={3}>{descText}</Text>
                )}

                <View style={S.orderDivider} />

                {/* 3-column info row */}
                <View style={S.infoTriple}>
                  {!!D?.dateShort && (
                    <View style={S.infoTripleItem}>
                      <View style={S.infoTripleIcon}>
                        <Ionicons name="calendar" size={16} color={C.green} />
                      </View>
                      <Text style={S.infoTripleLabel}>
                        {D.dateShort.split("•")[0]?.trim() || ""}
                      </Text>
                      <Text style={S.infoTripleSub}>
                        {D.dateShort.split("•")[1]?.trim() || ""}
                      </Text>
                    </View>
                  )}
                  {!!D?.venueLine && (
                    <View style={S.infoTripleItem}>
                      <View style={[S.infoTripleIcon, { backgroundColor: "rgba(239,68,68,0.10)" }]}>
                        <Ionicons name="location" size={16} color={C.red} />
                      </View>
                      <Text style={S.infoTripleLabel} numberOfLines={1}>{D.venueLine}</Text>
                      <Text style={S.infoTripleSub} numberOfLines={1}>{D.cityLine}</Text>
                    </View>
                  )}
               {D && D.spotsLeft !== null && (
  <View style={S.infoTripleItem}>
    <View style={[S.infoTripleIcon, { backgroundColor: "rgba(245,158,11,0.10)" }]}>
      <Ionicons name="people" size={16} color={C.amber} />
    </View>

    <Text style={[S.infoTripleLabel, { color: D.spotsLeft === 0 ? C.red : C.amber }]}>
      {D.spotsLeft === 0 ? "Full" : `${D.spotsLeft} Left`}
    </Text>

    <Text style={S.infoTripleSub}>Spots</Text>
  </View>
)}
                </View>
              </View>
            </View>

            {/* ── WHO'S GOING ── */}
            {D && D.joined > 0 && (
              <View style={S.section}>
                <TouchableOpacity style={S.goingCard} activeOpacity={0.8} onPress={openAttendees}>
                  <View style={S.avatarStack}>
                    {D.attendees.slice(0, 4).map((a: any, i: number) => {
                      const palettes = [C.green, "#F97316", "#8B5CF6", "#EC4899"];
                      return (
                        <View key={i} style={[S.stackAvatar, {
                          left: i * 22, zIndex: 10 - i,
                          backgroundColor: palettes[i % 4],
                        }]}>
                          {a?.profilePhoto
                            ? <Image source={{ uri: a.profilePhoto }} style={S.stackAvatarImg} />
                            : <Text style={S.stackLetter}>{(a?.name || "?").charAt(0).toUpperCase()}</Text>
                          }
                        </View>
                      );
                    })}
                  </View>
                  <View style={{ marginLeft: Math.min(D.joined, 4) * 22 + 16, flex: 1 }}>
                    <Text style={S.goingText}>
                      <Text style={{ color: C.green, fontWeight: "800" }}>{D.joined}</Text>
                      {D.capacity ? ` / ${D.capacity}` : ""} people going
                    </Text>
                    <Text style={S.goingTap}>See attendees →</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={C.hint} />
                </TouchableOpacity>

                {D.capacity && (
                  <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
                    <View style={S.barTrack}>
                      <View style={[S.barFill, {
                        width: `${pct}%` as any,
                        backgroundColor: isFull ? C.red : pct > 75 ? C.amber : C.green,
                      }]} />
                    </View>
                    <View style={S.barRow}>
                      <Text style={S.barLabel}>{D.joined} going</Text>
                      <Text style={[S.barLabel, { color: isFull ? C.red : C.muted }]}>
                        {isFull ? "Sold out" : `${D.capacity - D.joined} spots left`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ── MAP ── */}
            {(D?.venueLine || D?.cityLine) && (
              <View style={S.section}>
                <View style={S.mapCard}>
                  {staticMapUrl ? (
                    <Pressable onPress={openMaps}>
                      <Image source={{ uri: staticMapUrl }} style={S.mapImg} resizeMode="cover" />
                    </Pressable>
                  ) : (
                    <Pressable onPress={openMaps} style={S.mapFallback}>
                      <View style={S.mapPinWrap}>
                        <View style={S.mapPinPulse} />
                        <View style={S.mapPinCircle}>
                          <Ionicons name="location" size={18} color="#fff" />
                        </View>
                      </View>
                      <Text style={S.mapTapText}>Tap to open in Maps</Text>
                    </Pressable>
                  )}
                  <View style={S.mapFooter}>
                    <View style={S.mapAccentBar} />
                    <View style={{ flex: 1 }}>
                      <Text style={S.mapVenue} numberOfLines={1}>{D?.venueLine}</Text>
                      {!!D?.cityLine && <Text style={S.mapCity} numberOfLines={1}>{D.cityLine}</Text>}
                    </View>
                    <Pressable onPress={openMaps} style={S.mapOpenBtn}>
                      <Text style={S.mapOpenBtnText}>Open ↗</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* ── SERVICE TOGGLE (creator only) ── */}
            {isCreator && kind === "service" && (
              <View style={S.section}>
                <View style={S.toggleCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={S.toggleLabel}>Availability</Text>
                    <Text style={S.toggleSub}>
                      {serviceEnabled ? "Accepting bookings" : "Paused — not accepting"}
                    </Text>
                  </View>
                  {togglingService
                    ? <ActivityIndicator color={C.green} />
                    : (
                      <Switch
                        value={serviceEnabled} onValueChange={patchService}
                        trackColor={{ false: C.hint, true: C.green }}
                        thumbColor={C.card} ios_backgroundColor={C.hint}
                      />
                    )
                  }
                </View>
              </View>
            )}

            {/* ── DELETE ── */}
            {isCreator && (
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [S.deleteRow, pressed && { opacity: 0.55 }]}
              >
                <Ionicons name="trash-outline" size={13} color={C.hint} />
                <Text style={S.deleteText}>Delete this event</Text>
              </Pressable>
            )}

          </ScrollView>

          {/* ── CTA BAR ── */}
          <View style={S.ctaBar}>
            {isCreator ? (
              <>
                <Pressable
                  onPress={() => close(() => onEditDetails?.(person))}
                  style={({ pressed }) => [S.ctaEditBtn, pressed && { opacity: 0.85 }]}
                >
                  <Ionicons name="create-outline" size={16} color={C.green} />
                  <Text style={S.ctaEditBtnText}>Edit Event</Text>
                </Pressable>
              </>
            ) : (
              <>
                <JoinEventButton
                  eventId={eventId}
                  kind={kind as any}
                  priceCents={priceCents}
                  eventTitle={String((person as any)?.title || "Event")}
                  joinPolicy={((person as any)?.joinPolicy || "open") as any}
                  onJoined={() => close()}
                  disabled={kind === "service" && statusLocal.toLowerCase() === "paused"}
                />
              </>
            )}
            <Text style={S.ctaFootnote}>
              {isPaid ? "🔒 Secure payment via Razorpay" : "🔒 Protected by eventful • No Payment needed"}
            </Text>
          </View>

        </>)}
      </Animated.View>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const S = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.50)" },

  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    height: "96%",
    backgroundColor: C.pageBg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10, shadowRadius: 20, elevation: 20,
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyT: { color: C.ink, fontSize: 17, fontWeight: "900", marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 999, backgroundColor: C.green },
  emptyBtnT: { color: "#fff", fontWeight: "900", fontSize: 15 },

  /* TOP NAV */
  topNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 14 : 10, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.pageBg,
  },
  navBackBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  navBackText: { fontSize: 16, fontWeight: "700", color: C.ink },
  navCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
  },

  /* BANNER */
  bannerWrap: { height: 200, width: "100%", overflow: "hidden", position: "relative" },
  bannerImg: { width: "100%", height: "100%" },
  bannerDefault: {
    width: "100%", height: "100%",
    backgroundColor: "#2D2D2D",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  bCircle1: { display: "none", width: 0, height: 0 },
  bCircle2: { display: "none", width: 0, height: 0 },
  bannerEmoji: { fontSize: 72, zIndex: 2 },
  bannerOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 40,
    backgroundColor: "rgba(190, 157, 84, 0)",
  },
  bannerTitle: { fontSize: 26, fontWeight: "900", color: "#000", letterSpacing: -0.5, marginBottom: 4 },
  bannerMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  bannerMetaText: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600" },

  /* FREE BADGE */
  freeBadgeRow: { paddingHorizontal: 16, paddingTop: 14 },
  freeBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.greenBorder,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  freeBadgeText: { fontSize: 13, fontWeight: "600", color: C.muted },

  /* SECTION */
  section: { paddingHorizontal: 16, marginTop: 18 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: C.ink, marginBottom: 10 },

  /* ORDER CARD */
  orderCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  orderOrgRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  orderOrgAvatar: {},
  orderOrgAvatarFallback: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.greenSoft, alignItems: "center", justifyContent: "center",
  },
  orderOrgInitial: { fontSize: 14, fontWeight: "800", color: C.green },
  orderOrgName: { fontSize: 13, fontWeight: "700", color: C.ink },
  orderOrgSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.greenBorder,
  },
  verifiedText: { fontSize: 10, fontWeight: "700", color: C.green },
  orderDivider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  orderRowLabel: { fontSize: 13, color: C.muted, fontWeight: "500" },
  orderRowValue: { fontSize: 13, color: C.ink2, fontWeight: "700" },
  totalFreePill: {
    backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.greenBorder,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  totalFreePillText: { fontSize: 12, fontWeight: "800", color: C.green },

  /* DETAILS CARD */
  detailsCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tagChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  tagChipText: { fontSize: 12, fontWeight: "600", color: C.muted },
  detailDesc: { fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 12 },

  /* 3-column info */
  infoTriple: { flexDirection: "row", paddingTop: 10 },
  infoTripleItem: { flex: 1, alignItems: "center" },
  infoTripleIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.greenSoft, alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  infoTripleLabel: { fontSize: 12, fontWeight: "800", color: C.ink, textAlign: "center" },
  infoTripleSub: { fontSize: 10, color: C.muted, textAlign: "center", marginTop: 2, fontWeight: "500" },

  /* GOING */
  goingCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 14, position: "relative",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  avatarStack: { position: "absolute", left: 14, flexDirection: "row", height: 36 },
  stackAvatar: {
    position: "absolute", width: 34, height: 34, borderRadius: 17,
    borderWidth: 2, borderColor: C.card, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  stackAvatarImg: { width: 34, height: 34 },
  stackLetter: { color: "#fff", fontWeight: "800", fontSize: 12 },
  goingText: { fontSize: 14, fontWeight: "700", color: C.ink2 },
  goingTap: { fontSize: 11, fontWeight: "700", color: C.green, marginTop: 2 },
  barTrack: { height: 5, backgroundColor: C.surface, borderRadius: 999, overflow: "hidden" },
  barFill: { height: "100%" as any, borderRadius: 999 },
  barRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  barLabel: { fontSize: 11, fontWeight: "600", color: C.muted },

  /* MAP */
  mapCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  mapImg: { width: "100%", height: 150 },
  mapFallback: {
    height: 150, backgroundColor: C.greenSoft,
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  mapPinWrap: { alignItems: "center", justifyContent: "center" },
  mapPinPulse: { position: "absolute", width: 52, height: 52, borderRadius: 26, backgroundColor: C.green + "28" },
  mapPinCircle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: C.green,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "#fff",
  },
  mapTapText: { fontSize: 12, fontWeight: "700", color: C.accentText },
  mapFooter: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: C.card, gap: 10,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  mapAccentBar: { width: 3, height: 34, borderRadius: 2, backgroundColor: C.green },
  mapVenue: { fontSize: 13, fontWeight: "700", color: C.ink },
  mapCity: { fontSize: 11, color: C.muted, marginTop: 2 },
  mapOpenBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.greenBorder,
  },
  mapOpenBtnText: { fontSize: 12, fontWeight: "700", color: C.accentText },

  /* TOGGLE */
  toggleCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 16,
  },
  toggleLabel: { fontSize: 15, fontWeight: "700", color: C.ink },
  toggleSub: { fontSize: 12, color: C.muted, marginTop: 3 },

  /* DELETE */
  deleteRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 20, marginHorizontal: 16,
  },
  deleteText: { fontSize: 13, color: C.hint, fontWeight: "600" },

  /* CTA BAR */
  ctaBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    backgroundColor: C.pageBg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  ctaEditBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 52, borderRadius: 14,
    backgroundColor: C.greenSoft, borderWidth: 1.5, borderColor: C.greenBorder,
  },
  ctaEditBtnText: { fontSize: 15, fontWeight: "800", color: C.green },
  ctaFootnote: {
    fontSize: 11, color: C.hint, textAlign: "center",
    marginTop: 8, fontWeight: "500",
  },
});