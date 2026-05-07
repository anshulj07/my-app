

// // // // import React, {
// // // //   useCallback, useEffect, useMemo, useRef, useState,
// // // // } from "react";
// // // // import {
// // // //   View, Text, TouchableOpacity, Animated,
// // // //   Image, RefreshControl, Modal, Dimensions,
// // // //   StyleSheet, StatusBar, Platform,
// // // // } from "react-native";
// // // // import Ionicons from "@expo/vector-icons/Ionicons";
// // // // import { useRouter, useFocusEffect } from "expo-router";
// // // // import AsyncStorage from "@react-native-async-storage/async-storage";
// // // // import { useAuth, useUser } from "@clerk/clerk-expo";
// // // // import Constants from "expo-constants";
// // // // import * as ImagePicker from "expo-image-picker";
// // // // import { LinearGradient } from "expo-linear-gradient";
// // // // import { apiFetch } from "../../lib/apiFetch";
// // // // import PhotosManagerModal from "../../components/profile/PhotosManagerModal";

// // // // // ─── Screen geometry ──────────────────────────────────────────────────────────
// // // // const { width: SW }  = Dimensions.get("window");
// // // // const ST_BAR         = Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

// // // // // Taller cover so avatar has a big gap from top (like image 2)
// // // // const COVER_H        = 500;
// // // // const COVER_FULL     = COVER_H + ST_BAR;
// // // // const AVATAR_SIZE    = 96;
// // // // const STICKY_CONTENT = 52;
// // // // const STICKY_H       = STICKY_CONTENT + ST_BAR;

// // // // // Avatar hangs 50% below sticky bar bottom into white body
// // // // const AVATAR_HANG    = AVATAR_SIZE * 0.50;

// // // // // Stats row height — taller so "Events Hosted" / "Total Attendees" labels don't clip
// // // // const STATS_H        = 96;

// // // // // Total sticky height = bar + avatar hang + stats row
// // // // const STICKY_TOTAL   = STICKY_H + AVATAR_HANG + STATS_H;

// // // // const TRIGGER        = 120;

// // // // // ─── Photo grid ───────────────────────────────────────────────────────────────
// // // // const GRID_W     = SW - 32;
// // // // const RIGHT_W    = GRID_W * (1 / 2.15) - 4;
// // // // const PHOTO_SM   = Math.floor((RIGHT_W - 4) / 2);
// // // // const PHOTO_LG_H = PHOTO_SM * 2 + 4;

// // // // // ─── Colours ──────────────────────────────────────────────────────────────────
// // // // const C = {
// // // //   bg: "#F2F2F7", white: "#FFFFFF", ink: "#111111", muted: "#888888", border: "#EEEEEE",
// // // //   // ↓ Gradient exactly like image 1: warm orange-pink left → purple mid → cool indigo right
// // // //   cov1: "#D4405A", cov2: "#9B3EBF", cov3: "#5B4FD4",
// // // //   // Nav gradient (same, used in sticky bar)
// // // //   nav1: "#C8406A", nav2: "#8B3EBF", nav3: "#5B4FD4",
// // // //   p1: "#E8175D", pLight: "#FFF0F5",
// // // //   danger: "#E53935", dangerBg: "#FFF5F5", dangerBorder: "#FFCDD2", dangerText: "#C62828",
// // // // };

// // // // // ─── Interest icons ───────────────────────────────────────────────────────────
// // // // const INTEREST_ICON: Record<string, string> = {
// // // //   "art": "color-palette-outline",      "cultural activities": "musical-notes-outline",
// // // //   "music": "headset-outline",           "networking": "people-outline",
// // // //   "photography": "camera-outline",      "painting": "brush-outline",
// // // //   "yoga": "body-outline",               "travelling": "airplane-outline",
// // // //   "travel": "airplane-outline",         "cooking": "restaurant-outline",
// // // //   "sports": "football-outline",         "reading": "book-outline",
// // // //   "gaming": "game-controller-outline",  "fitness": "barbell-outline",
// // // //   "tech": "hardware-chip-outline",
// // // // };
// // // // function interestIcon(label: string) {
// // // //   const k = label.toLowerCase();
// // // //   for (const [key, val] of Object.entries(INTEREST_ICON)) { if (k.includes(key)) return val; }
// // // //   return "star-outline";
// // // // }

// // // // // ─── Types ────────────────────────────────────────────────────────────────────
// // // // type ProfileData = {
// // // //   name?: string; username?: string; about?: string;
// // // //   interests?: string[]; languages?: string[]; photos?: string[]; avatar?: string | null;
// // // //   rating?: number; eventsHosted?: number; totalAttendees?: number;
// // // // };
// // // // function sanitizePhotos(p?: unknown): string[] {
// // // //   if (!Array.isArray(p)) return [];
// // // //   return p.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
// // // // }
// // // // const STORAGE_KEY      = "@profile";
// // // // const PROFILE_ENDPOINT = "/api/profile";

// // // // // ─────────────────────────────────────────────────────────────────────────────
// // // // export default function ProfileHome() {
// // // //   const router        = useRouter();
// // // //   const { signOut, userId } = useAuth();
// // // //   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
// // // //   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

// // // //   // ── state ─────────────────────────────────────────────────────────────────
// // // //   const [profile, setProfile]                 = useState<ProfileData>({});
// // // //   const [refreshing, setRefreshing]           = useState(false);
// // // //   const [photosOpen, setPhotosOpen]           = useState(false);
// // // //   const [menuOpen, setMenuOpen]               = useState(false);
// // // //   const [previewOpen, setPreviewOpen]         = useState(false);
// // // //   const [previewUri, setPreviewUri]           = useState<string | null>(null);
// // // //   const [logoutModalOpen, setLogoutModalOpen] = useState(false);
// // // //   const [scrolled, setScrolled]               = useState(false);

// // // //   // ── derived ───────────────────────────────────────────────────────────────
// // // //   const photos        = useMemo(() => sanitizePhotos(profile.photos), [profile.photos]);
// // // //   const previewPhotos = photos.slice(0, 4);
// // // //   const hasAvatar     = !!(profile.avatar);
// // // //   const avatarUri     = profile.avatar ?? null;

// // // //   // ── animation refs ────────────────────────────────────────────────────────
// // // //   const scrollY   = useRef(new Animated.Value(0)).current;

// // // //   // ── scroll-driven values ──────────────────────────────────────────────────
// // // //   const stickyOpacity    = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [0, 1], extrapolate: "clamp" });
// // // //   const stickyTranslateY = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [-STICKY_TOTAL, 0], extrapolate: "clamp" });

// // // //   const coverHeight = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 32], outputRange: [COVER_FULL, 0], extrapolate: "clamp" });
// // // //   const coverImgParallax = scrollY.interpolate({ inputRange: [0, COVER_FULL], outputRange: [0, -COVER_FULL * 0.3], extrapolate: "clamp" });
// // // //   const coverBtnOpacity  = scrollY.interpolate({ inputRange: [0, TRIGGER - 50], outputRange: [1, 0], extrapolate: "clamp" });
// // // //   const coverInfoOpacity = scrollY.interpolate({ inputRange: [0, TRIGGER - 50], outputRange: [1, 0], extrapolate: "clamp" });
// // // //   const whiteRadius      = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [28, 0], extrapolate: "clamp" });

// // // //   const avatarOp    = scrollY.interpolate({ inputRange: [TRIGGER, TRIGGER + 36], outputRange: [0, 1], extrapolate: "clamp" });
// // // //   const avatarScale = scrollY.interpolate({ inputRange: [TRIGGER, TRIGGER + 44], outputRange: [0.55, 1], extrapolate: "clamp" });

// // // //   // Stats in sticky — no opacity animation needed (always fully shown)
// // // //   // const statsInStickyOp removed

// // // //   // ── pulse ring — REMOVED (no animation behind avatar) ────────────────────

// // // //   // ── data fetching ─────────────────────────────────────────────────────────
// // // //   const fetchProfile = useCallback(async () => {
// // // //     if (!API_BASE || !userId) return;
// // // //     try {
// // // //       const url = `${API_BASE.replace(/\/$/, "")}${PROFILE_ENDPOINT}?clerkUserId=${encodeURIComponent(userId)}`;
// // // //       const res = await apiFetch(url, { method: "GET", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {} });
// // // //       if (!res.ok) throw new Error(`Failed (${res.status})`);
// // // //       const j = await res.json().catch(() => ({}));
// // // //       const s = (j?.profile || j?.data || j) as any;
// // // //       const next: ProfileData = {
// // // //         name: s?.name, username: s?.username, about: s?.about,
// // // //         interests: Array.isArray(s?.interests) ? s.interests : [],
// // // //         languages: Array.isArray(s?.languages) ? s.languages : [],
// // // //         photos: Array.isArray(s?.photos) ? s.photos : [],
// // // //         avatar: typeof s?.avatar === "string" ? s.avatar : null,
// // // //         rating: s?.rating ?? s?.averageRating ?? undefined,
// // // //         eventsHosted: s?.eventsHosted ?? s?.events_hosted ?? undefined,
// // // //         totalAttendees: s?.totalAttendees ?? s?.total_attendees ?? undefined,
// // // //       };
// // // //       setProfile(next);
// // // //       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
// // // //     } catch {}
// // // //   }, [API_BASE, EVENT_API_KEY, userId]);

// // // //   useEffect(() => {
// // // //     (async () => {
// // // //       const r = await AsyncStorage.getItem(STORAGE_KEY);
// // // //       if (r) try { setProfile(JSON.parse(r)); } catch {}
// // // //       await fetchProfile();
// // // //     })();
// // // //   }, [fetchProfile]);
// // // //   useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

// // // //   const onRefresh = useCallback(async () => {
// // // //     setRefreshing(true); try { await fetchProfile(); } finally { setRefreshing(false); }
// // // //   }, [fetchProfile]);

// // // //   const handleConfirmedLogout = async () => {
// // // //     setLogoutModalOpen(false);
// // // //     await AsyncStorage.removeItem(STORAGE_KEY);
// // // //     await signOut();
// // // //     router.replace("/sign-in");
// // // //   };

// // // //   const openPreview = useCallback((uri: string | null) => {
// // // //     if (!uri) return; setPreviewUri(uri); setPreviewOpen(true);
// // // //   }, []);

// // // //   async function uploadPhoto(replaceUri?: string | null, isAvatar?: boolean) {
// // // //     if (!API_BASE || !userId) return;
// // // //     const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
// // // //     if (!perm.granted) throw new Error("Please allow photo permissions.");
// // // //     const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [1, 1] });
// // // //     if (picked.canceled) return;
// // // //     const asset = picked.assets?.[0]; const uri = asset?.uri;
// // // //     if (!uri) throw new Error("No photo selected.");
// // // //     let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
// // // //     if (isAvatar) url += "&isAvatar=true";
// // // //     else if (replaceUri) url += `&replaceUri=${encodeURIComponent(replaceUri)}`;
// // // //     const form = new FormData();
// // // //     form.append("file", { uri, name: asset?.fileName?.trim() || `photo_${Date.now()}.jpg`, type: asset?.mimeType || "image/jpeg" } as any);
// // // //     const res = await apiFetch(url, { method: "POST", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}, body: form as any });
// // // //     if (!res.ok) { const t = await res.text().catch(() => ""); let m = `Upload failed (${res.status})`; try { m = JSON.parse(t)?.error || m; } catch {} throw new Error(m); }
// // // //     await fetchProfile();
// // // //   }

// // // //   async function deletePhoto(uri: string, isAvatar?: boolean) {
// // // //     if (!API_BASE || !userId) return;
// // // //     let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
// // // //     if (isAvatar) url += "&isAvatar=true";
// // // //     const res = await apiFetch(url, { method: "DELETE", headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) }, body: JSON.stringify({ uri }) });
// // // //     if (!res.ok) throw new Error(`Delete failed (${res.status})`);
// // // //     await fetchProfile();
// // // //   }

// // // //   // ─── Reusable Stats Row ───────────────────────────────────────────────────
// // // //   // isOnGradient=true → white text (for sticky bar over gradient)
// // // //   // isOnGradient=false → dark text (for white body)
// // // //   const StatsRow = ({ style, isOnGradient = false }: { style?: any; isOnGradient?: boolean }) => {
// // // //     const numColor   = isOnGradient ? "#fff"                    : "#111";
// // // //     const labelColor = isOnGradient ? "rgba(255,255,255,0.80)" : "#888";
// // // //     const divColor   = isOnGradient ? "rgba(255,255,255,0.30)" : "#EEE";
// // // //     const plusColor  = isOnGradient ? "rgba(255,255,255,0.40)" : "#CCC";
// // // //     const starColor  = isOnGradient ? "#FFD700"                 : "#F5A623";
// // // //     return (
// // // //       <View style={[S.statsRow, style]}>
// // // //         <View style={S.statItem}>
// // // //           <View style={S.statNumRow}>
// // // //             <Ionicons name="star" size={14} color={starColor} style={{ marginRight: 3 }} />
// // // //             <Text style={[S.statNum, { color: numColor }]}>{(profile as any).rating ?? "4.8"}</Text>
// // // //           </View>
// // // //           <Text style={[S.statLabel, { color: labelColor }]}>Rating</Text>
// // // //         </View>
// // // //         <Text style={[S.statPlus, { color: plusColor }]}>✦</Text>
// // // //         <View style={[S.statDivider, { backgroundColor: divColor }]} />
// // // //         <View style={S.statItem}>
// // // //           <Text style={[S.statNum, { color: numColor }]}>{(profile as any).eventsHosted ?? 10}</Text>
// // // //           <Text style={[S.statLabel, { color: labelColor }]}>{"Events\nHosted"}</Text>
// // // //         </View>
// // // //         <Text style={[S.statPlus, { color: plusColor }]}>✦</Text>
// // // //         <View style={[S.statDivider, { backgroundColor: divColor }]} />
// // // //         <View style={S.statItem}>
// // // //           <Text style={[S.statNum, { color: numColor }]}>{(profile as any).totalAttendees ?? 300}</Text>
// // // //           <Text style={[S.statLabel, { color: labelColor }]}>{"Total\nAttendees"}</Text>
// // // //         </View>
// // // //       </View>
// // // //     );
// // // //   };

// // // //   // ─── RENDER ───────────────────────────────────────────────────────────────
// // // //   return (
// // // //     <View style={S.root}>
// // // //       <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

// // // //       {/* ══ STICKY BAR ══
// // // //            Layout (top → bottom):
// // // //            [gradient bar: X ←     → ✏️ ⚙️]   height = STICKY_H
// // // //            [avatar centred, overflows bar]     AVATAR_HANG below bar
// // // //            [stats row]                          STATS_H
// // // //       */}
// // // //       <Animated.View
// // // //         style={[S.stickyOuter, { opacity: stickyOpacity, transform: [{ translateY: stickyTranslateY }] }]}
// // // //         pointerEvents={scrolled ? "auto" : "none"}
// // // //       >
// // // //         {/* Gradient background — same as cover */}
// // // //         <LinearGradient
// // // //           colors={[C.nav1, C.nav2, C.nav3]}
// // // //           start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
// // // //           style={S.stickyGrad}
// // // //         />

// // // //         {/* Top row: X — [center space for avatar] — ✏️ ⚙️ */}
// // // //         <View style={S.stickyRow}>
// // // //           <TouchableOpacity style={S.stickyBackBtn} onPress={() => router.back()}>
// // // //             <Ionicons name="close" size={18} color="#fff" />
// // // //           </TouchableOpacity>
// // // //           <View style={{ flex: 1 }} />
// // // //           <View style={S.stickyActions}>
// // // //             <TouchableOpacity style={S.stickyBtn} onPress={() => router.push("/profile/settings/PersonalInfo" as any)}>
// // // //               <Ionicons name="pencil" size={16} color="#fff" />
// // // //             </TouchableOpacity>
// // // //             <TouchableOpacity style={S.stickyBtn} onPress={() => router.push("/profile/settings")}>
// // // //               <Ionicons name="settings-outline" size={17} color="#fff" />
// // // //             </TouchableOpacity>
// // // //           </View>
// // // //         </View>

// // // //         {/* Avatar — centred, hangs AVATAR_HANG below bar into white area */}
// // // //         <Animated.View style={[S.avatarWrap, { opacity: avatarOp, transform: [{ scale: avatarScale }] }]}>
// // // //           {avatarUri
// // // //             ? <Image source={{ uri: avatarUri }} style={S.avatarImg} />
// // // //             : <LinearGradient colors={[C.cov1, C.cov2]} style={S.avatarImg}>
// // // //                 <Ionicons name="person" size={32} color="rgba(255,255,255,0.55)" />
// // // //               </LinearGradient>
// // // //           }
// // // //           <TouchableOpacity style={S.avatarEditBadge} onPress={() => setMenuOpen(true)} activeOpacity={0.85}>
// // // //             <Ionicons name="camera" size={13} color="#fff" />
// // // //           </TouchableOpacity>
// // // //         </Animated.View>

// // // //         {/* Stats row — white text on gradient, always fully visible when sticky is shown */}
// // // //         <View style={S.stickyStatsWrap}>
// // // //           <StatsRow isOnGradient={true} />
// // // //         </View>
// // // //       </Animated.View>

// // // //       {/* ══ SCROLL VIEW ══ */}
// // // //       <Animated.ScrollView
// // // //         style={S.scroll}
// // // //         contentContainerStyle={S.content}
// // // //         showsVerticalScrollIndicator={false}
// // // //         scrollEventThrottle={16}
// // // //         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
// // // //         onScroll={Animated.event(
// // // //           [{ nativeEvent: { contentOffset: { y: scrollY } } }],
// // // //           {
// // // //             useNativeDriver: false,
// // // //             listener: (e: any) => setScrolled(e.nativeEvent.contentOffset.y > TRIGGER - 10),
// // // //           }
// // // //         )}
// // // //       >
// // // //         {/* ── COVER ── */}
// // // //         <Animated.View style={[S.cover, { height: coverHeight }]}>
// // // //           <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: coverImgParallax }] }]}>
// // // //             {hasAvatar && avatarUri
// // // //               ? <Image source={{ uri: avatarUri }} style={S.coverPhoto} resizeMode="cover" />
// // // //               : (
// // // //                 // ↓ Exact gradient from image: warm orange-pink → purple → cool indigo
// // // //                 <LinearGradient
// // // //                   colors={[C.cov1, C.cov2, C.cov3]}
// // // //                   start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
// // // //                   style={StyleSheet.absoluteFill}
// // // //                 />
// // // //               )
// // // //             }
// // // //           </Animated.View>
// // // //           <LinearGradient colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]} style={StyleSheet.absoluteFill} />

// // // //           {/* Cover buttons */}
// // // //           <Animated.View style={[S.coverTop, { opacity: coverBtnOpacity }]}>
// // // //             <TouchableOpacity style={S.coverBtn} onPress={() => router.back()}>
// // // //               <Ionicons name="close" size={20} color="#fff" />
// // // //             </TouchableOpacity>
// // // //             <View style={S.coverTopRight}>
// // // //               <TouchableOpacity style={S.coverBtn} onPress={() => router.push("/profile/settings/PersonalInfo" as any)}>
// // // //                 <Ionicons name="pencil" size={18} color="#fff" />
// // // //               </TouchableOpacity>
// // // //               <TouchableOpacity style={S.coverBtn} onPress={() => router.push("/profile/settings")}>
// // // //                 <Ionicons name="settings-outline" size={19} color="#fff" />
// // // //               </TouchableOpacity>
// // // //             </View>
// // // //           </Animated.View>

// // // //           {!hasAvatar && (
// // // //             <TouchableOpacity style={S.addPhotoBtn} onPress={() => setMenuOpen(true)}>
// // // //               <Ionicons name="camera-outline" size={14} color="rgba(255,255,255,0.9)" />
// // // //               <Text style={S.addPhotoTxt}>Add Photo</Text>
// // // //             </TouchableOpacity>
// // // //           )}

// // // //           <Animated.View style={[S.coverInfo, { opacity: coverInfoOpacity }]}>
// // // //             <Text style={S.coverName}>{profile.name || "User Name"}</Text>
// // // //             <Text style={S.coverUsername}>{profile.username ? `@${profile.username}` : "Name"}</Text>
// // // //             <View style={S.coverMetaRow}><Ionicons name="mail-outline" size={11} color="rgba(255,255,255,0.75)" /><Text style={S.coverMeta}>email@gmail.com</Text></View>
// // // //             <View style={S.coverMetaRow}><Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.75)" /><Text style={S.coverMeta}>Location, Country</Text></View>
// // // //           </Animated.View>
// // // //         </Animated.View>

// // // //         {/* ── WHITE BODY ── */}
// // // //         {/* paddingTop = AVATAR_HANG + STATS_H so content starts below floating avatar + stats */}
// // // //         <Animated.View style={[S.whiteBody, { borderTopLeftRadius: whiteRadius, borderTopRightRadius: whiteRadius }]}>

// // // //           {/* Stats row — shown when NOT scrolled */}
// // // //           <StatsRow isOnGradient={false} style={{ borderBottomWidth: 1, borderColor: "#EEE" }} />

// // // //           {/* Verify card */}
// // // //           <TouchableOpacity style={S.verifyCard} activeOpacity={0.92}>
// // // //             <View style={S.verifyIcon}><Ionicons name="shield-checkmark" size={20} color={C.p1} /></View>
// // // //             <View style={{ flex: 1 }}>
// // // //               <Text style={S.verifyTitle}>Get verified</Text>
// // // //               <Text style={S.verifySub}>Lorem ipsum is simply dummy text of the industry.</Text>
// // // //             </View>
// // // //             <Ionicons name="chevron-forward" size={18} color="#CCC" />
// // // //           </TouchableOpacity>

// // // //           {/* Photos */}
// // // //           <View style={S.secDiv} />
// // // //           <View style={S.sec}>
// // // //             <View style={S.secHead}>
// // // //               <Text style={S.secTitle}>Photos</Text>
// // // //               <TouchableOpacity style={S.secEdit} onPress={() => setPhotosOpen(true)}>
// // // //                 <Ionicons name="pencil" size={13} color="#777" />
// // // //               </TouchableOpacity>
// // // //             </View>
// // // //             <View style={[S.photoGrid, { height: PHOTO_LG_H }]}>
// // // //               <TouchableOpacity style={[S.photoLg, { height: PHOTO_LG_H }]} onPress={() => previewPhotos[0] && openPreview(previewPhotos[0])} activeOpacity={0.88}>
// // // //                 {previewPhotos[0]
// // // //                   ? <Image source={{ uri: previewPhotos[0] }} style={S.photoImg} />
// // // //                   : <View style={[S.photoEmpty, { height: PHOTO_LG_H }]}><Ionicons name="image-outline" size={26} color="#CCC" /></View>
// // // //                 }
// // // //               </TouchableOpacity>
// // // //               <View style={S.photoRightCol}>
// // // //                 <View style={S.photoRow}>
// // // //                   {[1, 2].map(i => (
// // // //                     <TouchableOpacity key={i} style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => previewPhotos[i] && openPreview(previewPhotos[i])} activeOpacity={0.88}>
// // // //                       {previewPhotos[i]
// // // //                         ? <Image source={{ uri: previewPhotos[i] }} style={S.photoImg} />
// // // //                         : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}><Ionicons name="image-outline" size={16} color="#CCC" /></View>
// // // //                       }
// // // //                     </TouchableOpacity>
// // // //                   ))}
// // // //                 </View>
// // // //                 <View style={S.photoRow}>
// // // //                   <TouchableOpacity style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => previewPhotos[3] && openPreview(previewPhotos[3])} activeOpacity={0.88}>
// // // //                     {previewPhotos[3]
// // // //                       ? <Image source={{ uri: previewPhotos[3] }} style={S.photoImg} />
// // // //                       : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}><Ionicons name="image-outline" size={16} color="#CCC" /></View>
// // // //                     }
// // // //                   </TouchableOpacity>
// // // //                   <TouchableOpacity style={[S.photoAdd, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => setPhotosOpen(true)} activeOpacity={0.88}>
// // // //                     <Ionicons name="camera-outline" size={18} color={C.p1} />
// // // //                     <Text style={S.photoAddTxt}>Add</Text>
// // // //                   </TouchableOpacity>
// // // //                 </View>
// // // //               </View>
// // // //             </View>
// // // //           </View>

// // // //           <PhotosManagerModal visible={photosOpen} onClose={() => setPhotosOpen(false)} photos={photos} maxPhotos={20} minPhotos={0} onUpload={uploadPhoto} onDelete={deletePhoto} />

// // // //           {/* About */}
// // // //           <View style={S.secDiv} />
// // // //           <View style={S.sec}>
// // // //             <View style={S.secHead}><Text style={S.secTitle}>About</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/AboutMe" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// // // //             <Text style={S.bodyTxt}>{profile.about || "Add something about you…"}</Text>
// // // //           </View>

// // // //           {/* Interests */}
// // // //           <View style={S.secDiv} />
// // // //           <View style={S.sec}>
// // // //             <View style={S.secHead}><Text style={S.secTitle}>Interests</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/Interests" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// // // //             <View style={S.chipsWrap}>
// // // //               {(profile.interests?.length ? profile.interests : ["Art","Cultural Activities","Music","Networking","Photography","Painting","Yoga","Travelling"]).map((x, i) => (
// // // //                 <View key={i} style={S.chip}>
// // // //                   <Ionicons name={interestIcon(x) as any} size={13} color="#555" style={{ marginRight: 4 }} />
// // // //                   <Text style={S.chipTxt}>{x}</Text>
// // // //                 </View>
// // // //               ))}
// // // //             </View>
// // // //           </View>

// // // //           {/* Language */}
// // // //           <View style={S.secDiv} />
// // // //           <View style={S.sec}>
// // // //             <View style={S.secHead}><Text style={S.secTitle}>Language</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/Languages" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// // // //             <View style={S.chipsWrap}>
// // // //               {(profile.languages?.length ? profile.languages : ["English","Hindi","French"]).map(x => (
// // // //                 <View key={x} style={S.chip}>
// // // //                   <Ionicons name="language-outline" size={13} color="#555" style={{ marginRight: 4 }} />
// // // //                   <Text style={S.chipTxt}>{x}</Text>
// // // //                 </View>
// // // //               ))}
// // // //             </View>
// // // //           </View>

// // // //           {/* Logout */}
// // // //           <TouchableOpacity style={S.logoutBtn} activeOpacity={0.88} onPress={() => setLogoutModalOpen(true)}>
// // // //             <Ionicons name="log-out-outline" size={18} color={C.dangerText} />
// // // //             <Text style={S.logoutTxt}>Log out</Text>
// // // //           </TouchableOpacity>
// // // //         </Animated.View>
// // // //       </Animated.ScrollView>

// // // //       {/* ══ MODALS ══ */}
// // // //       <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
// // // //         <View style={S.previewOverlay}>
// // // //           <TouchableOpacity style={S.previewClose} onPress={() => setPreviewOpen(false)}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
// // // //           {previewUri && <Image source={{ uri: previewUri }} style={S.previewImg} resizeMode="contain" />}
// // // //         </View>
// // // //       </Modal>

// // // //       <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
// // // //         <TouchableOpacity style={S.sheetOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
// // // //           <View style={S.sheet}>
// // // //             <View style={S.grabber} /><Text style={S.sheetTitle}>Profile Photo</Text>
// // // //             <TouchableOpacity style={S.sheetRow} onPress={async () => { setMenuOpen(false); try { await uploadPhoto(null, true); } catch (e: any) { alert(e.message); } }}>
// // // //               <View style={[S.sheetIcon, { backgroundColor: C.pLight }]}><Ionicons name="image-outline" size={19} color={C.p1} /></View>
// // // //               <Text style={[S.sheetRowTxt, { marginLeft: 14 }]}>Update Photo</Text>
// // // //             </TouchableOpacity>
// // // //             {hasAvatar && (
// // // //               <TouchableOpacity style={[S.sheetRow, { borderBottomWidth: 0 }]} onPress={async () => { setMenuOpen(false); try { await deletePhoto("", true); } catch (e: any) { alert(e.message); } }}>
// // // //                 <View style={[S.sheetIcon, { backgroundColor: C.dangerBg }]}><Ionicons name="trash-outline" size={19} color={C.danger} /></View>
// // // //                 <Text style={[S.sheetRowTxt, { marginLeft: 14, color: C.dangerText }]}>Remove Photo</Text>
// // // //               </TouchableOpacity>
// // // //             )}
// // // //             <TouchableOpacity style={S.sheetCancel} onPress={() => setMenuOpen(false)}><Text style={S.sheetCancelTxt}>Cancel</Text></TouchableOpacity>
// // // //           </View>
// // // //         </TouchableOpacity>
// // // //       </Modal>

