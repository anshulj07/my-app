// app/profile/profileHome.tsx (or ProfileHome.tsx)
// ✅ FIXED: Profile completion % is now calculated dynamically
//   Was: hardcoded 45%
//   Now: based on filled fields — name, username, about, interests, languages, photos, avatar

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Image, RefreshControl, Modal, Dimensions, StyleSheet,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { apiFetch } from "../../lib/apiFetch";

import PhotosManagerModal from "../../components/profile/PhotosManagerModal";
import { styles, COLORS } from "../../components/profile/profileHome.styles";

type ProfileData = {
  name?: string;
  username?: string;
  about?: string;
  interests?: string[];
  languages?: string[];
  photos?: string[];
  avatar?: string | null;
};

const STORAGE_KEY       = "@profile";
const PROFILE_ENDPOINT  = "/api/profile";

function sanitizePhotos(photos?: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

// ✅ Calculate profile completion percentage
function calcCompletion(p: ProfileData): number {
  const checks = [
    !!(p.name?.trim()),
    !!(p.username?.trim()),
    !!(p.about?.trim()),
    (p.interests?.length ?? 0) >= 3,
    (p.languages?.length ?? 0) >= 1,
    (p.photos?.length ?? 0) >= 1,
    !!(p.avatar),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export default function ProfileHome() {
  const router = useRouter();
  const { signOut, userId } = useAuth();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [profile,        setProfile]        = useState<ProfileData>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileErr,     setProfileErr]     = useState<string | null>(null);
  const [refreshing,     setRefreshing]     = useState(false);
  const [photosOpen,     setPhotosOpen]     = useState(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [hamOpen,        setHamOpen]        = useState(false);
  const [previewOpen,    setPreviewOpen]    = useState(false);
  const [previewUri,     setPreviewUri]     = useState<string | null>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const openPreview = useCallback((uri: string | null) => {
    if (!uri) return;
    setPreviewUri(uri); setPreviewOpen(true);
  }, []);

  const photos = useMemo(() => sanitizePhotos(profile.photos), [profile.photos]);
  // 3-column grid — show up to 6 photos (first 6) in the profile card
  const previewPhotos = photos.slice(0, 6);

  const { width: W } = Dimensions.get("window");
  const PHOTO_GAP  = 4;
  const PHOTO_SIZE = (W - 48 - PHOTO_GAP * 2) / 3; // 3 cols, correct padding (12*2 margin + 12*2 padding = 48)

  const avatarUri  = profile.avatar ?? "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
  const avatarKey  = `avatar:${avatarUri}`;

  // ✅ Dynamic completion percentage
  const completionPct = useMemo(() => calcCompletion(profile), [profile]);

  const fetchProfile = useCallback(async () => {
    if (!API_BASE || !userId) return;
    setLoadingProfile(true); setProfileErr(null);
    try {
      const url = `${API_BASE.replace(/\/$/, "")}${PROFILE_ENDPOINT}?clerkUserId=${encodeURIComponent(userId)}`;
      const res = await apiFetch(url, {
        method: "GET",
        headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {},
      });
      if (!res.ok) throw new Error(`Failed to fetch profile (${res.status})`);
      const j   = await res.json().catch(() => ({} as any));
      const src = (j && typeof j === "object" && (j.profile || j.data || j)) as any;
      const next: ProfileData = {
        name:      typeof src?.name      === "string" ? src.name      : undefined,
        username:  typeof src?.username  === "string" ? src.username  : undefined,
        about:     typeof src?.about     === "string" ? src.about     : undefined,
        interests: Array.isArray(src?.interests) ? src.interests : [],
        languages: Array.isArray(src?.languages) ? src.languages : [],
        photos:    Array.isArray(src?.photos)    ? src.photos    : [],
        avatar:    typeof src?.avatar    === "string" ? src.avatar    : null,
      };
      setProfile(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e: any) {
      setProfileErr(e?.message || "Failed to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [API_BASE, EVENT_API_KEY, userId]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) { try { setProfile(JSON.parse(raw)); } catch {} }
      await fetchProfile();
    })();
  }, [fetchProfile]);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchProfile(); } finally { setRefreshing(false); }
  }, [fetchProfile]);

  const onLogout = useCallback(() => {
    setLogoutModalOpen(true);
  }, []);

  const handleConfirmedLogout = async () => {
    setLogoutModalOpen(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await signOut();
    router.replace("/sign-in");
  };

  async function uploadPhoto(replaceUri?: string | null, isAvatar?: boolean) {
    if (!API_BASE || !userId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error("Please allow photo permissions to continue.");
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [1, 1],
    });
    if (picked.canceled) return;
    const asset = picked.assets?.[0];
    const uri   = asset?.uri;
    if (!uri) throw new Error("No photo selected.");

    let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
    if (isAvatar)       url += `&isAvatar=true`;
    else if (replaceUri) url += `&replaceUri=${encodeURIComponent(replaceUri)}`;

    const form     = new FormData();
    const fileName = asset?.fileName?.trim() || `photo_${Date.now()}.jpg`;
    const mimeType = asset?.mimeType || "image/jpeg";
    form.append("file", { uri, name: fileName, type: mimeType } as any);

    const res = await apiFetch(url, {
      method: "POST",
      headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {},
      body: form as any,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = `Upload failed (${res.status})`;
      try { msg = JSON.parse(text)?.error || msg; } catch {}
      throw new Error(msg);
    }
    await fetchProfile();
  }

  async function deletePhoto(uri: string, isAvatar?: boolean) {
    if (!API_BASE || !userId) return;
    let url = `${API_BASE.replace(/\/$/, "")}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
    if (isAvatar) url += `&isAvatar=true`;
    const res = await apiFetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      },
      body: JSON.stringify({ uri }),
    });
    if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    await fetchProfile();
  }

  // PhotoTile defined outside component (see below)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push("/profile/settings")} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="settings-outline" size={22} color={COLORS.brand} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {/* Single hamburger icon replacing two separate icons */}
        <TouchableOpacity onPress={() => setHamOpen(true)} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="menu-outline" size={24} color={COLORS.brand} />
        </TouchableOpacity>
      </View>

      {/* Avatar + completion */}
      <View style={styles.center}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => openPreview(avatarUri)} style={styles.avatarRing}>
          <Image key={avatarKey} source={{ uri: avatarUri }} style={styles.avatar} />
          <TouchableOpacity activeOpacity={0.8} onPress={() => setMenuOpen(true)} style={styles.editBadge}>
            <Ionicons name="pencil" size={14} color="#fff" />
          </TouchableOpacity>
          {/* ✅ Dynamic % */}
          <View style={styles.percentBadge}>
            <Text style={styles.percentTxt}>{completionPct}%</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.nameTxt}>{profile.name || "Your Name"}</Text>

        {loadingProfile && <Text style={styles.metaTxt}>Loading…</Text>}
        {profileErr     && <Text style={[styles.metaTxt, { color: COLORS.danger }]}>{profileErr}</Text>}

        {/* Completion hint */}
        {completionPct < 100 && !loadingProfile && (
          <TouchableOpacity
            style={{ marginTop: 6, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: COLORS.brandSoft, borderRadius: 10, borderWidth: 1, borderColor: COLORS.ring ?? "#FFD1DC" }}
            onPress={() => router.push("/profile/settings")}
            activeOpacity={0.85}
          >
            <Text style={{ color: COLORS.brand, fontSize: 12, fontWeight: "700" }}>
              {completionPct < 50 ? "👋 Complete your profile" : "✨ Almost there! Finish profile"}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.handlePill}>
          <Ionicons name="logo-instagram" size={18} color="#fff" />
          <Text style={styles.handleTxt}>{profile.username ? `@${profile.username}` : "@your_username"}</Text>
          <Ionicons name="pencil" size={16} color="#fff" style={{ marginLeft: 8, opacity: 0.9 }} />
        </View>
      </View>

      {/* Verify card */}
      <TouchableOpacity style={styles.cardRow} activeOpacity={0.92}>
        <View style={styles.verifyIcon}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Get Verified</Text>
          <Text style={styles.cardSub}>Verify your profile to build trust with other travelers</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Photos — 3-column Instagram grid */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <TouchableOpacity onPress={() => setPhotosOpen(true)} activeOpacity={0.92} style={styles.showMoreBtn}>
            <Text style={styles.showMoreTxt}>Manage</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.brand} />
          </TouchableOpacity>
        </View>
        {/* 3-col grid */}
        <View style={[inlineGrid.grid, { marginTop: 12 }]}>
          {previewPhotos.length > 0 ? (
            previewPhotos.map((uri, i) => (
              <TouchableOpacity
                key={`${uri}-${i}`}
                activeOpacity={0.88}
                onPress={() => openPreview(typeof uri === "string" ? uri : (uri as any)?.url || "")}
                style={[inlineGrid.cell, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}
              >
                <Image
                  source={{ uri: typeof uri === "string" ? uri : (uri as any)?.url || "" }}
                  style={inlineGrid.img}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))
          ) : null}
          {/* Empty add-photo slots up to 3 per row, at least 3 shown */}
          {Array.from({ length: Math.max(0, 3 - previewPhotos.length) }).map((_, i) => (
            <TouchableOpacity
              key={`empty-${i}`}
              activeOpacity={0.88}
              onPress={() => setPhotosOpen(true)}
              style={[inlineGrid.cell, inlineGrid.emptyCell, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}
            >
              <Ionicons name="camera-outline" size={20} color={COLORS.brand} />
              <Text style={inlineGrid.addTxt}>Add</Text>
            </TouchableOpacity>
          ))}
        </View>
        {photos.length > 6 && (
          <TouchableOpacity onPress={() => setPhotosOpen(true)} style={{ alignItems: "center", marginTop: 10 }}>
            <Text style={{ color: COLORS.brand, fontWeight: "800", fontSize: 13 }}>+{photos.length - 6} more photos</Text>
          </TouchableOpacity>
        )}
      </View>

      <PhotosManagerModal
        visible={photosOpen} onClose={() => setPhotosOpen(false)}
        photos={photos} maxPhotos={20} minPhotos={0}
        onUpload={uploadPhoto} onDelete={deletePhoto}
      />

      {/* About */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <TouchableOpacity onPress={() => router.push("/profile/settings/AboutMe")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color={COLORS.brand} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionBodyTxt}>{profile.about || "Add something about you..."}</Text>
      </View>

      {/* Interests */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <TouchableOpacity onPress={() => router.push("/profile/settings/Interests")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color={COLORS.brand} />
          </TouchableOpacity>
        </View>
        <View style={styles.chipsWrap}>
          {(profile.interests?.length
            ? profile.interests
            : ["Foodie", "Cooking", "Coffee", "Wine Tasting"]
          ).map(x => (
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
          <TouchableOpacity onPress={() => router.push("/profile/settings/Languages")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color={COLORS.brand} />
          </TouchableOpacity>
        </View>
        <View style={styles.chipsWrap}>
          {(profile.languages?.length ? profile.languages : ["English", "Hindi"]).map(x => (
            <View key={x} style={styles.chip}>
              <Text style={styles.chipTxt}>{x}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.92} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.brand} />
        <Text style={styles.logoutTxt}>Logout</Text>
      </TouchableOpacity>

      {/* Preview modal */}
      <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} activeOpacity={0.92} onPress={() => setPreviewOpen(false)}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          {previewUri && <Image source={{ uri: previewUri }} style={styles.previewImg} resizeMode="contain" />}
          {previewUri === avatarUri && (
            <TouchableOpacity style={styles.previewEdit} activeOpacity={0.92} onPress={() => { setPreviewOpen(false); setMenuOpen(true); }}>
              <Ionicons name="pencil" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Hamburger bottom-sheet */}
      <Modal visible={hamOpen} transparent animationType="slide" onRequestClose={() => setHamOpen(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setHamOpen(false)}>
          <View style={styles.menuContent}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 20 }} />
            <Text style={styles.menuTitle}>More Options</Text>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => { setHamOpen(false); router.push("/profile/settings/History"); }}
            >
              <View style={[hamSt.iconWrap, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.menuLabel}>Activity History</Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>View your past activity</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setHamOpen(false)}>
              <Text style={styles.menuCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit menu (avatar) */}
      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Profile Photo</Text>
            <TouchableOpacity style={styles.menuItem} onPress={async () => { setMenuOpen(false); try { await uploadPhoto(null, true); } catch (e: any) { alert(e.message); } }}>
              <Ionicons name="image-outline" size={22} color={COLORS.text} />
              <Text style={styles.menuLabel}>Update Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={async () => { setMenuOpen(false); try { await deletePhoto("", true); } catch (e: any) { alert(e.message); } }}>
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              <Text style={[styles.menuLabel, styles.menuLabelDelete]}>Remove Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Logout Modal */}
      <Modal visible={logoutModalOpen} transparent animationType="fade" onRequestClose={() => setLogoutModalOpen(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={modalStyles.iconBg}>
              <Ionicons name="log-out" size={32} color={COLORS.brand} />
            </View>
            <Text style={modalStyles.title}>Logout</Text>
            <Text style={modalStyles.sub}>Are you sure you want to log out from your account?</Text>
            
            <View style={modalStyles.btnRow}>
              <TouchableOpacity 
                style={[modalStyles.btn, modalStyles.cancelBtn]} 
                onPress={() => setLogoutModalOpen(false)}
              >
                <Text style={modalStyles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[modalStyles.btn, modalStyles.confirmBtn]} 
                onPress={handleConfirmedLogout}
              >
                <Text style={modalStyles.confirmTxt}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── Inline grid styles ─────────────────────────────────────────────────────
const inlineGrid = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  cell: { borderRadius: 12, overflow: "hidden" },
  img: { width: "100%", height: "100%" },
  emptyCell: {
    borderRadius: 12, borderWidth: 2, borderStyle: "dashed",
    borderColor: "#FFB3C1", backgroundColor: "#FFF1F5",
    alignItems: "center", justifyContent: "center",
  },
  addTxt: { color: "#FF4D6D", fontWeight: "800", fontSize: 11, marginTop: 4 },
});

// ── Hamburger icon-wrap style ─────────────────────────────────────────────
const hamSt = StyleSheet.create({
  iconWrap: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center", padding: 20,
  },
  container: {
    backgroundColor: "#fff", borderRadius: 32, padding: 30,
    width: "100%", maxWidth: 340, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  iconBg: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: COLORS.brandSoft, alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text, marginBottom: 12 },
  sub: { 
    fontSize: 16, color: COLORS.muted, textAlign: "center", 
    lineHeight: 22, marginBottom: 30, paddingHorizontal: 10,
    fontWeight: "600",
  },
  btnRow: { flexDirection: "row", gap: 12, width: "100%" },
  btn: {
    flex: 1, height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  cancelBtn: { backgroundColor: "#F3F4F6" },
  confirmBtn: { backgroundColor: COLORS.brand },
  cancelTxt: { fontSize: 16, fontWeight: "800", color: COLORS.muted },
  confirmTxt: { fontSize: 16, fontWeight: "800", color: "#fff" },
});

