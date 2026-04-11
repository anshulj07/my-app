
// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import {
//   View, Text, ActivityIndicator, Pressable, FlatList, Image, ScrollView, TouchableOpacity,
//   Platform, StatusBar, UIManager, LayoutAnimation,
//   Animated, StyleSheet, TouchableWithoutFeedback,
// } from "react-native";
// import Constants from "expo-constants";
// import { useAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import { styles, COLORS } from "./MyBookingScreen.style";
// import { apiFetch } from "../../lib/apiFetch";
// import CreatedTab, { EventDoc } from "./Tabs/CreatedTab";
// import GoingTab from "./Tabs/GoingTab";
// import PastTab from "./Tabs/PastTab";
// import { useNotifications, NotifItem } from "../../context/NotificationContext";

// type TabKey = "created" | "going" | "past";

// function safeJson(txt: string) {
//   try { return JSON.parse(txt); } catch { return null; }
// }

// function eventStartMs(ev: EventDoc): number {
//   if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
//   const date = (ev.date ?? "").trim(); const time = (ev.time ?? "").trim();
//   if (date && time) { const t = new Date(`${date}T${time}:00Z`).getTime(); if (Number.isFinite(t)) return t; }
//   if (date) { const t = new Date(`${date}T12:00:00Z`).getTime(); if (Number.isFinite(t)) return t; }
//   return Number.POSITIVE_INFINITY;
// }

// function getEventState(ev: EventDoc): "upcoming" | "ongoing" | "past" {
//   const status = String(ev.status || "active").toLowerCase();
//   if (status === "ended" || status === "completed") return "past";
//   const startMs = eventStartMs(ev);
//   if (startMs === Number.POSITIVE_INFINITY || startMs > Date.now()) return "upcoming";
//   return "ongoing";
// }

// export default function MyBookingsScreen() {
//   const router = useRouter();
//   const { userId } = useAuth();
//   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [tab, setTab] = useState<TabKey>("created");

//   // ── Created/Past = events the user HOSTS ──────────────────────────────────
//   const [allCreated, setAllCreated] = useState<EventDoc[]>([]);

//   // ── Going = events the user JOINED ────────────────────────────────────────
//   const [goingEvents, setGoingEvents] = useState<EventDoc[]>([]);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [err, setErr] = useState<string | null>(null);
//   const [admitBusy, setAdmitBusy] = useState<Record<string, boolean>>({});
//   const [showNotifs, setShowNotifs] = useState(false);
//   const [toggleBusy, setToggleBusy] = useState<Record<string, boolean>>({});

//   const { notifications, unreadCount, refresh: refreshNotifs, markAsRead, loading: notifsLoading } = useNotifications();

//   const headerFade = useRef(new Animated.Value(0)).current;
//   const headerLift = useRef(new Animated.Value(10)).current;
//   const [tabsW, setTabsW] = useState(0);
//   const indicatorX = useRef(new Animated.Value(0)).current;
//   const tabIndex = tab === "created" ? 0 : tab === "going" ? 1 : 2;

//   // ✅ Created tab = host's upcoming + live events
//   const created = useMemo(() =>
//     allCreated.filter((e) => getEventState(e) === "upcoming" || getEventState(e) === "ongoing")
//       .sort((a, b) => eventStartMs(a) - eventStartMs(b)),
//     [allCreated]);

//   // ✅ Going tab = joined events that are NOT past yet
//   const going = useMemo(() =>
//     goingEvents.filter((e) => getEventState(e) !== "past")
//       .sort((a, b) => eventStartMs(a) - eventStartMs(b)),
//     [goingEvents]);

//   // ✅ Past tab = host's past events + past going events (merged, with _role label)
//   const past = useMemo(() => {
//     const pastCreated = allCreated
//       .filter((e) => getEventState(e) === "past")
//       .map((e) => ({ ...e, _role: "created" as const }));

//     const pastGoing = goingEvents
//       .filter((e) => getEventState(e) === "past")
//       .map((e) => ({ ...e, _role: "attended" as const }));

//     // Merge and sort by most recent first (deduplicate by _id)
//     const seen = new Set<string>();
//     return [...pastCreated, ...pastGoing]
//       .filter((e) => { if (seen.has(e._id)) return false; seen.add(e._id); return true; })
//       .sort((a, b) => eventStartMs(b) - eventStartMs(a));
//   }, [allCreated, goingEvents]);

//   useEffect(() => {
//     if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental)
//       UIManager.setLayoutAnimationEnabledExperimental(true);
//   }, []);

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(headerFade, { toValue: 1, duration: 260, useNativeDriver: true }),
//       Animated.timing(headerLift, { toValue: 0, duration: 260, useNativeDriver: true }),
//     ]).start();
//   }, []);

//   useEffect(() => {
//     if (!tabsW) return;
//     Animated.spring(indicatorX, {
//       toValue: tabIndex * (tabsW / 3),
//       useNativeDriver: true, speed: 18, bounciness: 7,
//     }).start();
//   }, [tabIndex, tabsW]);

//   const headers = useMemo(() => ({
//     "Content-Type": "application/json",
//     ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//   }), [EVENT_API_KEY]);

//   const load = useCallback(async () => {
//     if (!API_BASE) { setErr("Missing API base URL."); setLoading(false); setRefreshing(false); return; }
//     if (!userId) { setErr("Sign in required."); setLoading(false); setRefreshing(false); return; }
//     setErr(null); setLoading(true);
//     try {
//       // ✅ Fetch both in parallel
//       const [createdRes, goingRes] = await Promise.all([
//         apiFetch(`${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId)}&limit=500`, { method: "GET", headers }),
//         apiFetch(`${API_BASE}/api/bookings/going?clerkUserId=${encodeURIComponent(userId)}`, { method: "GET", headers }),
//       ]);

//       const createdJson = safeJson(await createdRes.text());
//       const goingJson = safeJson(await goingRes.text());

//       if (!createdRes.ok) throw new Error(createdJson?.error || "Failed to fetch events");