// // // //       <Modal visible={logoutModalOpen} transparent animationType="fade" onRequestClose={() => setLogoutModalOpen(false)}>
// // // //         <View style={S.modalOverlay}>
// // // //           <View style={S.modalCard}>
// // // //             <View style={[S.modalIconBg, { backgroundColor: C.dangerBg }]}><Ionicons name="log-out" size={28} color={C.danger} /></View>
// // // //             <Text style={S.modalTitle}>Log out</Text>
// // // //             <Text style={S.modalSub}>Are you sure you want to log out from your account?</Text>
// // // //             <View style={S.modalBtnRow}>
// // // //               <TouchableOpacity style={[S.modalBtn, { backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB" }]} onPress={() => setLogoutModalOpen(false)}>
// // // //                 <Text style={[S.modalBtnTxt, { color: C.muted }]}>Cancel</Text>
// // // //               </TouchableOpacity>
// // // //               <TouchableOpacity style={[S.modalBtn, { backgroundColor: C.danger }]} onPress={handleConfirmedLogout}>
// // // //                 <Text style={[S.modalBtnTxt, { color: "#fff" }]}>Log out</Text>
// // // //               </TouchableOpacity>
// // // //             </View>
// // // //           </View>
// // // //         </View>
// // // //       </Modal>
// // // //     </View>
// // // //   );
// // // // }

// // // // // ─── Styles ───────────────────────────────────────────────────────────────────
// // // // const S = StyleSheet.create({
// // // //   root:    { flex: 1, backgroundColor: "#000" },
// // // //   scroll:  { flex: 1 },
// // // //   content: { paddingBottom: 48 },

// // // //   // ── Sticky bar ──────────────────────────────────────────────────────────────
// // // //   stickyOuter: {
// // // //     position: "absolute", top: 0, left: 0, right: 0,
// // // //     zIndex: 100,
// // // //     height: STICKY_H + AVATAR_HANG + STATS_H,
// // // //     overflow: "hidden",
// // // //   },
// // // //   stickyGrad: {
// // // //     // Gradient fills the ENTIRE sticky area — bar + avatar zone + stats zone
// // // //     // This matches image 3 where gradient background shows behind stats too
// // // //     position: "absolute", top: 0, left: 0, right: 0,
// // // //     bottom: 0,
// // // //   },
// // // //   stickyRow: {
// // // //     position: "absolute", top: 0, left: 0, right: 0,
// // // //     height: STICKY_H,
// // // //     flexDirection: "row",
// // // //     alignItems: "center",
// // // //     paddingTop: ST_BAR,
// // // //     paddingHorizontal: 14,
// // // //   },
// // // //   stickyBackBtn: {
// // // //     width: 34, height: 34, borderRadius: 17,
// // // //     backgroundColor: "rgba(255,255,255,0.18)",
// // // //     borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
// // // //     alignItems: "center", justifyContent: "center",
// // // //   },
// // // //   stickyActions: { flexDirection: "row", gap: 8 },
// // // //   stickyBtn: {
// // // //     width: 36, height: 36, borderRadius: 18,
// // // //     backgroundColor: "rgba(255,255,255,0.18)",
// // // //     borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
// // // //     alignItems: "center", justifyContent: "center",
// // // //   },

// // // //   // Avatar: centred, bottom of stickyOuter aligns with bottom of avatar
// // // //   // i.e. it sits at (STICKY_H - AVATAR_SIZE + AVATAR_HANG) from top
// // // //   avatarWrap: {
// // // //     position: "absolute",
// // // //     // top of avatar = STICKY_H - AVATAR_SIZE + AVATAR_HANG
// // // //     // This puts it centred over the bar/white boundary
// // // //     top: STICKY_H - (AVATAR_SIZE / 2),
// // // //     left: SW / 2 - AVATAR_SIZE / 2,
// // // //     width: AVATAR_SIZE, height: AVATAR_SIZE,
// // // //     borderRadius: AVATAR_SIZE / 2,
// // // //     alignItems: "center", justifyContent: "center",
// // // //     zIndex: 102,
// // // //     shadowColor: "#000",
// // // //     shadowOffset: { width: 0, height: 3 },
// // // //     shadowOpacity: 0.22, shadowRadius: 10, elevation: 10,
// // // //   },
// // // //   avatarImg: {
// // // //     width: AVATAR_SIZE, height: AVATAR_SIZE,
// // // //     borderRadius: AVATAR_SIZE / 2,
// // // //     borderWidth: 3.5, borderColor: "#fff",
// // // //     overflow: "hidden",
// // // //     backgroundColor: "#444",
// // // //     alignItems: "center", justifyContent: "center",
// // // //   },
// // // //   avatarEditBadge: {
// // // //     position: "absolute", bottom: 4, right: 4,
// // // //     width: 30, height: 30, borderRadius: 15,
// // // //     backgroundColor: "#1DA1F2",
// // // //     borderWidth: 2.5, borderColor: "#fff",
// // // //     alignItems: "center", justifyContent: "center",
// // // //     zIndex: 103,
// // // //   },

// // // //   // Stats inside sticky — transparent so gradient shows through (like image 3)
// // // //   stickyStatsWrap: {
// // // //     position: "absolute",
// // // //     top: STICKY_H + AVATAR_HANG,
// // // //     left: 0, right: 0,
// // // //     height: STATS_H,
// // // //     backgroundColor: "transparent",
// // // //   },

// // // //   // ── Cover ────────────────────────────────────────────────────────────────────
// // // //   cover:      { paddingTop: ST_BAR, justifyContent: "space-between", overflow: "hidden" },
// // // //   coverPhoto: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
// // // //   coverTop:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 10 },
// // // //   coverTopRight: { flexDirection: "row", gap: 10 },
// // // //   coverBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(50,50,50,0.45)", alignItems: "center", justifyContent: "center" },
// // // //   addPhotoBtn:{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 8, backgroundColor: "rgba(0,0,0,0.28)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" },
// // // //   addPhotoTxt:{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.92)" },
// // // //   coverInfo:  { paddingHorizontal: 16, paddingBottom: 28 },
// // // //   coverName:  { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.4, marginBottom: 2 },
// // // //   coverUsername: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginBottom: 6 },
// // // //   coverMetaRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
// // // //   coverMeta:     { fontSize: 12, color: "rgba(255,255,255,0.75)" },

// // // //   // ── White body ────────────────────────────────────────────────────────────────
// // // //   // paddingTop = AVATAR_HANG so stats in body appear below the hanging avatar
// // // //   whiteBody: {
// // // //     backgroundColor: "#fff",
// // // //     marginTop: -28,
// // // //     // AVATAR_HANG gives space for avatar overlap, +8 for small visual gap
// // // //     paddingTop: Math.round(AVATAR_HANG) + 8,
// // // //     paddingBottom: 16,
// // // //   },

// // // //   // ── Stats row — used in BOTH body and sticky ──────────────────────────────────
// // // //   statsRow:   { flexDirection: "row", alignItems: "center", paddingVertical: 0 },
// // // //   statItem:   { flex: 1, alignItems: "center", paddingVertical: 18 },
// // // //   statNumRow: { flexDirection: "row", alignItems: "center" },
// // // //   statNum:    { fontSize: 22, fontWeight: "900", color: "#111" },
// // // //   statLabel:  { fontSize: 10, color: "#888", fontWeight: "600", marginTop: 4, textAlign: "center", lineHeight: 15 },
// // // //   statPlus:   { fontSize: 12, color: "#CCC", paddingHorizontal: 2 },
// // // //   statDivider:{ width: 1, height: 36, backgroundColor: "#EEE" },

// // // //   verifyCard:  { flexDirection: "row", alignItems: "center", gap: 12, margin: 14, padding: 14, borderWidth: 1, borderColor: "#EEE", borderRadius: 14, backgroundColor: "#fff" },
// // // //   verifyIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center" },
// // // //   verifyTitle: { fontSize: 14, fontWeight: "800", color: "#111" },
// // // //   verifySub:   { fontSize: 12, color: "#888", marginTop: 2, lineHeight: 18 },

// // // //   secDiv:   { height: 8, backgroundColor: "#F2F2F7" },
// // // //   sec:      { paddingHorizontal: 16, paddingVertical: 16 },
// // // //   secHead:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
// // // //   secTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
// // // //   secEdit:  { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" },
// // // //   bodyTxt:  { fontSize: 13, color: "#555", lineHeight: 22 },

// // // //   photoGrid:    { flexDirection: "row", gap: 4 },
// // // //   photoLg:      { flex: 1.15, borderRadius: 12, overflow: "hidden", backgroundColor: "#F2F2F7" },
// // // //   photoRightCol:{ flex: 1, gap: 4, justifyContent: "space-between" },
// // // //   photoRow:     { flexDirection: "row", gap: 4 },
// // // //   photoSm:      { borderRadius: 8, overflow: "hidden", backgroundColor: "#F2F2F7" },
// // // //   photoAdd:     { borderRadius: 8, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#E8175D", backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center", gap: 2 },
// // // //   photoAddTxt:  { fontSize: 9, fontWeight: "700", color: "#E8175D" },
// // // //   photoEmpty:   { alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F7", borderRadius: 8 },
// // // //   photoImg:     { width: "100%", height: "100%", resizeMode: "cover" },

// // // //   chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
// // // //   chip:      { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E0E0E5" },
// // // //   chipTxt:   { fontSize: 12, fontWeight: "600", color: "#333" },

// // // //   logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 14, paddingVertical: 15, borderRadius: 14, backgroundColor: "#FFF5F5", borderWidth: 1.5, borderColor: "#FFCDD2" },
// // // //   logoutTxt: { fontSize: 14, fontWeight: "800", color: "#C62828" },

// // // //   previewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" },
// // // //   previewClose:   { position: "absolute", top: 52, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
// // // //   previewImg:     { width: "90%", height: "70%" },

// // // //   sheetOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
// // // //   sheet:          { backgroundColor: "#fff", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingBottom: 44, paddingTop: 14 },
// // // //   grabber:        { width: 44, height: 4, borderRadius: 999, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 20 },
// // // //   sheetTitle:     { fontSize: 17, fontWeight: "800", color: "#111", marginBottom: 16 },
// // // //   sheetRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
// // // //   sheetIcon:      { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
// // // //   sheetRowTxt:    { fontSize: 15, fontWeight: "700", color: "#111" },
// // // //   sheetCancel:    { marginTop: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center" },
// // // //   sheetCancelTxt: { fontSize: 14, fontWeight: "700", color: "#888" },

// // // //   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.48)", alignItems: "center", justifyContent: "center", padding: 20 },
// // // //   modalCard:    { backgroundColor: "#fff", borderRadius: 26, padding: 28, width: "100%", maxWidth: 340, alignItems: "center", elevation: 12 },
// // // //   modalIconBg:  { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 18 },
// // // //   modalTitle:   { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 10 },
// // // //   modalSub:     { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 21, marginBottom: 26 },
// // // //   modalBtnRow:  { flexDirection: "row", gap: 10, width: "100%" },
// // // //   modalBtn:     { flex: 1, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center" },
// // // //   modalBtnTxt:  { fontSize: 15, fontWeight: "800" },
// // // // });
// // // // app/profile/profileHome_anim_classic.tsx
// // // // ✅ Fixed:
// // // //   1. Stats row (Rating / Events / Attendees) stays visible after scroll — shown IN sticky bar
// // // //   2. Cover height increased so avatar has proper gap from top (like image)
// // // //   3. Background gradient matches image: orange-pink → purple → indigo-blue
// // // //   4. White body paddingTop increased so avatar doesn't overlap stats

// // // import React, {
// // //   useCallback, useEffect, useMemo, useRef, useState,
// // // } from "react";
// // // import {
// // //   View, Text, TouchableOpacity, Animated,
// // //   Image, RefreshControl, Modal, Dimensions,
// // //   StyleSheet, StatusBar, Platform,
// // // } from "react-native";
// // // import Ionicons from "@expo/vector-icons/Ionicons";
// // // import { useRouter, useFocusEffect } from "expo-router";
// // // import AsyncStorage from "@react-native-async-storage/async-storage";
// // // import { useAuth, useUser } from "@clerk/clerk-expo";
// // // import Constants from "expo-constants";
// // // import * as ImagePicker from "expo-image-picker";
// // // import { LinearGradient } from "expo-linear-gradient";
// // // import { apiFetch } from "../../lib/apiFetch";
// // // import PhotosManagerModal from "../../components/profile/PhotosManagerModal";

// // // // ─── Screen geometry ──────────────────────────────────────────────────────────
// // // const { width: SW }  = Dimensions.get("window");
// // // const ST_BAR         = Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

// // // // Taller cover so avatar has a big gap from top (like image 2)
// // // const COVER_H        = 500;
// // // const COVER_FULL     = COVER_H + ST_BAR;
// // // const AVATAR_SIZE    = 96;
// // // const STICKY_CONTENT = 52;
// // // const STICKY_H       = STICKY_CONTENT + ST_BAR;

// // // // Avatar hangs 50% below sticky bar bottom into white body
// // // const AVATAR_HANG    = AVATAR_SIZE * 0.50;

// // // // Stats row height — taller so "Events Hosted" / "Total Attendees" labels don't clip
// // // const STATS_H        = 96;

// // // // Total sticky height = bar + avatar hang + stats row
// // // const STICKY_TOTAL   = STICKY_H + AVATAR_HANG + STATS_H;

// // // const TRIGGER        = 120;

// // // // ─── Photo grid ───────────────────────────────────────────────────────────────
// // // const GRID_W     = SW - 32;
// // // const RIGHT_W    = GRID_W * (1 / 2.15) - 4;
// // // const PHOTO_SM   = Math.floor((RIGHT_W - 4) / 2);
// // // const PHOTO_LG_H = PHOTO_SM * 2 + 4;

// // // // ─── Colours ──────────────────────────────────────────────────────────────────
// // // const C = {
// // //   bg: "#F2F2F7", white: "#FFFFFF", ink: "#111111", muted: "#888888", border: "#EEEEEE",
// // //   // ↓ Gradient exactly like image 1: warm orange-pink left → purple mid → cool indigo right
// // //   cov1: "#D4405A", cov2: "#9B3EBF", cov3: "#5B4FD4",
// // //   // Nav gradient (same, used in sticky bar)
// // //   nav1: "#C8406A", nav2: "#8B3EBF", nav3: "#5B4FD4",
// // //   p1: "#E8175D", pLight: "#FFF0F5",
// // //   danger: "#E53935", dangerBg: "#FFF5F5", dangerBorder: "#FFCDD2", dangerText: "#C62828",
// // // };

// // // // ─── Interest icons ───────────────────────────────────────────────────────────
// // // const INTEREST_ICON: Record<string, string> = {
// // //   "art": "color-palette-outline",      "cultural activities": "musical-notes-outline",
// // //   "music": "headset-outline",           "networking": "people-outline",
// // //   "photography": "camera-outline",      "painting": "brush-outline",
// // //   "yoga": "body-outline",               "travelling": "airplane-outline",
// // //   "travel": "airplane-outline",         "cooking": "restaurant-outline",
// // //   "sports": "football-outline",         "reading": "book-outline",
// // //   "gaming": "game-controller-outline",  "fitness": "barbell-outline",
// // //   "tech": "hardware-chip-outline",
// // // };
// // // function interestIcon(label: string) {
// // //   const k = label.toLowerCase();
// // //   for (const [key, val] of Object.entries(INTEREST_ICON)) { if (k.includes(key)) return val; }
// // //   return "star-outline";
// // // }

// // // // ─── Types ────────────────────────────────────────────────────────────────────
// // // type ProfileData = {
// // //   name?: string; username?: string; about?: string;
// // //   interests?: string[]; languages?: string[]; photos?: string[]; avatar?: string | null;
// // //   rating?: number; eventsHosted?: number; totalAttendees?: number;
// // // };
// // // function sanitizePhotos(p?: unknown): string[] {
// // //   if (!Array.isArray(p)) return [];
// // //   return p.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
// // // }
// // // const STORAGE_KEY      = "@profile";
// // // const PROFILE_ENDPOINT = "/api/profile";

// // // // ─────────────────────────────────────────────────────────────────────────────
// // // export default function ProfileHome() {
// // //   const router        = useRouter();
// // //   const { signOut, userId } = useAuth();
// // //   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
// // //   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

// // //   // ── state ─────────────────────────────────────────────────────────────────
// // //   const [profile, setProfile]                 = useState<ProfileData>({});
// // //   const [refreshing, setRefreshing]           = useState(false);
// // //   const [photosOpen, setPhotosOpen]           = useState(false);
// // //   const [menuOpen, setMenuOpen]               = useState(false);
// // //   const [previewOpen, setPreviewOpen]         = useState(false);
// // //   const [previewUri, setPreviewUri]           = useState<string | null>(null);
// // //   const [logoutModalOpen, setLogoutModalOpen] = useState(false);
// // //   const [scrolled, setScrolled]               = useState(false);

// // //   // ── derived ───────────────────────────────────────────────────────────────
// // //   const photos        = useMemo(() => sanitizePhotos(profile.photos), [profile.photos]);
// // //   const previewPhotos = photos.slice(0, 4);
// // //   const hasAvatar     = !!(profile.avatar);
// // //   const avatarUri     = profile.avatar ?? null;

// // //   // ── animation refs ────────────────────────────────────────────────────────
// // //   const scrollY   = useRef(new Animated.Value(0)).current;

// // //   // ── scroll-driven values ──────────────────────────────────────────────────
// // //   // Sticky bar slides in from top + fades in
// // //   const stickyOpacity    = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [0, 1], extrapolate: "clamp" });
// // //   const stickyTranslateY = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [-STICKY_TOTAL, 0], extrapolate: "clamp" });

// // //   // Cover does NOT collapse — stays full height always (no shrink on scroll)
// // //   // Only parallax on the image inside
// // //   const coverImgParallax = scrollY.interpolate({ inputRange: [0, COVER_FULL], outputRange: [0, -COVER_FULL * 0.25], extrapolate: "clamp" });

// // //   // Cover buttons + info fade out smoothly as user scrolls
// // //   const coverBtnOpacity  = scrollY.interpolate({ inputRange: [0, TRIGGER - 30], outputRange: [1, 0], extrapolate: "clamp" });
// // //   const coverInfoOpacity = scrollY.interpolate({ inputRange: [0, TRIGGER - 30], outputRange: [1, 0], extrapolate: "clamp" });

// // //   // White body border-radius flattens as sticky appears
// // //   const whiteRadius = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [28, 0], extrapolate: "clamp" });

// // //   // Avatar in sticky: scale up + fade in
// // //   const avatarOp    = scrollY.interpolate({ inputRange: [TRIGGER, TRIGGER + 40], outputRange: [0, 1], extrapolate: "clamp" });
// // //   const avatarScale = scrollY.interpolate({ inputRange: [TRIGGER, TRIGGER + 50], outputRange: [0.6, 1], extrapolate: "clamp" });

// // //   // ── data fetching ─────────────────────────────────────────────────────────
// // //   const fetchProfile = useCallback(async () => {
// // //     if (!API_BASE || !userId) return;
// // //     try {
// // //       const url = `${API_BASE.replace(/\/$/, "")}${PROFILE_ENDPOINT}?clerkUserId=${encodeURIComponent(userId)}`;
// // //       const res = await apiFetch(url, { method: "GET", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {} });
// // //       if (!res.ok) throw new Error(`Failed (${res.status})`);
// // //       const j = await res.json().catch(() => ({}));
// // //       const s = (j?.profile || j?.data || j) as any;
// // //       const next: ProfileData = {
// // //         name: s?.name, username: s?.username, about: s?.about,
// // //         interests: Array.isArray(s?.interests) ? s.interests : [],
// // //         languages: Array.isArray(s?.languages) ? s.languages : [],
// // //         photos: Array.isArray(s?.photos) ? s.photos : [],
// // //         avatar: typeof s?.avatar === "string" ? s.avatar : null,
// // //         rating: s?.rating ?? s?.averageRating ?? undefined,
// // //         eventsHosted: s?.eventsHosted ?? s?.events_hosted ?? undefined,
// // //         totalAttendees: s?.totalAttendees ?? s?.total_attendees ?? undefined,
// // //       };
// // //       setProfile(next);
// // //       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
// // //     } catch {}
// // //   }, [API_BASE, EVENT_API_KEY, userId]);

// // //   useEffect(() => {
// // //     (async () => {
// // //       const r = await AsyncStorage.getItem(STORAGE_KEY);
// // //       if (r) try { setProfile(JSON.parse(r)); } catch {}
// // //       await fetchProfile();
// // //     })();
// // //   }, [fetchProfile]);
// // //   useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

// // //   const onRefresh = useCallback(async () => {
// // //     setRefreshing(true); try { await fetchProfile(); } finally { setRefreshing(false); }
// // //   }, [fetchProfile]);

// // //   const handleConfirmedLogout = async () => {
// // //     setLogoutModalOpen(false);
// // //     await AsyncStorage.removeItem(STORAGE_KEY);
// // //     await signOut();
// // //     router.replace("/sign-in");
// // //   };

// // //   const openPreview = useCallback((uri: string | null) => {
// // //     if (!uri) return; setPreviewUri(uri); setPreviewOpen(true);
// // //   }, []);

// // //   async function uploadPhoto(replaceUri?: string | null, isAvatar?: boolean) {
// // //     if (!API_BASE || !userId) return;
// // //     const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
// // //     if (!perm.granted) throw new Error("Please allow photo permissions.");
// // //     const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [1, 1] });
// // //     if (picked.canceled) return;
// // //     const asset = picked.assets?.[0]; const uri = asset?.uri;
// // //     if (!uri) throw new Error("No photo selected.");
// // //     let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
// // //     if (isAvatar) url += "&isAvatar=true";
// // //     else if (replaceUri) url += `&replaceUri=${encodeURIComponent(replaceUri)}`;
// // //     const form = new FormData();
// // //     form.append("file", { uri, name: asset?.fileName?.trim() || `photo_${Date.now()}.jpg`, type: asset?.mimeType || "image/jpeg" } as any);
// // //     const res = await apiFetch(url, { method: "POST", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}, body: form as any });
// // //     if (!res.ok) { const t = await res.text().catch(() => ""); let m = `Upload failed (${res.status})`; try { m = JSON.parse(t)?.error || m; } catch {} throw new Error(m); }
// // //     await fetchProfile();
// // //   }

// // //   async function deletePhoto(uri: string, isAvatar?: boolean) {
// // //     if (!API_BASE || !userId) return;
// // //     let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
// // //     if (isAvatar) url += "&isAvatar=true";
// // //     const res = await apiFetch(url, { method: "DELETE", headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) }, body: JSON.stringify({ uri }) });
// // //     if (!res.ok) throw new Error(`Delete failed (${res.status})`);
// // //     await fetchProfile();
// // //   }

// // //   // ─── Reusable Stats Row ───────────────────────────────────────────────────
// // //   // isOnGradient=true → white text (for sticky bar over gradient)
// // //   // isOnGradient=false → dark text (for white body)
// // //   const StatsRow = ({ style, isOnGradient = false }: { style?: any; isOnGradient?: boolean }) => {
// // //     const numColor   = isOnGradient ? "#fff"                    : "#111";
// // //     const labelColor = isOnGradient ? "rgba(255,255,255,0.80)" : "#888";
// // //     const divColor   = isOnGradient ? "rgba(255,255,255,0.30)" : "#EEE";
// // //     const plusColor  = isOnGradient ? "rgba(255,255,255,0.40)" : "#CCC";
// // //     const starColor  = isOnGradient ? "#FFD700"                 : "#F5A623";
// // //     return (
// // //       <View style={[S.statsRow, style]}>
// // //         <View style={S.statItem}>
// // //           <View style={S.statNumRow}>
// // //             <Ionicons name="star" size={14} color={starColor} style={{ marginRight: 3 }} />
// // //             <Text style={[S.statNum, { color: numColor }]}>{(profile as any).rating ?? "4.8"}</Text>
// // //           </View>
// // //           <Text style={[S.statLabel, { color: labelColor }]}>Rating</Text>
// // //         </View>
// // //         <Text style={[S.statPlus, { color: plusColor }]}>✦</Text>
// // //         <View style={[S.statDivider, { backgroundColor: divColor }]} />
// // //         <View style={S.statItem}>
// // //           <Text style={[S.statNum, { color: numColor }]}>{(profile as any).eventsHosted ?? 10}</Text>
// // //           <Text style={[S.statLabel, { color: labelColor }]}>{"Events\nHosted"}</Text>
// // //         </View>
// // //         <Text style={[S.statPlus, { color: plusColor }]}>✦</Text>
// // //         <View style={[S.statDivider, { backgroundColor: divColor }]} />
// // //         <View style={S.statItem}>
// // //           <Text style={[S.statNum, { color: numColor }]}>{(profile as any).totalAttendees ?? 300}</Text>
// // //           <Text style={[S.statLabel, { color: labelColor }]}>{"Total\nAttendees"}</Text>
// // //         </View>
// // //       </View>
// // //     );
// // //   };

// // //   // ─── RENDER ───────────────────────────────────────────────────────────────
// // //   return (
// // //     <View style={S.root}>
// // //       <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

// // //       {/* ══ STICKY BAR ══
// // //            Layout (top → bottom):
// // //            [gradient bar: X ←     → ✏️ ⚙️]   height = STICKY_H
// // //            [avatar centred, overflows bar]     AVATAR_HANG below bar
// // //            [stats row]                          STATS_H
// // //       */}
// // //       <Animated.View
// // //         style={[S.stickyOuter, { opacity: stickyOpacity, transform: [{ translateY: stickyTranslateY }] }]}
// // //         pointerEvents={scrolled ? "auto" : "none"}
// // //       >
// // //         {/* Gradient background — same as cover */}
// // //         <LinearGradient
// // //           colors={[C.nav1, C.nav2, C.nav3]}
// // //           start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
// // //           style={S.stickyGrad}
// // //         />

// // //         {/* Top row: X — [center space for avatar] — ✏️ ⚙️ */}
// // //         <View style={S.stickyRow}>
// // //           <TouchableOpacity style={S.stickyBackBtn} onPress={() => router.back()}>
// // //             <Ionicons name="close" size={18} color="#fff" />
// // //           </TouchableOpacity>
// // //           <View style={{ flex: 1 }} />
// // //           <View style={S.stickyActions}>
// // //             <TouchableOpacity style={S.stickyBtn} onPress={() => router.push("/profile/settings/PersonalInfo" as any)}>
// // //               <Ionicons name="pencil" size={16} color="#fff" />
// // //             </TouchableOpacity>
// // //             <TouchableOpacity style={S.stickyBtn} onPress={() => router.push("/profile/settings")}>
// // //               <Ionicons name="settings-outline" size={17} color="#fff" />
// // //             </TouchableOpacity>
// // //           </View>
// // //         </View>

// // //         {/* Avatar — centred, hangs AVATAR_HANG below bar into white area */}
// // //         <Animated.View style={[S.avatarWrap, { opacity: avatarOp, transform: [{ scale: avatarScale }] }]}>
// // //           {avatarUri
// // //             ? <Image source={{ uri: avatarUri }} style={S.avatarImg} />
// // //             : <LinearGradient colors={[C.cov1, C.cov2]} style={S.avatarImg}>
// // //                 <Ionicons name="person" size={32} color="rgba(255,255,255,0.55)" />
// // //               </LinearGradient>
// // //           }
// // //           <TouchableOpacity style={S.avatarEditBadge} onPress={() => setMenuOpen(true)} activeOpacity={0.85}>
// // //             <Ionicons name="camera" size={13} color="#fff" />
// // //           </TouchableOpacity>
// // //         </Animated.View>

