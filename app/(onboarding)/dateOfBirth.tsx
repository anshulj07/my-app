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

function calcAge(dob: Date) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

const COLORS = {
  bg: "#0B0B12",
  card: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",
  ink: "#FFFFFF",
  muted: "rgba(255,255,255,0.62)",
  primary: "#FF4D6D",
  primary2: "#FF8A00",
  danger: "#FB7185",
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
  const canContinue = useMemo(() => age >= 18 && !saving, [age, saving]);

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
      if (age < 18) throw new Error("You must be at least 18 years old to continue.");

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

      router.push("/(onboarding)/interests");
    } catch (e: any) {
      setErr(e?.message || "Failed to save DOB.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>Step 3 of 4</Text>
            </View>

            <View style={styles.spark}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.h1}>Your date of birth</Text>
          <Text style={styles.h2}>We only use this to confirm you’re 18+. You can edit it later.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Picker tile */}
          <TouchableOpacity onPress={openPicker} activeOpacity={0.92} style={styles.pickTile}>
            <View style={styles.pickLeft}>
              <View style={styles.pickIcon}>
                <Ionicons name="calendar" size={18} color={COLORS.muted} />
              </View>
              <View style={{ gap: 3 }}>
                <Text style={styles.pickLabel}>Date of birth</Text>
                <Text style={styles.pickValue}>{toISODate(dob)}</Text>
              </View>
            </View>

            <View style={styles.pickRight}>
              <View style={styles.agePill}>
                <Text style={styles.ageText}>{age}</Text>
                <Text style={styles.ageCaption}>years</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
            </View>
          </TouchableOpacity>

          {age < 18 ? (
            <View style={[styles.hint, { marginTop: 12 }]}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.danger} />
              <Text style={styles.hintText}>You must be at least 18 years old to continue.</Text>
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

      {/* iOS modal picker */}
      <Modal
        visible={iosModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIosModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select date</Text>
              <TouchableOpacity
                onPress={() => setIosModalOpen(false)}
                activeOpacity={0.9}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={iosTempDob}
              mode="date"
              display="spinner"
              onChange={(_, selected) => selected && setIosTempDob(selected)}
              maximumDate={new Date()}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIosModalOpen(false)}
                activeOpacity={0.9}
                style={[styles.modalBtn, styles.modalBtnGhost]}
              >
                <Text style={styles.modalBtnGhostText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDob(iosTempDob);
                  setIosModalOpen(false);
                }}
                activeOpacity={0.9}
                style={[styles.modalBtn, styles.modalBtnPrimary]}
              >
                <Text style={styles.modalBtnPrimaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    justifyContent: "center",
    gap: 16,
    backgroundColor: COLORS.bg,
  },

  hero: { paddingHorizontal: 2, gap: 10 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,77,109,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.25)",
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: COLORS.primary2,
    shadowColor: COLORS.primary2,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  pillText: { color: COLORS.ink, fontWeight: "900", fontSize: 12, letterSpacing: 0.25 },

  spark: {
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

  pickTile: {
    height: 86,
    borderRadius: 22,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  pickIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pickLabel: { color: COLORS.muted, fontWeight: "900", fontSize: 12, letterSpacing: 0.2 },
  pickValue: { color: COLORS.ink, fontWeight: "900", fontSize: 18, letterSpacing: 0.2 },

  pickRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  agePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,138,0,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,138,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  ageText: { color: COLORS.ink, fontWeight: "900", fontSize: 14, lineHeight: 16 },
  ageCaption: { color: COLORS.muted, fontWeight: "900", fontSize: 11, marginTop: 2 },

  hint: {
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.18)",
  },
  hintText: { color: "#FFE4EA", fontWeight: "800", flex: 1, lineHeight: 18 },

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

  // iOS modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.60)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#0E0E17",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: { fontWeight: "900", fontSize: 16, color: "#fff" },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalBtnGhost: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  modalBtnGhostText: { color: "#fff", fontWeight: "900" },
  modalBtnPrimary: { backgroundColor: COLORS.primary },
  modalBtnPrimaryText: { color: "#fff", fontWeight: "900" },
});
