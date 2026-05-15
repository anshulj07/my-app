// app/(onboarding)/dateOfBirth.tsx — Step 2 of 6
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";

import heroImage from "../../assets/IMG_0016.png";

const STEP = 2;
const TOTAL = 6;

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function prettyDate(d: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function calcAge(dob: Date) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export default function DateOfBirthScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const HEADER_FULL = height * 0.32;

  const [dob, setDob] = useState<Date>(new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const age = useMemo(() => calcAge(dob), [dob]);
  const under18 = age < 18;
  const canContinue = !under18 && !saving;

  const onChangeDate = (_: any, selected?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) setDob(selected);
  };

  const onNext = async () => {
    if (!isLoaded || !user || under18) return;
    setSaving(true);
    setErr(null);
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, dob: toISODate(dob), age } });
      router.push("/(onboarding)/gender");
    } catch (e: any) {
      setErr(e?.message || "Failed to save date of birth.");
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepLabel}>STEP {STEP} OF {TOTAL}</Text>
        <Text style={styles.title}>When were you born?</Text>
        <Text style={styles.subtitle}>We use this only to confirm you're 18+. It won't be shown publicly.</Text>

        {/* Date card */}
        <TouchableOpacity
          onPress={() => setShowPicker(v => !v)}
          activeOpacity={0.85}
          style={[styles.dateCard, showPicker && styles.dateCardOpen]}
        >
          <View style={styles.dateCardLeft}>
            <View style={styles.dateIconBox}>
              <Ionicons name="calendar-outline" size={20} color="#6B46C1" />
            </View>
            <View>
              <Text style={styles.dateCardLabel}>Date of Birth</Text>
              <Text style={styles.dateCardValue}>{prettyDate(dob)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.ageBadge, under18 && styles.ageBadgeWarn]}>
              <Text style={[styles.ageBadgeText, under18 && { color: "#EF4444" }]}>{age} yrs</Text>
            </View>
            <Ionicons name={showPicker ? "chevron-up" : "chevron-down"} size={16} color="#aaa" />
          </View>
        </TouchableOpacity>

        {showPicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={dob}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeDate}
              maximumDate={new Date()}
              textColor="#111"
              style={styles.picker}
            />
            {Platform.OS === "ios" && (
              <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {under18 && (
          <View style={styles.warnBox}>
            <Ionicons name="information-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.warnText}>You must be at least 18 years old to continue.</Text>
          </View>
        )}

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
        <TouchableOpacity onPress={() => router.push("/(onboarding)/gender")} style={styles.skipBtn}>
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

  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E0F5",
    padding: 16,
  },
  dateCardOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dateCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE8F8",
    alignItems: "center",
    justifyContent: "center",
  },
  dateCardLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    marginBottom: 2,
  },
  dateCardValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.3,
  },
  ageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#EDE8F8",
  },
  ageBadgeWarn: { backgroundColor: "#FEE2E2" },
  ageBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B46C1",
  },

  pickerWrap: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: "#E5E0F5",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    paddingBottom: 8,
  },
  picker: { width: "100%" },
  doneBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#5B3FA0",
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  warnBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  warnText: { fontSize: 13, color: "#EF4444", flex: 1, lineHeight: 18 },

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
