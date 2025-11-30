import React, { useCallback, useState } from "react";
import { TouchableOpacity, Image, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { getProfile } from "./profileStore";

export default function ProfileHeaderButton() {
  const router = useRouter();
  const [avatarUri, setAvatarUri] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await getProfile();
        setAvatarUri(p.avatarUri);
      })();
    }, [])
  );

  return (
    <TouchableOpacity
      onPress={() => router.push("/profile")}
      style={styles.btn}
      activeOpacity={0.85}
      hitSlop={10}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.img} />
      ) : (
        <Ionicons name="person-circle-outline" size={34} color="#111" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  img: { width: "100%", height: "100%" },
});