// // //         {/* Stats row — white text on gradient, always fully visible when sticky is shown */}
// // //         <View style={S.stickyStatsWrap}>
// // //           <StatsRow isOnGradient={true} />
// // //         </View>
// // //       </Animated.View>

// // //       {/* ══ SCROLL VIEW ══ */}
// // //       <Animated.ScrollView
// // //         style={S.scroll}
// // //         contentContainerStyle={S.content}
// // //         showsVerticalScrollIndicator={false}
// // //         scrollEventThrottle={16}
// // //         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
// // //         onScroll={Animated.event(
// // //           [{ nativeEvent: { contentOffset: { y: scrollY } } }],
// // //           {
// // //             useNativeDriver: false,
// // //             listener: (e: any) => setScrolled(e.nativeEvent.contentOffset.y > TRIGGER - 10),
// // //           }
// // //         )}
// // //       >
// // //         {/* ── COVER ── */}
// // //         {/* Cover — fixed height, does NOT collapse on scroll */}
// // //         <View style={S.cover}>
// // //           <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: coverImgParallax }] }]}>
// // //             {hasAvatar && avatarUri
// // //               ? <Image source={{ uri: avatarUri }} style={S.coverPhoto} resizeMode="cover" />
// // //               : (
// // //                 // ↓ Exact gradient from image: warm orange-pink → purple → cool indigo
// // //                 <LinearGradient
// // //                   colors={[C.cov1, C.cov2, C.cov3]}
// // //                   start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
// // //                   style={StyleSheet.absoluteFill}
// // //                 />
// // //               )
// // //             }
// // //           </Animated.View>
// // //           <LinearGradient colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]} style={StyleSheet.absoluteFill} />

// // //           {/* Cover buttons */}
// // //           <Animated.View style={[S.coverTop, { opacity: coverBtnOpacity }]}>
// // //             <TouchableOpacity style={S.coverBtn} onPress={() => router.back()}>
// // //               <Ionicons name="close" size={20} color="#fff" />
// // //             </TouchableOpacity>
// // //             <View style={S.coverTopRight}>
// // //               <TouchableOpacity style={S.coverBtn} onPress={() => router.push("/profile/settings/PersonalInfo" as any)}>
// // //                 <Ionicons name="pencil" size={18} color="#fff" />
// // //               </TouchableOpacity>
// // //               <TouchableOpacity style={S.coverBtn} onPress={() => router.push("/profile/settings")}>
// // //                 <Ionicons name="settings-outline" size={19} color="#fff" />
// // //               </TouchableOpacity>
// // //             </View>
// // //           </Animated.View>

// // //           {!hasAvatar && (
// // //             <TouchableOpacity style={S.addPhotoBtn} onPress={() => setMenuOpen(true)}>
// // //               <Ionicons name="camera-outline" size={14} color="rgba(255,255,255,0.9)" />
// // //               <Text style={S.addPhotoTxt}>Add Photo</Text>
// // //             </TouchableOpacity>
// // //           )}

// // //           <Animated.View style={[S.coverInfo, { opacity: coverInfoOpacity }]}>
// // //             <Text style={S.coverName}>{profile.name || "User Name"}</Text>
// // //             <Text style={S.coverUsername}>{profile.username ? `@${profile.username}` : "Name"}</Text>
// // //             <View style={S.coverMetaRow}><Ionicons name="mail-outline" size={11} color="rgba(255,255,255,0.75)" /><Text style={S.coverMeta}>email@gmail.com</Text></View>
// // //             <View style={S.coverMetaRow}><Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.75)" /><Text style={S.coverMeta}>Location, Country</Text></View>
// // //           </Animated.View>
// // //         </View>

// // //         {/* ── WHITE BODY ── */}
// // //         {/* paddingTop = AVATAR_HANG + STATS_H so content starts below floating avatar + stats */}
// // //         <Animated.View style={[S.whiteBody, { borderTopLeftRadius: whiteRadius, borderTopRightRadius: whiteRadius }]}>

// // //           {/* Stats row — shown when NOT scrolled */}
// // //           <StatsRow isOnGradient={false} style={{ borderBottomWidth: 1, borderColor: "#EEE" }} />

// // //           {/* Verify card */}
// // //           <TouchableOpacity style={S.verifyCard} activeOpacity={0.92}>
// // //             <View style={S.verifyIcon}><Ionicons name="shield-checkmark" size={20} color={C.p1} /></View>
// // //             <View style={{ flex: 1 }}>
// // //               <Text style={S.verifyTitle}>Get verified</Text>
// // //               <Text style={S.verifySub}>Lorem ipsum is simply dummy text of the industry.</Text>
// // //             </View>
// // //             <Ionicons name="chevron-forward" size={18} color="#CCC" />
// // //           </TouchableOpacity>

// // //           {/* Photos */}
// // //           <View style={S.secDiv} />
// // //           <View style={S.sec}>
// // //             <View style={S.secHead}>
// // //               <Text style={S.secTitle}>Photos</Text>
// // //               <TouchableOpacity style={S.secEdit} onPress={() => setPhotosOpen(true)}>
// // //                 <Ionicons name="pencil" size={13} color="#777" />
// // //               </TouchableOpacity>
// // //             </View>
// // //             <View style={[S.photoGrid, { height: PHOTO_LG_H }]}>
// // //               <TouchableOpacity style={[S.photoLg, { height: PHOTO_LG_H }]} onPress={() => previewPhotos[0] && openPreview(previewPhotos[0])} activeOpacity={0.88}>
// // //                 {previewPhotos[0]
// // //                   ? <Image source={{ uri: previewPhotos[0] }} style={S.photoImg} />
// // //                   : <View style={[S.photoEmpty, { height: PHOTO_LG_H }]}><Ionicons name="image-outline" size={26} color="#CCC" /></View>
// // //                 }
// // //               </TouchableOpacity>
// // //               <View style={S.photoRightCol}>
// // //                 <View style={S.photoRow}>
// // //                   {[1, 2].map(i => (
// // //                     <TouchableOpacity key={i} style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => previewPhotos[i] && openPreview(previewPhotos[i])} activeOpacity={0.88}>
// // //                       {previewPhotos[i]
// // //                         ? <Image source={{ uri: previewPhotos[i] }} style={S.photoImg} />
// // //                         : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}><Ionicons name="image-outline" size={16} color="#CCC" /></View>
// // //                       }
// // //                     </TouchableOpacity>
// // //                   ))}
// // //                 </View>
// // //                 <View style={S.photoRow}>
// // //                   <TouchableOpacity style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => previewPhotos[3] && openPreview(previewPhotos[3])} activeOpacity={0.88}>
// // //                     {previewPhotos[3]
// // //                       ? <Image source={{ uri: previewPhotos[3] }} style={S.photoImg} />
// // //                       : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}><Ionicons name="image-outline" size={16} color="#CCC" /></View>
// // //                     }
// // //                   </TouchableOpacity>
// // //                   <TouchableOpacity style={[S.photoAdd, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => setPhotosOpen(true)} activeOpacity={0.88}>
// // //                     <Ionicons name="camera-outline" size={18} color={C.p1} />
// // //                     <Text style={S.photoAddTxt}>Add</Text>
// // //                   </TouchableOpacity>
// // //                 </View>
// // //               </View>
// // //             </View>
// // //           </View>

// // //           <PhotosManagerModal visible={photosOpen} onClose={() => setPhotosOpen(false)} photos={photos} maxPhotos={20} minPhotos={0} onUpload={uploadPhoto} onDelete={deletePhoto} />

// // //           {/* About */}
// // //           <View style={S.secDiv} />
// // //           <View style={S.sec}>
// // //             <View style={S.secHead}><Text style={S.secTitle}>About</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/AboutMe" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// // //             <Text style={S.bodyTxt}>{profile.about || "Add something about you…"}</Text>
// // //           </View>

// // //           {/* Interests */}
// // //           <View style={S.secDiv} />
// // //           <View style={S.sec}>
// // //             <View style={S.secHead}><Text style={S.secTitle}>Interests</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/Interests" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// // //             <View style={S.chipsWrap}>
// // //               {(profile.interests?.length ? profile.interests : ["Art","Cultural Activities","Music","Networking","Photography","Painting","Yoga","Travelling"]).map((x, i) => (
// // //                 <View key={i} style={S.chip}>
// // //                   <Ionicons name={interestIcon(x) as any} size={13} color="#555" style={{ marginRight: 4 }} />
// // //                   <Text style={S.chipTxt}>{x}</Text>
// // //                 </View>
// // //               ))}
// // //             </View>
// // //           </View>

// // //           {/* Language */}
// // //           <View style={S.secDiv} />
// // //           <View style={S.sec}>
// // //             <View style={S.secHead}><Text style={S.secTitle}>Language</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/Languages" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// // //             <View style={S.chipsWrap}>
// // //               {(profile.languages?.length ? profile.languages : ["English","Hindi","French"]).map(x => (
// // //                 <View key={x} style={S.chip}>
// // //                   <Ionicons name="language-outline" size={13} color="#555" style={{ marginRight: 4 }} />
// // //                   <Text style={S.chipTxt}>{x}</Text>
// // //                 </View>
// // //               ))}
// // //             </View>
// // //           </View>

// // //           {/* Logout */}
// // //           <TouchableOpacity style={S.logoutBtn} activeOpacity={0.88} onPress={() => setLogoutModalOpen(true)}>
// // //             <Ionicons name="log-out-outline" size={18} color={C.dangerText} />
// // //             <Text style={S.logoutTxt}>Log out</Text>
// // //           </TouchableOpacity>
// // //         </Animated.View>
// // //       </Animated.ScrollView>

// // //       {/* ══ MODALS ══ */}
// // //       <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
// // //         <View style={S.previewOverlay}>
// // //           <TouchableOpacity style={S.previewClose} onPress={() => setPreviewOpen(false)}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
// // //           {previewUri && <Image source={{ uri: previewUri }} style={S.previewImg} resizeMode="contain" />}
// // //         </View>
// // //       </Modal>

// // //       <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
// // //         <TouchableOpacity style={S.sheetOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
// // //           <View style={S.sheet}>
// // //             <View style={S.grabber} /><Text style={S.sheetTitle}>Profile Photo</Text>
// // //             <TouchableOpacity style={S.sheetRow} onPress={async () => { setMenuOpen(false); try { await uploadPhoto(null, true); } catch (e: any) { alert(e.message); } }}>
// // //               <View style={[S.sheetIcon, { backgroundColor: C.pLight }]}><Ionicons name="image-outline" size={19} color={C.p1} /></View>
// // //               <Text style={[S.sheetRowTxt, { marginLeft: 14 }]}>Update Photo</Text>
// // //             </TouchableOpacity>
// // //             {hasAvatar && (
// // //               <TouchableOpacity style={[S.sheetRow, { borderBottomWidth: 0 }]} onPress={async () => { setMenuOpen(false); try { await deletePhoto("", true); } catch (e: any) { alert(e.message); } }}>
// // //                 <View style={[S.sheetIcon, { backgroundColor: C.dangerBg }]}><Ionicons name="trash-outline" size={19} color={C.danger} /></View>
// // //                 <Text style={[S.sheetRowTxt, { marginLeft: 14, color: C.dangerText }]}>Remove Photo</Text>
// // //               </TouchableOpacity>
// // //             )}
// // //             <TouchableOpacity style={S.sheetCancel} onPress={() => setMenuOpen(false)}><Text style={S.sheetCancelTxt}>Cancel</Text></TouchableOpacity>
// // //           </View>
// // //         </TouchableOpacity>
// // //       </Modal>

// // //       <Modal visible={logoutModalOpen} transparent animationType="fade" onRequestClose={() => setLogoutModalOpen(false)}>
// // //         <View style={S.modalOverlay}>
// // //           <View style={S.modalCard}>
// // //             <View style={[S.modalIconBg, { backgroundColor: C.dangerBg }]}><Ionicons name="log-out" size={28} color={C.danger} /></View>
// // //             <Text style={S.modalTitle}>Log out</Text>
// // //             <Text style={S.modalSub}>Are you sure you want to log out from your account?</Text>
// // //             <View style={S.modalBtnRow}>
// // //               <TouchableOpacity style={[S.modalBtn, { backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB" }]} onPress={() => setLogoutModalOpen(false)}>
// // //                 <Text style={[S.modalBtnTxt, { color: C.muted }]}>Cancel</Text>
// // //               </TouchableOpacity>
// // //               <TouchableOpacity style={[S.modalBtn, { backgroundColor: C.danger }]} onPress={handleConfirmedLogout}>
// // //                 <Text style={[S.modalBtnTxt, { color: "#fff" }]}>Log out</Text>
// // //               </TouchableOpacity>
// // //             </View>
// // //           </View>
// // //         </View>
// // //       </Modal>
// // //     </View>
// // //   );
// // // }

// // // // ─── Styles ───────────────────────────────────────────────────────────────────
// // // const S = StyleSheet.create({
// // //   root:    { flex: 1, backgroundColor: "#F2F2F7" },
// // //   scroll:  { flex: 1 },
// // //   content: { paddingBottom: 80 },

// // //   // ── Sticky bar ──────────────────────────────────────────────────────────────
// // //   stickyOuter: {
// // //     position: "absolute", top: 0, left: 0, right: 0,
// // //     zIndex: 100,
// // //     height: STICKY_H + AVATAR_HANG + STATS_H,
// // //     overflow: "hidden",
// // //   },
// // //   stickyGrad: {
// // //     // Gradient fills the ENTIRE sticky area — bar + avatar zone + stats zone
// // //     // This matches image 3 where gradient background shows behind stats too
// // //     position: "absolute", top: 0, left: 0, right: 0,
// // //     bottom: 0,
// // //   },
// // //   stickyRow: {
// // //     position: "absolute", top: 0, left: 0, right: 0,
// // //     height: STICKY_H,
// // //     flexDirection: "row",
// // //     alignItems: "center",
// // //     paddingTop: ST_BAR,
// // //     paddingHorizontal: 14,
// // //   },
// // //   stickyBackBtn: {
// // //     width: 34, height: 34, borderRadius: 17,
// // //     backgroundColor: "rgba(255,255,255,0.18)",
// // //     borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
// // //     alignItems: "center", justifyContent: "center",
// // //   },
// // //   stickyActions: { flexDirection: "row", gap: 8 },
// // //   stickyBtn: {
// // //     width: 36, height: 36, borderRadius: 18,
// // //     backgroundColor: "rgba(255,255,255,0.18)",
// // //     borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
// // //     alignItems: "center", justifyContent: "center",
// // //   },

// // //   // Avatar: centred, bottom of stickyOuter aligns with bottom of avatar
// // //   // i.e. it sits at (STICKY_H - AVATAR_SIZE + AVATAR_HANG) from top
// // //   avatarWrap: {
// // //     position: "absolute",
// // //     // top of avatar = STICKY_H - AVATAR_SIZE + AVATAR_HANG
// // //     // This puts it centred over the bar/white boundary
// // //     top: STICKY_H - (AVATAR_SIZE / 2),
// // //     left: SW / 2 - AVATAR_SIZE / 2,
// // //     width: AVATAR_SIZE, height: AVATAR_SIZE,
// // //     borderRadius: AVATAR_SIZE / 2,
// // //     alignItems: "center", justifyContent: "center",
// // //     zIndex: 102,
// // //     shadowColor: "#000",
// // //     shadowOffset: { width: 0, height: 3 },
// // //     shadowOpacity: 0.22, shadowRadius: 10, elevation: 10,
// // //   },
// // //   avatarImg: {
// // //     width: AVATAR_SIZE, height: AVATAR_SIZE,
// // //     borderRadius: AVATAR_SIZE / 2,
// // //     borderWidth: 3.5, borderColor: "#fff",
// // //     overflow: "hidden",
// // //     backgroundColor: "#444",
// // //     alignItems: "center", justifyContent: "center",
// // //   },
// // //   avatarEditBadge: {
// // //     position: "absolute", bottom: 4, right: 4,
// // //     width: 30, height: 30, borderRadius: 15,
// // //     backgroundColor: "#1DA1F2",
// // //     borderWidth: 2.5, borderColor: "#fff",
// // //     alignItems: "center", justifyContent: "center",
// // //     zIndex: 103,
// // //   },

// // //   // Stats inside sticky — transparent so gradient shows through (like image 3)
// // //   stickyStatsWrap: {
// // //     position: "absolute",
// // //     top: STICKY_H + AVATAR_HANG,
// // //     left: 0, right: 0,
// // //     height: STATS_H,
// // //     backgroundColor: "transparent",
// // //   },

// // //   // ── Cover ────────────────────────────────────────────────────────────────────
// // //   cover:      { height: COVER_FULL, paddingTop: ST_BAR, justifyContent: "space-between", overflow: "hidden" },
// // //   coverPhoto: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
// // //   coverTop:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 10 },
// // //   coverTopRight: { flexDirection: "row", gap: 10 },
// // //   coverBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(50,50,50,0.45)", alignItems: "center", justifyContent: "center" },
// // //   addPhotoBtn:{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 8, backgroundColor: "rgba(0,0,0,0.28)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" },
// // //   addPhotoTxt:{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.92)" },
// // //   coverInfo:  { paddingHorizontal: 16, paddingBottom: 28 },
// // //   coverName:  { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.4, marginBottom: 2 },
// // //   coverUsername: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginBottom: 6 },
// // //   coverMetaRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
// // //   coverMeta:     { fontSize: 12, color: "rgba(255,255,255,0.75)" },

// // //   // ── White body ────────────────────────────────────────────────────────────────
// // //   whiteBody: {
// // //     backgroundColor: "#fff",
// // //     marginTop: -28,
// // //     paddingTop: Math.round(AVATAR_HANG) + 8,
// // //     paddingBottom: 40,
// // //     minHeight: 600,   // ensures white body extends well past any content
// // //   },

// // //   // ── Stats row — used in BOTH body and sticky ──────────────────────────────────
// // //   statsRow:   { flexDirection: "row", alignItems: "center", paddingVertical: 0 },
// // //   statItem:   { flex: 1, alignItems: "center", paddingVertical: 18 },
// // //   statNumRow: { flexDirection: "row", alignItems: "center" },
// // //   statNum:    { fontSize: 22, fontWeight: "900", color: "#111" },
// // //   statLabel:  { fontSize: 10, color: "#888", fontWeight: "600", marginTop: 4, textAlign: "center", lineHeight: 15 },
// // //   statPlus:   { fontSize: 12, color: "#CCC", paddingHorizontal: 2 },
// // //   statDivider:{ width: 1, height: 36, backgroundColor: "#EEE" },

// // //   verifyCard:  { flexDirection: "row", alignItems: "center", gap: 12, margin: 14, padding: 14, borderWidth: 1, borderColor: "#EEE", borderRadius: 14, backgroundColor: "#fff" },
// // //   verifyIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center" },
// // //   verifyTitle: { fontSize: 14, fontWeight: "800", color: "#111" },
// // //   verifySub:   { fontSize: 12, color: "#888", marginTop: 2, lineHeight: 18 },

// // //   secDiv:   { height: 8, backgroundColor: "#F2F2F7" },
// // //   sec:      { paddingHorizontal: 16, paddingVertical: 16 },
// // //   secHead:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
// // //   secTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
// // //   secEdit:  { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" },
// // //   bodyTxt:  { fontSize: 13, color: "#555", lineHeight: 22 },

// // //   photoGrid:    { flexDirection: "row", gap: 4 },
// // //   photoLg:      { flex: 1.15, borderRadius: 12, overflow: "hidden", backgroundColor: "#F2F2F7" },
// // //   photoRightCol:{ flex: 1, gap: 4, justifyContent: "space-between" },
// // //   photoRow:     { flexDirection: "row", gap: 4 },
// // //   photoSm:      { borderRadius: 8, overflow: "hidden", backgroundColor: "#F2F2F7" },
// // //   photoAdd:     { borderRadius: 8, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#E8175D", backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center", gap: 2 },
// // //   photoAddTxt:  { fontSize: 9, fontWeight: "700", color: "#E8175D" },
// // //   photoEmpty:   { alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F7", borderRadius: 8 },
// // //   photoImg:     { width: "100%", height: "100%", resizeMode: "cover" },

// // //   chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
// // //   chip:      { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E0E0E5" },
// // //   chipTxt:   { fontSize: 12, fontWeight: "600", color: "#333" },

// // //   logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 14, paddingVertical: 15, borderRadius: 14, backgroundColor: "#FFF5F5", borderWidth: 1.5, borderColor: "#FFCDD2" },
// // //   logoutTxt: { fontSize: 14, fontWeight: "800", color: "#C62828" },

// // //   previewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" },
// // //   previewClose:   { position: "absolute", top: 52, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
// // //   previewImg:     { width: "90%", height: "70%" },

// // //   sheetOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
// // //   sheet:          { backgroundColor: "#fff", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingBottom: 44, paddingTop: 14 },
// // //   grabber:        { width: 44, height: 4, borderRadius: 999, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 20 },
// // //   sheetTitle:     { fontSize: 17, fontWeight: "800", color: "#111", marginBottom: 16 },
// // //   sheetRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
// // //   sheetIcon:      { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
// // //   sheetRowTxt:    { fontSize: 15, fontWeight: "700", color: "#111" },
// // //   sheetCancel:    { marginTop: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center" },
// // //   sheetCancelTxt: { fontSize: 14, fontWeight: "700", color: "#888" },

// // //   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.48)", alignItems: "center", justifyContent: "center", padding: 20 },
// // //   modalCard:    { backgroundColor: "#fff", borderRadius: 26, padding: 28, width: "100%", maxWidth: 340, alignItems: "center", elevation: 12 },
// // //   modalIconBg:  { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 18 },
// // //   modalTitle:   { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 10 },
// // //   modalSub:     { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 21, marginBottom: 26 },
// // //   modalBtnRow:  { flexDirection: "row", gap: 10, width: "100%" },
// // //   modalBtn:     { flex: 1, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center" },
// // //   modalBtnTxt:  { fontSize: 15, fontWeight: "800" },
// // // });
// // import React, {
// //   useCallback, useEffect, useMemo, useRef, useState,
// // } from "react";
// // import {
// //   View, Text, TouchableOpacity, Animated,
// //   Image, RefreshControl, Modal, Dimensions,
// //   StyleSheet, StatusBar, Platform,
// // } from "react-native";
// // import Ionicons from "@expo/vector-icons/Ionicons";
// // import { useRouter, useFocusEffect } from "expo-router";
// // import AsyncStorage from "@react-native-async-storage/async-storage";
// // import { useAuth, useUser } from "@clerk/clerk-expo";
// // import Constants from "expo-constants";
// // import * as ImagePicker from "expo-image-picker";
// // import { LinearGradient } from "expo-linear-gradient";
// // import { apiFetch } from "../../lib/apiFetch";
// // import PhotosManagerModal from "../../components/profile/PhotosManagerModal";

// // // My Events Tabs Imports
// // import CreatedTab from "../../components/MyBookings/Tabs/CreatedTab";
// // import GoingTab from "../../components/MyBookings/Tabs/GoingTab";
// // import PastTab from "../../components/MyBookings/Tabs/PastTab";
// // import type { EventDoc } from "../../components/MyBookings/Tabs/CreatedTab";

// // // ─── Screen geometry ──────────────────────────────────────────────────────────
// // const { width: SW } = Dimensions.get("window");
// // const ST_BAR = Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

// // const COVER_H = 500;
// // const COVER_FULL = COVER_H + ST_BAR;
// // const AVATAR_SIZE = 96;
// // const STICKY_CONTENT = 52;
// // const STICKY_H = STICKY_CONTENT + ST_BAR;
// // const AVATAR_HANG = AVATAR_SIZE * 0.50;
// // const STATS_H = 96;
// // const STICKY_TOTAL = STICKY_H + AVATAR_HANG + STATS_H;
// // const TRIGGER = 120;

// // // ─── Photo grid ───────────────────────────────────────────────────────────────
// // const GRID_W = SW - 32;
// // const RIGHT_W = GRID_W * (1 / 2.15) - 4;
// // const PHOTO_SM = Math.floor((RIGHT_W - 4) / 2);
// // const PHOTO_LG_H = PHOTO_SM * 2 + 4;

// // // ─── Colours ──────────────────────────────────────────────────────────────────
// // const C = {
// //   bg: "#F2F2F7", white: "#FFFFFF", ink: "#111111", muted: "#888888", border: "#EEEEEE",
// //   cov1: "#D4405A", cov2: "#9B3EBF", cov3: "#5B4FD4",
// //   nav1: "#C8406A", nav2: "#8B3EBF", nav3: "#5B4FD4",
// //   p1: "#E8175D", pLight: "#FFF0F5",
// //   danger: "#E53935", dangerBg: "#FFF5F5", dangerBorder: "#FFCDD2", dangerText: "#C62828",
// // };

// // // ─── Interest icons ───────────────────────────────────────────────────────────
// // const INTEREST_ICON: Record<string, string> = {
// //   "art": "color-palette-outline", "cultural activities": "musical-notes-outline",
// //   "music": "headset-outline", "networking": "people-outline",
// //   "photography": "camera-outline", "painting": "brush-outline",
// //   "yoga": "body-outline", "travelling": "airplane-outline",
// //   "travel": "airplane-outline", "cooking": "restaurant-outline",
// //   "sports": "football-outline", "reading": "book-outline",
// //   "gaming": "game-controller-outline", "fitness": "barbell-outline",
// //   "tech": "hardware-chip-outline",
// // };

// // function interestIcon(label: string) {
// //   const k = label.toLowerCase();
// //   for (const [key, val] of Object.entries(INTEREST_ICON)) { if (k.includes(key)) return val; }
// //   return "star-outline";
// // }

// // // ─── Types ────────────────────────────────────────────────────────────────────
// // type ProfileData = {
// //   name?: string; username?: string; about?: string;
// //   interests?: string[]; languages?: string[]; photos?: string[]; avatar?: string | null;
// //   rating?: number; eventsHosted?: number; totalAttendees?: number;
// // };

// // function sanitizePhotos(p?: unknown): string[] {
// //   if (!Array.isArray(p)) return [];
// //   return p.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
// // }

// // const STORAGE_KEY = "@profile";
// // const PROFILE_ENDPOINT = "/api/profile";

// // // ─────────────────────────────────────────────────────────────────────────────
// // export default function ProfileHome() {
// //   const router = useRouter();
// //   const { signOut, userId } = useAuth();
// //   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
// //   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

// //   // ── state ─────────────────────────────────────────────────────────────────
// //   const [profile, setProfile] = useState<ProfileData>({});
// //   const [refreshing, setRefreshing] = useState(false);
// //   const [photosOpen, setPhotosOpen] = useState(false);
// //   const [menuOpen, setMenuOpen] = useState(false);
// //   const [previewOpen, setPreviewOpen] = useState(false);
// //   const [previewUri, setPreviewUri] = useState<string | null>(null);
// //   const [logoutModalOpen, setLogoutModalOpen] = useState(false);
// //   const [scrolled, setScrolled] = useState(false);

// //   // My Events - 3 Tabs
// //   const [myEventsTab, setMyEventsTab] = useState<"created" | "going" | "past">("created");
// //   const [myCreatedEvents, setMyCreatedEvents] = useState<EventDoc[]>([]);
// //   const [myGoingEvents, setMyGoingEvents] = useState<EventDoc[]>([]);
// //   const [eventsLoading, setEventsLoading] = useState(false);

// //   // ── derived ───────────────────────────────────────────────────────────────
// //   const photos = useMemo(() => sanitizePhotos(profile.photos), [profile.photos]);
// //   const previewPhotos = photos.slice(0, 4);
// //   const hasAvatar = !!(profile.avatar);
// //   const avatarUri = profile.avatar ?? null;

// //   // ── animation ─────────────────────────────────────────────────────────────
// //   const scrollY = useRef(new Animated.Value(0)).current;

