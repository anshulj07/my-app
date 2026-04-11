// app/newApp/filters.tsx
// Matches Figma image exactly:
// Header < Filters
// Categories (collapsible)
// Event Type: All / Free / Paid / Service chips
// Price Range: ₹0–₹5000 dual-handle slider
// Dates: calendar with month/year dropdowns, range selection
// Age: multi-checkbox (Kids, Teens, Adults, Middle Age, Seniors)
// Group Size: collapsible multi-checkbox
// Bottom: Discard | Apply all

import React, { useCallback, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, StatusBar,
  PanResponder, Dimensions, LayoutAnimation, UIManager,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#FFFFFF",
  green:   "#22C55E",
  greenLt: "#E8F5EE",
  ink:     "#1A1A1A",
  muted:   "#888888",
  border:  "#E8E8E8",
  chip:    "#F4F4F4",
  divider: "#F0F0F0",
};

// ─────────────────────────────────────────────────────────────
//  PRICE SLIDER
// ─────────────────────────────────────────────────────────────
const TRACK_W = SW - 80; // 20 padding each side + 20 body padding each side
const P_MIN   = 0;
const P_MAX   = 5000;

function PriceSlider({
  low, high, onChange,
}: { low: number; high: number; onChange: (l: number, h: number) => void }) {
  const lowPct  = low  / P_MAX;
  const highPct = high / P_MAX;

  // Using raw positions for gesture
  const startLow  = useRef(lowPct  * TRACK_W);
  const startHigh = useRef(highPct * TRACK_W);
  const [lowX,  setLowX]  = useState(lowPct  * TRACK_W);
  const [highX, setHighX] = useState(highPct * TRACK_W);

  const lowPR = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => { startLow.current = lowX; },
      onPanResponderMove: (_e, gs) => {
        const nx = Math.max(0, Math.min(highX - 14, startLow.current + gs.dx));
        setLowX(nx);
        onChange(Math.round((nx / TRACK_W) * P_MAX), high);
      },
    }),
  ).current;

  const highPR = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => { startHigh.current = highX; },
      onPanResponderMove: (_e, gs) => {
        const nx = Math.max(lowX + 14, Math.min(TRACK_W, startHigh.current + gs.dx));
        setHighX(nx);
        onChange(low, Math.round((nx / TRACK_W) * P_MAX));
      },
    }),
  ).current;

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }}>
        <Text style={SL.lbl}>₹ {low}</Text>
        <Text style={SL.lbl}>₹ {high}</Text>
      </View>
      <View style={{ height: 40, justifyContent: "center" }}>
        <View style={SL.trackBg} />
        <View style={[SL.trackFill, { left: lowX, width: Math.max(0, highX - lowX) }]} />
        <View {...lowPR.panHandlers}  style={[SL.thumb, { left: lowX  - 12 }]} />
        <View {...highPR.panHandlers} style={[SL.thumb, { left: highX - 12 }]} />
      </View>
    </View>
  );
}

const SL = StyleSheet.create({
  lbl:       { fontSize: 12, fontWeight: "700", color: C.muted },
  trackBg:   { position: "absolute", left: 0, right: 0, height: 4, backgroundColor: C.border, borderRadius: 99 },
  trackFill: { position: "absolute", height: 4, backgroundColor: C.green, borderRadius: 99 },
  thumb:     {
    position: "absolute", width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.green, borderWidth: 3, borderColor: "#fff",
    shadowColor: C.green, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.38, shadowRadius: 6, elevation: 4,
  },
});

