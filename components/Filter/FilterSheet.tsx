// components/Filter/FilterSheet.tsx
import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Modal,
  PanResponder, Dimensions, LayoutAnimation, UIManager,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SW, height: SH } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#FFFFFF",
  primary: "#22C55E",
  primaryLt: "rgba(34, 197, 94, 0.08)",
  ink:     "#121212",
  ink2:    "#444444",
  muted:   "#8E8E93",
  border:  "#F2F2F7",
  surface: "#F9F9F9",
  white:   "#FFFFFF",
};

// ─────────────────────────────────────────────────────────────
//  PRICE SLIDER
// ─────────────────────────────────────────────────────────────
const TRACK_W = SW - 80; 
const P_MAX   = 5000;

function PriceSlider({ low, high, onChange }: { low: number; high: number; onChange: (l: number, h: number) => void }) {
  const [lowX,  setLowX]  = useState((low / P_MAX) * TRACK_W);
  const [highX, setHighX] = useState((high / P_MAX) * TRACK_W);

  React.useEffect(() => {
    setLowX((low / P_MAX) * TRACK_W);
    setHighX((high / P_MAX) * TRACK_W);
  }, [low, high]);

  const lowPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderMove: (_e, gs) => {
      const nx = Math.max(0, Math.min(highX - 20, lowX + gs.dx));
      setLowX(nx);
      onChange(Math.round((nx / TRACK_W) * P_MAX), high);
    },
  })).current;

  const highPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderMove: (_e, gs) => {
      const nx = Math.max(lowX + 20, Math.min(TRACK_W, highX + gs.dx));
      setHighX(nx);
      onChange(low, Math.round((nx / TRACK_W) * P_MAX));
    },
  })).current;

  return (
    <View style={SL.container}>
      <View style={SL.labelRow}>
        <View style={SL.priceBox}><Text style={SL.priceLabel}>Min</Text><Text style={SL.priceVal}>₹{low}</Text></View>
        <View style={SL.priceBox}><Text style={[SL.priceLabel, { textAlign: "right" }]}>Max</Text><Text style={[SL.priceVal, { textAlign: "right" }]}>₹{high === P_MAX ? `${high}+` : high}</Text></View>
      </View>
      <View style={SL.trackContainer}>
        <View style={SL.trackBg} />
        <View style={[SL.trackFill, { left: lowX, width: Math.max(0, highX - lowX) }]} />
        <View {...lowPR.panHandlers}  style={[SL.thumb, { left: lowX - 14 }]} />
        <View {...highPR.panHandlers} style={[SL.thumb, { left: highX - 14 }]} />
      </View>
    </View>
  );
}

