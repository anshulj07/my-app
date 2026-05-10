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

// const MAX_LANGUAGES = 20;

// const LANGUAGE_SUGGESTIONS = [
//   "English",
//   "Hindi",
//   "Punjabi",
//   "Urdu",
//   "Bengali",
//   "Marathi",
//   "Gujarati",
//   "Tamil",
//   "Telugu",
//   "Kannada",
//   "Malayalam",
// ];

// export default function Languages() {
//   const router = useRouter();
//   const { userId } = useAuth();

//   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState<string | null>(null);
//   const [saving, setSaving] = useState(false);

//   const [languages, setLanguages] = useState<string[]>([]);
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
//       const next = Array.isArray(j?.languages) ? j.languages : [];
//       setLanguages(next.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
//     } catch (e: any) {
//       setErr(e?.message || "Failed to load languages.");
//     } finally {
//       setLoading(false);
//     }
//   }, [EVENT_API_KEY, baseUrl, userId]);

//   useEffect(() => {
//     loadProfile();
//   }, [loadProfile]);

//   const filteredSuggestions = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     const base = LANGUAGE_SUGGESTIONS;
//     const list = q ? base.filter((x) => x.toLowerCase().includes(q)) : base;
//     return list.slice(0, 30);
//   }, [query]);

//   const toggle = useCallback((value: string) => {
//     const v = value.trim();
//     if (!v) return;
//     setLanguages((prev) => {
//       const has = prev.includes(v);
//       if (has) return prev.filter((x) => x !== v);
//       if (prev.length >= MAX_LANGUAGES) return prev;
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
//         body: JSON.stringify({ clerkUserId: userId, languages }),
//       });

//       if (!res.ok) {
//         const t = await res.text().catch(() => "");
//         throw new Error(t || `Failed to save languages (${res.status})`);
//       }

//       router.back();
//     } catch (e: any) {
//       setErr(e?.message || "Failed to save languages.");
//     } finally {
//       setSaving(false);
//     }
//   }, [EVENT_API_KEY, baseUrl, languages, router, userId]);

//   return (
//     <View style={styles.page}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
//           <Ionicons name="chevron-back" size={22} color="#111" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Languages</Text>
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
//               {languages.length}/{MAX_LANGUAGES}
//             </Text>
//           </View>

//           <TextInput
//             value={query}
//             onChangeText={setQuery}
//             placeholder="Search languages..."
//             placeholderTextColor="#9CA3AF"
//             style={styles.search}
//             autoCorrect={false}
//             autoCapitalize="none"
//           />

//           <View style={styles.chipsWrap}>
//             {filteredSuggestions.map((label) => {
//               const on = languages.includes(label);
//               const disabled = !on && languages.length >= MAX_LANGUAGES;
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
    ScrollView, ActivityIndicator, Platform, Dimensions, SafeAreaView 
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { apiFetch } from "../../../lib/apiFetch";
import * as Haptics from "expo-haptics";

const { width: W } = Dimensions.get("window");
const MAX_LANGUAGES = 20;

