// app/profile/index.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import PhotosManagerModal from "../../components/profile/PhotosManagerModal";
// (adjust path if needed based on your folder)


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
const PHOTOS_ENDPOINT = "/api/profile/photos";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, userId } = useAuth();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [profile, setProfile] = useState<ProfileData>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);

// ✅ Replace these with your real upload flow (UploadThing / ImagePicker etc.)
async function uploadPhoto() {
  // TODO: pick image -> upload -> get URL -> call your backend PATCH to add into profile.photos
  // After success:
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

  const text = await res.text(); // ✅ IMPORTANT: capture backend error
  console.log("[deletePhoto]", res.status, text);

  if (!res.ok) {
    throw new Error(text || `Failed to delete photo (${res.status})`);
  }

  await fetchProfile();
}





  const fetchProfile = useCallback(async () => {
    if (!API_BASE || !userId) return;

    setLoadingProfile(true);
    setProfileErr(null);

    try {
      const base = API_BASE.replace(/\/$/, "");
      const url = `${base}${PROFILE_ENDPOINT}?clerkUserId=${encodeURIComponent(userId)}`;
      console.log("[Profile] GET", url);

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

 const photos = Array.isArray(profile.photos)
  ? profile.photos.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
  : [];

const slot0 = photos[0] ?? null;
const slot1 = photos[1] ?? null;
const slot2 = photos[2] ?? null;

// ✅ Avatar should be FIRST uploaded photo (slot0)
const avatarUri = slot0 ?? "https://i.pravatar.cc/200";

// ✅ Forces iOS Image to refresh when DB photo changes
const avatarKey = `avatar:${avatarUri}`;


  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push("/profile/settings")}
          style={styles.iconBtn}
          hitSlop={12}
        >
          <Ionicons name="settings-outline" size={22} color="#FF4D6D" />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => router.push("/profile/settings/History")}
          style={styles.iconBtn}
          hitSlop={12}
        >
          <Ionicons name="refresh-outline" size={22} color="#FF4D6D" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/profile/settings/Security")}
          style={styles.iconBtn}
          hitSlop={12}
        >
          <Ionicons name="eye-outline" size={22} color="#FF4D6D" />
        </TouchableOpacity>
      </View>

        <View style={styles.center}>
          <View style={styles.avatarRing}>
            <Image
              key={avatarKey}
                source={{ uri: avatarUri }}
                style={styles.avatar}
                onError={() => {
                // optional: if the remote URL fails, you’ll at least see the fallback next refresh
                setProfile((p) => ({ ...p, photos: [] }));
              }}
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
          <Text style={[styles.metaTxt, { color: "#EF4444" }]}>{profileErr}</Text>
        ) : null}

        <View style={styles.handlePill}>
          <Ionicons name="logo-instagram" size={18} color="#fff" />
          <Text style={styles.handleTxt}>
            {profile.username ? `@${profile.username}` : "@your_username"}
          </Text>
          <Ionicons name="pencil" size={16} color="#fff" style={{ marginLeft: 8, opacity: 0.9 }} />
        </View>
      </View>

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

      {/* Photos (DB) */}
<View style={styles.sectionCard}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Photos</Text>

    {/* ✅ Show more button instead of pencil */}
    <TouchableOpacity onPress={() => setPhotosOpen(true)} activeOpacity={0.9} style={styles.showMoreBtn}>
      <Text style={styles.showMoreTxt}>Show more</Text>
      <Ionicons name="chevron-forward" size={16} color="#FF4D6D" />
    </TouchableOpacity>
  </View>

  <View style={styles.photosGrid}>
    {/* Big */}
    {slot0 ? (
      <Image source={{ uri: slot0 }} style={styles.photoBigImg} resizeMode="cover" />
    ) : (
      <TouchableOpacity
        style={[styles.photoBox, styles.photoBig]}
        activeOpacity={0.9}
        onPress={() => setPhotosOpen(true)}
      >
        <Ionicons name="camera" size={18} color="#FF4D6D" />
        <Text style={styles.addPhotoTxt}>Add Photo</Text>
      </TouchableOpacity>
    )}

    {/* 2 small */}
    <View style={styles.photoRow}>
      {slot1 ? (
        <Image source={{ uri: slot1 }} style={styles.photoSmallImg} resizeMode="cover" />
      ) : (
        <TouchableOpacity
          style={[styles.photoBox, styles.photoSmall]}
          activeOpacity={0.9}
          onPress={() => setPhotosOpen(true)}
        >
          <Ionicons name="camera" size={18} color="#FF4D6D" />
          <Text style={styles.addPhotoTxt}>Add Photo</Text>
        </TouchableOpacity>
      )}

      {slot2 ? (
        <Image source={{ uri: slot2 }} style={styles.photoSmallImg} resizeMode="cover" />
      ) : (
        <TouchableOpacity
          style={[styles.photoBox, styles.photoSmall]}
          activeOpacity={0.9}
          onPress={() => setPhotosOpen(true)}
        >
          <Ionicons name="camera" size={18} color="#FF4D6D" />
          <Text style={styles.addPhotoTxt}>Add Photo</Text>
        </TouchableOpacity>
      )}
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


      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <TouchableOpacity onPress={() => router.push("/profile/AboutMe")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color="#FF4D6D" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionBodyTxt}>{profile.about || "Add something about you..."}</Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <TouchableOpacity onPress={() => router.push("/profile/settings/Preferences")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color="#FF4D6D" />
          </TouchableOpacity>
        </View>

        <View style={styles.chipsWrap}>
          {(profile.interests?.length ? profile.interests : ["Foodie", "Cooking", "Coffee", "Wine Tasting"]).map(
            (x) => (
              <View key={x} style={styles.chip}>
                <Text style={styles.chipTxt}>{x}</Text>
              </View>
            )
          )}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <TouchableOpacity onPress={() => router.push("/profile/settings/Preferences")} hitSlop={12}>
            <Ionicons name="pencil" size={18} color="#FF4D6D" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionBodyTxt}>
          {profile.languages?.length ? profile.languages.join(", ") : "No languages specified"}
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.9} onPress={onLogout}>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: "#FFD1DC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  avatar: { width: 102, height: 102, borderRadius: 51 },
  editBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF4D6D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  percentBadge: {
    position: "absolute",
    right: -8,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFE4EA",
  },
  percentTxt: { color: "#FF4D6D", fontWeight: "800", fontSize: 12 },

  nameTxt: { marginTop: 14, fontSize: 28, fontWeight: "800", color: "#111827" },
  metaTxt: { marginTop: 6, fontSize: 12, color: "#6B7280", fontWeight: "700" },

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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF5F7",
    alignItems: "center",
    justifyContent: "center",
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
  showMoreBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: "#FFF1F5",
  borderWidth: 1,
  borderColor: "#FFD1DC",
},
showMoreTxt: {
  color: "#FF4D6D",
  fontWeight: "900",
  fontSize: 13,
},


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

  photoBigImg: { width: "100%", height: 160, borderRadius: 16 },
  photoSmallImg: { flex: 1, height: 120, borderRadius: 16 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  chip: {
    backgroundColor: "#FFF1F5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFD1DC",
  },
  chipTxt: { color: "#111827", fontWeight: "700" },

  logoutBtn: {
    marginTop: 18,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  logoutTxt: { color: "#FF4D6D", fontWeight: "900", fontSize: 16 },
});
