import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser, useClerk } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

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
    red: "#EF4444",
    redBg: "#FEF2F2",
    font: "Outfit_500Medium",
    fontBold: "Outfit_700Bold",
    fontExtraBold: "Outfit_800ExtraBold",
};

export default function SettingsIndex() {
    const router = useRouter();
    const { user } = useUser();
    const { signOut } = useClerk();

    const handleLogout = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await signOut();
        router.replace("/(auth)/sign-in");
    };

    return (
        <SafeAreaView style={S.safe}>
            <View style={S.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.purple} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={S.container}
                contentContainerStyle={S.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Title */}
                <View style={S.titleSection}>
                    <Text style={S.title}>Settings</Text>
                    <Text style={S.subtitle}>Manage your account preferences and social connections.</Text>
                </View>

                {/* User Profile Card */}
                <View style={S.profileCard}>
                    <View style={S.avatarWrapper}>
                        <Image 
                            source={{ uri: user?.imageUrl }} 
                            style={S.avatar} 
                        />
                        <View style={S.editBadge}>
                            <Ionicons name="pencil" size={12} color="#fff" />
                        </View>
                    </View>
                    <View style={S.profileInfo}>
                        <Text style={S.profileName}>{user?.fullName || "User Name"}</Text>
                        <Text style={S.profileUsername}>
                            @{user?.username || user?.firstName?.toLowerCase() || "user"} • Pro Member
                        </Text>
                    </View>
                </View>

                {/* Profile Section */}
                <Section title="PROFILE">
                    <NavItem
                        onPress={() => router.push("/profile/settings/PersonalInfo")}
                        icon="person-outline"
                        label="Personal Information"
                        hint="Email, phone, and address"
                    />
                    <NavItem
                        onPress={() => router.push("/profile/settings/Preferences")}
                        icon="options-outline"
                        label="Preferences"
                        hint="Language, currency, and theme"
                    />
                    <NavItem
                        onPress={() => router.push("/profile/settings/History")}
                        icon="time-outline"
                        label="History"
                        hint="Past trips and activity log"
                        isLast
                    />
                </Section>

                {/* Account Section */}
                <Section title="ACCOUNT">
                    <NavItem
                        onPress={() => router.push("/profile/settings/AccountSettings")}
                        icon="settings-outline"
                        label="Account Settings"
                        hint="Manage your subscription"
                    />
                    <NavItem
                        onPress={() => router.push("/profile/settings/Security")}
                        icon="shield-checkmark-outline"
                        label="Security"
                        hint="Passwords and 2FA"
                        isLast
                    />
                </Section>

                {/* Community Section */}
                <Section title="COMMUNITY">
                    <NavItem
                        onPress={() => router.push("/profile/settings/Social")}
                        icon="people-outline"
                        label="Social & Community"
                        hint="Privacy and visibility settings"
                        isLast
                    />
                </Section>

                {/* Logout Button */}
                <TouchableOpacity style={S.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
                    <Text style={S.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={S.footer}>
                   <Text style={S.footerText}>NomadMeet v2.4.1 (Build 882)</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------------- UI Components ---------------- */

const Section = ({ title, children }: any) => (
    <View style={S.section}>
        <Text style={S.sectionTitle}>{title}</Text>
        <View style={S.card}>{children}</View>
    </View>
);

const NavItem = ({ onPress, icon, label, hint, isLast }: any) => (
    <TouchableOpacity 
        style={[S.item, isLast && S.itemLast]} 
        activeOpacity={0.7}
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }}
    >
        <View style={S.iconBox}>
            <Ionicons name={icon} size={20} color={COLORS.purple} />
        </View>
        <View style={S.itemBody}>
            <Text style={S.label}>{label}</Text>
            <Text style={S.hint}>{hint}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.lightMuted} />
    </TouchableOpacity>
);

const S = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1 },
    headerRow: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 10 : 20,
        paddingBottom: 10,
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 14,
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border,
    },
    content: { padding: 20, paddingBottom: 60 },
    titleSection: { marginBottom: 24 },
    title: {
        fontSize: 32,
        fontFamily: COLORS.fontExtraBold,
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: COLORS.font,
        color: COLORS.muted,
        lineHeight: 20,
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 24,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    avatarWrapper: { position: "relative" },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.border },
    editBadge: {
        position: "absolute", bottom: 0, right: 0,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: COLORS.purple,
        alignItems: "center", justifyContent: "center",
        borderWidth: 2, borderColor: "#fff",
    },
    profileInfo: { marginLeft: 16, flex: 1 },
    profileName: { fontSize: 18, fontFamily: COLORS.fontBold, color: COLORS.text, marginBottom: 2 },
    profileUsername: { fontSize: 13, fontFamily: COLORS.font, color: COLORS.muted },
    
    section: { marginBottom: 28 },
    sectionTitle: {
        fontSize: 12,
        fontFamily: COLORS.fontExtraBold,
        color: COLORS.purple,
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemLast: { borderBottomWidth: 0 },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.purpleBg,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    itemBody: { flex: 1 },
    label: { fontSize: 15, fontFamily: COLORS.fontBold, color: COLORS.text, marginBottom: 2 },
    hint: { fontSize: 12, fontFamily: COLORS.font, color: COLORS.muted },
    
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.redBg,
        padding: 16,
        borderRadius: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.1)",
        gap: 10,
    },
    logoutText: { fontSize: 15, fontFamily: COLORS.fontBold, color: COLORS.red },
    
    footer: { marginTop: 30, alignItems: "center" },
    footerText: { fontSize: 12, fontFamily: COLORS.font, color: COLORS.muted, opacity: 0.7 },
});