import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "profile.v1";

export type Profile = {
  avatarUri?: string;
  name?: string;
  username?: string;
  about?: string;
};

export async function getProfile(): Promise<Profile> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Profile) : {};
}

export async function updateProfile(patch: Partial<Profile>) {
  const current = await getProfile();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
