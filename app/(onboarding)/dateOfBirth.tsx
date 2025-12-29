// app/(onboarding)/dob.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";

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
  warn: "#FFB020",
};

export default function DobScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [dob, setDob] = useState<Date>(new Date(2000, 0, 1));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [androidShowPicker, setAndroidShowPicker] = useState(false);
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [iosTempDob, setIosTempDob] = useState<Date>(dob);

  const age = useMemo(() => calcAge(dob), [dob]);
  const under18 = age < 18;
  const canContinue = useMemo(() => !under18 && !saving, [under18, saving]);

  // Animations (subtle)
  const cardScale = useRef(new Animated.Value(1)).current;
  const pulseAge = useRef(new Animated.Value(1)).current;

  const bumpCard = () => {
    cardScale.setValue(0.99);
    Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 180, useNativeDriver: true }).start();
  };

  const bumpAge = () => {
    pulseAge.setValue(0.98);
    Animated.spring(pulseAge, { toValue: 1, friction: 5, tension: 220, useNativeDriver: true }).start();
  };

  const openPicker = () => {
    setErr(null);
    bumpCard();

    if (Platform.OS === "android") {
      setAndroidShowPicker(true);
    } else {
      setIosTempDob(dob);
      setIosModalOpen(true);
    }
  };

  const onAndroidChange = (_: any, selected?: Date) => {
    setAndroidShowPicker(false);
    if (selected) {
      setDob(selected);
      bumpAge();
    }
  };

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) throw new Error("Config issue: extra.apiBaseUrl is missing.");
      if (under18) throw new Error("You must be at least 18 years old to continue.");

      const apiBase = API_BASE.replace(/\/$/, "");
      const payload = { clerkUserId: user.id, dob: toISODate(dob), age };

      const res = await fetch(`${apiBase}/api/onboarding/dateOfBirth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `Failed to save DOB (${res.status}).`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      router.push("/(onboarding)/gender");
    } catch (e: any) {
      setErr(e?.message || "Failed to save DOB.");
    } finally {
      setSaving(false);
    }
  };

  const title = "When were you born?";
  const subtitle = "We only use this to confirm you’re 18+. You can change it later.";

  const ageLabel = `${age} years`;
  const ageIcon = under18 ? "alert-circle-outline" : "checkmark-circle-outline";
  const ageColor = under18 ? THEME.bad : THEME.good;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[THEME.bgTop, THEME.bgMid, THEME.bgBot]} style={styles.bg}>
        {/* Top bar (match sign-in/gender) */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={THEME.text} />
          </TouchableOpacity>

          <Text style={styles.brandText}>Pulse</Text>

          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          {/* Header row with step pill */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{title}</Text>
              <Text style={styles.h2}>{subtitle}</Text>
            </View>

            <View style={styles.stepPill}>
              <Ionicons name="calendar-outline" size={14} color={THEME.ctaB} />
              <Text style={styles.stepText}>Step 2 of 6</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Animated.View style={{ transform: [{ scale: cardScale }] }}>
              <Pressable onPress={openPicker} style={({ pressed }) => [styles.dateCard, pressed && styles.pressed]}>
                <View style={styles.dateTopRow}>
                  <View style={styles.dateBadge}>
                    <Ionicons name="time-outline" size={14} color={THEME.muted} />
                    <Text style={styles.dateBadgeText}>Date of Birth</Text>
                  </View>

                  <Animated.View style={{ transform: [{ scale: pulseAge }] }}>
                    <View
                      style={[
                        styles.ageChip,
                        {
                          backgroundColor: under18 ? "rgba(251,113,133,0.10)" : "rgba(52,211,153,0.10)",
                          borderColor: under18 ? "rgba(251,113,133,0.22)" : "rgba(52,211,153,0.22)",
                        },
                      ]}
                    >
                      <Ionicons name={ageIcon as any} size={14} color={ageColor} />
                      <Text style={styles.ageChipText}>{ageLabel}</Text>
                    </View>
                  </Animated.View>
                </View>

                <Text style={styles.bigDate}>{prettyDate(dob)}</Text>
                <Text style={styles.smallDate}>{toISODate(dob)}</Text>

                <View style={styles.tapRow}>
                  <View style={styles.tapHintRow}>
                    <Ionicons name="hand-left-outline" size={14} color={THEME.muted} />
                    <Text style={styles.tapHint}>Tap to change</Text>
                  </View>
                  <View style={styles.chev}>
                    <Ionicons name="chevron-forward" size={18} color={THEME.muted} />
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {under18 ? (
              <View style={styles.inlineWarn}>
                <Ionicons name="information-circle-outline" size={18} color={THEME.bad} />
                <Text style={styles.inlineWarnText}>You must be at least 18 years old to continue.</Text>
              </View>
            ) : null}

            {!!err && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={THEME.bad} />
                <Text style={styles.errorText}>{err}</Text>
              </View>
            )}

            {!API_BASE ? (
              <View style={[styles.errorBox, { marginTop: 12 }]}>
                <Ionicons name="bug-outline" size={18} color={THEME.bad} />
                <Text style={styles.errorText}>Config issue: extra.apiBaseUrl is missing.</Text>
              </View>
            ) : null}

            {/* CTA */}
            <Pressable
              onPress={onNext}
              disabled={!canContinue}
              style={({ pressed }) => [
                styles.primaryWrap,
                (!canContinue || saving) && styles.primaryDisabled,
                pressed && canContinue && !saving && styles.primaryPressed,
              ]}
            >
              <LinearGradient
                colors={[THEME.ctaA, THEME.ctaB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primary}
              >
                {saving ? (
                  <ActivityIndicator color="#0B0B12" />
                ) : (
                  <View style={styles.primaryRow}>
                    <Text style={styles.primaryText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color="#0B0B12" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={styles.micro}>Your DOB won’t be shown publicly.</Text>
          </View>
        </View>

        {/* Android picker */}
        {androidShowPicker ? (
          <DateTimePicker value={dob} mode="date" display="default" onChange={onAndroidChange} maximumDate={new Date()} />
        ) : null}

        {/* iOS modal */}
        <Modal
          visible={iosModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIosModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHandle} />
              </View>

              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>Select date</Text>
                <TouchableOpacity onPress={() => setIosModalOpen(false)} activeOpacity={0.9} style={styles.sheetClose}>
                  <Ionicons name="close" size={18} color={THEME.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={iosTempDob}
                  mode="date"
                  display="spinner"
                  onChange={(_, selected) => selected && setIosTempDob(selected)}
                  maximumDate={new Date()}
                />
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  onPress={() => setIosModalOpen(false)}
                  activeOpacity={0.9}
                  style={[styles.sheetBtn, styles.sheetBtnGhost]}
                >
                  <Text style={styles.sheetBtnGhostText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDob(iosTempDob);
                    setIosModalOpen(false);
                    bumpAge();
                  }}
                  activeOpacity={0.9}
                  style={[styles.sheetBtn, styles.sheetBtnPrimary]}
                >
                  <Text style={styles.sheetBtnPrimaryText}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 8 }} />
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

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

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

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

  stepPill: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepText: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 12, letterSpacing: 0.2 },

  card: {
    marginTop: 16,
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

  dateCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pressed: { opacity: 0.96 },

  dateTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },

  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  dateBadgeText: { color: THEME.muted, fontFamily: "Sora_700Bold", fontSize: 12, letterSpacing: 0.2 },

  ageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  ageChipText: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 12 },

  bigDate: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 26,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  smallDate: { color: "rgba(245,247,255,0.45)", fontFamily: "Sora_600SemiBold", marginTop: 6 },

  tapRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tapHintRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tapHint: { color: THEME.muted, fontFamily: "Sora_600SemiBold" },

  chev: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  inlineWarn: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.16)",
  },
  inlineWarnText: { flex: 1, color: "#FFD1DA", fontFamily: "Sora_600SemiBold", fontSize: 12, lineHeight: 18 },

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

  micro: {
    marginTop: 12,
    color: "rgba(245,247,255,0.70)",
    fontFamily: "Sora_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0E0E17",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sheetHeader: { alignItems: "center", paddingBottom: 10 },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: { fontFamily: "Sora_700Bold", fontSize: 16, color: THEME.text },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pickerWrap: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  sheetBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sheetBtnGhost: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  sheetBtnGhostText: { color: THEME.text, fontFamily: "Sora_700Bold" },
  sheetBtnPrimary: { backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  sheetBtnPrimaryText: { color: THEME.text, fontFamily: "Sora_700Bold" },
});
