// components/AddEventModal/AddEventFields.tsx
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Platform, ScrollView, Pressable, Modal, LayoutAnimation, StyleSheet,
  Image, Alert, KeyboardAvoidingView, Keyboard,
} from "react-native";
import { WebView } from "react-native-webview";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { CropModal } from "./CropModal";

const API_BASE_RAW = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

import type { Suggestion, ListingKind } from "./types";

// ─────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  cardBorder: "#F1F5F9",
  inputBg: "#F8FAFC",
  inputBorder: "#E2E8F0",
  inputFocus: "#6366F1",
  ink: "#0F172A",
  ink2: "#334155",
  muted: "#64748B",
  hint: "#94A3B8",
  teal: "#14B8A6",
  tealBg: "#F0FDFA",
  tealText: "#0D9488",
  coral: "#F43F5E",
  coralBg: "#FFF1F2",
  coralText: "#E11D48",
  amber: "#F59E0B",
  amberBg: "#FFFBEB",
  amberText: "#D97706",
  purple: "#6366F1",
  purpleBg: "#EEF2FF",
  purpleText: "#4F46E5",
  purpleBorder: "#C7D2FE",
  pink: "#EC4899",
  pinkBg: "#FDF2F8",
  green: "#10B981",
  greenBg: "#ECFDF5",
  greenText: "#059669",
  greenBorder: "#A7F3D0",
  error: "#EF4444",
  stepIdle: "#E2E8F0",
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
  progressSeg: { flex: 1, height: 4, borderRadius: 4, backgroundColor: C.stepIdle },
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
  headerSub: { fontSize: 13, color: C.muted, fontWeight: "500", marginTop: 3, lineHeight: 19 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  errorMsg: {
    color: C.error,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    marginLeft: 4,
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
  cardInner: { padding: 18 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  cardIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: C.ink, letterSpacing: -0.2, flex: 1 },
  cardSub: { fontSize: 12, color: C.muted, fontWeight: "500", marginBottom: 14, marginLeft: 46 },

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
  typeSub: { fontSize: 12, color: C.muted, fontWeight: "500", lineHeight: 17 },

  // ── BANNER IMAGE ──
  bannerZone: {
    height: 180, borderRadius: R.card, overflow: "hidden",
    borderWidth: 2, borderStyle: "dashed", borderColor: C.purple + "55",
    backgroundColor: C.purpleBg, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  bannerZoneHasImage: { borderStyle: "solid", borderColor: C.purple + "88", borderWidth: 2 },
  bannerPlaceholder: { alignItems: "center", justifyContent: "center", gap: 10 },
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
  bannerActionBtnText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  bannerActionBtnOutlineText: { fontSize: 13, fontWeight: "800", color: C.purpleText },
  bannerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(15,23,42,0.5)", alignItems: "center",
    justifyContent: "center", flexDirection: "row", gap: 8, padding: 10,
  },
  bannerOverlayBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: R.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.2, borderColor: "rgba(255,255,255,0.4)",
  },
  bannerOverlayBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  bannerOverlayBtnDanger: {
    backgroundColor: "rgba(239,68,68,0.3)", borderColor: "rgba(239,68,68,0.5)",
  },
  bannerTip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 10, paddingHorizontal: 4,
  },
  bannerTipText: { fontSize: 11, color: C.muted, fontWeight: "500" },

  // ── FULL SCREEN PREVIEW ──
  fullScreenContainer: {
    flex: 1, backgroundColor: "#000",
    alignItems: "center", justifyContent: "center",
  },
  fullScreenImage: { width: "100%", height: "100%" },
  fullScreenClose: {
    position: "absolute", top: 50, right: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  fullScreenActions: {
    position: "absolute", bottom: 50,
    flexDirection: "row", gap: 16,
  },
  fullScreenBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.purple, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 30, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10,
    elevation: 10,
  },
  fullScreenBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  // ── INPUT ──
  inputShell: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: R.input, paddingHorizontal: 14, gap: 10,
  },
  textInput: { flex: 1, fontSize: 14, fontWeight: "600", color: C.ink, paddingVertical: 13 },
  pricePrefix: { fontSize: 18, fontWeight: "900", color: C.amber },
  priceInput: { flex: 1, fontSize: 16, fontWeight: "800", color: C.ink, paddingVertical: 13 },
  goodPill: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: R.pill,
    backgroundColor: C.tealBg, borderWidth: 1, borderColor: C.teal + "55",
  },
  goodPillText: { fontSize: 11, fontWeight: "800", color: C.tealText },
  helper: { fontSize: 12, fontWeight: "700", marginTop: 6, color: C.error },
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
  priceTagText: { fontSize: 12, fontWeight: "700", color: C.muted },
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
  segmentLabel: { fontSize: 13, fontWeight: "800", color: C.muted },
  segmentLabelActive: { color: C.purpleText },
  segmentHint: { fontSize: 10, fontWeight: "700", color: C.hint, marginTop: 1 },
  segmentHintActive: { color: C.pink },

  // ── TOGGLE ROW ──
  toggleRow: { flexDirection: "row", alignItems: "center", padding: 18 },
  toggleIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  toggleTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
  toggleSub: { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 2 },
  chevPill: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  chevPillOpen: { backgroundColor: C.purple, borderColor: C.purple },
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
  whenGrid: { flexDirection: "row", gap: 10 },
  whenTile: {
    flex: 1, backgroundColor: C.inputBg,
    borderWidth: 1.5, borderColor: C.inputBorder, borderRadius: R.tile, padding: 14,
  },
  whenTileTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  whenBadge: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  whenBadgeBlue: { backgroundColor: "#EDE9FE" },
  whenBadgePurple: { backgroundColor: "#FCE7F3" },
  whenTileLabel: { fontSize: 10, fontWeight: "800", color: C.hint, textTransform: "uppercase", letterSpacing: 0.7 },
  whenTileValue: { fontSize: 13, fontWeight: "700", color: C.ink, marginBottom: 3 },
  whenTileValueMuted: { color: C.hint },
  whenTileHint: { fontSize: 10, color: C.hint, fontWeight: "600" },
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
  pickerTitle: { fontSize: 17, fontWeight: "800", color: C.ink, textAlign: "center", marginBottom: 16 },
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
  locOptionDot: { width: 10, height: 10, borderRadius: 5 },
  locOptionIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  locOptionLabel: { fontSize: 13, fontWeight: "700", color: C.ink },
  locOptionSub: { fontSize: 11, color: C.muted, fontWeight: "500", marginTop: 1 },

  // ── DROPDOWN ──
  dropdown: {
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: R.input, marginTop: 8, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  dropdownLoading: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  dropdownLoadingText: { fontSize: 13, color: C.muted, fontWeight: "600" },
  dropdownRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder, gap: 10,
  },
  dropdownMain: { fontSize: 13, fontWeight: "700", color: C.ink },
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
  map: { flex: 1 },
  mapFallback: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, padding: 20 },
  mapFallbackTitle: { fontSize: 14, fontWeight: "800", color: C.muted, textAlign: "center" },
  mapFallbackBody: { fontSize: 12, color: C.hint, textAlign: "center", lineHeight: 18 },
  mapOverlay: { position: "absolute", bottom: 10, left: 0, right: 0, alignItems: "center" },
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
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  accessIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  accessTitle: { fontWeight: "800", color: C.ink, fontSize: 14 },
  accessSub: { color: C.muted, fontWeight: "500", fontSize: 12, marginTop: 2 },
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
  previewBody: { padding: 18 },
  previewEventTitle: { fontSize: 22, fontWeight: "900", color: C.ink, letterSpacing: -0.4, marginBottom: 4 },
  previewEventSub: { fontSize: 13, color: C.muted, fontWeight: "500", lineHeight: 19, marginBottom: 12 },
  previewDivider: { height: 1.5, backgroundColor: C.cardBorder, marginVertical: 12 },
  previewDetailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  previewDetailIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 1 },
  previewDetailLabel: { fontSize: 10, fontWeight: "700", color: C.hint, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  previewDetailVal: { fontSize: 13, fontWeight: "700", color: C.ink, lineHeight: 18 },
  previewDetailSub: { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 2 },
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

  // Step 1 Premium Vertical Cards
  step1Card: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: C.cardBorder,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#0B1220",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  step1CardActiveGreen: { borderColor: C.green, backgroundColor: C.greenBg },
  step1CardActivePurple: { borderColor: C.purple, backgroundColor: C.purpleBg },
  step1IconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: C.inputBg,
    alignItems: "center", justifyContent: "center",
  },
  step1TextContent: { flex: 1 },
  step1Name: { fontSize: 17, fontWeight: "900", color: C.ink },
  step1Sub: { fontSize: 13, color: C.muted, fontWeight: "600", marginTop: 4, lineHeight: 18 },
  step1Check: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
});

