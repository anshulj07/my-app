// app/(onboarding)/dob.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import DateTimePicker from "@react-native-community/datetimepicker";

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function prettyDate(d: Date) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function calcAge(dob: Date) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

const COLORS = {
  bg: "#07070C",
  bg2: "#0B0B12",
  ink: "#FFFFFF",
  inkSoft: "rgba(255,255,255,0.82)",
  muted: "rgba(255,255,255,0.62)",
  faint: "rgba(255,255,255,0.38)",
  card: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",
  primary: "#FF4D6D",
  accent: "#FF8A00",
  danger: "#FB7185",
  success: "#22C55E",
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

  const openPicker = () => {
    setErr(null);
    if (Platform.OS === "android") {
      setAndroidShowPicker(true);
    } else {
      setIosTempDob(dob);
      setIosModalOpen(true);
    }
  };

  const onAndroidChange = (_: any, selected?: Date) => {
    setAndroidShowPicker(false);
    if (selected) setDob(selected);
  };

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");
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

      // ✅ flow: name -> dob -> gender -> interests -> about -> photos
      router.push("/(onboarding)/gender");
    } catch (e: any) {
      setErr(e?.message || "Failed to save DOB.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background glows */}
      <View pointerEvents="none" style={styles.bgLayer}>
        <View style={[styles.glow, styles.glowA]} />
        <View style={[styles.glow, styles.glowB]} />
        <View style={[styles.glow, styles.glowC]} />
        <View style={styles.noiseWash} />
      </View>

      <View style={styles.page}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.stepPill}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>Step 2 of 6</Text>
            </View>

            <View style={styles.heroIcon}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.h1}>When were you born?</Text>
          <Text style={styles.h2}>We use this only to confirm you’re 18+. You can change it later.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Big date display */}
          <TouchableOpacity onPress={openPicker} activeOpacity={0.92} style={styles.dateCard}>
            <View style={styles.dateTopRow}>
              <View style={styles.dateBadge}>
                <Ionicons name="time-outline" size={14} color={COLORS.inkSoft} />
                <Text style={styles.dateBadgeText}>Date of Birth</Text>
              </View>

              <View style={[styles.ageChip, under18 && styles.ageChipBad]}>
                <Ionicons
                  name={under18 ? "alert-circle-outline" : "checkmark-circle-outline"}
                  size={14}
                  color={under18 ? COLORS.danger : COLORS.success}
                />
                <Text style={styles.ageChipText}>{age} years</Text>
              </View>
            </View>

            <Text style={styles.bigDate}>{prettyDate(dob)}</Text>
            <Text style={styles.smallDate}>{toISODate(dob)}</Text>

            <View style={styles.tapRow}>
              <Text style={styles.tapHint}>Tap to change</Text>
              <View style={styles.chev}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
              </View>
            </View>
          </TouchableOpacity>

          {under18 ? (
            <View style={styles.inlineWarn}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.danger} />
              <Text style={styles.inlineWarnText}>You must be at least 18 years old to continue.</Text>
            </View>
          ) : null}

          {!!err && (
            <View style={styles.alert}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
              </View>
              <Text style={styles.alertText}>{err}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.92}
            disabled={!canContinue}
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
          >
            {saving ? (
              <>
                <Text style={styles.ctaText}>Saving…</Text>
                <ActivityIndicator color="#fff" />
              </>
            ) : (
              <>
                <Text style={styles.ctaText}>Continue</Text>
                <View style={styles.ctaIcon}>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>Your DOB won’t be shown publicly.</Text>

          {!API_BASE ? (
            <View style={[styles.alert, { marginTop: 12 }]}>
              <View style={styles.alertIcon}>
                <Ionicons name="bug-outline" size={18} color={COLORS.danger} />
              </View>
              <Text style={styles.alertText}>Config issue: extra.apiBaseUrl is missing.</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Android picker */}
      {androidShowPicker ? (
        <DateTimePicker
          value={dob}
          mode="date"
          display="default"
          onChange={onAndroidChange}
          maximumDate={new Date()}
        />
      ) : null}

      {/* iOS modal (bottom sheet style) */}
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
              <TouchableOpacity
                onPress={() => setIosModalOpen(false)}
                activeOpacity={0.9}
                style={styles.sheetClose}
              >
                <Ionicons name="close" size={18} color={COLORS.ink} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
  },
  glow: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.7,
  },
  glowA: {
    width: 420,
    height: 420,
    top: -160,
    left: -140,
    backgroundColor: "rgba(255,77,109,0.16)",
  },
  glowB: {
    width: 360,
    height: 360,
    bottom: -140,
    right: -120,
    backgroundColor: "rgba(255,138,0,0.14)",
  },
  glowC: {
    width: 280,
    height: 280,
    top: 120,
    right: -90,
    backgroundColor: "rgba(99,102,241,0.10)",
  },
  noiseWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    justifyContent: "center",
    gap: 16,
  },

  hero: { paddingHorizontal: 2, gap: 10 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  stepPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,77,109,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.22)",
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  stepText: { color: COLORS.ink, fontWeight: "900", fontSize: 12, letterSpacing: 0.25 },

  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  h1: { color: COLORS.ink, fontSize: 34, fontWeight: "900", letterSpacing: -1.1, lineHeight: 40 },
  h2: { color: COLORS.muted, fontSize: 14, fontWeight: "700", lineHeight: 20 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },

  dateCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  dateTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  dateBadgeText: { color: COLORS.inkSoft, fontWeight: "900", fontSize: 12, letterSpacing: 0.2 },

  ageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
  },
  ageChipBad: {
    backgroundColor: "rgba(251,113,133,0.10)",
    borderColor: "rgba(251,113,133,0.22)",
  },
  ageChipText: { color: COLORS.ink, fontWeight: "900", fontSize: 12 },

  bigDate: {
    color: COLORS.ink,
    fontWeight: "900",
    fontSize: 26,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  smallDate: { color: COLORS.faint, fontWeight: "800", marginTop: 6 },

  tapRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tapHint: { color: COLORS.muted, fontWeight: "800" },
  chev: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  inlineWarn: {
    marginTop: 12,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.18)",
  },
  inlineWarnText: { color: "#FFE4EA", fontWeight: "800", flex: 1, lineHeight: 18 },

  alert: {
    marginTop: 14,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.24)",
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(251,113,133,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: { color: "#FFE4EA", fontWeight: "900", flex: 1, lineHeight: 18 },

  cta: {
    marginTop: 18,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.3 },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  footerNote: {
    marginTop: 12,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 18,
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
  sheetTitle: { fontWeight: "900", fontSize: 16, color: "#fff" },
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
  sheetBtnGhostText: { color: "#fff", fontWeight: "900" },
  sheetBtnPrimary: { backgroundColor: COLORS.primary },
  sheetBtnPrimaryText: { color: "#fff", fontWeight: "900" },
});