// ─────────────────────────────────────────────────────────────
//  CALENDAR
// ─────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_H = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function Calendar({
  year, month, start, end,
  onPrev, onNext, onMonthPick, onYearPick, onDay,
}: {
  year: number; month: number;
  start: number | null; end: number | null;
  onPrev: () => void; onNext: () => void;
  onMonthPick: () => void; onYearPick: () => void;
  onDay: (d: number) => void;
}) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const inRange = (d: number) => {
    if (start && end) {
      const lo = Math.min(start, end), hi = Math.max(start, end);
      return d > lo && d < hi;
    }
    return false;
  };
  const isEdge = (d: number) => d === start || d === end;

  return (
    <View style={CAL.wrap}>
      {/* Nav row */}
      <View style={CAL.nav}>
        <TouchableOpacity onPress={onPrev} style={CAL.arrow} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={16} color={C.green} />
        </TouchableOpacity>

        <View style={CAL.navPills}>
          <TouchableOpacity style={CAL.navPill} onPress={onMonthPick} activeOpacity={0.8}>
            <Text style={CAL.navPillTxt}>{MONTHS[month]}</Text>
            <Ionicons name="chevron-down" size={11} color={C.green} />
          </TouchableOpacity>
          <TouchableOpacity style={CAL.navPill} onPress={onYearPick} activeOpacity={0.8}>
            <Text style={CAL.navPillTxt}>{year}</Text>
            <Ionicons name="chevron-down" size={11} color={C.green} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onNext} style={CAL.arrow} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={16} color={C.green} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={CAL.dayHRow}>
        {DAYS_H.map(d => <Text key={d} style={CAL.dayH}>{d}</Text>)}
      </View>

      {/* Weeks */}
      {weeks.map((wk, wi) => (
        <View key={wi} style={CAL.weekRow}>
          {wk.map((day, di) => {
            if (!day) return <View key={di} style={CAL.cell} />;
            const edge  = isEdge(day);
            const range = inRange(day);
            return (
              <TouchableOpacity key={di} style={CAL.cell} onPress={() => onDay(day)} activeOpacity={0.7}>
                <View style={[CAL.dayCircle, edge && CAL.dayEdge, range && CAL.dayRange]}>
                  <Text style={[CAL.dayTxt, edge && CAL.dayEdgeTxt, range && CAL.dayRangeTxt]}>
                    {day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CAL = StyleSheet.create({
  wrap:       { marginTop: 4 },
  nav:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  arrow:      { width: 30, height: 30, borderRadius: 8, backgroundColor: C.greenLt, alignItems: "center", justifyContent: "center" },
  navPills:   { flexDirection: "row", gap: 8 },
  navPill:    { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.greenLt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  navPillTxt: { fontSize: 13, fontWeight: "800", color: C.green },
  dayHRow:    { flexDirection: "row", marginBottom: 6 },
  dayH:       { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: C.muted },
  weekRow:    { flexDirection: "row", marginBottom: 2 },
  cell:       { flex: 1, alignItems: "center", paddingVertical: 2 },
  dayCircle:  { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  dayEdge:    { backgroundColor: C.green },
  dayRange:   { backgroundColor: C.greenLt },
  dayTxt:     { fontSize: 13, fontWeight: "500", color: C.ink },
  dayEdgeTxt: { color: "#fff", fontWeight: "900" },
  dayRangeTxt:{ color: C.green, fontWeight: "700" },
});

// ─────────────────────────────────────────────────────────────
//  ACCORDION SECTION
// ─────────────────────────────────────────────────────────────
function Section({
  title, open, onToggle, children,
}: { title: string; open: boolean; onToggle: () => void; children?: React.ReactNode }) {
  return (
    <View>
      <TouchableOpacity style={ACC.head} onPress={onToggle} activeOpacity={0.75}>
        <Text style={ACC.title}>{title}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={C.muted} />
      </TouchableOpacity>
      {open && children && <View style={ACC.body}>{children}</View>}
      <View style={ACC.div} />
    </View>
  );
}

const ACC = StyleSheet.create({
  head:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 17 },
  title: { fontSize: 16, fontWeight: "800", color: C.ink },
  body:  { paddingHorizontal: 20, paddingBottom: 20 },
  div:   { height: 1, backgroundColor: C.divider },
});

// ─────────────────────────────────────────────────────────────
//  CHECKBOX ROW
// ─────────────────────────────────────────────────────────────
function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={CHK.row} onPress={onToggle} activeOpacity={0.75}>
      <View style={[CHK.box, checked && CHK.checked]}>
        {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
      <Text style={CHK.lbl}>{label}</Text>
    </TouchableOpacity>
  );
}

const CHK = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10 },
  box:     { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  checked: { backgroundColor: C.green, borderColor: C.green },
  lbl:     { fontSize: 14, fontWeight: "600", color: C.ink },
});

// ─────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────
type EventKind = "All" | "Free" | "Paid" | "Service";
type AgeGroup  = "Kids (0-12)" | "Teens (13-17)" | "Adults (18-40)" | "Middle Age (41-60)" | "Seniors (60+)";
type GroupSz   = "Solo (1)" | "Small (2-5)" | "Medium (6-15)" | "Large (16-30)" | "30+";

const AGE_OPTIONS:   AgeGroup[] = ["Kids (0-12)","Teens (13-17)","Adults (18-40)","Middle Age (41-60)","Seniors (60+)"];
const GROUP_OPTIONS: GroupSz[]  = ["Solo (1)","Small (2-5)","Medium (6-15)","Large (16-30)","30+"];
const KIND_OPTIONS:  EventKind[] = ["All","Free","Paid","Service"];

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Section states
  const [catOpen,   setCatOpen]   = useState(false);
  const [kindOpen,  setKindOpen]  = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [dateOpen,  setDateOpen]  = useState(true);
  const [ageOpen,   setAgeOpen]   = useState(true);
  const [groupOpen, setGroupOpen] = useState(false);

  // Filter values
  const [kind,      setKind]      = useState<EventKind>("All");
  const [priceLow,  setPriceLow]  = useState(0);
  const [priceHigh, setPriceHigh] = useState(5000);

  const today = new Date();
  const [calMonth, setCalMonth] = useState(8); // Sep default (matches image)
  const [calYear,  setCalYear]  = useState(2025);
  const [dateFrom, setDateFrom] = useState<number | null>(9);
  const [dateTo,   setDateTo]   = useState<number | null>(13);

  const [ages,   setAges]   = useState<Set<AgeGroup>>(new Set(["Kids (0-12)"]));
  const [groups, setGroups] = useState<Set<GroupSz>>(new Set(["Solo (1)"]));

  const tog = (s: React.Dispatch<React.SetStateAction<boolean>>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    s(v => !v);
  };

  const handleDay = (d: number) => {
    if (!dateFrom || (dateFrom && dateTo)) { setDateFrom(d); setDateTo(null); }
    else { d < dateFrom ? (setDateTo(dateFrom), setDateFrom(d)) : setDateTo(d); }
  };

  const toggleAge   = (a: AgeGroup) => setAges(p   => { const n = new Set(p); n.has(a) ? n.delete(a) : n.add(a); return n; });
  const toggleGroup = (g: GroupSz)  => setGroups(p => { const n = new Set(p); n.has(g) ? n.delete(g) : n.add(g); return n; });

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const handleDiscard = () => {
    setKind("All"); setPriceLow(0); setPriceHigh(5000);
    setDateFrom(null); setDateTo(null);
    setAges(new Set()); setGroups(new Set());
  };

  const TOP = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + insets.top;

  return (
    <View style={[F.screen, { paddingTop: TOP }]}>

      {/* ── HEADER ── */}
      <View style={F.header}>
        <TouchableOpacity onPress={() => router.back()} style={F.back} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <Text style={F.headerTitle}>Filters</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={F.topDiv} />

      {/* ── SCROLL BODY ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* 1 · Categories */}
        <Section title="Categories" open={catOpen} onToggle={() => tog(setCatOpen)}>
          <Text style={F.placeholder}>Tap to pick event categories</Text>
        </Section>

        {/* 2 · Event Type */}
        <Section title="Event Type" open={kindOpen} onToggle={() => tog(setKindOpen)}>
          <View style={F.chipRow}>
            {KIND_OPTIONS.map(k => {
              const on = kind === k;
              return (
                <TouchableOpacity key={k} onPress={() => setKind(k)}
                  style={[F.chip, on && F.chipOn]} activeOpacity={0.8}>
                  <Text style={[F.chipTxt, on && F.chipTxtOn]}>{k}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* 3 · Price Range */}
        <Section title="Price Range" open={priceOpen} onToggle={() => tog(setPriceOpen)}>
          <PriceSlider
            low={priceLow} high={priceHigh}
            onChange={(l, h) => { setPriceLow(l); setPriceHigh(h); }}
          />
        </Section>

        {/* 4 · Dates */}
        <Section title="Dates" open={dateOpen} onToggle={() => tog(setDateOpen)}>
          <Calendar
            year={calYear} month={calMonth}
            start={dateFrom} end={dateTo}
            onPrev={prevMonth} onNext={nextMonth}
            onMonthPick={() => setCalMonth(m => (m + 1) % 12)}
            onYearPick={() => setCalYear(y => y + 1)}
            onDay={handleDay}
          />
        </Section>

        {/* 5 · Age */}
        <Section title="Age" open={ageOpen} onToggle={() => tog(setAgeOpen)}>
          {AGE_OPTIONS.map(a => (
            <CheckRow key={a} label={a} checked={ages.has(a)} onToggle={() => toggleAge(a)} />
          ))}
        </Section>

        {/* 6 · Group Size */}
        <Section title="Group Size" open={groupOpen} onToggle={() => tog(setGroupOpen)}>
          {GROUP_OPTIONS.map(g => (
            <CheckRow key={g} label={g} checked={groups.has(g)} onToggle={() => toggleGroup(g)} />
          ))}
        </Section>

      </ScrollView>

      {/* ── BOTTOM BAR ── */}
      <View style={[F.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <TouchableOpacity style={F.discardBtn} onPress={handleDiscard} activeOpacity={0.8}>
          <Text style={F.discardTxt}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={F.applyBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={F.applyTxt}>Apply all</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const F = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  back:        { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  topDiv:      { height: 1, backgroundColor: C.divider },
  placeholder: { fontSize: 13, color: C.muted, fontWeight: "600" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 99,
    backgroundColor: C.chip, borderWidth: 1.5, borderColor: C.border,
  },
  chipOn:    { backgroundColor: C.green, borderColor: C.green },
  chipTxt:   { fontSize: 13, fontWeight: "700", color: C.muted },
  chipTxtOn: { color: "#fff", fontWeight: "800" },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", gap: 12,
    paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.divider,
  },
  discardBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 14,
    backgroundColor: C.chip, borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  discardTxt: { fontSize: 15, fontWeight: "800", color: C.ink },
  applyBtn: {
    flex: 2, paddingVertical: 15, borderRadius: 14,
    backgroundColor: C.green,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 10, elevation: 5,
  },
  applyTxt: { fontSize: 15, fontWeight: "900", color: "#fff" },
});