// ─────────────────────────────────────────────
//  CONSTANTS + HELPERS  (unchanged)
// ─────────────────────────────────────────────
const COMMON_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];
const QUICK_PRICES = ["99", "199", "299", "499", "999", "1499"];
const TOTAL_STEPS = 6;

function formatSlot(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh)) return t;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayMidday() { const d = new Date(); d.setHours(12, 0, 0, 0); return d; }
function fmtDate(iso: string) {
  if (!iso) return "Not set";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}
function fmtTime(t: string) {
  if (!t) return "";
  const [hh, mm] = t.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────
//  TYPES  (unchanged)
// ─────────────────────────────────────────────
type Props = {
  userLoc?: { lat: number; lng: number } | null;
  isVerified?: boolean;
  coord?: { lat: number; lng: number } | null;
  emoji: string; title: string; kind: ListingKind; onClose: () => void;
  setTitle: (v: string) => void; setKind: (k: ListingKind) => void;
  priceText: string; setPriceText: (v: string) => void; priceCents: number | null;
  showDetails: boolean; setShowDetails: (v: boolean) => void;
  description: string; setDescription: (v: string) => void;
  limitEnabled: boolean; setLimitEnabled: (v: boolean) => void;
  capacityText: string; setCapacityText: (v: string) => void; capacityOk: boolean;
  slots?: string[]; setSlots?: (v: string[]) => void;
  slotDuration?: string; setSlotDuration?: (v: string) => void;
  showWhen: boolean; setShowWhen: (v: boolean) => void;
  dateISO: string; setDateISO: (v: string) => void;
  time24: string; setTime24: (v: string) => void;
  endDateISO: string; setEndDateISO: (v: string) => void;
  endTime24: string; setEndTime24: (v: string) => void;
  recurringSchedule?: {day: number; startTime: string; endTime: string}[];
  setRecurringSchedule?: (v: {day: number; startTime: string; endTime: string}[]) => void;
  dateLabel: string; timeLabel: string;
  endDateLabel: string; endTimeLabel: string;
  dateOpen: boolean; setDateOpen: (v: boolean) => void;
  timeOpen: boolean; setTimeOpen: (v: boolean) => void;
  endDateOpen: boolean; setEndDateOpen: (v: boolean) => void;
  endTimeOpen: boolean; setEndTimeOpen: (v: boolean) => void;
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
  // ✅ Recurring-specific
  bookingWindowDays?: number;
  setBookingWindowDays?: (v: number) => void;
  dailyCapacityText?: string;
  setDailyCapacityText?: (v: string) => void;
};

// ─────────────────────────────────────────────
//  BANNER IMAGE SECTION
// ─────────────────────────────────────────────
function BannerImageSection({
  bannerUri, setBannerUri, accentColor, hasError,
}: {
  bannerUri: string | null;
  setBannerUri: (v: string | null) => void;
  accentColor: string;
  hasError?: boolean;
}) {
  const [rawImage, setRawImage] = useState<{ uri: string; w: number; h: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (source: "gallery" | "camera") => {
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, allowsEditing: false });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setRawImage({ uri: asset.uri, w: asset.width, h: asset.height });
  };

  const handleCropConfirm = async (croppedUri: string, base64: string) => {
    setRawImage(null);
    console.log("[BannerUpload] crop confirmed, base64 length:", base64.length, "uri:", croppedUri);

    if (!base64) {
      Alert.alert("Error", "No image data received from crop.");
      return;
    }
    if (!API_BASE_RAW) {
      Alert.alert("Error", "API base URL not configured.");
      return;
    }

    setUploading(true);
    try {
      const endpoint = `${API_BASE_RAW.replace(/\/$/, "")}/api/events/upload-banner`;
      console.log("[BannerUpload] posting to:", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ imageBase64: base64, mimeType: "image/jpeg" }),
      });

      const json = await res.json().catch(() => ({}));
      console.log("[BannerUpload] response status:", res.status, "body:", JSON.stringify(json));

      if (!res.ok || !json.url) throw new Error(json.error || `Server returned ${res.status}`);
      console.log("[BannerUpload] success, url:", json.url);
      setBannerUri(json.url);
    } catch (e: any) {
      console.error("[BannerUpload] error:", e?.message ?? e);
      Alert.alert("Upload Failed", e.message || "Failed to upload banner.");
    } finally {
      setUploading(false);
    }
  };

  // Uploading state
  if (uploading) {
    return (
      <View style={BS.zone}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[BS.uploadingTxt, { color: accentColor }]}>Uploading…</Text>
      </View>
    );
  }

  // Banner set — image with corner action buttons
  if (bannerUri) {
    return (
      <>
        <View style={[BS.zone, BS.zoneSet]}>
          <Image source={{ uri: bannerUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={BS.cornerActions}>
            <Pressable style={BS.cornerBtn} onPress={() => pickImage("gallery")} hitSlop={6}>
              <Ionicons name="pencil" size={13} color="#fff" />
            </Pressable>
            <Pressable style={[BS.cornerBtn, BS.cornerBtnRed]} onPress={() => setBannerUri(null)} hitSlop={6}>
              <Ionicons name="trash-outline" size={13} color="#fff" />
            </Pressable>
          </View>
        </View>
        {rawImage && (
          <CropModal
            visible
            uri={rawImage.uri}
            imgW={rawImage.w}
            imgH={rawImage.h}
            onConfirm={handleCropConfirm}
            onCancel={() => setRawImage(null)}
          />
        )}
      </>
    );
  }

  // Empty — big tappable zone
  return (
    <>
      <View>
        <Pressable
          style={[BS.zone, { borderColor: hasError ? C.error + "88" : accentColor + "66", backgroundColor: hasError ? "#FEF2F2" : "#F5F3FF" }]}
          onPress={() => pickImage("gallery")}
        >
          <View style={BS.placeholder}>
            <View style={[BS.placeholderRing, { backgroundColor: hasError ? C.error + "15" : accentColor + "18", borderColor: hasError ? C.error + "40" : accentColor + "44" }]}>
              <Ionicons name="camera" size={32} color={hasError ? C.error : accentColor} />
            </View>
            <Text style={[BS.placeholderTitle, { color: hasError ? C.error : accentColor }]}>Tap to add cover photo</Text>
            <Text style={BS.placeholderSub}>You can crop &amp; zoom before uploading</Text>
          </View>
        </Pressable>
        <Pressable style={BS.cameraLink} onPress={() => pickImage("camera")}>
          <Ionicons name="camera-outline" size={14} color={C.muted} />
          <Text style={BS.cameraLinkTxt}>Use Camera</Text>
        </Pressable>
      </View>
      {rawImage && (
        <CropModal
          visible
          uri={rawImage.uri}
          imgW={rawImage.w}
          imgH={rawImage.h}
          onConfirm={handleCropConfirm}
          onCancel={() => setRawImage(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────
//  STEP 2 STYLES
// ─────────────────────────────────────────────
const ST2 = StyleSheet.create({
  body: { padding: 20, paddingBottom: 48, backgroundColor: C.bg },

  // Title — primary / prominent
  titleSection: { marginBottom: 28 },
  fieldLabel: {
    fontSize: 11, fontWeight: "800", color: C.muted,
    textTransform: "uppercase", letterSpacing: 1.1,
    marginBottom: 10,
  },
  titleShell: {
    backgroundColor: C.inputBg,
    borderWidth: 2, borderColor: C.purpleBorder,
    borderRadius: 16, paddingHorizontal: 16,
  },
  titleShellError: { borderColor: C.error + "66", backgroundColor: C.error + "06" },
  titleInput: {
    fontSize: 20, fontWeight: "800", color: C.ink,
    paddingVertical: 14, letterSpacing: -0.3,
    lineHeight: 28, textAlignVertical: "center",
    minHeight: 56,
  },

  // Banner — required
  bannerSection: { marginBottom: 8 },
  requiredStar: { fontSize: 14, fontWeight: "900", color: C.error, lineHeight: 16 },
  bannerError: { fontSize: 12, fontWeight: "700", color: C.error, marginTop: 6, paddingHorizontal: 2 },
});

// BannerImageSection styles
const BS = StyleSheet.create({
  zone: {
    height: 220, borderRadius: 20, overflow: "hidden",
    borderWidth: 2, borderStyle: "dashed", borderColor: "#6366F166",
    backgroundColor: "#F5F3FF", alignItems: "center", justifyContent: "center",
  },
  zoneSet: { borderStyle: "solid", borderColor: "#6366F188" },

  placeholder: { alignItems: "center", gap: 12 },
  placeholderRing: { width: 72, height: 72, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  placeholderTitle: { fontSize: 15, fontWeight: "800" },
  placeholderSub: { fontSize: 12, color: "#999", textAlign: "center" },

  uploadingTxt: { fontSize: 13, fontWeight: "600", marginTop: 10 },

  // Corner edit/remove buttons on set image
  cornerActions: {
    position: "absolute", top: 10, right: 10,
    flexDirection: "row", gap: 6,
  },
  cornerBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  cornerBtnRed: { backgroundColor: "rgba(220,38,38,0.70)" },

  // Camera secondary link
  cameraLink: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, marginTop: 10, paddingVertical: 4,
  },
  cameraLinkTxt: { fontSize: 12, fontWeight: "600", color: C.muted },
});

// ─────────────────────────────────────────────
//  WIZARD HEADER  (reusable across steps)
// ─────────────────────────────────────────────
function WizardHeader({
  step, stepLabel, title, sub, onBack, onClose, showBack,
  accentColor = C.green, accentBg = C.greenBg, accentText = C.greenText,
}: {
  step: number; stepLabel: string; title: string; sub: string;
  onBack: () => void; onClose: () => void; showBack: boolean;
  accentColor?: string; accentBg?: string; accentText?: string;
}) {
  return (
    <View style={S.headerWrap}>
      <View style={S.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[S.progressSeg, i < step && { backgroundColor: accentColor }]} />
        ))}
      </View>
      <View style={S.headerInner}>
        {showBack ? (
          <Pressable onPress={onBack} hitSlop={16} style={S.backBtn}>
            <Ionicons name="arrow-back" size={18} color={C.ink} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <View style={[S.stepBadge, { backgroundColor: accentBg, borderColor: accentColor + "44" }]}>
            <Text style={[S.stepBadgeText, { color: accentText }]}>{stepLabel}</Text>
          </View>
          <Text style={S.headerTitle}>{title}</Text>
          <Text style={S.headerSub}>{sub}</Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={16} style={S.closeBtn}>
          <Ionicons name="close" size={20} color={C.muted} />
        </TouchableOpacity>
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
export default function AddEventFields(props: Props & { isRecurringFlow?: boolean }) {

  const {
    userLoc, isVerified, coord,
    emoji, title, kind, onClose, setTitle, setKind,
    priceText, setPriceText, priceCents,
    showDetails, setShowDetails, description, setDescription,
    limitEnabled, setLimitEnabled, capacityText, setCapacityText, capacityOk,
    slots = [], setSlots = () => {}, slotDuration = "60", setSlotDuration = () => {},
    showWhen, setShowWhen, dateISO, setDateISO, time24, setTime24,
    endDateISO, setEndDateISO, endTime24, setEndTime24,
    dateLabel, timeLabel, endDateLabel, endTimeLabel,
    dateOpen, setDateOpen, timeOpen, setTimeOpen,
    recurringSchedule = [], setRecurringSchedule = () => {},
    endDateOpen, setEndDateOpen, endTimeOpen, setEndTimeOpen,
    query, setQuery, suggestions, loadingSug, onPickSuggestion, clearQuery,
    selectedAddress, locLoading, googleKey, mapRef, mapHtml, onMapMessage,
    err, submitting, canCreate, onCancel, onCreate,
    joinPolicy, setJoinPolicy, isServiceMode,
    bannerUri, setBannerUri,
    isRecurringFlow,
    bookingWindowDays = 1, setBookingWindowDays = () => {},
    dailyCapacityText = "", setDailyCapacityText = () => {},
  } = props;

  // ── WIZARD STEP STATE ──
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [schedDayObj, setSchedDayObj] = useState<{ day: number; field: "start" | "end" } | null>(null);

  const [kbHeight, setKbHeight] = useState(0);
  React.useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const subShow = Keyboard.addListener(showEvent, (e) => setKbHeight(e.endCoordinates.height));
    const subHide = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => { subShow.remove(); subHide.remove(); };
  }, []);

  const handleNext = () => {
    const nextErrors: Record<string, string> = {};

    if (step === 2) {
      if (!title.trim()) nextErrors.title = "Title is required";
      if (!bannerUri) nextErrors.banner = "Cover photo is required";
    }
    if (step === 3) {
      if (!isRecurringFlow) {
        if (!dateISO) nextErrors.date = "Date is required";
        if (!time24) nextErrors.time = "Time is required";
      } else {
        if (recurringSchedule.length === 0) {
          nextErrors.schedule = "Please select at least one day for the schedule.";
        }
      }
    }
    if (step === 4) {
      if (!selectedAddress || !coord) {
        nextErrors.location = "Location is required";
      } else if (!isVerified && userLoc) {
        const d = getDistanceKm(userLoc.lat, userLoc.lng, coord.lat, coord.lng);
        if (d > 100) {
          nextErrors.location = `Distance: ${d.toFixed(1)} km. Unverified users can only create events within 100 km.`;
        }
      }
    }
    if (step === 5) {
      const isPaid = kind === "event_paid";
      if (isPaid && (!priceText.trim() || parseInt(priceText) <= 0)) {
        nextErrors.price = "Valid price is required";
      }
      if (limitEnabled && (!capacityText.trim() || parseInt(capacityText) <= 0)) {
        nextErrors.capacity = "Valid capacity is required";
      }
      if (!description.trim()) {
        nextErrors.description = "Description is required";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => setStep(s => Math.max(s - 1, 1));

  const primaryLabel = useMemo(() => {
    if (submitting) return "Publishing…";
    if (isRecurringFlow) return "Create Recurring Activity";
    if (kind === "event_paid") return "Publish Paid Event";
    return "Publish Free Event";
  }, [submitting, kind]);

  const itemLabel = useMemo(() => {
    if (isRecurringFlow) return "Activity";
    return "Event";
  }, [kind]);

  const toggleSlot = (slot: string) => {
    setSlots(slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot]);
  };

  const accent = C.purple;
  const accentBg = C.purpleBg;
  const accentText = C.purpleText;

  // ════════════════════════════════════════════
  //  STEP 1 — Event Type
  // ════════════════════════════════════════════
  if (step === 1) {
    // Import styles from external styles file if needed, but here S is local.
    // I'll add the new styles to S local in AddEventFields.tsx or use the props.
    // Wait, S is local to AddEventFields.tsx. I should add the new styles to S in AddEventFields.tsx too.
    return (
      <>
        <WizardHeader
          step={1} stepLabel="STEP 01"
          title="What are you creating?"
          sub="Choose your event type — it shapes the whole experience."
          onBack={goBack} onClose={onClose} showBack={false}
          accentColor={accent} accentBg={accentBg} accentText={accentText}
        />
        <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 2 }}>
            {/* Free Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setKind("event_free")}
              style={[S.step1Card, kind === "event_free" && S.step1CardActivePurple]}
            >
              <View style={[S.step1IconBox, kind === "event_free" && { backgroundColor: "#fff" }]}>
                <Ionicons name="people" size={28} color={kind === "event_free" ? C.purple : C.muted} />
              </View>
              <View style={S.step1TextContent}>
                <Text style={S.step1Name}>{isRecurringFlow ? "Free Recurring Activity" : "Free Event"}</Text>
                <Text style={S.step1Sub}>Open to everyone. Best for meetups, hangouts, and community vibes.</Text>
              </View>
              {kind === "event_free" && (
                <View style={[S.step1Check, { backgroundColor: C.purple }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Paid Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setKind("event_paid")}
              style={[S.step1Card, kind === "event_paid" && S.step1CardActivePurple]}
            >
              <View style={[S.step1IconBox, kind === "event_paid" && { backgroundColor: "#fff" }]}>
                <Ionicons name="ticket" size={28} color={kind === "event_paid" ? C.purple : C.muted} />
              </View>
              <View style={S.step1TextContent}>
                <Text style={S.step1Name}>{isRecurringFlow ? "Paid Recurring Activity" : "Paid Event"}</Text>
                <Text style={S.step1Sub}>Charge a ticket price. Earn from your passion and expertise.</Text>
              </View>
              {kind === "event_paid" && (
                <View style={[S.step1Check, { backgroundColor: C.purple }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

          </View>
          <View style={{ marginTop: 10 }}>
            <ContinueBtn label="Continue" onPress={handleNext} color={accent} />
          </View>
        </ScrollView>
      </>
    );
  }

  // ════════════════════════════════════════════
  //  STEP 2 — Event Title + Cover Photo
  // ════════════════════════════════════════════
  if (step === 2) {
    return (
      <>
        <WizardHeader
          step={2} stepLabel="STEP 02"
          title={`Name your ${itemLabel}`}
          sub="Give it a title that makes people stop scrolling."
          onBack={goBack} onClose={onClose} showBack
          accentColor={accent} accentBg={accentBg} accentText={accentText}
        />
        <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={ST2.body}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── TITLE — primary / large ── */}
          <View style={ST2.titleSection}>
            <Text style={ST2.fieldLabel}>
              {itemLabel} title
            </Text>
            <View style={[ST2.titleShell, !!errors.title && ST2.titleShellError]}>
              <TextInput
                value={title}
                onChangeText={(t) => { setTitle(t); if (errors.title) setErrors(e => ({ ...e, title: "" })); }}
                placeholder="e.g., Saturday coffee meetup"
                placeholderTextColor={C.hint}
                style={ST2.titleInput}
                returnKeyType="done"
                multiline
                numberOfLines={2}
                autoFocus
              />
            </View>
            {!!errors.title && <Text style={S.errorMsg}>{errors.title}</Text>}
          </View>

          {/* ── BANNER — required ── */}
          <View style={ST2.bannerSection}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 }}>
              <Text style={ST2.fieldLabel}>Cover Photo</Text>
              <Text style={ST2.requiredStar}>*</Text>
            </View>
            <BannerImageSection
              bannerUri={bannerUri}
              setBannerUri={(v) => { setBannerUri(v); if (errors.banner) setErrors(e => ({ ...e, banner: "" })); }}
              accentColor={accent}
              hasError={!!errors.banner}
            />
            {!!errors.banner && <Text style={ST2.bannerError}>{errors.banner}</Text>}
          </View>

          <ContinueBtn label="Continue" onPress={handleNext} color={accent} />
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
          accentColor={accent} accentBg={accentBg} accentText={accentText}
        />
        <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={[S.body, { paddingBottom: Math.max(32, kbHeight + 20) }]}
            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* When Card */}
            <View style={S.titleSection}>
              <Text style={S.fieldLabel}>When</Text>
              {!isRecurringFlow && (
                <View style={S.segmented}>
                  <SegmentButton label="Specific Date" hint="One-time" active={!showWhen} onPress={() => setShowWhen(false)} />
                  <SegmentButton label="Set Times" hint="Range" active={showWhen} onPress={() => setShowWhen(true)} />
                </View>
              )}
              <View style={S.cardInner}>
                {!isRecurringFlow ? (
                  <>
                    {/* Row 1: Start Date */}
                    <View style={S.whenGrid}>
                      <Pressable
                        onPress={() => { setDateOpen(true); if (errors.date) setErrors(e => ({ ...e, date: "" })); }}
                        style={[S.whenTile, dateISO ? { borderColor: C.green + "88", backgroundColor: C.greenBg } : {}, errors.date && { borderColor: C.error, backgroundColor: C.error + "08" }]}
                      >
                        <View style={S.whenTileTop}>
                          <View style={[S.whenBadge, { backgroundColor: accentBg }]}>
                            <Ionicons name="calendar-outline" size={14} color={accent} />
                          </View>
                          <Text style={S.whenTileLabel}>Date</Text>
                        </View>
                        <Text numberOfLines={1} style={[S.whenTileValue, !dateISO && S.whenTileValueMuted]}>
                          {dateISO ? dateLabel : "Tap to set"}
                        </Text>
                        <Text style={S.whenTileHint}>Tap to choose</Text>
                      </Pressable>
                    </View>

                    {/* Row 2: Start Time & (optional) End Time */}
                    <View style={[S.whenGrid, { marginTop: 12 }]}>
                      <Pressable
                        onPress={() => { setTimeOpen(true); if (errors.time) setErrors(e => ({ ...e, time: "" })); }}
                        style={[S.whenTile, time24 ? { borderColor: C.amber + "88", backgroundColor: C.amberBg } : {}, errors.time && { borderColor: C.error, backgroundColor: C.error + "08" }]}
                      >
                        <View style={S.whenTileTop}>
                          <View style={[S.whenBadge, { backgroundColor: C.amberBg }]}>
                            <Ionicons name="time-outline" size={14} color={C.amber} />
                          </View>
                          <Text style={S.whenTileLabel}>Start Time</Text>
                        </View>
                        <Text numberOfLines={1} style={[S.whenTileValue, !time24 && S.whenTileValueMuted]}>
                          {time24 ? timeLabel : "Tap to set"}
                        </Text>
                        <Text style={S.whenTileHint}>Tap to choose</Text>
                      </Pressable>

                      {showWhen && (
                        <Pressable
                          onPress={() => setEndTimeOpen(true)}
                          style={[S.whenTile, endTime24 ? { borderColor: C.pink + "88", backgroundColor: C.pinkBg } : {}]}
                        >
                          <View style={S.whenTileTop}>
                            <View style={[S.whenBadge, { backgroundColor: C.pinkBg }]}>
                              <Ionicons name="time-outline" size={14} color={C.pink} />
                            </View>
                            <Text style={S.whenTileLabel}>End Time</Text>
                          </View>
                          <Text numberOfLines={1} style={[S.whenTileValue, !endTime24 && S.whenTileValueMuted]}>
                            {endTime24 ? endTimeLabel : "Tap to set"}
                          </Text>
                          <Text style={S.whenTileHint}>Tap to choose</Text>
                        </Pressable>
                      )}
                    </View>

                    {(!!errors.date || !!errors.time) && (
                      <View style={{ marginTop: 10 }}>
                        {!!errors.date && <Text style={S.errorMsg}>• {errors.date}</Text>}
                        {!!errors.time && <Text style={S.errorMsg}>• {errors.time}</Text>}
                      </View>
                    )}

                    {(dateISO || time24 || endTime24) && (
                      <Pressable hitSlop={10} onPress={() => { setDateISO(""); setTime24(""); setEndTime24(""); }} style={S.clearPill}>
                        <Text style={S.clearPillText}>Clear all</Text>
                      </Pressable>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={[S.whenTileLabel, { marginBottom: 10, paddingLeft: 4 }]}>Weekly Schedule</Text>
                    <View style={{ gap: 12 }}>
                      {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((dayName, i) => {
                        const sched = recurringSchedule.find(s => s.day === i);
                        const isActive = !!sched;
                        return (
                          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: isActive ? C.greenBg : C.inputBg, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: isActive ? C.greenBorder : C.inputBorder }}>
                            {/* Toggle */}
                            <Pressable
                              style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: isActive ? C.green : C.hint, backgroundColor: isActive ? C.green : "transparent", alignItems: "center", justifyContent: "center" }}
                              onPress={() => {
                                if (isActive) {
                                  setRecurringSchedule(recurringSchedule.filter(s => s.day !== i));
                                } else {
                                  setRecurringSchedule([...recurringSchedule, { day: i, startTime: "09:00", endTime: "17:00" }].sort((a,b) => a.day - b.day));
                                }
                              }}
                            >
                              {isActive && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </Pressable>
                            
                            <Text style={{ width: 80, fontSize: 14, fontWeight: "700", color: isActive ? C.greenText : C.muted }}>{dayName}</Text>

                            {/* Times */}
                            {isActive ? (
                              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Pressable
                                  style={{ flex: 1, backgroundColor: C.card, paddingVertical: 8, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: C.cardBorder }}
                                  onPress={() => setSchedDayObj({ day: i, field: "start" })}
                                >
                                  <Text style={{ fontSize: 13, fontWeight: "700", color: C.ink }}>{fmtTime(sched.startTime)}</Text>
                                </Pressable>
                                <Text style={{ color: C.hint, fontSize: 12, fontWeight: "800" }}>to</Text>
                                <Pressable
                                  style={{ flex: 1, backgroundColor: C.card, paddingVertical: 8, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: C.cardBorder }}
                                  onPress={() => setSchedDayObj({ day: i, field: "end" })}
                                >
                                  <Text style={{ fontSize: 13, fontWeight: "700", color: C.ink }}>{fmtTime(sched.endTime)}</Text>
                                </Pressable>
                              </View>
                            ) : (
                              <Text style={{ flex: 1, fontSize: 13, color: C.hint, fontWeight: "600", fontStyle: "italic", textAlign: "center" }}>Unavailable</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                    {!!errors.schedule && <Text style={S.errorMsg}>• {errors.schedule}</Text>}
                  </>
                )}
              </View>
            </View>

            {/* ✅ RECURRING-ONLY: Booking Window & Daily Capacity */}
            {isRecurringFlow && (
              <>
                {/* Booking Window Card */}
                <Text style={S.sectionLabel}>Booking Window</Text>
                <View style={S.card}>
                  <View style={S.cardInner}>
                    <View style={S.cardTitleRow}>
                      <View style={[S.cardIconBox, { backgroundColor: "#E0F2FE" }]}>
                        <Ionicons name="calendar-number-outline" size={18} color="#0284C7" />
                      </View>
                      <Text style={S.cardTitle}>How far ahead can users book?</Text>
                    </View>
                    <Text style={S.cardSub}>Users can book a session this far in advance. Helps you plan and manage attendance.</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      {[
                        { label: "Same Day", value: 0 },
                        { label: "1 Day", value: 1 },
                        { label: "3 Days", value: 3 },
                        { label: "1 Week", value: 7 },
                        { label: "2 Weeks", value: 14 },
                        { label: "1 Month", value: 30 },
                      ].map(opt => {
                        const active = bookingWindowDays === opt.value;
                        return (
                          <Pressable
                            key={opt.value}
                            onPress={() => setBookingWindowDays(opt.value)}
                            style={[
                              {
                                paddingHorizontal: 14, paddingVertical: 9,
                                borderRadius: 99, borderWidth: 1.5,
                                borderColor: active ? "#0284C7" : C.inputBorder,
                                backgroundColor: active ? "#E0F2FE" : C.inputBg,
                                flexDirection: "row", alignItems: "center", gap: 5,
                              }
                            ]}
                          >
                            <Ionicons name="calendar-outline" size={12} color={active ? "#0284C7" : C.muted} />
                            <Text style={{ fontSize: 12, fontWeight: "800", color: active ? "#0284C7" : C.muted }}>
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 4, backgroundColor: "#F0F9FF", borderRadius: 10, padding: 10 }}>
                      <Ionicons name="information-circle-outline" size={14} color="#0284C7" />
                      <Text style={{ fontSize: 12, color: "#0369A1", fontWeight: "600", flex: 1 }}>
                        {bookingWindowDays === 0
                          ? "Users can only book today's session on the same day."
                          : `Users can book up to ${bookingWindowDays} day${bookingWindowDays > 1 ? "s" : ""} in advance.`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Daily Capacity Card */}
                <Text style={S.sectionLabel}>Daily Capacity</Text>
                <View style={S.card}>
                  <View style={S.cardInner}>
                    <View style={S.cardTitleRow}>
                      <View style={[S.cardIconBox, { backgroundColor: C.greenBg }]}>
                        <Ionicons name="people-outline" size={18} color={C.green} />
                      </View>
                      <Text style={S.cardTitle}>Max bookings per day</Text>
                    </View>
                    <Text style={S.cardSub}>Limit how many people can book each day. Leave empty for unlimited slots.</Text>
                    <View style={S.segmented}>
                      <SegmentButton label="Unlimited" hint="No cap" active={!dailyCapacityText} onPress={() => setDailyCapacityText("")} />
                      <SegmentButton label="Set Limit" hint="Max per day" active={!!dailyCapacityText} onPress={() => { if (!dailyCapacityText) setDailyCapacityText("10"); }} />
                    </View>
                    {!!dailyCapacityText && (
                      <View style={{ marginTop: 14 }}>
                        <Text style={S.smallLabel}>Max people per day</Text>
                        <View style={S.inputShell}>
                          <Ionicons name="people-outline" size={16} color={C.hint} />
                          <TextInput
                            value={dailyCapacityText}
                            onChangeText={(t) => setDailyCapacityText(t.replace(/[^\d]/g, ""))}
                            placeholder="e.g., 15"
                            placeholderTextColor={C.hint}
                            keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
                            style={S.textInput}
                          />
                          {!!dailyCapacityText && parseInt(dailyCapacityText) > 0 && (
                            <View style={S.goodPill}><Text style={S.goodPillText}>Set</Text></View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          <ContinueBtn label="Continue" onPress={handleNext} color={accent} />
        </ScrollView>
        {/* Date Modal */}
        <Modal transparent visible={dateOpen} animationType="slide" onRequestClose={() => setDateOpen(false)}>
          <Pressable style={S.pickerOverlay} onPress={() => setDateOpen(false)}>
            <Pressable style={S.pickerCard} onPress={() => { }}>
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
            <Pressable style={S.pickerCard} onPress={() => { }}>
              <Text style={S.pickerTitle}>Pick a time</Text>
              <DateTimePicker
                value={timeToDate(time24)} mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"} themeVariant="light"
                onChange={(_, d) => {
                  if (!d) return;
                  setTime24(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
                  if (Platform.OS !== "ios") setTimeOpen(false);
                }}
              />
              <TouchableOpacity style={S.pickerDone} onPress={() => setTimeOpen(false)} activeOpacity={0.9}>
                <Text style={S.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>



        {/* End Time Modal */}
        <Modal transparent visible={endTimeOpen} animationType="slide" onRequestClose={() => setEndTimeOpen(false)}>
          <Pressable style={S.pickerOverlay} onPress={() => setEndTimeOpen(false)}>
            <Pressable style={S.pickerCard} onPress={() => { }}>
              <Text style={S.pickerTitle}>Pick an end time</Text>
              <DateTimePicker
                value={timeToDate(endTime24)} mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"} themeVariant="light"
                onChange={(_, d) => {
                  if (!d) return;
                  setEndTime24(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
                  if (Platform.OS !== "ios") setEndTimeOpen(false);
                }}
              />
              <TouchableOpacity style={S.pickerDone} onPress={() => setEndTimeOpen(false)} activeOpacity={0.9}>
                <Text style={S.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Schedule Time Modal */}
        <Modal transparent visible={!!schedDayObj} animationType="slide" onRequestClose={() => setSchedDayObj(null)}>
          <Pressable style={S.pickerOverlay} onPress={() => setSchedDayObj(null)}>
            <Pressable style={S.pickerCard} onPress={() => { }}>
              <Text style={S.pickerTitle}>Pick {schedDayObj?.field === "start" ? "start" : "end"} time</Text>
              {schedDayObj && (
                <DateTimePicker
                  value={timeToDate(recurringSchedule.find(s => s.day === schedDayObj.day)?.[schedDayObj.field === "start" ? "startTime" : "endTime"] || "09:00")} mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"} themeVariant="light"
                  onChange={(_, d) => {
                    if (!d) return;
                    const val = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                    setRecurringSchedule(recurringSchedule.map(s => {
                      if (s.day === schedDayObj.day) {
                        return { ...s, [schedDayObj.field === "start" ? "startTime" : "endTime"]: val };
                      }
                      return s;
                    }));
                    if (Platform.OS !== "ios") setSchedDayObj(null);
                  }}
                />
              )}
              <TouchableOpacity style={S.pickerDone} onPress={() => setSchedDayObj(null)} activeOpacity={0.9}>
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
          accentColor={accent} accentBg={accentBg} accentText={accentText}
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
                    { id: "venue", label: "Choose a Venue", sub: "Search a specific Place", iconName: "business-outline" as const, iconBg: C.tealBg, iconColor: C.teal },
                    { id: "online", label: "Online / Virtual", sub: "", iconName: "laptop-outline" as const, iconBg: C.purpleBg, iconColor: C.purple },
                    { id: "custom", label: "Custom Address", sub: "Type your own address", iconName: "pencil-outline" as const, iconBg: C.amberBg, iconColor: C.amber },
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
                          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: accentBg, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="location-outline" size={15} color={accent} />
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
                <View style={[S.pillSuccess, { backgroundColor: accentBg, borderColor: accent + "55" }]}>
                  <Ionicons name="checkmark-circle" size={16} color={accent} style={{ marginRight: 8 }} />
                  <Text numberOfLines={1} style={[S.pillTextSuccess, { color: accentText }]}>{selectedAddress}</Text>
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
              {(() => {
                if (!isVerified && userLoc && coord) {
                  const d = getDistanceKm(userLoc.lat, userLoc.lng, coord.lat, coord.lng);
                  if (d > 100) {
                    return <Text style={[S.errorMsg, { marginTop: 10, fontSize: 13, lineHeight: 18 }]}>{`Unverified users can only create events within 100 km of their current location. (Distance: ${d.toFixed(1)} km). Please complete your identity verification to create events anywhere.`}</Text>;
                  }
                }
                return null;
              })()}
              {!!errors.location && <Text style={[S.errorMsg, { marginTop: 10 }]}>{errors.location}</Text>}
              {!!err && <Text style={S.err}>{err}</Text>}
            </View>
          </View>

          <ContinueBtn label="Continue" onPress={handleNext} color={accent} />
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
          sub={kind === "event_paid" ? `Set the ticket price for your ${itemLabel.toLowerCase()}.` : `Control who can join your ${itemLabel.toLowerCase()}.`}
          onBack={goBack} onClose={onClose} showBack
          accentColor={accent} accentBg={accentBg} accentText={accentText}
        />
        <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={[S.body, { paddingBottom: Math.max(32, kbHeight + 20) }]}
            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Price (paid events) */}
            {(kind === "event_paid") && (
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
                    <View style={[S.inputShell, errors.price && { borderColor: C.error + "44", backgroundColor: C.error + "08" }]}>
                      <Text style={[S.pricePrefix, { color: accent }]}>₹</Text>
                      <TextInput
                        value={priceText} onChangeText={(t) => { setPriceText(t); if (errors.price) setErrors(e => ({ ...e, price: "" })); }}
                        placeholder={kind === "event_paid" ? "299" : "500"}
                        placeholderTextColor={C.hint}
                        keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
                        style={S.priceInput}
                      />
                      {priceCents !== null && (
                        <View style={S.goodPill}><Text style={S.goodPillText}>Set</Text></View>
                      )}
                    </View>
                    {!!errors.price && <Text style={S.errorMsg}>{errors.price}</Text>}
                    {/* Quick price tags */}
                    <View style={S.priceTagRow}>
                      {QUICK_PRICES.map(p => {
                        const active = priceText === p;
                        return (
                          <TouchableOpacity key={p} onPress={() => setPriceText(p)}
                            style={[S.priceTag, active && { borderColor: accent, backgroundColor: accentBg }]} activeOpacity={0.8}>
                            <Text style={[S.priceTagText, active && { color: accentText, fontWeight: "800" }]}>₹{p}</Text>
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
            {kind === "event_free" && !isRecurringFlow && (
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
                      <SegmentButton label="Open" hint="Unlimited" active={!limitEnabled} onPress={() => setLimitEnabled(false)} />
                      <SegmentButton label="Limit" hint="Set max" active={limitEnabled} onPress={() => setLimitEnabled(true)} />
                    </View>
                    {limitEnabled && (
                      <View style={{ marginTop: 14 }}>
                        <Text style={S.smallLabel}>Max people</Text>
                        <View style={[S.inputShell, errors.capacity && { borderColor: C.error + "44", backgroundColor: C.error + "08" }]}>
                          <Ionicons name="people-outline" size={16} color={C.hint} />
                          <TextInput
                            value={capacityText} onChangeText={(t) => { setCapacityText(t); if (errors.capacity) setErrors(e => ({ ...e, capacity: "" })); }}
                            placeholder="e.g., 20" placeholderTextColor={C.hint}
                            keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
                            style={S.textInput}
                          />
                        </View>
                        {!!errors.capacity && <Text style={S.errorMsg}>{errors.capacity}</Text>}
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
            <Text style={S.sectionLabel}>{itemLabel} Description</Text>
            <View style={S.card}>
              <View style={S.cardInner}>
                <View style={S.cardTitleRow}>
                  <View style={[S.cardIconBox, { backgroundColor: C.purpleBg }]}>
                    <Ionicons name="document-text-outline" size={18} color={C.purple} />
                  </View>
                  <Text style={S.cardTitle}>Tell them more</Text>
                </View>
                <Text style={S.cardSub}>Add agenda, rules, what to bring, and any other details.</Text>

                <View style={[S.descShell, errors.description && { borderColor: C.error + "44", backgroundColor: C.error + "08" }]}>
                  <TextInput
                    value={description} onChangeText={(t) => { setDescription(t); if (errors.description) setErrors(e => ({ ...e, description: "" })); }}
                    placeholder="e.g., Meet at the main gate. Bring water and a positive vibe!"
                    placeholderTextColor={C.hint} multiline textAlignVertical="top"
                    style={S.descInput} returnKeyType="default"
                  />
                </View>
                {!!errors.description && <Text style={S.errorMsg}>{errors.description}</Text>}
              </View>
            </View>

            {/* Access */}
            {true && (
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

            <ContinueBtn label="Continue" onPress={handleNext} color={accent} />
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
        accentColor={accent} accentBg={accentBg} accentText={accentText}
      />
      <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={S.body} showsVerticalScrollIndicator={false}>

        <Text style={S.sectionLabel}>Your {itemLabel.toLowerCase()}</Text>
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
                {isRecurringFlow ? "Recurring Activity" : kind === "event_paid" ? "Paid Event" : "Free Event"}
              </Text>
            </View>
          </View>

          <View style={S.previewBody}>
            <Text style={S.previewEventTitle}>{title || `Untitled ${itemLabel}`}</Text>
            {!!description && <Text style={S.previewEventSub} numberOfLines={2}>{description}</Text>}
            <View style={S.previewDivider} />

            {/* Date & time */}
            <View style={S.previewDetailRow}>
              <View style={[S.previewDetailIcon, { backgroundColor: C.amberBg }]}>
                <Ionicons name="calendar-outline" size={16} color={C.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.previewDetailLabel}>Starts At</Text>
                <Text style={S.previewDetailVal}>{dateISO ? fmtDate(dateISO) : "Date not set"}</Text>
                <Text style={S.previewDetailSub}>{timeStr}</Text>
              </View>
            </View>

            {/* End time preview */}
            {(endDateISO || endTime24) && (
              <View style={S.previewDetailRow}>
                <View style={[S.previewDetailIcon, { backgroundColor: C.pinkBg }]}>
                  <Ionicons name="time-outline" size={16} color={C.pink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.previewDetailLabel}>Ends At</Text>
                  <Text style={S.previewDetailVal}>{endDateISO ? fmtDate(endDateISO) : "Same day"}</Text>
                  <Text style={S.previewDetailSub}>{endTime24 ? fmtTime(endTime24) : "Time not set"}</Text>
                </View>
              </View>
            )}

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
            {(kind === "event_paid") && !!priceText && (
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
            {true && (
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

            {/* ✅ Recurring-specific preview */}
            {isRecurringFlow && (
              <>
                <View style={S.previewDivider} />
                {/* Repeats On */}
                <View style={S.previewDetailRow}>
                  <View style={[S.previewDetailIcon, { backgroundColor: "#ECFDF5" }]}>
                    <Ionicons name="repeat-outline" size={16} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.previewDetailLabel}>Repeats On</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => {
                        const on = recurringSchedule.some(s => s.day === i);
                        return (
                          <View key={i} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: on ? "#ECFDF5" : C.inputBg, borderWidth: 1, borderColor: on ? "#10B981" : C.inputBorder }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: on ? "#059669" : C.hint }}>{d}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
                {/* Booking Window */}
                <View style={S.previewDetailRow}>
                  <View style={[S.previewDetailIcon, { backgroundColor: "#E0F2FE" }]}>
                    <Ionicons name="calendar-number-outline" size={16} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.previewDetailLabel}>Booking Window</Text>
                    <Text style={S.previewDetailVal}>
                      {bookingWindowDays === 0 ? "Same day only" : `Up to ${bookingWindowDays} day${bookingWindowDays > 1 ? "s" : ""} in advance`}
                    </Text>
                  </View>
                </View>
                {/* Daily Capacity */}
                <View style={[S.previewDetailRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
                  <View style={[S.previewDetailIcon, { backgroundColor: C.greenBg }]}>
                    <Ionicons name="people-outline" size={16} color={C.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.previewDetailLabel}>Daily Capacity</Text>
                    <Text style={S.previewDetailVal}>
                      {dailyCapacityText && parseInt(dailyCapacityText) > 0
                        ? `Max ${dailyCapacityText} people/day`
                        : "Unlimited"}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Cancel + Publish */}
        <View style={S.actions}>
          <TouchableOpacity style={S.secondaryBtn} onPress={onCancel} activeOpacity={0.9}>
            <Text style={S.secondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.primaryBtn, { backgroundColor: accent }]}
            onPress={onCreate} activeOpacity={0.92}
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

        {!!err && <Text style={[S.err, { textAlign: "center", marginTop: 10, marginBottom: 20 }]}>{err}</Text>}
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