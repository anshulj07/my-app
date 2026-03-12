import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { apiFetch } from "../../../lib/apiFetch";

const MAX_INTERESTS = 20;
const MAX_LANGUAGES = 20;

const INTEREST_SUGGESTIONS = [
  "Gym",
  "Coffee",
  "Cooking",
  "Foodie",
  "Nightlife",
  "Self care",
  "Hiking",
  "Camping",
  "Road trips",
  "Beaches",
  "Cycling",
  "Nature",
  "Photography",
  "Music",
  "Dancing",
  "Art",
  "Writing",
  "Design",
  "Movies",
  "TV shows",
  "Anime",
  "Gaming",
  "Standup",
  "Karaoke",
  "AI",
  "Startups",
  "Coding",
  "Product",
  "Hackathons",
  "Gadgets",
];

const LANGUAGE_SUGGESTIONS = [
  "English",
  "Hindi",
  "Punjabi",
  "Urdu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
];

export default function Preferences() {
  const router = useRouter();
  const { userId } = useAuth();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [savingInterests, setSavingInterests] = useState(false);
  const [savingLanguages, setSavingLanguages] = useState(false);

  const [interests, setInterests] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  const [interestQuery, setInterestQuery] = useState("");
  const [languageQuery, setLanguageQuery] = useState("");

  const baseUrl = useMemo(() => (API_BASE ? API_BASE.replace(/\/$/, "") : ""), [API_BASE]);

  const loadProfile = useCallback(async () => {
    if (!baseUrl || !userId) return;

    setLoading(true);
    setErr(null);
    try {
      const res = await apiFetch(`${baseUrl}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: {
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed to load profile (${res.status})`);
      }

      const j = await res.json().catch(() => ({} as any));
      const nextInterests = Array.isArray(j?.interests) ? j.interests : [];
      const nextLanguages = Array.isArray(j?.languages) ? j.languages : [];

      setInterests(nextInterests.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
      setLanguages(nextLanguages.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
    } catch (e: any) {
      setErr(e?.message || "Failed to load preferences.");
    } finally {
      setLoading(false);
    }
  }, [EVENT_API_KEY, baseUrl, userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleItem = useCallback((value: string, list: string[], setList: (v: string[]) => void, max: number) => {
    const v = value.trim();
    if (!v) return;
    setList((prev) => {
      const has = prev.includes(v);
      if (has) return prev.filter((x) => x !== v);
      if (prev.length >= max) return prev;
      return [...prev, v];
    });
  }, []);

  const filteredInterestSuggestions = useMemo(() => {
    const q = interestQuery.trim().toLowerCase();
    const base = INTEREST_SUGGESTIONS;
    const list = q ? base.filter((x) => x.toLowerCase().includes(q)) : base;
    return list.slice(0, 30);
  }, [interestQuery]);

  const filteredLanguageSuggestions = useMemo(() => {
    const q = languageQuery.trim().toLowerCase();
    const base = LANGUAGE_SUGGESTIONS;
    const list = q ? base.filter((x) => x.toLowerCase().includes(q)) : base;
    return list.slice(0, 30);
  }, [languageQuery]);

  const saveInterests = useCallback(async () => {
    if (!baseUrl || !userId) return;
    setSavingInterests(true);
    setErr(null);
    try {
      const res = await apiFetch(`${baseUrl}/api/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: userId, interests }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed to save interests (${res.status})`);
      }
      router.back();
    } catch (e: any) {
      setErr(e?.message || "Failed to save interests.");
    } finally {
      setSavingInterests(false);
    }
  }, [EVENT_API_KEY, baseUrl, interests, router, userId]);

  const saveLanguages = useCallback(async () => {
    if (!baseUrl || !userId) return;
    setSavingLanguages(true);
    setErr(null);
    try {
      const res = await apiFetch(`${baseUrl}/api/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: userId, languages }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Failed to save languages (${res.status})`);
      }
      router.back();
    } catch (e: any) {
      setErr(e?.message || "Failed to save languages.");
    } finally {
      setSavingLanguages(false);
    }
  }, [EVENT_API_KEY, baseUrl, languages, router, userId]);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      {!API_BASE ? (
        <View style={styles.center}>
          <Text style={styles.errText}>Config issue: extra.apiBaseUrl is missing.</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps={Platform.OS === "web" ? "handled" : "always"}>
          {!!err && (
            <View style={styles.errBox}>
              <Text style={styles.errText}>{err}</Text>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionTop}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <Text style={styles.sectionHint}>{interests.length}/{MAX_INTERESTS}</Text>
            </View>

            <TextInput
              value={interestQuery}
              onChangeText={setInterestQuery}
              placeholder="Search interests..."
              placeholderTextColor="#9CA3AF"
              style={styles.search}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <View style={styles.chipsWrap}>
              {filteredInterestSuggestions.map((label) => {
                const on = interests.includes(label);
                const disabled = !on && interests.length >= MAX_INTERESTS;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => toggleItem(label, interests, setInterests, MAX_INTERESTS)}
                    disabled={disabled}
                    activeOpacity={0.9}
                    style={[styles.chip, on && styles.chipOn, disabled && styles.chipDisabled]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={saveInterests}
              disabled={savingInterests}
              activeOpacity={0.9}
              style={[styles.saveBtn, savingInterests && { opacity: 0.7 }]}
            >
              {savingInterests ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Interests</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTop}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <Text style={styles.sectionHint}>{languages.length}/{MAX_LANGUAGES}</Text>
            </View>

            <TextInput
              value={languageQuery}
              onChangeText={setLanguageQuery}
              placeholder="Search languages..."
              placeholderTextColor="#9CA3AF"
              style={styles.search}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <View style={styles.chipsWrap}>
              {filteredLanguageSuggestions.map((label) => {
                const on = languages.includes(label);
                const disabled = !on && languages.length >= MAX_LANGUAGES;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => toggleItem(label, languages, setLanguages, MAX_LANGUAGES)}
                    disabled={disabled}
                    activeOpacity={0.9}
                    style={[styles.chip, on && styles.chipOn, disabled && styles.chipDisabled]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={saveLanguages}
              disabled={savingLanguages}
              activeOpacity={0.9}
              style={[styles.saveBtn, savingLanguages && { opacity: 0.7 }]}
            >
              {savingLanguages ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Languages</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  section: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  sectionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  sectionHint: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  search: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#111",
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipOn: { backgroundColor: "#E11D48", borderColor: "#E11D48" },
  chipDisabled: { opacity: 0.5 },
  chipText: { color: "#111", fontWeight: "700" },
  chipTextOn: { color: "#fff" },
  saveBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  errBox: { marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  errText: { color: "#991B1B", fontWeight: "700" },
});
