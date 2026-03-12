// app/profile/settings/PersonalInfo.tsx
// ✏️ FIXED — Now saves to DB via PATCH /api/profile (was only AsyncStorage before)

import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ScrollView, SafeAreaView, Platform, KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "../../../lib/apiFetch";

const COLORS = {
  bg: "#FFF7FA", card: "#FFFFFF", text: "#111827",
  muted: "#6B7280", brand: "#FF4D6D", brandSoft: "#FFF1F5",
  border: "#F1F5F9", danger: "#EF4444",
};

const STORAGE_KEY = "user_profile";

export default function PersonalInfo() {
  const router = useRouter();
  const { userId } = useAuth();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [form, setForm] = useState({
    name: "", email: "", phone: "", gender: "", city: "", country: "",
  });
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from DB first, fallback to AsyncStorage
  useEffect(() => {
    (async () => {
      // Try AsyncStorage first for instant display
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { setForm(f => ({ ...f, ...JSON.parse(stored) })); } catch {}
      }

      // Then fetch from DB
      if (!API_BASE || !userId) { setLoading(false); return; }
      try {
        const res  = await apiFetch(
          `${API_BASE.replace(/\/$/, "")}/api/profile?clerkUserId=${encodeURIComponent(userId)}`,
          { method: "GET", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {} }
        );
        if (res.ok) {
          const src  = await res.json().catch(() => ({}));
          setForm({
            name:    src?.name     || "",
            email:   src?.email    || "",
            phone:   src?.phone    || "",
            gender:  src?.gender   || "",
            city:    src?.city     || "",
            country: src?.country  || "",
          });
        }
      } catch {}
      setLoading(false);
    })();
  }, [API_BASE, userId, EVENT_API_KEY]);

  const saveProfile = async () => {
    if (!API_BASE || !userId) {
      // Fallback: only AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      Alert.alert("Saved ✨", "Profile updated locally.");
      return;
    }

    setSaving(true);
    try {
      // Split name into firstName + lastName
      const parts     = form.name.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName  = parts.slice(1).join(" ") || "";

      const res = await apiFetch(
        `${API_BASE.replace(/\/$/, "")}/api/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
          },
          body: JSON.stringify({
            clerkUserId: userId,
            firstName,
            lastName,
            phone:   form.phone.trim()   || undefined,
            gender:  form.gender.trim()  || undefined,
            city:    form.city.trim()    || undefined,
            country: form.country.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed (${res.status})`);
      }

      // Also save to AsyncStorage as cache
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      Alert.alert("Saved ✨", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.intro}>
            <Text style={styles.introHeading}>Personal Details</Text>
            <Text style={styles.introSub}>Customize how others see you on the platform.</Text>
          </View>

          {loading ? (
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <ActivityIndicator color={COLORS.brand} />
            </View>
          ) : (
            <View style={styles.formArea}>
              <FloatingField icon="person-outline"   label="Full Name"      value={form.name}    placeholder="e.g. Anshul Sharma"   onChange={(v: string) => handleChange("name", v)} />
              <FloatingField icon="mail-outline"     label="Email Address"  value={form.email}   placeholder="anshul@example.com"   onChange={(v: string) => handleChange("email", v)} keyboardType="email-address" autoCapitalize="none" />
              <FloatingField icon="call-outline"     label="Phone Number"   value={form.phone}   placeholder="+91 98765 43210"      onChange={(v: string) => handleChange("phone", v)} keyboardType="phone-pad" />
              <FloatingField icon="people-outline"   label="Gender"         value={form.gender}  placeholder="Male / Female / Other" onChange={(v: string) => handleChange("gender", v)} />
              <View style={styles.rowLayout}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <FloatingField icon="location-outline" label="City"    value={form.city}    placeholder="Indore" onChange={(v: string) => handleChange("city", v)} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <FloatingField icon="globe-outline"    label="Country" value={form.country} placeholder="India"  onChange={(v: string) => handleChange("country", v)} />
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, (saving || loading) && { opacity: 0.7 }]}
            onPress={saveProfile}
            disabled={saving || loading}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={styles.saveText}>Save Information</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const FloatingField = ({ icon, label, value, placeholder, onChange, keyboardType, autoCapitalize }: any) => (
  <View style={styles.block}>
    <View style={styles.blockHeader}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={14} color={COLORS.brand} />
      </View>
      <Text style={styles.blockLabel}>{label}</Text>
    </View>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      selectionColor={COLORS.brand}
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 28, marginTop: Platform.OS === "android" ? 10 : 0,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#F1F5F9",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  intro: { marginBottom: 32, paddingLeft: 4 },
  introHeading: { fontSize: 28, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
  introSub: { fontSize: 15, fontWeight: "600", color: COLORS.muted, marginTop: 4 },
  formArea: { gap: 16 },
  rowLayout: { flexDirection: "row", alignItems: "flex-start" },
  block: {
    backgroundColor: COLORS.card, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: COLORS.brand, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    marginBottom: 4,
  },
  blockHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconCircle: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: COLORS.brandSoft,
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  blockLabel: { fontSize: 12, fontWeight: "800", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  input: { fontSize: 16, fontWeight: "700", color: COLORS.text, paddingVertical: 4 },
  saveBtn: {
    marginTop: 40, flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.brand, padding: 20, borderRadius: 22, gap: 12,
    shadowColor: COLORS.brand, shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  saveText: { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 0.3 },
});