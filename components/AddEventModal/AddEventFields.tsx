// components/AddEventModal/AddEventFields.tsx
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Platform, ScrollView, Pressable, Modal, LayoutAnimation, StyleSheet,
  Image, Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { generateReactNativeHelpers } from "@uploadthing/expo";

const API_BASE_RAW = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
const UT_ENDPOINT = API_BASE_RAW ? `${API_BASE_RAW.replace(/\/$/, "")}/api/uploadthing` : undefined;

const { useImageUploader } = generateReactNativeHelpers({
  url: UT_ENDPOINT || "http://localhost:3000/api/uploadthing",
});

import type { Suggestion, ListingKind } from "./types";

// ─────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  inputBorder: "#E8E0D5",
  inputFocus:  "#6C5CE7",
  ink:         "#1C1A17",
  ink2:        "#3D3A34",
  muted:       "#8A8278",
  hint:        "#BCB6AD",
  teal:        "#3ECFB2",
  tealBg:      "#E8FAF7",
  tealText:    "#1A7A6A",
  coral:       "#FF6F6F",
  coralBg:     "#FFF0F0",
  coralText:   "#C0392B",
  amber:       "#F59E0B",
  amberBg:     "#FFFBEB",
  amberText:   "#92400E",
  purple:      "#6C5CE7",
  purpleBg:    "#F0EEFF",
  purpleText:  "#4C3DB5",
  pink:        "#F472B6",
  pinkBg:      "#FDF2F8",
  pinkText:    "#9D174D",
  green:       "#22C55E",
  greenBg:     "#DCFCE7",
  greenText:   "#15803D",
  greenBorder: "#86EFAC",
  error:       "#EF4444",
  stepIdle:    "#E8E0D5",
};