// //   const stickyOpacity = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [0, 1], extrapolate: "clamp" });
// //   const stickyTranslateY = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [-STICKY_TOTAL, 0], extrapolate: "clamp" });
// //   const coverImgParallax = scrollY.interpolate({ inputRange: [0, COVER_FULL], outputRange: [0, -COVER_FULL * 0.25], extrapolate: "clamp" });
// //   const coverBtnOpacity = scrollY.interpolate({ inputRange: [0, TRIGGER - 30], outputRange: [1, 0], extrapolate: "clamp" });
// //   const coverInfoOpacity = scrollY.interpolate({ inputRange: [0, TRIGGER - 30], outputRange: [1, 0], extrapolate: "clamp" });
// //   const whiteRadius = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [28, 0], extrapolate: "clamp" });
// //   const avatarOp = scrollY.interpolate({ inputRange: [TRIGGER, TRIGGER + 40], outputRange: [0, 1], extrapolate: "clamp" });
// //   const avatarScale = scrollY.interpolate({ inputRange: [TRIGGER, TRIGGER + 50], outputRange: [0.6, 1], extrapolate: "clamp" });

// //   // ── Fetch Profile ─────────────────────────────────────────────────────────
// //   const fetchProfile = useCallback(async () => {
// //     if (!API_BASE || !userId) return;
// //     try {
// //       const url = `${API_BASE.replace(/\/$/, "")}${PROFILE_ENDPOINT}?clerkUserId=${encodeURIComponent(userId)}`;
// //       const res = await apiFetch(url, { method: "GET", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {} });
// //       if (!res.ok) throw new Error(`Failed (${res.status})`);
// //       const j = await res.json().catch(() => ({}));
// //       const s = (j?.profile || j?.data || j) as any;

// //       const next: ProfileData = {
// //         name: s?.name, username: s?.username, about: s?.about,
// //         interests: Array.isArray(s?.interests) ? s.interests : [],
// //         languages: Array.isArray(s?.languages) ? s.languages : [],
// //         photos: Array.isArray(s?.photos) ? s.photos : [],
// //         avatar: typeof s?.avatar === "string" ? s.avatar : null,
// //         rating: s?.rating ?? s?.averageRating ?? undefined,
// //         eventsHosted: s?.eventsHosted ?? s?.events_hosted ?? undefined,
// //         totalAttendees: s?.totalAttendees ?? s?.total_attendees ?? undefined,
// //       };
// //       setProfile(next);
// //       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
// //     } catch {}
// //   }, [API_BASE, EVENT_API_KEY, userId]);

// //   // Fetch My Events (Real data)
// //   const fetchMyEvents = useCallback(async () => {
// //     if (!API_BASE || !userId) return;
// //     setEventsLoading(true);
// //     try {
// //       const [createdRes, goingRes] = await Promise.all([
// //         apiFetch(`${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId)}&limit=100`, {
// //           method: "GET", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}
// //         }),
// //         apiFetch(`${API_BASE}/api/bookings/going?clerkUserId=${encodeURIComponent(userId)}`, {
// //           method: "GET", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}
// //         }),
// //       ]);

// //       const createdJson = await createdRes.json().catch(() => ({}));
// //       const goingJson = await goingRes.json().catch(() => ({}));

// //       setMyCreatedEvents(Array.isArray(createdJson?.createdEvents) ? createdJson.createdEvents : []);
// //       setMyGoingEvents(Array.isArray(goingJson?.events) ? goingJson.events : []);
// //     } catch (e) {
// //       console.log("My Events fetch error:", e);
// //     } finally {
// //       setEventsLoading(false);
// //     }
// //   }, [API_BASE, EVENT_API_KEY, userId]);

// //   useEffect(() => {
// //     (async () => {
// //       const r = await AsyncStorage.getItem(STORAGE_KEY);
// //       if (r) try { setProfile(JSON.parse(r)); } catch {}
// //       await fetchProfile();
// //       await fetchMyEvents();
// //     })();
// //   }, [fetchProfile, fetchMyEvents]);

// //   useFocusEffect(useCallback(() => {
// //     fetchProfile();
// //     fetchMyEvents();
// //   }, [fetchProfile, fetchMyEvents]));

// //   const onRefresh = useCallback(async () => {
// //     setRefreshing(true);
// //     await Promise.all([fetchProfile(), fetchMyEvents()]);
// //     setRefreshing(false);
// //   }, [fetchProfile, fetchMyEvents]);

// //   const handleConfirmedLogout = async () => {
// //     setLogoutModalOpen(false);
// //     await AsyncStorage.removeItem(STORAGE_KEY);
// //     await signOut();
// //     router.replace("/sign-in");
// //   };

// //   const openPreview = useCallback((uri: string | null) => {
// //     if (!uri) return; setPreviewUri(uri); setPreviewOpen(true);
// //   }, []);

// //   async function uploadPhoto(replaceUri?: string | null, isAvatar?: boolean) {
// //     if (!API_BASE || !userId) return;
// //     const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
// //     if (!perm.granted) throw new Error("Please allow photo permissions.");
// //     const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [1, 1] });
// //     if (picked.canceled) return;
// //     const asset = picked.assets?.[0]; const uri = asset?.uri;
// //     if (!uri) throw new Error("No photo selected.");
// //     let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
// //     if (isAvatar) url += "&isAvatar=true";
// //     else if (replaceUri) url += `&replaceUri=${encodeURIComponent(replaceUri)}`;
// //     const form = new FormData();
// //     form.append("file", { uri, name: asset?.fileName?.trim() || `photo_${Date.now()}.jpg`, type: asset?.mimeType || "image/jpeg" } as any);
// //     const res = await apiFetch(url, { method: "POST", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}, body: form as any });
// //     if (!res.ok) { const t = await res.text().catch(() => ""); let m = `Upload failed (${res.status})`; try { m = JSON.parse(t)?.error || m; } catch {} throw new Error(m); }
// //     await fetchProfile();
// //   }

// //   async function deletePhoto(uri: string, isAvatar?: boolean) {
// //     if (!API_BASE || !userId) return;
// //     let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
// //     if (isAvatar) url += "&isAvatar=true";
// //     const res = await apiFetch(url, { method: "DELETE", headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) }, body: JSON.stringify({ uri }) });
// //     if (!res.ok) throw new Error(`Delete failed (${res.status})`);
// //     await fetchProfile();
// //   }

// //   // StatsRow
// //   const StatsRow = ({ style, isOnGradient = false }: { style?: any; isOnGradient?: boolean }) => {
// //     const numColor = isOnGradient ? "#fff" : "#111";
// //     const labelColor = isOnGradient ? "rgba(255,255,255,0.80)" : "#888";
// //     const divColor = isOnGradient ? "rgba(255,255,255,0.30)" : "#EEE";
// //     const plusColor = isOnGradient ? "rgba(255,255,255,0.40)" : "#CCC";
// //     const starColor = isOnGradient ? "#FFD700" : "#F5A623";
// //     return (
// //       <View style={[S.statsRow, style]}>
// //         <View style={S.statItem}>
// //           <View style={S.statNumRow}>
// //             <Ionicons name="star" size={14} color={starColor} style={{ marginRight: 3 }} />
// //             <Text style={[S.statNum, { color: numColor }]}>{(profile as any).rating ?? "4.8"}</Text>
// //           </View>
// //           <Text style={[S.statLabel, { color: labelColor }]}>Rating</Text>
// //         </View>
// //         <Text style={[S.statPlus, { color: plusColor }]}>✦</Text>
// //         <View style={[S.statDivider, { backgroundColor: divColor }]} />
// //         <View style={S.statItem}>
// //           <Text style={[S.statNum, { color: numColor }]}>{(profile as any).eventsHosted ?? 10}</Text>
// //           <Text style={[S.statLabel, { color: labelColor }]}>{"Events\nHosted"}</Text>
// //         </View>
// //         <Text style={[S.statPlus, { color: plusColor }]}>✦</Text>
// //         <View style={[S.statDivider, { backgroundColor: divColor }]} />
// //         <View style={S.statItem}>
// //           <Text style={[S.statNum, { color: numColor }]}>{(profile as any).totalAttendees ?? 300}</Text>
// //           <Text style={[S.statLabel, { color: labelColor }]}>{"Total\nAttendees"}</Text>
// //         </View>
// //       </View>
// //     );
// //   };

// //   return (
// //     <View style={S.root}>
// //       <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

// //       {/* Sticky Bar */}
// //       <Animated.View style={[S.stickyOuter, { opacity: stickyOpacity, transform: [{ translateY: stickyTranslateY }] }]} pointerEvents={scrolled ? "auto" : "none"}>
// //         <LinearGradient colors={[C.nav1, C.nav2, C.nav3]} style={S.stickyGrad} />
// //         <View style={S.stickyRow}>
// //           <TouchableOpacity style={S.stickyBackBtn} onPress={() => router.back()}>
// //             <Ionicons name="close" size={18} color="#fff" />
// //           </TouchableOpacity>
// //           <View style={{ flex: 1 }} />
// //           <View style={S.stickyActions}>
// //             <TouchableOpacity style={S.stickyBtn} onPress={() => router.push("/profile/settings/PersonalInfo" as any)}>
// //               <Ionicons name="pencil" size={16} color="#fff" />
// //             </TouchableOpacity>
// //             <TouchableOpacity style={S.stickyBtn} onPress={() => router.push("/profile/settings")}>
// //               <Ionicons name="settings-outline" size={17} color="#fff" />
// //             </TouchableOpacity>
// //           </View>
// //         </View>

// //         <Animated.View style={[S.avatarWrap, { opacity: avatarOp, transform: [{ scale: avatarScale }] }]}>
// //           {avatarUri ? <Image source={{ uri: avatarUri }} style={S.avatarImg} /> :
// //             <LinearGradient colors={[C.cov1, C.cov2]} style={S.avatarImg}>
// //               <Ionicons name="person" size={32} color="rgba(255,255,255,0.55)" />
// //             </LinearGradient>
// //           }
// //           <TouchableOpacity style={S.avatarEditBadge} onPress={() => setMenuOpen(true)} activeOpacity={0.85}>
// //             <Ionicons name="camera" size={13} color="#fff" />
// //           </TouchableOpacity>
// //         </Animated.View>

// //         <View style={S.stickyStatsWrap}>
// //           <StatsRow isOnGradient={true} />
// //         </View>
// //       </Animated.View>

// //       <Animated.ScrollView
// //         style={S.scroll}
// //         contentContainerStyle={S.content}
// //         showsVerticalScrollIndicator={false}
// //         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
// //         onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
// //           useNativeDriver: false,
// //           listener: (e: any) => setScrolled(e.nativeEvent.contentOffset.y > TRIGGER - 10),
// //         })}
// //       >
// //         {/* Cover */}
// //         <View style={S.cover}>
// //           <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: coverImgParallax }] }]}>
// //             {hasAvatar && avatarUri ? <Image source={{ uri: avatarUri }} style={S.coverPhoto} resizeMode="cover" /> :
// //               <LinearGradient colors={[C.cov1, C.cov2, C.cov3]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
// //             }
// //           </Animated.View>
// //           <LinearGradient colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]} style={StyleSheet.absoluteFill} />

// //           <Animated.View style={[S.coverTop, { opacity: coverBtnOpacity }]}>
// //             <TouchableOpacity style={S.coverBtn} onPress={() => router.back()}>
// //               <Ionicons name="close" size={20} color="#fff" />
// //             </TouchableOpacity>
// //             <View style={S.coverTopRight}>
// //               <TouchableOpacity style={S.coverBtn} onPress={() => router.push("/profile/settings/PersonalInfo" as any)}>
// //                 <Ionicons name="pencil" size={18} color="#fff" />
// //               </TouchableOpacity>
// //               <TouchableOpacity style={S.coverBtn} onPress={() => router.push("/profile/settings")}>
// //                 <Ionicons name="settings-outline" size={19} color="#fff" />
// //               </TouchableOpacity>
// //             </View>
// //           </Animated.View>

// //           {!hasAvatar && (
// //             <TouchableOpacity style={S.addPhotoBtn} onPress={() => setMenuOpen(true)}>
// //               <Ionicons name="camera-outline" size={14} color="rgba(255,255,255,0.9)" />
// //               <Text style={S.addPhotoTxt}>Add Photo</Text>
// //             </TouchableOpacity>
// //           )}

// //           <Animated.View style={[S.coverInfo, { opacity: coverInfoOpacity }]}>
// //             <Text style={S.coverName}>{profile.name || "User Name"}</Text>
// //             <Text style={S.coverUsername}>{profile.username ? `@${profile.username}` : "Name"}</Text>
// //             <View style={S.coverMetaRow}><Ionicons name="mail-outline" size={11} color="rgba(255,255,255,0.75)" /><Text style={S.coverMeta}>email@gmail.com</Text></View>
// //             <View style={S.coverMetaRow}><Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.75)" /><Text style={S.coverMeta}>Location, Country</Text></View>
// //           </Animated.View>
// //         </View>

// //         {/* White Body */}
// //         <Animated.View style={[S.whiteBody, { borderTopLeftRadius: whiteRadius, borderTopRightRadius: whiteRadius }]}>

// //           <StatsRow isOnGradient={false} style={{ borderBottomWidth: 1, borderColor: "#EEE" }} />

// //           {/* Verify card */}
// //           <TouchableOpacity style={S.verifyCard} activeOpacity={0.92}>
// //             <View style={S.verifyIcon}><Ionicons name="shield-checkmark" size={20} color={C.p1} /></View>
// //             <View style={{ flex: 1 }}>
// //               <Text style={S.verifyTitle}>Get verified</Text>
// //               <Text style={S.verifySub}>Lorem ipsum is simply dummy text of the industry.</Text>
// //             </View>
// //             <Ionicons name="chevron-forward" size={18} color="#CCC" />
// //           </TouchableOpacity>

// //           {/* Photos, About, Interests, Language - same as your original code */}
// //           {/* (Yeh part tere original code jaisa hi hai - maine sirf My Events add kiya) */}

// //           <View style={S.secDiv} />
// //           <View style={S.sec}>
// //             <View style={S.secHead}><Text style={S.secTitle}>Photos</Text><TouchableOpacity style={S.secEdit} onPress={() => setPhotosOpen(true)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// //             {/* Photo grid code tere original jaisa hi rakha hai */}
// //             <View style={[S.photoGrid, { height: PHOTO_LG_H }]}>
// //               <TouchableOpacity style={[S.photoLg, { height: PHOTO_LG_H }]} onPress={() => previewPhotos[0] && openPreview(previewPhotos[0])} activeOpacity={0.88}>
// //                 {previewPhotos[0] ? <Image source={{ uri: previewPhotos[0] }} style={S.photoImg} /> : <View style={[S.photoEmpty, { height: PHOTO_LG_H }]}><Ionicons name="image-outline" size={26} color="#CCC" /></View>}
// //               </TouchableOpacity>
// //               <View style={S.photoRightCol}>
// //                 <View style={S.photoRow}>
// //                   {[1, 2].map(i => (
// //                     <TouchableOpacity key={i} style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => previewPhotos[i] && openPreview(previewPhotos[i])} activeOpacity={0.88}>
// //                       {previewPhotos[i] ? <Image source={{ uri: previewPhotos[i] }} style={S.photoImg} /> : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}><Ionicons name="image-outline" size={16} color="#CCC" /></View>}
// //                     </TouchableOpacity>
// //                   ))}
// //                 </View>
// //                 <View style={S.photoRow}>
// //                   <TouchableOpacity style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => previewPhotos[3] && openPreview(previewPhotos[3])} activeOpacity={0.88}>
// //                     {previewPhotos[3] ? <Image source={{ uri: previewPhotos[3] }} style={S.photoImg} /> : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}><Ionicons name="image-outline" size={16} color="#CCC" /></View>}
// //                   </TouchableOpacity>
// //                   <TouchableOpacity style={[S.photoAdd, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => setPhotosOpen(true)} activeOpacity={0.88}>
// //                     <Ionicons name="camera-outline" size={18} color={C.p1} />
// //                     <Text style={S.photoAddTxt}>Add</Text>
// //                   </TouchableOpacity>
// //                 </View>
// //               </View>
// //             </View>
// //           </View>

// //           <PhotosManagerModal visible={photosOpen} onClose={() => setPhotosOpen(false)} photos={photos} maxPhotos={20} minPhotos={0} onUpload={uploadPhoto} onDelete={deletePhoto} />

// //           {/* About */}
// //           <View style={S.secDiv} />
// //           <View style={S.sec}>
// //             <View style={S.secHead}><Text style={S.secTitle}>About</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/AboutMe" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// //             <Text style={S.bodyTxt}>{profile.about || "Add something about you…"}</Text>
// //           </View>

// //           {/* Interests */}
// //           <View style={S.secDiv} />
// //           <View style={S.sec}>
// //             <View style={S.secHead}><Text style={S.secTitle}>Interests</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/Interests" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// //             <View style={S.chipsWrap}>
// //               {(profile.interests?.length ? profile.interests : ["Art","Cultural Activities","Music","Networking","Photography","Painting","Yoga","Travelling"]).map((x, i) => (
// //                 <View key={i} style={S.chip}>
// //                   <Ionicons name={interestIcon(x) as any} size={13} color="#555" style={{ marginRight: 4 }} />
// //                   <Text style={S.chipTxt}>{x}</Text>
// //                 </View>
// //               ))}
// //             </View>
// //           </View>

// //           {/* Language */}
// //           <View style={S.secDiv} />
// //           <View style={S.sec}>
// //             <View style={S.secHead}><Text style={S.secTitle}>Language</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/Languages" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
// //             <View style={S.chipsWrap}>
// //               {(profile.languages?.length ? profile.languages : ["English","Hindi","French"]).map(x => (
// //                 <View key={x} style={S.chip}>
// //                   <Ionicons name="language-outline" size={13} color="#555" style={{ marginRight: 4 }} />
// //                   <Text style={S.chipTxt}>{x}</Text>
// //                 </View>
// //               ))}
// //             </View>
// //           </View>

// //           {/* ==================== MY EVENTS SECTION (3 Tabs) ==================== */}
// //           <View style={S.secDiv} />
// //           <View style={S.sec}>
// //             <View style={S.secHead}>
// //               <Text style={S.secTitle}>Events</Text>
// //             </View>

// //             {/* 3 Tabs */}
// //             <View style={S.eventsTabContainer}>
// //               <TouchableOpacity style={[S.eventsTab, myEventsTab === "created" && S.eventsTabActive]} onPress={() => setMyEventsTab("created")}>
// //                 <Text style={[S.eventsTabText, myEventsTab === "created" && S.eventsTabTextActive]}>Created</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity style={[S.eventsTab, myEventsTab === "going" && S.eventsTabActive]} onPress={() => setMyEventsTab("going")}>
// //                 <Text style={[S.eventsTabText, myEventsTab === "going" && S.eventsTabTextActive]}>Going</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity style={[S.eventsTab, myEventsTab === "past" && S.eventsTabActive]} onPress={() => setMyEventsTab("past")}>
// //                 <Text style={[S.eventsTabText, myEventsTab === "past" && S.eventsTabTextActive]}>Past</Text>
// //               </TouchableOpacity>
// //             </View>

// //             {eventsLoading ? (
// //               <Text style={{ textAlign: "center", padding: 20, color: "#888" }}>Loading events...</Text>
// //             ) : myEventsTab === "created" ? (
// //               <CreatedTab created={myCreatedEvents} refreshing={false} onRefresh={() => {}} toggleBusyById={{}} onToggleServiceEnabled={() => {}} onPressEvent={(ev) => router.push({ pathname: "/event-interest/[eventId]", params: { eventId: ev._id }} as any)} isOngoing={false} />
// //             ) : myEventsTab === "going" ? (
// //               <GoingTab going={myGoingEvents} refreshing={false} onRefresh={() => {}} onPressEvent={(ev) => router.push({ pathname: "/event-interest/[eventId]", params: { eventId: ev._id }} as any)} />
// //             ) : (
// //               <PastTab past={[...myCreatedEvents, ...myGoingEvents].filter(e => ["ended", "completed"].includes(String(e.status || "").toLowerCase()))} refreshing={false} onRefresh={() => {}} onPressEvent={(ev) => router.push({ pathname: "/event-interest/[eventId]", params: { eventId: ev._id }} as any)} />
// //             )}
// //           </View>

// //           {/* Logout */}
// //           <TouchableOpacity style={S.logoutBtn} activeOpacity={0.88} onPress={() => setLogoutModalOpen(true)}>
// //             <Ionicons name="log-out-outline" size={18} color={C.dangerText} />
// //             <Text style={S.logoutTxt}>Log out</Text>
// //           </TouchableOpacity>
// //         </Animated.View>
// //       </Animated.ScrollView>

// //       {/* Modals - tere original code se same */}
// //       <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
// //         <View style={S.previewOverlay}>
// //           <TouchableOpacity style={S.previewClose} onPress={() => setPreviewOpen(false)}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
// //           {previewUri && <Image source={{ uri: previewUri }} style={S.previewImg} resizeMode="contain" />}
// //         </View>
// //       </Modal>

// //       <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
// //         <TouchableOpacity style={S.sheetOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
// //           <View style={S.sheet}>
// //             <View style={S.grabber} /><Text style={S.sheetTitle}>Profile Photo</Text>
// //             <TouchableOpacity style={S.sheetRow} onPress={async () => { setMenuOpen(false); try { await uploadPhoto(null, true); } catch (e: any) { alert(e.message); } }}>
// //               <View style={[S.sheetIcon, { backgroundColor: C.pLight }]}><Ionicons name="image-outline" size={19} color={C.p1} /></View>
// //               <Text style={[S.sheetRowTxt, { marginLeft: 14 }]}>Update Photo</Text>
// //             </TouchableOpacity>
// //             {hasAvatar && (
// //               <TouchableOpacity style={[S.sheetRow, { borderBottomWidth: 0 }]} onPress={async () => { setMenuOpen(false); try { await deletePhoto("", true); } catch (e: any) { alert(e.message); } }}>
// //                 <View style={[S.sheetIcon, { backgroundColor: C.dangerBg }]}><Ionicons name="trash-outline" size={19} color={C.danger} /></View>
// //                 <Text style={[S.sheetRowTxt, { marginLeft: 14, color: C.dangerText }]}>Remove Photo</Text>
// //               </TouchableOpacity>
// //             )}
// //             <TouchableOpacity style={S.sheetCancel} onPress={() => setMenuOpen(false)}><Text style={S.sheetCancelTxt}>Cancel</Text></TouchableOpacity>
// //           </View>
// //         </TouchableOpacity>
// //       </Modal>

// //       <Modal visible={logoutModalOpen} transparent animationType="fade" onRequestClose={() => setLogoutModalOpen(false)}>
// //         <View style={S.modalOverlay}>
// //           <View style={S.modalCard}>
// //             <View style={[S.modalIconBg, { backgroundColor: C.dangerBg }]}><Ionicons name="log-out" size={28} color={C.danger} /></View>
// //             <Text style={S.modalTitle}>Log out</Text>
// //             <Text style={S.modalSub}>Are you sure you want to log out from your account?</Text>
// //             <View style={S.modalBtnRow}>
// //               <TouchableOpacity style={[S.modalBtn, { backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB" }]} onPress={() => setLogoutModalOpen(false)}>
// //                 <Text style={[S.modalBtnTxt, { color: C.muted }]}>Cancel</Text>
// //               </TouchableOpacity>
// //               <TouchableOpacity style={[S.modalBtn, { backgroundColor: C.danger }]} onPress={handleConfirmedLogout}>
// //                 <Text style={[S.modalBtnTxt, { color: "#fff" }]}>Log out</Text>
// //               </TouchableOpacity>
// //             </View>
// //           </View>
// //         </View>
// //       </Modal>
// //     </View>
// //   );
// // }

// // // ─── Styles ───────────────────────────────────────────────────────────────────
// // const S = StyleSheet.create({
// //   root: { flex: 1, backgroundColor: "#F2F2F7" },
// //   scroll: { flex: 1 },
// //   content: { paddingBottom: 80 },

// //   stickyOuter: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, height: STICKY_H + AVATAR_HANG + STATS_H, overflow: "hidden" },
// //   stickyGrad: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
// //   stickyRow: { position: "absolute", top: 0, left: 0, right: 0, height: STICKY_H, flexDirection: "row", alignItems: "center", paddingTop: ST_BAR, paddingHorizontal: 14 },
// //   stickyBackBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.28)", alignItems: "center", justifyContent: "center" },
// //   stickyActions: { flexDirection: "row", gap: 8 },
// //   stickyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },

// //   avatarWrap: { position: "absolute", top: STICKY_H - (AVATAR_SIZE / 2), left: SW / 2 - AVATAR_SIZE / 2, width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, alignItems: "center", justifyContent: "center", zIndex: 102, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 10 },
// //   avatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 3.5, borderColor: "#fff", overflow: "hidden", backgroundColor: "#444", alignItems: "center", justifyContent: "center" },
// //   avatarEditBadge: { position: "absolute", bottom: 4, right: 4, width: 30, height: 30, borderRadius: 15, backgroundColor: "#1DA1F2", borderWidth: 2.5, borderColor: "#fff", alignItems: "center", justifyContent: "center", zIndex: 103 },

// //   stickyStatsWrap: { position: "absolute", top: STICKY_H + AVATAR_HANG, left: 0, right: 0, height: STATS_H, backgroundColor: "transparent" },

// //   cover: { height: COVER_FULL, paddingTop: ST_BAR, justifyContent: "space-between", overflow: "hidden" },
// //   coverPhoto: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
// //   coverTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 10 },
// //   coverTopRight: { flexDirection: "row", gap: 10 },
// //   coverBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(50,50,50,0.45)", alignItems: "center", justifyContent: "center" },
// //   addPhotoBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 8, backgroundColor: "rgba(0,0,0,0.28)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" },
// //   addPhotoTxt: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.92)" },
// //   coverInfo: { paddingHorizontal: 16, paddingBottom: 28 },
// //   coverName: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.4, marginBottom: 2 },
// //   coverUsername: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginBottom: 6 },
// //   coverMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
// //   coverMeta: { fontSize: 12, color: "rgba(255,255,255,0.75)" },

// //   whiteBody: { backgroundColor: "#fff", marginTop: -28, paddingTop: Math.round(AVATAR_HANG) + 8, paddingBottom: 40, minHeight: 600 },

// //   statsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 0 },
// //   statItem: { flex: 1, alignItems: "center", paddingVertical: 18 },
// //   statNumRow: { flexDirection: "row", alignItems: "center" },
// //   statNum: { fontSize: 22, fontWeight: "900", color: "#111" },
// //   statLabel: { fontSize: 10, color: "#888", fontWeight: "600", marginTop: 4, textAlign: "center", lineHeight: 15 },
// //   statPlus: { fontSize: 12, color: "#CCC", paddingHorizontal: 2 },
// //   statDivider: { width: 1, height: 36, backgroundColor: "#EEE" },

// //   verifyCard: { flexDirection: "row", alignItems: "center", gap: 12, margin: 14, padding: 14, borderWidth: 1, borderColor: "#EEE", borderRadius: 14, backgroundColor: "#fff" },
// //   verifyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center" },
// //   verifyTitle: { fontSize: 14, fontWeight: "800", color: "#111" },
// //   verifySub: { fontSize: 12, color: "#888", marginTop: 2, lineHeight: 18 },

// //   secDiv: { height: 8, backgroundColor: "#F2F2F7" },
// //   sec: { paddingHorizontal: 16, paddingVertical: 16 },
// //   secHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
// //   secTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
// //   secEdit: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" },
// //   bodyTxt: { fontSize: 13, color: "#555", lineHeight: 22 },

