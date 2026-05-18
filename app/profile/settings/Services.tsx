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
const MAX_SERVICES = 20;

const SERVICE_SUGGESTIONS = [
    "Yoga Classes", "Meditation Session", "Workshops", "Photowalk",
    "Photography Services", "Art Classes", "Fitness Training", "Personal Coaching",
    "Guitar Lessons", "Tour Guide", "Dance Classes", "Web Development",
    "Graphic Design", "Content Creation", "Event Planning"
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

export default function Services() {
    const router = useRouter();
    const { userId } = useAuth();
    
    const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
    const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
    
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [services, setServices] = useState<string[]>([]);
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
            const next = Array.isArray(j?.services) ? j.services : [];
            setServices(next.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
        } catch (e: any) { setErr(e?.message || "Failed to load services."); }
        finally { setLoading(false); }
    }, [EVENT_API_KEY, baseUrl, userId]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const filteredSuggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (q ? SERVICE_SUGGESTIONS.filter(x => x.toLowerCase().includes(q)) : SERVICE_SUGGESTIONS).slice(0, 30);
    }, [query]);

    const toggle = useCallback((value: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const v = value.trim(); if (!v) return;
        setServices(prev => {
            const has = prev.includes(v);
            if (has) return prev.filter(x => x !== v);
            if (prev.length >= MAX_SERVICES) return prev;
            return [...prev, v];
        });
        setQuery("");
    }, []);

    const save = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (!baseUrl || !userId) return;
        setSaving(true); setErr(null);
        try {
            const res = await apiFetch(`${baseUrl}/api/profile`, { 
                method: "PATCH", 
                headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) }, 
                body: JSON.stringify({ clerkUserId: userId, services }) 
            });
            if (!res.ok) throw new Error(`Failed to save services (${res.status})`);
            router.back();
        } catch (e: any) { setErr(e?.message || "Failed to save services."); }
        finally { setSaving(false); }
    }, [EVENT_API_KEY, baseUrl, services, router, userId]);

    const isCustomAvailable = query.trim().length > 0 && !filteredSuggestions.includes(query.trim()) && !services.includes(query.trim());

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
                    <Text style={S.title}>Services Provided</Text>
                    <Text style={S.subtitle}>Choose or type the professional services you provide to let other nomads know your expertise.</Text>
                </View>

                <View style={S.searchBox}>
                    <Ionicons name="search-outline" size={18} color={COLORS.lightMuted} />
                    <TextInput 
                        value={query} onChangeText={setQuery} 
                        placeholder="Search or add custom service..." 
                        placeholderTextColor={COLORS.lightMuted} 
                        style={S.searchInput} 
                    />
                    {isCustomAvailable && (
                        <TouchableOpacity onPress={() => toggle(query)} style={S.addCustomBtn}>
                            <Text style={S.addCustomText}>Add</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Selected Services Preview */}
                {services.length > 0 && (
                    <View style={S.selectedContainer}>
                        <Text style={S.sectionHeading}>Selected Services ({services.length}/{MAX_SERVICES})</Text>
                        <View style={S.selectedChipsWrap}>
                            {services.map(item => (
                                <TouchableOpacity key={item} onPress={() => toggle(item)} style={S.selectedChip}>
                                    <Text style={S.selectedChipTxt}>{item}</Text>
                                    <Ionicons name="close-circle" size={16} color={COLORS.purple} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {loading ? (
                    <View style={S.center}><ActivityIndicator color={COLORS.purple} /></View>
                ) : (
                    <View style={S.gridSection}>
                        <Text style={S.sectionHeading}>Suggestions</Text>
                        <View style={S.grid}>
                            {filteredSuggestions.map(label => {
                                const on = services.includes(label);
                                return (
                                    <TouchableOpacity 
                                        key={label} onPress={() => toggle(label)}
                                        style={[S.langBtn, on && S.langBtnOn]}
                                    >
                                        <Text style={[S.langLabel, on && S.langLabelOn]} numberOfLines={1}>{label}</Text>
                                        <Ionicons 
                                            name={on ? "checkmark-circle" : "add"} 
                                            size={20} 
                                            color={on ? "#fff" : COLORS.lightMuted} 
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
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
                        <>
                            <Text style={S.saveText}>Save Services</Text>
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
    addCustomBtn: {
        backgroundColor: COLORS.purpleBg, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12
    },
    addCustomText: {
        color: COLORS.purple, fontFamily: COLORS.fontBold, fontSize: 14
    },
    selectedContainer: {
        marginBottom: 24
    },
    sectionHeading: {
        fontSize: 16, fontFamily: COLORS.fontBold, color: COLORS.text, marginBottom: 12
    },
    selectedChipsWrap: {
        flexDirection: "row", flexWrap: "wrap", gap: 10
    },
    selectedChip: {
        flexDirection: "row", alignItems: "center", gap: 6,
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12,
        backgroundColor: COLORS.purpleBg, borderWidth: 1, borderColor: COLORS.purple + "40"
    },
    selectedChipTxt: {
        fontSize: 14, fontFamily: COLORS.fontBold, color: COLORS.purple
    },
    gridSection: {
        marginTop: 8
    },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
    langBtn: {
        width: (W - 48 - 12) / 2, height: 56, borderRadius: 16,
        backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16,
        shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
    },
    langBtnOn: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
    langLabel: { fontSize: 14, fontFamily: COLORS.fontBold, color: COLORS.text, flex: 1, marginRight: 4 },
    langLabelOn: { color: "#fff" },
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