const SL = StyleSheet.create({
  container: { marginTop: 10 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  priceBox: { flex: 1 },
  priceLabel: { fontSize: 11, color: C.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
  priceVal: { fontSize: 18, fontWeight: "800", color: C.ink },
  trackContainer: { height: 40, justifyContent: "center" },
  trackBg:   { position: "absolute", left: 0, right: 0, height: 6, backgroundColor: C.border, borderRadius: 3 },
  trackFill: { position: "absolute", height: 6, backgroundColor: C.primary, borderRadius: 3 },
  thumb:     {
    position: "absolute", width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.white, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
});

// ─────────────────────────────────────────────────────────────
//  CALENDAR
// ─────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_H = ["S","M","T","W","T","F","S"];

function Calendar({ year, month, start, end, onPrev, onNext, onDay }: any) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={CAL.wrap}>
      <View style={CAL.nav}>
        <TouchableOpacity onPress={onPrev} style={CAL.arrow}><Ionicons name="chevron-back" size={18} color={C.ink} /></TouchableOpacity>
        <Text style={CAL.monthYear}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={onNext} style={CAL.arrow}><Ionicons name="chevron-forward" size={18} color={C.ink} /></TouchableOpacity>
      </View>
      <View style={CAL.dayHRow}>{DAYS_H.map((d, i) => <Text key={i} style={CAL.dayH}>{d}</Text>)}</View>
      {weeks.map((wk, wi) => (
        <View key={wi} style={CAL.weekRow}>
          {wk.map((day, di) => {
            if (!day) return <View key={di} style={CAL.cell} />;
            const active = day === start || day === end;
            const range = start && end && day > Math.min(start, end) && day < Math.max(start, end);
            return (
              <TouchableOpacity key={di} style={CAL.cell} onPress={() => onDay(day)} activeOpacity={0.8}>
                <View style={[CAL.dayCircle, active && CAL.dayActive, range && CAL.dayRange]}>
                  <Text style={[CAL.dayTxt, active && CAL.dayActiveTxt, range && CAL.dayRangeTxt]}>{day}</Text>
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
  wrap: { marginTop: 10 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  monthYear: { fontSize: 15, fontWeight: "800", color: C.ink },
  arrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  dayHRow: { flexDirection: "row", marginBottom: 10 },
  dayH: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700", color: C.muted },
  weekRow: { flexDirection: "row", marginBottom: 2 },
  cell: { flex: 1, alignItems: "center", justifyContent: "center", height: 38 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  dayActive: { backgroundColor: C.primary },
  dayRange: { backgroundColor: C.primaryLt, borderRadius: 0, width: "100%" },
  dayTxt: { fontSize: 13, fontWeight: "600", color: C.ink },
  dayActiveTxt: { color: C.white, fontWeight: "800" },
  dayRangeTxt: { color: C.primary, fontWeight: "700" },
});

// ─────────────────────────────────────────────────────────────
//  SHEET COMPONENT
// ─────────────────────────────────────────────────────────────
const QUICK_PRICES = [
  { label: "Free", low: 0, high: 0 },
  { label: "Under ₹500", low: 0, high: 500 },
  { label: "₹500 - ₹1k", low: 500, high: 1000 },
  { label: "₹1k - ₹2k", low: 1000, high: 2000 },
];
const CATEGORIES = ["Social", "Fitness", "Wellness", "Food", "Tech", "Music"];

export default function FilterSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [kind, setKind] = useState("All");
  const [priceLow, setPriceLow] = useState(0);
  const [priceHigh, setPriceHigh] = useState(5000);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState<number | null>(null);
  const [dateTo, setDateTo] = useState<number | null>(null);

  const handleDay = (d: number) => {
    if (!dateFrom || (dateFrom && dateTo)) { setDateFrom(d); setDateTo(null); }
    else { d < dateFrom ? (setDateTo(dateFrom), setDateFrom(d)) : setDateTo(d); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={FS.root}>
        <TouchableOpacity style={FS.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={FS.sheet}>
          <View style={FS.grabber} />
          
          <View style={FS.header}>
            <Text style={FS.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={() => { setKind("All"); setPriceLow(0); setPriceHigh(5000); setDateFrom(null); setDateTo(null); }}>
              <Text style={FS.resetTxt}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={FS.scroll}>
            {/* Categories */}
            <View style={FS.sec}>
              <Text style={FS.secTitle}>Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={FS.pillRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={FS.pill}><Text style={FS.pillTxt}>{c}</Text></TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Event Type */}
            <View style={FS.sec}>
              <Text style={FS.secTitle}>Event Type</Text>
              <View style={FS.grid}>
                {["All", "Free", "Paid", "Service"].map(k => (
                  <TouchableOpacity key={k} onPress={() => setKind(k)} style={[FS.gridItem, kind === k && FS.gridItemOn]}>
                    <Text style={[FS.gridTxt, kind === k && FS.gridTxtOn]}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price */}
            <View style={FS.sec}>
              <Text style={FS.secTitle}>Price Range</Text>
              <View style={FS.quickRow}>
                {QUICK_PRICES.map(qp => (
                  <TouchableOpacity key={qp.label} onPress={() => { setPriceLow(qp.low); setPriceHigh(qp.high); }} style={[FS.qPill, priceLow === qp.low && priceHigh === qp.high && FS.qPillOn]}>
                    <Text style={[FS.qPillTxt, priceLow === qp.low && priceHigh === qp.high && FS.qPillTxtOn]}>{qp.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <PriceSlider low={priceLow} high={priceHigh} onChange={(l, h) => { setPriceLow(l); setPriceHigh(h); }} />
            </View>

            {/* Date */}
            <View style={[FS.sec, { borderBottomWidth: 0 }]}>
              <Text style={FS.secTitle}>Date Range</Text>
              <Calendar
                year={calYear} month={calMonth} start={dateFrom} end={dateTo}
                onPrev={() => calMonth === 0 ? (setCalMonth(11), setCalYear(y => y - 1)) : setCalMonth(m => m - 1)}
                onNext={() => calMonth === 11 ? (setCalMonth(0), setCalYear(y => y + 1)) : setCalMonth(m => m + 1)}
                onDay={handleDay}
              />
            </View>
          </ScrollView>

          <View style={FS.footer}>
            <TouchableOpacity style={FS.applyBtn} onPress={onClose}>
              <LinearGradient colors={["#22C55E", "#16A34A"]} style={FS.gradient}>
                <Text style={FS.applyBtnTxt}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const FS = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    height: "85%", backgroundColor: C.bg,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: C.ink },
  resetTxt: { fontSize: 14, fontWeight: "700", color: C.primary },
  scroll: { paddingHorizontal: 24, paddingBottom: 100 },
  sec: { paddingTop: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: C.border },
  secTitle: { fontSize: 16, fontWeight: "900", color: C.ink, marginBottom: 16 },
  pillRow: { gap: 8 },
  pill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  pillTxt: { fontSize: 13, fontWeight: "700", color: C.ink2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { flex: 1, minWidth: "45%", paddingVertical: 12, borderRadius: 14, backgroundColor: C.surface, alignItems: "center", borderWidth: 1, borderColor: C.border },
  gridItemOn: { backgroundColor: C.ink, borderColor: C.ink },
  gridTxt: { fontSize: 14, fontWeight: "800", color: C.ink2 },
  gridTxtOn: { color: C.white },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  qPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  qPillOn: { backgroundColor: C.primaryLt, borderColor: C.primary },
  qPillTxt: { fontSize: 12, fontWeight: "700", color: C.muted },
  qPillTxtOn: { color: C.primary, fontWeight: "800" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 34 : 20, paddingTop: 15, backgroundColor: "rgba(255,255,255,0.9)" },
  applyBtn: { height: 56, borderRadius: 18, overflow: "hidden" },
  gradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  applyBtnTxt: { fontSize: 16, fontWeight: "900", color: C.white },
});