// //   photoGrid: { flexDirection: "row", gap: 4 },
// //   photoLg: { flex: 1.15, borderRadius: 12, overflow: "hidden", backgroundColor: "#F2F2F7" },
// //   photoRightCol: { flex: 1, gap: 4, justifyContent: "space-between" },
// //   photoRow: { flexDirection: "row", gap: 4 },
// //   photoSm: { borderRadius: 8, overflow: "hidden", backgroundColor: "#F2F2F7" },
// //   photoAdd: { borderRadius: 8, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#E8175D", backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center", gap: 2 },
// //   photoAddTxt: { fontSize: 9, fontWeight: "700", color: "#E8175D" },
// //   photoEmpty: { alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F7", borderRadius: 8 },
// //   photoImg: { width: "100%", height: "100%", resizeMode: "cover" },

// //   chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
// //   chip: { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E0E0E5" },
// //   chipTxt: { fontSize: 12, fontWeight: "600", color: "#333" },

// //   // 3 Tabs Style
// //   eventsTabContainer: {
// //     flexDirection: "row",
// //     backgroundColor: "#F5F5F7",
// //     borderRadius: 999,
// //     padding: 4,
// //     marginBottom: 16,
// //   },
// //   eventsTab: {
// //     flex: 1,
// //     paddingVertical: 10,
// //     borderRadius: 999,
// //     alignItems: "center",
// //   },
// //   eventsTabActive: {
// //     backgroundColor: "#22C55E",   // Green like your image
// //   },
// //   eventsTabText: {
// //     fontSize: 14,
// //     fontWeight: "700",
// //     color: "#777",
// //   },
// //   eventsTabTextActive: {
// //     color: "#FFFFFF",
// //     fontWeight: "800",
// //   },

// //   logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 14, paddingVertical: 15, borderRadius: 14, backgroundColor: "#FFF5F5", borderWidth: 1.5, borderColor: "#FFCDD2" },
// //   logoutTxt: { fontSize: 14, fontWeight: "800", color: "#C62828" },

// //   previewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" },
// //   previewClose: { position: "absolute", top: 52, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
// //   previewImg: { width: "90%", height: "70%" },

// //   sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
// //   sheet: { backgroundColor: "#fff", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingBottom: 44, paddingTop: 14 },
// //   grabber: { width: 44, height: 4, borderRadius: 999, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 20 },
// //   sheetTitle: { fontSize: 17, fontWeight: "800", color: "#111", marginBottom: 16 },
// //   sheetRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
// //   sheetIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
// //   sheetRowTxt: { fontSize: 15, fontWeight: "700", color: "#111" },
// //   sheetCancel: { marginTop: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center" },
// //   sheetCancelTxt: { fontSize: 14, fontWeight: "700", color: "#888" },

// //   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.48)", alignItems: "center", justifyContent: "center", padding: 20 },
// //   modalCard: { backgroundColor: "#fff", borderRadius: 26, padding: 28, width: "100%", maxWidth: 340, alignItems: "center", elevation: 12 },
// //   modalIconBg: { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 18 },
// //   modalTitle: { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 10 },
// //   modalSub: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 21, marginBottom: 26 },
// //   modalBtnRow: { flexDirection: "row", gap: 10, width: "100%" },
// //   modalBtn: { flex: 1, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center" },
// //   modalBtnTxt: { fontSize: 15, fontWeight: "800" },
// // });
// // app/profile/profileHome_anim_classic.tsx
// // ✅ Fixed:
// //   1. Stats row (Rating / Events / Attendees) stays visible after scroll — shown IN sticky bar
// //   2. Cover height increased so avatar has proper gap from top (like image)
// //   3. Background gradient matches image: orange-pink → purple → indigo-blue
// //   4. White body paddingTop increased so avatar doesn't overlap stats

// import React, {
//   useCallback, useEffect, useMemo, useRef, useState,
// } from "react";
// import {
//   View, Text, TouchableOpacity, Animated, ActivityIndicator,
//   Image, RefreshControl, Modal, Dimensions,
//   StyleSheet, StatusBar, Platform,
// } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { useRouter, useFocusEffect } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useAuth, useUser } from "@clerk/clerk-expo";
// import Constants from "expo-constants";
// import * as ImagePicker from "expo-image-picker";
// import { LinearGradient } from "expo-linear-gradient";
// import { apiFetch } from "../../lib/apiFetch";
// import PhotosManagerModal from "../../components/profile/PhotosManagerModal";

// // ─── Screen geometry ──────────────────────────────────────────────────────────
// const { width: SW }  = Dimensions.get("window");
// const ST_BAR         = Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

// // Taller cover so avatar has a big gap from top (like image 2)
// const COVER_H        = 500;
// const COVER_FULL     = COVER_H + ST_BAR;
// const AVATAR_SIZE    = 96;
// const STICKY_CONTENT = 52;
// const STICKY_H       = STICKY_CONTENT + ST_BAR;

// // Avatar hangs 50% below sticky bar bottom into white body
// const AVATAR_HANG    = AVATAR_SIZE * 0.50;

// // Stats row height — taller so "Events Hosted" / "Total Attendees" labels don't clip
// const STATS_H        = 96;

// // Total sticky height = bar + avatar hang + stats row
// const STICKY_TOTAL   = STICKY_H + AVATAR_HANG + STATS_H;

// const TRIGGER        = 120;

// // ─── Photo grid ───────────────────────────────────────────────────────────────
// const GRID_W     = SW - 32;
// const RIGHT_W    = GRID_W * (1 / 2.15) - 4;
// const PHOTO_SM   = Math.floor((RIGHT_W - 4) / 2);
// const PHOTO_LG_H = PHOTO_SM * 2 + 4;

// // ─── Colours ──────────────────────────────────────────────────────────────────
// const C = {
//   bg: "#F2F2F7", white: "#FFFFFF", ink: "#111111", muted: "#888888", border: "#EEEEEE",
//   // ↓ Gradient exactly like image 1: warm orange-pink left → purple mid → cool indigo right
//   cov1: "#D4405A", cov2: "#9B3EBF", cov3: "#5B4FD4",
//   // Nav gradient (same, used in sticky bar)
//   nav1: "#C8406A", nav2: "#8B3EBF", nav3: "#5B4FD4",
//   p1: "#E8175D", pLight: "#FFF0F5",
//   danger: "#E53935", dangerBg: "#FFF5F5", dangerBorder: "#FFCDD2", dangerText: "#C62828",
// };

// // ─── Interest icons ───────────────────────────────────────────────────────────
// const INTEREST_ICON: Record<string, string> = {
//   "art": "color-palette-outline",      "cultural activities": "musical-notes-outline",
//   "music": "headset-outline",           "networking": "people-outline",
//   "photography": "camera-outline",      "painting": "brush-outline",
//   "yoga": "body-outline",               "travelling": "airplane-outline",
//   "travel": "airplane-outline",         "cooking": "restaurant-outline",
//   "sports": "football-outline",         "reading": "book-outline",
//   "gaming": "game-controller-outline",  "fitness": "barbell-outline",
//   "tech": "hardware-chip-outline",
// };
// function interestIcon(label: string) {
//   const k = label.toLowerCase();
//   for (const [key, val] of Object.entries(INTEREST_ICON)) { if (k.includes(key)) return val; }
//   return "star-outline";
// }

// // ─── Types ────────────────────────────────────────────────────────────────────
// type ProfileData = {
//   name?: string; username?: string; about?: string;
//   interests?: string[]; languages?: string[]; photos?: string[]; avatar?: string | null;
//   rating?: number; eventsHosted?: number; totalAttendees?: number;
// };
// function sanitizePhotos(p?: unknown): string[] {
//   if (!Array.isArray(p)) return [];
//   return p.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
// }
// const STORAGE_KEY      = "@profile";
// const PROFILE_ENDPOINT = "/api/profile";

// // ─────────────────────────────────────────────────────────────────────────────
// export default function ProfileHome() {
//   const router        = useRouter();
//   const { signOut, userId } = useAuth();
//   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   // ── state ─────────────────────────────────────────────────────────────────
//   const [profile, setProfile]                 = useState<ProfileData>({});
//   const [refreshing, setRefreshing]           = useState(false);
//   const [photosOpen, setPhotosOpen]           = useState(false);
//   const [menuOpen, setMenuOpen]               = useState(false);
//   const [previewOpen, setPreviewOpen]         = useState(false);
//   const [previewUri, setPreviewUri]           = useState<string | null>(null);
//   const [logoutModalOpen, setLogoutModalOpen] = useState(false);
//   const [scrolled, setScrolled]               = useState(false);

//   // ── derived ───────────────────────────────────────────────────────────────
//   const photos        = useMemo(() => sanitizePhotos(profile.photos), [profile.photos]);
//   const previewPhotos = photos.slice(0, 4);
//   const hasAvatar     = !!(profile.avatar);
//   const avatarUri     = profile.avatar ?? null;

//   // ── animation refs ────────────────────────────────────────────────────────
//   const scrollY   = useRef(new Animated.Value(0)).current;

//   // ── scroll-driven values ──────────────────────────────────────────────────
//   // Sticky bar slides in from top + fades in
//   const stickyOpacity    = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [0, 1], extrapolate: "clamp" });
//   const stickyTranslateY = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [-STICKY_TOTAL, 0], extrapolate: "clamp" });

//   // Cover does NOT collapse — stays full height always (no shrink on scroll)
//   // Only parallax on the image inside
//   const coverImgParallax = scrollY.interpolate({ inputRange: [0, COVER_FULL], outputRange: [0, -COVER_FULL * 0.25], extrapolate: "clamp" });

//   // Cover buttons + info fade out smoothly as user scrolls
//   const coverBtnOpacity  = scrollY.interpolate({ inputRange: [0, TRIGGER - 30], outputRange: [1, 0], extrapolate: "clamp" });
//   const coverInfoOpacity = scrollY.interpolate({ inputRange: [0, TRIGGER - 30], outputRange: [1, 0], extrapolate: "clamp" });

//   // White body border-radius flattens as sticky appears
//   const whiteRadius = scrollY.interpolate({ inputRange: [TRIGGER - 10, TRIGGER + 24], outputRange: [28, 0], extrapolate: "clamp" });

//   // Avatar in sticky: scale up + fade in
//   const avatarOp    = scrollY.interpolate({ inputRange: [TRIGGER, TRIGGER + 40], outputRange: [0, 1], extrapolate: "clamp" });
//   const avatarScale = scrollY.interpolate({ inputRange: [TRIGGER, TRIGGER + 50], outputRange: [0.6, 1], extrapolate: "clamp" });

//   // ── data fetching ─────────────────────────────────────────────────────────
//   const fetchProfile = useCallback(async () => {
//     if (!API_BASE || !userId) return;
//     try {
//       const url = `${API_BASE.replace(/\/$/, "")}${PROFILE_ENDPOINT}?clerkUserId=${encodeURIComponent(userId)}`;
//       const res = await apiFetch(url, { method: "GET", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {} });
//       if (!res.ok) throw new Error(`Failed (${res.status})`);
//       const j = await res.json().catch(() => ({}));
//       const s = (j?.profile || j?.data || j) as any;
//       const next: ProfileData = {
//         name: s?.name, username: s?.username, about: s?.about,
//         interests: Array.isArray(s?.interests) ? s.interests : [],
//         languages: Array.isArray(s?.languages) ? s.languages : [],
//         photos: Array.isArray(s?.photos) ? s.photos : [],
//         avatar: typeof s?.avatar === "string" ? s.avatar : null,
//         rating: s?.rating ?? s?.averageRating ?? undefined,
//         eventsHosted: s?.eventsHosted ?? s?.events_hosted ?? undefined,
//         totalAttendees: s?.totalAttendees ?? s?.total_attendees ?? undefined,
//       };
//       setProfile(next);
//       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
//     } catch {}
//   }, [API_BASE, EVENT_API_KEY, userId]);

//   useEffect(() => {
//     (async () => {
//       const r = await AsyncStorage.getItem(STORAGE_KEY);
//       if (r) try { setProfile(JSON.parse(r)); } catch {}
//       await fetchProfile();
//     })();
//   }, [fetchProfile]);
//   useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true); try { await fetchProfile(); } finally { setRefreshing(false); }
//   }, [fetchProfile]);

//   const handleConfirmedLogout = async () => {
//     setLogoutModalOpen(false);
//     await AsyncStorage.removeItem(STORAGE_KEY);
//     await signOut();
//     router.replace("/sign-in");
//   };

//   const openPreview = useCallback((uri: string | null) => {
//     if (!uri) return; setPreviewUri(uri); setPreviewOpen(true);
//   }, []);

//   async function uploadPhoto(replaceUri?: string | null, isAvatar?: boolean) {
//     if (!API_BASE || !userId) return;
//     const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!perm.granted) throw new Error("Please allow photo permissions.");
//     const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [1, 1] });
//     if (picked.canceled) return;
//     const asset = picked.assets?.[0]; const uri = asset?.uri;
//     if (!uri) throw new Error("No photo selected.");
//     let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
//     if (isAvatar) url += "&isAvatar=true";
//     else if (replaceUri) url += `&replaceUri=${encodeURIComponent(replaceUri)}`;
//     const form = new FormData();
//     form.append("file", { uri, name: asset?.fileName?.trim() || `photo_${Date.now()}.jpg`, type: asset?.mimeType || "image/jpeg" } as any);
//     const res = await apiFetch(url, { method: "POST", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}, body: form as any });
//     if (!res.ok) { const t = await res.text().catch(() => ""); let m = `Upload failed (${res.status})`; try { m = JSON.parse(t)?.error || m; } catch {} throw new Error(m); }
//     await fetchProfile();
//   }

//   async function deletePhoto(uri: string, isAvatar?: boolean) {
//     if (!API_BASE || !userId) return;
//     let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
//     if (isAvatar) url += "&isAvatar=true";
//     const res = await apiFetch(url, { method: "DELETE", headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) }, body: JSON.stringify({ uri }) });
//     if (!res.ok) throw new Error(`Delete failed (${res.status})`);
//     await fetchProfile();
//   }

//   // ─── Reusable Stats Row ───────────────────────────────────────────────────
//   // isOnGradient=true → white text (for sticky bar over gradient)
//   // isOnGradient=false → dark text (for white body)
//   const StatsRow = ({ style, isOnGradient = false }: { style?: any; isOnGradient?: boolean }) => {
//     const numColor   = isOnGradient ? "#fff"                    : "#111";
//     const labelColor = isOnGradient ? "rgba(255,255,255,0.80)" : "#888";
//     const divColor   = isOnGradient ? "rgba(255,255,255,0.30)" : "#EEE";
//     const plusColor  = isOnGradient ? "rgba(255,255,255,0.40)" : "#CCC";
//     const starColor  = isOnGradient ? "#FFD700"                 : "#F5A623";
//     return (
//       <View style={[S.statsRow, style]}>
//         <View style={S.statItem}>
//           <View style={S.statNumRow}>
//             <Ionicons name="star" size={14} color={starColor} style={{ marginRight: 3 }} />
//             <Text style={[S.statNum, { color: numColor }]}>{(profile as any).rating ?? "4.8"}</Text>
//           </View>
//           <Text style={[S.statLabel, { color: labelColor }]}>Rating</Text>
//         </View>
//         <Text style={[S.statPlus, { color: plusColor }]}>✦</Text>
//         <View style={[S.statDivider, { backgroundColor: divColor }]} />
//         <View style={S.statItem}>
//           <Text style={[S.statNum, { color: numColor }]}>{(profile as any).eventsHosted ?? 10}</Text>
//           <Text style={[S.statLabel, { color: labelColor }]}>{"Events\nHosted"}</Text>
//         </View>
//         <Text style={[S.statPlus, { color: plusColor }]}>✦</Text>
//         <View style={[S.statDivider, { backgroundColor: divColor }]} />
//         <View style={S.statItem}>
//           <Text style={[S.statNum, { color: numColor }]}>{(profile as any).totalAttendees ?? 300}</Text>
//           <Text style={[S.statLabel, { color: labelColor }]}>{"Total\nAttendees"}</Text>
//         </View>
//       </View>
//     );
//   };

//   // ─── RENDER ───────────────────────────────────────────────────────────────
//   return (
//     <View style={S.root}>
//       <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

//       {/* ══ STICKY BAR ══
//            Layout (top → bottom):
//            [gradient bar: X ←     → ✏️ ⚙️]   height = STICKY_H
//            [avatar centred, overflows bar]     AVATAR_HANG below bar
//            [stats row]                          STATS_H
//       */}
//       <Animated.View
//         style={[S.stickyOuter, { opacity: stickyOpacity, transform: [{ translateY: stickyTranslateY }] }]}
//         pointerEvents={scrolled ? "auto" : "none"}
//       >
//         {/* Gradient background — same as cover */}
//         <LinearGradient
//           colors={[C.nav1, C.nav2, C.nav3]}
//           start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//           style={S.stickyGrad}
//         />

//         {/* Top row: X — [center space for avatar] — ✏️ ⚙️ */}
//         <View style={S.stickyRow}>
//           <TouchableOpacity style={S.stickyBackBtn} onPress={() => router.back()}>
//             <Ionicons name="close" size={18} color="#fff" />
//           </TouchableOpacity>
//           <View style={{ flex: 1 }} />
//           <View style={S.stickyActions}>
//             <TouchableOpacity style={S.stickyBtn} onPress={() => router.push("/profile/settings/PersonalInfo" as any)}>
//               <Ionicons name="pencil" size={16} color="#fff" />
//             </TouchableOpacity>
//             <TouchableOpacity style={S.stickyBtn} onPress={() => router.push("/profile/settings")}>
//               <Ionicons name="settings-outline" size={17} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Avatar — centred, hangs AVATAR_HANG below bar into white area */}
//         <Animated.View style={[S.avatarWrap, { opacity: avatarOp, transform: [{ scale: avatarScale }] }]}>
//           {avatarUri
//             ? <Image source={{ uri: avatarUri }} style={S.avatarImg} />
//             : <LinearGradient colors={[C.cov1, C.cov2]} style={S.avatarImg}>
//                 <Ionicons name="person" size={32} color="rgba(255,255,255,0.55)" />
//               </LinearGradient>
//           }
//           <TouchableOpacity style={S.avatarEditBadge} onPress={() => setMenuOpen(true)} activeOpacity={0.85}>
//             <Ionicons name="camera" size={13} color="#fff" />
//           </TouchableOpacity>
//         </Animated.View>

//         {/* Stats row — white text on gradient, always fully visible when sticky is shown */}
//         <View style={S.stickyStatsWrap}>
//           <StatsRow isOnGradient={true} />
//         </View>
//       </Animated.View>

//       {/* ══ SCROLL VIEW ══ */}
//       <Animated.ScrollView
//         style={S.scroll}
//         contentContainerStyle={S.content}
//         showsVerticalScrollIndicator={false}
//         scrollEventThrottle={16}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
//         onScroll={Animated.event(
//           [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//           {
//             useNativeDriver: false,
//             listener: (e: any) => setScrolled(e.nativeEvent.contentOffset.y > TRIGGER - 10),
//           }
//         )}
//       >
//         {/* ── COVER ── */}
//         {/* Cover — fixed height, does NOT collapse on scroll */}
//         <View style={S.cover}>
//           <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: coverImgParallax }] }]}>
//             {hasAvatar && avatarUri
//               ? <Image source={{ uri: avatarUri }} style={S.coverPhoto} resizeMode="cover" />
//               : (
//                 // ↓ Exact gradient from image: warm orange-pink → purple → cool indigo
//                 <LinearGradient
//                   colors={[C.cov1, C.cov2, C.cov3]}
//                   start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
//                   style={StyleSheet.absoluteFill}
//                 />
//               )
//             }
//           </Animated.View>
//           <LinearGradient colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]} style={StyleSheet.absoluteFill} />

//           {/* Cover buttons */}
//           <Animated.View style={[S.coverTop, { opacity: coverBtnOpacity }]}>
//             <TouchableOpacity style={S.coverBtn} onPress={() => router.back()}>
//               <Ionicons name="close" size={20} color="#fff" />
//             </TouchableOpacity>
//             <View style={S.coverTopRight}>
//               <TouchableOpacity style={S.coverBtn} onPress={() => router.push("/profile/settings/PersonalInfo" as any)}>
//                 <Ionicons name="pencil" size={18} color="#fff" />
//               </TouchableOpacity>
//               <TouchableOpacity style={S.coverBtn} onPress={() => router.push("/profile/settings")}>
//                 <Ionicons name="settings-outline" size={19} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           </Animated.View>

//           {!hasAvatar && (
//             <TouchableOpacity style={S.addPhotoBtn} onPress={() => setMenuOpen(true)}>
//               <Ionicons name="camera-outline" size={14} color="rgba(255,255,255,0.9)" />
//               <Text style={S.addPhotoTxt}>Add Photo</Text>
//             </TouchableOpacity>
//           )}

//           <Animated.View style={[S.coverInfo, { opacity: coverInfoOpacity }]}>
//             <Text style={S.coverName}>{profile.name || "User Name"}</Text>
//             <Text style={S.coverUsername}>{profile.username ? `@${profile.username}` : "Name"}</Text>
//             <View style={S.coverMetaRow}><Ionicons name="mail-outline" size={11} color="rgba(255,255,255,0.75)" /><Text style={S.coverMeta}>email@gmail.com</Text></View>
//             <View style={S.coverMetaRow}><Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.75)" /><Text style={S.coverMeta}>Location, Country</Text></View>
//           </Animated.View>
//         </View>

//         {/* ── WHITE BODY ── */}
//         {/* paddingTop = AVATAR_HANG + STATS_H so content starts below floating avatar + stats */}
//         <Animated.View style={[S.whiteBody, { borderTopLeftRadius: whiteRadius, borderTopRightRadius: whiteRadius }]}>

//           {/* Stats + Verify — white card at top */}
//           <View style={S.statsCard}>
//             <StatsRow isOnGradient={false} style={{ borderBottomWidth: 1, borderColor: "#F0F0F0" }} />
//             <TouchableOpacity
//               style={S.verifyCardInner} activeOpacity={0.92}
//               onPress={() => {}}
//             >
//               <View style={S.verifyIcon}><Ionicons name="shield-checkmark" size={20} color={C.p1} /></View>
//               <View style={{ flex: 1 }}>
//                 <Text style={S.verifyTitle}>Get verified</Text>
//                 <Text style={S.verifySub}>Lorem ipsum is simply dummy text of the industry.</Text>
//               </View>
//               <Ionicons name="chevron-forward" size={18} color="#CCC" />
//             </TouchableOpacity>
//           </View>

//           {/* Photos */}
//           <View style={S.secDiv} />
//           <View style={S.sec}>
//             <View style={S.secHead}>
//               <Text style={S.secTitle}>Photos</Text>
//               <TouchableOpacity style={S.secEdit} onPress={() => setPhotosOpen(true)}>
//                 <Ionicons name="pencil" size={13} color="#777" />
//               </TouchableOpacity>
//             </View>
//             <View style={[S.photoGrid, { height: PHOTO_LG_H }]}>
//               <TouchableOpacity style={[S.photoLg, { height: PHOTO_LG_H }]} onPress={() => previewPhotos[0] && openPreview(previewPhotos[0])} activeOpacity={0.88}>
//                 {previewPhotos[0]
//                   ? <Image source={{ uri: previewPhotos[0] }} style={S.photoImg} />
//                   : <View style={[S.photoEmpty, { height: PHOTO_LG_H }]}><Ionicons name="image-outline" size={26} color="#CCC" /></View>
//                 }
//               </TouchableOpacity>
//               <View style={S.photoRightCol}>
//                 <View style={S.photoRow}>
//                   {[1, 2].map(i => (
//                     <TouchableOpacity key={i} style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => previewPhotos[i] && openPreview(previewPhotos[i])} activeOpacity={0.88}>
//                       {previewPhotos[i]
//                         ? <Image source={{ uri: previewPhotos[i] }} style={S.photoImg} />
//                         : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}><Ionicons name="image-outline" size={16} color="#CCC" /></View>
//                       }
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//                 <View style={S.photoRow}>
//                   <TouchableOpacity style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => previewPhotos[3] && openPreview(previewPhotos[3])} activeOpacity={0.88}>
//                     {previewPhotos[3]
//                       ? <Image source={{ uri: previewPhotos[3] }} style={S.photoImg} />
//                       : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}><Ionicons name="image-outline" size={16} color="#CCC" /></View>
//                     }
//                   </TouchableOpacity>
//                   <TouchableOpacity style={[S.photoAdd, { width: PHOTO_SM, height: PHOTO_SM }]} onPress={() => setPhotosOpen(true)} activeOpacity={0.88}>
//                     <Ionicons name="camera-outline" size={18} color={C.p1} />
//                     <Text style={S.photoAddTxt}>Add</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </View>
//           </View>

//           <PhotosManagerModal visible={photosOpen} onClose={() => setPhotosOpen(false)} photos={photos} maxPhotos={20} minPhotos={0} onUpload={uploadPhoto} onDelete={deletePhoto} />

//           {/* About */}
//           <View style={S.secDiv} />
//           <View style={S.sec}>
//             <View style={S.secHead}><Text style={S.secTitle}>About</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/AboutMe" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
//             <Text style={S.bodyTxt}>{profile.about || "Add something about you…"}</Text>
//           </View>

//           {/* Interests */}
//           <View style={S.secDiv} />
//           <View style={S.sec}>
//             <View style={S.secHead}><Text style={S.secTitle}>Interests</Text><TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/Interests" as any)}><Ionicons name="pencil" size={13} color="#777" /></TouchableOpacity></View>
//             <View style={S.chipsWrap}>
//               {(profile.interests?.length ? profile.interests : ["Art","Cultural Activities","Music","Networking","Photography","Painting","Yoga","Travelling"]).map((x, i) => (
//                 <View key={i} style={S.chip}>
//                   <Ionicons name={interestIcon(x) as any} size={13} color="#555" style={{ marginRight: 4 }} />
//                   <Text style={S.chipTxt}>{x}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>

//           {/* Language */}
//           <View style={S.secDiv} />
//           <View style={S.sec}>
//             <View style={S.secHead}>
//               <Text style={S.secTitle}>Language</Text>
//               <TouchableOpacity style={S.secEdit} onPress={() => router.push("/profile/settings/Languages" as any)}>
//                 <Ionicons name="pencil" size={13} color="#777" />
//               </TouchableOpacity>
//             </View>
//             <View style={S.chipsWrap}>
//               {(profile.languages?.length ? profile.languages : ["English","Hindi","French"]).map(x => (
//                 <View key={x} style={S.chip}>
//                   <Ionicons name="language-outline" size={13} color="#555" style={{ marginRight: 4 }} />
//                   <Text style={S.chipTxt}>{x}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>

//           {/* ── SERVICES PROVIDED ── */}
//           <View style={S.secDiv} />
//           <View style={S.sec}>
//             <View style={S.secHead}>
//               <Text style={S.secTitle}>Services Provided</Text>
//               <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/profile/settings" as any)}>
//                 <Text style={S.viewAllText}>View All</Text>
//               </TouchableOpacity>
//             </View>
//             <View style={S.chipsWrap}>
//               {["Yoga Classes","Meditation Session","Workshops","Photowalk"].map(s => (
//                 <View key={s} style={S.chip}>
//                   <Text style={S.chipTxt}>{s}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>

//           {/* ── EARNING ── */}
//           <View style={S.secDiv} />
//           <TouchableOpacity style={S.infoCard} activeOpacity={0.88} onPress={() => router.push("/profile/earnings" as any)}>
//             <View style={{ flex: 1 }}>
//               <Text style={S.secTitle}>Earning</Text>
//               <View style={{ height: 10 }} />
//               <Text style={S.infoCardRow}>This Month : <Text style={S.infoCardVal}>₹1,000</Text></Text>
//               <Text style={S.infoCardRow}>Overall : <Text style={S.infoCardVal}>₹3,298.78</Text></Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color={C.cov3} />
//           </TouchableOpacity>

//           {/* ── ATTENDEES OVERVIEW ── */}
//           <View style={S.secDiv} />
//           <TouchableOpacity style={S.infoCard} activeOpacity={0.88} onPress={() => router.push("/profile/attendees" as any)}>
//             <View style={{ flex: 1 }}>
//               <Text style={S.secTitle}>Attendees Overview</Text>
//               <View style={{ height: 10 }} />
//               <Text style={S.infoCardRow}>Repeated Attendees : <Text style={S.infoCardVal}>103</Text></Text>
//               <Text style={S.infoCardRow}>New Attendees : <Text style={S.infoCardVal}>137</Text></Text>
//               <Text style={S.infoCardRow}>Total attendees : <Text style={S.infoCardVal}>300</Text></Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color={C.cov3} />
//           </TouchableOpacity>

