// app/(onboarding)/username.tsx — Step 2 of 7
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

import heroImage from "../../assets/IMG_0016.png";

const STEP = 2;
const TOTAL = 7;
const HEADER_MIN = 64;
const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

type CheckState = "idle" | "invalid" | "valid";

export default function UsernameScreen() {
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

  const [raw, setRaw] = useState("");
  const [check, setCheck] = useState<CheckState>("idle");
  const [hint, setHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setRaw(cleaned);
    setErr(null);
    if (!cleaned) { setCheck("idle"); setHint(null); return; }
    if (!USERNAME_RE.test(cleaned)) {
      setCheck("invalid");
      setHint(cleaned.length < 3 ? "At least 3 characters" : "Only lowercase letters, numbers, underscores");
    } else {
      setCheck("valid");
      setHint(null);
    }
  };

  const canContinue = check === "valid" && !saving;

  const onNext = async () => {
    if (!isLoaded || !user || !canContinue) return;
    setSaving(true);
    setErr(null);
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, username: raw } });
      router.push("/(onboarding)/dateOfBirth");
    } catch (e: any) {
      setErr(e?.message || "Failed to save username.");
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
          {/* Image taller than container + bottom:0 → shows lower portion of photo */}
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

        {/* White content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepLabel}>STEP {STEP} OF {TOTAL}</Text>
          <Text style={styles.title}>Choose your username</Text>
          <Text style={styles.subtitle}>This is how other members will find and mention you.</Text>

          <View style={styles.fieldGroup}>
            <View style={[
              styles.fieldWrap,
              check === "valid" && styles.fieldWrapOk,
              check === "invalid" && styles.fieldWrapErr,
            ]}>
              <Text style={styles.atPrefix}>@</Text>
              <TextInput
                value={raw}
                onChangeText={handleChange}
                placeholder="your_username"
                placeholderTextColor="#C0B8D8"
                style={styles.fieldInput}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={canContinue ? onNext : undefined}
              />
              {raw.length > 0 && (
                <Ionicons
                  name={check === "valid" ? "checkmark-circle" : check === "invalid" ? "close-circle" : "ellipse-outline"}
                  size={20}
                  color={check === "valid" ? "#22C55E" : check === "invalid" ? "#EF4444" : "#ccc"}
                />
              )}
            </View>
            <Text style={[
              styles.helperText,
              check === "invalid" && { color: "#EF4444" },
              check === "valid" && { color: "#22C55E" },
            ]}>
              {/* {hint || "3–30 characters · only a–z, 0–9, _"} */}
            </Text>
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
          <TouchableOpacity onPress={() => router.push("/(onboarding)/dateOfBirth")} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
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

  fieldGroup: { marginBottom: 8 },
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
  fieldWrapErr: { borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
  atPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B46C1",
    marginRight: 4,
  },
  fieldInput: {
    flex: 1,
    color: "#111",
    fontSize: 15,
    paddingVertical: 0,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: "#999",
    paddingHorizontal: 4,
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
  skipBtn: { alignItems: "center", paddingVertical: 6 },
  skipText: { color: "#999", fontSize: 14, fontWeight: "600" },
});
