// components/add-event/steps/KindStep.tsx
import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { WizardState } from "../wizard/wizardTypes";
import type { WizardAction } from "../wizard/wizardReducer";
import type { ListingKind } from "../types";

type Option = {
  key: ListingKind;
  title: string;
  subtitle: string;
  icon: string;
};

function KindCard({
  title,
  subtitle,
  icon,
  active,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, active && styles.cardActive]}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
    >
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
          {active ? <View style={styles.radioInner} /> : null}
        </View>
        {/* <Text style={[styles.chev, active && styles.chevActive]}>›</Text> */}
      </View>
    </Pressable>
  );
}

export default function KindStep({
  state,
  dispatch,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  emoji: string;
}) {
  const setKind = (k: ListingKind) => dispatch({ type: "SET_KIND", kind: k });

  const options = useMemo<Option[]>(
    () => [
      { key: "event_free", title: "Free event", subtitle: "People join • no ticket", icon: "🎉" },
      { key: "event_paid", title: "Paid event", subtitle: "Tickets • charge entry", icon: "🎟️" },
      { key: "service", title: "Service", subtitle: "Bookings • appointments", icon: "🛠️" },
    ],
    []
  );

  const selectedLabel =
    state.kind === "event_free"
      ? "Free event"
      : state.kind === "event_paid"
        ? "Paid event"
        : state.kind === "service"
          ? "Service"
          : "None";

  return (
    <View style={styles.root}>
      <View style={styles.list}>
        {options.map((o) => (
          <KindCard
            key={o.key}
            title={o.title}
            subtitle={o.subtitle}
            icon={o.icon}
            active={state.kind === o.key}
            onPress={() => setKind(o.key)}
          />
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  accent: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.9)",
    backgroundColor: "rgba(255,255,255,0.85)",
    marginTop: 2,
    marginBottom: 12,
  },
  accentTitle: { fontSize: 13, fontWeight: "900", color: "#111827" },
  accentSub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#6B7280" },

  list: { gap: 12 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardActive: {
    borderColor: "rgba(46,139,109,0.85)",
    borderWidth: 2,
    backgroundColor: "#F2FAF6",
    shadowColor: "#2E8B6D",
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "rgba(46,139,109,0.35)",
  },
  icon: { fontSize: 20 },

  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
  cardSub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },

  right: { flexDirection: "row", alignItems: "center", gap: 10 },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  radioOuterActive: { borderColor: "#2E8B6D" },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#2E8B6D",
  },
});
