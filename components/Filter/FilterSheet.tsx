// components/Filter/FilterSheet.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Modal,
  PanResponder, Dimensions, Animated, StatusBar
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";

const { width: SW, height: SH } = Dimensions.get("window");

const C = {
  bg:      "#F8FAFF",
  white:   "#FFFFFF",
  primary: "#5252E2",
  primaryLt: "#EEF2FF",
  ink:     "#1A1C2E",
  ink2:    "#4B4E6D",
  muted:   "#8F94B1",
  border:  "#EAEFF5",
  accent:  "#5252E2",
};

// ─────────────────────────────────────────────────────────────
//  PRICE SLIDER
// ─────────────────────────────────────────────────────────────
const TRACK_W = SW - 64; 
const P_MAX   = 5000;

function PriceSlider({ low, high, onChange }: { low: number; high: number; onChange: (l: number, h: number) => void }) {
  const [lowX,  setLowX]  = useState((low / P_MAX) * TRACK_W);
  const [highX, setHighX] = useState((high / P_MAX) * TRACK_W);

  useEffect(() => {
    setLowX((low / P_MAX) * TRACK_W);
    setHighX((high / P_MAX) * TRACK_W);
  }, [low, high]);

  const lowPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderMove: (_e, gs) => {
      const nx = Math.max(0, Math.min(highX - 30, lowX + gs.dx));
      setLowX(nx);
      onChange(Math.round((nx / TRACK_W) * P_MAX), high);
    },
  })).current;

  const highPR = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderMove: (_e, gs) => {
      const nx = Math.max(lowX + 30, Math.min(TRACK_W, highX + gs.dx));
      setHighX(nx);
      onChange(low, Math.round((nx / TRACK_W) * P_MAX));
    },
  })).current;

  return (
    <View style={SL.container}>
      <View style={SL.trackContainer}>
        <View style={SL.trackBg} />
        <View style={[SL.trackFill, { left: lowX, width: Math.max(0, highX - lowX) }]} />
        <View {...lowPR.panHandlers}  style={[SL.thumb, { left: lowX - 12 }]} />
        <View {...highPR.panHandlers} style={[SL.thumb, { left: highX - 12 }]} />
      </View>
      <View style={SL.ticks}>
        {[0, 1000, 2000, 3000, 4000, 5000].map(v => (
          <Text key={v} style={SL.tickTxt}>₹{v === 5000 ? "5000+" : v}</Text>
        ))}
      </View>
    </View>
  );
}

