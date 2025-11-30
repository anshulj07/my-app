// app/(auth)/sign-up.tsx
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
import { useSignUp } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");

  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const emailOk = useMemo(() => emailAddress.trim().includes("@"), [emailAddress]);
  const pwOk = useMemo(() => password.length >= 8, [password]);

  const canSubmitSignUp =
    !!emailAddress.trim() && !!password && emailOk && pwOk && !submitting;

  const codeDigits = useMemo(() => code.replace(/\D/g, ""), [code]);
  const canSubmitVerify = codeDigits.length === 6 && !submitting;

  const pickErr = (e: any, fallback: string) =>
    e?.errors?.[0]?.longMessage ||
    e?.errors?.[0]?.message ||
    e?.message ||
    fallback;

  const onSignUpPress = async () => {
    if (!isLoaded || !signUp) return;

    setSubmitting(true);
    setErr(null);

    try {
      await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (e: any) {
      setErr(pickErr(e, "Failed to sign up."));
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || !signUp || !setActive) return;

    setSubmitting(true);
    setErr(null);

    try {
      const attempt = await signUp.attemptEmailAddressVerification({
        code: codeDigits,
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        // ✅ Let AuthGate/index decide where to go next
        router.replace("/");
        return;
      }

      if (attempt.status === "missing_requirements") {
        const missing = (attempt as any)?.missingFields;
        if (Array.isArray(missing) && missing.length) {
          setErr(`Missing required fields: ${missing.join(", ")}`);
        } else {
          setErr("Missing required fields in sign-up settings. Check Clerk dashboard requirements.");
        }
        return;
      }

      setErr(`Verification not complete (status: ${attempt.status}). Try again.`);
    } catch (e: any) {
      setErr(pickErr(e, "Failed to verify code."));
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
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="sparkles" size={18} color="#0A84FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>Hey there 👋</Text>
              <Text style={styles.tagline}>Find what’s happening near you</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>
              {pendingVerification ? "Verify your email" : "Create your account"}
            </Text>
            <Text style={styles.sub}>
              {pendingVerification
                ? "Enter the 6-digit code we sent to your email."
                : "Sign up with your email and a secure password."}
            </Text>

            {!pendingVerification ? (
              <>
                {/* Email */}
                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" />
                    <TextInput
                      value={emailAddress}
                      onChangeText={setEmailAddress}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      placeholder="you@email.com"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                    {emailAddress.trim().length > 0 ? (
                      <Ionicons
                        name={emailOk ? "checkmark-circle" : "alert-circle"}
                        size={18}
                        color={emailOk ? "#16A34A" : "#DC2626"}
                      />
                    ) : (
                      <View style={{ width: 18 }} />
                    )}
                  </View>
                </View>

                {/* Password */}
                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="#64748B"
                    />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPw}
                      placeholder="At least 8 characters"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPw((s) => !s)}
                      activeOpacity={0.85}
                      hitSlop={10}
                      style={styles.iconTap}
                    >
                      <Ionicons
                        name={showPw ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color="#475569"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.hint}>
                    {password.length === 0
                      ? " "
                      : pwOk
                      ? "Looks good."
                      : "Use 8+ characters."}
                  </Text>
                </View>

                {!!err && (
                  <View style={styles.errBox}>
                    <Ionicons name="warning-outline" size={18} color="#DC2626" />
                    <Text style={styles.errText}>{err}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={onSignUpPress}
                  activeOpacity={0.9}
                  disabled={!canSubmitSignUp}
                  style={[styles.primaryBtn, !canSubmitSignUp && { opacity: 0.55 }]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.primaryText}>Create account</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/(auth)/sign-in")}
                  activeOpacity={0.9}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkText}>Already have an account? Sign in</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Verification code</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="key-outline" size={18} color="#64748B" />
                    <TextInput
                      value={codeDigits}
                      onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                      keyboardType="number-pad"
                      placeholder="123456"
                      placeholderTextColor="#94A3B8"
                      style={[styles.input, { letterSpacing: 6 }]}
                      maxLength={6}
                      returnKeyType="done"
                    />
                    <Ionicons
                      name={codeDigits.length === 6 ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={codeDigits.length === 6 ? "#16A34A" : "#94A3B8"}
                    />
                  </View>
                  <Text style={styles.hint}>Check spam/promotions if you don’t see it.</Text>
                </View>

                {!!err && (
                  <View style={styles.errBox}>
                    <Ionicons name="warning-outline" size={18} color="#DC2626" />
                    <Text style={styles.errText}>{err}</Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={onVerifyPress}
                  activeOpacity={0.9}
                  disabled={!canSubmitVerify}
                  style={[styles.primaryBtn, !canSubmitVerify && { opacity: 0.55 }]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.primaryText}>Verify & continue</Text>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setPendingVerification(false);
                    setCode("");
                    setErr(null);
                  }}
                  activeOpacity={0.9}
                  style={styles.secondaryBtn}
                >
                  <Ionicons name="arrow-back" size={18} color="#0F172A" />
                  <Text style={styles.secondaryText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to app terms and acknowledge email verification.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#F8FAFC" },

  page: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
    gap: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 2,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#0F172A", fontWeight: "900", fontSize: 18 },
  tagline: { color: "#64748B", fontWeight: "700", marginTop: 2 },

  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  title: { color: "#0F172A", fontSize: 22, fontWeight: "900" },
  sub: { marginTop: 6, color: "#64748B", fontWeight: "700", lineHeight: 18 },

  field: { marginTop: 14 },
  label: { color: "#0F172A", fontWeight: "900", marginBottom: 8, fontSize: 12 },

  inputWrap: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: {
    flex: 1,
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 15,
    paddingVertical: 0,
  },
  iconTap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  hint: { marginTop: 8, color: "#64748B", fontWeight: "700", fontSize: 12 },

  errBox: {
    marginTop: 14,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errText: { color: "#B91C1C", fontWeight: "800", flex: 1, lineHeight: 18 },

  primaryBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  linkBtn: { marginTop: 14, alignItems: "center" },
  linkText: { color: "#0A84FF", fontWeight: "900" },

  secondaryBtn: {
    marginTop: 12,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryText: { color: "#0F172A", fontWeight: "900" },

  footer: {
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: 10,
  },
});
