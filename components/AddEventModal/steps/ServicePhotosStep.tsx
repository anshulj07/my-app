// ServicePhotosStep.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import Constants from "expo-constants";
import { generateReactNativeHelpers } from "@uploadthing/expo";

import type { WizardState, ServicePhoto } from "../wizard/wizardTypes";
import type { WizardAction } from "../wizard/wizardReducer";

const MAX_SERVICE_PHOTOS = 6;

const API_BASE_RAW = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
const UT_ENDPOINT = API_BASE_RAW ? `${API_BASE_RAW.replace(/\/$/, "")}/api/uploadthing` : undefined;

const { useUploadThing } = generateReactNativeHelpers({
  url: UT_ENDPOINT || "http://localhost:3000/api/uploadthing",
});

export default function ServicePhotosStep({
  state,
  dispatch,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const remaining = useMemo(
    () => MAX_SERVICE_PHOTOS - state.servicePhotos.length,
    [state.servicePhotos.length]
  );

  const [err, setErr] = useState<string | null>(null);

  // ✅ reuse the same UploadThing slug you already use in onboarding
  const { startUpload, isUploading } = useUploadThing("profilePhotos", {
    headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
    onUploadError(e) {
      const msg = e?.message || "Upload failed";
      setErr(msg);
      dispatch({ type: "SET_ERR", err: msg });
    },
  });

  const pickAndUpload = async () => {
    if (remaining <= 0 || isUploading) return;
    setErr(null);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      const msg = "Allow photo permissions to upload service photos.";
      setErr(msg);
      dispatch({ type: "SET_ERR", err: msg });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });

    if (result.canceled) return;

    const assets = (result.assets ?? []).slice(0, remaining);
    if (!assets.length) return;

    // 1) Add local photos immediately (uri only)
    const localPhotos: ServicePhoto[] = assets.map((a) => ({ uri: a.uri }));
    dispatch({ type: "ADD_SERVICE_PHOTOS", photos: localPhotos });

    // 2) Build UploadThing files
    const files = await Promise.all(
      assets.map(async (a, idx) => {
        const originalUri = a.uri;

        const isHeic =
          (a.mimeType && a.mimeType.toLowerCase().includes("heic")) ||
          (a.fileName && a.fileName.toLowerCase().endsWith(".heic")) ||
          originalUri.toLowerCase().endsWith(".heic");

        let finalUri = originalUri;
        let name = (a.fileName && String(a.fileName)) || `service-${Date.now()}-${idx}.jpg`;
        let type = (a.mimeType && String(a.mimeType)) || "image/jpeg";

        if (isHeic) {
          const out = await ImageManipulator.manipulateAsync(originalUri, [], {
            compress: 0.9,
            format: ImageManipulator.SaveFormat.JPEG,
          });
          finalUri = out.uri;
          name = `service-${Date.now()}-${idx}.jpg`;
          type = "image/jpeg";
        } else {
          if (!/\.[a-z0-9]+$/i.test(name)) name = `${name}.jpg`;
          if (!type) type = "image/jpeg";
        }

        const info = await FileSystem.getInfoAsync(finalUri);
        const size =
          (typeof (info as any)?.size === "number" && (info as any).size) ||
          (typeof a.fileSize === "number" && a.fileSize) ||
          0;

        return { uri: finalUri, name, type, size };
      })
    );

    const bad = files.find((f) => !f.size || f.size <= 0);
    if (bad) {
      const msg = "Could not read file size. Please try selecting a different photo.";
      setErr(msg);
      dispatch({ type: "SET_ERR", err: msg });
      return;
    }

    // 3) Upload
    const res = await startUpload(files as any /* , { clerkUserId: ... } if your route needs it */);
    if (!Array.isArray(res) || !res.length) return;

    // 4) Patch wizard state: match uploads to locals by order
    // We need an action that updates url/key for a given local uri.
    // If you don't have it, add UPDATE_SERVICE_PHOTO action (shown below).
    res.slice(0, assets.length).forEach((r: any, i: number) => {
      dispatch({
        type: "UPDATE_SERVICE_PHOTO",
        uri: assets[i].uri,
        patch: { url: String(r.url), key: String(r.key) },
      });
    });
  };

  const anyMissingUpload = state.servicePhotos.some((p) => !p.url);

  return (
    <View style={styles.card}>
      <Text style={styles.h}>Service photos</Text>
      <Text style={styles.p}>Upload 1–6 photos. This is required for service listings.</Text>

      <Pressable
        onPress={pickAndUpload}
        disabled={remaining <= 0 || isUploading}
        style={[styles.btn, (remaining <= 0 || isUploading) && { opacity: 0.55 }]}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{`Pick & upload (${remaining} left)`}</Text>
        )}
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
        {state.servicePhotos.map((p) => (
          <View key={p.uri} style={styles.thumbWrap}>
            <Image source={{ uri: p.uri }} style={styles.thumb} />
            {!p.url ? <View style={styles.badge}><Text style={styles.badgeText}>uploading</Text></View> : null}
            <Pressable
              onPress={() => dispatch({ type: "REMOVE_SERVICE_PHOTO", uri: p.uri })}
              style={styles.x}
              hitSlop={12}
            >
              <Text style={styles.xText}>×</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {!!err && <Text style={[styles.note, { color: "#B91C1C" }]}>{err}</Text>}

      <Text style={styles.note}>
        {state.servicePhotos.length === 0
          ? "At least 1 photo required."
          : anyMissingUpload
          ? "Uploading…"
          : "Looks good."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 22, padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  h: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  p: { marginTop: 6, color: "#64748B", fontWeight: "700" },
  btn: { marginTop: 12, height: 44, borderRadius: 14, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: "900" },
  thumbWrap: { marginRight: 12, marginTop: 12 },
  thumb: { width: 92, height: 92, borderRadius: 18, backgroundColor: "#EEF2FF" },
  badge: { position: "absolute", left: 8, bottom: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "#111827CC" },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 10 },
  x: { position: "absolute", top: -6, right: -6, width: 26, height: 26, borderRadius: 13, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  xText: { color: "#fff", fontWeight: "900", fontSize: 18, lineHeight: 18 },
  note: { marginTop: 12, fontWeight: "900", color: "#334155" },
});