const R = { card: 20, input: 14, pill: 999, tile: 16 };

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const S = StyleSheet.create({
  // ── WIZARD HEADER ──
  headerWrap: {
    backgroundColor: C.card,
    borderBottomWidth: 1.5,
    borderBottomColor: C.cardBorder,
    paddingBottom: 16,
  },
  progressRow: {
    flexDirection: "row", gap: 4,
    paddingHorizontal: 18, paddingTop: 14, marginBottom: 14,
  },
  progressSeg:       { flex: 1, height: 4, borderRadius: 4, backgroundColor: C.stepIdle },
  progressSegActive: { backgroundColor: C.green },
  headerInner: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 18, gap: 12,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  stepBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill,
    backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenBorder,
    marginBottom: 8,
  },
  stepBadgeText: { fontSize: 11, fontWeight: "700", color: C.greenText, letterSpacing: 0.5 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: C.muted, fontWeight: "500", marginTop: 3, lineHeight: 19 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center", marginTop: 2,
  },

  // ── BODY ──
  body: { paddingHorizontal: 16, paddingBottom: 32, backgroundColor: C.bg },

  // ── SECTION LABEL ──
  sectionLabel: {
    fontSize: 11, fontWeight: "800", color: C.muted,
    textTransform: "uppercase", letterSpacing: 1.2,
    marginTop: 20, marginBottom: 8, paddingHorizontal: 4,
  },

  // ── CARD ──
  card: {
    backgroundColor: C.card, borderRadius: R.card,
    borderWidth: 1.5, borderColor: C.cardBorder,
    marginTop: 14, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardInner:    { padding: 18 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  cardIconBox:  { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitle:    { fontSize: 15, fontWeight: "800", color: C.ink, letterSpacing: -0.2, flex: 1 },
  cardSub:      { fontSize: 12, color: C.muted, fontWeight: "500", marginBottom: 14, marginLeft: 46 },

  // ── EVENT TYPE CARDS (Step 1) ──
  typeGrid: { flexDirection: "row", gap: 12, marginTop: 8 },
  typeCard: {
    flex: 1, borderRadius: R.card, borderWidth: 2,
    borderColor: C.cardBorder, backgroundColor: C.card,
    padding: 18, alignItems: "flex-start", position: "relative",
  },
  typeCardActiveGreen: { borderColor: C.green, backgroundColor: C.greenBg },
  typeCardActiveAmber: { borderColor: C.amber, backgroundColor: C.amberBg },
  typeCheck: {
    position: "absolute", top: 12, right: 12,
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  typeIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.inputBg, alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  typeName: { fontSize: 14, fontWeight: "800", color: C.ink, marginBottom: 5 },
  typeSub:  { fontSize: 12, color: C.muted, fontWeight: "500", lineHeight: 17 },

  // ── BANNER IMAGE ──
  bannerZone: {
    height: 180, borderRadius: R.card, overflow: "hidden",
    borderWidth: 2, borderStyle: "dashed", borderColor: C.purple + "55",
    backgroundColor: C.purpleBg, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  bannerZoneHasImage: { borderStyle: "solid", borderColor: C.purple + "88", borderWidth: 2 },
  bannerPlaceholder:  { alignItems: "center", justifyContent: "center", gap: 10 },
  bannerPlaceholderIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: C.purple + "18", borderWidth: 2, borderColor: C.purple + "33",
    alignItems: "center", justifyContent: "center",
  },
  bannerPlaceholderTitle: { fontSize: 14, fontWeight: "800", color: C.purpleText },
  bannerPlaceholderSub: {
    fontSize: 12, color: C.muted, fontWeight: "500",
    textAlign: "center", paddingHorizontal: 20,
  },
  bannerActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  bannerActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 11, borderRadius: R.pill, backgroundColor: C.purple,
    shadowColor: C.purple, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  bannerActionBtnOutline: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 11, borderRadius: R.pill,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.purple + "55",
  },
  bannerActionBtnText:        { fontSize: 13, fontWeight: "800", color: "#fff" },
  bannerActionBtnOutlineText: { fontSize: 13, fontWeight: "800", color: C.purpleText },
  bannerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.38)", alignItems: "center",
    justifyContent: "center", flexDirection: "row", gap: 12,
  },
  bannerOverlayBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 9, paddingHorizontal: 18, borderRadius: R.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)",
  },
  bannerOverlayBtnText:   { fontSize: 13, fontWeight: "800", color: "#fff" },
  bannerOverlayBtnDanger: {
    backgroundColor: "rgba(239,68,68,0.22)", borderColor: "rgba(239,68,68,0.45)",
  },
  bannerTip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 10, paddingHorizontal: 4,
  },
  bannerTipText: { fontSize: 11, color: C.muted, fontWeight: "500" },

  // ── INPUT ──
  inputShell: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: R.input, paddingHorizontal: 14, gap: 10,
  },
  textInput:   { flex: 1, fontSize: 14, fontWeight: "600", color: C.ink, paddingVertical: 13 },
  pricePrefix: { fontSize: 18, fontWeight: "900", color: C.amber },
  priceInput:  { flex: 1, fontSize: 16, fontWeight: "800", color: C.ink, paddingVertical: 13 },
  goodPill: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.pill,
    backgroundColor: C.tealBg, borderWidth: 1, borderColor: C.teal + "55",
  },
  goodPillText: { fontSize: 11, fontWeight: "800", color: C.tealText },
  helper:       { fontSize: 12, fontWeight: "700", marginTop: 6, color: C.error },
  smallLabel: {
    fontSize: 11, fontWeight: "800", color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8,
  },

  // ── QUICK PRICE TAGS ──
  priceTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  priceTag: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: R.pill, borderWidth: 1.5, borderColor: C.cardBorder,
    backgroundColor: C.card,
  },
  priceTagActive: { borderColor: C.amber, backgroundColor: C.amberBg },
  priceTagText:       { fontSize: 12, fontWeight: "700", color: C.muted },
  priceTagTextActive: { color: C.amberText, fontWeight: "800" },

  // ── SEGMENT ──
  segmented: {
    flexDirection: "row", backgroundColor: "#F5F0FF",
    borderRadius: R.input, padding: 4, gap: 3,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, alignItems: "center" },
  segmentBtnActive: {
    backgroundColor: C.card, borderWidth: 1, borderColor: "#EBE3FF",
    shadowColor: C.purple, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  segmentLabel:       { fontSize: 13, fontWeight: "800", color: C.muted },
  segmentLabelActive: { color: C.purpleText },
  segmentHint:        { fontSize: 10, fontWeight: "700", color: C.hint, marginTop: 1 },
  segmentHintActive:  { color: C.pink },

  // ── TOGGLE ROW ──
  toggleRow:    { flexDirection: "row", alignItems: "center", padding: 18 },
  toggleIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  toggleTitle:  { fontSize: 15, fontWeight: "800", color: C.ink },
  toggleSub:    { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 2 },
  chevPill: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  chevPillOpen:   { backgroundColor: C.purple, borderColor: C.purple },
  toggleContent: {
    borderTopWidth: 1.5, borderTopColor: C.cardBorder,
    padding: 18, paddingTop: 14,
  },

  // ── DESC ──
  descShell: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: R.input, padding: 14,
  },
  descInput: { fontSize: 14, fontWeight: "500", color: C.ink, minHeight: 90, lineHeight: 22 },

  // ── WHEN TILES ──
  whenGrid:           { flexDirection: "row", gap: 10 },
  whenTile: {
    flex: 1, backgroundColor: C.inputBg,
    borderWidth: 1.5, borderColor: C.inputBorder, borderRadius: R.tile, padding: 14,
  },
  whenTileTop:        { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  whenBadge:          { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  whenBadgeBlue:      { backgroundColor: "#EDE9FE" },
  whenBadgePurple:    { backgroundColor: "#FCE7F3" },
  whenTileLabel:      { fontSize: 10, fontWeight: "800", color: C.hint, textTransform: "uppercase", letterSpacing: 0.7 },
  whenTileValue:      { fontSize: 13, fontWeight: "700", color: C.ink, marginBottom: 3 },
  whenTileValueMuted: { color: C.hint },
  whenTileHint:       { fontSize: 10, color: C.hint, fontWeight: "600" },
  clearPill: {
    alignSelf: "center", marginTop: 12,
    paddingVertical: 6, paddingHorizontal: 16,
    borderRadius: R.pill, backgroundColor: C.coralBg,
    borderWidth: 1, borderColor: C.coral + "44",
  },
  clearPillText: { fontSize: 12, fontWeight: "700", color: C.coralText },

  // ── PICKER MODAL ──
  pickerOverlay: { flex: 1, backgroundColor: "rgba(28,26,23,0.5)", justifyContent: "flex-end" },
  pickerCard: {
    backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  pickerTitle:    { fontSize: 17, fontWeight: "800", color: C.ink, textAlign: "center", marginBottom: 16 },
  pickerDone: {
    marginTop: 16, paddingVertical: 14, borderRadius: R.pill,
    backgroundColor: C.purple, alignItems: "center",
    shadowColor: C.purple, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 4,
  },
  pickerDoneText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  // ── LOCATION ──
  locationInput: { flex: 1, fontSize: 14, fontWeight: "600", color: C.ink, paddingVertical: 13 },
  iconBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.inputBorder, alignItems: "center", justifyContent: "center",
  },
  iconBtnText: { fontSize: 16, color: C.muted, fontWeight: "700", lineHeight: 18 },

  // ── LOCATION OPTIONS ──
  locOptionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
  },
  locOptionDot:   { width: 10, height: 10, borderRadius: 5 },
  locOptionIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  locOptionLabel: { fontSize: 13, fontWeight: "700", color: C.ink },
  locOptionSub:   { fontSize: 11, color: C.muted, fontWeight: "500", marginTop: 1 },

  // ── DROPDOWN ──
  dropdown: {
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: R.input, marginTop: 8, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  dropdownLoading:     { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  dropdownLoadingText: { fontSize: 13, color: C.muted, fontWeight: "600" },
  dropdownRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder, gap: 10,
  },
  dropdownMain:      { fontSize: 13, fontWeight: "700", color: C.ink },
  dropdownSecondary: { fontSize: 11, color: C.muted, marginTop: 1 },

  // ── ADDRESS PILL ──
  pillSuccess: {
    flexDirection: "row", alignItems: "center",
    marginTop: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: R.input,
    backgroundColor: C.greenBg, borderWidth: 1.5, borderColor: C.greenBorder,
  },
  pillTextSuccess: { color: C.greenText, flex: 1, fontSize: 13, fontWeight: "700" },

  // ── INLINE LOADING ──
  inlineLoading: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10,
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: C.inputBg, borderRadius: R.input,
  },
  inlineLoadingText: { fontSize: 12, color: C.muted, fontWeight: "600" },

  // ── MAP ──
  mapWrap: {
    marginTop: 14, height: 170, borderRadius: R.tile, overflow: "hidden",
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.inputBorder,
  },
  map:              { flex: 1 },
  mapFallback:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, padding: 20 },
  mapFallbackTitle: { fontSize: 14, fontWeight: "800", color: C.muted, textAlign: "center" },
  mapFallbackBody:  { fontSize: 12, color: C.hint, textAlign: "center", lineHeight: 18 },
  mapOverlay:       { position: "absolute", bottom: 10, left: 0, right: 0, alignItems: "center" },
  mapOverlayPill: {
    backgroundColor: "rgba(255,255,255,0.94)", borderRadius: R.pill,
    paddingVertical: 5, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  mapOverlayText: { fontSize: 11, fontWeight: "700", color: C.muted },

  err: { fontSize: 12, fontWeight: "700", color: C.error, marginTop: 8, paddingHorizontal: 4 },

  // ── ACCESS CARDS ──
  accessCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 14, borderRadius: 16, borderWidth: 2,
    borderColor: C.inputBorder, backgroundColor: C.inputBg, marginBottom: 8,
  },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: C.hint, alignItems: "center", justifyContent: "center",
  },
  radioOuterActive: { borderColor: C.green, backgroundColor: C.green },
  radioDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  accessIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  accessTitle: { fontWeight: "800", color: C.ink, fontSize: 14 },
  accessSub:   { color: C.muted, fontWeight: "500", fontSize: 12, marginTop: 2 },
  hostBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.pill,
    backgroundColor: C.purpleBg, borderWidth: 1, borderColor: C.purple + "44",
  },
  hostBadgeText: { color: C.purpleText, fontWeight: "900", fontSize: 10 },

  // ── PREVIEW (Step 6) ──
  previewCard: {
    backgroundColor: C.card, borderRadius: R.card,
    borderWidth: 1.5, borderColor: C.cardBorder, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  previewBanner: { height: 180, backgroundColor: C.inputBg, position: "relative" },
  previewKindBadge: {
    position: "absolute", top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill,
  },
  previewKindBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  previewBody:       { padding: 18 },
  previewEventTitle: { fontSize: 22, fontWeight: "900", color: C.ink, letterSpacing: -0.4, marginBottom: 4 },
  previewEventSub:   { fontSize: 13, color: C.muted, fontWeight: "500", lineHeight: 19, marginBottom: 12 },
  previewDivider:    { height: 1.5, backgroundColor: C.cardBorder, marginVertical: 12 },
  previewDetailRow:  { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  previewDetailIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 1 },
  previewDetailLabel: { fontSize: 10, fontWeight: "700", color: C.hint, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  previewDetailVal:   { fontSize: 13, fontWeight: "700", color: C.ink, lineHeight: 18 },
  previewDetailSub:   { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 2 },
  pricePill: {
    alignSelf: "flex-start", marginTop: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: R.pill, borderWidth: 1,
  },
  pricePillText: { fontSize: 12, fontWeight: "700" },

  // ── FOOTER ACTIONS ──
  actions: {
    flexDirection: "row", gap: 10, marginTop: 20,
    paddingTop: 16, borderTopWidth: 1.5, borderTopColor: C.cardBorder,
  },
  secondaryBtn: {
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: R.pill,
    backgroundColor: "#F5F0FF", borderWidth: 1.5, borderColor: C.cardBorder,
  },
  secondaryText: { fontSize: 14, fontWeight: "800", color: C.muted },
  primaryBtn: {
    flex: 1, paddingVertical: 15, borderRadius: R.pill,
    backgroundColor: C.green, alignItems: "center", justifyContent: "center",
    shadowColor: C.green, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 14, elevation: 6,
  },
  primaryText: { fontSize: 15, fontWeight: "900", color: "#fff", letterSpacing: 0.1 },
});

