// app/(onboarding)/name.tsx — Step 1 of 7
import { useRef, useEffect, useState } from "react";
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
  Animated,
  Keyboard,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { apiFetch } from "../../lib/apiFetch";

import heroImage from "../../assets/IMG_0016.png";

const STEP = 1;
const TOTAL = 7;
const HEADER_MIN = 64;

export default function NameScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const HEADER_FULL = height * 0.35;

  const headerAnim = useRef(new Animated.Value(HEADER_FULL)).current;

  useEffect(() => {
    const showE = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideE = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const dur = Platform.OS === "ios" ? 250 : 180;
    const show = Keyboard.addListener(showE, () =>
      Animated.timing(headerAnim, { toValue: HEADER_MIN, duration: dur, useNativeDriver: false }).start()
    );
    const hide = Keyboard.addListener(hideE, () =>
      Animated.timing(headerAnim, { toValue: HEADER_FULL, duration: dur, useNativeDriver: false }).start()
    );
    return () => { show.remove(); hide.remove(); };
  }, [headerAnim, height]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pre-fill from Clerk — populated automatically for Google OAuth users
  useEffect(() => {
    if (isLoaded && user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
    }
  }, [isLoaded, user?.id]);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const canContinue = firstName.trim().length >= 1 && !saving;

  const onNext = async () => {
    if (!isLoaded || !user || !canContinue) return;
    setSaving(true);
    setErr(null);
    try {
      if (!API_BASE) throw new Error("Missing API base URL.");
      const payload = {
        clerkUserId: user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: user.primaryEmailAddress?.emailAddress ?? "",
      };
      const res = await apiFetch(`${API_BASE}/api/onboarding/name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = `Failed to save name (${res.status}).`;
        try { const j = JSON.parse(text); msg = j?.message || j?.error || msg; } catch {}
        throw new Error(msg);
      }
      router.push("/(onboarding)/username");
    } catch (e: any) {
      setErr(e?.message || "Failed to save name.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        {/* Animated collapsing header */}
        <Animated.View style={{ height: headerAnim, overflow: "hidden" }}>
          <Image
            source={heroImage}
            style={{ width, height: HEADER_FULL }}
            resizeMode="cover"
          />
          <View style={[styles.headerInner, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* White content card */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepLabel}>STEP {STEP} OF {TOTAL}</Text>
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>This helps people recognize you nearby.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>First name</Text>
            <View style={[styles.fieldWrap, firstName.trim().length > 0 && styles.fieldWrapOk]}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Anshul"
                placeholderTextColor="#C0B8D8"
                style={styles.fieldInput}
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                returnKeyType="next"
              />
              {firstName.trim().length > 0 && (
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              )}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Last name{" "}
              <Text style={styles.optional}>(optional)</Text>
            </Text>
            <View style={styles.fieldWrap}>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="e.g. Jain"
                placeholderTextColor="#C0B8D8"
                style={styles.fieldInput}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={canContinue ? onNext : undefined}
              />
            </View>
          </View>

          {!!err && <Text style={styles.errText}>{err}</Text>}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            onPress={onNext}
            disabled={!canContinue}
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>Continue</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#3D2875" },

  headerInner: {
    paddingHorizontal: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },

  stepLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B46C1",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
    marginBottom: 28,
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 8,
  },
  optional: {
    fontSize: 12,
    fontWeight: "500",
    color: "#999",
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E0F5",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
  },
  fieldWrapOk: { borderColor: "#22C55E", backgroundColor: "#F0FDF4" },
  fieldInput: {
    flex: 1,
    color: "#111",
    fontSize: 15,
    paddingVertical: 0,
  },
  errText: { color: "#EF4444", fontSize: 13, marginBottom: 14 },

  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EDF8",
  },
  cta: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#5B3FA0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  ctaDisabled: { backgroundColor: "#C5B8E8" },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
