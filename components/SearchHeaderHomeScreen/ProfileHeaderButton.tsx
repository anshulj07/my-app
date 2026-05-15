// import React, { useCallback, useState } from "react";
// import { TouchableOpacity, Image, StyleSheet } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { useFocusEffect, useRouter } from "expo-router";
// import Constants from "expo-constants";
// import { useUser } from "@clerk/clerk-expo";
// import { apiFetch } from "../../lib/apiFetch";

// export default function ProfileHeaderButton({ size = 44 }: { size?: number }) {
//   const router = useRouter();
//   const { user } = useUser();

//   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [avatarUri, setAvatarUri] = useState<string | undefined>();

//   useFocusEffect(
//     useCallback(() => {
//       let mounted = true;

//       (async () => {
//         try {
//           const clerkUserId = user?.id;
//           if (!API_BASE || !clerkUserId) return;

//           const url = `${API_BASE.replace(/\/$/, "")}/api/profile?clerkUserId=${encodeURIComponent(clerkUserId)}`;
//           const res = await apiFetch(url, {
//             headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
//           });

//           const j: any = await res.json().catch(() => ({}));
//           const src = (j && typeof j === "object" && (j.profile || j.data || j)) as any;

//           const fromDb = typeof src?.avatar === "string" && src.avatar.trim() ? src.avatar.trim() : null;
//           const photos: string[] = Array.isArray(src?.photos) ? src.photos : [];
//           const firstPhoto = photos.find((p) => typeof p === "string" && p.trim())?.trim();

//           const fromClerk = user?.imageUrl || undefined;

//           if (mounted) {
//             setAvatarUri(fromDb || firstPhoto || fromClerk);
//           }
//         } catch {
//           // ignore
//         }
//       })();

//       return () => {
//         mounted = false;
//       };
//     }, [API_BASE, EVENT_API_KEY, user?.id])
//   );

//   const r = size / 2;

//   return (
//     <TouchableOpacity
//       onPress={() => router.push("/profile/profileHome")}
//       style={[styles.btn, { width: size, height: size, borderRadius: r }]}
//       activeOpacity={0.85}
//       hitSlop={10}
//     >
//       {avatarUri ? (
//         <Image source={{ uri: avatarUri }} style={styles.img} />
//       ) : (
//         <Ionicons name="person-circle-outline" size={size} color="#111" />
//       )}
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   btn: {
//     overflow: "hidden",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(255,255,255,0.6)",
//   },
//   img: { width: "100%", height: "100%" },
// });
// components/SearchHeaderHomeScreen/ProfileHeaderButton.tsx
import React, { useEffect, useState } from "react";
import { TouchableOpacity, Image, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TEAL    = "#54cf3e";
const TEAL_BG = "#E8FAF7";
const TEAL_44 = "#3ECFB244";

// Same key profileHome uses to cache profile data
const PROFILE_STORAGE_KEY = "@profile";

export default function ProfileHeaderButton({ size = 44 }: { size?: number }) {
  const router = useRouter();
  const { user } = useUser();

  const [backendAvatar, setBackendAvatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (!raw) return;
        const profile = JSON.parse(raw);
        const photos: string[] = Array.isArray(profile?.photos) ? profile.photos : [];
        const avatar = typeof profile?.avatar === "string" && profile.avatar.trim()
          ? profile.avatar.trim() : null;
        // Match profileHome priority: photos[0] > avatar
        const best = photos[0] || avatar || null;
        if (!cancelled && best) setBackendAvatar(best);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user?.id]); // re-read cache when user changes

  // Derived — no stored state needed for Clerk photo: always reflects latest user
  const avatarUri = backendAvatar || user?.imageUrl || null;

  const r = size / 2;

  return (
    <TouchableOpacity
      onPress={() => router.push("/profile/profileHome")}
      activeOpacity={0.85}
      hitSlop={10}
      style={[
        styles.btn,
        {
          width: size,
          height: size,
          borderRadius: r,
          borderColor: avatarUri ? TEAL_44 : "rgba(240,235,227,0.9)",
          backgroundColor: avatarUri ? "transparent" : TEAL_BG,
        },
      ]}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.img} />
      ) : (
        <Ionicons name="person-circle-outline" size={size * 0.7} color={TEAL} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    overflow:       "hidden",
    alignItems:     "center",
    justifyContent: "center",
    borderWidth:    2,
  },
  img: { width: "100%", height: "100%" },
});