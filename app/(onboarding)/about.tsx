// app/(onboarding)/about.tsx — Step 5 of 6
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

const STEP = 5;
const TOTAL = 6;
const HEADER_MIN = 64;
const MAX_LEN = 500;
const MIN_LEN = 10;

const QUICK_FILLS = [
  "Coffee, hikes, and spontaneous plans. Always down to explore new spots and meet new people.",
  "Tech person by day, foodie by night. Love discovering hidden gems around the city.",
  "Into outdoor adventures, live music, and good conversations over great food.",
];

export default function AboutScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const HEADER_FULL = height * 0.3;

  const headerAnim = useRef(new Animated.Value(height * 0.3)).current;

  useEffect(() => {
    const showE = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideE = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const dur = Platform.OS === "ios" ? 250 : 180;

    const show = Keyboard.addListener(showE, () =>
      Animated.timing(headerAnim, { toValue: HEADER_MIN, duration: dur, useNativeDriver: false }).start()
    );
    const hide = Keyboard.addListener(hideE, () =>
      Animated.timing(headerAnim, { toValue: height * 0.3, duration: dur, useNativeDriver: false }).start()
    );
    return () => { show.remove(); hide.remove(); };
  }, [headerAnim, height]);

  const [about, setAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const len = about.length;
  const remaining = MAX_LEN - len;
  const canContinue = about.trim().length >= MIN_LEN && !saving;

  const onNext = async () => {
    if (!isLoaded || !user) return;
    setSaving(true);
    setErr(null);
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, about: about.trim() } });
      router.push("/(onboarding)/photos");
    } catch (e: any) {
      setErr(e?.message || "Failed to save bio.");
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
        <Animated.View style={[styles.header, { height: headerAnim }]}>
          <Image source={heroImage} style={{ width, height: HEADER_FULL }} resizeMode="cover" />
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
          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.subtitle}>
            Write a short bio. It shows on your profile and helps others know what you're about.
          </Text>

          {/* Bio input */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Your bio</Text>
              <Text style={[styles.counter, remaining <= 60 && styles.counterWarn]}>{len}/{MAX_LEN}</Text>
            </View>
            <View style={[styles.textareaWrap, about.trim().length > 0 && styles.textareaWrapActive]}>
              <TextInput
                value={about}
                onChangeText={(t) => setAbout(t.slice(0, MAX_LEN))}
                placeholder="I'm into coffee, hikes, and finding underrated spots around the city. Always up for a spontaneous meetup!"
                placeholderTextColor="#C0B8D8"
                style={styles.textarea}
                multiline
                textAlignVertical="top"
                maxLength={MAX_LEN}
              />
            </View>
            <Text style={[styles.helperText, about.trim().length >= MIN_LEN && { color: "#22C55E" }]}>
              {about.trim().length < MIN_LEN
                ? `Add at least ${MIN_LEN - about.trim().length} more characters`
                : "Looks good!"}
            </Text>
          </View>

          {/* Quick fills */}
          <View style={styles.quickSection}>
            <Text style={styles.quickLabel}>Need inspiration?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
              {QUICK_FILLS.map((fill, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.85}
                  onPress={() => { if (!about.trim()) setAbout(fill); }}
                  style={styles.quickChip}
                >
                  <Ionicons name="flash-outline" size={13} color="#6B46C1" />
                  <Text style={styles.quickChipText} numberOfLines={2}>{fill}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
          <TouchableOpacity onPress={() => router.push("/(onboarding)/photos")} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#3D2875" },

  header: {
    overflow: "hidden",
    position: "relative",
  },
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
    marginBottom: 24,
  },

  fieldGroup: { marginBottom: 20 },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fieldLabel: { fontSize: 14, fontWeight: "700", color: "#222" },
  counter: { fontSize: 12, color: "#aaa", fontWeight: "600" },
  counterWarn: { color: "#ea580c" },

  textareaWrap: {
    borderWidth: 1.5,
    borderColor: "#E5E0F5",
    borderRadius: 14,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 140,
  },
  textareaWrapActive: {
    borderColor: "#6B46C1",
    backgroundColor: "#fff",
  },
  textarea: {
    flex: 1,
    color: "#111",
    fontSize: 15,
    lineHeight: 22,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: "#aaa",
    paddingHorizontal: 4,
  },

  quickSection: { marginBottom: 20 },
  quickLabel: { fontSize: 13, fontWeight: "700", color: "#444", marginBottom: 10 },
  quickScroll: { gap: 10, paddingBottom: 4 },
  quickChip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EDE8F8",
    borderRadius: 12,
    padding: 12,
    maxWidth: 230,
  },
  quickChipText: {
    fontSize: 12,
    color: "#3D2875",
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
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
