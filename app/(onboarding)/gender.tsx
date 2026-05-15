// app/(onboarding)/gender.tsx — Step 3 of 6
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";

import heroImage from "../../assets/IMG_0016.png";

const STEP = 3;
const TOTAL = 6;

const OPTIONS = [
  { value: "Man", icon: "male" as const, desc: "He / Him" },
  { value: "Woman", icon: "female" as const, desc: "She / Her" },
  { value: "Non-binary", icon: "sparkles-outline" as const, desc: "They / Them" },
  { value: "Prefer not to say", icon: "eye-off-outline" as const, desc: "Keep private" },
  { value: "Other", icon: "ellipsis-horizontal" as const, desc: "Self-described" },
] as const;

type GenderValue = typeof OPTIONS[number]["value"];

export default function GenderScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const HEADER_FULL = height * 0.32;

  const [selected, setSelected] = useState<GenderValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canContinue = !!selected && !saving;

  const onNext = async () => {
    if (!isLoaded || !user || !selected) return;
    setSaving(true);
    setErr(null);
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, gender: selected } });
      router.push("/(onboarding)/interests");
    } catch (e: any) {
      setErr(e?.message || "Failed to save gender.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>

      {/* Header with hero image */}
      <View style={[styles.header, { height: HEADER_FULL }]}>
        <Image source={heroImage} style={{ width, height: HEADER_FULL }} resizeMode="cover" />
        <View style={[styles.headerInner, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* White content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepLabel}>STEP {STEP} OF {TOTAL}</Text>
        <Text style={styles.title}>How do you identify?</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience. You can change it anytime.</Text>

        <View style={styles.optionsList}>
          {OPTIONS.map((opt) => {
            const on = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setSelected(opt.value)}
                activeOpacity={0.85}
                style={[styles.option, on && styles.optionOn]}
              >
                <View style={[styles.optionIconBox, on && styles.optionIconBoxOn]}>
                  <Ionicons name={opt.icon} size={18} color={on ? "#fff" : "#6B46C1"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, on && styles.optionTextOn]}>{opt.value}</Text>
                  <Text style={[styles.optionDesc, on && styles.optionDescOn]}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
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
            : <Text style={styles.ctaText}>{selected ? "Continue" : "Select an option"}</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(onboarding)/interests")} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>

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

  optionsList: { gap: 10 },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E0F5",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionOn: {
    backgroundColor: "#EDE8F8",
    borderColor: "#6B46C1",
  },

  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE8F8",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconBoxOn: { backgroundColor: "#6B46C1" },

  optionText: { fontSize: 15, fontWeight: "700", color: "#111" },
  optionTextOn: { color: "#3D2875" },

  optionDesc: { fontSize: 12, color: "#999", marginTop: 2 },
  optionDescOn: { color: "#7C5CBF" },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: "#6B46C1" },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#6B46C1",
  },

  errText: { color: "#EF4444", fontSize: 13, marginTop: 12 },

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