//           {/* ── MY EVENTS ── */}
//           <View style={S.secDiv} />
//           <MyEventsSection userId={userId} router={router} />

//           {/* Logout */}
//           <TouchableOpacity style={S.logoutBtn} activeOpacity={0.88} onPress={() => setLogoutModalOpen(true)}>
//             <Ionicons name="log-out-outline" size={18} color={C.dangerText} />
//             <Text style={S.logoutTxt}>Log out</Text>
//           </TouchableOpacity>
//         </Animated.View>
//       </Animated.ScrollView>

//       {/* ══ MODALS ══ */}
//       <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
//         <View style={S.previewOverlay}>
//           <TouchableOpacity style={S.previewClose} onPress={() => setPreviewOpen(false)}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
//           {previewUri && <Image source={{ uri: previewUri }} style={S.previewImg} resizeMode="contain" />}
//         </View>
//       </Modal>

//       <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
//         <TouchableOpacity style={S.sheetOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
//           <View style={S.sheet}>
//             <View style={S.grabber} /><Text style={S.sheetTitle}>Profile Photo</Text>
//             <TouchableOpacity style={S.sheetRow} onPress={async () => { setMenuOpen(false); try { await uploadPhoto(null, true); } catch (e: any) { alert(e.message); } }}>
//               <View style={[S.sheetIcon, { backgroundColor: C.pLight }]}><Ionicons name="image-outline" size={19} color={C.p1} /></View>
//               <Text style={[S.sheetRowTxt, { marginLeft: 14 }]}>Update Photo</Text>
//             </TouchableOpacity>
//             {hasAvatar && (
//               <TouchableOpacity style={[S.sheetRow, { borderBottomWidth: 0 }]} onPress={async () => { setMenuOpen(false); try { await deletePhoto("", true); } catch (e: any) { alert(e.message); } }}>
//                 <View style={[S.sheetIcon, { backgroundColor: C.dangerBg }]}><Ionicons name="trash-outline" size={19} color={C.danger} /></View>
//                 <Text style={[S.sheetRowTxt, { marginLeft: 14, color: C.dangerText }]}>Remove Photo</Text>
//               </TouchableOpacity>
//             )}
//             <TouchableOpacity style={S.sheetCancel} onPress={() => setMenuOpen(false)}><Text style={S.sheetCancelTxt}>Cancel</Text></TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Modal>

//       <Modal visible={logoutModalOpen} transparent animationType="fade" onRequestClose={() => setLogoutModalOpen(false)}>
//         <View style={S.modalOverlay}>
//           <View style={S.modalCard}>
//             <View style={[S.modalIconBg, { backgroundColor: C.dangerBg }]}><Ionicons name="log-out" size={28} color={C.danger} /></View>
//             <Text style={S.modalTitle}>Log out</Text>
//             <Text style={S.modalSub}>Are you sure you want to log out from your account?</Text>
//             <View style={S.modalBtnRow}>
//               <TouchableOpacity style={[S.modalBtn, { backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB" }]} onPress={() => setLogoutModalOpen(false)}>
//                 <Text style={[S.modalBtnTxt, { color: C.muted }]}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[S.modalBtn, { backgroundColor: C.danger }]} onPress={handleConfirmedLogout}>
//                 <Text style={[S.modalBtnTxt, { color: "#fff" }]}>Log out</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const S = StyleSheet.create({
//   root:    { flex: 1, backgroundColor: "#F2F2F7" },
//   scroll:  { flex: 1 },
//   content: { paddingBottom: 80 },

//   // ── Sticky bar ──────────────────────────────────────────────────────────────
//   stickyOuter: {
//     position: "absolute", top: 0, left: 0, right: 0,
//     zIndex: 100,
//     height: STICKY_H + AVATAR_HANG + STATS_H,
//     overflow: "hidden",
//   },
//   stickyGrad: {
//     // Gradient fills the ENTIRE sticky area — bar + avatar zone + stats zone
//     // This matches image 3 where gradient background shows behind stats too
//     position: "absolute", top: 0, left: 0, right: 0,
//     bottom: 0,
//   },
//   stickyRow: {
//     position: "absolute", top: 0, left: 0, right: 0,
//     height: STICKY_H,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingTop: ST_BAR,
//     paddingHorizontal: 14,
//   },
//   stickyBackBtn: {
//     width: 34, height: 34, borderRadius: 17,
//     backgroundColor: "rgba(255,255,255,0.18)",
//     borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
//     alignItems: "center", justifyContent: "center",
//   },
//   stickyActions: { flexDirection: "row", gap: 8 },
//   stickyBtn: {
//     width: 36, height: 36, borderRadius: 18,
//     backgroundColor: "rgba(255,255,255,0.18)",
//     borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
//     alignItems: "center", justifyContent: "center",
//   },

//   // Avatar: centred, bottom of stickyOuter aligns with bottom of avatar
//   // i.e. it sits at (STICKY_H - AVATAR_SIZE + AVATAR_HANG) from top
//   avatarWrap: {
//     position: "absolute",
//     // top of avatar = STICKY_H - AVATAR_SIZE + AVATAR_HANG
//     // This puts it centred over the bar/white boundary
//     top: STICKY_H - (AVATAR_SIZE / 2),
//     left: SW / 2 - AVATAR_SIZE / 2,
//     width: AVATAR_SIZE, height: AVATAR_SIZE,
//     borderRadius: AVATAR_SIZE / 2,
//     alignItems: "center", justifyContent: "center",
//     zIndex: 102,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.22, shadowRadius: 10, elevation: 10,
//   },
//   avatarImg: {
//     width: AVATAR_SIZE, height: AVATAR_SIZE,
//     borderRadius: AVATAR_SIZE / 2,
//     borderWidth: 3.5, borderColor: "#fff",
//     overflow: "hidden",
//     backgroundColor: "#444",
//     alignItems: "center", justifyContent: "center",
//   },
//   avatarEditBadge: {
//     position: "absolute", bottom: 4, right: 4,
//     width: 30, height: 30, borderRadius: 15,
//     backgroundColor: "#1DA1F2",
//     borderWidth: 2.5, borderColor: "#fff",
//     alignItems: "center", justifyContent: "center",
//     zIndex: 103,
//   },

//   // Stats inside sticky — transparent so gradient shows through (like image 3)
//   stickyStatsWrap: {
//     position: "absolute",
//     top: STICKY_H + AVATAR_HANG,
//     left: 0, right: 0,
//     height: STATS_H,
//     backgroundColor: "transparent",
//   },

//   // ── Cover ────────────────────────────────────────────────────────────────────
//   cover:      { height: COVER_FULL, paddingTop: ST_BAR, justifyContent: "space-between", overflow: "hidden" },
//   coverPhoto: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
//   coverTop:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 10 },
//   coverTopRight: { flexDirection: "row", gap: 10 },
//   coverBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(50,50,50,0.45)", alignItems: "center", justifyContent: "center" },
//   addPhotoBtn:{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 8, backgroundColor: "rgba(0,0,0,0.28)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" },
//   addPhotoTxt:{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.92)" },
//   coverInfo:  { paddingHorizontal: 16, paddingBottom: 28 },
//   coverName:  { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.4, marginBottom: 2 },
//   coverUsername: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginBottom: 6 },
//   coverMetaRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
//   coverMeta:     { fontSize: 12, color: "rgba(255,255,255,0.75)" },

//   // ── White body ────────────────────────────────────────────────────────────────
//   whiteBody: {
//     backgroundColor: "#F2F2F7",
//     marginTop: -28,
//     paddingTop: Math.round(AVATAR_HANG) + 8,
//     paddingBottom: 40,
//     minHeight: 600,
//   },

//   // ── Stats row ──────────────────────────────────────────────────────────────────
//   statsRow:   { flexDirection: "row", alignItems: "center", paddingVertical: 0, backgroundColor: "#fff" },
//   statItem:   { flex: 1, alignItems: "center", paddingVertical: 18 },
//   statNumRow: { flexDirection: "row", alignItems: "center" },
//   statNum:    { fontSize: 22, fontWeight: "900", color: "#111" },
//   statLabel:  { fontSize: 10, color: "#888", fontWeight: "600", marginTop: 4, textAlign: "center", lineHeight: 15 },
//   statPlus:   { fontSize: 12, color: "#CCC", paddingHorizontal: 2 },
//   statDivider:{ width: 1, height: 36, backgroundColor: "#EEE" },

//   // Stats + verify top card
//   statsCard: {
//     backgroundColor: "#fff",
//     marginHorizontal: 14, marginTop: 4, marginBottom: 2,
//     borderRadius: 20,
//     shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
//     overflow: "hidden",
//   },
//   verifyCardInner: {
//     flexDirection: "row", alignItems: "center", gap: 12,
//     paddingHorizontal: 16, paddingVertical: 14,
//   },

//   verifyCard: {
//     flexDirection: "row", alignItems: "center", gap: 12,
//     margin: 14, marginTop: 10,
//     padding: 16, borderRadius: 20,
//     backgroundColor: "#fff",
//     shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
//   },
//   verifyIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center" },
//   verifyTitle: { fontSize: 14, fontWeight: "800", color: "#111" },
//   verifySub:   { fontSize: 12, color: "#888", marginTop: 2, lineHeight: 18 },

//   // Divider between sections
//   secDiv: { height: 10, backgroundColor: "#F2F2F7" },

//   // Section wrapper — elevated rounded card
//   sec: {
//     marginHorizontal: 14, marginVertical: 2,
//     paddingHorizontal: 16, paddingVertical: 16,
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.055, shadowRadius: 8, elevation: 2,
//   },
//   secHead:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
//   secTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
//   secEdit:  { width: 30, height: 30, borderRadius: 15, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" },
//   bodyTxt:  { fontSize: 13, color: "#555", lineHeight: 22 },

//   // "View All" teal text
//   viewAllText: { fontSize: 14, fontWeight: "700", color: "#3ECFB2" },

//   // Earning / Attendees info card
//   infoCard: {
//     flexDirection: "row", alignItems: "center",
//     marginHorizontal: 14, marginVertical: 2,
//     paddingHorizontal: 16, paddingVertical: 16,
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.055, shadowRadius: 8, elevation: 2,
//   },
//   infoCardRow: { fontSize: 13, color: "#666", lineHeight: 24, fontWeight: "500" },
//   infoCardVal: { color: "#111", fontWeight: "700" },

//   photoGrid:    { flexDirection: "row", gap: 4 },
//   photoLg:      { flex: 1.15, borderRadius: 12, overflow: "hidden", backgroundColor: "#F2F2F7" },
//   photoRightCol:{ flex: 1, gap: 4, justifyContent: "space-between" },
//   photoRow:     { flexDirection: "row", gap: 4 },
//   photoSm:      { borderRadius: 8, overflow: "hidden", backgroundColor: "#F2F2F7" },
//   photoAdd:     { borderRadius: 8, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#E8175D", backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center", gap: 2 },
//   photoAddTxt:  { fontSize: 9, fontWeight: "700", color: "#E8175D" },
//   photoEmpty:   { alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F7", borderRadius: 8 },
//   photoImg:     { width: "100%", height: "100%", resizeMode: "cover" },

//   chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
//   chip: {
//     flexDirection: "row", alignItems: "center",
//     paddingVertical: 7, paddingHorizontal: 14,
//     borderRadius: 999,
//     backgroundColor: "#F7F7F9",
//     borderWidth: 1, borderColor: "#E8E8EC",
//   },
//   chipTxt: { fontSize: 12, fontWeight: "600", color: "#333" },

//   logoutBtn: {
//     flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
//     marginHorizontal: 14, marginTop: 12,
//     paddingVertical: 15, borderRadius: 18,
//     backgroundColor: "#FFF5F5", borderWidth: 1.5, borderColor: "#FFCDD2",
//     shadowColor: "#E53935", shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08, shadowRadius: 6, elevation: 1,
//   },
//   logoutTxt: { fontSize: 14, fontWeight: "800", color: "#C62828" },

//   previewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" },
//   previewClose:   { position: "absolute", top: 52, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
//   previewImg:     { width: "90%", height: "70%" },

//   sheetOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
//   sheet:          { backgroundColor: "#fff", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingBottom: 44, paddingTop: 14 },
//   grabber:        { width: 44, height: 4, borderRadius: 999, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 20 },
//   sheetTitle:     { fontSize: 17, fontWeight: "800", color: "#111", marginBottom: 16 },
//   sheetRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
//   sheetIcon:      { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
//   sheetRowTxt:    { fontSize: 15, fontWeight: "700", color: "#111" },
//   sheetCancel:    { marginTop: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center" },
//   sheetCancelTxt: { fontSize: 14, fontWeight: "700", color: "#888" },

//   modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.48)", alignItems: "center", justifyContent: "center", padding: 20 },
//   modalCard:    { backgroundColor: "#fff", borderRadius: 26, padding: 28, width: "100%", maxWidth: 340, alignItems: "center", elevation: 12 },
//   modalIconBg:  { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 18 },
//   modalTitle:   { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 10 },
//   modalSub:     { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 21, marginBottom: 26 },
//   modalBtnRow:  { flexDirection: "row", gap: 10, width: "100%" },
//   modalBtn:     { flex: 1, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center" },
//   modalBtnTxt:  { fontSize: 15, fontWeight: "800" },
// });

// // ─────────────────────────────────────────────────────────────────────────────
// //  MY EVENTS SECTION  (inline embed in profile — Created / Going / Past tabs)
// // ─────────────────────────────────────────────────────────────────────────────

// // ── Tokens ───────────────────────────────────────────────────────────────────
// const EC = {
//   bg:          "#FFFBF5",
//   card:        "#FFFFFF",
//   cardBorder:  "#F0EBE3",
//   inputBg:     "#FAF7F2",
//   inputBorder: "#E8E0D5",
//   ink:         "#1C1A17",
//   ink2:        "#3D3A34",
//   muted:       "#8A8278",
//   hint:        "#BCB6AD",
//   teal:        "#3ECFB2",
//   tealBg:      "#E8FAF7",
//   tealText:    "#1A7A6A",
//   coral:       "#FF6F6F",
//   coralBg:     "#FFF0F0",
//   coralText:   "#C0392B",
//   amber:       "#F59E0B",
//   amberBg:     "#FFFBEB",
//   amberText:   "#92400E",
//   purple:      "#A78BFA",
//   purpleBg:    "#F3F0FF",
//   purpleText:  "#5B21B6",
//   green:       "#34D399",
//   greenBg:     "#ECFDF5",
//   greenText:   "#065F46",
//   blue:        "#60A5FA",
//   blueBg:      "#EFF6FF",
//   blueText:    "#1D4ED8",
// };

// // ── Types ─────────────────────────────────────────────────────────────────────
// type MyEventDoc = {
//   _id: string; title: string; emoji?: string;
//   kind: "free" | "paid" | "service";
//   priceCents?: number | null;
//   startsAt?: string | null; date?: string; time?: string; status?: string;
//   attendance?: number | null; attendees?: any[];
//   location?: { city?: string; admin1Code?: string; countryCode?: string };
//   _role?: "created" | "attended";
// };
// type MyEventsTab = "created" | "going" | "past";

// // ── Helpers ───────────────────────────────────────────────────────────────────
// function evStartMs(ev: MyEventDoc): number {
//   if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
//   const d = (ev.date ?? "").trim(), ti = (ev.time ?? "").trim();
//   if (d && ti) { const t = new Date(`${d}T${ti}:00Z`).getTime(); if (Number.isFinite(t)) return t; }
//   if (d) { const t = new Date(`${d}T12:00:00Z`).getTime(); if (Number.isFinite(t)) return t; }
//   return Number.POSITIVE_INFINITY;
// }
// function evState(ev: MyEventDoc): "upcoming" | "ongoing" | "past" {
//   const s = String(ev.status || "active").toLowerCase();
//   if (s === "ended" || s === "completed") return "past";
//   const ms = evStartMs(ev);
//   return (ms === Number.POSITIVE_INFINITY || ms > Date.now()) ? "upcoming" : "ongoing";
// }
// function evWhen(ev: MyEventDoc) {
//   const ms = evStartMs(ev);
//   if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "No time set";
//   return new Date(ms).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
// }
// function evWhere(ev: MyEventDoc) {
//   const city = ev.location?.city?.trim();
//   const cc   = ev.location?.countryCode?.trim();
//   if (!city && !cc) return "Location not set";
//   return `${city ?? ""}${cc ? ` · ${cc}` : ""}`.trim();
// }
// function evPrice(ev: MyEventDoc) {
//   if (ev.kind === "free") return "FREE";
//   return `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}`;
// }
// function safeParseJson(txt: string) { try { return JSON.parse(txt); } catch { return null; } }

// // ── Main component ─────────────────────────────────────────────────────────────
// function MyEventsSection({ userId, router }: { userId?: string | null; router: any }) {
//   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [activeTab, setActiveTab]   = useState<MyEventsTab>("created");
//   const [allCreated, setAllCreated] = useState<MyEventDoc[]>([]);
//   const [allGoing,   setAllGoing]   = useState<MyEventDoc[]>([]);
//   const [loading,    setLoading]    = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [err,        setErr]        = useState<string | null>(null);

//   const headers = useMemo(() => ({
//     "Content-Type": "application/json",
//     ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//   }), [EVENT_API_KEY]);

//   // Tab indicator animation
//   const tabsWidth   = useRef(0);
//   const indicatorX  = useRef(new Animated.Value(0)).current;
//   const tabIdx      = activeTab === "created" ? 0 : activeTab === "going" ? 1 : 2;
//   useEffect(() => {
//     if (!tabsWidth.current) return;
//     Animated.spring(indicatorX, {
//       toValue: tabIdx * (tabsWidth.current / 3),
//       useNativeDriver: true, speed: 18, bounciness: 7,
//     }).start();
//   }, [tabIdx]);

//   const load = useCallback(async () => {
//     if (!API_BASE || !userId) return;
//     setErr(null); setLoading(true);
//     try {
//       const [cRes, gRes] = await Promise.all([
//         apiFetch(`${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId)}&limit=200`, { method: "GET", headers }),
//         apiFetch(`${API_BASE}/api/bookings/going?clerkUserId=${encodeURIComponent(userId)}`, { method: "GET", headers }),
//       ]);
//       const cJson = safeParseJson(await cRes.text());
//       const gJson = safeParseJson(await gRes.text());
//       setAllCreated(Array.isArray(cJson?.createdEvents) ? cJson.createdEvents : []);
//       setAllGoing(Array.isArray(gJson?.events) ? gJson.events : []);
//     } catch (e: any) { setErr(e?.message || "Failed to load events"); }
//     finally { setLoading(false); setRefreshing(false); }
//   }, [API_BASE, userId, headers]);

//   useEffect(() => { load(); }, [load]);

//   const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

//   // Derived lists
//   const createdList = useMemo(() =>
//     allCreated.filter(e => ["upcoming","ongoing"].includes(evState(e)))
//       .sort((a, b) => evStartMs(a) - evStartMs(b)), [allCreated]);

//   const goingList = useMemo(() =>
//     allGoing.filter(e => evState(e) !== "past")
//       .sort((a, b) => evStartMs(a) - evStartMs(b)), [allGoing]);

//   const pastList = useMemo(() => {
//     const pastC = allCreated.filter(e => evState(e) === "past").map(e => ({ ...e, _role: "created" as const }));
//     const pastG = allGoing.filter(e => evState(e) === "past").map(e => ({ ...e, _role: "attended" as const }));
//     const seen = new Set<string>();
//     return [...pastC, ...pastG].filter(e => { if (seen.has(e._id)) return false; seen.add(e._id); return true; })
//       .sort((a, b) => evStartMs(b) - evStartMs(a));
//   }, [allCreated, allGoing]);

//   const currentList = activeTab === "created" ? createdList : activeTab === "going" ? goingList : pastList;

//   // Show only 2 initially, View All pe sab dikhao
//   const [showAll, setShowAll] = useState(false);

//   // Tab change pe showAll reset karo
//   const handleTabChange = (t: MyEventsTab) => {
//     setActiveTab(t);
//     setShowAll(false);
//   };

//   const displayList = showAll ? currentList : currentList.slice(0, 2);
//   const hasMore     = currentList.length > 2 && !showAll;

//   const onPressEvent = (ev: MyEventDoc) => {
//     router.push({
//       pathname: "/event-interest/[eventId]",
//       params: { eventId: ev._id, kind: ev.kind, title: ev.title, emoji: ev.emoji || "📍" },
//     });
//   };

//   return (
//     <View>
//       {/* Section header */}
//       <View style={ME.secHead}>
//         <View style={ME.secTitleRow}>
//           <View style={ME.secIcon}>
//             <Ionicons name="calendar" size={18} color={EC.teal} />
//           </View>
//           <Text style={ME.secTitle}>My Events</Text>
//           {showAll && (
//             <TouchableOpacity
//               onPress={() => setShowAll(false)}
//               style={ME.backBtn}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="arrow-back" size={14} color={EC.tealText} />
//               <Text style={ME.backBtnText}>Back</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Tab bar */}
//       <View
//         style={ME.tabsWrap}
//         onLayout={e => { tabsWidth.current = e.nativeEvent.layout.width; }}
//       >
//         {tabsWidth.current > 0 && (
//           <Animated.View style={[ME.tabIndicator, {
//             width: tabsWidth.current / 3,
//             transform: [{ translateX: indicatorX }],
//           }]} />
//         )}
//         {(["created","going","past"] as MyEventsTab[]).map((t, i) => {
//           const count = t === "created" ? createdList.length : t === "going" ? goingList.length : pastList.length;
//           const labels = ["Created", "Going", "Past"];
//           const active = activeTab === t;
//           return (
//             <TouchableOpacity
//               key={t}
//               onPress={() => handleTabChange(t)}
//               style={ME.tabBtn}
//               activeOpacity={0.8}
//             >
//               <Text style={[ME.tabText, active && ME.tabTextActive]}>{labels[i]}</Text>
//               {count > 0 && (
//                 <View style={[ME.tabPill, active && ME.tabPillActive]}>
//                   <Text style={[ME.tabPillText, active && ME.tabPillTextActive]}>{count}</Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       {/* Content */}
//       <View style={ME.listWrap}>
//         {loading ? (
//           <View style={ME.center}>
//             <ActivityIndicator color={EC.teal} />
//             <Text style={ME.loadingTxt}>Loading…</Text>
//           </View>
//         ) : err ? (
//           <View style={ME.center}>
//             <Text style={ME.errTxt}>{err}</Text>
//             <TouchableOpacity onPress={load} style={ME.retryBtn}>
//               <Text style={ME.retryTxt}>Retry</Text>
//             </TouchableOpacity>
//           </View>
//         ) : currentList.length === 0 ? (
//           <View style={ME.emptyBox}>
//             <Text style={{ fontSize: 28, marginBottom: 8 }}>
//               {activeTab === "created" ? "🗓️" : activeTab === "going" ? "🎟️" : "📦"}
//             </Text>
//             <Text style={ME.emptyTitle}>
//               {activeTab === "created" ? "No upcoming events" : activeTab === "going" ? "Not going to any events" : "No past events"}
//             </Text>
//             <Text style={ME.emptySub}>
//               {activeTab === "created" ? "Tap + to create your first event." : activeTab === "going" ? "Explore the map to find events." : "Events will appear here after they end."}
//             </Text>
//           </View>
//         ) : (
//           <>
//             {displayList.map((ev, idx) => (
//               <MyEventCard key={ev._id} ev={ev} idx={idx} onPress={() => onPressEvent(ev)} tab={activeTab} />
//             ))}

//             {/* View All button */}
//             {hasMore && (
//               <TouchableOpacity
//                 onPress={() => setShowAll(true)}
//                 style={ME.viewAllBtn}
//                 activeOpacity={0.85}
//               >
//                 <Ionicons name="grid-outline" size={15} color={EC.tealText} />
//                 <Text style={ME.viewAllText}>
//                   View All {currentList.length} Events
//                 </Text>
//                 <Ionicons name="chevron-forward" size={14} color={EC.tealText} />
//               </TouchableOpacity>
//             )}

//             {/* Back button when showing all */}
//             {showAll && currentList.length > 2 && (
//               <TouchableOpacity
//                 onPress={() => setShowAll(false)}
//                 style={ME.collapseBtn}
//                 activeOpacity={0.85}
//               >
//                 <Ionicons name="chevron-up" size={15} color={EC.muted} />
//                 <Text style={ME.collapseText}>Show Less</Text>
//               </TouchableOpacity>
//             )}
//           </>
//         )}
//       </View>
//     </View>
//   );
// }

// // ── Mini event card ────────────────────────────────────────────────────────────
// function MyEventCard({ ev, idx, onPress, tab }: {
//   ev: MyEventDoc; idx: number; onPress: () => void; tab: MyEventsTab;
// }) {
//   const fadeA = useRef(new Animated.Value(0)).current;
//   const slideY = useRef(new Animated.Value(10)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeA,  { toValue: 1, duration: 220, delay: Math.min(idx * 35, 150), useNativeDriver: true }),
//       Animated.timing(slideY, { toValue: 0, duration: 220, delay: Math.min(idx * 35, 150), useNativeDriver: true }),
//     ]).start();
//   }, []);

//   const isPast = tab === "past";
//   const kindCfg = ev.kind === "service"
//     ? { accent: EC.purple, accentBg: EC.purpleBg, accentText: EC.purpleText, label: "Service" }
//     : ev.kind === "paid"
//     ? { accent: EC.amber,  accentBg: EC.amberBg,  accentText: EC.amberText,  label: "Paid" }
//     : { accent: EC.teal,   accentBg: EC.tealBg,   accentText: EC.tealText,   label: "Free" };

//   const roleBadge = (ev._role === "created")
//     ? { bg: EC.amberBg, border: EC.amber + "55", text: EC.amberText, label: "⭐ Created" }
//     : (ev._role === "attended")
//     ? { bg: EC.blueBg,  border: EC.blue + "55",  text: EC.blueText,  label: "🎟 Attended" }
//     : null;

//   const attendeeCount = Array.isArray(ev.attendees) ? ev.attendees.length : 0;

//   return (
//     <Animated.View style={{ opacity: fadeA, transform: [{ translateY: slideY }], marginBottom: 10 }}>
//       <TouchableOpacity
//         onPress={onPress}
//         activeOpacity={0.88}
//         style={[ME.card, isPast && { opacity: 0.85 }]}
//       >
//         {/* Left accent strip */}
//         <View style={[ME.cardStrip, { backgroundColor: kindCfg.accent }]} />

//         <View style={ME.cardBody}>
//           {/* Icon + title row */}
//           <View style={ME.cardTop}>
//             <View style={[ME.cardIconBox, { backgroundColor: kindCfg.accentBg }]}>
//               <Text style={{ fontSize: 20 }}>{ev.emoji || (ev.kind === "service" ? "🛠️" : ev.kind === "paid" ? "🎟" : "🎉")}</Text>
//             </View>
//             <View style={{ flex: 1, minWidth: 0 }}>
//               <Text style={ME.cardTitle} numberOfLines={1}>{ev.title}</Text>
//               <View style={ME.badgeRow}>
//                 <View style={[ME.badge, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
//                   <Text style={[ME.badgeText, { color: kindCfg.accentText }]}>{kindCfg.label}</Text>
//                 </View>
//                 {isPast && (
//                   <View style={[ME.badge, { backgroundColor: EC.inputBg, borderColor: EC.inputBorder }]}>
//                     <Text style={[ME.badgeText, { color: EC.muted }]}>✓ Ended</Text>
//                   </View>
//                 )}
//                 {roleBadge && (
//                   <View style={[ME.badge, { backgroundColor: roleBadge.bg, borderColor: roleBadge.border }]}>
//                     <Text style={[ME.badgeText, { color: roleBadge.text }]}>{roleBadge.label}</Text>
//                   </View>
//                 )}
//               </View>
//             </View>
//             {/* Price */}
//             <View style={[ME.pricePill, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
//               <Text style={[ME.priceText, { color: kindCfg.accentText }]}>{evPrice(ev)}</Text>
//             </View>
//           </View>