//       const createdEvts: EventDoc[] = Array.isArray(createdJson?.createdEvents) ? createdJson.createdEvents : [];
//       const goingEvts: EventDoc[] = Array.isArray(goingJson?.events) ? goingJson.events : [];

//       LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//       setAllCreated(createdEvts);
//       setGoingEvents(goingEvts);

//     } catch (e: any) {
//       setErr(e?.message || "Something went wrong.");
//     } finally {
//       setLoading(false); setRefreshing(false);
//     }
//   }, [API_BASE, userId, headers]);

//   useEffect(() => { load(); }, [load]);
//   const onRefresh = useCallback(() => { setRefreshing(true); load(); refreshNotifs(); }, [load, refreshNotifs]);

//   // ✅ Host admits or rejects a pending request
//   const handleAdmitReject = useCallback(async (item: NotifItem, action: "admit" | "reject") => {
//     if (!API_BASE || !userId) return;
//     const busyKey = `${item.id}-${action}`;
//     setAdmitBusy(m => ({ ...m, [busyKey]: true }));
//     try {
//       const res = await apiFetch(`${API_BASE}/api/events/admit-request`, {
//         method: "POST", headers,
//         body: JSON.stringify({
//           eventId: item.eventId,
//           creatorClerkId: userId,
//           requestClerkUserId: item.userClerkId,
//           action,
//         }),
//       });
//       if (res.ok) {
//         if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental)
//           UIManager.setLayoutAnimationEnabledExperimental(true);
//         LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//         refreshNotifs();
//         if (action === "admit") load();
//       }
//     } catch { }
//     finally { setAdmitBusy(m => { const c = { ...m }; delete c[busyKey]; return c; }); }
//   }, [API_BASE, userId, headers, load]);

//   const patchServiceEnabled = useCallback(async (ev: EventDoc, next: boolean) => {
//     if (!API_BASE || !userId || !ev?._id) return;
//     const prev = String(ev.status || "active").toLowerCase();
//     const optimistic = next ? "active" : "paused";
//     setToggleBusy((m) => ({ ...m, [ev._id]: true }));
//     setAllCreated((p) => p.map((x) => x._id === ev._id ? { ...x, status: optimistic } : x));
//     try {
//       const res = await apiFetch(`${API_BASE}/api/events/toggle-service`, {
//         method: "PATCH", headers,
//         body: JSON.stringify({ _id: ev._id, creatorClerkId: userId, enabled: next }),
//       });
//       const json = safeJson(await res.text().catch(() => ""));
//       if (!res.ok) throw new Error(json?.error || "Failed");
//       const server = String(json?.status || json?.event?.status || optimistic).toLowerCase();
//       setAllCreated((p) => p.map((x) => x._id === ev._id ? { ...x, status: server } : x));
//     } catch {
//       setAllCreated((p) => p.map((x) => x._id === ev._id ? { ...x, status: prev } : x));
//     } finally {
//       setToggleBusy((m) => ({ ...m, [ev._id]: false }));
//     }
//   }, [API_BASE, headers, userId]);

//   // ✅ Creator ends event → moves to Past
//   const endEvent = useCallback(async (ev: EventDoc) => {
//     if (!API_BASE || !userId || !ev?._id) return;
//     setAllCreated((p) => p.map((x) => x._id === ev._id ? { ...x, status: "ended" } : x));
//     try {
//       await apiFetch(`${API_BASE}/api/events/end-event`, {
//         method: "PATCH", headers,
//         body: JSON.stringify({ eventId: ev._id, creatorClerkId: userId }),
//       });
//     } catch {
//       setAllCreated((p) => p.map((x) => x._id === ev._id ? { ...x, status: "active" } : x));
//     }
//   }, [API_BASE, headers, userId]);

//   const TOP_PAD = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 40;

//   const onPressEvent = useCallback((item: EventDoc) => {
//     router.push({
//       pathname: "/event-interest/[eventId]",
//       params: { eventId: item._id, kind: item.kind, title: item.title, emoji: item.emoji || "📍" },
//     });
//   }, [router]);

//   return (
//     <View style={StyleSheet.flatten([styles.screen, { paddingTop: TOP_PAD }])}>
//       <Animated.View style={StyleSheet.flatten([
//         styles.header, { opacity: headerFade, transform: [{ translateY: headerLift }] }
//       ])}>
//         <View style={styles.headerTopRow}>
//           <View style={{ flex: 1 }}>
//             <Text style={styles.title}>{showNotifs ? "Notifications" : "My Bookings"}</Text>
//             <Text style={styles.subTitle}>{showNotifs ? "Requests & recent activity" : "Events you created & events you're going to"}</Text>
//           </View>
//           {/* ✅ Notification bell */}
//           <TouchableOpacity
//             onPress={() => {
//               const next = !showNotifs;
//               setShowNotifs(next);
//               if (next) markAsRead();
//             }}
//             activeOpacity={0.8}
//             style={[ntf.bellBtn, showNotifs && ntf.bellBtnActive]}
//           >
//             <Text style={{ fontSize: 18 }}>🔔</Text>
//             {unreadCount > 0 && (
//               <View style={ntf.bellBadge}>
//                 <Text style={ntf.bellBadgeText}>{unreadCount}</Text>
//               </View>
//             )}
//           </TouchableOpacity>
//         </View>

//         {/* ✅ 3 tabs — hide when notifications open */}
//         {!showNotifs && (
//           <View style={styles.tabsWrap} onLayout={(e) => setTabsW(e.nativeEvent.layout.width)}>
//             {tabsW > 0 && (
//               <Animated.View style={StyleSheet.flatten([
//                 styles.tabIndicator,
//                 { width: tabsW / 3, transform: [{ translateX: indicatorX }] }
//               ])} />
//             )}
//             <TabBtn label="Created" count={created.length} active={tab === "created"} onPress={() => setTab("created")} />
//             <TabBtn label="Going" count={going.length} active={tab === "going"} onPress={() => setTab("going")} highlight={going.length > 0} />
//             <TabBtn label="Past" count={past.length} active={tab === "past"} onPress={() => setTab("past")} />
//           </View>
//         )}
//       </Animated.View>

