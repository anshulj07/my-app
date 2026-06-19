import { StyleSheet, Platform } from "react-native";

const C = {
  bg: "#FFFFFF",
  surface: "#F7F9FC",
  border: "#E2E8F0",
  ink: "#0F172A",
  inkSub: "#475569",
  muted: "#94A3B8",
  purple: "#6C5CE7",
  purpleSoft: "#F5F3FF",
  red: "#EF4444",
  redSoft: "#FEF2F2",
  green: "#10B981",
  greenSoft: "#ECFDF5",
  amber: "#F59E0B",
};

export const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: C.bg },
  
  // Header
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: C.ink },

  scroll: { flex: 1 },
  content: { paddingBottom: 140 }, // Space for footer

  // Sections
  section: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 20 },

  // Banner
  bannerZone: {
    height: 180, borderRadius: 14, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed",
    overflow: "hidden",
  },
  bannerZoneHasImage: { borderStyle: "solid", borderColor: C.purple },
  bannerPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  bannerPlaceholderTitle: { fontSize: 14, fontWeight: "700", color: C.purple },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12 },
  bannerOverlayBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.6)", flexDirection: "row", alignItems: "center", gap: 6 },
  bannerOverlayBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  bannerOverlayBtnDanger: { backgroundColor: C.red },

  // Companion Types
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeTag: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: "transparent",
    gap: 6,
  },
  typeTagSelected: { backgroundColor: C.purpleSoft, borderColor: C.purple },
  typeLabel: { fontSize: 13, fontWeight: "700", color: C.inkSub },
  typeLabelSelected: { color: C.purple },

  // Inputs
  headlineInputWrap: {
    borderWidth: 2, borderColor: C.purple,
    borderRadius: 14, padding: 16,
    backgroundColor: "#fff",
  },
  headlineInput: { fontSize: 16, fontWeight: "700", color: C.ink, textAlign: "center" },
  inputHint: { fontSize: 12, fontWeight: "600", color: C.muted, marginTop: 8, textAlign: "center" },

  aboutInput: {
    padding: 16, backgroundColor: C.surface,
    borderRadius: 14, minHeight: 120,
    fontSize: 15, fontWeight: "600", color: C.ink,
    textAlignVertical: "top",
  },

  // Rates
  rateRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  rateToggle: {
    flex: 1, height: 48, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8,
  },
  rateToggleActive: { borderColor: C.purple, backgroundColor: C.purpleSoft },
  rateToggleCircle: { width: 14, height: 14, borderRadius: 8, borderWidth: 1.5, borderColor: C.muted },
  rateToggleCircleActive: { borderColor: C.purple, backgroundColor: C.purple },
  rateToggleLabel: { fontSize: 14, fontWeight: "700", color: C.inkSub },
  rateToggleLabelActive: { color: C.purple },

  priceBox: {
    flexDirection: "row", alignItems: "center",
    padding: 16, backgroundColor: C.surface, borderRadius: 14,
    gap: 12,
  },
  priceSymbol: { fontSize: 18, fontWeight: "800", color: C.inkSub },
  priceInput: { flex: 1, fontSize: 18, fontWeight: "800", color: C.ink },

  // Availability
  dayRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  dayLeftBound: { flexDirection: "row", alignItems: "center", gap: 12 },
  dayDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border },
  dayDotActive: { backgroundColor: C.purple },
  dayName: { fontSize: 14, fontWeight: "700", color: C.inkSub, width: 40 },
  dayTime: { fontSize: 14, fontWeight: "700", color: C.ink },
  dayUnavailable: { color: C.muted, fontWeight: "600" },
  dayEditBtn: { padding: 4 },

  // Duration
  durationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  durChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: "transparent",
  },
  durChipActive: { borderColor: C.purple, backgroundColor: C.purpleSoft },
  durText: { fontSize: 13, fontWeight: "700", color: C.inkSub },
  durTextActive: { color: C.purple },

  // Blocked Dates
  blockedBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 16, borderRadius: 12, borderStyle: "dashed",
    borderWidth: 1.5, borderColor: C.border, gap: 8,
  },
  blockedBtnText: { fontSize: 14, fontWeight: "700", color: C.inkSub },

  // Meeting Style
  styleBtn: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12,
  },
  styleRadio: { 
    width: 20, height: 20, borderRadius: 10, 
    borderWidth: 2, borderColor: C.muted,
    alignItems: "center", justifyContent: "center",
  },
  styleRadioActive: { borderColor: C.purple },
  styleRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.purple },
  styleLabel: { fontSize: 14, fontWeight: "700", color: C.inkSub },
  styleLabelActive: { color: C.ink },

  locRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, padding: 12, backgroundColor: C.surface, borderRadius: 10 },
  locText: { fontSize: 13, fontWeight: "700", color: C.inkSub },
  locChange: { color: C.purple, fontSize: 13, fontWeight: "800" },

  // Danger Zone
  dangerBanner: {
    padding: 16, backgroundColor: C.redSoft, borderRadius: 14, gap: 12,
  },
  dangerTitle: { fontSize: 14, fontWeight: "800", color: C.red },
  dangerSub: { fontSize: 13, fontWeight: "600", color: C.red, opacity: 0.8 },
  pauseBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", padding: 14, borderRadius: 12,
  },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.red,
    justifyContent: "center", marginTop: 12,
  },
  deleteText: { color: C.red, fontWeight: "800", fontSize: 14 },

  // Footer
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === "ios" ? 36 : 20,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
  },
  saveBtn: {
    height: 56, borderRadius: 28, backgroundColor: C.purple,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
