// app/(auth)/welcome.tsx
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function WelcomeScreen() {
    const router = useRouter();

    // ✅ Put your local video here:
    // Example: create assets/videos/auth-bg.mp4 and update require path
    const assetId = useMemo(() => require("../../assests/background.mp4"), []);
    const player = useVideoPlayer(assetId, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    return (
        <View style={styles.root}>
            {/* Background video */}
            <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
            />

            {/* Dark overlay for readability */}
            <View style={styles.overlay} />

            <SafeAreaView style={styles.safe}>
                {/* Top copy */}
                <View style={styles.top}>
                    <Text style={styles.brand}>myApp</Text>
                    <Text style={styles.headline}>Meet people nearby.</Text>
                    <Text style={styles.subhead}>Create events, join plans, and see what’s happening around you.</Text>
                </View>

                {/* Bottom actions */}
                <View style={styles.bottom}>
                    <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => router.push({ pathname: "/(auth)/otp", params: { mode: "email" } })}
                        style={[styles.glassBtn, styles.glassPrimary]}
                    >
                        <View style={styles.shine} />
                        <View style={styles.btnIconGlass}>
                            <Ionicons name="mail-outline" size={18} color="#fff" />
                        </View>
                        <Text style={styles.btnTextGlass}>Sign in with email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => router.push({ pathname: "/(auth)/otp", params: { mode: "phone" } })}
                        style={[styles.glassBtn, styles.glassSecondary]}
                    >
                        <View style={styles.shine} />
                        <View style={styles.btnIconGlass}>
                            <Ionicons name="call-outline" size={18} color="#fff" />
                        </View>
                        <Text style={styles.btnTextGlass}>Sign in with phone number</Text>
                    </TouchableOpacity>


                    <Text style={styles.footer}>
                        By continuing, you agree to receive a one-time code for verification.
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const COLORS = {
    ink: "#FFFFFF",
    muted: "rgba(255,255,255,0.72)",
    muted2: "rgba(255,255,255,0.55)",
    overlay: "rgba(0,0,0,0.52)",
    primary: "#FF4D6D",
    border: "rgba(255,255,255,0.18)",
    card: "rgba(255,255,255,0.10)",
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#000" },
    safe: { flex: 1, justifyContent: "space-between" },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.overlay,
    },

    top: {
        paddingHorizontal: 18,
        paddingTop: 18,
        gap: 10,
    },

    brand: {
        color: COLORS.ink,
        fontWeight: "900",
        fontSize: 18,
        letterSpacing: 0.6,
        opacity: 0.95,
    },

    headline: {
        color: COLORS.ink,
        fontWeight: "900",
        fontSize: 36,
        letterSpacing: -1.2,
        lineHeight: 42,
        marginTop: 6,
    },

    subhead: {
        color: COLORS.muted,
        fontWeight: "700",
        fontSize: 14,
        lineHeight: 20,
        maxWidth: 320,
    },

    bottom: {
        paddingHorizontal: 18,
        paddingBottom: 18,
        gap: 12,
    },

    btn: {
        height: 56,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
    },

    btnPrimary: {
        backgroundColor: COLORS.primary,
        borderColor: "rgba(255,255,255,0.16)",
        shadowColor: COLORS.primary,
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8,
    },

    btnSecondary: {
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
    },

    btnIcon: {
        width: 36,
        height: 36,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.18)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.20)",
    },

    btnIconSecondary: {
        backgroundColor: "rgba(255,255,255,0.14)",
    },

    btnTextPrimary: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 16,
        letterSpacing: 0.2,
    },

    btnTextSecondary: {
        color: COLORS.ink,
        fontWeight: "900",
        fontSize: 16,
        letterSpacing: 0.2,
    },

    footer: {
        marginTop: 8,
        color: COLORS.muted2,
        fontWeight: "700",
        fontSize: 12,
        lineHeight: 16,
        textAlign: "center",
        paddingHorizontal: 10,
    },
    glassBtn: {
        height: 62,
        borderRadius: 22,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,

        // Glass look
        backgroundColor: "rgba(255,255,255,0.10)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.20)",

        // iOS shadow
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 14 },

        // Android
        elevation: 10,
        overflow: "hidden", // important for shine layer
    },

    glassPrimary: {
        backgroundColor: "rgba(255,255,255,0.14)",
        borderColor: "rgba(255,255,255,0.28)",
    },

    glassSecondary: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderColor: "rgba(255,255,255,0.18)",
    },

    shine: {
        position: "absolute",
        top: -20,
        left: -40,
        width: 140,
        height: 140,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.18)",
        transform: [{ rotate: "20deg" }],
    },

    btnIconGlass: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.16)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.22)",
    },

    btnTextGlass: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 16,
        letterSpacing: 0.2,
    },

});