// ─────────────────────────────────────────────
//  CONSTANTS + HELPERS  (unchanged)
// ─────────────────────────────────────────────
const COMMON_SLOTS = [
  "08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00",
];
const QUICK_PRICES = ["99","199","299","499","999","1499"];
const TOTAL_STEPS = 6;

function formatSlot(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh)) return t;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12  = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm || 0).padStart(2, "0")} ${ampm}`;
}
function isoToSafeDate(iso: string) {
  if (!iso) return new Date();
  return new Date(`${iso}T12:00:00`);
}
function timeToDate(time24: string) {
  const d = new Date();
  if (!time24) return d;
  const [hh, mm] = time24.split(":").map((x) => parseInt(x, 10));
  if (Number.isFinite(hh)) d.setHours(hh);
  if (Number.isFinite(mm)) d.setMinutes(mm);
  d.setSeconds(0); d.setMilliseconds(0);
  return d;
}
function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function toLocalISODate(d: Date) {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayMidday() { const d = new Date(); d.setHours(12, 0, 0, 0); return d; }
function fmtDate(iso: string) {
  if (!iso) return "Not set";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"long", year:"numeric" });
}
function fmtTime(t: string) {
  if (!t) return "";
  const [hh, mm] = t.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2,"0")} ${ampm}`;
}

// ─────────────────────────────────────────────
//  TYPES  (unchanged)
// ─────────────────────────────────────────────
type Props = {
  emoji: string; title: string; kind: ListingKind; onClose: () => void;
  setTitle: (v: string) => void; setKind: (k: ListingKind) => void;
  priceText: string; setPriceText: (v: string) => void; priceCents: number | null;
  showDetails: boolean; setShowDetails: (v: boolean) => void;
  description: string; setDescription: (v: string) => void;
  limitEnabled: boolean; setLimitEnabled: (v: boolean) => void;
  capacityText: string; setCapacityText: (v: string) => void; capacityOk: boolean;
  slots: string[]; setSlots: (v: string[]) => void;
  slotDuration: string; setSlotDuration: (v: string) => void;
  showWhen: boolean; setShowWhen: (v: boolean) => void;
  dateISO: string; setDateISO: (v: string) => void;
  time24: string; setTime24: (v: string) => void;
  dateLabel: string; timeLabel: string;
  dateOpen: boolean; setDateOpen: (v: boolean) => void;
  timeOpen: boolean; setTimeOpen: (v: boolean) => void;
  query: string; setQuery: (v: string) => void;
  suggestions: Suggestion[]; loadingSug: boolean;
  onPickSuggestion: (s: Suggestion) => void; clearQuery: () => void;
  selectedAddress: string; locLoading: boolean;
  googleKey?: string;
  mapRef: React.RefObject<WebView>;
  mapHtml: string; onMapMessage: (e: any) => void;
  err: string | null; submitting: boolean; canCreate: boolean;
  onCancel: () => void; onCreate: () => void;
  joinPolicy: "open" | "approval"; setJoinPolicy: (v: "open" | "approval") => void;
  isServiceMode?: boolean;
  bannerUri: string | null;
  setBannerUri: React.Dispatch<React.SetStateAction<string | null>>;
};

