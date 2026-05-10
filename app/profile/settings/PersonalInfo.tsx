import React, { useEffect, useState } from "react";
import { 
    View, Text, TextInput, StyleSheet, TouchableOpacity, 
    Alert, ScrollView, SafeAreaView, Platform, KeyboardAvoidingView, 
    ActivityIndicator, Dimensions 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "../../../lib/apiFetch";
import * as Haptics from "expo-haptics";

const STORAGE_KEY = "user_profile";
const { width: W } = Dimensions.get("window");

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

export default function PersonalInfo() {
    const router = useRouter();
    const { userId } = useAuth();
    
    const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
    const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
    
    const [form, setForm] = useState({ name: "", email: "", phone: "", gender: "", city: "", country: "" });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) { try { setForm(f => ({ ...f, ...JSON.parse(stored) })); } catch {} }
            if (!API_BASE || !userId) { setLoading(false); return; }
            try {
                const res = await apiFetch(`${API_BASE.replace(/\/$/, "")}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, { 
                    method: "GET", 
                    headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {} 
                });
                if (res.ok) {
                    const src = await res.json().catch(() => ({}));
                    setForm({ 
                        name: src?.name || "", 
                        email: src?.email || "", 
                        phone: src?.phone || "", 
                        gender: src?.gender || "", 
                        city: src?.city || "", 
                        country: src?.country || "" 
                    });
                }
            } catch {}
            setLoading(false);
        })();
    }, [API_BASE, userId, EVENT_API_KEY]);

    const saveProfile = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (!API_BASE || !userId) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
            Alert.alert("Saved ✨", "Profile updated locally."); return;
        }
        setSaving(true);
        try {
            const parts = form.name.trim().split(/\s+/);
            const res = await apiFetch(`${API_BASE.replace(/\/$/, "")}/api/profile`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
                body: JSON.stringify({ 
                    clerkUserId: userId, 
                    firstName: parts[0] || "", 
                    lastName: parts.slice(1).join(" ") || "", 
                    phone: form.phone.trim() || undefined, 
                    gender: form.gender.trim() || undefined, 
                    city: form.city.trim() || undefined, 
                    country: form.country.trim() || undefined 
                }),
            });
            if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(t || `Failed (${res.status})`); }
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
            Alert.alert("Success ✨", "Your profile has been updated.");
        } catch (e: any) { Alert.alert("Error", e?.message || "Failed to save."); }
        finally { setSaving(false); }
    };

    const setField = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

    const FIELDS = [
        { key: "name", icon: "person-outline" as const, label: "Full Name", placeholder: "e.g. Anshul Sharma" },
        { key: "email", icon: "mail-outline" as const, label: "Email Address", placeholder: "anshul@example.com", keyboardType: "email-address" as const, autoCapitalize: "none" as const },
        { key: "phone", icon: "call-outline" as const, label: "Phone Number", placeholder: "+91 98765 43210", keyboardType: "phone-pad" as const },
        { key: "gender", icon: "people-outline" as const, label: "Gender", placeholder: "Male / Female / Other" },
    ];

    return (
        <SafeAreaView style={S.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View style={S.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.purple} />
                    </TouchableOpacity>
                    <Text style={S.headerTitle}>Personal Details</Text>
                    <View style={{ width: 42 }} />
                </View>

                <ScrollView 
                    style={S.container} 
                    contentContainerStyle={S.content} 
                    showsVerticalScrollIndicator={false}
                >
                    <View style={S.intro}>
                        <Text style={S.introH}>Edit Profile</Text>
                        <Text style={S.introS}>Update your details to help others find you more easily.</Text>
                    </View>

                    {loading ? (
                        <View style={S.center}><ActivityIndicator color={COLORS.purple} size="large" /></View>
                    ) : (
                        <View style={S.formArea}>
                            {FIELDS.map(f => (
                                <View key={f.key} style={S.block}>
                                    <View style={S.blockHeader}>
                                        <View style={S.iconCircle}>
                                            <Ionicons name={f.icon} size={13} color={COLORS.purple} />
                                        </View>
                                        <Text style={S.blockLabel}>{f.label}</Text>
                                    </View>
                                    <TextInput
                                        style={S.input} 
                                        value={(form as any)[f.key]} 
                                        onChangeText={v => setField(f.key, v)}
                                        placeholder={f.placeholder} 
                                        placeholderTextColor={COLORS.lightMuted}
                                        keyboardType={(f as any).keyboardType} 
                                        autoCapitalize={(f as any).autoCapitalize}
                                        selectionColor={COLORS.purple}
                                    />
                                </View>
                            ))}

                            <View style={S.rowLayout}>
                                <View style={[S.block, { flex: 1, marginRight: 6 }]}>
                                    <View style={S.blockHeader}>
                                        <View style={S.iconCircle}>
                                            <Ionicons name="location-outline" size={13} color={COLORS.purple} />
                                        </View>
                                        <Text style={S.blockLabel}>City</Text>
                                    </View>
                                    <TextInput 
                                        style={S.input} 
                                        value={form.city} 
                                        onChangeText={v => setField("city", v)} 
                                        placeholder="Indore" 
                                        placeholderTextColor={COLORS.lightMuted} 
                                        selectionColor={COLORS.purple} 
                                    />
                                </View>
                                <View style={[S.block, { flex: 1, marginLeft: 6 }]}>
                                    <View style={S.blockHeader}>
                                        <View style={S.iconCircle}>
                                            <Ionicons name="globe-outline" size={13} color={COLORS.purple} />
                                        </View>
                                        <Text style={S.blockLabel}>Country</Text>
                                    </View>
                                    <TextInput 
                                        style={S.input} 
                                        value={form.country} 
                                        onChangeText={v => setField("country", v)} 
                                        placeholder="India" 
                                        placeholderTextColor={COLORS.lightMuted} 
                                        selectionColor={COLORS.purple} 
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[S.saveBtn, (saving || loading) && { opacity: 0.7 }]}
                        onPress={saveProfile} 
                        disabled={saving || loading} 
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={S.saveTxt}>Save Information</Text>
                                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const S = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1 },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 10 : 20,
        paddingBottom: 10,
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 14,
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border,
    },
    headerTitle: { fontSize: 18, fontFamily: COLORS.fontExtraBold, color: COLORS.purple },
    content: { padding: 20, paddingBottom: 60 },
    intro: { marginBottom: 24, paddingLeft: 2 },
    introH: { fontSize: 32, fontFamily: COLORS.fontExtraBold, color: COLORS.text, letterSpacing: -0.5 },
    introS: { fontSize: 14, fontFamily: COLORS.font, color: COLORS.muted, marginTop: 4, lineHeight: 20 },
    formArea: { gap: 12 },
    rowLayout: { flexDirection: "row", alignItems: "flex-start" },
    block: { 
        backgroundColor: COLORS.card, borderRadius: 24, padding: 16, 
        borderWidth: 1, borderColor: COLORS.border,
        shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
    },
    blockHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    iconCircle: { width: 28, height: 28, borderRadius: 10, backgroundColor: COLORS.purpleBg, alignItems: "center", justifyContent: "center" },
    blockLabel: { fontSize: 11, fontFamily: COLORS.fontExtraBold, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8 },
    input: { fontSize: 15, fontFamily: COLORS.fontBold, color: COLORS.text, paddingVertical: 4 },
    saveBtn: {
        marginTop: 30, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
        height: 56, borderRadius: 28, backgroundColor: COLORS.purple,
        shadowColor: COLORS.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
    },
    saveTxt: { color: "#fff", fontSize: 16, fontFamily: COLORS.fontExtraBold },
    center: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
});
