// app/(onboarding)/photos.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { generateReactNativeHelpers } from "@uploadthing/expo";

type UploadedPhoto = {
  url: string;
  key: string;
  name: string;
  size: number;
};

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;

const API_BASE_RAW = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

// ✅ IMPORTANT: FULL endpoint, not just origin
const UT_ENDPOINT = API_BASE_RAW ? `${API_BASE_RAW.replace(/\/$/, "")}/api/uploadthing` : undefined;

// Only create helpers when we have a URL (prevents weird runtime behavior)
const { useImageUploader } = generateReactNativeHelpers({
  url: UT_ENDPOINT || "http://localhost:3000/api/uploadthing",
});

export default function PhotosScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [uploaded, setUploaded] = useState<UploadedPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const remaining = MAX_PHOTOS - uploaded.length;

  const { openImagePicker, isUploading } = useImageUploader("profilePhotos", {
    headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,

    onUploadBegin(fileName) {
      console.log("🟦 [UT][client] Upload begin:", fileName);
      console.log("🟦 [UT][client] Using endpoint:", UT_ENDPOINT);
    },

    onClientUploadComplete(res) {
      console.log("🟩 [UT][client] Upload complete:", res);

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
        const deduped = merged.filter((p) => {
          if (seen.has(p.key)) return false;
          seen.add(p.key);
          return true;
        });

        return deduped.slice(0, MAX_PHOTOS);
      });
    },

    onUploadError(e) {
      console.log("🟥 [UT][client] Upload error:", e);
      setErr(e?.message || "Upload failed");
    },
  });

  const canFinish = useMemo(
    () => uploaded.length >= MIN_PHOTOS && uploaded.length <= MAX_PHOTOS && !saving && !isUploading,
    [uploaded.length, saving, isUploading]
  );

  const pickAndUpload = async () => {
    if (saving || isUploading) return;
    setErr(null);

    if (!API_BASE_RAW || !UT_ENDPOINT) {
      setErr("Config issue: extra.apiBaseUrl is missing.");
      return;
    }
    if (remaining <= 0) return;

    console.log("🟨 [UT][client] Opening picker… remaining:", remaining);

    await openImagePicker({
      source: "library",
      quality: 0.85,
      onCancel() {
        console.log("🟨 [UT][client] Picker cancelled");
      },
      onInsufficientPermissions() {
        console.log("🟥 [UT][client] Missing photo permissions");
        setErr("Please allow photo permissions to continue.");
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
      if (!API_BASE_RAW) throw new Error("Missing API base URL (extra.apiBaseUrl).");
      if (uploaded.length < MIN_PHOTOS) throw new Error(`Please add at least ${MIN_PHOTOS} photos.`);

      const apiBase = API_BASE_RAW.replace(/\/$/, "");
      const photoUrls = uploaded.map((p) => p.url);

      console.log("🟦 Saving photo URLs:", photoUrls);

      const res = await fetch(`${apiBase}/api/onboarding/photos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: user.id, photos: photoUrls }),
      });

      const text = await res.text();
      console.log("🟦 Save response:", res.status, text);

      if (!res.ok) {
        let msg = `Failed to save photos (${res.status}).`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      router.replace("/");
    } catch (e: any) {
      console.log("🟥 Finish error:", e);
      setErr(e?.message || "Failed to finish onboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>Step 4 of 4</Text>
            </View>

            <View style={styles.spark}>
              <Ionicons name="images" size={16} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.h1}>Add photos</Text>
          <Text style={styles.h2}>
            Add {MIN_PHOTOS}–{MAX_PHOTOS} photos. You can change these later.
          </Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            onPress={pickAndUpload}
            activeOpacity={0.92}
            disabled={saving || isUploading || remaining <= 0}
            style={[styles.uploader, remaining <= 0 && { opacity: 0.55 }]}
          >
            <View style={styles.uploaderIcon}>
              <Ionicons name="add" size={22} color={COLORS.ink} />
            </View>

            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.uploaderTitle}>
                {uploaded.length === 0 ? "Add from gallery" : "Add more photos"}
              </Text>
              <Text style={styles.uploaderSub}>
                {remaining > 0 ? `${uploaded.length}/${MAX_PHOTOS} uploaded • ${remaining} left` : `${MAX_PHOTOS}/${MAX_PHOTOS} uploaded`}
              </Text>
            </View>

            {isUploading ? <ActivityIndicator color="#fff" /> : <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />}
          </TouchableOpacity>

          <View style={styles.gridWrap}>
            {uploaded.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="image-outline" size={26} color={COLORS.muted} />
                <Text style={styles.emptyTitle}>No photos yet</Text>
                <Text style={styles.emptySub}>Your first photo makes your profile feel real.</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {uploaded.map((p) => (
                  <View key={p.key} style={styles.thumb}>
                    <Image source={{ uri: p.url }} style={styles.thumbImg} />
                    <View style={styles.thumbShade} />
                    <TouchableOpacity
                      onPress={() => removePhoto(p.key)}
                      activeOpacity={0.9}
                      disabled={saving || isUploading}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {!!err && (
            <View style={styles.alert}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
              </View>
              <Text style={styles.alertText}>{err}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onFinish}
            activeOpacity={0.92}
            disabled={!canFinish}
            style={[styles.cta, !canFinish && styles.ctaDisabled]}
          >
            {saving ? (
              <>
                <Text style={styles.ctaText}>Saving…</Text>
                <ActivityIndicator color="#fff" />
              </>
            ) : (
              <>
                <Text style={styles.ctaText}>
                  {uploaded.length < MIN_PHOTOS ? `Add ${MIN_PHOTOS - uploaded.length} more` : "Finish"}
                </Text>
                <View style={styles.ctaIcon}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </View>
              </>
            )}
          </TouchableOpacity>

          {!API_BASE_RAW ? (
            <View style={[styles.alert, { marginTop: 12 }]}>
              <View style={styles.alertIcon}>
                <Ionicons name="bug-outline" size={18} color={COLORS.danger} />
              </View>
              <Text style={styles.alertText}>Config issue: extra.apiBaseUrl is missing.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * IMPORTANT:
 * Keep your existing COLORS + styles objects from your previous file below this comment.
 * Do NOT change names (COLORS, styles) because the JSX references them.
 *
 * (You asked me not to paste styles again.)
 */

const COLORS = {
  bg: "#0B0B12",
  card: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",
  ink: "#FFFFFF",
  inkSoft: "rgba(255,255,255,0.82)",
  muted: "rgba(255,255,255,0.62)",
  primary: "#FF4D6D",
  primary2: "#FF8A00",
  danger: "#FB7185",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    justifyContent: "center",
    gap: 16,
    backgroundColor: COLORS.bg,
  },

  hero: { paddingHorizontal: 2, gap: 10 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,77,109,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.25)",
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: COLORS.primary2,
    shadowColor: COLORS.primary2,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  pillText: { color: COLORS.ink, fontWeight: "900", fontSize: 12, letterSpacing: 0.25 },

  spark: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  h1: { color: COLORS.ink, fontSize: 34, fontWeight: "900", letterSpacing: -1.1, lineHeight: 40 },
  h2: { color: COLORS.muted, fontSize: 14, fontWeight: "700", lineHeight: 20 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },

  uploader: {
    height: 88,
    borderRadius: 22,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  uploaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  uploaderTitle: { color: COLORS.ink, fontWeight: "900", fontSize: 15, letterSpacing: 0.2 },
  uploaderSub: { color: COLORS.muted, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  gridWrap: { marginTop: 14 },

  emptyState: {
    height: 210,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
  },
  emptyTitle: { color: COLORS.ink, fontWeight: "900", fontSize: 14 },
  emptySub: { color: COLORS.muted, fontWeight: "800", fontSize: 12, textAlign: "center", lineHeight: 16 },

  // compact grid (tinder-ish)
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  thumb: {
    width: "31.5%", // 3 across with gap
    aspectRatio: 1,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    backgroundColor: "rgba(255,255,255,0.06)",
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  alert: {
    marginTop: 14,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.24)",
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(251,113,133,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: { color: "#FFE4EA", fontWeight: "900", flex: 1, lineHeight: 18 },

  cta: {
    marginTop: 18,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.3 },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  footerNote: { marginTop: 12, color: "rgba(255,255,255,0.55)", fontWeight: "800", fontSize: 12, lineHeight: 18 },
});
