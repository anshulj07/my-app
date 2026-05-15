// app/(auth)/sign-up.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);

  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationLoading(false);
        return;
      }
      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });
      if (place) {
        const city = place.city || place.subregion || place.region || "";
        const country = place.country || "";
        setLocation([city, country].filter(Boolean).join(", "));
      }
    } catch {
      // silently fail — user can type manually
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const emailOk = useMemo(() => emailAddress.trim().includes("@"), [emailAddress]);
  const pwStrength = useMemo(() => {
    const len = password.length;
    if (len === 0) return 0;
    if (len < 5) return 1;
    if (len < 8) return 2;
    if (len < 12) return 3;
    return 4;
  }, [password]);
  const pwOk = password.length >= 10;

  const canSubmitSignUp =
    !!fullName.trim() &&
    !!emailAddress.trim() &&
    emailOk &&
    pwOk &&
    ageChecked &&
    recaptchaChecked &&
    !submitting;

  const codeDigits = useMemo(() => code.replace(/\D/g, ""), [code]);
  const canSubmitVerify = codeDigits.length === 6 && !submitting;

  const pickErr = (e: any, fallback: string) =>
    e?.errors?.[0]?.longMessage || e?.errors?.[0]?.message || e?.message || fallback;

  const onSignUpPress = async () => {
    if (!isLoaded || !signUp) return;
    setSubmitting(true);
    setErr(null);
    try {
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
        firstName,
        lastName,
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
      const attempt = await signUp.attemptEmailAddressVerification({ code: codeDigits });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/(onboarding)/username");
        return;
      }
      if (attempt.status === "missing_requirements") {
        const missing = (attempt as any)?.missingFields;
        if (Array.isArray(missing) && missing.length) {
          setErr(`Missing required fields: ${missing.join(", ")}`);
        } else {
          setErr("Missing required fields. Check Clerk dashboard settings.");
        }
        return;
      }
      setErr(`Verification not complete (status: ${attempt.status}).`);
    } catch (e: any) {
      setErr(pickErr(e, "Failed to verify code."));
    } finally {
      setSubmitting(false);
    }
  };

  const strengthColors = ["#ddd", "#FF4D4D", "#FF8C00", "#FFC107", "#22C55E"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Close / Back */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() =>
              pendingVerification
                ? (setPendingVerification(false), setCode(""), setErr(null))
                : router.back()
            }
            hitSlop={10}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>

          {pendingVerification ? (
            // ── Verification view ─────────────────────────────────────────────
            <>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code we sent to {emailAddress.trim()}.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>6-digit code</Text>
                <View style={styles.fieldWrap}>
                  <TextInput
                    value={codeDigits}
                    onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    placeholder="123456"
                    placeholderTextColor="#bbb"
                    style={[styles.fieldInput, styles.codeInput]}
                    maxLength={6}
                    returnKeyType="done"
                  />
                </View>
                <Text style={styles.helperText}>Check spam/promotions if you don't see it.</Text>
              </View>

              {!!err && <Text style={styles.errText}>{err}</Text>}

              <TouchableOpacity
                onPress={onVerifyPress}
                disabled={!canSubmitVerify}
                style={[styles.submitBtn, !canSubmitVerify && { opacity: 0.5 }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Verify & continue</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // ── Sign up form ──────────────────────────────────────────────────
            <>
              <Text style={styles.title}>Finish signing up</Text>

              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Your name</Text>
                <View style={styles.fieldWrap}>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your full name here"
                    placeholderTextColor="#bbb"
                    style={styles.fieldInput}
                  />
                </View>
                <Text style={styles.helperText}>
                  Your name will be public on your profile
                </Text>
              </View>

              {/* Email */}
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
                    placeholderTextColor="#bbb"
                    style={styles.fieldInput}
                  />
                </View>
                <Text style={styles.helperText}>
                  We'll use your email address to send you updates and to verify your account
                </Text>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <Ionicons name="information-circle-outline" size={16} color="#aaa" />
                </View>
                <View style={styles.fieldWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPw}
                    placeholder=""
                    placeholderTextColor="#bbb"
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
                <Text style={styles.helperText}>At least 10 characters are required</Text>
                {/* Strength bars */}
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            pwStrength >= n ? strengthColors[pwStrength] : "#e0e0e0",
                        },
                      ]}
                    />
                  ))}
                  {pwStrength > 0 && (
                    <Text style={[styles.strengthLabel, { color: strengthColors[pwStrength] }]}>
                      {strengthLabels[pwStrength]}
                    </Text>
                  )}
                </View>
              </View>

              {/* Location */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Location</Text>
                <View style={styles.fieldWrap}>
                  <Ionicons name="location-outline" size={18} color="#888" style={styles.fieldIcon} />
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Detecting location…"
                    placeholderTextColor="#bbb"
                    style={styles.fieldInput}
                  />
                  <TouchableOpacity
                    onPress={detectLocation}
                    disabled={locationLoading}
                    style={styles.locationRefreshBtn}
                    hitSlop={10}
                  >
                    {locationLoading
                      ? <ActivityIndicator size="small" color="#7C5CBF" />
                      : <Ionicons name="navigate-outline" size={18} color="#7C5CBF" />
                    }
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  We'll use your location to show events near you.
                </Text>
              </View>

              {/* Age */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <Ionicons name="information-circle-outline" size={16} color="#aaa" />
                </View>
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => setAgeChecked((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, ageChecked && styles.checkboxChecked]}>
                    {ageChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.checkLabel}>I am 18 years of age or older.</Text>
                </TouchableOpacity>
              </View>

              {/* reCAPTCHA */}
              <TouchableOpacity
                style={styles.recaptchaBox}
                onPress={() => setRecaptchaChecked(v => !v)}
                activeOpacity={0.8}
              >
                <View style={styles.recaptchaLeft}>
                  <View style={[styles.recaptchaCheckbox, recaptchaChecked && styles.recaptchaCheckboxChecked]}>
                    {recaptchaChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.recaptchaText}>I'm not a robot</Text>
                </View>
                <View style={styles.recaptchaRight}>
                  <Ionicons name="sync-outline" size={28} color="#4A90D9" />
                  <Text style={styles.recaptchaBrand}>reCAPTCHA</Text>
                </View>
              </TouchableOpacity>

              {!!err && <Text style={styles.errText}>{err}</Text>}

              <TouchableOpacity
                onPress={onSignUpPress}
                disabled={!canSubmitSignUp}
                style={[styles.submitBtn, !canSubmitSignUp && { opacity: 0.45 }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Create account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.logInLink}
                activeOpacity={0.85}
              >
                <Text style={styles.logInLinkText}>Already have an account? Log in</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  page: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 24,
    lineHeight: 20,
  },

  fieldGroup: { marginBottom: 20 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
  },
  fieldIcon: { marginRight: 8 },
  locationRefreshBtn: { paddingLeft: 8, paddingRight: 4 },
  fieldInput: {
    flex: 1,
    color: "#111",
    fontSize: 15,
    paddingVertical: 14,
  },
  eyeBtn: { paddingLeft: 8 },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: "#888",
    lineHeight: 16,
    paddingHorizontal: 4,
  },

  // Password strength
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
    width: 44,
  },

  // Checkbox
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#2D1F4B",
    borderColor: "#2D1F4B",
  },
  checkLabel: { fontSize: 14, color: "#333", flex: 1, lineHeight: 20 },

  // reCAPTCHA
  recaptchaBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 20,
  },
  recaptchaLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  recaptchaCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 3,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  recaptchaCheckboxChecked: {
    backgroundColor: "#4A90D9",
    borderColor: "#4A90D9",
  },
  recaptchaText: { fontSize: 14, color: "#333", fontWeight: "500" },
  recaptchaRight: { alignItems: "center", gap: 2 },
  recaptchaBrand: { fontSize: 9, color: "#888", fontWeight: "600", letterSpacing: 0.3 },

  // Error
  errText: { color: "#e53935", fontSize: 13, marginBottom: 14, marginLeft: 4 },

  // Submit
  submitBtn: {
    height: 52,
    borderRadius: 28,
    backgroundColor: "#2D1F4B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // Code input
  codeInput: { letterSpacing: 10, textAlign: "center" },

  // Log in link
  logInLink: { alignItems: "center", paddingVertical: 6 },
  logInLinkText: {
    color: "#555",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
