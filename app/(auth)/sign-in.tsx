// app/(auth)/sign-in.tsx
import { useState } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import Ionicons from "@expo/vector-icons/Ionicons";

WebBrowser.maybeCompleteAuthSession();

import heroImage from "../../assets/IMG_0016.png";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const emailOk = emailAddress.trim().includes("@");
  const canSubmit = !!emailAddress.trim() && !!password && emailOk && !submitting;

  const pickErr = (e: any, fallback: string) =>
    e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || fallback;

  const onSignInPress = async () => {
    if (!isLoaded || !signIn || !setActive) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await signIn.create({ identifier: emailAddress.trim(), password });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.replace("/");
      } else {
        setErr(`Sign-in not complete (status: ${res.status}).`);
      }
    } catch (e: any) {
      setErr(pickErr(e, "Failed to sign in."));
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive: setActiveOAuth } = await startOAuthFlow();
      if (createdSessionId && setActiveOAuth) {
        await setActiveOAuth({ session: createdSessionId });
        router.replace("/");
      }
    } catch (e: any) {
      Alert.alert("Google sign-in failed", pickErr(e, "Could not sign in with Google."));
    }
  };

  // ── Email login form ────────────────────────────────────────────────────────
  if (showEmailLogin) {
    return (
      <SafeAreaView style={styles.safeLight}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.select({ ios: "padding", android: undefined })}
        >
          <ScrollView
            contentContainerStyle={styles.loginPage}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowEmailLogin(false)}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>

            <Text style={styles.loginTitle}>Welcome back</Text>
            <Text style={styles.loginSubtitle}>Sign in to continue meeting people.</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={styles.fieldWrap}>
                <TextInput
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="example@email.com"
                  placeholderTextColor="#aaa"
                  style={styles.fieldInput}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.fieldWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  placeholderTextColor="#aaa"
                  style={[styles.fieldInput, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPw((s) => !s)}
                  style={styles.eyeBtn}
                  hitSlop={10}
                >
                  <Ionicons
                    name={showPw ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!!err && <Text style={styles.errText}>{err}</Text>}

            <TouchableOpacity
              onPress={onSignInPress}
              disabled={!canSubmit}
              style={[styles.emailActionBtn, !canSubmit && { opacity: 0.5 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.emailActionBtnText}>Log in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchLink}
              onPress={() => { setShowEmailLogin(false); router.push("/(auth)/sign-up"); }}
            >
              <Text style={styles.switchLinkText}>Don't have an account? <Text style={{ color: "#2D1F4B", fontWeight: "700" }}>Sign up</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Landing screen ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.safe, { width: screenW, height: screenH }]}>
      {/* Full-bleed hero image — starts from very top, no margin */}
      <Image
        source={heroImage}
        style={[styles.heroImage, { width: screenW, height: screenH * 0.7 }]}
        resizeMode="cover"
      />

      {/* Multi-stop gradient: barely dark at top → fully dark at bottom */}
      <LinearGradient
        colors={[
          "rgba(8,4,20,0.08)",
          "rgba(8,4,20,0)",
          "rgba(8,4,20,0.55)",
          "rgba(8,4,20,0.88)",
          "rgba(8,4,20,0.97)",
        ]}
        locations={[0, 0.18, 0.52, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo — top-left, respects safe area */}
      <View style={[styles.logoOverlay, { paddingTop: insets.top + 14 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <View style={styles.logoTextWrap}>
            <Text style={styles.logoTextMy}>my</Text>
            <Text style={styles.logoTextApp}>app</Text>
          </View>
        </View>
      </View>

      {/* Bottom panel — tagline + buttons, pinned to bottom */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 28 }]}>

        {/* Tagline */}
        <View style={styles.taglineBlock}>
          <Text style={styles.taglineEyebrow}>THE PEOPLE</Text>
          <Text style={styles.taglineHero}>platform</Text>
          <Text style={styles.taglineSub}>
            Real meetups. Real people. Near you.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsArea}>

          {/* Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.85}
            onPress={onGoogleSignIn}
          >
            <View style={styles.googleIconCircle}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple */}
          <TouchableOpacity
            style={styles.appleBtn}
            activeOpacity={0.85}
            onPress={() => Alert.alert("Coming soon", "Apple sign-in not yet configured.")}
          >
            <Ionicons name="logo-apple" size={20} color="#fff" />
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          {/* Sign up with email — primary CTA */}
          <TouchableOpacity
            style={styles.signUpEmailBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/sign-up")}
          >
            <Ionicons name="mail-outline" size={18} color="#fff" />
            <Text style={styles.signUpEmailBtnText}>Sign up with email</Text>
          </TouchableOpacity>

          {/* Log in link */}
          <TouchableOpacity
            style={styles.logInLink}
            activeOpacity={0.85}
            onPress={() => setShowEmailLogin(true)}
          >
            <Text style={styles.logInLinkText}>Already have an account? <Text style={styles.logInLinkBold}>Log in</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Landing ────────────────────────────────────────────────────────────────
  safe: { flex: 1, backgroundColor: "#080414" },
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Logo
  logoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A855F7",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  logoLetter: { color: "#4A3268", fontWeight: "900", fontSize: 20 },
  logoTextWrap: { flexDirection: "row", alignItems: "baseline", gap: 1 },
  logoTextMy: {
    color: "rgba(255,255,255,0.65)",
    fontWeight: "300",
    fontSize: 22,
    letterSpacing: 1,
  },
  logoTextApp: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: -0.5,
  },

  // Bottom panel
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    gap: 24,
  },

  taglineBlock: { gap: 4 },

  taglineEyebrow: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 6,
  },
  taglineHero: {
    color: "#fff",
    fontSize: 68,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -3,
    lineHeight: 70,
    textShadowColor: "#C084FC",
    textShadowRadius: 48,
    textShadowOffset: { width: 0, height: 0 },
  },
  taglineSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
    marginTop: 4,
  },

  buttonsArea: { gap: 10 },

  googleBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  googleG: { color: "#4285F4", fontWeight: "900", fontSize: 12 },
  googleBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  appleBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  appleBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  orLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.18)" },
  orText: { color: "rgba(255,255,255,0.4)", fontWeight: "600", fontSize: 12 },

  signUpEmailBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2D1F4B",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  signUpEmailBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  logInLink: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  logInLinkText: {
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    fontSize: 14,
  },
  logInLinkBold: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  // ── Email login form ───────────────────────────────────────────────────────
  safeLight: { flex: 1, backgroundColor: "#f5f5f5" },
  loginPage: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  loginSubtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 36,
    lineHeight: 22,
  },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
  },
  fieldInput: {
    flex: 1,
    color: "#111",
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeBtn: { paddingLeft: 8 },
  errText: { color: "#e53935", fontSize: 13, marginBottom: 14, marginLeft: 4 },
  emailActionBtn: {
    height: 52,
    borderRadius: 28,
    backgroundColor: "#2D1F4B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  emailActionBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchLink: { alignItems: "center", paddingVertical: 6 },
  switchLinkText: { fontSize: 14, color: "#888" },
});
