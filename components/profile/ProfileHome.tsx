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
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { apiFetch } from "../../lib/apiFetch";

import PhotosManagerModal from "./PhotosManagerModal";
import { styles, COLORS } from "./profileHome.styles";

type ProfileData = {
  name?: string;
  username?: string;
  about?: string;
  interests?: string[];
  languages?: string[] | null;
  photos?: string[];
  avatar?: string | null;
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
  const [menuOpen, setMenuOpen] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const openPreview = useCallback((uri: string | null) => {
    if (!uri) return;
    setPreviewUri(uri);
    setPreviewOpen(true);
  }, []);

  const photos = useMemo(() => sanitizePhotos(profile.photos), [profile.photos]);
  const slot0 = photos[0] ?? null;
  const slot1 = photos[1] ?? null;
  const slot2 = photos[2] ?? null;

  const avatarUri = profile.avatar ?? "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
  const avatarKey = `avatar:${avatarUri}`;

  const fetchProfile = useCallback(async () => {
    if (!API_BASE || !userId) return;

    setLoadingProfile(true);
    setProfileErr(null);

    try {
      const base = API_BASE.replace(/\/$/, "");
      const url = `${base}${PROFILE_ENDPOINT}?clerkUserId=${encodeURIComponent(userId)}`;

      const res = await apiFetch(url, {
        method: "GET",
        headers: {
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        const msg = txt
          ? (() => {
              try {
                const j = JSON.parse(txt);
                return j?.error || j?.detail || txt;
              } catch {
                return txt;
              }
            })()
          : `Failed to fetch profile (${res.status})`;
        throw new Error(typeof msg === "string" ? msg : `Failed to fetch profile (${res.status})`);
      }

      const j = await res.json().catch(() => ({} as any));
      const src = (j && typeof j === "object" && (j.profile || j.data || j)) as any;

      const next: ProfileData = {
        name: typeof src?.name === "string" ? src.name : undefined,
        username: typeof src?.username === "string" ? src.username : undefined,
        about: typeof src?.about === "string" ? src.about : undefined,
        interests: Array.isArray(src?.interests) ? src.interests : [],
        languages: Array.isArray(src?.languages) && src.languages.length > 0 ? src.languages : null,
        photos: Array.isArray(src?.photos) ? src.photos : [],
        avatar: typeof src?.avatar === "string" ? src.avatar : null,
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

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

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

  async function uploadPhoto(replaceUri?: string | null, isAvatar?: boolean) {
    if (!API_BASE || !userId) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      throw new Error("Please allow photo permissions to continue.");
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (picked.canceled) return;
    const asset = picked.assets?.[0];
    const uri = asset?.uri;
    if (!uri) throw new Error("No photo selected.");

    const base = API_BASE.replace(/\/$/, "");
    let url = `${base}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
    if (isAvatar) {
      url += `&isAvatar=true`;
    } else if (replaceUri) {
      url += `&replaceUri=${encodeURIComponent(replaceUri)}`;
    }

    const form = new FormData();
    const fileName =
      typeof asset?.fileName === "string" && asset.fileName.trim()
        ? asset.fileName.trim()
        : `photo_${Date.now()}.jpg`;
    const mimeType = typeof asset?.mimeType === "string" && asset.mimeType ? asset.mimeType : "image/jpeg";

    form.append("file", {
      uri,
      name: fileName,
      type: mimeType,
    } as any);

    const res = await apiFetch(url, {
      method: "POST",
      headers: {
        ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      },
      body: form as any,
    });

    const text = await res.text().catch(() => "");
    console.log("[uploadPhoto]", res.status, text);

    if (!res.ok) {
      let msg = `Failed to upload photo (${res.status})`;
      if (text) {
        try {
          const j = JSON.parse(text);
          msg = j?.error || j?.detail || msg;
        } catch {
          msg = text;
        }
      }
      throw new Error(msg);
    }

    await fetchProfile();
  }

  async function deletePhoto(uri: string, isAvatar?: boolean) {
    if (!API_BASE || !userId) return;

    const base = API_BASE.replace(/\/$/, "");
    let url = `${base}/api/profile/photos?clerkUserId=${encodeURIComponent(userId)}`;
    if (isAvatar) {
      url += `&isAvatar=true`;
    }

    const res = await apiFetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      },
      body: JSON.stringify({ uri }),
    });

    const text = await res.text();
    console.log("[deletePhoto]", res.status, text);

    if (!res.ok) {
      let msg = `Failed to delete photo (${res.status})`;
      if (text) {
        try {
          const j = JSON.parse(text);
          msg = j?.error || j?.detail || msg;
        } catch {
          msg = text;
        }
      }
      throw new Error(msg);
    }
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
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openPreview(avatarUri)}
          style={styles.avatarRing}
        >
          <Image
            key={avatarKey}
            source={{ uri: avatarUri }}
            style={styles.avatar}
            onError={() => setProfile((p) => ({ ...p, photos: [] }))}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMenuOpen(true)}
            style={styles.editBadge}
          >
            <Ionicons name="pencil" size={14} color="#fff" />
          </TouchableOpacity>
          <View style={styles.percentBadge}>
            <Text style={styles.percentTxt}>45%</Text>
          </View>
        </TouchableOpacity>

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
          <Text style={styles.sectionTitle}>Phoos</Text>

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
        maxPhotos={20}
        minPhotos={0}
        onUpload={uploadPhoto}
        onDelete={deletePhoto}
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
          {profile.interests?.length ? (
            profile.interests.map((x) => (
              <View key={x} style={styles.chip}>
                <Text style={styles.chipTxt}>{x}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#9CA3AF", fontSize: 14 }}>Select your interests</Text>
          )}
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
          {profile.languages?.length ? (
            profile.languages.map((x) => (
              <View key={x} style={styles.chip}>
                <Text style={styles.chipTxt}>{x}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#9CA3AF", fontSize: 14 }}>No languages selected. Tap to choose.</Text>
          )}
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

          {/* Edit button in preview if it's the avatar */}
          {previewUri === avatarUri && (
            <TouchableOpacity
              style={styles.previewEdit}
              activeOpacity={0.92}
              onPress={() => {
                setPreviewOpen(false);
                setMenuOpen(true);
              }}
            >
              <Ionicons name="pencil" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Edit Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Profile Photo</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setMenuOpen(false);
                try {
                  await uploadPhoto(null, true);
                } catch (e: any) {
                  alert(e.message);
                }
              }}
            >
              <Ionicons name="image-outline" size={22} color={COLORS.text} />
              <Text style={styles.menuLabel}>Update Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={async () => {
                setMenuOpen(false);
                try {
                  await deletePhoto("", true);
                } catch (e: any) {
                  alert(e.message);
                }
              }}
            >
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              <Text style={[styles.menuLabel, styles.menuLabelDelete]}>Remove Profile Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