//       {showNotifs ? (
//         <NotificationsPanel
//           items={notifications}
//           loading={notifsLoading}
//           admitBusy={admitBusy}
//           onAdmit={item => handleAdmitReject(item, "admit")}
//           onReject={item => handleAdmitReject(item, "reject")}
//           onPressEvent={eventId => {
//             setShowNotifs(false);
//             const ev = allCreated.find(e => e._id === eventId) || goingEvents.find(e => e._id === eventId);
//             if (ev) onPressEvent(ev);
//           }}
//         />
//       ) : loading ? (
//         <View style={styles.center}><ActivityIndicator color={COLORS.brand} /><Text style={styles.muted}>Loading…</Text></View>
//       ) : err ? (
//         <View style={styles.center}>
//           <Text style={styles.err}>{err}</Text>
//           <Pressable style={styles.retryBtn} onPress={load}><Text style={styles.retryTxt}>Retry</Text></Pressable>
//         </View>
//       ) : tab === "going" ? (
//         <GoingTab going={going} refreshing={refreshing} onRefresh={onRefresh} onPressEvent={onPressEvent} />
//       ) : tab === "past" ? (
//         <PastTab past={past} refreshing={refreshing} onRefresh={onRefresh} onPressEvent={onPressEvent} />
//       ) : (
//         <CreatedTab
//           created={created}
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           toggleBusyById={toggleBusy}
//           onToggleServiceEnabled={patchServiceEnabled}
//           onPressEvent={onPressEvent}
//           isOngoing={false}
//           onEndEvent={undefined}
//         />
//       )}
//     </View>
//   );
// }

// // ─── timeAgo helper ──────────────────────────────────────────────────────────
// function timeAgo(iso: string) {
//   const diff = Date.now() - new Date(iso).getTime();
//   const m = Math.floor(diff / 60000);
//   const h = Math.floor(m / 60);
//   const d = Math.floor(h / 24);
//   if (d > 0) return d === 1 ? "1d ago" : `${d}d ago`;
//   if (h > 0) return h === 1 ? "1h ago" : `${h}h ago`;
//   if (m > 0) return m === 1 ? "1m ago" : `${m}m ago`;
//   return "Just now";
// }

// // ─── Notifications Panel ─────────────────────────────────────────────────────
// function NotificationsPanel({
//   items, loading, admitBusy, onAdmit, onReject, onPressEvent,
// }: {
//   items: NotifItem[];
//   loading: boolean;
//   admitBusy: Record<string, boolean>;
//   onAdmit: (item: NotifItem) => void;
//   onReject: (item: NotifItem) => void;
//   onPressEvent: (eventId: string) => void;
// }) {
//   const pending = items.filter(i => i.type === "pending");
//   const joined  = items.filter(i => i.type === "joined");

//   return (
//     <ScrollView
//       style={{ flex: 1 }}
//       contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
//       showsVerticalScrollIndicator={false}
//     >
//       {loading && (
//         <View style={{ alignItems: "center", paddingVertical: 32 }}>
//           <ActivityIndicator color={COLORS.brand} />
//         </View>
//       )}

//       {!loading && items.length === 0 && (
//         <View style={[styles.empty, { marginTop: 12 }]}>
//           <Text style={{ fontSize: 36, marginBottom: 10 }}>🔔</Text>
//           <Text style={styles.emptyTitle}>All caught up!</Text>
//           <Text style={styles.emptySub}>
//             New joins and approval requests will show here.
//           </Text>
//         </View>
//       )}

//       {/* ─── PENDING REQUESTS (like Instagram follow requests) ─── */}
//       {pending.length > 0 && (
//         <View style={{ marginTop: 16 }}>
//           <View style={ntf.sectionRow}>
//             <View style={[ntf.dot, { backgroundColor: "#F87171" }]} />
//             <Text style={ntf.sectionLabel}>Join Requests</Text>
//             <View style={ntf.countBadge}>
//               <Text style={ntf.countBadgeText}>{pending.length}</Text>
//             </View>
//           </View>

//           {pending.map(item => {
//             const admitKey  = `${item.id}-admit`;
//             const rejectKey = `${item.id}-reject`;
//             const busy      = !!(admitBusy[admitKey] || admitBusy[rejectKey]);

//             return (
//               <View key={item.id} style={ntf.card}>
//                 {/* top row */}
//                 <View style={ntf.row}>
//                   <View style={ntf.avatar}>
//                     {item.userImageUrl
//                       ? <Image source={{ uri: item.userImageUrl }} style={ntf.avatarImg} />
//                       : <Text style={ntf.avatarLetter}>{(item.userName || "?")[0].toUpperCase()}</Text>
//                     }
//                   </View>
//                   <View style={{ flex: 1 }}>
//                     <Text style={ntf.activityText} numberOfLines={2}>
//                       <Text style={ntf.nameStrong}>{item.userName}</Text>
//                       <Text style={ntf.nameNormal}> wants to join </Text>
//                       <Text style={ntf.nameEvent}>{item.eventEmoji} {item.eventTitle}</Text>
//                     </Text>
//                     <Text style={ntf.timeText}>{timeAgo(item.timestamp)}</Text>
//                   </View>
//                 </View>

//                 {/* message from user if any */}
//                 {!!item.message && (
//                   <View style={ntf.msgBox}>
//                     <Text style={ntf.msgText}>"{item.message}"</Text>
//                   </View>
//                 )}

//                 {/* Admit / Decline buttons */}
//                 <View style={ntf.btnRow}>
//                   <Pressable
//                     onPress={() => onAdmit(item)}
//                     disabled={busy}
//                     style={({ pressed }) => [ntf.admitBtn, pressed && { opacity: 0.85 }, busy && { opacity: 0.55 }]}
//                   >
//                     {admitBusy[admitKey]
//                       ? <ActivityIndicator color="#fff" size="small" />
//                       : <Text style={ntf.admitText}>✓  Admit</Text>
//                     }
//                   </Pressable>
//                   <Pressable
//                     onPress={() => onReject(item)}
//                     disabled={busy}
//                     style={({ pressed }) => [ntf.rejectBtn, pressed && { opacity: 0.85 }, busy && { opacity: 0.55 }]}
//                   >
//                     {admitBusy[rejectKey]
//                       ? <ActivityIndicator color={COLORS.muted} size="small" />
//                       : <Text style={ntf.rejectText}>✕  Decline</Text>
//                     }
//                   </Pressable>
//                 </View>
//               </View>
//             );
//           })}
//         </View>
//       )}

