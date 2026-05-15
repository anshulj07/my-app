// app/(onboarding)/photos.tsx — Step 6 of 6
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { generateReactNativeHelpers } from "@uploadthing/expo";

import heroImage from "../../assets/IMG_0016.png";

type UploadedPhoto = {
  url: string;
  key: string;
  name: string;
  size: number;
};

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;
const STEP = 6;
const TOTAL = 6;

const API_BASE_RAW = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
const UT_ENDPOINT = API_BASE_RAW ? `${API_BASE_RAW.replace(/\/$/, "")}/api/uploadthing` : undefined;

const { useImageUploader } = generateReactNativeHelpers({
  url: UT_ENDPOINT || "http://localhost:3000/api/uploadthing",
});

export default function PhotosScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const HEADER_FULL = height * 0.3;

  const [uploaded, setUploaded] = useState<UploadedPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const remaining = MAX_PHOTOS - uploaded.length;

  const { openImagePicker, isUploading } = useImageUploader("profilePhotos", {
    headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,

    onClientUploadComplete(res) {
      if (!Array.isArray(res) || res.length === 0) return;
      setUploaded((prev) => {
        const merged = [
          ...prev,
          ...res.map((r: any) => ({
            url: String(r.url),
            key: String(r.key),
            name: String(r.name),
            size: Number(r.size ?? 0),
          })),
        ];
        const seen = new Set<string>();
        return merged.filter((p) => {
          if (seen.has(p.key)) return false;
          seen.add(p.key);
          return true;
        }).slice(0, MAX_PHOTOS);
      });
    },

    onUploadError(e) {
      setErr(e?.message || "Upload failed. Please try again.");
    },
  });

  const canFinish = uploaded.length >= MIN_PHOTOS && !saving && !isUploading;

  const pickAndUpload = async () => {
    if (saving || isUploading || remaining <= 0) return;
    setErr(null);
    await openImagePicker({
      source: "library",
      quality: 0.85,
      onCancel() {},
      onInsufficientPermissions() {
        setErr("Please allow photo access to continue.");
      },
    });
  };

  const removePhoto = (key: string) => {
    if (saving || isUploading) return;
    setUploaded((prev) => prev.filter((p) => p.key !== key));
  };

  const onFinish = async () => {
    if (!isLoaded || !user) return;
    setSaving(true);
    setErr(null);
    try {
      if (uploaded.length < MIN_PHOTOS) throw new Error(`Please add at least ${MIN_PHOTOS} photos.`);
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          photos: uploaded.map((p) => p.url),
          onboardingComplete: true,
        },
      });
      router.replace("/");
    } catch (e: any) {
      setErr(e?.message || "Failed to finish setup.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>

      {/* Header with hero image */}
      <View style={[styles.header, { height: HEADER_FULL }]}>
        <Image source={heroImage} style={{ width, height: HEADER_FULL }} resizeMode="cover" />
        <View style={[styles.headerInner, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.photoDotsRow}>
            {Array.from({ length: MAX_PHOTOS }, (_, i) => (
              <View key={i} style={[styles.photoDot, i < uploaded.length && styles.photoDotFilled]} />
            ))}
          </View>
        </View>
      </View>

      {/* White content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentInner, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepLabel}>STEP {STEP} OF {TOTAL}</Text>
        <Text style={styles.title}>Add your photos</Text>
        <Text style={styles.subtitle}>
          Add {MIN_PHOTOS}–{MAX_PHOTOS} photos so others can recognise you at meetups.
        </Text>

        {/* Upload button */}
        <TouchableOpacity
          onPress={pickAndUpload}
          activeOpacity={0.85}
          disabled={saving || isUploading || remaining <= 0}
          style={[styles.uploadBtn, (remaining <= 0) && { opacity: 0.5 }]}
        >
          {isUploading ? (
            <>
              <ActivityIndicator color="#6B46C1" style={{ marginRight: 10 }} />
              <Text style={styles.uploadBtnText}>Uploading…</Text>
            </>
          ) : (
            <>
              <View style={styles.uploadIconCircle}>
                <Ionicons name="add" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.uploadBtnText}>
                  {uploaded.length === 0 ? "Choose from gallery" : "Add more photos"}
                </Text>
                <Text style={styles.uploadBtnSub}>{uploaded.length}/{MAX_PHOTOS} photos added</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#aaa" />
            </>
          )}
        </TouchableOpacity>

        {/* Photo grid */}
        {uploaded.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="images-outline" size={32} color="#C5B8E8" />
            </View>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySub}>
              Your first photo makes your profile feel real and builds trust with other members.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {uploaded.map((p, idx) => (
              <View key={p.key} style={styles.thumb}>
                <Image source={{ uri: p.url }} style={styles.thumbImg} />
                {idx === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Main</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => removePhoto(p.key)}
                  activeOpacity={0.9}
                  disabled={saving || isUploading}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {uploaded.length > 0 && uploaded.length < MIN_PHOTOS && (
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={16} color="#6B46C1" />
            <Text style={styles.hintText}>
              Add {MIN_PHOTOS - uploaded.length} more photo{MIN_PHOTOS - uploaded.length > 1 ? "s" : ""} to continue
            </Text>
          </View>
        )}

        {!!err && <Text style={styles.errText}>{err}</Text>}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={onFinish}
          disabled={!canFinish}
          style={[styles.cta, !canFinish && styles.ctaDisabled]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>
              {uploaded.length < MIN_PHOTOS
                ? `Add ${MIN_PHOTOS - uploaded.length} more photo${MIN_PHOTOS - uploaded.length > 1 ? "s" : ""}`
                : "Finish setup"}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>You can add and change photos from your profile later.</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#3D2875" },

  header: {
    overflow: "hidden",
    position: "relative",
  },
  headerInner: {
    paddingHorizontal: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoDotsRow: { flexDirection: "row", gap: 6 },
  photoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  photoDotFilled: { backgroundColor: "#fff" },

  content: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  stepLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B46C1",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
    marginBottom: 20,
  },

  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E0F5",
    padding: 16,
    marginBottom: 20,
  },
  uploadIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#5B3FA0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  uploadBtnText: { fontSize: 15, fontWeight: "700", color: "#111" },
  uploadBtnSub: { fontSize: 12, color: "#999", marginTop: 2 },

  emptyState: {
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E0F5",
    borderStyle: "dashed",
    padding: 36,
    marginBottom: 20,
    gap: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EDE8F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#333" },
  emptySub: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  thumb: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#EDE8F8",
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%" },
  mainBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "#5B3FA0",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  mainBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EDE8F8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C5B8E8",
  },
  hintText: { fontSize: 13, color: "#5B3FA0", flex: 1, lineHeight: 18 },

  errText: { color: "#EF4444", fontSize: 13, marginBottom: 14 },

  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EDF8",
    alignItems: "center",
  },
  cta: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    backgroundColor: "#5B3FA0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  ctaDisabled: { backgroundColor: "#C5B8E8" },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  footerNote: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 18,
  },
});
