// app/profile/[clerkUserId].tsx
// Rewritten to match profileHome.tsx light-pink theme for consistency
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, Image, ScrollView, Pressable, ActivityIndicator,
  Dimensions, StatusBar, Platform, RefreshControl,
  TouchableOpacity, Modal, StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiFetch } from "../../lib/apiFetch";
import { styles, COLORS } from "../../components/profile/profileHome.styles";

const { width: W } = Dimensions.get("window");
const PHOTO_GAP  = 4;
const PHOTO_SIZE = (W - 48 - PHOTO_GAP * 2) / 3; // 3 cols, correct padding (12*2 margin + 12*2 padding = 48)

type UserProfile = {
  clerkUserId: string;
  name: string;
  username?: string;
  about?: string;
  interests?: string[];
  languages?: string[];
  photos?: string[];
  avatar?: string | null;
  rating?: number;
  eventsHosted?: number;
  totalAttendees?: number;
  services?: string[];
  isVerified?: boolean;
};

export default function PublicProfileScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{ clerkUserId: string; name?: string; imageUrl?: string }>();
  const targetId    = String(params.clerkUserId || "");
  const initialName = String(params.name || "");
  const initialAvatar = String(params.imageUrl || "");

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [err,          setErr]          = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const isOwnProfile = userId === targetId;

  const load = useCallback(async () => {
    if (!API_BASE || !targetId) { setErr("Invalid profile URL"); setLoading(false); return; }
    setErr(null);
    try {
      const res  = await apiFetch(
        `${API_BASE}/api/profile?clerkUserId=${encodeURIComponent(targetId)}`,
        { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined }
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load profile");

      setProfile({
        clerkUserId: targetId,
        name:           json?.name      || initialName || "User",
        username:       json?.username  || "",
        about:          json?.about     || "",
        interests:      Array.isArray(json?.interests) ? json.interests : [],
        languages:      Array.isArray(json?.languages) ? json.languages : [],
        photos:         Array.isArray(json?.photos)    ? json.photos    : [],
        avatar:         json?.avatar || (initialAvatar || null),
        // ✅ New Stats
        rating:         json?.rating ?? 0,
        eventsHosted:   json?.eventsHosted ?? 0,
        totalAttendees: json?.totalAttendees ?? 0,
        services:       Array.isArray(json?.services) ? json.services : [],
        isVerified:     !!json?.isVerified,
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to load profile");
      setProfile({
        clerkUserId: targetId,
        name: initialName || "User",
        avatar: initialAvatar || null,
        photos: [], interests: [], languages: [],
        rating: 0, eventsHosted: 0, totalAttendees: 0, services: []
      });
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [API_BASE, EVENT_API_KEY, targetId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const TOP_PAD  = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 8;
  const getSafeUri = (val: any) => {
    if (typeof val === "string") return val;
    return (val as any)?.url || "";
  };

  const avatarUri = getSafeUri(profile?.avatar)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || "U")}&background=FF4D6D&color=fff&size=200`;

  if (loading && !profile) {
    return (
      <View style={[styles.screen, pub.center, { paddingTop: TOP_PAD }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={COLORS.brand} size="large" />
        <Text style={[styles.metaTxt, { marginTop: 12 }]}>Loading profile…</Text>
      </View>
    );
  }

  const photos = Array.isArray(profile?.photos) ? profile!.photos : [];

  return (
    <View style={[styles.screen, { paddingTop: TOP_PAD }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Top bar ── */}
      <View style={pub.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={pub.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={COLORS.brand} />
        </TouchableOpacity>
        <Text style={pub.topBarTitle} numberOfLines={1}>
          {profile?.username ? `@${profile.username}` : profile?.name || "Profile"}
        </Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={() => router.push("/profile/profileHome" as any)} style={pub.settingsBtn} hitSlop={12}>
            <Ionicons name="settings-outline" size={22} color={COLORS.brand} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Avatar + Name ── */}
        <View style={styles.center}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewPhoto(avatarUri)} style={styles.avatarRing}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          </TouchableOpacity>

          <Text style={styles.nameTxt}>{profile?.name || "User"}</Text>

          {!!profile?.username && (
            <View style={styles.handlePill}>
              <Ionicons name="logo-instagram" size={18} color="#fff" />
              <Text style={styles.handleTxt}>@{profile.username}</Text>
            </View>
          )}

          {/* Stats row - Redesigned to match profileHome */}
          <View style={pub.statsRow}>
            <View style={pub.statBox}>
              <View style={pub.statNumRow}>
                <Ionicons name="star" size={16} color="#F5A623" style={{ marginRight: 3 }} />
                <Text style={pub.statNum}>{(profile?.rating || 0).toFixed(1)}</Text>
              </View>
              <Text style={pub.statLab}>Rating</Text>
            </View>
            <View style={pub.statDivider} />
            <View style={pub.statBox}>
              <Text style={pub.statNum}>{profile?.eventsHosted ?? 0}</Text>
              <Text style={pub.statLab}>{"Events\nHosted"}</Text>
            </View>
            <View style={pub.statDivider} />
            <View style={pub.statBox}>
              <Text style={pub.statNum}>{profile?.totalAttendees ?? 0}</Text>
              <Text style={pub.statLab}>{"Total\nAttendees"}</Text>
            </View>
          </View>

          {/* Verification Badge */}
          {profile?.isVerified && (
            <View style={[styles.cardRow, { marginTop: 16, width: "92%", alignSelf: "center" }]}>
              <View style={styles.verifyIcon}>
                <Ionicons name="shield-checkmark" size={22} color={COLORS.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Verified Host</Text>
                <Text style={styles.cardSub}>Identity and records confirmed by Assisto</Text>
              </View>
            </View>
          )}

        </View>

        {/* ── Services Offered ── */}
        {(profile?.services?.length ?? 0) > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Services Offered</Text>
              <Ionicons name="sparkles" size={16} color={COLORS.brand} />
            </View>
            <View style={styles.chipsWrap}>
              {profile!.services!.map(svc => (
                <View key={svc} style={[styles.chip, { backgroundColor: "#F0FDFA", borderColor: "#5EEAD4" }]}>
                  <Text style={[styles.chipTxt, { color: "#0F766E" }]}>{svc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── About ── */}
        {!!profile?.about && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.sectionBodyTxt}>{profile.about}</Text>
          </View>
        )}

        {/* ── Interests ── */}
        {(profile?.interests?.length ?? 0) > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.chipsWrap}>
              {profile!.interests!.map(tag => (
                <View key={tag} style={styles.chip}>
                  <Text style={styles.chipTxt}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Languages ── */}
        {(profile?.languages?.length ?? 0) > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.chipsWrap}>
              {profile!.languages!.map(lang => (
                <View key={lang} style={styles.chip}>
                  <Text style={styles.chipTxt}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Photos — 3-col Instagram grid ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.metaTxt}>{photos.length} photo{photos.length !== 1 ? "s" : ""}</Text>
          </View>
          {photos.length === 0 ? (
            <View style={pub.emptyPhotos}>
              <Ionicons name="images-outline" size={32} color={COLORS.brand} style={{ opacity: 0.3 }} />
              <Text style={[styles.metaTxt, { marginTop: 8 }]}>No photos yet</Text>
            </View>
          ) : (
            <View style={pub.grid}>
              {photos.map((uri, i) => (
                <TouchableOpacity
                  key={`${uri}-${i}`}
                  activeOpacity={0.88}
                  onPress={() => setPreviewPhoto(getSafeUri(uri))}
                  style={[pub.gridCell, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}
                >
                  <Image source={{ uri: getSafeUri(uri) }} style={pub.gridImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {err && (
          <View style={pub.errBanner}>
            <Ionicons name="warning-outline" size={14} color="#F59E0B" />
            <Text style={pub.errTxt}>Profile partially loaded</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Fullscreen photo preview ── */}
      <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewPhoto(null)}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          {previewPhoto && <Image source={{ uri: previewPhoto }} style={styles.previewImg} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const pub = StyleSheet.create({
  center:  { alignItems: "center", justifyContent: "center" },

  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    backgroundColor: COLORS.bg,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.brandSoft,
    borderWidth: 1, borderColor: COLORS.ring,
  },
  topBarTitle: {
    flex: 1, textAlign: "center",
    color: COLORS.text, fontWeight: "900", fontSize: 16,
  },
  settingsBtn: {
    width: 38, height: 38, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.brandSoft,
    borderWidth: 1, borderColor: COLORS.ring,
  },

  statsRow: {
    flexDirection: "row", alignItems: "center",
    marginTop: 20, marginHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 24, paddingVertical: 18,
    borderWidth: 1, borderColor: "rgba(0,0,0,0.03)",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  statBox:    { alignItems: "center", flex: 1 },
  statNumRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  statNum:    { color: COLORS.text, fontWeight: "900", fontSize: 20 },
  statLab:    { color: COLORS.muted, fontWeight: "800", fontSize: 10, marginTop: 2, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.4 },
  statDivider: { width: 1, height: 40, backgroundColor: "rgba(0,0,0,0.05)" },


  grid: { flexDirection: "row", flexWrap: "wrap", gap: PHOTO_GAP, marginTop: 12 },
  gridCell: { overflow: "hidden", borderRadius: 10 },
  gridImg:  { width: "100%", height: "100%" },

  emptyPhotos: { alignItems: "center", paddingVertical: 30 },

  errBanner: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10,
    marginHorizontal: 16, padding: 10, borderRadius: 10,
    backgroundColor: "rgba(245,158,11,0.08)",
  },
  errTxt: { color: "rgba(245,158,11,0.8)", fontSize: 11, fontWeight: "700" },
});
