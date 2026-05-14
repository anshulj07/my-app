// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   ScrollView,
//   ActivityIndicator,
//   Platform,
// } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { useRouter } from "expo-router";
// import { useAuth } from "@clerk/clerk-expo";
// import Constants from "expo-constants";
// import { apiFetch } from "../../../lib/apiFetch";

// const MAX_INTERESTS = 20;

// const INTEREST_SUGGESTIONS = [
//   "Gym",
//   "Coffee",
//   "Cooking",
//   "Foodie",
//   "Nightlife",
//   "Self care",
//   "Hiking",
//   "Camping",
//   "Road trips",
//   "Beaches",
//   "Cycling",
//   "Nature",
//   "Photography",
//   "Music",
//   "Dancing",
//   "Art",
//   "Writing",
//   "Design",
//   "Movies",
//   "TV shows",
//   "Anime",
//   "Gaming",
//   "Standup",
//   "Karaoke",
//   "AI",
//   "Startups",
//   "Coding",
//   "Product",
//   "Hackathons",
//   "Gadgets",
// ];

// export default function Interests() {
//   const router = useRouter();
//   const { userId } = useAuth();

//   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);
//   const [saving, setSaving] = useState(false);

//   const [interests, setInterests] = useState<string[]>([]);
//   const [query, setQuery] = useState("");

//   const baseUrl = useMemo(() => (API_BASE ? API_BASE.replace(/\/$/, "") : ""), [API_BASE]);

//   const loadProfile = useCallback(async () => {
//     if (!baseUrl || !userId) return;

//     setLoading(true);
//     setErr(null);
//     try {
//       const res = await apiFetch(`${baseUrl}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, {
//         method: "GET",
//         headers: {
//           ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//         },
//       });

//       if (!res.ok) {
//         const t = await res.text().catch(() => "");
//         throw new Error(t || `Failed to load profile (${res.status})`);
//       }

//       const j = await res.json().catch(() => ({} as any));
//       const next = Array.isArray(j?.interests) ? j.interests : [];
//       setInterests(next.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
//     } catch (e: any) {
//       setErr(e?.message || "Failed to load interests.");
//     } finally {
//       setLoading(false);
//     }
//   }, [EVENT_API_KEY, baseUrl, userId]);

//   useEffect(() => {
//     loadProfile();
//   }, [loadProfile]);

//   const filteredSuggestions = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     const base = INTEREST_SUGGESTIONS;
//     const list = q ? base.filter((x) => x.toLowerCase().includes(q)) : base;
//     return list.slice(0, 30);
//   }, [query]);

//   const toggle = useCallback((value: string) => {
//     const v = value.trim();
//     if (!v) return;
//     setInterests((prev) => {
//       const has = prev.includes(v);
//       if (has) return prev.filter((x) => x !== v);
//       if (prev.length >= MAX_INTERESTS) return prev;
//       return [...prev, v];
//     });
//   }, []);

//   const save = useCallback(async () => {
//     if (!baseUrl || !userId) return;

//     setSaving(true);
//     setErr(null);
//     try {
//       const res = await apiFetch(`${baseUrl}/api/profile`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//         },
//         body: JSON.stringify({ clerkUserId: userId, interests }),
//       });

//       if (!res.ok) {
//         const t = await res.text().catch(() => "");
//         throw new Error(t || `Failed to save interests (${res.status})`);
//       }

//       router.back();
//     } catch (e: any) {
//       setErr(e?.message || "Failed to save interests.");
//     } finally {
//       setSaving(false);
//     }
//   }, [EVENT_API_KEY, baseUrl, interests, router, userId]);

//   return (
//     <View style={styles.page}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
//           <Ionicons name="chevron-back" size={22} color="#111" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Interests</Text>
//         <View style={{ width: 40 }} />
//       </View>

//       {!API_BASE ? (
//         <View style={styles.center}>
//           <Text style={styles.errText}>Config issue: extra.apiBaseUrl is missing.</Text>
//         </View>
//       ) : loading ? (
//         <View style={styles.center}>
//           <ActivityIndicator />
//         </View>
//       ) : (
//         <ScrollView
//           contentContainerStyle={styles.content}
//           keyboardShouldPersistTaps={Platform.OS === "web" ? "handled" : "always"}
//         >
//           {!!err && (
//             <View style={styles.errBox}>
//               <Text style={styles.errText}>{err}</Text>
//             </View>
//           )}

//           <View style={styles.sectionTop}>
//             <Text style={styles.sectionHint}>
//               {interests.length}/{MAX_INTERESTS}
//             </Text>
//           </View>

