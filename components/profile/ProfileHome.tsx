import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";

import PhotosManagerModal from "./PhotosManagerModal";
import { styles, COLORS } from "./profileHome.styles";

type ProfileData = {
  name?: string;
  username?: string;
  about?: string;
  interests?: string[];
  languages?: string[];
  photos?: string[];
};

const STORAGE_KEY = "@profile";
const PROFILE_ENDPOINT = "/api/profile";

function sanitizePhotos(photos?: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

export default function ProfileHome() {
  const router = useRouter();
  const { signOut, userId } = useAuth();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [profile, setProfile] = useState<ProfileData>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [photosOpen, setPhotosOpen] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const openPreview = useCallback((uri: string) => {
    setPreviewUri(uri);
    setPreviewOpen(true);
  }, []);

  const photos = useMemo(() => sanitizePhotos(profile.photos), [profile.photos]);
  const slot0 = photos[0] ?? null;
  const slot1 = photos[1] ?? null;
  const slot2 = photos[2] ?? null;

  const avatarUri = slot0 ?? "https://i.pravatar.cc/200";
  const avatarKey = `avatar:${avatarUri}`;

  const fetchProfile = useCallback(async () => {
    if (!API_BASE || !userId) return;

    setLoadingProfile(true);
    setProfileErr(null);

    try {
      const base = API_BASE.replace(/\/$/, "");
      const url = `${base}${PROFILE_ENDPOINT}?clerkUserId=${encodeURIComponent(userId)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch profile (${res.status})`);

      const j = await res.json().catch(() => ({} as any));
      const src = (j && typeof j === "object" && (j.profile || j.data || j)) as any;

      const next: ProfileData = {
        name: typeof src?.name === "string" ? src.name : undefined,
        username: typeof src?.username === "string" ? src.username : undefined,
        about: typeof src?.about === "string" ? src.about : undefined,
        interests: Array.isArray(src?.interests) ? src.interests : [],
        languages: Array.isArray(src?.languages) ? src.languages : [],
        photos: Array.isArray(src?.photos) ? src.photos : [],
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
      if (raw) {
        try {
          setProfile(JSON.parse(raw));
        } catch {}
      }
      await fetchProfile();
    })();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile]);

  const onLogout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await signOut();
    router.replace("/sign-in");
  }, [router, signOut]);

  // Keep your upload flow as-is later
  async function uploadPhoto() {
    await fetchProfile();
  }

  async function deletePhoto(uri: string) {
    if (!API_BASE || !userId) return;

    const base = API_BASE.replace(/\/$/, "");
    const url = `${base}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      },
      body: JSON.stringify({ uri }),
    });

    const text = await res.text();
    console.log("[deletePhoto]", res.status, text);

    if (!res.ok) throw new Error(text || `Failed to delete photo (${res.status})`);
    await fetchProfile();
  }

  const PhotoTile = ({
    uri,
    big,
  }: {
    uri: string | null;
    big?: boolean;
  }) => {
    const imgStyle = big ? styles.photoBigImg : styles.photoSmallImg;
    const boxStyle = big ? [styles.photoBox, styles.photoBig] : [styles.photoBox, styles.photoSmall];

    if (uri) {
      return (
        <TouchableOpacity activeOpacity={0.92} onPress={() => openPreview(uri)}>
          <Image source={{ uri }} style={imgStyle} resizeMode="cover" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity activeOpacity={0.92} style={boxStyle} onPress={() => setPhotosOpen(true)}>
        <Ionicons name="camera" size={18} color={COLORS.brand} />
        <Text style={styles.addPhotoTxt}>Add Photo</Text>
      </TouchableOpacity>
    );
  };

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

        <TouchableOpacity onPress={() => router.push("/profile/settings/History")} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="refresh-outline" size={22} color={COLORS.brand} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/profile/settings/Security")}
          style={styles.iconBtn}
          hitSlop={12}
        >
          <Ionicons name="eye-outline" size={22} color={COLORS.brand} />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.center}>
        <View style={styles.avatarRing}>
          <Image
            key={avatarKey}
            source={{ uri: avatarUri }}
            style={styles.avatar}
            onError={() => setProfile((p) => ({ ...p, photos: [] }))}
          />
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={14} color="#fff" />
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percentTxt}>45%</Text>
          </View>
        </View>

        <Text style={styles.nameTxt}>{profile.name || "Your Name"}</Text>

        {loadingProfile ? (
          <Text style={styles.metaTxt}>Loading profile…</Text>
        ) : profileErr ? (
          <Text style={[styles.metaTxt, { color: COLORS.danger }]}>{profileErr}</Text>
        ) : null}

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

      {/* Photos */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Photos</Text>

          <TouchableOpacity onPress={() => setPhotosOpen(true)} activeOpacity={0.92} style={styles.showMoreBtn}>
            <Text style={styles.showMoreTxt}>Show more</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.brand} />
          </TouchableOpacity>
        </View>

        <View style={styles.photosGrid}>
          <PhotoTile uri={slot0} big />

          <View style={styles.photoRow}>
            <View style={styles.photoSmallWrap}>
              <PhotoTile uri={slot1} />
            </View>
            <View style={styles.photoSmallWrap}>
              <PhotoTile uri={slot2} />
            </View>
          </View>
        </View>
      </View>

      <PhotosManagerModal
        visible={photosOpen}
        onClose={() => setPhotosOpen(false)}
        photos={photos}
        maxPhotos={6}
        minPhotos={5}
        onUpload={uploadPhoto}
        onDelete={deletePhoto}
      />

      {/* About */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <TouchableOpacity onPress={() => router.push("/profile/AboutMe")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color={COLORS.brand} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionBodyTxt}>{profile.about || "Add something about you..."}</Text>
      </View>

      {/* Interests */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <TouchableOpacity onPress={() => router.push("/profile/settings/Preferences")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color={COLORS.brand} />
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
          <TouchableOpacity onPress={() => router.push("/profile/settings/Preferences")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color={COLORS.brand} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionBodyTxt}>
          {profile.languages?.length ? profile.languages.join(", ") : "No languages specified"}
        </Text>
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
        </View>
      </Modal>
    </ScrollView>
  );
}
