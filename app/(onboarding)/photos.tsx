// app/(onboarding)/photos.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Image,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { generateReactNativeHelpers } from "@uploadthing/expo";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";


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

// Helpers (fallback keeps runtime stable for dev)
const { useUploadThing } = generateReactNativeHelpers({
  url: UT_ENDPOINT || "http://localhost:3000/api/uploadthing",
});

export default function PhotosScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [uploaded, setUploaded] = useState<UploadedPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const remaining = MAX_PHOTOS - uploaded.length;

  // Animations (subtle, consistent with your “name/about” polish)
  const cardScale = useRef(new Animated.Value(1)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  const bump = (v: Animated.Value, to = 1) => {
    v.setValue(0.99);
    Animated.spring(v, { toValue: to, friction: 6, tension: 220, useNativeDriver: true }).start();
  };

  // ✅ Use startUpload so WE control how many files actually get uploaded.
  // This prevents UploadThing FileCountMismatch / "invalid config" when the gallery lets user select more than 6.
  const { startUpload, isUploading } = useUploadThing("profilePhotos", {
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

      bump(cardScale);
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

  const ensurePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  };

  const pickAndUpload = async () => {

    console.log("🟦 [DEBUG] API_BASE_RAW:", API_BASE_RAW);
    console.log("🟦 [DEBUG] UT_ENDPOINT:", UT_ENDPOINT);
    console.log("🟦 [DEBUG] isLoaded:", isLoaded);
    console.log("🟦 [DEBUG] user?.id:", user?.id);

    if (saving || isUploading) return;
    setErr(null);

    if (!API_BASE_RAW || !UT_ENDPOINT) {
      setErr("Config issue: extra.apiBaseUrl is missing.");
      return;
    }
    if (remaining <= 0) return;

    bump(cardScale);

    const ok = await ensurePermissions();
    if (!ok) {
      setErr("Please allow photo permissions to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,

      // ✅ This helps on platforms that enforce it (iOS).
      // Some Android galleries may still let you tap more, but we slice before uploading anyway.
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });

    if (result.canceled) return;

    const assets = result.assets ?? [];

    console.log("🟦 [DEBUG] Picked assets count:", assets.length);
    console.log("🟦 [DEBUG] First asset sample:", assets[0]);

    if (assets.length === 0) return;

    // ✅ Hard clamp: never upload more than remaining (prevents FileCountMismatch)
    const clamped = assets.slice(0, remaining);

    if (assets.length > remaining) {
      // keep UX nice — you can switch to Alert if you want it louder
      setErr(`You can add up to ${MAX_PHOTOS} photos. Uploading first ${remaining}.`);
      // Optional: also alert
      // Alert.alert("Too many photos", `You can add up to ${MAX_PHOTOS}. Uploading first ${remaining}.`);
    }

    // Build RN upload files expected by UploadThing
    // --- inside pickAndUpload() AFTER you compute `clamped` ---

    // ✅ Convert HEIC -> JPEG
    const files = await Promise.all(
      clamped.map(async (a, idx) => {
        const originalUri = a.uri;

        const isHeic =
          (a.mimeType && a.mimeType.toLowerCase().includes("heic")) ||
          (a.fileName && a.fileName.toLowerCase().endsWith(".heic")) ||
          originalUri.toLowerCase().endsWith(".heic");

        let finalUri = originalUri;
        let name =
          (a.fileName && String(a.fileName)) ||
          `photo-${Date.now()}-${idx}.jpg`;
        let type = (a.mimeType && String(a.mimeType)) || "image/jpeg";

        console.log("🟦 [FILE] picked:", {
          idx,
          fileName: a.fileName,
          mimeType: a.mimeType,
          fileSize: a.fileSize,
          uri: originalUri,
          isHeic,
        });

        // ✅ Convert HEIC -> JPEG
        if (isHeic) {
          const out = await ImageManipulator.manipulateAsync(
            originalUri,
            [],
            { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
          );

          finalUri = out.uri;
          name = `photo-${Date.now()}-${idx}.jpg`;
          type = "image/jpeg";

          console.log("🟦 [FILE] converted HEIC -> JPEG:", {
            idx,
            outUri: finalUri,
            name,
            type,
          });
        } else {
          // ✅ Ensure a sane name + extension for non-heic too
          const hasExt = /\.[a-z0-9]+$/i.test(name);
          if (!hasExt) name = `${name}.jpg`;
          if (!type) type = "image/jpeg";
        }

        // ✅ IMPORTANT: UploadThing needs `size` in init payload
        const info = await FileSystem.getInfoAsync(finalUri);
        // size can be undefined on some platforms/files
        const size =
          (typeof (info as any)?.size === "number" && (info as any).size) ||
          (typeof a.fileSize === "number" && a.fileSize) ||
          0;

        console.log("🟦 [FILE] final descriptor:", {
          idx,
          finalUri,
          name,
          type,
          size,
          fsExists: (info as any)?.exists,
        });

        return {
          uri: finalUri,
          name,
          type,
          size, // ✅ REQUIRED
        };
      })
    );

    console.log(
      "🟦 [FILE] files payload being sent to startUpload:",
      files.map((f, i) => ({ i, name: f.name, type: f.type, size: f.size, uri: f.uri }))
    );

    // Optional: fail fast if size is missing (helps debugging)
    const bad = files.find((f) => !f.size || f.size <= 0);
    if (bad) {
      console.log("🟥 [FILE] Invalid file descriptor (missing size):", bad);
      setErr("Could not read file size. Please try selecting a different photo.");
      return;
    }

    try {
      console.log("🟨 [UT][client] startUpload files:", files.length, "remaining:", remaining);

      if (!isLoaded || !user) {
        setErr("User not loaded. Please try again.");
        return;
      }

      // ✅ IMPORTANT: DO NOT pass { input: ... } and DO NOT pass headers here.
      // Headers are already set in useUploadThing(...) options.
      console.log("🟨 [DEBUG] Calling startUpload with input:", { clerkUserId: user.id });

      const res = await startUpload(files as any, { clerkUserId: user.id });
      console.log("🟩 [DEBUG] startUpload result:", res);

      if (Array.isArray(res) && res.length) {
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

        bump(cardScale);
      }
    } catch (e: any) {
      console.log("🟥 [UT][client] startUpload error:", e);
      setErr(e?.message || "Upload failed");
    }
  };

  const removePhoto = (key: string) => {
    if (saving || isUploading) return;
    setUploaded((prev) => prev.filter((p) => p.key !== key));
    bump(cardScale);
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

      const res = await fetch(`${apiBase}/api/onboarding/photos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: user.id, photos: photoUrls }),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `Failed to save photos (${res.status}).`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch { }
        throw new Error(msg);
      }

      router.replace("/");
    } catch (e: any) {
      setErr(e?.message || "Failed to finish onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const title =
    uploaded.length === 0 ? "Add from gallery" : remaining > 0 ? "Add more photos" : "All set";

  const sub =
    remaining > 0
      ? `${uploaded.length}/${MAX_PHOTOS} uploaded • ${remaining} left`
      : `${MAX_PHOTOS}/${MAX_PHOTOS} uploaded`;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[THEME.bgTop, THEME.bgMid, THEME.bgBot]} style={styles.bg}>
        {/* Top bar */}
        <View style={styles.topBar}>
          {/* <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.9 }]}>
            <Ionicons name="chevron-back" size={20} color={THEME.text} />
          </Pressable> */}

          {/* <Text style={styles.brandText}>Pulse</Text> */}

          <View style={{ width: 44 }} />
        </View>

        <View style={styles.page}>
          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              {/* <View style={styles.stepPill}>
                <Ionicons name="images-outline" size={14} color={THEME.ctaB} />
                <Text style={styles.stepText}>Step 6 of 6</Text>
              </View> */}

              {/* <View style={styles.heroIcon}>
                <Ionicons name="sparkles" size={16} color={THEME.ctaA} />
              </View> */}
            </View>

            <Text style={styles.h1}>Add photos</Text>
            <Text style={styles.h2}>
              Add {MIN_PHOTOS}–{MAX_PHOTOS} photos. You can change these later.
            </Text>
          </View>

          {/* CARD */}
          <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
            {/* Uploader */}
            <Pressable
              onPress={pickAndUpload}
              disabled={saving || isUploading || remaining <= 0}
              style={({ pressed }) => [
                styles.uploader,
                (saving || isUploading || remaining <= 0) && { opacity: 0.55 },
                pressed && remaining > 0 && !saving && !isUploading && { transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={styles.uploaderIcon}>
                <Ionicons name="add" size={22} color={THEME.text} />
              </View>

              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.uploaderTitle}>{title}</Text>
                <Text style={styles.uploaderSub}>{sub}</Text>
              </View>

              {isUploading ? (
                <ActivityIndicator color={THEME.text} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={THEME.muted} />
              )}
            </Pressable>

            {/* Grid / Empty */}
            <View style={styles.gridWrap}>
              {uploaded.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="image-outline" size={22} color={THEME.muted} />
                  </View>
                  <Text style={styles.emptyTitle}>No photos yet</Text>
                  <Text style={styles.emptySub}>Your first photo makes your profile feel real.</Text>

                  <Pressable
                    onPress={pickAndUpload}
                    disabled={saving || isUploading || remaining <= 0}
                    style={({ pressed }) => [
                      styles.ghostBtn,
                      (saving || isUploading) && { opacity: 0.6 },
                      pressed && { transform: [{ scale: 0.99 }] },
                    ]}
                  >
                    <Text style={styles.ghostText}>Add your first photo</Text>
                    <Ionicons name="arrow-forward" size={14} color={THEME.text} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.grid}>
                  {uploaded.map((p, idx) => (
                    <View key={p.key} style={styles.thumb}>
                      <Image source={{ uri: p.url }} style={styles.thumbImg} />

                      {/* Rank chip */}
                      <View style={styles.rankChip}>
                        <Text style={styles.rankText}>{idx + 1}</Text>
                      </View>

                      {/* Remove */}
                      <Pressable
                        onPress={() => removePhoto(p.key)}
                        disabled={saving || isUploading}
                        style={({ pressed }) => [styles.removeBtn, pressed && { transform: [{ scale: 0.96 }] }]}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {!!err && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={THEME.bad} />
                <Text style={styles.errorText}>{err}</Text>
              </View>
            )}

            {/* CTA */}
            <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
              <Pressable
                onPress={() => {
                  bump(ctaScale, 1);
                  onFinish();
                }}
                disabled={!canFinish}
                style={({ pressed }) => [
                  styles.primaryWrap,
                  !canFinish && { opacity: 0.5 },
                  pressed && canFinish && { transform: [{ scale: 0.99 }] },
                ]}
              >
                <LinearGradient
                  colors={[THEME.ctaA, THEME.ctaB]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primary}
                >
                  {saving ? (
                    <ActivityIndicator color="#0B0B12" />
                  ) : (
                    <View style={styles.primaryRow}>
                      <Text style={styles.primaryText}>
                        {uploaded.length < MIN_PHOTOS ? `Add ${MIN_PHOTOS - uploaded.length} more` : "Finish"}
                      </Text>
                      <Ionicons
                        name={uploaded.length < MIN_PHOTOS ? "arrow-forward" : "checkmark"}
                        size={16}
                        color="#0B0B12"
                      />
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Text style={styles.micro}>
              Tip: Make your first photo a clear face shot.{" "}
              {Platform.OS === "ios" ? "Good lighting wins." : "No heavy filters."}
            </Text>

            {!API_BASE_RAW ? (
              <View style={[styles.errorBox, { marginTop: 10 }]}>
                <Ionicons name="bug-outline" size={18} color={THEME.bad} />
                <Text style={styles.errorText}>Config issue: extra.apiBaseUrl is missing.</Text>
              </View>
            ) : null}
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const THEME = {
  bgTop: "#0B0B12",
  bgMid: "#14102A",
  bgBot: "#090A10",

  text: "#F5F7FF",
  muted: "rgba(245,247,255,0.72)",
  placeholder: "rgba(245,247,255,0.35)",

  border: "rgba(255,255,255,0.14)",
  card: "rgba(255,255,255,0.06)",

  ctaA: "#B8FF6A",
  ctaB: "#6AF0FF",

  bad: "#FB7185",
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bgTop },
  bg: { flex: 1 },

  topBar: {
    paddingHorizontal: 18,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 16,
  },

  hero: { paddingHorizontal: 2, gap: 10 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  stepPill: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepText: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 12,
    letterSpacing: 0.2,
  },

  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },

  h1: {
    color: THEME.text,
    fontFamily: "Sora_700Bold",
    fontSize: 28,
    letterSpacing: -0.6,
  },
  h2: {
    color: THEME.muted,
    fontFamily: "Sora_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },

  card: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },

  uploader: {
    height: 88,
    borderRadius: 22,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  uploaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploaderTitle: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 15, letterSpacing: 0.2 },
  uploaderSub: { color: THEME.muted, fontFamily: "Sora_600SemiBold", fontSize: 12, lineHeight: 16 },

  gridWrap: { marginTop: 14 },

  emptyState: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 220,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  emptyTitle: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 14 },
  emptySub: {
    color: THEME.muted,
    fontFamily: "Sora_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 4,
  },

  ghostBtn: {
    marginTop: 4,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ghostText: { color: THEME.text, fontFamily: "Sora_700Bold", fontSize: 12 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  thumb: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%" },

  rankChip: {
    position: "absolute",
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: "#fff", fontFamily: "Sora_700Bold", fontSize: 11 },

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

  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.16)",
  },
  errorText: {
    flex: 1,
    color: "#FFD1DA",
    fontFamily: "Sora_600SemiBold",
    fontSize: 12,
    lineHeight: 18,
  },

  primaryWrap: { marginTop: 14, borderRadius: 18, overflow: "hidden" },
  primary: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryText: {
    color: "#0B0B12",
    fontFamily: "Sora_700Bold",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  micro: {
    marginTop: 12,
    color: "rgba(245,247,255,0.70)",
    fontFamily: "Sora_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
