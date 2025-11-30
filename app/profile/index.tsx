import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ProfileData = {
  name?: string;
  username?: string;
  dob?: string;         // "YYYY-MM-DD"
  country?: string;
  about?: string;
  interests?: string[];
  languages?: string[];
};

const STORAGE_KEY = "@profile";

function calcAge(dob?: string) {
  if (!dob) return undefined;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return undefined;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({});

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw));
    })();
  }, []);

  const age = useMemo(() => calcAge(profile.dob), [profile.dob]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="settings-outline" size={22} color="#FF4D6D" />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={() => router.push("/settings/History")} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="refresh-outline" size={22} color="#FF4D6D" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/settings/Security")} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="eye-outline" size={22} color="#FF4D6D" />
        </TouchableOpacity>
      </View>

      {/* Profile card */}
      <View style={styles.center}>
        <View style={styles.avatarRing}>
          {/* Replace with saved photo later */}
          <Image
            source={{ uri: "https://i.pravatar.cc/200" }}
            style={styles.avatar}
          />
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={14} color="#fff" />
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percentTxt}>45%</Text>
          </View>
        </View>

        <Text style={styles.nameTxt}>
          {(profile.name || "Your Name")}{age ? `, ${age}` : ""}
        </Text>

        <View style={styles.handlePill}>
          <Ionicons name="logo-instagram" size={18} color="#fff" />
          <Text style={styles.handleTxt}>{profile.username ? `@${profile.username}` : "@your_username"}</Text>
          <Ionicons name="pencil" size={16} color="#fff" style={{ marginLeft: 8, opacity: 0.9 }} />
        </View>
      </View>

      {/* Get Verified */}
      <TouchableOpacity style={styles.cardRow} activeOpacity={0.9}>
        <View style={styles.verifyIcon}>
          <Ionicons name="checkmark-circle" size={20} color="#FF4D6D" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Get Verified</Text>
          <Text style={styles.cardSub}>Verify your profile to build trust with other travelers</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Photos */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Ionicons name="pencil" size={18} color="#FF4D6D" />
        </View>

        <View style={styles.photosGrid}>
          <TouchableOpacity style={[styles.photoBox, styles.photoBig]} activeOpacity={0.9}>
            <Ionicons name="camera" size={18} color="#FF4D6D" />
            <Text style={styles.addPhotoTxt}>Add Photo</Text>
          </TouchableOpacity>

          <View style={styles.photoRow}>
            <TouchableOpacity style={[styles.photoBox, styles.photoSmall]} activeOpacity={0.9}>
              <Ionicons name="camera" size={18} color="#FF4D6D" />
              <Text style={styles.addPhotoTxt}>Add Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoBox, styles.photoSmall]} activeOpacity={0.9}>
              <Ionicons name="camera" size={18} color="#FF4D6D" />
              <Text style={styles.addPhotoTxt}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* About Me */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <TouchableOpacity onPress={() => router.push("/settings/PersonalInfo")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color="#FF4D6D" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionBodyTxt}>{profile.about || "Add something about you..."}</Text>
      </View>

      {/* Interests */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <TouchableOpacity onPress={() => router.push("/settings/Preferences")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color="#FF4D6D" />
          </TouchableOpacity>
        </View>

        <View style={styles.chipsWrap}>
          {(profile.interests?.length ? profile.interests : ["Foodie", "Cooking", "Coffee", "Wine Tasting"]).map((x) => (
            <View key={x} style={styles.chip}>
              <Text style={styles.chipTxt}>{x}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Languages */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <TouchableOpacity onPress={() => router.push("/settings/Preferences")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color="#FF4D6D" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionBodyTxt}>
          {profile.languages?.length ? profile.languages.join(", ") : "No languages specified"}
        </Text>
      </View>

      {/* Logout placeholder */}
      <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.9}>
        <Ionicons name="log-out-outline" size={18} color="#FF4D6D" />
        <Text style={styles.logoutTxt}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  topBar: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 10, alignItems: "center" },
  iconBtn: { padding: 10, borderRadius: 12, backgroundColor: "#FFF5F7", marginLeft: 8 },

  center: { alignItems: "center", paddingTop: 14, paddingHorizontal: 16 },
  avatarRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 5, borderColor: "#FFD1DC",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff",
  },
  avatar: { width: 102, height: 102, borderRadius: 51 },
  editBadge: {
    position: "absolute", right: 4, bottom: 4,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#FF4D6D", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  percentBadge: {
    position: "absolute", right: -8, top: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, backgroundColor: "#FFE4EA",
  },
  percentTxt: { color: "#FF4D6D", fontWeight: "800", fontSize: 12 },

  nameTxt: { marginTop: 14, fontSize: 28, fontWeight: "800", color: "#111827" },

  handlePill: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FF4D6D",
  },
  handleTxt: { color: "#fff", fontWeight: "700", marginLeft: 8, fontSize: 16 },

  cardRow: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  verifyIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#FFF5F7",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  cardSub: { marginTop: 2, fontSize: 13, color: "#6B7280" },

  sectionCard: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  sectionBodyTxt: { marginTop: 10, color: "#374151", fontSize: 15, lineHeight: 20 },

  photosGrid: { marginTop: 12 },
  photoBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFB3C1",
    borderStyle: "dashed",
    backgroundColor: "#FFF5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  photoBig: { height: 160 },
  photoRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  photoSmall: { flex: 1, height: 120 },
  addPhotoTxt: { marginTop: 8, color: "#FF4D6D", fontWeight: "800" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  chip: { backgroundColor: "#FFF1F5", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "#FFD1DC" },
  chipTxt: { color: "#111827", fontWeight: "700" },

  logoutBtn: { marginTop: 18, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  logoutTxt: { color: "#FF4D6D", fontWeight: "900", fontSize: 16 },
});