const LANGUAGE_SUGGESTIONS = [
    "English", "Hindi", "Punjabi", "Urdu", "Bengali", 
    "Marathi", "Gujarati", "Tamil", "Telugu", "Kannada", "Malayalam"
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

export default function Languages() {
    const router = useRouter();
    const { userId } = useAuth();
    
    const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
    const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
    
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [languages, setLanguages] = useState<string[]>([]);
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
            const next = Array.isArray(j?.languages) ? j.languages : [];
            setLanguages(next.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
        } catch (e: any) { setErr(e?.message || "Failed to load languages."); }
        finally { setLoading(false); }
    }, [EVENT_API_KEY, baseUrl, userId]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const filteredSuggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (q ? LANGUAGE_SUGGESTIONS.filter(x => x.toLowerCase().includes(q)) : LANGUAGE_SUGGESTIONS).slice(0, 30);
    }, [query]);

    const toggle = useCallback((value: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const v = value.trim(); if (!v) return;
        setLanguages(prev => {
            const has = prev.includes(v);
            if (has) return prev.filter(x => x !== v);
            if (prev.length >= MAX_LANGUAGES) return prev;
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
                body: JSON.stringify({ clerkUserId: userId, languages }) 
            });
            if (!res.ok) throw new Error(`Failed to save languages (${res.status})`);
            router.back();
        } catch (e: any) { setErr(e?.message || "Failed to save languages."); }
        finally { setSaving(false); }
    }, [EVENT_API_KEY, baseUrl, languages, router, userId]);

    return (
        <SafeAreaView style={S.safe}>
            <View style={S.header}>
                <TouchableOpacity onPress={() => router.back()} style={S.headerBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.purple} />
                </TouchableOpacity>
                <Text style={S.headerTitle}>NomadMeet</Text>
                <TouchableOpacity style={S.headerBtn}>
                    <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={S.content} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={S.titleSection}>
                    <Text style={S.title}>Languages</Text>
                    <Text style={S.subtitle}>Select the languages you speak to connect with fellow nomads around the world.</Text>
                </View>

                <View style={S.searchBox}>
                    <Ionicons name="search-outline" size={18} color={COLORS.lightMuted} />
                    <TextInput 
                        value={query} onChangeText={setQuery} 
                        placeholder="Search languages..." 
                        placeholderTextColor={COLORS.lightMuted} 
                        style={S.searchInput} 
                    />
                </View>

                {loading ? (
                    <View style={S.center}><ActivityIndicator color={COLORS.purple} /></View>
                ) : (
                    <View style={S.grid}>
                        {filteredSuggestions.map(label => {
                            const on = languages.includes(label);
                            return (
                                <TouchableOpacity 
                                    key={label} onPress={() => toggle(label)}
                                    style={[S.langBtn, on && S.langBtnOn]}
                                >
                                    <Text style={[S.langLabel, on && S.langLabelOn]}>{label}</Text>
                                    <Ionicons 
                                        name={on ? "checkmark-circle" : "add"} 
                                        size={20} 
                                        color={on ? "#fff" : COLORS.lightMuted} 
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View style={S.requestCard}>
                    <View style={S.requestContent}>
                        <Text style={S.requestTitle}>Can't find yours?</Text>
                        <Text style={S.requestSub}>Keep exploring our global network of nomad-friendly cultures.</Text>
                        <TouchableOpacity style={S.requestLink}>
                            <Text style={S.requestLinkText}>Request Language</Text>
                            <Ionicons name="arrow-forward" size={16} color={COLORS.purple} />
                        </TouchableOpacity>
                    </View>
                    <View style={S.globeIconBox}>
                        <Ionicons name="globe-outline" size={64} color={COLORS.border} />
                    </View>
                </View>
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
                        <>
                            <Text style={S.saveText}>Save Languages</Text>
                            <Ionicons name="sparkles-outline" size={18} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
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
    headerTitle: { fontSize: 18, fontFamily: COLORS.fontExtraBold, color: COLORS.purple },
    content: { padding: 24, paddingBottom: 100 },
    titleSection: { marginBottom: 24 },
    title: { fontSize: 32, fontFamily: COLORS.fontExtraBold, color: COLORS.text, marginBottom: 8 },
    subtitle: { fontSize: 15, fontFamily: COLORS.font, color: COLORS.muted, lineHeight: 22 },
    searchBox: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: COLORS.bg, borderRadius: 16, paddingHorizontal: 16, height: 52, marginBottom: 24,
    },
    searchInput: { flex: 1, fontSize: 16, fontFamily: COLORS.font, color: COLORS.text },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
    langBtn: {
        width: (W - 48 - 12) / 2, height: 56, borderRadius: 16,
        backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16,
        shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
    },
    langBtnOn: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
    langLabel: { fontSize: 15, fontFamily: COLORS.fontBold, color: COLORS.text },
    langLabelOn: { color: "#fff" },
    requestCard: {
        backgroundColor: COLORS.purpleBg, borderRadius: 24, padding: 20,
        flexDirection: "row", alignItems: "center", marginTop: 32, overflow: "hidden",
    },
    requestContent: { flex: 1, zIndex: 1 },
    requestTitle: { fontSize: 18, fontFamily: COLORS.fontExtraBold, color: COLORS.purple, marginBottom: 6 },
    requestSub: { fontSize: 13, fontFamily: COLORS.font, color: COLORS.muted, marginBottom: 14, lineHeight: 18 },
    requestLink: { flexDirection: "row", alignItems: "center", gap: 4 },
    requestLinkText: { fontSize: 14, fontFamily: COLORS.fontBold, color: COLORS.purple },
    globeIconBox: { position: "absolute", right: -10, bottom: -10, opacity: 0.5 },
    footer: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: 24, backgroundColor: "rgba(255,255,255,0.9)",
    },
    saveBtn: {
        height: 56, borderRadius: 28, backgroundColor: COLORS.purple,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
        shadowColor: COLORS.purple, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
    },
    saveText: { color: "#fff", fontSize: 16, fontFamily: COLORS.fontExtraBold },
    center: { paddingVertical: 40, alignItems: "center" },
});
