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

export default function DobScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [dob, setDob] = useState<Date>(new Date(2000, 0, 1));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Picker state
  const [androidShowPicker, setAndroidShowPicker] = useState(false);

  // iOS modal picker (true popup feel)
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

      const payload = {
        clerkUserId: user.id,
        dob: toISODate(dob), // "YYYY-MM-DD"
        age,
      };

      const res = await fetch(`${API_BASE}/api/onboarding/dateOfBirth`, {
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
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.logo}>
            <Ionicons name="calendar-outline" size={18} color="#0A84FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Step</Text>
            <Text style={styles.title}>Your date of Birth</Text>
          </View>
        </View>

        <View style={styles.card}>
          {/* DOB section */}
          <Text style={styles.sectionTitle}>Date of Birth</Text>

          <View style={styles.row}>
            <View style={styles.leftPill}>
              <Text style={styles.leftPillText}>DOB</Text>
            </View>

            <TouchableOpacity onPress={openPicker} activeOpacity={0.9} style={styles.rightPill}>
              <Text style={styles.rightPillText}>{toISODate(dob)}</Text>
              <View style={styles.iconBtn}>
                <Ionicons name="calendar" size={18} color="#0A84FF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Age section */}
          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Age</Text>

          <View style={styles.agePill}>
            <Text style={styles.ageText}>{age}</Text>
          </View>

          {!!err && <Text style={styles.err}>{err}</Text>}

          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.9}
            disabled={!canContinue}
            style={[styles.primaryBtn, !canContinue && { opacity: 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {!API_BASE ? (
            <Text style={[styles.err, { marginTop: 10 }]}>Config issue: extra.apiBaseUrl is missing.</Text>
          ) : null}
        </View>
      </View>

      {/* Android native picker */}
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
      <Modal visible={iosModalOpen} transparent animationType="fade" onRequestClose={() => setIosModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select date</Text>

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
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  page: { flex: 1, padding: 16, justifyContent: "center", gap: 14 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
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
  kicker: { color: "#0A84FF", fontWeight: "900", fontSize: 12 },
  title: { color: "#0F172A", fontWeight: "900", fontSize: 22, marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },

  sectionTitle: { color: "#0F172A", fontWeight: "900", fontSize: 14, marginBottom: 10 },

  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  leftPill: {
    width: 82,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
  },
  leftPillText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  rightPill: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rightPillText: { color: "#0F172A", fontWeight: "900", fontSize: 16 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },

  agePill: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  ageText: { color: "#0F172A", fontWeight: "900", fontSize: 18 },

  err: { marginTop: 12, color: "#B91C1C", fontWeight: "800" },

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

  // iOS modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalTitle: { fontWeight: "900", fontSize: 16, color: "#0F172A", marginBottom: 10 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalBtnGhost: { backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  modalBtnGhostText: { color: "#0F172A", fontWeight: "900" },
  modalBtnPrimary: { backgroundColor: "#0A84FF" },
  modalBtnPrimaryText: { color: "#fff", fontWeight: "900" },
});