const SL = StyleSheet.create({
  container: { marginTop: 15 },
  trackContainer: { height: 30, justifyContent: "center" },
  trackBg:   { position: "absolute", left: 0, right: 0, height: 6, backgroundColor: "#E6EAF5", borderRadius: 3 },
  trackFill: { position: "absolute", height: 6, backgroundColor: C.primary, borderRadius: 3 },
  thumb:     {
    position: "absolute", width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.white, borderWidth: 2, borderColor: C.primary,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  ticks: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  tickTxt: { fontSize: 11, fontFamily: "Outfit_500Medium", color: C.muted },
});

// ─────────────────────────────────────────────────────────────
//  CALENDAR
// ─────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
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
        <Text style={CAL.monthYear}>{MONTHS[month]} {year}</Text>
        <View style={CAL.arrows}>
          <TouchableOpacity onPress={onPrev} style={CAL.arrow}><Ionicons name="chevron-back" size={18} color={C.ink} /></TouchableOpacity>
          <TouchableOpacity onPress={onNext} style={CAL.arrow}><Ionicons name="chevron-forward" size={18} color={C.ink} /></TouchableOpacity>
        </View>
      </View>
      <View style={CAL.box}>
        <View style={CAL.dayHRow}>{DAYS_H.map((d, i) => <Text key={i} style={CAL.dayH}>{d}</Text>)}</View>
        {weeks.map((wk, wi) => (
          <View key={wi} style={CAL.weekRow}>
            {wk.map((day, di) => {
              if (!day) return <View key={di} style={CAL.cell} />;
              const isStart = day === start;
              const isEnd   = day === end;
              const active  = isStart || isEnd;
              const range   = start && end && day > Math.min(start, end) && day < Math.max(start, end);
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
    </View>
  );
}

const CAL = StyleSheet.create({
  wrap: { marginTop: 10 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  monthYear: { fontSize: 15, fontFamily: "Outfit_600SemiBold", color: C.ink },
  arrows: { flexDirection: "row", gap: 15 },
  arrow: { padding: 4 },
  box: { backgroundColor: C.white, borderRadius: 20, padding: 15, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  dayHRow: { flexDirection: "row", marginBottom: 15 },
  dayH: { flex: 1, textAlign: "center", fontSize: 12, fontFamily: "Outfit_500Medium", color: C.muted },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  cell: { flex: 1, alignItems: "center", justifyContent: "center", height: 40 },
  dayCircle: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dayActive: { backgroundColor: C.primary },
  dayRange: { backgroundColor: "#EEF2FF", borderRadius: 0, width: "100%" },
  dayTxt: { fontSize: 14, fontFamily: "Outfit_500Medium", color: C.ink },
  dayActiveTxt: { color: C.white, fontFamily: "Outfit_700Bold" },
  dayRangeTxt: { color: C.ink },
});

// ─────────────────────────────────────────────────────────────
//  SHEET COMPONENT
// ─────────────────────────────────────────────────────────────
const CATS = [
  { label: "Social", icon: "🎡" },
  { label: "Fitness", icon: "🏋️" },
  { label: "Wellness", icon: "🧘" },
  { label: "Food", icon: "🍴" },
  { label: "Outdoor", icon: "🧗" },
];

export type FilterData = {
  kind: string;
  cat: string;
  priceLow: number;
  priceHigh: number;
  dateFrom: number | null;
  dateTo: number | null;
};

export default function FilterSheet({ 
  visible, 
  onClose,
  initialFilters,
  onApply
}: { 
  visible: boolean; 
  onClose: () => void;
  initialFilters?: Partial<FilterData>;
  onApply?: (data: FilterData) => void;
}) {
  const [kind, setKind] = useState(initialFilters?.kind || "All");
  const [cat, setCat] = useState(initialFilters?.cat || "All");
  const [priceLow, setPriceLow] = useState(initialFilters?.priceLow ?? 0);
  const [priceHigh, setPriceHigh] = useState(initialFilters?.priceHigh ?? 5000);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState<number | null>(initialFilters?.dateFrom ?? null);
  const [dateTo, setDateTo] = useState<number | null>(initialFilters?.dateTo ?? null);

  const sheetAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) Animated.spring(sheetAnim, { toValue: SH * 0.1, useNativeDriver: false, friction: 8 }).start();
    else Animated.timing(sheetAnim, { toValue: SH, duration: 250, useNativeDriver: false }).start();
  }, [visible]);

  useEffect(() => {
    if (visible && initialFilters) {
      setKind(initialFilters.kind || "All");
      setCat(initialFilters.cat || "All");
      setPriceLow(initialFilters.priceLow ?? 0);
      setPriceHigh(initialFilters.priceHigh ?? 5000);
      setDateFrom(initialFilters.dateFrom ?? null);
      setDateTo(initialFilters.dateTo ?? null);
    }
  }, [visible, initialFilters]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_e, gs) => { sheetAnim.setValue(Math.max(0, SH * 0.1 + gs.dy)); },
    onPanResponderRelease: (_e, gs) => {
      if (gs.dy < -50) Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: false }).start();
      else if (gs.dy > 150) onClose();
      else Animated.spring(sheetAnim, { toValue: SH * 0.1, useNativeDriver: false }).start();
    }
  })).current;

  const handleDay = (d: number) => {
    if (!dateFrom || (dateFrom && dateTo)) { setDateFrom(d); setDateTo(null); }
    else { d < dateFrom ? (setDateTo(dateFrom), setDateFrom(d)) : setDateTo(d); }
  };

  const handleApply = () => {
    onApply?.({ kind, cat, priceLow, priceHigh, dateFrom, dateTo });
    onClose();
  };

  const handleReset = () => {
    setKind("All");
    setCat("All");
    setPriceLow(0);
    setPriceHigh(5000);
    setDateFrom(null);
    setDateTo(null);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={FS.root}>
        <TouchableOpacity style={FS.backdrop} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={[FS.sheet, { top: sheetAnim }]}>
          <View {...pan.panHandlers} style={FS.dragArea}>
            <View style={FS.grabber} />
          </View>
          
          <View style={FS.header}>
            <TouchableOpacity onPress={onClose} style={FS.closeBtn}><Ionicons name="close" size={24} color={C.ink} /></TouchableOpacity>
            <Text style={FS.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={FS.resetTxt}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={FS.scroll}>
            
            {/* Categories */}
            <View style={FS.sec}>
              <Text style={FS.secTitle}>Categories</Text>
              <View style={FS.catGrid}>
                {["All", "Social", "Fitness", "Wellness", "Food", "Outdoor", "Activity"].map(item => {
                  const active = cat === item;
                  const icons: any = { All: "🌐", Social: "🎡", Fitness: "🏋️", Wellness: "🧘", Food: "🍴", Outdoor: "🧗", Activity: "🚴" };
                  return (
                    <TouchableOpacity key={item} onPress={() => setCat(item)} style={[FS.catPill, active && FS.catPillOn]}>
                      <Text style={FS.catIcon}>{icons[item]}</Text>
                      <Text style={[FS.catTxt, active && FS.catTxtOn]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Event Type */}
            <View style={FS.sec}>
              <Text style={FS.secTitle}>Event Type</Text>
              <View style={FS.segment}>
                {["All", "Free", "Paid", "Service"].map(k => {
                  const active = kind === k;
                  return (
                    <TouchableOpacity key={k} onPress={() => setKind(k)} style={[FS.segItem, active && FS.segItemOn]}>
                      <Text style={[FS.segTxt, active && FS.segTxtOn]}>{k}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Price Range */}
            <View style={FS.sec}>
              <View style={FS.rowBetween}>
                <Text style={FS.secTitle}>Price Range</Text>
                <View style={FS.valPill}><Text style={FS.valPillTxt}>₹{priceLow} - ₹{priceHigh === 5000 ? "5000+" : priceHigh}</Text></View>
              </View>
              <PriceSlider low={priceLow} high={priceHigh} onChange={(l, h) => { setPriceLow(l); setPriceHigh(h); }} />
            </View>

            {/* Date Range */}
            <View style={FS.sec}>
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
            <TouchableOpacity style={FS.applyBtn} onPress={handleApply}>
              <Text style={FS.applyBtnTxt}>Apply Filters</Text>
              <Ionicons name="filter" size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}


const FS = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(26,28,46,0.6)" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: C.bg, borderTopLeftRadius: 35, borderTopRightRadius: 35,
    shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 25, elevation: 25,
    overflow: "hidden"
  },
  dragArea: { width: "100%", paddingVertical: 12, alignItems: "center" },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: "#D1D9E6" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 18, fontFamily: "Outfit_700Bold", color: C.ink },
  closeBtn: { padding: 4 },
  resetTxt: { fontSize: 14, fontFamily: "Outfit_600SemiBold", color: C.muted },

  scroll: { paddingHorizontal: 20, paddingBottom: 130 },
  sec: { paddingVertical: 20, borderBottomWidth: 1.5, borderBottomColor: "#F0F3F9" },
  secTitle: { fontSize: 16, fontFamily: "Outfit_700Bold", color: C.ink },
  
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 15 },
  catPill: { 
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#E9F0FF" 
  },
  catPillOn: { backgroundColor: C.primary },
  catIcon: { fontSize: 16 },
  catTxt: { fontSize: 14, fontFamily: "Outfit_600SemiBold", color: C.ink2 },
  catTxtOn: { color: C.white },

  segment: { flexDirection: "row", backgroundColor: "#F0F3F9", borderRadius: 15, padding: 5, marginTop: 15 },
  segItem: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  segItemOn: { backgroundColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  segTxt: { fontSize: 14, fontFamily: "Outfit_600SemiBold", color: C.muted },
  segTxtOn: { color: C.white },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  valPill: { backgroundColor: "#E9EDF7", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  valPillTxt: { fontSize: 13, fontFamily: "Outfit_600SemiBold", color: C.primary },

  radiusVal: { fontSize: 13, fontFamily: "Outfit_600SemiBold", color: C.muted },
  radSlider: { height: 30, justifyContent: "center", marginTop: 10 },
  radTrack: { height: 4, backgroundColor: "#E6EAF5", borderRadius: 2 },
  radFill: { position: "absolute", height: 4, backgroundColor: C.primary, borderRadius: 2 },
  radThumb: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, borderWidth: 3, borderColor: "#FFF" },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === "ios" ? 40 : 25, paddingTop: 15, backgroundColor: "#FFF" },
  applyBtn: { 
    height: 60, borderRadius: 20, backgroundColor: C.primary,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
  },
  applyBtnTxt: { fontSize: 16, fontFamily: "Outfit_800ExtraBold", color: C.white },
});
