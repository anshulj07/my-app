// app/(onboarding)/photos.tsx
import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";

export default function PhotosScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [hasPhotos, setHasPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const canFinish = useMemo(() => hasPhotos && !saving, [hasPhotos, saving]);

  const onMockAddPhoto = () => {
    // Replace later with real picker + upload
    setHasPhotos(true);
  };

 const onFinish = async () => {
  if (!isLoaded || !user) return;

  setSaving(true);
  setErr(null);

  try {
    if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");

    const payload = {
      clerkUserId: user.id,
      hasPhotos: true,
    };

    const res = await fetch(`${API_BASE}/api/onboarding/photos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      let msg = `Failed to finish onboarding (${res.status}).`;
      try {
        const j = JSON.parse(text);
        msg = j?.message || j?.error || msg;
      } catch {}
      throw new Error(msg);
    }

    // ✅ ADD THIS: keep your existing AuthGate happy
    await user.update({
      unsafeMetadata: {
        ...((user.unsafeMetadata as any) ?? {}),
        hasPhotos: true,
        onboardingComplete: true,
      },
    });

    router.replace("/");
  } catch (e: any) {
    setErr(e?.message || "Failed to finish onboarding.");
  } finally {
    setSaving(false);
  }
};


  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logo}>
            <Ionicons name="images-outline" size={18} color="#0A84FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Step 4 of 4</Text>
            <Text style={styles.title}>Add photos</Text>
            <Text style={styles.sub}>Profiles with photos get more engagement.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity onPress={onMockAddPhoto} activeOpacity={0.9} style={styles.addBtn}>
            <Ionicons name="add" size={22} color="#0A84FF" />
            <Text style={styles.addText}>{hasPhotos ? "Photo added ✅" : "Add a photo"}</Text>
          </TouchableOpacity>

          {!!err && <Text style={styles.err}>{err}</Text>}

          <TouchableOpacity
            onPress={onFinish}
            activeOpacity={0.9}
            disabled={!canFinish}
            style={[styles.primaryBtn, !canFinish && { opacity: 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryText}>Finish</Text>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {!API_BASE ? (
            <Text style={[styles.err, { marginTop: 10 }]}>
              Config issue: extra.apiBaseUrl is missing.
            </Text>
          ) : null}

          <Text style={styles.note}>
            (Next: we can plug in real photo picking + upload and store URLs in your DB.)
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  page: { flex: 1, padding: 16, justifyContent: "center", gap: 14 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: { color: "#0A84FF", fontWeight: "900", fontSize: 12 },
  title: { color: "#0F172A", fontWeight: "900", fontSize: 20, marginTop: 2 },
  sub: { color: "#64748B", fontWeight: "700", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },

  addBtn: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  addText: { color: "#0F172A", fontWeight: "900" },

  err: { marginTop: 12, color: "#B91C1C", fontWeight: "800" },

  primaryBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0A84FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  note: { marginTop: 12, color: "#94A3B8", fontWeight: "700", fontSize: 12 },
});
