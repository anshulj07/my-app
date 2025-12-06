// app/(onboarding)/gender.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";

const OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"] as const;
type GenderOption = (typeof OPTIONS)[number];

const COLORS = {
  bg: "#0B0B12",
  card: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.08)",
  ink: "#FFFFFF",
  muted: "rgba(255,255,255,0.62)",
  primary: "#FF4D6D",
  primary2: "#FF8A00",
  danger: "#FB7185",
};

export default function GenderScreen() {
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [selected, setSelected] = useState<GenderOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  useEffect(() => {
    const load = async () => {
      if (!isLoaded || !user) return;

      setErr(null);
      setLoading(true);

      try {
        if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");

        const res = await fetch(
          `${API_BASE.replace(/\/$/, "")}/api/onboarding/gender?clerkUserId=${encodeURIComponent(
            user.id
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
            },
          }
        );

        const text = await res.text();
        if (!res.ok) {
          let msg = `Failed to load gender (${res.status}).`;
          try {
            const j = JSON.parse(text);
            msg = j?.message || j?.error || msg;
          } catch {}
          throw new Error(msg);
        }

        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {}

        const g = data?.gender;
        if (typeof g === "string" && (OPTIONS as readonly string[]).includes(g)) {
          setSelected(g as GenderOption);
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load gender.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoaded, user?.id, API_BASE, EVENT_API_KEY]);

  const canContinue = useMemo(() => !!selected && !saving && !loading, [selected, saving, loading]);

  const onNext = async () => {
    if (!isLoaded || !user) return;

    setSaving(true);
    setErr(null);

    try {
      if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");
      if (!selected) throw new Error("Please select a gender.");

      const apiBase = API_BASE.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/onboarding/gender`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: user.id, gender: selected }),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `Failed to save gender (${res.status}).`;
        try {
          const j = JSON.parse(text);
          msg = j?.message || j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      router.push("/(onboarding)/dateOfBirth");
    } catch (e: any) {
      setErr(e?.message || "Failed to save gender.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>Step 2 of 4</Text>
            </View>

            <View style={styles.spark}>
              <Ionicons name="male-female-outline" size={16} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.h1}>Select your gender</Text>
          <Text style={styles.h2}>This helps personalize your profile. You can change it later.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {OPTIONS.map((x) => {
                const on = selected === x;
                return (
                  <TouchableOpacity
                    key={x}
                    onPress={() => setSelected(x)}
                    activeOpacity={0.92}
                    style={[styles.option, on && styles.optionOn]}
                  >
                    <View style={[styles.optionIcon, on && styles.optionIconOn]}>
                      <Ionicons
                        name={
                          x === "Male"
                            ? "male"
                            : x === "Female"
                            ? "female"
                            : x === "Non-binary"
                            ? "sparkles-outline"
                            : x === "Prefer not to say"
                            ? "eye-off-outline"
                            : "ellipsis-horizontal"
                        }
                        size={16}
                        color={on ? "#fff" : COLORS.muted}
                      />
                    </View>

                    <Text style={[styles.optionText, on && styles.optionTextOn]}>{x}</Text>

                    <View style={[styles.radio, on && styles.radioOn]}>
                      {on ? <View style={styles.radioDot} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!!err && (
            <View style={styles.alert}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
              </View>
              <Text style={styles.alertText}>{err}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onNext}
            activeOpacity={0.92}
            disabled={!canContinue}
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
          >
            {saving ? (
              <>
                <Text style={styles.ctaText}>Saving…</Text>
                <ActivityIndicator color="#fff" />
              </>
            ) : (
              <>
                <Text style={styles.ctaText}>{selected ? "Continue" : "Select an option"}</Text>
                <View style={styles.ctaIcon}>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </>
            )}
          </TouchableOpacity>

          {!API_BASE ? (
            <View style={[styles.alert, { marginTop: 12 }]}>
              <View style={styles.alertIcon}>
                <Ionicons name="bug-outline" size={18} color={COLORS.danger} />
              </View>
              <Text style={styles.alertText}>Config issue: extra.apiBaseUrl is missing.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    justifyContent: "center",
    gap: 16,
    backgroundColor: COLORS.bg,
  },

  hero: { paddingHorizontal: 2, gap: 10 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,77,109,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.25)",
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: COLORS.primary2,
    shadowColor: COLORS.primary2,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  pillText: { color: COLORS.ink, fontWeight: "900", fontSize: 12, letterSpacing: 0.25 },

  spark: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  h1: { color: COLORS.ink, fontSize: 34, fontWeight: "900", letterSpacing: -1.1, lineHeight: 40 },
  h2: { color: COLORS.muted, fontSize: 14, fontWeight: "700", lineHeight: 20 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },

  loadingWrap: { alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  loadingText: { color: COLORS.muted, fontWeight: "800" },

  grid: { gap: 10 },

  option: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionOn: {
    backgroundColor: "rgba(255,77,109,0.16)",
    borderColor: "rgba(255,77,109,0.30)",
  },

  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  optionIconOn: {
    backgroundColor: "rgba(255,77,109,0.22)",
    borderColor: "rgba(255,77,109,0.32)",
  },

  optionText: { flex: 1, color: COLORS.ink, fontWeight: "900", fontSize: 14, letterSpacing: 0.2 },
  optionTextOn: { color: COLORS.ink },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  radioOn: {
    borderColor: "rgba(255,77,109,0.55)",
    backgroundColor: "rgba(255,77,109,0.22)",
  },
  radioDot: { width: 10, height: 10, borderRadius: 99, backgroundColor: COLORS.primary2 },

  alert: {
    marginTop: 14,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.24)",
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(251,113,133,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: { color: "#FFE4EA", fontWeight: "900", flex: 1, lineHeight: 18 },

  cta: {
    marginTop: 18,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.3 },
  ctaIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
