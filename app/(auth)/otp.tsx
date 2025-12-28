// app/(auth)/otp.tsx
import React, { useMemo, useRef, useState } from "react";
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
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";

type Mode = "email" | "phone";
type Flow = "signin" | "signup";

export default function OtpAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params.mode === "phone" ? "phone" : "email") as Mode;

  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();

  const loaded = signInLoaded && signUpLoaded;

  const [step, setStep] = useState<"identifier" | "code">("identifier");
  const [flow, setFlow] = useState<Flow>("signin");

  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const strategy = mode === "email" ? "email_code" : "phone_code";

  const normalizedIdentifier = useMemo(() => {
    if (mode === "email") return identifier.trim().toLowerCase();

    const raw = identifier.trim();
    if (raw.startsWith("+")) return raw;
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length > 0 && digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    return raw;
  }, [identifier, mode]);

  const identifierOk = useMemo(() => {
    if (mode === "email") return normalizedIdentifier.includes("@") && normalizedIdentifier.includes(".");
    return normalizedIdentifier.startsWith("+") && normalizedIdentifier.replace(/\D/g, "").length >= 10;
  }, [mode, normalizedIdentifier]);

  const pickErr = (e: any, fallback: string) =>
    e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || fallback;

  const looksLikeNotFound = (e: any) => {
    const msg = (e?.errors?.[0]?.message || e?.errors?.[0]?.longMessage || e?.message || "").toLowerCase();
    return msg.includes("not found") || msg.includes("couldn't find") || (msg.includes("identifier") && msg.includes("not"));
  };

  const sendCode = async () => {
    if (!loaded || !identifierOk) return;

    setSubmitting(true);
    setErr(null);

    const isEmailCodeFactor = (f: any): f is { strategy: "email_code"; emailAddressId: string } =>
      f?.strategy === "email_code" && typeof f.emailAddressId === "string";

    const isPhoneCodeFactor = (f: any): f is { strategy: "phone_code"; phoneNumberId: string } =>
      f?.strategy === "phone_code" && typeof f.phoneNumberId === "string";

    try {
      setFlow("signin");

      const signInAttempt = await signIn!.create({
        identifier: normalizedIdentifier,
        strategy,
      });

      const factor = signInAttempt.supportedFirstFactors?.find((f: any) => f.strategy === strategy);

      if (!factor) {
        throw new Error(
          mode === "email"
            ? "Email code is not enabled for this account. Enable Email OTP in Clerk."
            : "Phone code is not enabled for this account. Enable SMS OTP in Clerk."
        );
      }

      if (strategy === "email_code") {
        if (!isEmailCodeFactor(factor)) throw new Error("Email OTP factor missing emailAddressId.");
        await signIn!.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
      } else {
        if (!isPhoneCodeFactor(factor)) throw new Error("Phone OTP factor missing phoneNumberId.");
        await signIn!.prepareFirstFactor({ strategy: "phone_code", phoneNumberId: factor.phoneNumberId });
      }

      setStep("code");
      return;
    } catch (e: any) {
      if (!loaded) return;

      if (!looksLikeNotFound(e)) {
        setErr(pickErr(e, "Failed to send code."));
        return;
      }

      try {
        setFlow("signup");

        if (mode === "email") {
          await signUp!.create({ emailAddress: normalizedIdentifier });
          await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
        } else {
          await signUp!.create({ phoneNumber: normalizedIdentifier });
          await signUp!.preparePhoneNumberVerification({ strategy: "phone_code" });
        }

        setStep("code");
        return;
      } catch (e2: any) {
        setErr(pickErr(e2, "Failed to create account / send code."));
        return;
      }
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async () => {
    const digits = code.replace(/\D/g, "").slice(0, 6);
    if (!loaded || digits.length < 4) return;

    setSubmitting(true);
    setErr(null);

    try {
      if (flow === "signin") {
        const res = await signIn!.attemptFirstFactor({ strategy, code: digits });
        if (res.status === "complete") {
          await setActive!({ session: res.createdSessionId });
          router.replace("/(onboarding)/name");
          return;
        }
        setErr(`Verification not complete (status: ${res.status}).`);
        return;
      }

      if (mode === "email") {
        const res = await signUp!.attemptEmailAddressVerification({ code: digits });
        if (res.status === "complete") {
          await setActiveSignUp!({ session: res.createdSessionId });
          router.replace("/(onboarding)/name");
          return;
        }
        setErr(`Verification not complete (status: ${res.status}).`);
        return;
      } else {
        const res = await signUp!.attemptPhoneNumberVerification({ code: digits });
        if (res.status === "complete") {
          await setActiveSignUp!({ session: res.createdSessionId });
          router.replace("/");
          return;
        }
        setErr(`Verification not complete (status: ${res.status}).`);
        return;
      }
    } catch (e: any) {
      setErr(pickErr(e, "Failed to verify code."));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- UI helpers (NEW DESIGN) ----------
  const title = step === "identifier" ? "Let’s verify you" : "Enter your code";
  const subtitle =
    step === "identifier"
      ? mode === "email"
        ? "We’ll email a short verification code."
        : "We’ll text a short verification code."
      : mode === "email"
        ? `Sent to ${normalizedIdentifier || "your email"}`
        : `Sent to ${normalizedIdentifier || "your phone"}`;

  const canSend = identifierOk && !submitting;
  const digits = code.replace(/\D/g, "").slice(0, 6);

  // 6-box OTP UX
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const setOtpAt = (idx: number, ch: string) => {
    const clean = ch.replace(/\D/g, "");
    if (!clean) return;

    const arr = digits.padEnd(6, " ").split("");
    arr[idx] = clean[0];
    const next = arr.join("").replace(/\s/g, "");
    setCode(next);

    const nextIdx = Math.min(idx + 1, 5);
    if (idx < 5) otpRefs.current[nextIdx]?.focus();
  };

  const backspaceAt = (idx: number) => {
    const arr = digits.padEnd(6, " ").split("");
    if (arr[idx] && arr[idx] !== " ") {
      arr[idx] = " ";
      setCode(arr.join("").replace(/\s/g, ""));
      return;
    }
    const prevIdx = Math.max(idx - 1, 0);
    otpRefs.current[prevIdx]?.focus();
    const arr2 = digits.padEnd(6, " ").split("");
    arr2[prevIdx] = " ";
    setCode(arr2.join("").replace(/\s/g, ""));
  };

  const progress = step === "identifier" ? 0.45 : 0.9;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
        <View style={styles.bg}>
          {/* Pastel blobs (completely different vibe) */}

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.navBtn}>
              <Ionicons name="arrow-back" size={18} color={COLORS.ink} />
            </TouchableOpacity>

            <View style={{ width: 40 }} />
          </View>

          <View style={styles.hero}>
            <Text style={styles.h1}>{title}</Text>
            <Text style={styles.h2}>{subtitle}</Text>
          </View>

          {/* Main sheet */}
          <View style={styles.sheet}>
            {step === "identifier" ? (
              <>
                <Text style={styles.label}>{mode === "email" ? "Email address" : "Phone number"}</Text>

                <View style={[styles.field, identifier.length > 0 && (identifierOk ? styles.fieldOk : styles.fieldBad)]}>
                  <Ionicons
                    name={mode === "email" ? "mail-outline" : "call-outline"}
                    size={18}
                    color={COLORS.sub}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType={mode === "email" ? "email-address" : "phone-pad"}
                    placeholder={mode === "email" ? "you@email.com" : "+1 555 123 4567"}
                    placeholderTextColor={COLORS.placeholder}
                    style={styles.input}
                  />
                  {identifier.length > 0 ? (
                    <Ionicons
                      name={identifierOk ? "checkmark-circle" : "close-circle"}
                      size={18}
                      color={identifierOk ? COLORS.teal : COLORS.coral}
                    />
                  ) : null}
                </View>

                {!!err && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.coral} />
                    <Text style={styles.errorText}>{err}</Text>
                  </View>
                )}

                <Pressable
                  onPress={sendCode}
                  disabled={!canSend}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    !canSend && styles.primaryBtnDisabled,
                    pressed && canSend && styles.primaryBtnPressed,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.btnRow}>
                      <Text style={styles.primaryBtnText}>Send code</Text>
                      <View style={styles.btnBadge}>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                      </View>
                    </View>
                  )}
                </Pressable>

                <Text style={styles.microCopy}>
                  If you don’t have an account, we’ll create one automatically.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.label}>Verification code</Text>

                <View style={styles.otpRow}>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const v = (digits[i] || "").trim();
                    return (
                      <TextInput
                        key={i}
                        ref={(r) => { otpRefs.current[i] = r; }}
                        value={v}
                        onChangeText={(t) => setOtpAt(i, t)}
                        onKeyPress={(e) => {
                          if (e.nativeEvent.key === "Backspace") backspaceAt(i);
                        }}
                        keyboardType="number-pad"
                        maxLength={1}
                        style={[styles.otpBox, v ? styles.otpBoxFilled : null]}
                        placeholder="•"
                        placeholderTextColor={COLORS.placeholder}
                        returnKeyType="done"
                      />
                    );
                  })}
                </View>

                {!!err && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.coral} />
                    <Text style={styles.errorText}>{err}</Text>
                  </View>
                )}

                <Pressable
                  onPress={verifyCode}
                  disabled={digits.length < 4 || submitting}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (digits.length < 4 || submitting) && styles.primaryBtnDisabled,
                    pressed && digits.length >= 4 && !submitting && styles.primaryBtnPressed,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.btnRow}>
                      <Text style={styles.primaryBtnText}>Verify</Text>
                      <View style={styles.btnBadge}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    </View>
                  )}
                </Pressable>

                <TouchableOpacity
                  onPress={() => {
                    setStep("identifier");
                    setCode("");
                    setErr(null);
                    setFlow("signin");
                  }}
                  activeOpacity={0.85}
                  style={styles.secondaryBtn}
                >
                  <Ionicons name="create-outline" size={16} color={COLORS.ink} />
                  <Text style={styles.secondaryBtnText}>
                    Change {mode === "email" ? "email" : "phone"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.microCopy}>
                  Tip: If you don’t see the code, check spam or wait a few seconds.
                </Text>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: "#F6F7FB",
  ink: "#0F172A",
  sub: "#334155",
  placeholder: "rgba(15,23,42,0.35)",
  teal: "#0EA5A4",
  tealDeep: "#0B7D7C",
  coral: "#F43F5E",
  card: "#FFFFFF",
  border: "rgba(15,23,42,0.10)",
  shadow: "rgba(2,6,23,0.10)",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  bg: { flex: 1, backgroundColor: COLORS.bg },


  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandText: { fontWeight: "900", color: COLORS.ink, letterSpacing: 0.2 },

  hero: { paddingHorizontal: 18, paddingTop: 18 },
  h1: { fontSize: 32, fontWeight: "900", color: COLORS.ink, letterSpacing: -1.1 },
  h2: { marginTop: 8, fontSize: 14, fontWeight: "700", color: COLORS.sub, lineHeight: 20 },

  chipsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { color: COLORS.ink, fontWeight: "800" },
  chipSoft: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.06)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSoftText: { color: COLORS.sub, fontWeight: "800" },

  sheet: {
    marginTop: 18,
    marginHorizontal: 18,
    padding: 16,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },

  label: { color: COLORS.sub, fontWeight: "900", fontSize: 12, marginBottom: 10 },

  field: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(15,23,42,0.03)",
  },
  fieldOk: { borderColor: "rgba(14,165,164,0.30)", backgroundColor: "rgba(14,165,164,0.06)" },
  fieldBad: { borderColor: "rgba(244,63,94,0.25)", backgroundColor: "rgba(244,63,94,0.05)" },

  input: { flex: 1, color: COLORS.ink, fontWeight: "900", fontSize: 15 },

  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(15,23,42,0.03)",
  },
  otpBoxFilled: { borderColor: "rgba(14,165,164,0.35)", backgroundColor: "rgba(14,165,164,0.06)" },

  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(244,63,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.15)",
  },
  errorText: { flex: 1, color: "#9F1239", fontWeight: "800", lineHeight: 18 },

  primaryBtn: {
    marginTop: 14,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.tealDeep,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  primaryBtnPressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  primaryBtnDisabled: { opacity: 0.45 },

  btnRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  btnBadge: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryBtn: {
    marginTop: 10,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(15,23,42,0.04)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { color: COLORS.ink, fontWeight: "900" },

  microCopy: {
    marginTop: 12,
    color: "rgba(51,65,85,0.85)",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