//           <TextInput
//             value={query}
//             onChangeText={setQuery}
//             placeholder="Search interests..."
//             placeholderTextColor="#9CA3AF"
//             style={styles.search}
//             autoCorrect={false}
//             autoCapitalize="none"
//           />

//           <View style={styles.chipsWrap}>
//             {filteredSuggestions.map((label) => {
//               const on = interests.includes(label);
//               const disabled = !on && interests.length >= MAX_INTERESTS;
//               return (
//                 <TouchableOpacity
//                   key={label}
//                   onPress={() => toggle(label)}
//                   disabled={disabled}
//                   activeOpacity={0.9}
//                   style={[styles.chip, on && styles.chipOn, disabled && styles.chipDisabled]}
//                 >
//                   <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>

//           <TouchableOpacity
//             onPress={save}
//             disabled={saving}
//             activeOpacity={0.9}
//             style={[styles.saveBtn, saving && { opacity: 0.7 }]}
//           >
//             {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
//           </TouchableOpacity>
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: "#fff" },
//   header: {
//     height: 54,
//     paddingHorizontal: 14,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: "#E5E7EB",
//   },
//   backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
//   headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
//   content: { padding: 16, paddingBottom: 40 },
//   center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
//   sectionTop: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 10 },
//   sectionHint: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
//   search: {
//     height: 44,
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     color: "#111",
//   },
//   chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
//   chip: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 999,
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   chipOn: { backgroundColor: "#E11D48", borderColor: "#E11D48" },
//   chipDisabled: { opacity: 0.5 },
//   chipText: { color: "#111", fontWeight: "700" },
//   chipTextOn: { color: "#fff" },
//   saveBtn: {
//     marginTop: 14,
//     height: 48,
//     borderRadius: 14,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#111827",
//   },
//   saveText: { color: "#fff", fontSize: 15, fontWeight: "900" },
//   errBox: {
//     marginBottom: 12,
//     padding: 12,
//     borderRadius: 12,
//     backgroundColor: "#FEF2F2",
//     borderWidth: 1,
//     borderColor: "#FECACA",
//   },
//   errText: { color: "#991B1B", fontWeight: "700" },
// });
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { 
    View, Text, StyleSheet, TouchableOpacity, TextInput, 
    ScrollView, ActivityIndicator, Platform, Dimensions, ImageBackground, SafeAreaView 
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { apiFetch } from "../../../lib/apiFetch";
import * as Haptics from "expo-haptics";

const { width: W } = Dimensions.get("window");
const MAX_INTERESTS = 20;

const CATEGORIES = [
    {
        name: "Wellness",
        icon: "fitness-outline" as const,
        items: ["Gym", "Self care", "Yoga", "Meditation", "Skincare"]
    },
    {
        name: "Social & Lifestyle",
        icon: "cafe-outline" as const,
        items: ["Coffee", "Cooking", "Foodie", "Nightlife", "Mixology", "Wine Tasting"]
    },
    {
        name: "Adventure",
        icon: "compass-outline" as const,
        items: ["Hiking", "Camping", "Surfing", "Rock Climbing", "Digital Nomadism"]
    },
    {
        name: "Creative",
        icon: "brush-outline" as const,
        items: ["Photography", "Digital Art", "Writing", "Podcasting"]
    }
];

const COLORS = {
    purple: "#6366F1",
    purpleBg: "#EEF2FF",
    bg: "#F9FAFB",
    card: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
    lightMuted: "#9CA3AF",
    border: "#F3F4F6",
    font: "Outfit_500Medium",
    fontBold: "Outfit_700Bold",
    fontExtraBold: "Outfit_800ExtraBold",
};

export default function Interests() {
    const router = useRouter();
    const { userId } = useAuth();
    
    const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
    const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
    
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [interests, setInterests] = useState<string[]>([]);
    const [query, setQuery] = useState("");

    const baseUrl = useMemo(() => (API_BASE ? API_BASE.replace(/\/$/, "") : ""), [API_BASE]);

    const loadProfile = useCallback(async () => {
        if (!baseUrl || !userId) return;
        setLoading(true); setErr(null);
        try {
            const res = await apiFetch(`${baseUrl}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, { 
                method: "GET", 
                headers: { ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) } 
            });
            if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
            const j = await res.json().catch(() => ({} as any));
            const next = Array.isArray(j?.interests) ? j.interests : [];
            setInterests(next.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
        } catch (e: any) { setErr(e?.message || "Failed to load interests."); }
        finally { setLoading(false); }
    }, [EVENT_API_KEY, baseUrl, userId]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const toggle = useCallback((value: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const v = value.trim(); if (!v) return;
        setInterests(prev => {
            const has = prev.includes(v);
            if (has) return prev.filter(x => x !== v);
            if (prev.length >= MAX_INTERESTS) return prev;
            return [...prev, v];
        });
    }, []);

    const save = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (!baseUrl || !userId) return;
        setSaving(true); setErr(null);
        try {
            const res = await apiFetch(`${baseUrl}/api/profile`, { 
                method: "PATCH", 
                headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) }, 
                body: JSON.stringify({ clerkUserId: userId, interests }) 
            });
            if (!res.ok) throw new Error(`Failed to save interests (${res.status})`);
            router.back();
        } catch (e: any) { setErr(e?.message || "Failed to save interests."); }
        finally { setSaving(false); }
    }, [EVENT_API_KEY, baseUrl, interests, router, userId]);

    return (
        <SafeAreaView style={S.safe}>
            <View style={S.header}>
                <TouchableOpacity onPress={() => router.back()} style={S.headerBtn}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Your Interests</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView 
                contentContainerStyle={S.content} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={S.titleSection}>
                    <Text style={S.title}>What drives you?</Text>
                    <Text style={S.subtitle}>Select at least 5 interests to help us match you with the right tribe and experiences.</Text>
                </View>

                <View style={S.searchBox}>
                    <Ionicons name="search-outline" size={18} color={COLORS.lightMuted} />
                    <TextInput 
                        value={query} onChangeText={setQuery} 
                        placeholder="Search interests..." 
                        placeholderTextColor={COLORS.lightMuted} 
                        style={S.searchInput} 
                    />
                </View>

                {loading ? (
                    <View style={S.center}><ActivityIndicator color={COLORS.purple} /></View>
                ) : (
                    <>
                        {CATEGORIES.map(cat => {
                            const filteredItems = cat.items.filter(item => 
                                item.toLowerCase().includes(query.toLowerCase())
                            );
                            if (filteredItems.length === 0) return null;
                            
                            return (
                                <View key={cat.name} style={S.category}>
                                    <View style={S.categoryHeader}>
                                        <Ionicons name={cat.icon} size={18} color={COLORS.text} />
                                        <Text style={S.categoryName}>{cat.name}</Text>
                                    </View>
                                    <View style={S.chips}>
                                        {filteredItems.map(item => {
                                            const on = interests.includes(item);
                                            return (
                                                <TouchableOpacity 
                                                    key={item} onPress={() => toggle(item)}
                                                    style={[S.chip, on && S.chipOn]}
                                                >
                                                    {on && <Ionicons name="checkmark" size={12} color="#fff" />}
                                                    <Text style={[S.chipLabel, on && S.chipLabelOn]}>{item}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            <View style={S.footer}>
                <TouchableOpacity 
                    style={[S.saveBtn, saving && { opacity: 0.7 }]} 
                    onPress={save} 
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={S.saveText}>Save Interests</Text>
                    )}
                </TouchableOpacity>
                <Text style={S.countText}>{interests.length}/{MAX_INTERESTS} Interests Selected</Text>
            </View>
        </SafeAreaView>
    );
}

const S = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 0 : 10, height: 60,
    },
    headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 17, fontFamily: COLORS.fontExtraBold, color: COLORS.purple },
    content: { padding: 24, paddingBottom: 120 },
    titleSection: { marginBottom: 24 },
    title: { fontSize: 32, fontFamily: COLORS.fontExtraBold, color: COLORS.text, marginBottom: 8 },
    subtitle: { fontSize: 15, fontFamily: COLORS.font, color: COLORS.muted, lineHeight: 22 },
    searchBox: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: COLORS.bg, borderRadius: 16, paddingHorizontal: 16, height: 52, marginBottom: 30,
    },
    searchInput: { flex: 1, fontSize: 16, fontFamily: COLORS.font, color: COLORS.text },
    category: { marginBottom: 28 },
    categoryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    categoryName: { fontSize: 16, fontFamily: COLORS.fontExtraBold, color: COLORS.text },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: {
        paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20,
        backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border,
        flexDirection: "row", alignItems: "center", gap: 6,
    },
    chipOn: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
    chipLabel: { fontSize: 14, fontFamily: COLORS.fontBold, color: COLORS.text },
    chipLabelOn: { color: "#fff" },
    footer: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: 24, backgroundColor: "rgba(255,255,255,0.9)",
        alignItems: "center",
    },
    saveBtn: {
        width: "100%", height: 56, borderRadius: 28, backgroundColor: COLORS.purple,
        alignItems: "center", justifyContent: "center", marginBottom: 10,
        shadowColor: COLORS.purple, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
    },
    saveText: { color: "#fff", fontSize: 16, fontFamily: COLORS.fontExtraBold },
    countText: { fontSize: 12, fontFamily: COLORS.font, color: COLORS.muted },
    center: { paddingVertical: 40, alignItems: "center" },
});
