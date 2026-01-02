// components/add-event/steps/WhenStep.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import StepShell from "./StepShell";
import type { WizardState } from "../wizard/wizardTypes";
import type { WizardAction } from "../wizard/wizardReducer";
import { isFutureStart } from "../wizard/wizardValidation";

function isoToSafeDate(iso: string) {
  if (!iso) return new Date();
  return new Date(`${iso}T12:00:00`);
}
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function timeToDate(time24: string) {
  const d = new Date();
  if (!time24) return d;
  const [hh, mm] = time24.split(":").map((x) => parseInt(x, 10));
  if (Number.isFinite(hh)) d.setHours(hh);
  if (Number.isFinite(mm)) d.setMinutes(mm);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}
function formatTime12(hh: number, mm: number) {
  const ampm = hh >= 12 ? "PM" : "AM";
  const h = hh % 12 === 0 ? 12 : hh % 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ampm}`;
}
function nowHHMM() {
  const n = new Date();
  return { hh: n.getHours(), mm: n.getMinutes() };
}
function addMinutes(d: Date, mins: number) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + mins);
  x.setSeconds(0);
  x.setMilliseconds(0);
  return x;
}
function clampToNextValidMinute(dateISO: string) {
  const now = new Date();
  const todayISO = toLocalISODate(now);
  if (dateISO !== todayISO) return null;

  const min = addMinutes(now, 1);
  return `${String(min.getHours()).padStart(2, "0")}:${String(min.getMinutes()).padStart(2, "0")}`;
}

function AnimatedHero() {
  const sweep = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 3200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [sweep, pulse]);

  const tx = sweep.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.32] });
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.55] });

  // light “world grid” dots (no SVG needed)
  const dots = Array.from({ length: 48 });

  return (
    <View style={styles.hero}>
      <View style={styles.heroFrame}>

        {/* dot grid */}
        <Animated.View pointerEvents="none" style={[styles.dotGrid, { opacity: dotOpacity }]}>
          {dots.map((_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </Animated.View>

        {/* foreground copy */}
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>Schedule</Text>
          <Text style={styles.heroTitle}>Pick a moment that people can actually make</Text>
        </View>
      </View>
    </View>
  );
}

export default function WhenStep({
  state,
  dispatch,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [timeWarn, setTimeWarn] = useState<string | null>(null);

  const dateLabel = useMemo(() => {
    if (!state.dateISO) return "Pick a date";
    return isoToSafeDate(state.dateISO).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [state.dateISO]);

  const timeLabel = useMemo(() => {
    if (!state.time24) return "Pick a time";
    const [hh, mm] = state.time24.split(":").map((x) => parseInt(x, 10));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "Pick a time";
    return formatTime12(hh, mm);
  }, [state.time24]);

  const futureOk = useMemo(() => {
    if (!state.dateISO || !state.time24) return false;
    return isFutureStart(state.dateISO, state.time24);
  }, [state.dateISO, state.time24]);

  const previewLine = useMemo(() => {
    if (!state.dateISO && !state.time24) return "Choose a date and time to continue.";
    if (!state.dateISO) return "Choose a date.";
    if (!state.time24) return "Choose a time.";
    return `${dateLabel} • ${timeLabel}`;
  }, [state.dateISO, state.time24, dateLabel, timeLabel]);

  const onPickTime = (d: Date) => {
    const hh = d.getHours();
    const mm = d.getMinutes();
    const picked = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

    if (!state.dateISO) {
      const today = toLocalISODate(new Date());
      dispatch({ type: "SET", key: "dateISO", value: today });
    }

    const dateISO = state.dateISO || toLocalISODate(new Date());
    const todayISO = toLocalISODate(new Date());

    // If date is today -> block past time
    if (dateISO === todayISO) {
      const { hh: nh, mm: nm } = nowHHMM();
      const pickedMinutes = hh * 60 + mm;
      const nowMinutes = nh * 60 + nm;

      if (pickedMinutes <= nowMinutes) {
        const nextValid = clampToNextValidMinute(dateISO);
        if (nextValid) {
          dispatch({ type: "SET", key: "time24", value: nextValid });
          setTimeWarn("Time can’t be in the past. Adjusted to the next available minute.");
          return;
        }
      }
    }

    setTimeWarn(null);
    dispatch({ type: "SET", key: "time24", value: picked });
  };

  return (
    <>
      <AnimatedHero />

      {/* STACKED tiles (no empty space, bigger targets) */}
      <View style={styles.stack}>
        <Pressable
          onPress={() => {
            if (!state.dateISO) dispatch({ type: "SET", key: "dateISO", value: toLocalISODate(new Date()) });
            setDateOpen(true);
          }}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.tileHeader}>
            <View style={styles.iconPill}>
              <Text style={styles.icon}>🗓️</Text>
            </View>
            <Text style={styles.tileTop}>Date</Text>
          </View>
          <Text style={[styles.tileVal, !state.dateISO && styles.muted]} numberOfLines={1}>
            {dateLabel}
          </Text>
          <Text style={styles.tileHint}>Tap to choose</Text>
        </Pressable>

        <Pressable
          onPress={() => setTimeOpen(true)}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.tileHeader}>
            <View style={styles.iconPill}>
              <Text style={styles.icon}>⏰</Text>
            </View>
            <Text style={styles.tileTop}>Time</Text>
          </View>
          <Text style={[styles.tileVal, !state.time24 && styles.muted]} numberOfLines={1}>
            {timeLabel}
          </Text>
          <Text style={styles.tileHint}>
            {state.dateISO === toLocalISODate(new Date()) ? "Today: future only" : "Tap to choose"}
          </Text>
        </Pressable>
      </View>

      {/* Preview (nice filler) */}
      <View style={styles.previewCard}>
        <View style={styles.previewDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.previewKicker}>Preview</Text>
          <Text style={styles.previewLine} numberOfLines={2}>
            {previewLine}
          </Text>
        </View>
      </View>

      {!!timeWarn && (
        <View style={[styles.badge, styles.badgeBad]}>
          <Text style={[styles.badgeText, styles.badgeTextBad]}>{timeWarn}</Text>
        </View>
      )}

      {!!state.dateISO && !!state.time24 && !timeWarn && (
        <View style={[styles.badge, futureOk ? styles.badgeOk : styles.badgeBad]}>
          <Text style={[styles.badgeText, futureOk ? styles.badgeTextOk : styles.badgeTextBad]}>
            {futureOk ? "Looks good ✅" : "This time is in the past. Pick a future time."}
          </Text>
        </View>
      )}

      {/* DATE PICKER */}
      <Modal transparent visible={dateOpen} animationType="fade" onRequestClose={() => setDateOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setDateOpen(false)}>
          <Pressable style={styles.pickerCard} onPress={() => { }}>
            <View style={styles.pickerTop}>
              <Text style={styles.pickerTitle}>Pick a date</Text>
              <Pressable onPress={() => setDateOpen(false)} hitSlop={10} style={styles.xBtn}>
                <Text style={styles.xBtnText}>✕</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={state.dateISO ? isoToSafeDate(state.dateISO) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              themeVariant="light"
              minimumDate={startOfToday()} // ✅ blocks past dates
              onChange={(_, d) => {
                if (!d) return;

                const chosen = new Date(d);
                chosen.setHours(12, 0, 0, 0);
                if (chosen.getTime() < startOfToday().getTime()) return;

                const chosenISO = toLocalISODate(chosen);
                dispatch({ type: "SET", key: "dateISO", value: chosenISO });

                // If user picked today and existing time became invalid, auto-fix
                if (state.time24 && !isFutureStart(chosenISO, state.time24)) {
                  const nextValid = clampToNextValidMinute(chosenISO);
                  if (nextValid) {
                    dispatch({ type: "SET", key: "time24", value: nextValid });
                    setTimeWarn("Time adjusted to stay in the future.");
                  }
                } else {
                  setTimeWarn(null);
                }

                if (Platform.OS !== "ios") setDateOpen(false);
              }}
            />

            <Pressable style={styles.done} onPress={() => setDateOpen(false)}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* TIME PICKER */}
      <Modal transparent visible={timeOpen} animationType="fade" onRequestClose={() => setTimeOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setTimeOpen(false)}>
          <Pressable style={styles.pickerCard} onPress={() => { }}>
            <View style={styles.pickerTop}>
              <Text style={styles.pickerTitle}>Pick a time</Text>
              <Pressable onPress={() => setTimeOpen(false)} hitSlop={10} style={styles.xBtn}>
                <Text style={styles.xBtnText}>✕</Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={timeToDate(state.time24)}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant="light"
              onChange={(_, d) => {
                if (!d) return;
                onPickTime(d);
                if (Platform.OS !== "ios") setTimeOpen(false);
              }}
            />

            <Pressable style={styles.done} onPress={() => setTimeOpen(false)}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // hero
  hero: { marginTop: 6, marginBottom: 14 },
  heroFrame: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    padding: 14,
  },
  dotGrid: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 10,
    bottom: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#111827",
    opacity: 0.22,
  },
  heroCopy: { paddingTop: 10 },
  heroKicker: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6B7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "900",
    color: "#0B0F19",
    letterSpacing: -0.2,
  },
  heroSub: { marginTop: 6, fontSize: 13, fontWeight: "700", color: "#6B7280" },

  // stacked tiles
  stack: { gap: 12 },

  tile: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  tileHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 16 },
  tileTop: { fontWeight: "900", color: "#111827", fontSize: 13 },
  tileVal: { marginTop: 12, fontWeight: "900", color: "#0B0F19", fontSize: 16, letterSpacing: -0.2 },
  muted: { color: "#9CA3AF" },
  tileHint: { marginTop: 6, color: "#6B7280", fontWeight: "800", fontSize: 12 },

  // preview / badges
  previewCard: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previewDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: "#2E8B6D" },
  previewKicker: { fontSize: 12, fontWeight: "900", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8 },
  previewLine: { marginTop: 4, fontWeight: "900", color: "#111827" },

  badge: { marginTop: 12, padding: 12, borderRadius: 18, borderWidth: 1 },
  badgeOk: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  badgeBad: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  badgeText: { fontWeight: "900", fontSize: 12 },
  badgeTextOk: { color: "#065F46" },
  badgeTextBad: { color: "#991B1B" },

  // modal picker
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  pickerCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  pickerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  pickerTitle: { fontWeight: "900", color: "#0F172A", fontSize: 14 },
  xBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  xBtnText: { fontWeight: "900", color: "#111827" },
  done: {
    marginTop: 10,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { color: "#fff", fontWeight: "900" },
});
