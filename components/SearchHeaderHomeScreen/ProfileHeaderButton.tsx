import React, { useCallback, useState } from "react";
import { TouchableOpacity, Image, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useUser } from "@clerk/clerk-expo";

export default function ProfileHeaderButton({ size = 44 }: { size?: number }) {
  const router = useRouter();
  const { user } = useUser();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [avatarUri, setAvatarUri] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          const clerkUserId = user?.id;
          if (!API_BASE || !clerkUserId) return;

          const url = `${API_BASE.replace(/\/$/, "")}/api/profile?clerkUserId=${encodeURIComponent(clerkUserId)}`;
          const res = await fetch(url, {
            headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
          });

          const j: any = await res.json().catch(() => ({}));
          const photos: string[] = Array.isArray(j?.photos) ? j.photos : [];

          const fromDb = photos.find((p) => typeof p === "string" && p.trim())?.trim();
          const fromClerk = user?.imageUrl || undefined;

          if (mounted) setAvatarUri(fromDb || fromClerk);
        } catch {
          // ignore
        }
      })();

      return () => {
        mounted = false;
      };
    }, [API_BASE, EVENT_API_KEY, user?.id])
  );

  const r = size / 2;

  return (
    <TouchableOpacity
      onPress={() => router.push("/profile/profileHome")}
      style={[styles.btn, { width: size, height: size, borderRadius: r }]}
      activeOpacity={0.85}
      hitSlop={10}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.img} />
      ) : (
        <Ionicons name="person-circle-outline" size={size} color="#111" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  img: { width: "100%", height: "100%" },
});
