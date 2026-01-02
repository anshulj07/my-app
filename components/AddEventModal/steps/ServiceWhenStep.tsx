// components/add-event/steps/ServiceWhenStep.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, Modal, Platform, StyleSheet, ScrollView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { WizardState } from "../wizard/wizardTypes";
import type { WizardAction } from "../wizard/wizardReducer";
import { isFutureStart } from "../wizard/wizardValidation";

/**
 * WizardState keys used:
 * - serviceScheduleType: "appointment" | "availability" | "slots"
 * - serviceDays: string[]                           // e.g. ["mon","tue"]
 * - serviceStart24: string                          // "09:00"
 * - serviceEnd24: string                            // "18:00"
 * - serviceSlots: { dateISO: string; time24: string; durationMin: number }[]
 */

const COLORS = {
  bg: "#F7FBF8",
  card: "#FFFFFF",
  border: "#E6EFEA",
  text: "#0B1220",
  mutText: "#5B6B62",
  soft: "#F2FBF6",
  soft2: "#ECFDF5",
  green: "#16A34A",
  greenDark: "#0F7A35",
  greenBorder: "#A7F3D0",
  red: "#EF4444",
  redSoft: "#FEF2F2",
  redBorder: "#FECACA",
};

function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function isoToSafeDate(iso: string) {
  if (!iso) return new Date();
  return new Date(`${iso}T12:00:00`);
}
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
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
function toHHMM(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function formatTime12(hh: number, mm: number) {
  const ampm = hh >= 12 ? "PM" : "AM";
  const h = hh % 12 === 0 ? 12 : hh % 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ampm}`;
}
function formatHHMM12(hhmm?: string) {
  if (!hhmm) return "—";
  const [hh, mm] = hhmm.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "—";
  return formatTime12(hh, mm);
}
function mins(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 60) return `${n}m`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const DAY_OPTIONS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

type SlotPickerMode = null | "date" | "time";

export default function ServiceWhenStep({
  state,
  dispatch,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const scheduleType = (state as any).serviceScheduleType as "appointment" | "availability" | "slots" | undefined;
  const serviceDays = ((state as any).serviceDays ?? []) as string[];
  const serviceStart24 = ((state as any).serviceStart24 ?? "") as string;
  const serviceEnd24 = ((state as any).serviceEnd24 ?? "") as string;
  const serviceSlots = (((state as any).serviceSlots ?? []) as any[]) as {
    dateISO: string;
    time24: string;
    durationMin: number;
  }[];

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const [slotOpen, setSlotOpen] = useState(false);
  const [slotIdx, setSlotIdx] = useState<number | null>(null);

  // ✅ FIX: avoid stacked modals for slot date/time (that breaks pickers on many devices)
  const [slotPickerMode, setSlotPickerMode] = useState<SlotPickerMode>(null);

  const activeSlot = useMemo(() => {
    if (slotIdx == null) return null;
    return serviceSlots[slotIdx] ?? null;
  }, [slotIdx, serviceSlots]);

  const subtitle = useMemo(() => {
    if (scheduleType === "slots") return "Add bookable sessions (great for tours/classes).";
    if (scheduleType === "availability") return "Set days + a time window (great for flexible services).";
    return "People request a time, you confirm (best for long jobs).";
  }, [scheduleType]);

  useEffect(() => {
    if (!scheduleType) dispatch({ type: "SET", key: "serviceScheduleType" as any, value: "appointment" });
    if (!serviceStart24) dispatch({ type: "SET", key: "serviceStart24" as any, value: "09:00" });
    if (!serviceEnd24) dispatch({ type: "SET", key: "serviceEnd24" as any, value: "18:00" });
    if (!Array.isArray(serviceDays) || serviceDays.length === 0) {
      dispatch({ type: "SET", key: "serviceDays" as any, value: ["mon", "tue", "wed", "thu", "fri"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const typeCards = useMemo(
    () => [
      { key: "appointment", title: "By appointment", sub: "Customer requests • you confirm" },
      { key: "availability", title: "Weekly availability", sub: "Pick days + time window" },
      { key: "slots", title: "Specific slots", sub: "Create sessions people can book" },
    ],
    []
  );

  const toggleDay = (k: string) => {
    const next = serviceDays.includes(k) ? serviceDays.filter((d) => d !== k) : [...serviceDays, k];
    dispatch({ type: "SET", key: "serviceDays" as any, value: next });
  };

  const setSlots = (next: any[]) => dispatch({ type: "SET", key: "serviceSlots" as any, value: next });

  const openNewSlot = () => {
    const today = toLocalISODate(new Date());
    const next = [...serviceSlots, { dateISO: today, time24: "12:00", durationMin: 120 }];
    setSlots(next);
    setSlotIdx(next.length - 1);
    setSlotPickerMode(null);
    setSlotOpen(true);
  };

  const openEditSlot = (idx: number) => {
    setSlotIdx(idx);
    setSlotPickerMode(null);
    setSlotOpen(true);
  };

  const removeSlot = (idx: number) => {
    const next = serviceSlots.filter((_, i) => i !== idx);
    setSlots(next);
    if (slotIdx === idx) {
      setSlotIdx(null);
      setSlotPickerMode(null);
      setSlotOpen(false);
    }
  };

  const slotFutureOk = useMemo(() => {
    if (!activeSlot?.dateISO || !activeSlot?.time24) return false;
    return isFutureStart(activeSlot.dateISO, activeSlot.time24);
  }, [activeSlot?.dateISO, activeSlot?.time24]);

  const slotWhenText = useMemo(() => {
    if (!activeSlot?.dateISO || !activeSlot?.time24) return "—";
    const iso = new Date(`${activeSlot.dateISO}T${activeSlot.time24}:00`).toISOString();
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [activeSlot?.dateISO, activeSlot?.time24]);

  const availabilityPreview = useMemo(() => {
    const days = serviceDays.length ? serviceDays.join(", ").toUpperCase() : "Pick days";
    const t = `${formatHHMM12(serviceStart24)} – ${formatHHMM12(serviceEnd24)}`;
    return `${days} • ${t}`;
  }, [serviceDays, serviceStart24, serviceEnd24]);

  return (
    <View style={styles.container}>
      {/* (Optional) tiny helper text; remove if you don't want it */}
      <Text style={styles.helper}>{subtitle}</Text>

      <View style={styles.section}>
        <View style={styles.stack}>
          {typeCards.map((p) => {
            const on = scheduleType === (p.key as any);
            return (
              <Pressable
                key={p.key}
                onPress={() => dispatch({ type: "SET", key: "serviceScheduleType" as any, value: p.key })}
                style={({ pressed }) => [styles.typeCard, on && styles.typeCardOn, pressed && styles.pressed]}
              >
                <View style={styles.typeRowTop}>
                  <View style={[styles.radio, on && styles.radioOn]} />
                  <Text style={[styles.typeTitle, on && styles.typeTitleOn]}>{p.title}</Text>
                </View>
                <Text style={[styles.typeSub, on && styles.typeSubOn]}>{p.sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {scheduleType === "appointment" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By appointment</Text>
          <Text style={styles.cardBody}>
            Best for long/flexible work. Customers request a time, you confirm it in chat.
          </Text>

          <View style={styles.note}>
            <View style={styles.noteDot} />
            <Text style={styles.noteText}>No fixed date/time needed.</Text>
          </View>

          <Pressable
            onPress={() => dispatch({ type: "SET", key: "serviceScheduleType" as any, value: "availability" })}
            style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostPressed]}
          >
            <Text style={styles.ghostText}>Add weekly availability</Text>
          </Pressable>
        </View>
      )}

      {scheduleType === "availability" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly availability</Text>
          <Text style={styles.cardBody}>Pick days + a single time window.</Text>

          <Text style={styles.label}>Days</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {DAY_OPTIONS.map((d) => {
              const on = serviceDays.includes(d.key);
              return (
                <Pressable
                  key={d.key}
                  onPress={() => toggleDay(d.key)}
                  style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.chipPressed]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.label, { marginTop: 18 }]}>Time window</Text>

          <Pressable onPress={() => setStartOpen(true)} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <Text style={styles.tileK}>Start</Text>
            <Text style={styles.tileV}>{formatHHMM12(serviceStart24)}</Text>
          </Pressable>

          <Pressable onPress={() => setEndOpen(true)} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <Text style={styles.tileK}>End</Text>
            <Text style={styles.tileV}>{formatHHMM12(serviceEnd24)}</Text>
          </Pressable>

          <View style={styles.preview}>
            <View style={styles.previewDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.previewK}>Preview</Text>
              <Text style={styles.previewV}>{availabilityPreview}</Text>
            </View>
          </View>

          {/* START picker */}
          <Modal transparent visible={startOpen} animationType="fade" onRequestClose={() => setStartOpen(false)}>
            <Pressable style={styles.overlay} onPress={() => setStartOpen(false)}>
              <Pressable style={styles.pickerCard} onPress={() => {}}>
                <View style={styles.pickerTop}>
                  <Text style={styles.pickerTitle}>Start time</Text>
                  <Pressable onPress={() => setStartOpen(false)} hitSlop={10} style={styles.xBtn}>
                    <Text style={styles.xBtnText}>✕</Text>
                  </Pressable>
                </View>

                <DateTimePicker
                  value={timeToDate(serviceStart24)}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  themeVariant="light"
                  onChange={(e: any, d) => {
                    if (Platform.OS === "android" && e?.type === "dismissed") return setStartOpen(false);
                    if (!d) return;
                    dispatch({ type: "SET", key: "serviceStart24" as any, value: toHHMM(d) });
                    if (Platform.OS !== "ios") setStartOpen(false);
                  }}
                />

                <Pressable style={styles.done} onPress={() => setStartOpen(false)}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>

          {/* END picker */}
          <Modal transparent visible={endOpen} animationType="fade" onRequestClose={() => setEndOpen(false)}>
            <Pressable style={styles.overlay} onPress={() => setEndOpen(false)}>
              <Pressable style={styles.pickerCard} onPress={() => {}}>
                <View style={styles.pickerTop}>
                  <Text style={styles.pickerTitle}>End time</Text>
                  <Pressable onPress={() => setEndOpen(false)} hitSlop={10} style={styles.xBtn}>
                    <Text style={styles.xBtnText}>✕</Text>
                  </Pressable>
                </View>

                <DateTimePicker
                  value={timeToDate(serviceEnd24)}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  themeVariant="light"
                  onChange={(e: any, d) => {
                    if (Platform.OS === "android" && e?.type === "dismissed") return setEndOpen(false);
                    if (!d) return;
                    dispatch({ type: "SET", key: "serviceEnd24" as any, value: toHHMM(d) });
                    if (Platform.OS !== "ios") setEndOpen(false);
                  }}
                />

                <Pressable style={styles.done} onPress={() => setEndOpen(false)}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      )}

      {scheduleType === "slots" && (
        <View style={styles.card}>
          <View style={styles.slotsHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Specific slots</Text>
              <Text style={styles.cardBody}>Add sessions people can book.</Text>
            </View>

            <Pressable onPress={openNewSlot} style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]}>
              <Text style={styles.primaryText}>Add</Text>
            </Pressable>
          </View>

          {serviceSlots.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No slots yet</Text>
              <Text style={styles.emptyBody}>Add at least one slot.</Text>
            </View>
          ) : (
            <View style={{ marginTop: 14 }}>
              {serviceSlots.map((s, idx) => {
                const ok = s?.dateISO && s?.time24 ? isFutureStart(s.dateISO, s.time24) : false;
                const label = s?.dateISO
                  ? isoToSafeDate(s.dateISO).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "—";
                const t = s?.time24 ? formatHHMM12(s.time24) : "—";

                return (
                  <Pressable
                    key={`${s.dateISO}-${s.time24}-${idx}`}
                    onPress={() => openEditSlot(idx)}
                    style={({ pressed }) => [styles.slotRow, pressed && styles.pressed]}
                  >
                    <View style={[styles.slotDot, ok ? styles.slotDotOk : styles.slotDotBad]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotTop}>
                        {label} • {t}
                      </Text>
                      <Text style={styles.slotSub}>
                        Duration: {mins(s.durationMin)}
                        {ok ? "" : " • must be future"}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeSlot(idx)} hitSlop={10} style={styles.trash}>
                      <Text style={styles.trashText}>✕</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Slot editor (single modal) */}
          <Modal transparent visible={slotOpen} animationType="fade" onRequestClose={() => setSlotOpen(false)}>
            <Pressable style={styles.overlay} onPress={() => setSlotOpen(false)}>
              <Pressable style={styles.pickerCard} onPress={() => {}}>
                <View style={styles.pickerTop}>
                  <Text style={styles.pickerTitle}>Edit slot</Text>
                  <Pressable
                    onPress={() => {
                      setSlotPickerMode(null);
                      setSlotOpen(false);
                    }}
                    hitSlop={10}
                    style={styles.xBtn}
                  >
                    <Text style={styles.xBtnText}>✕</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => setSlotPickerMode((m) => (m === "date" ? null : "date"))}
                  style={({ pressed }) => [
                    styles.tile,
                    styles.tileTight,
                    pressed && styles.pressed,
                    slotPickerMode === "date" && styles.tileActive,
                  ]}
                >
                  <Text style={styles.tileK}>Date</Text>
                  <Text style={styles.tileV}>
                    {activeSlot?.dateISO
                      ? isoToSafeDate(activeSlot.dateISO).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "Pick"}
                  </Text>
                </Pressable>

                {slotPickerMode === "date" && (
                  <View style={styles.inlinePicker}>
                    <DateTimePicker
                      value={activeSlot?.dateISO ? isoToSafeDate(activeSlot.dateISO) : new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      themeVariant="light"
                      minimumDate={startOfToday()}
                      onChange={(e: any, d) => {
                        if (Platform.OS === "android" && e?.type === "dismissed") return setSlotPickerMode(null);
                        if (!d || slotIdx == null) return;
                        const chosen = new Date(d);
                        chosen.setHours(12, 0, 0, 0);
                        const next = [...serviceSlots];
                        next[slotIdx] = { ...next[slotIdx], dateISO: toLocalISODate(chosen) };
                        setSlots(next);
                        if (Platform.OS !== "ios") setSlotPickerMode(null);
                      }}
                    />

                    {Platform.OS === "ios" && (
                      <Pressable style={styles.smallDone} onPress={() => setSlotPickerMode(null)}>
                        <Text style={styles.smallDoneText}>Done</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                <Pressable
                  onPress={() => setSlotPickerMode((m) => (m === "time" ? null : "time"))}
                  style={({ pressed }) => [
                    styles.tile,
                    styles.tileTight,
                    pressed && styles.pressed,
                    slotPickerMode === "time" && styles.tileActive,
                  ]}
                >
                  <Text style={styles.tileK}>Time</Text>
                  <Text style={styles.tileV}>{activeSlot?.time24 ? formatHHMM12(activeSlot.time24) : "Pick"}</Text>
                </Pressable>

                {slotPickerMode === "time" && (
                  <View style={styles.inlinePicker}>
                    <DateTimePicker
                      value={timeToDate(activeSlot?.time24 ?? "12:00")}
                      mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      themeVariant="light"
                      onChange={(e: any, d) => {
                        if (Platform.OS === "android" && e?.type === "dismissed") return setSlotPickerMode(null);
                        if (!d || slotIdx == null) return;
                        const next = [...serviceSlots];
                        next[slotIdx] = { ...next[slotIdx], time24: toHHMM(d) };
                        setSlots(next);
                        if (Platform.OS !== "ios") setSlotPickerMode(null);
                      }}
                    />

                    {Platform.OS === "ios" && (
                      <Pressable style={styles.smallDone} onPress={() => setSlotPickerMode(null)}>
                        <Text style={styles.smallDoneText}>Done</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                <Text style={[styles.label, { marginTop: 18 }]}>Duration</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {[60, 90, 120, 180].map((m) => {
                    const on = (activeSlot?.durationMin ?? 0) === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => {
                          if (slotIdx == null) return;
                          const next = [...serviceSlots];
                          next[slotIdx] = { ...next[slotIdx], durationMin: m };
                          setSlots(next);
                        }}
                        style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.chipPressed]}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{mins(m)}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={[styles.badge, slotFutureOk ? styles.badgeOk : styles.badgeBad]}>
                  <Text style={[styles.badgeText, slotFutureOk ? styles.badgeTextOk : styles.badgeTextBad]}>
                    {slotFutureOk ? `Looks good • ${slotWhenText}` : "Slot must be in the future."}
                  </Text>
                </View>

                <Pressable
                  style={styles.done}
                  onPress={() => {
                    setSlotPickerMode(null);
                    setSlotOpen(false);
                  }}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      )}

      {/* extra bottom breathing room */}
      <View style={{ height: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 10 },

  helper: {
    marginBottom: 14,
    paddingHorizontal: 2,
    fontWeight: "800",
    color: COLORS.mutText,
    lineHeight: 18,
  },

  section: { marginBottom: 14 },
  stack: { gap: 12 },

  typeCard: {
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  typeCardOn: {
    borderColor: COLORS.greenBorder,
    backgroundColor: COLORS.soft2,
  },
  typeRowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  radio: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#BFDACB",
    backgroundColor: "#FFFFFF",
  },
  radioOn: { borderColor: COLORS.green, backgroundColor: COLORS.green },
  typeTitle: { fontWeight: "900", color: COLORS.text, fontSize: 15 },
  typeTitleOn: { color: COLORS.greenDark },
  typeSub: { marginTop: 6, fontWeight: "800", color: COLORS.mutText, lineHeight: 18 },
  typeSubOn: { color: COLORS.mutText },

  card: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  cardTitle: { fontWeight: "900", color: COLORS.text, fontSize: 16 },
  cardBody: { marginTop: 8, fontWeight: "800", color: COLORS.mutText, lineHeight: 18 },

  note: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  noteDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS.green },
  noteText: { flex: 1, fontWeight: "900", color: COLORS.greenDark },

  ghostBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    backgroundColor: COLORS.soft2,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostPressed: { opacity: 0.92 },
  ghostText: { fontWeight: "900", color: COLORS.greenDark },

  label: { fontWeight: "900", color: COLORS.text, marginTop: 12, marginBottom: 10 },

  chipsRow: { gap: 10, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
  },
  chipOn: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  chipPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  chipText: { fontWeight: "900", color: COLORS.text, fontSize: 12 },
  chipTextOn: { color: "#FFFFFF" },

  tile: {
    borderRadius: 20,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginTop: 12,
  },
  tileTight: { paddingVertical: 16 },
  tileActive: { borderColor: COLORS.greenBorder, backgroundColor: COLORS.soft2 },
  tileK: { fontWeight: "900", color: COLORS.mutText, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  tileV: { marginTop: 10, fontWeight: "900", color: COLORS.text, fontSize: 20 },

  preview: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
  },
  previewDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS.green },
  previewK: { fontSize: 12, fontWeight: "900", color: COLORS.greenDark, textTransform: "uppercase", letterSpacing: 0.8 },
  previewV: { marginTop: 4, fontWeight: "900", color: COLORS.text, lineHeight: 18 },

  slotsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },

  primaryBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  primaryText: { color: "#FFFFFF", fontWeight: "900" },

  empty: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: { fontWeight: "900", color: COLORS.text },
  emptyBody: { marginTop: 6, fontWeight: "800", color: COLORS.mutText },

  slotRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotDot: { width: 10, height: 10, borderRadius: 999 },
  slotDotOk: { backgroundColor: COLORS.green },
  slotDotBad: { backgroundColor: COLORS.red },
  slotTop: { fontWeight: "900", color: COLORS.text, fontSize: 14 },
  slotSub: { marginTop: 5, fontWeight: "800", color: COLORS.mutText, fontSize: 12 },

  trash: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#F4FBF7",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  trashText: { fontWeight: "900", color: COLORS.text },

  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },

  badge: { marginTop: 14, padding: 14, borderRadius: 18, borderWidth: 1 },
  badgeOk: { backgroundColor: COLORS.soft2, borderColor: COLORS.greenBorder },
  badgeBad: { backgroundColor: COLORS.redSoft, borderColor: COLORS.redBorder },
  badgeText: { fontWeight: "900", fontSize: 12, lineHeight: 18 },
  badgeTextOk: { color: COLORS.greenDark },
  badgeTextBad: { color: "#991B1B" },

  inlinePicker: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  smallDone: {
    marginTop: 10,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  smallDoneText: { color: "#fff", fontWeight: "900" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  pickerCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  pickerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  pickerTitle: { fontWeight: "900", color: COLORS.text, fontSize: 15 },
  xBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: COLORS.soft2,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  xBtnText: { fontWeight: "900", color: COLORS.greenDark },

  done: {
    marginTop: 12,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
