// components/add-event/steps/ReviewStep.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import StepShell from "./StepShell";
import type { WizardState } from "../wizard/wizardTypes";
import { toStartsAtISO } from "../wizard/wizardValidation";

function formatWhen(dateISO?: string, time24?: string) {
  const iso = dateISO && time24 ? toStartsAtISO(dateISO, time24) : null;
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function kindLabel(kind: WizardState["kind"]) {
  if (kind === "service") return "Service";
  if (kind === "event_paid") return "Paid event";
  return "Free event";
}

function safeText(s?: string | null) {
  const t = (s || "").trim();
  return t.length ? t : "—";
}

function priceDisplay(state: WizardState) {
  // Always show 0 if not applicable / empty
  const t = (state.priceText || "").trim();
  if (!t) return "$0";
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return "$0";
  return `$${n}`;
}

function capacityDisplay(state: WizardState) {
  // Always show 0 if not applicable / empty
  const t = (state.capacityText || "").trim();
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 0) return "0";
  return String(n);
}

export default function ReviewStep({
  state,
  emoji,
  onSubmit, // kept for future, submit is in bottom bar
}: {
  state: WizardState;
  emoji: string;
  onSubmit: () => void;
}) {
  const whenText = useMemo(
    () => formatWhen(state.dateISO, state.time24),
    [state.dateISO, state.time24]
  );

  const title = safeText(state.title);
  const description = safeText(state.description);
  const location = safeText(state.selectedAddress);

  const priceText = useMemo(() => priceDisplay(state), [state.priceText, state.kind]);
  const capacityText = useMemo(() => capacityDisplay(state), [state.capacityText, state.kind]);

  const showPhotos = state.kind === "service" && state.servicePhotos?.length > 0;

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.emojiPill}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.kindChip}>
              <Text style={styles.kindText}>{kindLabel(state.kind)}</Text>
            </View>
            <Text style={styles.when} numberOfLines={1}>
              {whenText}
            </Text>
          </View>
        </View>
      </View>

      {/* Stat row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statK}>Price</Text>
          <Text style={styles.statV}>{priceText}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <Text style={styles.statK}>Capacity</Text>
          <Text style={styles.statV}>{capacityText}</Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.block}>
        <Text style={styles.k}>Location</Text>
        <Text style={styles.v} numberOfLines={3}>
          {location}
        </Text>
      </View>

      {/* Description */}
      <View style={styles.block}>
        <Text style={styles.k}>Description</Text>
        <Text style={styles.v}>{description}</Text>
      </View>

      {/* Service photos (minimal, clean) */}
      {showPhotos && (
        <View style={styles.block}>
          <Text style={styles.k}>Photos</Text>

          <View style={styles.photoRow}>
            {state.servicePhotos.slice(0, 4).map((p: any) => {
              const displayUri = p.url || p.uri; // ✅ prefer uploaded url
              return (
                <Image
                  key={p.key || p.url || p.uri}
                  source={{ uri: displayUri }}
                  style={styles.photo}
                />
              );
            })}
            
            {state.servicePhotos.length > 4 && (
              <View style={styles.moreBox}>
                <Text style={styles.moreText}>+{state.servicePhotos.length - 4}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 6,
  },
  emojiPill: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  emoji: { fontSize: 24 },

  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.2,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  kindChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  kindText: { fontSize: 12, fontWeight: "900", color: "#0F172A" },
  when: { flex: 1, fontSize: 12, fontWeight: "900", color: "#64748B" },

  statsRow: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  stat: { flex: 1 },
  statK: { fontSize: 12, fontWeight: "900", color: "#64748B" },
  statV: { marginTop: 8, fontSize: 18, fontWeight: "900", color: "#0F172A" },
  divider: { width: 1, alignSelf: "stretch", backgroundColor: "#E2E8F0", marginHorizontal: 14 },

  block: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  k: { fontSize: 12, fontWeight: "900", color: "#64748B" },
  v: { marginTop: 10, fontSize: 14, fontWeight: "800", color: "#0F172A", lineHeight: 20 },

  photoRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  moreBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  moreText: { fontWeight: "900", color: "#0F172A" },
});