//       {/* ─── RECENT JOINS (like Instagram activity feed) ─── */}
//       {joined.length > 0 && (
//         <View style={{ marginTop: pending.length > 0 ? 24 : 16 }}>
//           <View style={ntf.sectionRow}>
//             <View style={[ntf.dot, { backgroundColor: COLORS.success }]} />
//             <Text style={ntf.sectionLabel}>Recent Activity</Text>
//           </View>

//           {joined.map(item => (
//             <TouchableOpacity
//               key={item.id}
//               activeOpacity={0.7}
//               onPress={() => onPressEvent(item.eventId)}
//               style={ntf.activityRow}
//             >
//               <View style={ntf.avatarSm}>
//                 {item.userImageUrl
//                   ? <Image source={{ uri: item.userImageUrl }} style={ntf.avatarImg} />
//                   : <Text style={ntf.avatarLetterSm}>{(item.userName || "?")[0].toUpperCase()}</Text>
//                 }
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Text style={ntf.activityText} numberOfLines={2}>
//                   <Text style={ntf.nameStrong}>{item.userName}</Text>
//                   <Text style={ntf.nameNormal}> joined </Text>
//                   <Text style={ntf.nameEvent}>{item.eventEmoji} {item.eventTitle}</Text>
//                 </Text>
//                 <Text style={ntf.timeText}>{timeAgo(item.timestamp)}</Text>
//               </View>
//               <View style={ntf.joinedBadge}>
//                 <Text style={ntf.joinedBadgeText}>Joined ✓</Text>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>
//       )}
//     </ScrollView>
//   );
// }

// // ─── Notification styles ──────────────────────────────────────────────────────
// const ntf = StyleSheet.create({
//   bellBtn: {
//     width: 44, height: 44, borderRadius: 16,
//     backgroundColor: COLORS.card,
//     borderWidth: 1, borderColor: COLORS.border,
//     alignItems: "center", justifyContent: "center",
//     shadowColor: "#000", shadowOpacity: 0.06,
//     shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
//     elevation: 2,
//   },
//   bellBtnActive: {
//     backgroundColor: COLORS.brand,
//     borderColor: COLORS.brand,
//   },
//   bellBadge: {
//     position: "absolute", top: -5, right: -5,
//     width: 18, height: 18, borderRadius: 9,
//     backgroundColor: "#F87171",
//     alignItems: "center", justifyContent: "center",
//     borderWidth: 2, borderColor: COLORS.bg,
//   },
//   bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },

//   sectionRow: {
//     flexDirection: "row", alignItems: "center", gap: 8,
//     marginBottom: 12, paddingLeft: 2,
//   },
//   dot: { width: 8, height: 8, borderRadius: 4 },
//   sectionLabel: {
//     flex: 1,
//     color: COLORS.muted, fontSize: 11, fontWeight: "900",
//     textTransform: "uppercase", letterSpacing: 1,
//   },
//   countBadge: {
//     backgroundColor: "#F87171",
//     paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99,
//   },
//   countBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },

//   card: {
//     backgroundColor: COLORS.card, borderRadius: 20, padding: 14,
//     borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
//     shadowColor: "#000", shadowOpacity: 0.04,
//     shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
//   },
//   row: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },

//   avatar: {
//     width: 44, height: 44, borderRadius: 14,
//     backgroundColor: COLORS.brandSoft,
//     borderWidth: 1, borderColor: "rgba(255,77,109,0.15)",
//     alignItems: "center", justifyContent: "center", overflow: "hidden",
//   },
//   avatarSm: {
//     width: 36, height: 36, borderRadius: 12,
//     backgroundColor: COLORS.brandSoft,
//     borderWidth: 1, borderColor: "rgba(255,77,109,0.15)",
//     alignItems: "center", justifyContent: "center", overflow: "hidden",
//   },
//   avatarImg: { width: "100%", height: "100%" },
//   avatarLetter: { color: COLORS.brand, fontSize: 17, fontWeight: "900" },
//   avatarLetterSm: { color: COLORS.brand, fontSize: 14, fontWeight: "900" },

//   activityText: { fontSize: 13, lineHeight: 18 },
//   nameStrong: { color: COLORS.text, fontWeight: "900" },
//   nameNormal: { color: COLORS.muted, fontWeight: "600" },
//   nameEvent: { color: COLORS.brand, fontWeight: "800" },
//   timeText: { color: COLORS.muted, fontSize: 11, fontWeight: "700", marginTop: 3 },

//   msgBox: {
//     backgroundColor: COLORS.bg, borderRadius: 12, padding: 10,
//     marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
//   },
//   msgText: { color: COLORS.muted, fontSize: 12, fontWeight: "700", fontStyle: "italic" },

//   btnRow: { flexDirection: "row", gap: 10 },
//   admitBtn: {
//     flex: 1, height: 42, borderRadius: 13,
//     backgroundColor: "#0A84FF", alignItems: "center", justifyContent: "center",
//     shadowColor: "#0A84FF", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
//   },
//   admitText: { color: "#fff", fontWeight: "900", fontSize: 13 },
//   rejectBtn: {
//     flex: 1, height: 42, borderRadius: 13,
//     backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center",
//     borderWidth: 1, borderColor: "rgba(148,163,184,0.15)",
//   },
//   rejectText: { color: "rgba(226,232,240,0.6)", fontWeight: "800", fontSize: 13 },

