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
        // ✅ Let AuthGate / index route user to /newApp/home
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="map-outline" size={18} color="#0A84FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>Welcome back</Text>
              <Text style={styles.tagline}>Sign in to see nearby pins</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.sub}>Use the same email you signed up with.</Text>

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

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  placeholder="••••••••"
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
            </View>

            {!!err && (
              <View style={styles.errBox}>
                <Ionicons name="warning-outline" size={18} color="#DC2626" />
                <Text style={styles.errText}>{err}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={onSignInPress}
              activeOpacity={0.9}
              disabled={!canSubmit}
              style={[styles.primaryBtn, !canSubmit && { opacity: 0.55 }]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryText}>Sign in</Text>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-up")}
              activeOpacity={0.9}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>New here? Create an account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Secure sign-in powered by Clerk.</Text>
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

  footer: {
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: 10,
  },
});
