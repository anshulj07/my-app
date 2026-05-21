import React, { useState } from "react";
import { 
    View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, 
    SafeAreaView, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator 
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useUser, useSession } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";

const COLORS = {
    purple: "#6366F1",
    purpleDark: "#4F46E5",
    purpleBg: "#EEF2FF",
    purpleBorder: "#C7D2FE",
    bg: "#F9FAFB",
    card: "#FFFFFF",
    border: "#F3F4F6",
    text: "#111827",
    muted: "#6B7280",
    lightMuted: "#9CA3AF",
    green: "#10B981",
    greenBg: "#E6FBF3",
    greenText: "#059669",
    font: "Outfit_500Medium",
    fontBold: "Outfit_700Bold",
    fontExtraBold: "Outfit_800ExtraBold",
};

export default function ChangePassword() {
    const router = useRouter();
    const { user } = useUser();
    const { session } = useSession();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields."); 
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert("Error", "New password must be at least 8 characters long."); 
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords do not match."); 
            return;
        }
        if (currentPassword === newPassword) {
            Alert.alert("Error", "New password cannot be the same as the current one."); 
            return;
        }
        setLoading(true);
        try {
            if (!user) throw new Error("User not found");
            await user.updatePassword({ currentPassword, newPassword, signOutOfOtherSessions: false });
            if (session) { 
                await session.getToken(); 
            }
            setLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success ✨", "Your password has been updated successfully.", [{ text: "OK", onPress: () => router.back() }]);
            return;
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const msg = err.errors?.[0]?.message || err.message || "Failed to update password.";
            if (msg.toLowerCase().includes("signed out")) {
                Alert.alert("Session Sync", "Password updated, but session needs refresh.");
            } else { 
                Alert.alert("Update Failed", msg); 
            }
        } finally { 
            setLoading(false); 
        }
    };

    const isMinLength = newPassword.length >= 8;
    const isMatching = newPassword === confirmPassword && newPassword.length > 0;

    return (
        <SafeAreaView style={S.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

                    <View style={S.header}>
                        <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
                            <Ionicons name="arrow-back" size={22} color={COLORS.purple} />
                        </TouchableOpacity>
                        <Text style={S.headerTitle}>NomadMeet</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={S.intro}>
                        <View style={S.introBadge}>
                            <Ionicons name="shield-checkmark" size={24} color={COLORS.purple} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={S.introH}>Update Password</Text>
                            <Text style={S.introS}>Ensure your account remains safe and secure.</Text>
                        </View>
                    </View>

                    <View style={S.formArea}>
                        <PasswordField 
                            label="Current Password" 
                            value={currentPassword} 
                            onChange={setCurrentPassword} 
                            placeholder="Enter current password" 
                        />
                        <PasswordField 
                            label="New Password" 
                            value={newPassword} 
                            onChange={setNewPassword} 
                            placeholder="Min. 8 characters" 
                        />
                        <PasswordField 
                            label="Confirm New Password" 
                            value={confirmPassword} 
                            onChange={setConfirmPassword} 
                            placeholder="Repeat new password" 
                        />
                    </View>

                    {/* Password rules */}
                    <View style={S.ruleCard}>
                        <View style={S.ruleRow}>
                            <Ionicons 
                                name={isMinLength ? "checkmark-circle" : "ellipse-outline"} 
                                size={16} 
                                color={isMinLength ? COLORS.green : COLORS.lightMuted} 
                            />
                            <Text style={[S.ruleText, isMinLength && { color: COLORS.greenText, fontFamily: COLORS.fontBold }]}>
                                At least 8 characters
                            </Text>
                        </View>
                        <View style={S.ruleRow}>
                            <Ionicons 
                                name={isMatching ? "checkmark-circle" : "ellipse-outline"} 
                                size={16} 
                                color={isMatching ? COLORS.green : COLORS.lightMuted} 
                            />
                            <Text style={[S.ruleText, isMatching && { color: COLORS.greenText, fontFamily: COLORS.fontBold }]}>
                                Passwords match
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[S.saveBtn, loading && { opacity: 0.7 }]}
                        onPress={handleSave} 
                        disabled={loading} 
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={S.saveText}>Update Password</Text>
                                <Ionicons name="sparkles-outline" size={18} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const PasswordField = ({ label, value, onChange, placeholder }: any) => {
    const [show, setShow] = useState(false);
    return (
        <View style={S.block}>
            <View style={S.blockHeader}>
                <View style={S.iconCircle}>
                    <Ionicons name="key-outline" size={13} color={COLORS.purple} />
                </View>
                <Text style={S.blockLabel}>{label}</Text>
            </View>
            <View style={S.inputRow}>
                <TextInput
                    style={S.input} 
                    value={value} 
                    onChangeText={onChange}
                    placeholder={placeholder} 
                    placeholderTextColor={COLORS.lightMuted}
                    secureTextEntry={!show} 
                    autoCapitalize="none" 
                    selectionColor={COLORS.purple}
                />
                <TouchableOpacity onPress={() => setShow(!show)} style={S.eyeBtn}>
                    <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.muted} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const S = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 60 },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        height: 60, marginBottom: 24,
    },
    backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontFamily: COLORS.fontExtraBold, color: COLORS.purple },
    intro: {
        flexDirection: "row", alignItems: "center", gap: 14,
        backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: COLORS.border,
        padding: 20, marginBottom: 24,
        shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
    },
    introBadge: {
        width: 48, height: 48, borderRadius: 16,
        backgroundColor: COLORS.purpleBg, borderWidth: 1, borderColor: COLORS.purpleBorder,
        alignItems: "center", justifyContent: "center",
    },
    introH: { fontSize: 16, fontFamily: COLORS.fontExtraBold, color: COLORS.text, marginBottom: 2 },
    introS: { fontSize: 13, fontFamily: COLORS.font, color: COLORS.muted },
    formArea: { gap: 16, marginBottom: 16 },
    block: {
        backgroundColor: "#fff", borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: COLORS.border,
        shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
    },
    blockHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    iconCircle: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: COLORS.purpleBg, alignItems: "center", justifyContent: "center",
    },
    blockLabel: { fontSize: 12, fontFamily: COLORS.fontBold, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8 },
    inputRow: { flexDirection: "row", alignItems: "center" },
    input: { flex: 1, fontSize: 15, fontFamily: COLORS.font, color: COLORS.text, paddingVertical: 2 },
    eyeBtn: { padding: 4 },
    ruleCard: {
        backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
        padding: 18, gap: 10, marginBottom: 28,
        shadowColor: "#000", shadowOpacity: 0.01, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    },
    ruleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    ruleText: { fontSize: 13, fontFamily: COLORS.font, color: COLORS.lightMuted },
    saveBtn: {
        height: 56, borderRadius: 28, backgroundColor: COLORS.purple,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
        shadowColor: COLORS.purple, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6,
    },
    saveText: { color: "#fff", fontSize: 16, fontFamily: COLORS.fontExtraBold },
});
