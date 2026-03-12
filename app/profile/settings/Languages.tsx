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

const MAX_LANGUAGES = 20;

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

export default function Languages() {
  const router = useRouter();
  const { userId } = useAuth();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [languages, setLanguages] = useState<string[]>([]);
  const [query, setQuery] = useState("");

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
      const next = Array.isArray(j?.languages) ? j.languages : [];
      setLanguages(next.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
    } catch (e: any) {
      setErr(e?.message || "Failed to load languages.");
    } finally {
      setLoading(false);
    }
  }, [EVENT_API_KEY, baseUrl, userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const filteredSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = LANGUAGE_SUGGESTIONS;
    const list = q ? base.filter((x) => x.toLowerCase().includes(q)) : base;
    return list.slice(0, 30);
  }, [query]);

  const toggle = useCallback((value: string) => {
    const v = value.trim();
    if (!v) return;
    setLanguages((prev) => {
      const has = prev.includes(v);
      if (has) return prev.filter((x) => x !== v);
      if (prev.length >= MAX_LANGUAGES) return prev;
      return [...prev, v];
    });
  }, []);

  const save = useCallback(async () => {
    if (!baseUrl || !userId) return;

    setSaving(true);
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
      setSaving(false);
    }
  }, [EVENT_API_KEY, baseUrl, languages, router, userId]);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Languages</Text>
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps={Platform.OS === "web" ? "handled" : "always"}
        >
          {!!err && (
            <View style={styles.errBox}>
              <Text style={styles.errText}>{err}</Text>
            </View>
          )}

          <View style={styles.sectionTop}>
            <Text style={styles.sectionHint}>
              {languages.length}/{MAX_LANGUAGES}
            </Text>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search languages..."
            placeholderTextColor="#9CA3AF"
            style={styles.search}
            autoCorrect={false}
            autoCapitalize="none"
          />

          <View style={styles.chipsWrap}>
            {filteredSuggestions.map((label) => {
              const on = languages.includes(label);
              const disabled = !on && languages.length >= MAX_LANGUAGES;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => toggle(label)}
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
            onPress={save}
            disabled={saving}
            activeOpacity={0.9}
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
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
  sectionTop: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 10 },
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
  errBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errText: { color: "#991B1B", fontWeight: "700" },
});