// ─────────────────────────────────────────────
//  BANNER IMAGE SECTION  (logic unchanged)
// ─────────────────────────────────────────────
function BannerImageSection({
  bannerUri, setBannerUri, accentColor,
}: {
  bannerUri: string | null;
  setBannerUri: (v: string | null) => void;
  accentColor: string;
}) {
  const [overlayVisible, setOverlayVisible] = useState(false);

  const { openImagePicker, isUploading } = useImageUploader("bannerImage", {
    headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
    onUploadBegin(fileName) { console.log("🟦 [UT][banner] Upload begin:", fileName); },
    onClientUploadComplete(res) {
      console.log("🟩 [UT][banner] Upload complete:", res);
      if (Array.isArray(res) && res.length > 0) {
        setBannerUri(res[0].url);
      }
    },
    onUploadError(e) {
      console.log("🟥 [UT][banner] Upload error:", e);
      Alert.alert("Upload Failed", e.message || "Failed to upload banner.");
    },
  });

  const handlePick = async (source: "camera" | "gallery") => {
    await openImagePicker({
      source: source === "camera" ? "camera" : "library",
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 9],
    });
    setOverlayVisible(false);
  };

  return (
    <View>
      <View style={[S.bannerZone, bannerUri ? S.bannerZoneHasImage : {}, { borderColor: accentColor + "55" }]}>
        {isUploading ? (
          <View style={S.bannerPlaceholder}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[S.bannerPlaceholderTitle, { color: accentColor }]}>Uploading banner…</Text>
          </View>
        ) : bannerUri ? (
          <>
            <Image source={{ uri: bannerUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOverlayVisible(v => !v)} />
            {overlayVisible && (
              <View style={S.bannerOverlay}>
                <Pressable style={S.bannerOverlayBtn} onPress={() => handlePick("gallery")}>
                  <Ionicons name="image-outline" size={16} color="#fff" />
                  <Text style={S.bannerOverlayBtnText}>Change</Text>
                </Pressable>
                <Pressable style={[S.bannerOverlayBtn, S.bannerOverlayBtnDanger]}
                  onPress={() => { setBannerUri(null); setOverlayVisible(false); }}>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={S.bannerOverlayBtnText}>Remove</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <View style={S.bannerPlaceholder}>
            <View style={[S.bannerPlaceholderIcon, { backgroundColor: accentColor + "18", borderColor: accentColor + "33" }]}>
              <Ionicons name="image-outline" size={28} color={accentColor} />
            </View>
            <Text style={[S.bannerPlaceholderTitle, { color: accentColor }]}>Add a cover photo</Text>
            <Text style={S.bannerPlaceholderSub}>Give your event a face — 16:9 works best</Text>
          </View>
        )}
      </View>
      {!bannerUri && !isUploading && (
        <View style={S.bannerActions}>
          <TouchableOpacity style={[S.bannerActionBtn, { backgroundColor: accentColor }]}
            onPress={() => handlePick("gallery")} activeOpacity={0.88}>
            <Ionicons name="images-outline" size={16} color="#fff" />
            <Text style={S.bannerActionBtnText}>Choose photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.bannerActionBtnOutline}
            onPress={() => handlePick("camera")} activeOpacity={0.88}>
            <Ionicons name="camera-outline" size={16} color={accentColor} />
            <Text style={[S.bannerActionBtnOutlineText, { color: accentColor }]}>Take photo</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={S.bannerTip}>
        <Ionicons name="information-circle-outline" size={13} color={C.hint} />
        <Text style={S.bannerTipText}>
          {bannerUri ? "Tap the image to edit or remove it." : "Optional — your event will still look great without one."}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
//  WIZARD HEADER  (reusable across steps)
// ─────────────────────────────────────────────
function WizardHeader({
  step, stepLabel, title, sub, onBack, onClose, showBack,
}: {
  step: number; stepLabel: string; title: string; sub: string;
  onBack: () => void; onClose: () => void; showBack: boolean;
}) {
  return (
    <View style={S.headerWrap}>
      <View style={S.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[S.progressSeg, i < step && S.progressSegActive]} />
        ))}
      </View>
      <View style={S.headerInner}>
        {showBack ? (
          <Pressable onPress={onBack} hitSlop={16} style={S.backBtn}>
            <Ionicons name="arrow-back" size={18} color={C.muted} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <View style={S.stepBadge}><Text style={S.stepBadgeText}>{stepLabel}</Text></View>
          <Text style={S.headerTitle}>{title}</Text>
          <Text style={S.headerSub}>{sub}</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={16} style={S.closeBtn}>
          <Ionicons name="close" size={18} color={C.muted} />
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
//  CONTINUE BUTTON
// ─────────────────────────────────────────────
function ContinueBtn({ label, onPress, color, disabled }: {
  label: string; onPress: () => void; color: string; disabled?: boolean;
}) {
  return (
    <View style={S.actions}>
      <TouchableOpacity
        style={[S.primaryBtn, { backgroundColor: color, opacity: disabled ? 0.45 : 1 }]}
        onPress={onPress} activeOpacity={0.92} disabled={disabled}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={S.primaryText}>{label}</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function AddEventFields(props: Props) {
  console.log("📥 PROPS bannerUri:", props.bannerUri);

  const {
    emoji, title, kind, onClose, setTitle, setKind,
    priceText, setPriceText, priceCents,
    showDetails, setShowDetails, description, setDescription,
    limitEnabled, setLimitEnabled, capacityText, setCapacityText, capacityOk,
    slots, setSlots, slotDuration, setSlotDuration,
    showWhen, setShowWhen, dateISO, setDateISO, time24, setTime24,
    dateLabel, timeLabel, dateOpen, setDateOpen, timeOpen, setTimeOpen,
    query, setQuery, suggestions, loadingSug, onPickSuggestion, clearQuery,
    selectedAddress, locLoading, googleKey, mapRef, mapHtml, onMapMessage,
    err, submitting, canCreate, onCancel, onCreate,
    joinPolicy, setJoinPolicy, isServiceMode,
    bannerUri, setBannerUri,
  } = props;

  // ── WIZARD STEP STATE ──
  const [step, setStep] = useState(1);
  const goNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setStep(s => Math.max(s - 1, 1));

  const primaryLabel = useMemo(() => {
    if (submitting) return "Publishing…";
    if (kind === "service") return "Create Service";
    if (kind === "event_paid") return "Publish Paid Event";
    return "Publish Free Event";
  }, [submitting, kind]);

  const toggleSlot = (slot: string) => {
    setSlots(slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot]);
  };

  const accent = kind === "service" ? C.purple : kind === "event_paid" ? C.amber : C.green;

  // ════════════════════════════════════════════
  //  STEP 1 — Event Type
  // ════════════════════════════════════════════
  if (step === 1) {
    return (
      <>
        <WizardHeader
          step={1} stepLabel="STEP 01"
          title="What Kind of Event?"
          sub="Choose your event type — it shapes the whole experience."
          onBack={goBack} onClose={onClose} showBack={false}
        />
        <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {!isServiceMode ? (
            <View style={S.typeGrid}>
              {/* Free */}
              <Pressable onPress={() => setKind("event_free")}
                style={[S.typeCard, kind === "event_free" && S.typeCardActiveGreen]}>
                {kind === "event_free" && (
                  <View style={[S.typeCheck, { backgroundColor: C.green }]}>
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  </View>
                )}
                <View style={[S.typeIconBox, kind === "event_free" && { backgroundColor: C.card }]}>
                  <Ionicons name="people-outline" size={26} color={kind === "event_free" ? C.green : C.muted} />
                </View>
                <Text style={S.typeName}>Free Event</Text>
                <Text style={S.typeSub}>Open to everyone. Community vibes, zero cost.</Text>
              </Pressable>
              {/* Paid */}
              <Pressable onPress={() => setKind("event_paid")}
                style={[S.typeCard, kind === "event_paid" && S.typeCardActiveAmber]}>
                {kind === "event_paid" && (
                  <View style={[S.typeCheck, { backgroundColor: C.amber }]}>
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  </View>
                )}
                <View style={[S.typeIconBox, kind === "event_paid" && { backgroundColor: C.card }]}>
                  <Ionicons name="ticket-outline" size={26} color={kind === "event_paid" ? C.amber : C.muted} />
                </View>
                <Text style={S.typeName}>Paid Event</Text>
                <Text style={S.typeSub}>Charge a ticket price. You earn, they experience.</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[S.goodPill, { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 16, marginTop: 8 }]}>
              <Text style={[S.goodPillText, { fontSize: 13 }]}>Professional Service Mode</Text>
            </View>
          )}
          <ContinueBtn label="Continue" onPress={goNext} color={accent} />
        </ScrollView>
      </>
    );
  }

  // ════════════════════════════════════════════
  //  STEP 2 — Cover Photo + Event Title
  // ════════════════════════════════════════════
  if (step === 2) {
    return (
      <>
        <WizardHeader
          step={2} stepLabel="STEP 02"
          title="Name your Event"
          sub="Give it a title that makes people stop scrolling."
          onBack={goBack} onClose={onClose} showBack
        />
        <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={S.body}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Cover photo */}
          <Text style={S.sectionLabel}>Cover photo</Text>
          <View style={[S.card, { overflow: "visible" }]}>
            <View style={S.cardInner}>
              <View style={S.cardTitleRow}>
                <View style={[S.cardIconBox, { backgroundColor: C.greenBg }]}>
                  <Ionicons name="image-outline" size={18} color={C.green} />
                </View>
                <Text style={S.cardTitle}>Event banner</Text>
              </View>
              <Text style={S.cardSub}>A great cover photo makes your event stand out on the map.</Text>
              <BannerImageSection bannerUri={bannerUri} setBannerUri={setBannerUri} accentColor={accent} />
            </View>
          </View>

          {/* Title */}
          <Text style={S.sectionLabel}>Event title</Text>
          <View style={S.card}>
            <View style={S.cardInner}>
              <View style={S.cardTitleRow}>
                <View style={[S.cardIconBox, { backgroundColor: kind === "service" ? C.purpleBg : C.greenBg }]}>
                  <Ionicons name={kind === "service" ? "construct-outline" : "create-outline"} size={18}
                    color={kind === "service" ? C.purple : C.green} />
                </View>
                <Text style={S.cardTitle}>{kind === "service" ? "Name your service" : "Name your event"}</Text>
              </View>
              <View style={S.inputShell}>
                <Ionicons name="pencil-outline" size={16} color={C.hint} />
                <TextInput
                  value={title} onChangeText={setTitle}
                  placeholder={kind === "service" ? "e.g., Yoga session, Photography" : "e.g., Saturday coffee meetup"}
                  placeholderTextColor={C.hint} style={S.textInput} returnKeyType="done"
                />
              </View>
            </View>
          </View>

          <ContinueBtn label="Continue" onPress={goNext} color={accent} disabled={!title.trim()} />
        </ScrollView>
      </>
    );
  }

  // ════════════════════════════════════════════
  //  STEP 3 — Date & Time
  // ════════════════════════════════════════════
  if (step === 3) {
    return (
      <>
        <WizardHeader
          step={3} stepLabel="STEP 03"
          title="Pick a Date & Time"
          sub="When's the party? Set it in stone."
          onBack={goBack} onClose={onClose} showBack
        />
        <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={S.body} showsVerticalScrollIndicator={false}>

          <Text style={S.sectionLabel}>When</Text>
          <View style={S.card}>
            <Pressable
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowWhen(!showWhen);
              }}
              style={S.toggleRow}
            >
              <View style={[S.toggleIconBox, { backgroundColor: C.amberBg }]}>
                <Ionicons name="calendar-outline" size={18} color={C.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.toggleTitle}>Date &amp; time</Text>
                <Text style={S.toggleSub}>{showWhen ? "Tap to hide" : "When does it start?"}</Text>
              </View>
              <View style={[S.chevPill, showWhen && S.chevPillOpen]}>
                <Ionicons name={showWhen ? "remove-outline" : "add-outline"} size={14}
                  color={showWhen ? "#fff" : C.muted} />
              </View>
            </Pressable>

            {showWhen && (
              <View style={S.toggleContent}>
                <View style={S.whenGrid}>
                  <Pressable
                    onPress={() => { if (!dateISO) setDateISO(toLocalISODate(new Date())); setDateOpen(true); }}
                    style={[S.whenTile, dateISO ? { borderColor: C.purple + "88", backgroundColor: C.purpleBg } : {}]}
                  >
                    <View style={S.whenTileTop}>
                      <View style={[S.whenBadge, S.whenBadgeBlue]}>
                        <Ionicons name="calendar-outline" size={14} color={C.purple} />
                      </View>
                      <Text style={S.whenTileLabel}>Date</Text>
                    </View>
                    <Text numberOfLines={1} style={[S.whenTileValue, !dateISO && S.whenTileValueMuted]}>
                      {dateISO ? dateLabel : "Tap to set"}
                    </Text>
                    <Text style={S.whenTileHint}>Tap to choose</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setTimeOpen(true)}
                    style={[S.whenTile, time24 ? { borderColor: C.pink + "88", backgroundColor: C.pinkBg } : {}]}
                  >
                    <View style={S.whenTileTop}>
                      <View style={[S.whenBadge, S.whenBadgePurple]}>
                        <Ionicons name="time-outline" size={14} color={C.pink} />
                      </View>
                      <Text style={S.whenTileLabel}>Time</Text>
                    </View>
                    <Text numberOfLines={1} style={[S.whenTileValue, !time24 && S.whenTileValueMuted]}>
                      {time24 ? timeLabel : "Tap to set"}
                    </Text>
                    <Text style={S.whenTileHint}>Tap to choose</Text>
                  </Pressable>
                </View>
                {(dateISO || time24) && (
                  <Pressable hitSlop={10} onPress={() => { setDateISO(""); setTime24(""); }} style={S.clearPill}>
                    <Text style={S.clearPillText}>Clear date / time</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Service slots */}
          {kind === "service" && (
            <>
              <Text style={S.sectionLabel}>Schedule</Text>
              <View style={S.card}>
                <View style={S.cardInner}>
                  <View style={S.cardTitleRow}>
                    <View style={[S.cardIconBox, { backgroundColor: C.purpleBg }]}>
                      <Ionicons name="calendar-outline" size={18} color={C.purple} />
                    </View>
                    <Text style={S.cardTitle}>Available Slots</Text>
                  </View>
                  <Text style={S.cardSub}>Pick the time slots you offer.</Text>
                  <Text style={S.smallLabel}>Duration per slot</Text>
                  <View style={[S.segmented, { marginBottom: 16 }]}>
                    {["30","45","60","90","120"].map(d => (
                      <Pressable key={d} onPress={() => setSlotDuration(d)}
                        style={[S.segmentBtn, slotDuration === d && S.segmentBtnActive]}>
                        <Text style={[S.segmentLabel, slotDuration === d && S.segmentLabelActive]}>{d}</Text>
                        <Text style={[S.segmentHint, slotDuration === d && S.segmentHintActive]}>min</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={S.smallLabel}>Available times</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                    {COMMON_SLOTS.map(slot => {
                      const on = slots.includes(slot);
                      return (
                        <TouchableOpacity key={slot} onPress={() => toggleSlot(slot)} activeOpacity={0.8}
                          style={{
                            paddingVertical: 8, paddingHorizontal: 12, borderRadius: R.pill,
                            backgroundColor: on ? C.purpleBg : C.inputBg,
                            borderWidth: 1.5, borderColor: on ? C.purple + "88" : C.inputBorder,
                          }}>
                          <Text style={{ fontSize: 12, fontWeight: "800", color: on ? C.purpleText : C.muted }}>
                            {formatSlot(slot)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {slots.length > 0 && (
                    <View style={[S.goodPill, { alignSelf: "flex-start", marginTop: 12 }]}>
                      <Text style={S.goodPillText}>{slots.length} slots selected</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          <ContinueBtn label="Continue" onPress={goNext} color={accent} />
        </ScrollView>

        {/* Date Modal */}
        <Modal transparent visible={dateOpen} animationType="slide" onRequestClose={() => setDateOpen(false)}>
          <Pressable style={S.pickerOverlay} onPress={() => setDateOpen(false)}>
            <Pressable style={S.pickerCard} onPress={() => {}}>
              <Text style={S.pickerTitle}>Pick a date</Text>
              <DateTimePicker
                value={dateISO ? isoToSafeDate(dateISO) : todayMidday()}
                mode="date" display={Platform.OS === "ios" ? "inline" : "default"}
                themeVariant="light" minimumDate={startOfToday()}
                onChange={(_, d) => {
                  if (!d) return;
                  const chosen = new Date(d); chosen.setHours(12, 0, 0, 0);
                  if (chosen.getTime() < startOfToday().getTime()) return;
                  setDateISO(toLocalISODate(chosen));
                  if (Platform.OS !== "ios") setDateOpen(false);
                }}
              />
              <TouchableOpacity style={S.pickerDone} onPress={() => setDateOpen(false)} activeOpacity={0.9}>
                <Text style={S.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Time Modal */}
        <Modal transparent visible={timeOpen} animationType="slide" onRequestClose={() => setTimeOpen(false)}>
          <Pressable style={S.pickerOverlay} onPress={() => setTimeOpen(false)}>
            <Pressable style={S.pickerCard} onPress={() => {}}>
              <Text style={S.pickerTitle}>Pick a time</Text>
              <DateTimePicker
                value={timeToDate(time24)} mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"} themeVariant="light"
                onChange={(_, d) => {
                  if (!d) return;
                  setTime24(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`);
                  if (Platform.OS !== "ios") setTimeOpen(false);
                }}
              />
              <TouchableOpacity style={S.pickerDone} onPress={() => setTimeOpen(false)} activeOpacity={0.9}>
                <Text style={S.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  // ════════════════════════════════════════════
  //  STEP 4 — Location
  // ════════════════════════════════════════════
  if (step === 4) {
    return (
      <>
        <WizardHeader
          step={4} stepLabel="STEP 04"
          title="Where's it happening?"
          sub="Pin your event on the map."
          onBack={goBack} onClose={onClose} showBack
        />
        <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={S.body}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Text style={S.sectionLabel}>Location</Text>
          <View style={S.card}>
            <View style={S.cardInner}>
              <View style={S.cardTitleRow}>
                <View style={[S.cardIconBox, { backgroundColor: C.coralBg }]}>
                  <Ionicons name="location-outline" size={18} color={C.coral} />
                </View>
                <Text style={S.cardTitle}>Where is it?</Text>
              </View>
              <Text style={S.cardSub}>Search a place or drop a pin on the map.</Text>

              {/* Search */}
              <View style={S.inputShell}>
                <Ionicons name="search-outline" size={16} color={C.hint} />
                <TextInput
                  value={query} onChangeText={setQuery}
                  placeholder="Search address or venue" placeholderTextColor={C.hint}
                  style={S.locationInput} returnKeyType="search"
                />
                {!!query && (
                  <Pressable hitSlop={12} onPress={clearQuery} style={S.iconBtn}>
                    <Text style={S.iconBtnText}>×</Text>
                  </Pressable>
                )}
              </View>

              {/* Location quick options (when no query) */}
              {!query && (
                <View style={{ marginTop: 12, borderRadius: R.input, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder }}>
                  {[
                    { id: "current", label: "Current Location", sub: "", dotColor: "#EF4444", icon: null },
                    { id: "venue",   label: "Choose a Venue",   sub: "Search a specific Place", iconName: "business-outline" as const, iconBg: C.tealBg,   iconColor: C.teal },
                    { id: "online",  label: "Online / Virtual", sub: "",                        iconName: "laptop-outline" as const,   iconBg: C.purpleBg, iconColor: C.purple },
                    { id: "custom",  label: "Custom Address",   sub: "Type your own address",   iconName: "pencil-outline" as const,   iconBg: C.amberBg,  iconColor: C.amber },
                  ].map((opt, idx, arr) => (
                    <View key={opt.id}
                      style={[S.locOptionRow, idx === arr.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                      {opt.id === "current" ? (
                        <View style={[S.locOptionDot, { backgroundColor: opt.dotColor }]} />
                      ) : (
                        <View style={[S.locOptionIcon, { backgroundColor: (opt as any).iconBg }]}>
                          <Ionicons name={(opt as any).iconName} size={15} color={(opt as any).iconColor} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={S.locOptionLabel}>{opt.label}</Text>
                        {!!opt.sub && <Text style={S.locOptionSub}>{opt.sub}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={C.hint} />
                    </View>
                  ))}
                </View>
              )}

              {/* Suggestions dropdown */}
              {(loadingSug || suggestions.length > 0) && (
                <View style={S.dropdown}>
                  {loadingSug ? (
                    <View style={S.dropdownLoading}>
                      <ActivityIndicator color={accent} />
                      <Text style={S.dropdownLoadingText}>Searching…</Text>
                    </View>
                  ) : (
                    <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                      {suggestions.map(s => (
                        <TouchableOpacity key={s.id} activeOpacity={0.85} onPress={() => onPickSuggestion(s)} style={S.dropdownRow}>
                          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: C.greenBg, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="location-outline" size={15} color={C.green} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={S.dropdownMain}>{s.main}</Text>
                            {!!s.secondary && <Text numberOfLines={1} style={S.dropdownSecondary}>{s.secondary}</Text>}
                          </View>
                          <Ionicons name="chevron-forward" size={14} color={C.hint} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              {!!selectedAddress && (
                <View style={S.pillSuccess}>
                  <Ionicons name="checkmark-circle" size={16} color={C.green} style={{ marginRight: 8 }} />
                  <Text numberOfLines={1} style={S.pillTextSuccess}>{selectedAddress}</Text>
                </View>
              )}
              {locLoading && (
                <View style={S.inlineLoading}>
                  <ActivityIndicator color={accent} size="small" />
                  <Text style={S.inlineLoadingText}>Resolving address…</Text>
                </View>
              )}

              <View style={S.mapWrap}>
                {!googleKey ? (
                  <View style={S.mapFallback}>
                    <Ionicons name="map-outline" size={32} color={C.muted} />
                    <Text style={S.mapFallbackTitle}>Google Maps key missing</Text>
                    <Text style={S.mapFallbackBody}>
                      Add <Text style={{ fontWeight: "900" }}>extra.googleMapsKey</Text> in app config.
                    </Text>
                  </View>
                ) : (
                  <>
                    <WebView ref={mapRef} style={S.map} originWhitelist={["*"]}
                      javaScriptEnabled domStorageEnabled
                      source={{ html: mapHtml, baseUrl: "https://localhost" }}
                      onMessage={onMapMessage}
                    />
                    <View pointerEvents="none" style={S.mapOverlay}>
                      <View style={S.mapOverlayPill}>
                        <Text style={S.mapOverlayText}>Tap / drag pin to choose location</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
              {!!err && <Text style={S.err}>{err}</Text>}
            </View>
          </View>

          <ContinueBtn label="Continue" onPress={goNext} color={accent} />
        </ScrollView>
      </>
    );
  }

  // ════════════════════════════════════════════
  //  STEP 5 — Price / Attendance / Access
  // ════════════════════════════════════════════
  if (step === 5) {
    return (
      <>
        <WizardHeader
          step={5} stepLabel="STEP 05"
          title={kind === "event_paid" ? "What's the price" : "Attendance & Access"}
          sub={kind === "event_paid" ? "Set the ticket price for your event." : "Control who can join your event."}
          onBack={goBack} onClose={onClose} showBack
        />
        <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={S.body}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Price (paid events) */}
          {(kind === "event_paid" || kind === "service") && (
            <>
              <Text style={S.sectionLabel}>Price {kind === "event_paid" ? "• ticket" : "• per slot"}</Text>
              <View style={S.card}>
                <View style={S.cardInner}>
                  <View style={S.cardTitleRow}>
                    <View style={[S.cardIconBox, { backgroundColor: C.amberBg }]}>
                      <Ionicons name="pricetag-outline" size={18} color={C.amber} />
                    </View>
                    <Text style={S.cardTitle}>Ticket Price</Text>
                  </View>
                  <View style={S.inputShell}>
                    <Text style={S.pricePrefix}>₹</Text>
                    <TextInput
                      value={priceText} onChangeText={setPriceText}
                      placeholder={kind === "event_paid" ? "299" : "500"}
                      placeholderTextColor={C.hint}
                      keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
                      style={S.priceInput}
                    />
                    {priceCents !== null && (
                      <View style={S.goodPill}><Text style={S.goodPillText}>Set</Text></View>
                    )}
                  </View>
                  {/* Quick price tags */}
                  <View style={S.priceTagRow}>
                    {QUICK_PRICES.map(p => {
                      const active = priceText === p;
                      return (
                        <TouchableOpacity key={p} onPress={() => setPriceText(p)}
                          style={[S.priceTag, active && S.priceTagActive]} activeOpacity={0.8}>
                          <Text style={[S.priceTagText, active && S.priceTagTextActive]}>₹{p}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {priceText.length > 0 && priceCents === null && (
                    <Text style={S.helper}>Enter a valid price greater than 0.</Text>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Attendance (free events) */}
          {kind === "event_free" && (
            <>
              <Text style={S.sectionLabel}>Attendance</Text>
              <View style={S.card}>
                <View style={S.cardInner}>
                  <View style={S.cardTitleRow}>
                    <View style={[S.cardIconBox, { backgroundColor: C.tealBg }]}>
                      <Ionicons name="people-outline" size={18} color={C.teal} />
                    </View>
                    <Text style={S.cardTitle}>Who can come?</Text>
                  </View>
                  <Text style={S.cardSub}>Keep it open or cap the headcount.</Text>
                  <View style={S.segmented}>
                    <SegmentButton label="Open"  hint="Unlimited" active={!limitEnabled} onPress={() => setLimitEnabled(false)} />
                    <SegmentButton label="Limit" hint="Set max"   active={limitEnabled}  onPress={() => setLimitEnabled(true)} />
                  </View>
                  {limitEnabled && (
                    <View style={{ marginTop: 14 }}>
                      <Text style={S.smallLabel}>Max people</Text>
                      <View style={S.inputShell}>
                        <Ionicons name="people-outline" size={16} color={C.hint} />
                        <TextInput
                          value={capacityText} onChangeText={setCapacityText}
                          placeholder="e.g., 20" placeholderTextColor={C.hint}
                          keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
                          style={S.textInput}
                        />
                      </View>
                      {!capacityOk && capacityText.length > 0 && (
                        <Text style={S.helper}>Enter a valid number greater than 0.</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Description */}
          <Text style={S.sectionLabel}>Details (optional)</Text>
          <View style={S.card}>
            <Pressable
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowDetails(!showDetails);
              }}
              style={S.toggleRow}
            >
              <View style={[S.toggleIconBox, { backgroundColor: C.purpleBg }]}>
                <Ionicons name="document-text-outline" size={18} color={C.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.toggleTitle}>Description</Text>
                <Text style={S.toggleSub}>{showDetails ? "Tap to hide" : "Add agenda, rules, what to bring…"}</Text>
              </View>
              <View style={[S.chevPill, showDetails && S.chevPillOpen]}>
                <Ionicons name={showDetails ? "remove-outline" : "add-outline"} size={14}
                  color={showDetails ? "#fff" : C.muted} />
              </View>
            </Pressable>
            {showDetails && (
              <View style={S.toggleContent}>
                <View style={S.descShell}>
                  <TextInput
                    value={description} onChangeText={setDescription}
                    placeholder="Meetup point, what to bring, dress code, links…"
                    placeholderTextColor={C.hint} multiline textAlignVertical="top"
                    style={S.descInput} returnKeyType="default"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Access */}
          {kind !== "service" && (
            <>
              <Text style={S.sectionLabel}>Access</Text>
              <View style={S.card}>
                <View style={S.cardInner}>
                  <View style={S.cardTitleRow}>
                    <View style={[S.cardIconBox, { backgroundColor: C.greenBg }]}>
                      <Ionicons name="shield-checkmark-outline" size={18} color={C.green} />
                    </View>
                    <Text style={S.cardTitle}>Who can join?</Text>
                  </View>
                  <Text style={S.cardSub}>Control how people get into your event.</Text>
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <TouchableOpacity onPress={() => setJoinPolicy("open")} activeOpacity={0.85}
                      style={[S.accessCard, joinPolicy === "open" && { borderColor: C.green, backgroundColor: C.greenBg }]}>
                      <View style={[S.radioOuter, joinPolicy === "open" && S.radioOuterActive]}>
                        {joinPolicy === "open" && <View style={S.radioDot} />}
                      </View>
                      <View style={[S.accessIconBox, { backgroundColor: joinPolicy === "open" ? C.card : C.inputBg }]}>
                        <Ionicons name="globe-outline" size={18} color={joinPolicy === "open" ? C.green : C.muted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.accessTitle}>Anyone — direct join</Text>
                        <Text style={S.accessSub}>People join instantly, no approval needed</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setJoinPolicy("approval")} activeOpacity={0.85}
                      style={[S.accessCard, joinPolicy === "approval" && { borderColor: C.purple, backgroundColor: C.purpleBg }]}>
                      <View style={[S.radioOuter, joinPolicy === "approval" && { borderColor: C.purple, backgroundColor: C.purple }]}>
                        {joinPolicy === "approval" && <View style={S.radioDot} />}
                      </View>
                      <View style={[S.accessIconBox, { backgroundColor: joinPolicy === "approval" ? C.card : C.inputBg }]}>
                        <Ionicons name="checkmark-done-outline" size={18} color={joinPolicy === "approval" ? C.purple : C.muted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.accessTitle}>Approval required</Text>
                        <Text style={S.accessSub}>You review and approve each request</Text>
                      </View>
                      <View style={S.hostBadge}><Text style={S.hostBadgeText}>HOST</Text></View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}

          <ContinueBtn label="Continue" onPress={goNext} color={accent} />
        </ScrollView>
      </>
    );
  }

  // ════════════════════════════════════════════
  //  STEP 6 — Preview & Publish
  // ════════════════════════════════════════════
  const timeStr = time24 ? `${fmtTime(time24)}` : "Time not set";

  return (
    <>
      <WizardHeader
        step={6} stepLabel="STEP 06 • FINAL"
        title="Preview"
        sub="Review everything before publishing. You can always edit later."
        onBack={goBack} onClose={onClose} showBack
      />
      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={S.body} showsVerticalScrollIndicator={false}>

        <Text style={S.sectionLabel}>Your event</Text>
        <View style={S.previewCard}>
          {/* Banner */}
          <View style={S.previewBanner}>
            {bannerUri ? (
              <Image source={{ uri: bannerUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View style={[S.mapFallback, { backgroundColor: C.inputBg }]}>
                <Ionicons name="image-outline" size={32} color={C.hint} />
                <Text style={{ fontSize: 13, color: C.hint, fontWeight: "600" }}>No cover photo</Text>
              </View>
            )}
            <View style={[S.previewKindBadge, { backgroundColor: accent }]}>
              <Text style={S.previewKindBadgeText}>
                {kind === "service" ? "Service" : kind === "event_paid" ? "Paid" : "Free"}
              </Text>
            </View>
          </View>

          <View style={S.previewBody}>
            <Text style={S.previewEventTitle}>{title || "Untitled Event"}</Text>
            {!!description && <Text style={S.previewEventSub} numberOfLines={2}>{description}</Text>}
            <View style={S.previewDivider} />

            {/* Date & time */}
            <View style={S.previewDetailRow}>
              <View style={[S.previewDetailIcon, { backgroundColor: C.amberBg }]}>
                <Ionicons name="calendar-outline" size={16} color={C.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.previewDetailLabel}>Date & Time</Text>
                <Text style={S.previewDetailVal}>{dateISO ? fmtDate(dateISO) : "Date not set"}</Text>
                <Text style={S.previewDetailSub}>{timeStr}</Text>
              </View>
            </View>

            {/* Location */}
            <View style={S.previewDetailRow}>
              <View style={[S.previewDetailIcon, { backgroundColor: C.coralBg }]}>
                <Ionicons name="location-outline" size={16} color={C.coral} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.previewDetailLabel}>Location</Text>
                <Text style={S.previewDetailVal} numberOfLines={2}>
                  {selectedAddress || "Location not set"}
                </Text>
              </View>
            </View>

            {/* Price */}
            {(kind === "event_paid" || kind === "service") && !!priceText && (
              <View style={S.previewDetailRow}>
                <View style={[S.previewDetailIcon, { backgroundColor: C.amberBg }]}>
                  <Ionicons name="pricetag-outline" size={16} color={C.amber} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.previewDetailLabel}>Price</Text>
                  <View style={[S.pricePill, { backgroundColor: C.amberBg, borderColor: C.amber + "55" }]}>
                    <Text style={[S.pricePillText, { color: C.amberText }]}>₹{priceText} • Single Entry</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Access */}
            {kind !== "service" && (
              <View style={[S.previewDetailRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
                <View style={[S.previewDetailIcon, { backgroundColor: C.purpleBg }]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={C.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.previewDetailLabel}>Access</Text>
                  <Text style={S.previewDetailVal}>
                    {joinPolicy === "open" ? "Anyone — direct join" : "Approval required"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Cancel + Publish */}
        <View style={S.actions}>
          <TouchableOpacity style={S.secondaryBtn} onPress={onCancel} activeOpacity={0.9}>
            <Text style={S.secondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.primaryBtn, { backgroundColor: accent }, !canCreate && { opacity: 0.45 }]}
            onPress={onCreate} activeOpacity={0.92} disabled={!canCreate}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="rocket-outline" size={16} color="#fff" />
                <Text style={S.primaryText}>{primaryLabel}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </>
  );
}

// ─────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────
function SegmentButton({ label, hint, active, onPress }: {
  label: string; hint?: string; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[S.segmentBtn, active && S.segmentBtnActive]}>
      <Text style={[S.segmentLabel, active && S.segmentLabelActive]}>{label}</Text>
      {!!hint && <Text style={[S.segmentHint, active && S.segmentHintActive]}>{hint}</Text>}
    </Pressable>
  );
} 