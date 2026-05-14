// app/profile/[clerkUserId].tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, Image, ScrollView, ActivityIndicator,
  Dimensions, StatusBar, Platform, RefreshControl,
  TouchableOpacity, Modal, StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiFetch } from "../../lib/apiFetch";

const { width: W } = Dimensions.get("window");
const C = {
  bg: "#F7F8F4",
  white: "#FFFFFF",
  ink: "#191919",
  muted: "#888888",
  brand: "#6C63FF",
  brandSoft: "#EEF2FF",
  border: "#EEEEEE",
  ring: "#E0E7FF",
  card: "#FFFFFF",
  star: "#F5A623",
};

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
  const targetId = String(params.clerkUserId || "");
  const initialName = String(params.name || "");
  const initialAvatar = String(params.imageUrl || "");

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const isOwnProfile = userId === targetId;

  const load = useCallback(async () => {
    if (!API_BASE || !targetId) { setErr("Invalid profile URL"); setLoading(false); return; }
    setErr(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/profile?clerkUserId=${encodeURIComponent(targetId)}`, {
        headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to load profile");

      setProfile({
        clerkUserId: targetId,
        name: json?.name || initialName || "User",
        username: json?.username || "",
        about: json?.about || "",
        interests: Array.isArray(json?.interests) ? json.interests : [],
        languages: Array.isArray(json?.languages) ? json.languages : [],
        photos: Array.isArray(json?.photos) ? json.photos : [],
        avatar: json?.avatar || (initialAvatar || null),
        rating: json?.rating ?? 0,
        eventsHosted: json?.eventsHosted ?? 0,
        totalAttendees: json?.totalAttendees ?? 0,
        services: Array.isArray(json?.services) ? json.services : [],
        isVerified: !!json?.isVerified,
      });
    } catch (e: any) {
      setErr(e?.message || "Failed to load profile");
      setProfile({
        clerkUserId: targetId,
        name: initialName || "User",
        avatar: initialAvatar || null,
        photos: [], interests: [], languages: [],
        rating: 0, eventsHosted: 0, totalAttendees: 0, services: [], isVerified: false,
      });
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [API_BASE, EVENT_API_KEY, targetId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const TOP_PAD = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 8;
  const getSafeUri = (val: any) => {
    if (typeof val === "string") return val;
    return (val as any)?.url || "";
  };

  const avatarUri = getSafeUri(profile?.avatar) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || "U")}&background=6C63FF&color=fff&size=200`;

  if (loading && !profile) {
    return (
      <View style={[S.root, S.center, { paddingTop: TOP_PAD }]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color={C.brand} size="large" />
      </View>
    );
  }

  const photos = Array.isArray(profile?.photos) ? profile!.photos : [];

  return (
    <View style={[S.root, { paddingTop: TOP_PAD }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Top Bar ── */}
      <View style={S.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={S.topBarBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={C.ink} />
        </TouchableOpacity>
        <Text style={S.topBarTitle} numberOfLines={1}>Profile</Text>
        <TouchableOpacity style={S.topBarBtn} hitSlop={12}>
          <Ionicons name="share-outline" size={24} color={C.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Header ── */}
        <View style={S.header}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewPhoto(avatarUri)} style={S.avatarOuter}>
            <View style={S.avatarRing}>
              <Image source={{ uri: avatarUri }} style={S.avatar} />
            </View>
            {profile?.isVerified && (
              <View style={S.verifyBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={S.nameTxt}>{profile?.name || "User"}</Text>
          <Text style={S.handleTxt}>@{profile?.username || "username"}</Text>

          {/* Stats Row */}
          <View style={S.statsRow}>
            <View style={S.statItem}>
              <View style={S.statValRow}>
                <Ionicons name="star" size={14} color={C.star} style={{ marginRight: 4 }} />
                <Text style={S.statVal}>{(profile?.rating || 0).toFixed(1)}</Text>
              </View>
              <Text style={S.statLab}>Rating</Text>
            </View>
            <View style={S.statDiv} />
            <View style={S.statItem}>
              <Text style={S.statVal}>{profile?.eventsHosted ?? 0}</Text>
              <Text style={S.statLab}>Events</Text>
            </View>
            <View style={S.statDiv} />
            <View style={S.statItem}>
              <Text style={S.statVal}>{profile?.totalAttendees ?? 0}</Text>
              <Text style={S.statLab}>Attendees</Text>
            </View>
          </View>
        </View>

        {/* ── About Section ── */}
        <View style={S.card}>
          <Text style={S.cardTitle}>About</Text>
          <Text style={S.aboutTxt}>{profile?.about || "No bio yet."}</Text>
        </View>

        {/* ── Interests Section ── */}
        {(profile?.interests?.length ?? 0) > 0 && (
          <View style={S.card}>
            <Text style={S.cardTitle}>Interests</Text>
            <View style={S.chips}>
              {profile!.interests!.map(tag => (
                <View key={tag} style={S.chip}>
                  <Text style={S.chipTxt}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Moments (Photos) Section ── */}
        <View style={S.card}>
          <View style={S.cardHeaderRow}>
            <Text style={S.cardTitle}>Moments</Text>
            <Text style={S.metaTxt}>{photos.length} photos</Text>
          </View>
          {photos.length === 0 ? (
            <View style={S.emptyPhotos}>
              <Ionicons name="images-outline" size={32} color={C.brand} style={{ opacity: 0.2 }} />
              <Text style={S.metaTxt}>No moments yet</Text>
            </View>
          ) : (
            <View style={S.photoGrid}>
              {photos.map((uri, i) => (
                <TouchableOpacity
                  key={`${uri}-${i}`}
                  activeOpacity={0.88}
                  onPress={() => setPreviewPhoto(getSafeUri(uri))}
                  style={S.photoCard}
                >
                  <Image source={{ uri: getSafeUri(uri) }} style={S.photoImg} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {err && <Text style={S.errTxt}>{err}</Text>}
      </ScrollView>

      {/* ── Photo Preview ── */}
      <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
        <View style={S.previewOverlay}>
          <TouchableOpacity style={S.previewClose} onPress={() => setPreviewPhoto(null)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {previewPhoto && <Image source={{ uri: previewPhoto }} style={S.previewImg} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { alignItems: "center", justifyContent: "center" },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  topBarBtn:   { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topBarTitle: { fontSize: 17, fontWeight: "800", color: C.ink },

  header: { alignItems: "center", marginTop: 10, paddingHorizontal: 20 },
  avatarOuter: { position: "relative" },
  avatarRing: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 4, borderColor: C.brand,
    padding: 4, alignItems: "center", justifyContent: "center",
  },
  avatar: { width: "100%", height: "100%", borderRadius: 60 },
  verifyBadge: {
    position: "absolute", bottom: 4, right: 4,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.brand, borderWidth: 2, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },

  nameTxt: { fontSize: 26, fontWeight: "900", color: C.ink, marginTop: 16 },
  handleTxt: { fontSize: 14, color: C.brand, fontWeight: "700", marginTop: 4 },

  statsRow: {
    flexDirection: "row", alignItems: "center",
    marginTop: 24, paddingVertical: 16,
    width: "100%", backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValRow: { flexDirection: "row", alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "900", color: C.ink },
  statLab: { fontSize: 11, fontWeight: "700", color: C.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  statDiv: { width: 1, height: 30, backgroundColor: "#F0F0F0" },

  card: {
    marginTop: 16, marginHorizontal: 20,
    backgroundColor: "#fff", borderRadius: 28,
    padding: 24,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: "900", color: C.ink, marginBottom: 12 },
  aboutTxt: { fontSize: 15, color: "#4B5563", lineHeight: 22, fontWeight: "500" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.brandSoft, borderRadius: 16,
  },
  chipTxt: { fontSize: 13, fontWeight: "700", color: C.brand },

  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photoCard: { 
    width: (W - 88 - 12) / 2, aspectRatio: 0.8, borderRadius: 18, overflow: "hidden",
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "rgba(0,0,0,0.02)"
  },
  photoImg:  { width: "100%", height: "100%" },

  emptyPhotos: { alignItems: "center", paddingVertical: 20 },
  metaTxt: { fontSize: 12, color: C.muted, fontWeight: "700" },
  errTxt:  { color: "red", textAlign: "center", marginTop: 20 },

  previewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  previewImg:     { width: "100%", height: "80%" },
  previewClose:   { position: "absolute", top: 50, right: 20, padding: 10 },
});
