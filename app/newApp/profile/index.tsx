import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ABOUT_KEY = "profile.aboutMe";
const router = useRouter();
const [about, setAbout] = useState("");

useFocusEffect(
  useCallback(() => {
    (async () => {
      const v = await AsyncStorage.getItem(ABOUT_KEY);
      setAbout(v ?? "");
    })();
  }, [])
);