//   activityRow: {
//     flexDirection: "row", alignItems: "center", gap: 12,
//     paddingVertical: 12, paddingHorizontal: 2,
//     borderBottomWidth: 1, borderBottomColor: COLORS.border,
//   },
//   joinedBadge: {
//     paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
//     backgroundColor: "rgba(16,185,129,0.10)",
//     borderWidth: 1, borderColor: "rgba(16,185,129,0.25)",
//   },
//   joinedBadgeText: { color: COLORS.success, fontSize: 10, fontWeight: "900" },
// });


// function TabBtn({ label, count, active, onPress, highlight }: {
//   label: string; count: number; active: boolean; onPress: () => void; highlight?: boolean;
// }) {
//   return (
//     <Pressable onPress={onPress} style={styles.tabBtn} android_ripple={{ color: "rgba(255,255,255,0.08)" }}>
//       <View style={{ flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center" }}>
//         <Text style={StyleSheet.flatten([styles.tabText, active && styles.tabTextActive])} numberOfLines={1}>
//           {label}
//         </Text>
//         {highlight && !active && (
//           <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.brand }} />
//         )}
//         {count > 0 && (
//           <View style={{
//             backgroundColor: active ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.08)",
//             borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1,
//           }}>
//             <Text style={{ color: active ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "900" }}>
//               {count}
//             </Text>
//           </View>
//         )}
//       </View>
//     </Pressable>
//   );
// }
// components/MyBookings/MyBookingsScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ActivityIndicator, Pressable, ScrollView, Image,
  TouchableOpacity, Platform, StatusBar, UIManager, LayoutAnimation,
  Animated, StyleSheet,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { styles, COLORS } from "./MyBookingScreen.style";
import { apiFetch } from "../../lib/apiFetch";
import CreatedTab, { EventDoc } from "./Tabs/CreatedTab";
import GoingTab from "./Tabs/GoingTab";
import PastTab from "./Tabs/PastTab";
import { useNotifications, NotifItem } from "../../context/NotificationContext";

// ─────────────────────────────────────────────
//  DESIGN TOKENS (for this file only)
// ─────────────────────────────────────────────
const C = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  inputBorder: "#E8E0D5",
  ink:         "#1C1A17",
  muted:       "#8A8278",
  hint:        "#BCB6AD",
  teal:        "#3ECFB2",
  tealBg:      "#E8FAF7",
  tealText:    "#1A7A6A",
  coral:       "#FF6F6F",
  coralBg:     "#FFF0F0",
  coralText:   "#C0392B",
  amber:       "#F59E0B",
  amberBg:     "#FFFBEB",
  amberText:   "#92400E",
  purple:      "#A78BFA",
  purpleBg:    "#F3F0FF",
  purpleText:  "#5B21B6",
  green:       "#34D399",
  greenBg:     "#ECFDF5",
  greenText:   "#065F46",
  blue:        "#60A5FA",
  blueBg:      "#EFF6FF",
  blueText:    "#1D4ED8",
};
const R = { card: 20, input: 14, pill: 999 };

type TabKey = "created" | "going" | "past";