//           {/* Meta row */}
//           <View style={ME.metaRow}>
//             <View style={ME.metaItem}>
//               <Ionicons name="calendar-outline" size={12} color={EC.hint} style={{ marginRight: 4 }} />
//               <Text style={ME.metaText} numberOfLines={1}>{evWhen(ev)}</Text>
//             </View>
//             <View style={ME.metaItem}>
//               <Ionicons name="location-outline" size={12} color={EC.hint} style={{ marginRight: 4 }} />
//               <Text style={ME.metaText} numberOfLines={1}>{evWhere(ev)}</Text>
//             </View>
//             {attendeeCount > 0 && (
//               <View style={ME.metaItem}>
//                 <Ionicons name="people-outline" size={12} color={EC.hint} style={{ marginRight: 4 }} />
//                 <Text style={ME.metaText}>{attendeeCount} joined</Text>
//               </View>
//             )}
//           </View>
//         </View>

//         <Ionicons name="chevron-forward" size={16} color={EC.hint} style={{ marginRight: 4 }} />
//       </TouchableOpacity>
//     </Animated.View>
//   );
// }

// // ── My Events styles ──────────────────────────────────────────────────────────
// const ME = StyleSheet.create({
//   secHead:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
//   secTitleRow:{ flexDirection: "row", alignItems: "center", gap: 10 },
//   secIcon: {
//     width: 36, height: 36, borderRadius: 10,
//     backgroundColor: EC.tealBg, borderWidth: 1.5, borderColor: EC.teal + "44",
//     alignItems: "center", justifyContent: "center",
//   },
//   secTitle: { fontSize: 16, fontWeight: "800", color: "#111" },

//   // Tab bar
//   tabsWrap: {
//     flexDirection: "row", marginHorizontal: 16, marginBottom: 14,
//     borderRadius: 999, padding: 4,
//     backgroundColor: "#F5F0FF",
//     borderWidth: 1.5, borderColor: EC.cardBorder,
//     overflow: "hidden", position: "relative",
//   },
//   tabIndicator: {
//     position: "absolute", left: 4, top: 4, bottom: 4,
//     borderRadius: 999, backgroundColor: EC.teal,
//     shadowColor: EC.teal, shadowOpacity: 0.3,
//     shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
//   },
//   tabBtn:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 999 },
//   tabText:         { fontSize: 13, fontWeight: "800", color: EC.muted },
//   tabTextActive:   { color: "#fff" },
//   tabPill:         { backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
//   tabPillActive:   { backgroundColor: "rgba(255,255,255,0.28)" },
//   tabPillText:     { fontSize: 10, fontWeight: "900", color: EC.muted },
//   tabPillTextActive:{ color: "#fff" },

//   listWrap: { paddingHorizontal: 16, paddingBottom: 8 },

//   // Empty / loading / error
//   center: { alignItems: "center", paddingVertical: 32 },
//   loadingTxt: { color: EC.muted, fontSize: 13, fontWeight: "600", marginTop: 8 },
//   errTxt:     { color: EC.coralText, fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: 10 },
//   retryBtn:   { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999, backgroundColor: EC.teal },
//   retryTxt:   { color: "#fff", fontWeight: "800", fontSize: 13 },
//   emptyBox:   { alignItems: "center", paddingVertical: 28 },
//   emptyTitle: { fontSize: 15, fontWeight: "800", color: EC.ink, marginBottom: 4 },
//   emptySub:   { fontSize: 12, color: EC.muted, fontWeight: "600", textAlign: "center", paddingHorizontal: 20 },

//   // Card
//   card: {
//     flexDirection: "row", alignItems: "center",
//     backgroundColor: EC.card,
//     borderRadius: 16,
//     borderWidth: 1.5, borderColor: EC.cardBorder,
//     overflow: "hidden",
//     shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.04, shadowRadius: 5, elevation: 1,
//   },
//   cardStrip:  { width: 4, alignSelf: "stretch" },
//   cardBody:   { flex: 1, padding: 14 },
//   cardTop:    { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
//   cardIconBox:{
//     width: 44, height: 44, borderRadius: 12,
//     alignItems: "center", justifyContent: "center",
//     flexShrink: 0,
//   },
//   cardTitle:  { fontSize: 14, fontWeight: "800", color: EC.ink, marginBottom: 5, letterSpacing: -0.2 },
//   badgeRow:   { flexDirection: "row", flexWrap: "wrap", gap: 5 },
//   badge:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, borderWidth: 1.5 },
//   badgeText:  { fontSize: 10, fontWeight: "800" },
//   pricePill:  { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1.5, flexShrink: 0 },
//   priceText:  { fontSize: 11, fontWeight: "900" },

//   // Meta
//   metaRow:  { flexDirection: "row", flexWrap: "wrap", gap: 10 },
//   metaItem: { flexDirection: "row", alignItems: "center" },
//   metaText: { fontSize: 11, color: EC.muted, fontWeight: "600" },

//   // View All / Back buttons
//   viewAllBtn: {
//     flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
//     marginTop: 6, marginBottom: 4,
//     paddingVertical: 12, borderRadius: 12,
//     backgroundColor: EC.tealBg, borderWidth: 1.5, borderColor: EC.teal + "55",
//   },
//   viewAllText: { fontSize: 13, fontWeight: "800", color: EC.tealText },

//   collapseBtn: {
//     flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
//     marginTop: 6, marginBottom: 4,
//     paddingVertical: 11, borderRadius: 12,
//     backgroundColor: EC.inputBg, borderWidth: 1.5, borderColor: EC.inputBorder,
//   },
//   collapseText: { fontSize: 13, fontWeight: "700", color: EC.muted },

//   backBtn: {
//     flexDirection: "row", alignItems: "center", gap: 4,
//     marginLeft: "auto" as any,
//     paddingHorizontal: 10, paddingVertical: 5,
//     borderRadius: 999, backgroundColor: EC.tealBg,
//     borderWidth: 1, borderColor: EC.teal + "44",
//   },
//   backBtnText: { fontSize: 12, fontWeight: "700", color: EC.tealText },
// });
import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  View, Text, TouchableOpacity, Animated, ActivityIndicator,
  Image, RefreshControl, Modal, Dimensions,
  StyleSheet, StatusBar, Platform, Linking,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { apiFetch } from "../../lib/apiFetch";
import PhotosManagerModal from "../../components/profile/PhotosManagerModal";
import HistorySummaryModal from "../../components/profile/HistorySummaryModal";

// ─── Screen geometry ──────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get("window");
const ST_BAR = Platform.OS === "ios" ? 44 : (StatusBar.currentHeight ?? 24);

const COVER_H = 500;
const COVER_FULL = COVER_H + ST_BAR;
const AVATAR_SIZE = 96;
const STICKY_CONTENT = 52;
const STICKY_H = STICKY_CONTENT + ST_BAR;
const AVATAR_HANG = AVATAR_SIZE * 0.50;
const STATS_H = 96;
const STICKY_TOTAL = STICKY_H + AVATAR_HANG + STATS_H;
const TRIGGER = 120;

// ─── Photo grid ───────────────────────────────────────────────────────────────
const GRID_W = SW - 32;
const RIGHT_W = GRID_W * (1 / 2.15) - 4;
const PHOTO_SM = Math.floor((RIGHT_W - 4) / 2);
const PHOTO_LG_H = PHOTO_SM * 2 + 4;

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#F2F2F7", white: "#FFFFFF", ink: "#111111", muted: "#888888", border: "#EEEEEE",
  cov1: "#D4405A", cov2: "#9B3EBF", cov3: "#5B4FD4",
  nav1: "#C8406A", nav2: "#8B3EBF", nav3: "#5B4FD4",
  p1: "#E8175D", pLight: "#FFF0F5",
  danger: "#E53935", dangerBg: "#FFF5F5", dangerBorder: "#FFCDD2", dangerText: "#C62828",
};

