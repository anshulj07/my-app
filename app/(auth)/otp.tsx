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
import { LinearGradient } from "expo-linear-gradient";

type Mode = "email" | "phone";
type Flow = "signin" | "signup";
type Step = "identifier" | "code" | "identifier2" | "code2";

const EMAIL_STRATEGY = "email_code" as const;
const PHONE_STRATEGY = "phone_code" as const;

export default function OtpAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params.mode === "phone" ? "phone" : "email") as Mode;

  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();

  const loaded = signInLoaded && signUpLoaded;

  const [step, setStep] = useState<Step>("identifier");
  const [flow, setFlow] = useState<Flow>("signin");

  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");

  // second required identifier (because you require BOTH email + phone in Clerk)
  const [mode2, setMode2] = useState<Mode | null>(null);
  const [identifier2, setIdentifier2] = useState("");
  const [code2, setCode2] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const normalize = (value: string, m: Mode) => {
    if (m === "email") return value.trim().toLowerCase();

    const raw = value.trim();
    if (raw.startsWith("+")) return raw;
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    return raw;
  };

  const normalizedIdentifier = useMemo(() => normalize(identifier, mode), [identifier, mode]);
  const normalizedIdentifier2 = useMemo(
    () => (mode2 ? normalize(identifier2, mode2) : ""),
    [identifier2, mode2]
  );

  const identifierOk = useMemo(() => {
    if (mode === "email") return normalizedIdentifier.includes("@") && normalizedIdentifier.includes(".");
    return normalizedIdentifier.startsWith("+") && normalizedIdentifier.replace(/\D/g, "").length >= 10;
  }, [mode, normalizedIdentifier]);

  const identifier2Ok = useMemo(() => {
    if (!mode2) return false;
    if (mode2 === "email") return normalizedIdentifier2.includes("@") && normalizedIdentifier2.includes(".");
    return normalizedIdentifier2.startsWith("+") && normalizedIdentifier2.replace(/\D/g, "").length >= 10;
  }, [mode2, normalizedIdentifier2]);

  const pickErr = (e: any, fallback: string) =>
    e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || fallback;

  const looksLikeNotFound = (e: any) => {
    const msg = (e?.errors?.[0]?.message || e?.errors?.[0]?.longMessage || e?.message || "").toLowerCase();
    return msg.includes("not found") || msg.includes("couldn't find") || (msg.includes("identifier") && msg.includes("not"));
  };

  const getMissing = (res: any): string[] => {
    // depending on SDK version
    const out =
      res?.missingFields ||
      res?.requiredFields ||
      res?.unverifiedFields ||
      res?.missing_requirements ||
      [];
    return Array.isArray(out) ? out.map(String) : [];
  };

  const decideSecondMode = (missing: string[]): Mode => {
    const m = missing.map((x) => x.toLowerCase());
    if (m.some((x) => x.includes("phone"))) return "phone";
    if (m.some((x) => x.includes("email"))) return "email";
    // fallback: require the other one
    return mode === "email" ? "phone" : "email";
  };

  // ---------- OTP Input helpers ----------
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const otpRefs2 = useRef<Array<TextInput | null>>([]);

  const setOtpAt = (idx: number, ch: string) => {
    const clean = ch.replace(/\D/g, "");
    if (!clean) return;

    const digits = code.replace(/\D/g, "").slice(0, 6);
    const arr = digits.padEnd(6, " ").split("");
    arr[idx] = clean[0];
    const next = arr.join("").replace(/\s/g, "");
    setCode(next);

    if (idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const backspaceAt = (idx: number) => {
    const digits = code.replace(/\D/g, "").slice(0, 6);
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

  const setOtpAt2 = (idx: number, ch: string) => {
    const clean = ch.replace(/\D/g, "");
    if (!clean) return;

    const digits = code2.replace(/\D/g, "").slice(0, 6);
    const arr = digits.padEnd(6, " ").split("");
    arr[idx] = clean[0];
    const next = arr.join("").replace(/\s/g, "");
    setCode2(next);

    if (idx < 5) otpRefs2.current[idx + 1]?.focus();
  };

  const backspaceAt2 = (idx: number) => {
    const digits = code2.replace(/\D/g, "").slice(0, 6);
    const arr = digits.padEnd(6, " ").split("");
    if (arr[idx] && arr[idx] !== " ") {
      arr[idx] = " ";
      setCode2(arr.join("").replace(/\s/g, ""));
      return;
    }
    const prevIdx = Math.max(idx - 1, 0);
    otpRefs2.current[prevIdx]?.focus();
    const arr2 = digits.padEnd(6, " ").split("");
    arr2[prevIdx] = " ";
    setCode2(arr2.join("").replace(/\s/g, ""));
  };

  // ---------- SEND CODE (primary) ----------
  const sendCode = async () => {
    if (!loaded || !identifierOk) return;

    setSubmitting(true);
    setErr(null);

    try {
      // Try SIGN IN first
      setFlow("signin");

      const chosenStrategy = mode === "email" ? EMAIL_STRATEGY : PHONE_STRATEGY;

      const signInAttempt = await signIn!.create({
        identifier: normalizedIdentifier,
        strategy: chosenStrategy,
      });

      const factor = signInAttempt.supportedFirstFactors?.find((f: any) => f.strategy === chosenStrategy);
      if (!factor) {
        throw new Error(
          mode === "email"
            ? "Email code is not enabled for this account. Enable Email OTP in Clerk."
            : "Phone code is not enabled for this account. Enable SMS OTP in Clerk."
        );
      }

      if (chosenStrategy === EMAIL_STRATEGY) {
        // factor is a union type; narrow by accessing the property safely
        const emailAddressId = (factor as any).emailAddressId;
        if (!emailAddressId) throw new Error("Email OTP factor missing emailAddressId.");
        await signIn!.prepareFirstFactor({ strategy: EMAIL_STRATEGY, emailAddressId });
      } else {
        // likewise for phone
        const phoneNumberId = (factor as any).phoneNumberId;
        if (!phoneNumberId) throw new Error("Phone OTP factor missing phoneNumberId.");
        await signIn!.prepareFirstFactor({ strategy: PHONE_STRATEGY, phoneNumberId });
      }

      setStep("code");
      return;
    } catch (e: any) {
      // If not found → SIGN UP
      if (!looksLikeNotFound(e)) {
        setErr(pickErr(e, "Failed to send code."));
        setSubmitting(false);
        return;
      }

      try {
        setFlow("signup");

        if (mode === "email") {
          await signUp!.create({ emailAddress: normalizedIdentifier });
          await signUp!.prepareEmailAddressVerification({ strategy: EMAIL_STRATEGY });
        } else {
          await signUp!.create({ phoneNumber: normalizedIdentifier });
          await signUp!.preparePhoneNumberVerification({ strategy: PHONE_STRATEGY });
        }

        setStep("code");
        return;
      } catch (e2: any) {
        setErr(pickErr(e2, "Failed to create account / send code."));
        return;
      } finally {
        setSubmitting(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- VERIFY CODE (primary) ----------
  const verifyCode = async () => {
    const digits = code.replace(/\D/g, "").slice(0, 6);
    if (!loaded || digits.length < 4) return;

    setSubmitting(true);
    setErr(null);

    try {
      // SIGN IN
      if (flow === "signin") {
        const chosenStrategy = mode === "email" ? EMAIL_STRATEGY : PHONE_STRATEGY;

        const res = await signIn!.attemptFirstFactor({ strategy: chosenStrategy, code: digits });

        if (res.status === "complete") {
          await setActive!({ session: res.createdSessionId });
          router.replace("/");
          return;
        }

        setErr(`Verification not complete (status: ${res.status}).`);
        return;
      }

      // SIGN UP (verify first identifier)
      let res: any;

      if (mode === "email") {
        res = await signUp!.attemptEmailAddressVerification({ code: digits });
      } else {
        res = await signUp!.attemptPhoneNumberVerification({ code: digits });
      }

      if (res.status === "complete") {
        await setActiveSignUp!({ session: res.createdSessionId });
        router.replace("/(onboarding)/name");
        return;
      }

      if (res.status === "missing_requirements") {
        // You enabled BOTH requirements in Clerk: need second identifier verification
        const missing = getMissing(res);
        const nextMode = decideSecondMode(missing);

        setMode2(nextMode);
        setIdentifier2("");
        setCode2("");
        setStep("identifier2");
        return;
      }

      setErr(`Verification not complete (status: ${res.status}).`);
    } catch (e: any) {
      setErr(pickErr(e, "Failed to verify code."));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- SEND CODE (second identifier) ----------
  const sendSecondCode = async () => {
    if (!loaded || !mode2 || !identifier2Ok) return;

    setSubmitting(true);
    setErr(null);

    try {
      if (mode2 === "email") {
        await signUp!.update({ emailAddress: normalizedIdentifier2 });
        await signUp!.prepareEmailAddressVerification({ strategy: EMAIL_STRATEGY });
      } else {
        await signUp!.update({ phoneNumber: normalizedIdentifier2 });
        await signUp!.preparePhoneNumberVerification({ strategy: PHONE_STRATEGY });
      }

      setStep("code2");
    } catch (e: any) {
      setErr(pickErr(e, "Failed to send second code."));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- VERIFY CODE (second identifier) ----------
  const verifySecondCode = async () => {
    const digits = code2.replace(/\D/g, "").slice(0, 6);
    if (!loaded || !mode2 || digits.length < 4) return;

    setSubmitting(true);
    setErr(null);

    try {
      let res: any;

      if (mode2 === "email") {
        res = await signUp!.attemptEmailAddressVerification({ code: digits });
      } else {
        res = await signUp!.attemptPhoneNumberVerification({ code: digits });
      }

      if (res.status === "complete") {
        await setActiveSignUp!({ session: res.createdSessionId });
        router.replace("/(onboarding)/name");
        return;
      }

      setErr(`Verification not complete (status: ${res.status}).`);
    } catch (e: any) {
      setErr(pickErr(e, "Failed to verify second code."));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- UI strings ----------
  const digits1 = code.replace(/\D/g, "").slice(0, 6);
  const digits2 = code2.replace(/\D/g, "").slice(0, 6);

  const title = useMemo(() => {
    if (step === "identifier") return mode === "email" ? "Continue with email" : "Continue with phone";
    if (step === "code") return "Enter the code";
    if (step === "identifier2") return mode2 === "email" ? "Add your email" : "Add your phone";
    return "Enter the code";
  }, [step, mode, mode2]);

  const subtitle = useMemo(() => {
    if (step === "identifier") return "We’ll send a short verification code.";
    if (step === "code") {
      return mode === "email"
        ? `Sent to ${normalizedIdentifier || "your email"}`
        : `Sent to ${normalizedIdentifier || "your phone"}`;
    }
    if (step === "identifier2") {
      return "Your Clerk settings require both email and phone. Add the second one to finish signup.";
    }
    return mode2 === "email"
      ? `Sent to ${normalizedIdentifier2 || "your email"}`
      : `Sent to ${normalizedIdentifier2 || "your phone"}`;
  }, [step, mode, mode2, normalizedIdentifier, normalizedIdentifier2]);

  const canSend1 = identifierOk && !submitting;
  const canSend2 = identifier2Ok && !submitting;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
        <LinearGradient colors={[THEME.bgTop, THEME.bgMid, THEME.bgBot]} style={styles.bg}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={20} color={THEME.text} />
            </TouchableOpacity>

            <Text style={styles.brandText}>Pulse</Text>

            <View style={{ width: 44 }} />
          </View>

          <View style={styles.content}>
            <Text style={styles.h1}>{title}</Text>
            <Text style={styles.h2}>{subtitle}</Text>

            <View style={styles.card}>
              {/* STEP: identifier */}
              {step === "identifier" && (
                <>
                  <Text style={styles.label}>{mode === "email" ? "Email" : "Phone"}</Text>

                  <View style={[styles.field, identifier.length > 0 && (identifierOk ? styles.fieldOk : styles.fieldBad)]}>
                    <Ionicons
                      name={mode === "email" ? "at-outline" : "call-outline"}
                      size={18}
                      color={THEME.muted}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      value={identifier}
                      onChangeText={setIdentifier}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType={mode === "email" ? "email-address" : "phone-pad"}
                      placeholder={mode === "email" ? "you@example.com" : "+1 555 123 4567"}
                      placeholderTextColor={THEME.placeholder}
                      style={styles.input}
                    />
                    {identifier.length > 0 ? (
                      <Ionicons
                        name={identifierOk ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={identifierOk ? THEME.good : THEME.bad}
                      />
                    ) : null}
                  </View>

                  {!!err && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={18} color={THEME.bad} />
                      <Text style={styles.errorText}>{err}</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={sendCode}
                    disabled={!canSend1}
                    style={({ pressed }) => [
                      styles.primaryWrap,
                      (!canSend1 || submitting) && styles.primaryDisabled,
                      pressed && canSend1 && !submitting && styles.primaryPressed,
                    ]}
                  >
                    <LinearGradient colors={[THEME.ctaA, THEME.ctaB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
                      {submitting ? (
                        <ActivityIndicator color="#0B0B12" />
                      ) : (
                        <View style={styles.primaryRow}>
                          <Text style={styles.primaryText}>Send code</Text>
                          <Ionicons name="arrow-forward" size={16} color="#0B0B12" />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                </>
              )}

              {/* STEP: code */}
              {step === "code" && (
                <>
                  <Text style={styles.label}>Code</Text>

                  <View style={styles.otpRow}>
                    {Array.from({ length: 6 }).map((_, i) => {
                      const v = (digits1[i] || "").trim();
                      return (
                        <TextInput
                          key={i}
                          ref={(r) => {
                            otpRefs.current[i] = r;
                          }}
                          value={v}
                          onChangeText={(t) => setOtpAt(i, t)}
                          onKeyPress={(e) => {
                            if (e.nativeEvent.key === "Backspace") backspaceAt(i);
                          }}
                          keyboardType="number-pad"
                          maxLength={1}
                          style={[styles.otpBox, v ? styles.otpFilled : null]}
                          placeholder="•"
                          placeholderTextColor={THEME.placeholder}
                          returnKeyType="done"
                        />
                      );
                    })}
                  </View>

                  {!!err && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={18} color={THEME.bad} />
                      <Text style={styles.errorText}>{err}</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={verifyCode}
                    disabled={digits1.length < 4 || submitting}
                    style={({ pressed }) => [
                      styles.primaryWrap,
                      (digits1.length < 4 || submitting) && styles.primaryDisabled,
                      pressed && digits1.length >= 4 && !submitting && styles.primaryPressed,
                    ]}
                  >
                    <LinearGradient colors={[THEME.ctaA, THEME.ctaB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
                      {submitting ? (
                        <ActivityIndicator color="#0B0B12" />
                      ) : (
                        <View style={styles.primaryRow}>
                          <Text style={styles.primaryText}>Verify</Text>
                          <Ionicons name="checkmark" size={16} color="#0B0B12" />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>

                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setStep("identifier");
                        setCode("");
                        setErr(null);
                        setFlow("signin");
                      }}
                      activeOpacity={0.9}
                      style={styles.secondaryBtn}
                    >
                      <Text style={styles.secondaryText}>Change</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={sendCode} activeOpacity={0.9} style={styles.secondaryBtn} disabled={submitting}>
                      <Text style={styles.secondaryText}>{submitting ? "Sending…" : "Resend"}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.micro}>Didn’t get it? Wait a few seconds or check spam.</Text>
                </>
              )}

              {/* STEP: identifier2 */}
              {step === "identifier2" && (
                <>
                  <Text style={styles.label}>{mode2 === "email" ? "Email" : "Phone"}</Text>

                  <View style={[styles.field, identifier2.length > 0 && (identifier2Ok ? styles.fieldOk : styles.fieldBad)]}>
                    <Ionicons
                      name={mode2 === "email" ? "at-outline" : "call-outline"}
                      size={18}
                      color={THEME.muted}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      value={identifier2}
                      onChangeText={setIdentifier2}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType={mode2 === "email" ? "email-address" : "phone-pad"}
                      placeholder={mode2 === "email" ? "you@example.com" : "+1 555 123 4567"}
                      placeholderTextColor={THEME.placeholder}
                      style={styles.input}
                    />
                    {identifier2.length > 0 ? (
                      <Ionicons
                        name={identifier2Ok ? "checkmark-circle" : "close-circle"}
                        size={18}
                        color={identifier2Ok ? THEME.good : THEME.bad}
                      />
                    ) : null}
                  </View>

                  {!!err && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={18} color={THEME.bad} />
                      <Text style={styles.errorText}>{err}</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={sendSecondCode}
                    disabled={!canSend2}
                    style={({ pressed }) => [
                      styles.primaryWrap,
                      (!canSend2 || submitting) && styles.primaryDisabled,
                      pressed && canSend2 && !submitting && styles.primaryPressed,
                    ]}
                  >
                    <LinearGradient colors={[THEME.ctaA, THEME.ctaB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
                      {submitting ? (
                        <ActivityIndicator color="#0B0B12" />
                      ) : (
                        <View style={styles.primaryRow}>
                          <Text style={styles.primaryText}>Send code</Text>
                          <Ionicons name="arrow-forward" size={16} color="#0B0B12" />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                </>
              )}

              {/* STEP: code2 */}
              {step === "code2" && (
                <>
                  <Text style={styles.label}>Code</Text>

                  <View style={styles.otpRow}>
                    {Array.from({ length: 6 }).map((_, i) => {
                      const v = (digits2[i] || "").trim();
                      return (
                        <TextInput
                          key={i}
                          ref={(r) => {
                            otpRefs2.current[i] = r;
                          }}
                          value={v}
                          onChangeText={(t) => setOtpAt2(i, t)}
                          onKeyPress={(e) => {
                            if (e.nativeEvent.key === "Backspace") backspaceAt2(i);
                          }}
                          keyboardType="number-pad"
                          maxLength={1}
                          style={[styles.otpBox, v ? styles.otpFilled : null]}
                          placeholder="•"
                          placeholderTextColor={THEME.placeholder}
                          returnKeyType="done"
                        />
                      );
                    })}
                  </View>

                  {!!err && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={18} color={THEME.bad} />
                      <Text style={styles.errorText}>{err}</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={verifySecondCode}
                    disabled={digits2.length < 4 || submitting}
                    style={({ pressed }) => [
                      styles.primaryWrap,
                      (digits2.length < 4 || submitting) && styles.primaryDisabled,
                      pressed && digits2.length >= 4 && !submitting && styles.primaryPressed,
                    ]}
                  >
                    <LinearGradient colors={[THEME.ctaA, THEME.ctaB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
                      {submitting ? (
                        <ActivityIndicator color="#0B0B12" />
                      ) : (
                        <View style={styles.primaryRow}>
                          <Text style={styles.primaryText}>Finish</Text>
                          <Ionicons name="checkmark" size={16} color="#0B0B12" />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const THEME = {
  bgTop: "#0B0B12",
  bgMid: "#14102A",
  bgBot: "#090A10",

  text: "#F5F7FF",
  muted: "rgba(245,247,255,0.72)",
  placeholder: "rgba(245,247,255,0.35)",

  border: "rgba(255,255,255,0.14)",
  card: "rgba(255,255,255,0.06)",

  ctaA: "#B8FF6A",
  ctaB: "#6AF0FF",

  good: "#34D399",
  bad: "#FB7185",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bgTop },
  bg: { flex: 1 },

  topBar: {
    paddingHorizontal: 18,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  content: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  h1: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 28,
    letterSpacing: -0.6,
  },
  h2: {
    marginTop: 8,
    color: THEME.muted,
    fontFamily: "Sora_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },

  card: {
    marginTop: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },

  label: {
    color: THEME.muted,
    fontFamily: "Sora_600SemiBold",
    fontSize: 12,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  field: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  fieldOk: { borderColor: "rgba(52,211,153,0.35)", backgroundColor: "rgba(52,211,153,0.06)" },
  fieldBad: { borderColor: "rgba(251,113,133,0.30)", backgroundColor: "rgba(251,113,133,0.06)" },

  input: {
    flex: 1,
    color: THEME.text,
    fontFamily: "Sora_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    textAlign: "center",
    fontSize: 18,
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  otpFilled: { borderColor: "rgba(106,240,255,0.40)", backgroundColor: "rgba(106,240,255,0.07)" },

  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.16)",
  },
  errorText: {
    flex: 1,
    color: "#FFD1DA",
    fontFamily: "Sora_600SemiBold",
    fontSize: 12,
    lineHeight: 18,
  },

  primaryWrap: { marginTop: 14, borderRadius: 18, overflow: "hidden" },
  primary: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryDisabled: { opacity: 0.5 },
  primaryPressed: { transform: [{ scale: 0.99 }] },

  primaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryText: {
    color: "#0B0B12",
    fontFamily: "Sora_700Bold",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  rowActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: THEME.text, fontFamily: "Sora_600SemiBold", fontSize: 13 },

  micro: {
    marginTop: 12,
    color: "rgba(245,247,255,0.70)",
    fontFamily: "Sora_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
