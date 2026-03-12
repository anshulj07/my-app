import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
} from "react-native";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const COLORS = {
    bg: "#FFF7FA",
    card: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
    brand: "#FF4D6D",
    brandSoft: "#FFF1F5",
    border: "#F1F5F9",
};

export default function SettingsIndex() {
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>
                    <Text style={styles.subtitle}>Configure your app experience</Text>
                </View>

                {/* Profile Section */}
                <Section title="Profile">
                    <NavItem
                        href="/profile/settings/PersonalInfo"
                        icon="person-circle-outline"
                        label="Personal Information"
                        hint="Name, email, and location"
                    />
                    <NavItem
                        href="/profile/settings/Preferences"
                        icon="options-outline"
                        label="Preferences"
                        hint="App theme and notifications"
                    />
                    <NavItem
                        href="/profile/settings/History"
                        icon="time-outline"
                        label="History"
                        hint="Your past activity and events"
                        isLast
                    />
                </Section>

                {/* Account Section */}
                <Section title="Account">
                    <NavItem
                        href="/profile/settings/AccountSettings"
                        icon="settings-outline"
                        label="Account Settings"
                        hint="Privacy and connections"
                    />
                    <NavItem
                        href="/profile/settings/Security"
                        icon="shield-checkmark-outline"
                        label="Security"
                        hint="2FA and login activity"
                        isLast
                    />
                </Section>

                {/* Community Section */}
                <Section title="Community">
                    <NavItem
                        href="/profile/settings/Social"
                        icon="people-outline"
                        label="Social & Community"
                        hint="Friends and social feed"
                        isLast
                    />
                </Section>

                <View style={styles.footer}>
                   <Text style={styles.footerText}>Meetup v1.0.4</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------------- UI Components ---------------- */

const Section = ({ title, children }: any) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.card}>{children}</View>
    </View>
);

const NavItem = ({ href, icon, label, hint, isLast }: any) => (
    <Link href={href} asChild>
        <TouchableOpacity style={StyleSheet.flatten([styles.item, isLast && styles.itemLast])} activeOpacity={0.7}>
            <View style={styles.iconBox}>
                <Ionicons name={icon} size={22} color={COLORS.brand} />
            </View>
            <View style={styles.itemBody}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.hint}>{hint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>
    </Link>
);

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 32, paddingLeft: 4 },
    title: {
        fontSize: 32,
        fontWeight: "900",
        color: COLORS.text,
        letterSpacing: -1,
        marginTop: Platform.OS === "android" ? 10 : 0,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.muted,
        marginTop: 4,
    },
    section: { marginBottom: 28 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.muted,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 6,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemLast: { borderBottomWidth: 0 },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.brandSoft,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    itemBody: { flex: 1 },
    label: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 2,
    },
    hint: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.muted,
    },
    footer: { marginTop: 10, alignItems: "center" },
    footerText: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.muted,
        opacity: 0.6,
    },
});