function safeJson(txt: string) {
  try { return JSON.parse(txt); } catch { return null; }
}
function eventStartMs(ev: EventDoc): number {
  if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
  const date = (ev.date ?? "").trim(); const time = (ev.time ?? "").trim();
  if (date && time) { const t = new Date(`${date}T${time}:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  if (date) { const t = new Date(`${date}T12:00:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  return Number.POSITIVE_INFINITY;
}
function getEventState(ev: EventDoc): "upcoming" | "ongoing" | "past" {
  const status = String(ev.status || "active").toLowerCase();
  if (status === "ended" || status === "completed") return "past";
  const startMs = eventStartMs(ev);
  if (startMs === Number.POSITIVE_INFINITY || startMs > Date.now()) return "upcoming";
  return "ongoing";
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? "1d ago" : `${d}d ago`;
  if (h > 0) return h === 1 ? "1h ago" : `${h}h ago`;
  if (m > 0) return m === 1 ? "1m ago" : `${m}m ago`;
  return "Just now";
}

// ─────────────────────────────────────────────
//  SCREEN
// ─────────────────────────────────────────────
export default function MyBookingsScreen() {
  const router    = useRouter();
  const { userId } = useAuth();
  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [tab, setTab]               = useState<TabKey>("created");
  const [allCreated, setAllCreated] = useState<EventDoc[]>([]);
  const [goingEvents, setGoingEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr]               = useState<string | null>(null);
  const [admitBusy, setAdmitBusy]   = useState<Record<string, boolean>>({});
  const [showNotifs, setShowNotifs] = useState(false);
  const [toggleBusy, setToggleBusy] = useState<Record<string, boolean>>({});

  const { notifications, unreadCount, refresh: refreshNotifs, markAsRead, loading: notifsLoading } = useNotifications();

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerLift = useRef(new Animated.Value(10)).current;
  const [tabsW, setTabsW]           = useState(0);
  const indicatorX                  = useRef(new Animated.Value(0)).current;
  const tabIndex = tab === "created" ? 0 : tab === "going" ? 1 : 2;

  // Derived lists
  const created = useMemo(() =>
    allCreated.filter(e => ["upcoming", "ongoing"].includes(getEventState(e)))
      .sort((a, b) => eventStartMs(a) - eventStartMs(b)), [allCreated]);

  const going = useMemo(() =>
    goingEvents.filter(e => getEventState(e) !== "past")
      .sort((a, b) => eventStartMs(a) - eventStartMs(b)), [goingEvents]);

  const past = useMemo(() => {
    const pastCreated = allCreated.filter(e => getEventState(e) === "past").map(e => ({ ...e, _role: "created" as const }));
    const pastGoing   = goingEvents.filter(e => getEventState(e) === "past").map(e => ({ ...e, _role: "attended" as const }));
    const seen = new Set<string>();
    return [...pastCreated, ...pastGoing]
      .filter(e => { if (seen.has(e._id)) return false; seen.add(e._id); return true; })
      .sort((a, b) => eventStartMs(b) - eventStartMs(a));
  }, [allCreated, goingEvents]);

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental)
      UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(headerLift, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!tabsW) return;
    Animated.spring(indicatorX, {
      toValue: tabIndex * (tabsW / 3),
      useNativeDriver: true, speed: 18, bounciness: 7,
    }).start();
  }, [tabIndex, tabsW]);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
  }), [EVENT_API_KEY]);

  const load = useCallback(async () => {
    if (!API_BASE) { setErr("Missing API base URL."); setLoading(false); setRefreshing(false); return; }
    if (!userId)   { setErr("Sign in required.");      setLoading(false); setRefreshing(false); return; }
    setErr(null); setLoading(true);
    try {
      const [createdRes, goingRes] = await Promise.all([
        apiFetch(`${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId)}&limit=500`, { method: "GET", headers }),
        apiFetch(`${API_BASE}/api/bookings/going?clerkUserId=${encodeURIComponent(userId)}`, { method: "GET", headers }),
      ]);
      const createdJson = safeJson(await createdRes.text());
      const goingJson   = safeJson(await goingRes.text());
      if (!createdRes.ok) throw new Error(createdJson?.error || "Failed to fetch events");
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAllCreated(Array.isArray(createdJson?.createdEvents) ? createdJson.createdEvents : []);
      setGoingEvents(Array.isArray(goingJson?.events) ? goingJson.events : []);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [API_BASE, userId, headers]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); refreshNotifs(); }, [load, refreshNotifs]);

  const handleAdmitReject = useCallback(async (item: NotifItem, action: "admit" | "reject") => {
    if (!API_BASE || !userId) return;
    const busyKey = `${item.id}-${action}`;
    setAdmitBusy(m => ({ ...m, [busyKey]: true }));
    try {
      const res = await apiFetch(`${API_BASE}/api/events/admit-request`, {
        method: "POST", headers,
        body: JSON.stringify({ eventId: item.eventId, creatorClerkId: userId, requestClerkUserId: item.userClerkId, action }),
      });
      if (res.ok) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        refreshNotifs();
        if (action === "admit") load();
      }
    } catch {}
    finally { setAdmitBusy(m => { const c = { ...m }; delete c[busyKey]; return c; }); }
  }, [API_BASE, userId, headers, load]);

  const patchServiceEnabled = useCallback(async (ev: EventDoc, next: boolean) => {
    if (!API_BASE || !userId || !ev?._id) return;
    const prev = String(ev.status || "active").toLowerCase();
    const optimistic = next ? "active" : "paused";
    setToggleBusy(m => ({ ...m, [ev._id]: true }));
    setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: optimistic } : x));
    try {
      const res = await apiFetch(`${API_BASE}/api/events/toggle-service`, {
        method: "PATCH", headers,
        body: JSON.stringify({ _id: ev._id, creatorClerkId: userId, enabled: next }),
      });
      const json = safeJson(await res.text().catch(() => ""));
      if (!res.ok) throw new Error(json?.error || "Failed");
      const server = String(json?.status || json?.event?.status || optimistic).toLowerCase();
      setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: server } : x));
    } catch {
      setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: prev } : x));
    } finally {
      setToggleBusy(m => ({ ...m, [ev._id]: false }));
    }
  }, [API_BASE, headers, userId]);

  const endEvent = useCallback(async (ev: EventDoc) => {
    if (!API_BASE || !userId || !ev?._id) return;
    setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: "ended" } : x));
    try {
      await apiFetch(`${API_BASE}/api/events/end-event`, {
        method: "PATCH", headers,
        body: JSON.stringify({ eventId: ev._id, creatorClerkId: userId }),
      });
    } catch {
      setAllCreated(p => p.map(x => x._id === ev._id ? { ...x, status: "active" } : x));
    }
  }, [API_BASE, headers, userId]);

  const onPressEvent = useCallback((item: EventDoc) => {
    const state = getEventState(item);
    if (state === "past") {
      router.push({
        pathname: "/past-event/[eventId]",
        params: { eventId: item._id }
      });
      return;
    }

    // If coming from "Going" tab, go to detail page first
    if (tab === "going") {
      router.push({
        pathname: "/newApp/event-detail",
        params: { eventId: item._id, kind: item.kind, title: item.title, emoji: item.emoji || "📍" },
      });
      return;
    }

    // Default (Created tab) goes to dashboard
    router.push({
      pathname: "/event-interest/[eventId]",
      params: { eventId: item._id, kind: item.kind, title: item.title, emoji: item.emoji || "📍" },
    });
  }, [router, tab]);

  const TOP_PAD = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 40;

  return (
    <>
    <View style={[S.screen, { paddingTop: TOP_PAD }]}>

      {/* ── HEADER ── */}
      <Animated.View style={[S.header, { opacity: headerFade, transform: [{ translateY: headerLift }] }]}>
        {/* Teal accent strip */}


        <View style={S.headerInner}>
          {/* Hero icon */}
          <View style={S.heroIcon}>
            <Text style={{ fontSize: 24 }}>{showNotifs ? "🔔" : "📋"}</Text>
          </View>

          {/* Title + subtitle */}
          <View style={{ flex: 1 }}>
            <Text style={S.headerTitle}>
              {showNotifs ? "Notifications" : "My Bookings"}
            </Text>
            <Text style={S.headerSub}>
              {showNotifs ? "Requests & recent activity" : "Created, going & past events"}
            </Text>
          </View>

          {/* Bell button */}
          <TouchableOpacity
            onPress={() => { const next = !showNotifs; setShowNotifs(next); if (next) markAsRead(); }}
            activeOpacity={0.8}
            style={[S.bellBtn, showNotifs && S.bellBtnActive]}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={S.bellBadge}>
                <Text style={S.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        {!showNotifs && (
          <View
            style={S.tabsWrap}
            onLayout={(e) => setTabsW(e.nativeEvent.layout.width)}
          >
            {tabsW > 0 && (
              <Animated.View style={[S.tabIndicator, { width: tabsW / 3, transform: [{ translateX: indicatorX }] }]} />
            )}
            <TabBtn label="Created" count={created.length} active={tab === "created"} onPress={() => setTab("created")} />
            <TabBtn label="Going"   count={going.length}   active={tab === "going"}   onPress={() => setTab("going")}   highlight={going.length > 0} />
            <TabBtn label="Past"    count={past.length}    active={tab === "past"}    onPress={() => setTab("past")} />
          </View>
        )}
      </Animated.View>

      {/* ── CONTENT ── */}
      {showNotifs ? (
        <NotificationsPanel
          items={notifications}
          loading={notifsLoading}
          admitBusy={admitBusy}
          onAdmit={item => handleAdmitReject(item, "admit")}
          onReject={item => handleAdmitReject(item, "reject")}
          onPressEvent={eventId => {
            setShowNotifs(false);
            const ev = allCreated.find(e => e._id === eventId) || goingEvents.find(e => e._id === eventId);
            if (ev) onPressEvent(ev);
          }}
        />
      ) : loading ? (
        <View style={S.center}>
          <ActivityIndicator color={C.teal} size="large" />
          <Text style={S.loadingText}>Loading your events…</Text>
        </View>
      ) : err ? (
        <View style={S.center}>
          <View style={S.errIcon}><Text style={{ fontSize: 32 }}>😕</Text></View>
          <Text style={S.errText}>{err}</Text>
          <Pressable style={S.retryBtn} onPress={load}>
            <Text style={S.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : tab === "going" ? (
        <GoingTab going={going} refreshing={refreshing} onRefresh={onRefresh} onPressEvent={onPressEvent} />
      ) : tab === "past" ? (
        <PastTab past={past} refreshing={refreshing} onRefresh={onRefresh} onPressEvent={onPressEvent} />
      ) : (
        <CreatedTab
          created={created}
          refreshing={refreshing}
          onRefresh={onRefresh}
          toggleBusyById={toggleBusy}
          onToggleServiceEnabled={patchServiceEnabled}
          onPressEvent={onPressEvent}
          onEndEvent={endEvent}
        />
      )}
    </View>
    </>
  );
}

// ─────────────────────────────────────────────
//  NOTIFICATIONS PANEL
// ─────────────────────────────────────────────
function NotificationsPanel({
  items, loading, admitBusy, onAdmit, onReject, onPressEvent,
}: {
  items: NotifItem[]; loading: boolean;
  admitBusy: Record<string, boolean>;
  onAdmit: (item: NotifItem) => void;
  onReject: (item: NotifItem) => void;
  onPressEvent: (eventId: string) => void;
}) {
  const pending = items.filter(i => i.type === "pending");
  const joined  = items.filter(i => i.type === "joined");

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {loading && (
        <View style={{ alignItems: "center", paddingVertical: 32 }}>
          <ActivityIndicator color={C.teal} />
        </View>
      )}

      {!loading && items.length === 0 && (
        <View style={[N.emptyBox]}>
          <Text style={{ fontSize: 36, marginBottom: 10 }}>🔔</Text>
          <Text style={N.emptyTitle}>All caught up!</Text>
          <Text style={N.emptySub}>New joins and approval requests will show here.</Text>
        </View>
      )}

      {/* ── Join Requests ── */}
      {pending.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <View style={N.sectionRow}>
            <View style={[N.dot, { backgroundColor: C.coral }]} />
            <Text style={N.sectionLabel}>Join Requests</Text>
            <View style={[N.countBadge, { backgroundColor: C.coralBg, borderColor: C.coral + "55" }]}>
              <Text style={[N.countBadgeText, { color: C.coralText }]}>{pending.length}</Text>
            </View>
          </View>

          {pending.map(item => {
            const admitKey  = `${item.id}-admit`;
            const rejectKey = `${item.id}-reject`;
            const busy      = !!(admitBusy[admitKey] || admitBusy[rejectKey]);
            return (
              <View key={item.id} style={N.card}>
                <View style={N.row}>
                  <View style={N.avatar}>
                    {item.userImageUrl
                      ? <Image source={{ uri: item.userImageUrl }} style={N.avatarImg} />
                      : <Text style={N.avatarLetter}>{(item.userName || "?")[0].toUpperCase()}</Text>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={N.activityText} numberOfLines={2}>
                      <Text style={N.nameStrong}>{item.userName}</Text>
                      <Text style={N.nameNormal}> wants to join </Text>
                      <Text style={N.nameEvent}>{item.eventEmoji} {item.eventTitle}</Text>
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <Text style={N.timeText}>{timeAgo(item.timestamp)}</Text>
                      {item.paid && (
                        <View style={[N.countBadge, { backgroundColor: C.greenBg, borderColor: C.green + "44", paddingVertical: 1 }]}>
                          <Text style={[N.countBadgeText, { color: C.greenText, fontSize: 8 }]}>💰 PAID</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {!!item.message && (
                  <View style={N.msgBox}>
                    <Text style={N.msgText}>"{item.message}"</Text>
                  </View>
                )}

                <View style={N.btnRow}>
                  <Pressable
                    onPress={() => onAdmit(item)} disabled={busy}
                    style={({ pressed }) => [N.admitBtn, pressed && { opacity: 0.85 }, busy && { opacity: 0.5 }]}
                  >
                    {admitBusy[admitKey]
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={N.admitText}>✓  Admit</Text>
                    }
                  </Pressable>
                  <Pressable
                    onPress={() => onReject(item)} disabled={busy}
                    style={({ pressed }) => [N.rejectBtn, pressed && { opacity: 0.85 }, busy && { opacity: 0.5 }]}
                  >
                    {admitBusy[rejectKey]
                      ? <ActivityIndicator color={C.muted} size="small" />
                      : <Text style={N.rejectText}>✕  Decline</Text>
                    }
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Recent Activity ── */}
      {joined.length > 0 && (
        <View style={{ marginTop: pending.length > 0 ? 24 : 16 }}>
          <View style={N.sectionRow}>
            <View style={[N.dot, { backgroundColor: C.green }]} />
            <Text style={N.sectionLabel}>Recent Activity</Text>
          </View>

          {joined.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => onPressEvent(item.eventId)}
              style={N.activityRow}
            >
              <View style={N.avatarSm}>
                {item.userImageUrl
                  ? <Image source={{ uri: item.userImageUrl }} style={N.avatarImg} />
                  : <Text style={N.avatarLetterSm}>{(item.userName || "?")[0].toUpperCase()}</Text>
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={N.activityText} numberOfLines={2}>
                  <Text style={N.nameStrong}>{item.userName}</Text>
                  <Text style={N.nameNormal}> joined </Text>
                  <Text style={N.nameEvent}>{item.eventEmoji} {item.eventTitle}</Text>
                </Text>
                <Text style={N.timeText}>{timeAgo(item.timestamp)}</Text>
              </View>
              <View style={N.joinedBadge}>
                <Text style={N.joinedBadgeText}>Joined ✓</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────
//  TAB BUTTON
// ─────────────────────────────────────────────
function TabBtn({ label, count, active, onPress, highlight }: {
  label: string; count: number; active: boolean; onPress: () => void; highlight?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={S.tabBtn}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center" }}>
        <Text style={[S.tabText, active && S.tabTextActive]} numberOfLines={1}>{label}</Text>
        {highlight && !active && (
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.coral }} />
        )}
        {count > 0 && (
          <View style={[S.tabCountPill, active && S.tabCountPillActive]}>
            <Text style={[S.tabCountText, active && S.tabCountTextActive]}>{count}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
//  SCREEN STYLES
// ─────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.card,
    borderBottomWidth: 1.5,
    borderBottomColor: C.cardBorder,
    paddingBottom: 16,
    shadowColor: C.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  heroIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: C.ink, letterSpacing: -0.4 },
  headerSub:   { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },

  // Bell
  bellBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  bellBtnActive: { backgroundColor: C.teal, borderColor: C.teal },
  bellBadge: {
    position: "absolute", top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.coral,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.card,
  },
  bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },

  // Tabs
  tabsWrap: {
    flexDirection: "row",
    marginHorizontal: 18,
    borderRadius: R.pill,
    padding: 4,
    backgroundColor: "#F5F0FF",
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  tabIndicator: {
    position: "absolute", left: 4, top: 4, bottom: 4,
    borderRadius: R.pill, backgroundColor: C.teal,
    shadowColor: C.teal, shadowOpacity: 0.35,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  tabBtn:      { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: R.pill },
  tabText:     { color: C.muted, fontWeight: "800", fontSize: 13 },
  tabTextActive: { color: "#FFFFFF" },
  tabCountPill: {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: R.pill, paddingHorizontal: 5, paddingVertical: 1,
  },
  tabCountPillActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountText:       { color: C.muted, fontSize: 10, fontWeight: "900" },
  tabCountTextActive: { color: "#fff" },

  // Loading / error
  center:      { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  loadingText: { color: C.muted, fontWeight: "700", fontSize: 13, marginTop: 12 },
  errIcon:     {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.coralBg, borderWidth: 1.5, borderColor: C.coral + "44",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  errText:  { color: C.coralText, fontWeight: "800", fontSize: 15, textAlign: "center" },
  retryBtn: {
    marginTop: 16, paddingHorizontal: 28, paddingVertical: 12, borderRadius: R.pill,
    backgroundColor: C.teal,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  retryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
});

// ─────────────────────────────────────────────
//  NOTIFICATION STYLES
// ─────────────────────────────────────────────
const N = StyleSheet.create({
  emptyBox: {
    marginTop: 20, padding: 30, borderRadius: R.card,
    backgroundColor: C.card, alignItems: "center",
    borderWidth: 1.5, borderColor: C.cardBorder,
  },
  emptyTitle: { color: C.ink, fontWeight: "900", fontSize: 17, marginTop: 4 },
  emptySub:   { color: C.muted, fontWeight: "600", fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 },

  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingLeft: 2 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  sectionLabel:{ flex: 1, color: C.muted, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  countBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: R.pill, borderWidth: 1.5 },
  countBadgeText: { fontSize: 10, fontWeight: "900" },

  card: {
    backgroundColor: C.card, borderRadius: R.card, padding: 14,
    borderWidth: 1.5, borderColor: C.cardBorder, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },

  avatar: {
    width: 44, height: 44, borderRadius: 14, overflow: "hidden",
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center",
  },
  avatarSm: {
    width: 36, height: 36, borderRadius: 11, overflow: "hidden",
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center",
  },
  avatarImg:     { width: "100%", height: "100%" },
  avatarLetter:  { color: C.tealText, fontSize: 17, fontWeight: "900" },
  avatarLetterSm:{ color: C.tealText, fontSize: 14, fontWeight: "900" },

  activityText: { fontSize: 13, lineHeight: 18 },
  nameStrong:   { color: C.ink, fontWeight: "900" },
  nameNormal:   { color: C.muted, fontWeight: "600" },
  nameEvent:    { color: C.tealText, fontWeight: "800" },
  timeText:     { color: C.hint, fontSize: 11, fontWeight: "700", marginTop: 3 },

  msgBox: {
    backgroundColor: C.inputBg, borderRadius: R.input, padding: 10,
    marginBottom: 12, borderWidth: 1.5, borderColor: C.inputBorder,
  },
  msgText: { color: C.muted, fontSize: 12, fontWeight: "700", fontStyle: "italic" },

  btnRow: { flexDirection: "row", gap: 10 },
  admitBtn: {
    flex: 1, height: 42, borderRadius: 13,
    backgroundColor: C.teal, alignItems: "center", justifyContent: "center",
    shadowColor: C.teal, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  admitText:  { color: "#fff", fontWeight: "900", fontSize: 13 },
  rejectBtn:  {
    flex: 1, height: 42, borderRadius: 13,
    backgroundColor: C.inputBg, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: C.inputBorder,
  },
  rejectText: { color: C.muted, fontWeight: "800", fontSize: 13 },

  activityRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 2,
    borderBottomWidth: 1.5, borderBottomColor: C.cardBorder,
  },
  joinedBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.pill,
    backgroundColor: C.greenBg, borderWidth: 1.5, borderColor: C.green + "55",
  },
  joinedBadgeText: { color: C.greenText, fontSize: 10, fontWeight: "900" },
});