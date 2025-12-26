import { StyleSheet } from "react-native";

export const COLORS = {
  bg: "#FFF7FA",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  brand: "#FF4D6D",
  brandSoft: "#FFF1F5",
  ring: "#FFD1DC",
  danger: "#EF4444",
};

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },

  content: { paddingBottom: 28 },

  topBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: "center",
  },
  iconBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: COLORS.brandSoft,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.ring,
  },

  center: { alignItems: "center", paddingTop: 14, paddingHorizontal: 16 },

  avatarRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 5,
    borderColor: COLORS.ring,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  avatar: { width: 106, height: 106, borderRadius: 53 },

  editBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.card,
  },

  percentBadge: {
    position: "absolute",
    right: -10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFE4EA",
    borderWidth: 1,
    borderColor: COLORS.ring,
  },
  percentTxt: { color: COLORS.brand, fontWeight: "800", fontSize: 12 },

  nameTxt: { marginTop: 14, fontSize: 28, fontWeight: "900", color: COLORS.text },
  metaTxt: { marginTop: 6, fontSize: 12, color: COLORS.muted, fontWeight: "700" },

  handlePill: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  handleTxt: { color: "#fff", fontWeight: "800", marginLeft: 8, fontSize: 16 },

  cardRow: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  verifyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.ring,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  cardSub: { marginTop: 2, fontSize: 13, color: COLORS.muted },

  sectionCard: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  sectionBodyTxt: { marginTop: 10, color: "#374151", fontSize: 15, lineHeight: 20 },

  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.brandSoft,
    borderWidth: 1,
    borderColor: COLORS.ring,
  },
  showMoreTxt: { color: COLORS.brand, fontWeight: "900", fontSize: 13, marginRight: 6 },

  // Photos
  photosGrid: { marginTop: 12 },
  photoBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFB3C1",
    borderStyle: "dashed",
    backgroundColor: COLORS.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  photoBigImg: { width: "100%", height: 180, borderRadius: 16 },
  photoBig: { height: 180 },

  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  photoSmallWrap: { width: "48%" }, // ✅ ensures both show
  photoSmallImg: { width: "100%", height: 120, borderRadius: 16 },
  photoSmall: { height: 120 },

  addPhotoTxt: { marginTop: 8, color: COLORS.brand, fontWeight: "900" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  chip: {
    backgroundColor: COLORS.brandSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.ring,
    marginRight: 10,
    marginBottom: 10,
  },
  chipTxt: { color: COLORS.text, fontWeight: "700" },

  logoutBtn: {
    marginTop: 18,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  logoutTxt: { color: COLORS.brand, fontWeight: "900", fontSize: 16, marginLeft: 8 },

  // Preview modal
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImg: { width: "92%", height: "80%" },
  previewClose: {
    position: "absolute",
    top: 60,
    right: 20,
    padding: 10,
  },
});