// ─── Interest icons ───────────────────────────────────────────────────────────
const INTEREST_ICON: Record<string, string> = {
  "art": "color-palette-outline", "cultural activities": "musical-notes-outline",
  "music": "headset-outline", "networking": "people-outline",
  "photography": "camera-outline", "painting": "brush-outline",
  "yoga": "body-outline", "travelling": "airplane-outline",
  "travel": "airplane-outline", "cooking": "restaurant-outline",
  "sports": "football-outline", "reading": "book-outline",
  "gaming": "game-controller-outline", "fitness": "barbell-outline",
  "tech": "hardware-chip-outline",
};
function interestIcon(label: string) {
  const k = label.toLowerCase();
  for (const [key, val] of Object.entries(INTEREST_ICON)) { if (k.includes(key)) return val; }
  return "star-outline";
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ProfileData = {
  name?: string; username?: string; about?: string;
  interests?: string[]; languages?: string[]; photos?: string[]; avatar?: string | null;
  rating?: number; eventsHosted?: number; totalAttendees?: number;
  email?: string; city?: string; country?: string;
  // Stats
  repeatedAttendees?: number;
  newAttendees?: number;
  thisMonthEarning?: number;
  overallEarning?: number;
  services?: string[];
  reviewsCount?: number;
};
function sanitizePhotos(p?: unknown): string[] {
  if (!Array.isArray(p)) return [];
  return p.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}
const STORAGE_KEY = "@profile";
const PROFILE_ENDPOINT = "/api/profile";

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileHome() {
  const router = useRouter();
  const { signOut, userId } = useAuth();
  const { user } = useUser();
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [profile, setProfile] = useState<ProfileData>({});
  const [refreshing, setRefreshing] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const photos = useMemo(() => sanitizePhotos(profile.photos), [profile.photos]);
  const previewPhotos = photos.slice(0, 4);
  const hasAvatar = !!(profile.avatar);
  const avatarUri = profile.avatar ?? null;

  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Scroll-driven animations ──────────────────────────────────────────────
  const stickyOpacity = scrollY.interpolate({
    inputRange: [TRIGGER - 10, TRIGGER + 24],
    outputRange: [0, 1], extrapolate: "clamp",
  });
  const stickyTranslateY = scrollY.interpolate({
    inputRange: [TRIGGER - 10, TRIGGER + 24],
    outputRange: [-STICKY_TOTAL, 0], extrapolate: "clamp",
  });
  const coverImgParallax = scrollY.interpolate({
    inputRange: [0, COVER_FULL],
    outputRange: [0, -COVER_FULL * 0.25], extrapolate: "clamp",
  });
  const coverBtnOpacity = scrollY.interpolate({
    inputRange: [0, TRIGGER - 30],
    outputRange: [1, 0], extrapolate: "clamp",
  });
  const coverInfoOpacity = scrollY.interpolate({
    inputRange: [0, TRIGGER - 30],
    outputRange: [1, 0], extrapolate: "clamp",
  });
  const whiteRadius = scrollY.interpolate({
    inputRange: [TRIGGER - 10, TRIGGER + 24],
    outputRange: [28, 0], extrapolate: "clamp",
  });
  const avatarOp = scrollY.interpolate({
    inputRange: [TRIGGER, TRIGGER + 40],
    outputRange: [0, 1], extrapolate: "clamp",
  });
  const avatarScale = scrollY.interpolate({
    inputRange: [TRIGGER, TRIGGER + 50],
    outputRange: [0.6, 1], extrapolate: "clamp",
  });

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!API_BASE || !userId) return;
    try {
      const url = `${API_BASE.replace(/\/$/, "")}${PROFILE_ENDPOINT}?clerkUserId=${encodeURIComponent(userId)}`;
      const res = await apiFetch(url, {
        method: "GET",
        headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {},
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const j = await res.json().catch(() => ({}));
      const s = (j?.profile || j?.data || j) as any;
      const next: ProfileData = {
        name: s?.name, username: s?.username, about: s?.about,
        interests: Array.isArray(s?.interests) ? s.interests : [],
        languages: Array.isArray(s?.languages) ? s.languages : [],
        photos: Array.isArray(s?.photos) ? s.photos : [],
        avatar: typeof s?.avatar === "string" ? s.avatar : null,
        rating: s?.rating ?? s?.averageRating ?? 0,
        eventsHosted: s?.eventsHosted ?? s?.events_hosted ?? 0,
        totalAttendees: s?.totalAttendees ?? s?.total_attendees ?? 0,
        repeatedAttendees: s?.repeatedAttendees ?? 0,
        newAttendees: s?.newAttendees ?? 0,
        thisMonthEarning: s?.thisMonthEarning ?? 0,
        overallEarning: s?.overallEarning ?? 0,
        services: Array.isArray(s?.services) ? s.services : [],
        reviewsCount: s?.reviewsCount ?? 0,
        email: s?.email ?? "",
        city: s?.city ?? "",
        country: s?.country ?? "",
      };
      setProfile(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, [API_BASE, EVENT_API_KEY, userId]);

  useEffect(() => {
    (async () => {
      const r = await AsyncStorage.getItem(STORAGE_KEY);
      if (r) try { setProfile(JSON.parse(r)); } catch {}
      await fetchProfile();
    })();
  }, [fetchProfile]);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Force stats recalculation on server
      if (API_BASE && userId) {
        const statsUrl = `${API_BASE.replace(/\/$/, "")}/api/users/stats?clerkUserId=${encodeURIComponent(userId)}`;
        await apiFetch(statsUrl, {
          method: "GET",
          headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {},
        }).catch(() => null);
      }
      // 2. Fetch fresh profile (which now has updated stats)
      await fetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [API_BASE, EVENT_API_KEY, userId, fetchProfile]);

  const handleConfirmedLogout = async () => {
    setLogoutModalOpen(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await signOut();
    router.replace("/sign-in");
  };

  const openPreview = useCallback((uri: string | null) => {
    if (!uri) return;
    setPreviewUri(uri);
    setPreviewOpen(true);
  }, []);

  async function uploadPhoto(replaceUri?: string | null, isAvatar?: boolean) {
    if (!API_BASE || !userId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error("Please allow photo permissions.");
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [1, 1],
    });
    if (picked.canceled) return;
    const asset = picked.assets?.[0];
    const uri = asset?.uri;
    if (!uri) throw new Error("No photo selected.");
    let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
    if (isAvatar) url += "&isAvatar=true";
    else if (replaceUri) url += `&replaceUri=${encodeURIComponent(replaceUri)}`;
    const form = new FormData();
    form.append("file", {
      uri, name: asset?.fileName?.trim() || `photo_${Date.now()}.jpg`,
      type: asset?.mimeType || "image/jpeg",
    } as any);
    const res = await apiFetch(url, {
      method: "POST",
      headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {},
      body: form as any,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      let m = `Upload failed (${res.status})`;
      try { m = JSON.parse(t)?.error || m; } catch {}
      throw new Error(m);
    }
    await fetchProfile();
  }

  async function deletePhoto(uri: string, isAvatar?: boolean) {
    if (!API_BASE || !userId) return;
    let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
    if (isAvatar) url += "&isAvatar=true";
    const res = await apiFetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      },
      body: JSON.stringify({ uri }),
    });
    if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    await fetchProfile();
  }

  // ─── Stats Row ─────────────────────────────────────────────────────────────
  // isOnGradient=true  → white text (sticky bar ke liye)
  // isOnGradient=false → dark text (white body ke liye)
  const StatsRow = ({ style, isOnGradient = false }: { style?: any; isOnGradient?: boolean }) => {
    const numColor   = isOnGradient ? "#fff"                     : "#111";
    const labelColor = isOnGradient ? "rgba(255,255,255,0.80)"  : "#888";
    const divColor   = isOnGradient ? "rgba(255,255,255,0.30)"  : "#EEE";
    const starColor  = isOnGradient ? "#FFD700"                  : "#F5A623";
    return (
      <View style={[S.statsRow, { backgroundColor: isOnGradient ? "transparent" : "#fff" }, style]}>
        {/* Rating */}
        <View style={S.statItem}>
          <View style={S.statNumRow}>
            <Ionicons name="star" size={14} color={starColor} style={{ marginRight: 3 }} />
            <Text style={[S.statNum, { color: numColor }]}>
              {profile.rating?.toFixed(1) ?? "0.0"}
            </Text>
          </View>
          <Text style={[S.statLabel, { color: labelColor }]}>Rating</Text>
        </View>

        {/* Divider */}
        <View style={[S.statDivider, { backgroundColor: divColor }]} />

        {/* Events Hosted */}
        <View style={S.statItem}>
          <Text style={[S.statNum, { color: numColor }]}>
            {profile.eventsHosted ?? 0}
          </Text>
          <Text style={[S.statLabel, { color: labelColor }]}>{"Events\nHosted"}</Text>
        </View>

        {/* Divider */}
        <View style={[S.statDivider, { backgroundColor: divColor }]} />

        {/* Total Attendees */}
        <View style={S.statItem}>
          <Text style={[S.statNum, { color: numColor }]}>
            {profile.totalAttendees ?? 0}
          </Text>
          <Text style={[S.statLabel, { color: labelColor }]}>{"Total\nAttendees"}</Text>
        </View>
      </View>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ══════════════════════════════════════════════
          STICKY BAR  (slides in from top on scroll)
          Layout:
            [gradient nav bar: X  —  ✏️ ⚙️]   STICKY_H
            [avatar centred, hangs below bar]   AVATAR_HANG
            [stats row: Rating | Events | Att]  STATS_H
         ══════════════════════════════════════════════ */}
      <Animated.View
        style={[
          S.stickyOuter,
          { opacity: stickyOpacity, transform: [{ translateY: stickyTranslateY }] },
        ]}
        pointerEvents={scrolled ? "auto" : "none"}
      >
        {/* Full-height gradient behind everything in sticky */}
        <LinearGradient
          colors={[C.nav1, C.nav2, C.nav3]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={S.stickyGrad}
        />

        {/* Top row: X  —space—  ✏️ ⚙️ */}
        <View style={S.stickyRow}>
          <TouchableOpacity style={S.stickyBackBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={S.stickyActions}>
            <TouchableOpacity
              style={S.stickyBtn}
              onPress={() => router.push("/profile/settings/PersonalInfo" as any)}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={S.stickyBtn}
              onPress={() => router.push("/profile/settings")}
            >
              <Ionicons name="settings-outline" size={17} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar — centred, straddles bar/stats boundary */}
        <Animated.View
          style={[
            S.avatarWrap,
            { opacity: avatarOp, transform: [{ scale: avatarScale }] },
          ]}
        >
          {avatarUri
            ? <Image source={{ uri: avatarUri }} style={S.avatarImg} />
            : (
              <LinearGradient colors={[C.cov1, C.cov2]} style={S.avatarImg}>
                <Ionicons name="person" size={32} color="rgba(255,255,255,0.55)" />
              </LinearGradient>
            )
          }
          <TouchableOpacity
            style={S.avatarEditBadge}
            onPress={() => setMenuOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={13} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats row — white text on gradient */}
        <View style={S.stickyStatsWrap}>
          <StatsRow isOnGradient={true} />
        </View>
      </Animated.View>

      {/* ══════════════════════════════════════════════
          SCROLL VIEW
         ══════════════════════════════════════════════ */}
      <Animated.ScrollView
        style={S.scroll}
        contentContainerStyle={S.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: (e: any) =>
              setScrolled(e.nativeEvent.contentOffset.y > TRIGGER - 10),
          }
        )}
      >
        {/* ── COVER ── */}
        <View style={S.cover}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: [{ translateY: coverImgParallax }] }]}
          >
            {hasAvatar && avatarUri
              ? <Image source={{ uri: avatarUri }} style={S.coverPhoto} resizeMode="cover" />
              : (
                <LinearGradient
                  colors={[C.cov1, C.cov2, C.cov3]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              )
            }
          </Animated.View>
          <LinearGradient
            colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]}
            style={StyleSheet.absoluteFill}
          />

          {/* Cover top buttons */}
          <Animated.View style={[S.coverTop, { opacity: coverBtnOpacity }]}>
            <TouchableOpacity style={S.coverBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={S.coverTopRight}>
              <TouchableOpacity
                style={S.coverBtn}
                onPress={() => router.push("/profile/settings/PersonalInfo" as any)}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={S.coverBtn}
                onPress={() => router.push("/profile/settings")}
              >
                <Ionicons name="settings-outline" size={19} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {!hasAvatar && (
            <TouchableOpacity style={S.addPhotoBtn} onPress={() => setMenuOpen(true)}>
              <Ionicons name="camera-outline" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={S.addPhotoTxt}>Add Photo</Text>
            </TouchableOpacity>
          )}

          {/* Cover info */}
          <Animated.View style={[S.coverInfo, { opacity: coverInfoOpacity }]}>
            <Text style={S.coverName}>{profile.name || "User Name"}</Text>
            <Text style={S.coverUsername}>
              {profile.username ? `@${profile.username}` : "Name"}
            </Text>
            <View style={S.coverMetaRow}>
              <Ionicons name="mail-outline" size={11} color="rgba(255,255,255,0.75)" />
              <Text style={S.coverMeta} numberOfLines={1}>
                {profile.email || user?.primaryEmailAddress?.emailAddress || "No email added"}
              </Text>
            </View>
            <View style={S.coverMetaRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.75)" />
              <Text style={S.coverMeta} numberOfLines={1}>
                {profile.city || profile.country 
                  ? `${profile.city || ""}${profile.city && profile.country ? ", " : ""}${profile.country || ""}`
                  : "Location not added"}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* ── WHITE BODY ── */}
        <Animated.View
          style={[
            S.whiteBody,
            { borderTopLeftRadius: whiteRadius, borderTopRightRadius: whiteRadius },
          ]}
        >
          {/* Stats + Verify card */}
          <View style={S.statsCard}>
            <StatsRow
              isOnGradient={false}
              style={{ borderBottomWidth: 1, borderColor: "#F0F0F0" }}
            />
            <TouchableOpacity style={S.verifyCardInner} activeOpacity={0.92}>
              <View style={S.verifyIcon}>
                <Ionicons name="shield-checkmark" size={20} color={C.p1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.verifyTitle}>Get verified</Text>
                <Text style={S.verifySub}>
                  Lorem ipsum is simply dummy text of the industry.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          </View>

          {/* Photos */}
          <View style={S.secDiv} />
          <View style={S.sec}>
            <View style={S.secHead}>
              <Text style={S.secTitle}>Photos</Text>
              <TouchableOpacity style={S.secEdit} onPress={() => setPhotosOpen(true)}>
                <Ionicons name="pencil" size={13} color="#777" />
              </TouchableOpacity>
            </View>
            <View style={[S.photoGrid, { height: PHOTO_LG_H }]}>
              <TouchableOpacity
                style={[S.photoLg, { height: PHOTO_LG_H }]}
                onPress={() => previewPhotos[0] && openPreview(previewPhotos[0])}
                activeOpacity={0.88}
              >
                {previewPhotos[0]
                  ? <Image source={{ uri: previewPhotos[0] }} style={S.photoImg} />
                  : <View style={[S.photoEmpty, { height: PHOTO_LG_H }]}>
                      <Ionicons name="image-outline" size={26} color="#CCC" />
                    </View>
                }
              </TouchableOpacity>
              <View style={S.photoRightCol}>
                <View style={S.photoRow}>
                  {[1, 2].map(i => (
                    <TouchableOpacity
                      key={i}
                      style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]}
                      onPress={() => previewPhotos[i] && openPreview(previewPhotos[i])}
                      activeOpacity={0.88}
                    >
                      {previewPhotos[i]
                        ? <Image source={{ uri: previewPhotos[i] }} style={S.photoImg} />
                        : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}>
                            <Ionicons name="image-outline" size={16} color="#CCC" />
                          </View>
                      }
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={S.photoRow}>
                  <TouchableOpacity
                    style={[S.photoSm, { width: PHOTO_SM, height: PHOTO_SM }]}
                    onPress={() => previewPhotos[3] && openPreview(previewPhotos[3])}
                    activeOpacity={0.88}
                  >
                    {previewPhotos[3]
                      ? <Image source={{ uri: previewPhotos[3] }} style={S.photoImg} />
                      : <View style={[S.photoEmpty, { width: PHOTO_SM, height: PHOTO_SM }]}>
                          <Ionicons name="image-outline" size={16} color="#CCC" />
                        </View>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.photoAdd, { width: PHOTO_SM, height: PHOTO_SM }]}
                    onPress={() => setPhotosOpen(true)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="camera-outline" size={18} color={C.p1} />
                    <Text style={S.photoAddTxt}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <PhotosManagerModal
            visible={photosOpen}
            onClose={() => setPhotosOpen(false)}
            photos={photos}
            maxPhotos={20}
            minPhotos={0}
            onUpload={uploadPhoto}
            onDelete={deletePhoto}
          />

          {/* About */}
          <View style={S.secDiv} />
          <View style={S.sec}>
            <View style={S.secHead}>
              <Text style={S.secTitle}>About</Text>
              <TouchableOpacity
                style={S.secEdit}
                onPress={() => router.push("/profile/settings/AboutMe" as any)}
              >
                <Ionicons name="pencil" size={13} color="#777" />
              </TouchableOpacity>
            </View>
            <Text style={S.bodyTxt}>{profile.about || "Add something about you…"}</Text>
          </View>

          {/* Interests */}
          <View style={S.secDiv} />
          <View style={S.sec}>
            <View style={S.secHead}>
              <Text style={S.secTitle}>Interests</Text>
              <TouchableOpacity
                style={S.secEdit}
                onPress={() => router.push("/profile/settings/Interests" as any)}
              >
                <Ionicons name="pencil" size={13} color="#777" />
              </TouchableOpacity>
            </View>
            <View style={S.chipsWrap}>
              {(profile.interests?.length
                ? profile.interests
                : ["Art", "Cultural Activities", "Music", "Networking", "Photography", "Painting", "Yoga", "Travelling"]
              ).map((x, i) => (
                <View key={i} style={S.chip}>
                  <Ionicons
                    name={interestIcon(x) as any}
                    size={13}
                    color="#555"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={S.chipTxt}>{x}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Language */}
          <View style={S.secDiv} />
          <View style={S.sec}>
            <View style={S.secHead}>
              <Text style={S.secTitle}>Language</Text>
              <TouchableOpacity
                style={S.secEdit}
                onPress={() => router.push("/profile/settings/Languages" as any)}
              >
                <Ionicons name="pencil" size={13} color="#777" />
              </TouchableOpacity>
            </View>
            <View style={S.chipsWrap}>
              {(profile.languages?.length
                ? profile.languages
                : ["English", "Hindi", "French"]
              ).map(x => (
                <View key={x} style={S.chip}>
                  <Ionicons name="language-outline" size={13} color="#555" style={{ marginRight: 4 }} />
                  <Text style={S.chipTxt}>{x}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Services Provided */}
          <View style={S.secDiv} />
          <View style={S.sec}>
            <View style={S.secHead}>
              <Text style={S.secTitle}>Services Provided</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/profile/settings" as any)}
              >
                <Text style={S.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={S.chipsWrap}>
              {(profile.services?.length
                ? profile.services
                : ["Yoga Classes", "Meditation Session", "Workshops", "Photowalk"]
              ).map(s => (
                <View key={s} style={S.chip}>
                  <Text style={S.chipTxt}>{s}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Earning */}
          <View style={S.secDiv} />
          <TouchableOpacity
            style={S.infoCard}
            activeOpacity={0.88}
            onPress={() => router.push("/profile/earnings" as any)}
          >
            <View style={{ flex: 1 }}>
              <Text style={S.secTitle}>Earning</Text>
              <View style={{ height: 10 }} />
              <Text style={S.infoCardRow}>
                This Month : <Text style={S.infoCardVal}>
                  ₹{((profile.thisMonthEarning ?? 0) / 100).toLocaleString()}
                </Text>
              </Text>
              <Text style={S.infoCardRow}>
                Overall : <Text style={S.infoCardVal}>
                ₹{((profile.overallEarning ?? 0) / 100).toLocaleString()}
                </Text>
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.cov3} />
          </TouchableOpacity>

          {/* Attendees Overview */}
          <View style={S.secDiv} />
          <TouchableOpacity
            style={S.infoCard}
            activeOpacity={0.88}
            onPress={() => router.push("/profile/attendees" as any)}
          >
            <View style={{ flex: 1 }}>
              <Text style={S.secTitle}>Attendees Overview</Text>
              <View style={{ height: 10 }} />
              <Text style={S.infoCardRow}>
                Repeated Attendees : <Text style={S.infoCardVal}>
                  {profile.repeatedAttendees ?? 0}
                </Text>
              </Text>
              <Text style={S.infoCardRow}>
                New Attendees : <Text style={S.infoCardVal}>
                  {profile.newAttendees ?? 0}
                </Text>
              </Text>
              <Text style={S.infoCardRow}>
                Total attendees : <Text style={S.infoCardVal}>
                  {profile.totalAttendees ?? 0}
                </Text>
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.cov3} />
          </TouchableOpacity>

          {/* My Events */}
          <View style={S.secDiv} />
          <MyEventsSection userId={userId} router={router} />

          {/* Logout */}
          <TouchableOpacity
            style={S.logoutBtn}
            activeOpacity={0.88}
            onPress={() => setLogoutModalOpen(true)}
          >
            <Ionicons name="log-out-outline" size={18} color={C.dangerText} />
            <Text style={S.logoutTxt}>Log out</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>

      {/* ══ MODALS ══ */}
      <Modal
        visible={previewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewOpen(false)}
      >
        <View style={S.previewOverlay}>
          <TouchableOpacity style={S.previewClose} onPress={() => setPreviewOpen(false)}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          {previewUri && (
            <Image source={{ uri: previewUri }} style={S.previewImg} resizeMode="contain" />
          )}
        </View>
      </Modal>

      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={S.sheetOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={S.sheet}>
            <View style={S.grabber} />
            <Text style={S.sheetTitle}>Profile Photo</Text>
            <TouchableOpacity
              style={S.sheetRow}
              onPress={async () => {
                setMenuOpen(false);
                try { await uploadPhoto(null, true); } catch (e: any) { alert(e.message); }
              }}
            >
              <View style={[S.sheetIcon, { backgroundColor: C.pLight }]}>
                <Ionicons name="image-outline" size={19} color={C.p1} />
              </View>
              <Text style={[S.sheetRowTxt, { marginLeft: 14 }]}>Update Photo</Text>
            </TouchableOpacity>
            {hasAvatar && (
              <TouchableOpacity
                style={[S.sheetRow, { borderBottomWidth: 0 }]}
                onPress={async () => {
                  setMenuOpen(false);
                  try { await deletePhoto("", true); } catch (e: any) { alert(e.message); }
                }}
              >
                <View style={[S.sheetIcon, { backgroundColor: C.dangerBg }]}>
                  <Ionicons name="trash-outline" size={19} color={C.danger} />
                </View>
                <Text style={[S.sheetRowTxt, { marginLeft: 14, color: C.dangerText }]}>
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={S.sheetCancel} onPress={() => setMenuOpen(false)}>
              <Text style={S.sheetCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={logoutModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalOpen(false)}
      >
        <View style={S.modalOverlay}>
          <View style={S.modalCard}>
            <View style={[S.modalIconBg, { backgroundColor: C.dangerBg }]}>
              <Ionicons name="log-out" size={28} color={C.danger} />
            </View>
            <Text style={S.modalTitle}>Log out</Text>
            <Text style={S.modalSub}>
              Are you sure you want to log out from your account?
            </Text>
            <View style={S.modalBtnRow}>
              <TouchableOpacity
                style={[S.modalBtn, { backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB" }]}
                onPress={() => setLogoutModalOpen(false)}
              >
                <Text style={[S.modalBtnTxt, { color: C.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.modalBtn, { backgroundColor: C.danger }]}
                onPress={handleConfirmedLogout}
              >
                <Text style={[S.modalBtnTxt, { color: "#fff" }]}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Support Button */}
      <TouchableOpacity 
        style={S.supportFloat} 
        activeOpacity={0.85}
        onPress={() => {
          // WhatsApp Support Link with provided number
          const url = 'https://wa.me/918103822670';
          Linking.openURL(url).catch(() => {
             alert("Could not open WhatsApp. Please ensure it is installed.");
          });
        }}
      >
        <Ionicons name="headset-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:    { flex: 1, backgroundColor: "#F2F2F7" },
  scroll:  { flex: 1 },
  content: { paddingBottom: 80 },

  // ── Sticky bar ──────────────────────────────────────────────────────────────
  stickyOuter: {
    position: "absolute", top: 0, left: 0, right: 0,
    zIndex: 100,
    // Total height = nav bar + avatar hang + stats row
    height: STICKY_H + AVATAR_HANG + STATS_H,
    overflow: "hidden",
  },
  stickyGrad: {
    // Gradient covers ENTIRE sticky area so stats also sit on gradient
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
  },
  stickyRow: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: STICKY_H,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: ST_BAR,
    paddingHorizontal: 14,
  },
  stickyBackBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center", justifyContent: "center",
  },
  stickyActions: { flexDirection: "row", gap: 8 },
  stickyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },

  // Avatar sits at centre of bar/stats boundary
  avatarWrap: {
    position: "absolute",
    top: STICKY_H - (AVATAR_SIZE / 2),
    left: SW / 2 - AVATAR_SIZE / 2,
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center", justifyContent: "center",
    zIndex: 102,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 10, elevation: 10,
  },
  avatarImg: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3.5, borderColor: "#fff",
    overflow: "hidden",
    backgroundColor: "#444",
    alignItems: "center", justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute", bottom: 4, right: 4,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#1DA1F2",
    borderWidth: 2.5, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
    zIndex: 103,
  },

  // Stats row inside sticky — positioned below avatar hang zone
  stickyStatsWrap: {
    position: "absolute",
    top: STICKY_H + AVATAR_HANG,
    left: 0, right: 0,
    height: STATS_H,
    backgroundColor: "transparent",
  },

  // ── Cover ────────────────────────────────────────────────────────────────────
  cover:         { height: COVER_FULL, paddingTop: ST_BAR, justifyContent: "space-between", overflow: "hidden" },
  coverPhoto:    { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  coverTop:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 10 },
  coverTopRight: { flexDirection: "row", gap: 10 },
  coverBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(50,50,50,0.45)", alignItems: "center", justifyContent: "center" },
  addPhotoBtn:   { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 8, backgroundColor: "rgba(0,0,0,0.28)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" },
  addPhotoTxt:   { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.92)" },
  coverInfo:     { paddingHorizontal: 16, paddingBottom: 28 },
  coverName:     { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.4, marginBottom: 2 },
  coverUsername: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginBottom: 6 },
  coverMetaRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  coverMeta:     { fontSize: 12, color: "rgba(255,255,255,0.75)" },

  // ── White body ────────────────────────────────────────────────────────────────
  whiteBody: {
    backgroundColor: "#F2F2F7",
    marginTop: -28,
    paddingTop: Math.round(AVATAR_HANG) + 8,
    paddingBottom: 40,
    minHeight: 600,
  },

  // ── Stats row (shared between sticky & body) ────────────────────────────────
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 0,
    // backgroundColor is set inline: transparent for gradient, #fff for white body
  },
  statItem:   { flex: 1, alignItems: "center", paddingVertical: 18 },
  statNumRow: { flexDirection: "row", alignItems: "center" },
  statNum:    { fontSize: 22, fontWeight: "900", color: "#111" },
  statLabel:  { fontSize: 10, color: "#888", fontWeight: "600", marginTop: 4, textAlign: "center", lineHeight: 15 },
  statDivider:{ width: 1, height: 36, backgroundColor: "#EEE" },

  // Stats + verify combined card at top of white body
  statsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 14, marginTop: 4, marginBottom: 2,
    borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  verifyCardInner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  verifyIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center" },
  verifyTitle: { fontSize: 14, fontWeight: "800", color: "#111" },
  verifySub:   { fontSize: 12, color: "#888", marginTop: 2, lineHeight: 18 },

  // Section divider
  secDiv: { height: 10, backgroundColor: "#F2F2F7" },

  // Section card
  sec: {
    marginHorizontal: 14, marginVertical: 2,
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.055, shadowRadius: 8, elevation: 2,
  },
  secHead:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  secTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  secEdit:  { width: 30, height: 30, borderRadius: 15, backgroundColor: "#F5F5F7", alignItems: "center", justifyContent: "center" },
  bodyTxt:  { fontSize: 13, color: "#555", lineHeight: 22 },

  viewAllText: { fontSize: 14, fontWeight: "700", color: "#3ECFB2" },

  // Earning / Attendees card
  infoCard: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 14, marginVertical: 2,
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.055, shadowRadius: 8, elevation: 2,
  },
  infoCardRow: { fontSize: 13, color: "#666", lineHeight: 24, fontWeight: "500" },
  infoCardVal: { color: "#111", fontWeight: "700" },

  // Photos
  photoGrid:    { flexDirection: "row", gap: 4 },
  photoLg:      { flex: 1.15, borderRadius: 12, overflow: "hidden", backgroundColor: "#F2F2F7" },
  photoRightCol:{ flex: 1, gap: 4, justifyContent: "space-between" },
  photoRow:     { flexDirection: "row", gap: 4 },
  photoSm:      { borderRadius: 8, overflow: "hidden", backgroundColor: "#F2F2F7" },
  photoAdd:     { borderRadius: 8, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#E8175D", backgroundColor: "#FFF0F5", alignItems: "center", justifyContent: "center", gap: 2 },
  photoAddTxt:  { fontSize: 9, fontWeight: "700", color: "#E8175D" },
  photoEmpty:   { alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5F7", borderRadius: 8 },
  photoImg:     { width: "100%", height: "100%", resizeMode: "cover" },

  // Chips
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:      { flexDirection: "row", alignItems: "center", paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#F7F7F9", borderWidth: 1, borderColor: "#E8E8EC" },
  chipTxt:   { fontSize: 12, fontWeight: "600", color: "#333" },

  // Logout
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 14, marginTop: 12,
    paddingVertical: 15, borderRadius: 18,
    backgroundColor: "#FFF5F5", borderWidth: 1.5, borderColor: "#FFCDD2",
  },
  logoutTxt: { fontSize: 14, fontWeight: "800", color: "#C62828" },

  // Modals
  previewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" },
  previewClose:   { position: "absolute", top: 52, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  previewImg:     { width: "90%", height: "70%" },

  sheetOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
  sheet:          { backgroundColor: "#fff", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingBottom: 44, paddingTop: 14 },
  grabber:        { width: 44, height: 4, borderRadius: 999, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 20 },
  sheetTitle:     { fontSize: 17, fontWeight: "800", color: "#111", marginBottom: 16 },
  sheetRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  sheetIcon:      { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  sheetRowTxt:    { fontSize: 15, fontWeight: "700", color: "#111" },
  sheetCancel:    { marginTop: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center" },
  sheetCancelTxt: { fontSize: 14, fontWeight: "700", color: "#888" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.48)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard:    { backgroundColor: "#fff", borderRadius: 26, padding: 28, width: "100%", maxWidth: 340, alignItems: "center", elevation: 12 },
  modalIconBg:  { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  modalTitle:   { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 10 },
  modalSub:     { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 21, marginBottom: 26 },
  modalBtnRow:  { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn:     { flex: 1, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  modalBtnTxt:  { fontSize: 15, fontWeight: "800" },

  supportFloat: {
    position: "absolute",
    bottom: 90, // Moved up from 30
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3ECFB2", // Teal accent
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    zIndex: 9999,
  },
});


// ─────────────────────────────────────────────────────────────────────────────
//  MY EVENTS SECTION
// ─────────────────────────────────────────────────────────────────────────────

const EC = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  inputBorder: "#E8E0D5",
  ink:         "#1C1A17",
  ink2:        "#3D3A34",
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

type MyEventDoc = {
  _id: string; title: string; emoji?: string;
  kind: "free" | "paid" | "service";
  priceCents?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  date?: string;
  time?: string;
  status?: string;
  attendance?: number | null; attendees?: any[];
  location?: { city?: string; admin1Code?: string; countryCode?: string };
  _role?: "created" | "attended";
};
type MyEventsTab = "created" | "going" | "past";

function evStartMs(ev: MyEventDoc): number {
  if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
  const d = (ev.date ?? "").trim(), ti = (ev.time ?? "").trim();
  if (d && ti) { const t = new Date(`${d}T${ti}:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  if (d) { const t = new Date(`${d}T12:00:00Z`).getTime(); if (Number.isFinite(t)) return t; }
  return Number.POSITIVE_INFINITY;
}

function evEndMs(ev: MyEventDoc): number {
  if (ev.endsAt) { const t = new Date(ev.endsAt).getTime(); if (Number.isFinite(t)) return t; }
  // Fallback: 3 hours after start if no end time
  const start = evStartMs(ev);
  if (Number.isFinite(start)) return start + (3 * 60 * 60 * 1000);
  return Number.POSITIVE_INFINITY;
}

function evState(ev: MyEventDoc): "upcoming" | "ongoing" | "past" {
  const s = String(ev.status || "active").toLowerCase();
  if (s === "ended" || s === "completed") return "past";
  
  const start = evStartMs(ev);
  const end   = evEndMs(ev);
  const now   = Date.now();

  if (now > end && end !== Number.POSITIVE_INFINITY) return "past";
  if (now >= start && now <= end) return "ongoing";
  if (now < start) return "upcoming";

  return "upcoming";
}
function evWhen(ev: MyEventDoc) {
  const ms = evStartMs(ev);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "No time set";
  return new Date(ms).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function evWhere(ev: MyEventDoc) {
  const city = ev.location?.city?.trim();
  const cc   = ev.location?.countryCode?.trim();
  if (!city && !cc) return "Location not set";
  return `${city ?? ""}${cc ? ` · ${cc}` : ""}`.trim();
}
function evPrice(ev: MyEventDoc) {
  if (ev.kind === "free") return "FREE";
  return `₹${((ev.priceCents ?? 0) / 100).toFixed(0)}`;
}
function safeParseJson(txt: string) { try { return JSON.parse(txt); } catch { return null; } }

function MyEventsSection({ userId, router }: { userId?: string | null; router: any }) {
  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [activeTab, setActiveTab]   = useState<MyEventsTab>("created");
  const [allCreated, setAllCreated] = useState<MyEventDoc[]>([]);
  const [allGoing,   setAllGoing]   = useState<MyEventDoc[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState<string | null>(null);
  const [summaryEvent, setSummaryEvent] = useState<MyEventDoc | null>(null);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
  }), [EVENT_API_KEY]);

  const tabsWidth  = useRef(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabIdx     = activeTab === "created" ? 0 : activeTab === "going" ? 1 : 2;

  useEffect(() => {
    if (!tabsWidth.current) return;
    Animated.spring(indicatorX, {
      toValue: tabIdx * (tabsWidth.current / 3),
      useNativeDriver: true, speed: 18, bounciness: 7,
    }).start();
  }, [tabIdx]);

  const load = useCallback(async () => {
    if (!API_BASE || !userId) return;
    setErr(null); setLoading(true);
    try {
      const [cRes, gRes] = await Promise.all([
        apiFetch(
          `${API_BASE}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId)}&limit=200`,
          { method: "GET", headers }
        ),
        apiFetch(
          `${API_BASE}/api/bookings/going?clerkUserId=${encodeURIComponent(userId)}`,
          { method: "GET", headers }
        ),
      ]);
      const cJson = safeParseJson(await cRes.text());
      const gJson = safeParseJson(await gRes.text());
      setAllCreated(Array.isArray(cJson?.createdEvents) ? cJson.createdEvents : []);
      setAllGoing(Array.isArray(gJson?.events) ? gJson.events : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, userId, headers]);

  useEffect(() => { load(); }, [load]);

  const createdList = useMemo(() =>
    allCreated
      .filter(e => ["upcoming", "ongoing"].includes(evState(e)))
      .sort((a, b) => evStartMs(a) - evStartMs(b)),
    [allCreated]
  );

  const goingList = useMemo(() =>
    allGoing
      .filter(e => evState(e) !== "past")
      .sort((a, b) => evStartMs(a) - evStartMs(b)),
    [allGoing]
  );

  const pastList = useMemo(() => {
    const pastC = allCreated
      .filter(e => evState(e) === "past")
      .map(e => ({ ...e, _role: "created" as const }));
    const pastG = allGoing
      .filter(e => evState(e) === "past")
      .map(e => ({ ...e, _role: "attended" as const }));
    const seen = new Set<string>();
    return [...pastC, ...pastG]
      .filter(e => { if (seen.has(e._id)) return false; seen.add(e._id); return true; })
      .sort((a, b) => evStartMs(b) - evStartMs(a));
  }, [allCreated, allGoing]);

  const currentList = activeTab === "created" ? createdList : activeTab === "going" ? goingList : pastList;

  const [showAll, setShowAll] = useState(false);

  const handleTabChange = (t: MyEventsTab) => {
    setActiveTab(t);
    setShowAll(false);
  };

  const displayList = showAll ? currentList : currentList.slice(0, 2);
  const hasMore     = currentList.length > 2 && !showAll;

  const onPressEvent = (ev: MyEventDoc) => {
    if (evState(ev) === "past" && ev._role === "created") {
      setSummaryEvent(ev);
    } else {
      router.push({
        pathname: "/event-interest/[eventId]",
        params: { eventId: ev._id, kind: ev.kind, title: ev.title, emoji: ev.emoji || "📍" },
      });
    }
  };

  return (
    <View>
      {/* Section header */}
      <View style={ME.secHead}>
        <View style={ME.secTitleRow}>
          <View style={ME.secIcon}>
            <Ionicons name="calendar" size={18} color={EC.teal} />
          </View>
          <Text style={ME.secTitle}>My Events</Text>
          {showAll && (
            <TouchableOpacity
              onPress={() => setShowAll(false)}
              style={ME.backBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={14} color={EC.tealText} />
              <Text style={ME.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab bar */}
      <View
        style={ME.tabsWrap}
        onLayout={e => { tabsWidth.current = e.nativeEvent.layout.width; }}
      >
        {tabsWidth.current > 0 && (
          <Animated.View
            style={[
              ME.tabIndicator,
              { width: tabsWidth.current / 3, transform: [{ translateX: indicatorX }] },
            ]}
          />
        )}
        {(["created", "going", "past"] as MyEventsTab[]).map((t, i) => {
          const count =
            t === "created" ? createdList.length :
            t === "going"   ? goingList.length   :
            pastList.length;
          const labels = ["Created", "Going", "Past"];
          const active = activeTab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => handleTabChange(t)}
              style={ME.tabBtn}
              activeOpacity={0.8}
            >
              <Text style={[ME.tabText, active && ME.tabTextActive]}>{labels[i]}</Text>
              {count > 0 && (
                <View style={[ME.tabPill, active && ME.tabPillActive]}>
                  <Text style={[ME.tabPillText, active && ME.tabPillTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <View style={ME.listWrap}>
        {loading ? (
          <View style={ME.center}>
            <ActivityIndicator color={EC.teal} />
            <Text style={ME.loadingTxt}>Loading…</Text>
          </View>
        ) : err ? (
          <View style={ME.center}>
            <Text style={ME.errTxt}>{err}</Text>
            <TouchableOpacity onPress={load} style={ME.retryBtn}>
              <Text style={ME.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : currentList.length === 0 ? (
          <View style={ME.emptyBox}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>
              {activeTab === "created" ? "🗓️" : activeTab === "going" ? "🎟️" : "📦"}
            </Text>
            <Text style={ME.emptyTitle}>
              {activeTab === "created"
                ? "No upcoming events"
                : activeTab === "going"
                ? "Not going to any events"
                : "No past events"}
            </Text>
            <Text style={ME.emptySub}>
              {activeTab === "created"
                ? "Tap + to create your first event."
                : activeTab === "going"
                ? "Explore the map to find events."
                : "Events will appear here after they end."}
            </Text>
          </View>
        ) : (
          <>
            {displayList.map((ev, idx) => (
              <MyEventCard
                key={ev._id}
                ev={ev}
                idx={idx}
                onPress={() => onPressEvent(ev)}
                tab={activeTab}
              />
            ))}

            {hasMore && (
              <TouchableOpacity
                onPress={() => setShowAll(true)}
                style={ME.viewAllBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="grid-outline" size={15} color={EC.tealText} />
                <Text style={ME.viewAllText}>View All {currentList.length} Events</Text>
                <Ionicons name="chevron-forward" size={14} color={EC.tealText} />
              </TouchableOpacity>
            )}

            {showAll && currentList.length > 2 && (
              <TouchableOpacity
                onPress={() => setShowAll(false)}
                style={ME.collapseBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="chevron-up" size={15} color={EC.muted} />
                <Text style={ME.collapseText}>Show Less</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <HistorySummaryModal
        visible={!!summaryEvent}
        onClose={() => setSummaryEvent(null)}
        event={summaryEvent as any}
      />
    </View>
  );
}

function MyEventCard({
  ev, idx, onPress, tab,
}: { ev: MyEventDoc; idx: number; onPress: () => void; tab: MyEventsTab }) {
  const fadeA  = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 1, duration: 220, delay: Math.min(idx * 35, 150), useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 220, delay: Math.min(idx * 35, 150), useNativeDriver: true }),
    ]).start();
  }, []);

  const isPast = tab === "past";
  const kindCfg =
    ev.kind === "service" ? { accent: EC.purple, accentBg: EC.purpleBg, accentText: EC.purpleText, label: "Service" } :
    ev.kind === "paid"    ? { accent: EC.amber,  accentBg: EC.amberBg,  accentText: EC.amberText,  label: "Paid"    } :
                            { accent: EC.teal,   accentBg: EC.tealBg,   accentText: EC.tealText,   label: "Free"    };

  const roleBadge =
    ev._role === "created"  ? { bg: EC.amberBg, border: EC.amber + "55", text: EC.amberText, label: "⭐ Created"  } :
    ev._role === "attended" ? { bg: EC.blueBg,  border: EC.blue  + "55", text: EC.blueText,  label: "🎟 Attended" } :
    null;

  const attendeeCount = Array.isArray(ev.attendees) ? ev.attendees.length : 0;

  return (
    <Animated.View style={{ opacity: fadeA, transform: [{ translateY: slideY }], marginBottom: 10 }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[ME.card, isPast && { opacity: 0.85 }]}
      >
        <View style={[ME.cardStrip, { backgroundColor: kindCfg.accent }]} />
        <View style={ME.cardBody}>
          <View style={ME.cardTop}>
            <View style={[ME.cardIconBox, { backgroundColor: kindCfg.accentBg }]}>
              <Text style={{ fontSize: 20 }}>
                {ev.emoji || (ev.kind === "service" ? "🛠️" : ev.kind === "paid" ? "🎟" : "🎉")}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={ME.cardTitle} numberOfLines={1}>{ev.title}</Text>
              <View style={ME.badgeRow}>
                <View style={[ME.badge, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
                  <Text style={[ME.badgeText, { color: kindCfg.accentText }]}>{kindCfg.label}</Text>
                </View>
                {isPast && (
                  <View style={[ME.badge, { backgroundColor: EC.inputBg, borderColor: EC.inputBorder }]}>
                    <Text style={[ME.badgeText, { color: EC.muted }]}>✓ Ended</Text>
                  </View>
                )}
                {roleBadge && (
                  <View style={[ME.badge, { backgroundColor: roleBadge.bg, borderColor: roleBadge.border }]}>
                    <Text style={[ME.badgeText, { color: roleBadge.text }]}>{roleBadge.label}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={[ME.pricePill, { backgroundColor: kindCfg.accentBg, borderColor: kindCfg.accent + "55" }]}>
              <Text style={[ME.priceText, { color: kindCfg.accentText }]}>{evPrice(ev)}</Text>
            </View>
          </View>
          <View style={ME.metaRow}>
            <View style={ME.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={EC.hint} style={{ marginRight: 4 }} />
              <Text style={ME.metaText} numberOfLines={1}>{evWhen(ev)}</Text>
            </View>
            <View style={ME.metaItem}>
              <Ionicons name="location-outline" size={12} color={EC.hint} style={{ marginRight: 4 }} />
              <Text style={ME.metaText} numberOfLines={1}>{evWhere(ev)}</Text>
            </View>
            {attendeeCount > 0 && (
              <View style={ME.metaItem}>
                <Ionicons name="people-outline" size={12} color={EC.hint} style={{ marginRight: 4 }} />
                <Text style={ME.metaText}>{attendeeCount} joined</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={EC.hint} style={{ marginRight: 4 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const ME = StyleSheet.create({
  secHead:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  secTitleRow:{ flexDirection: "row", alignItems: "center", gap: 10 },
  secIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: EC.tealBg, borderWidth: 1.5, borderColor: EC.teal + "44",
    alignItems: "center", justifyContent: "center",
  },
  secTitle: { fontSize: 16, fontWeight: "800", color: "#111" },

  tabsWrap: {
    flexDirection: "row",
    marginHorizontal: 16, marginBottom: 14,
    borderRadius: 999, padding: 4,
    backgroundColor: "#F5F0FF",
    borderWidth: 1.5, borderColor: EC.cardBorder,
    overflow: "hidden", position: "relative",
  },
  tabIndicator: {
    position: "absolute", left: 4, top: 4, bottom: 4,
    borderRadius: 999, backgroundColor: EC.teal,
    shadowColor: EC.teal, shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  tabBtn:            { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 999 },
  tabText:           { fontSize: 13, fontWeight: "800", color: EC.muted },
  tabTextActive:     { color: "#fff" },
  tabPill:           { backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  tabPillActive:     { backgroundColor: "rgba(255,255,255,0.28)" },
  tabPillText:       { fontSize: 10, fontWeight: "900", color: EC.muted },
  tabPillTextActive: { color: "#fff" },

  listWrap: { paddingHorizontal: 16, paddingBottom: 8 },

  center:     { alignItems: "center", paddingVertical: 32 },
  loadingTxt: { color: EC.muted, fontSize: 13, fontWeight: "600", marginTop: 8 },
  errTxt:     { color: EC.coralText, fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: 10 },
  retryBtn:   { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 999, backgroundColor: EC.teal },
  retryTxt:   { color: "#fff", fontWeight: "800", fontSize: 13 },
  emptyBox:   { alignItems: "center", paddingVertical: 28 },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: EC.ink, marginBottom: 4 },
  emptySub:   { fontSize: 12, color: EC.muted, fontWeight: "600", textAlign: "center", paddingHorizontal: 20 },

  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: EC.card,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: EC.cardBorder,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 5, elevation: 1,
  },
  cardStrip:  { width: 4, alignSelf: "stretch" },
  cardBody:   { flex: 1, padding: 14 },
  cardTop:    { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  cardIconBox:{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardTitle:  { fontSize: 14, fontWeight: "800", color: EC.ink, marginBottom: 5, letterSpacing: -0.2 },
  badgeRow:   { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  badge:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, borderWidth: 1.5 },
  badgeText:  { fontSize: 10, fontWeight: "800" },
  pricePill:  { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1.5, flexShrink: 0 },
  priceText:  { fontSize: 11, fontWeight: "900" },

  metaRow:  { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 11, color: EC.muted, fontWeight: "600" },

  viewAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 6, marginBottom: 4,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: EC.tealBg, borderWidth: 1.5, borderColor: EC.teal + "55",
  },
  viewAllText: { fontSize: 13, fontWeight: "800", color: EC.tealText },

  collapseBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 6, marginBottom: 4,
    paddingVertical: 11, borderRadius: 12,
    backgroundColor: EC.inputBg, borderWidth: 1.5, borderColor: EC.inputBorder,
  },
  collapseText: { fontSize: 13, fontWeight: "700", color: EC.muted },

  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginLeft: "auto" as any,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, backgroundColor: EC.tealBg,
    borderWidth: 1, borderColor: EC.teal + "44",
  },
  backBtnText: { fontSize: 12, fontWeight: "700", color: EC.tealText },
});