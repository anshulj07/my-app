// app/(auth)/sign-in.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const emailOk = useMemo(() => emailAddress.trim().includes("@"), [emailAddress]);
  const canSubmit = !!emailAddress.trim() && !!password && emailOk && !submitting;

  const pickErr = (e: any, fallback: string) =>
    e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || fallback;

  const onSignInPress = async () => {
    if (!isLoaded || !signIn || !setActive) return;

    setSubmitting(true);
    setErr(null);

    try {
      const res = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.badge}>
                <Ionicons name="flame" size={16} color={COLORS.primary} />
                <Text style={styles.badgeText}>Welcome back</Text>
              </View>

              {/* <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push("/(auth)/sign-up")}
                style={styles.heroLinkPill}
              >
                <Text style={styles.heroLinkText}>Sign up</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.ink} />
              </TouchableOpacity> */}
            </View>

            <Text style={styles.h1}>Sign in</Text>
            <Text style={styles.h2}>Pick up where you left off.</Text>
          </View>

          {/* Glass surface */}
          <View style={styles.surface}>
            {/* Email */}
            <View style={styles.group}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrap, emailAddress.trim() && (emailOk ? styles.ok : styles.bad)]}>
                <View style={styles.leftIcon}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.muted} />
                </View>
                <TextInput
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="you@email.com"
                  placeholderTextColor={COLORS.placeholder}
                  style={styles.input}
                />
                <View style={styles.rightIcon}>
                  {emailAddress.trim().length > 0 ? (
                    <Ionicons
                      name={emailOk ? "checkmark-circle" : "alert-circle"}
                      size={18}
                      color={emailOk ? COLORS.success : COLORS.danger}
                    />
                  ) : (
                    <View style={{ width: 18 }} />
                  )}
                </View>
              </View>
            </View>

            {/* Password */}
            <View style={styles.group}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <View style={styles.leftIcon}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} />
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.placeholder}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => setShowPw((s) => !s)}
                  activeOpacity={0.85}
                  hitSlop={10}
                  style={[styles.rightIcon, styles.iconTap]}
                >
                  <Ionicons
                    name={showPw ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={COLORS.inkSoft}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!!err && (
              <View style={styles.alert}>
                <View style={styles.alertIcon}>
                  <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
                </View>
                <Text style={styles.alertText}>{err}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={onSignInPress}
              activeOpacity={0.92}
              disabled={!canSubmit}
              style={[styles.cta, !canSubmit && styles.ctaDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaText}>Sign in</Text>
                  <View style={styles.ctaIcon}>
                    <Ionicons name="log-in-outline" size={18} color="#fff" />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-up")}
              activeOpacity={0.9}
              style={styles.secondary}
            >
              <Ionicons name="sparkles-outline" size={18} color={COLORS.ink} />
              <Text style={styles.secondaryText}>Create a new account</Text>
            </TouchableOpacity>
          </View>

          {/* <Text style={styles.footer}>Secure sign-in powered by Clerk.</Text> */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Same “Tinder/Bumble-ish” palette used in your sign-up tweak */
const COLORS = {
  bgTop: "#0B0B12",
  bgBottom: "#0F172A",
  card: "rgba(255,255,255,0.10)",
  card2: "rgba(255,255,255,0.14)",
  ink: "#FFFFFF",
  inkSoft: "rgba(255,255,255,0.78)",
  muted: "rgba(255,255,255,0.62)",
  placeholder: "rgba(255,255,255,0.45)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",
  primary: "#FF4D6D",
  primary2: "#FF8A00",
  primarySoft: "rgba(255,77,109,0.18)",
  success: "#22C55E",
  danger: "#FB7185",
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: COLORS.bgTop },

  page: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    justifyContent: "center",
    gap: 16,
    backgroundColor: COLORS.bgTop,
  },

  // HERO
  hero: { paddingHorizontal: 2, gap: 10 },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,77,109,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.25)",
  },
  badgeText: { color: COLORS.ink, fontWeight: "800", fontSize: 12, letterSpacing: 0.3 },

  heroLinkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroLinkText: { color: COLORS.ink, fontWeight: "800", fontSize: 12 },

  h1: {
    color: COLORS.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
    lineHeight: 40,
  },
  h2: { color: COLORS.muted, fontSize: 14, fontWeight: "700", lineHeight: 20 },

  // SURFACE
  surface: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },

  group: { marginTop: 12 },
  label: { color: COLORS.inkSoft, fontWeight: "800", marginBottom: 8, fontSize: 12 },

  inputWrap: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  leftIcon: { width: 46, height: 56, alignItems: "center", justifyContent: "center", opacity: 0.9 },
  rightIcon: { width: 46, height: 56, alignItems: "center", justifyContent: "center", opacity: 0.95 },

  input: {
    flex: 1,
    color: COLORS.ink,
    fontWeight: "800",
    fontSize: 15,
    paddingVertical: 0,
    paddingRight: 8,
    letterSpacing: 0.2,
  },

  iconTap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  ok: { borderColor: "rgba(34,197,94,0.35)", backgroundColor: "rgba(34,197,94,0.06)" },
  bad: { borderColor: "rgba(251,113,133,0.35)", backgroundColor: "rgba(251,113,133,0.06)" },

  // ALERT
  alert: {
    marginTop: 14,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.24)",
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(251,113,133,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: { color: "#FFE4EA", fontWeight: "800", flex: 1, lineHeight: 18 },

  // CTA
  cta: {
    marginTop: 16,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.3 },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  // DIVIDER
  dividerRow: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  dividerText: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },

  // SECONDARY
  secondary: {
    marginTop: 12,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  secondaryText: { color: COLORS.ink, fontWeight: "900" },

  footer: {
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: 10,
    marginTop: 2,
    lineHeight: 18,
  },
});
