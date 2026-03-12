// MyBookingScreen.style.ts
import { StyleSheet, Platform } from "react-native";

const FONT = Platform.select({
  ios: {
    regular: "AvenirNext-Regular",
    medium: "AvenirNext-Medium",
    demi: "AvenirNext-DemiBold",
    bold: "AvenirNext-Bold",
    heavy: "AvenirNext-Heavy",
  },
  android: {
    regular: "sans-serif",
    medium: "sans-serif-medium",
    demi: "sans-serif-medium",
    bold: "sans-serif-bold",
    heavy: "sans-serif-black",
  },
  default: {
    regular: "System",
    medium: "System",
    demi: "System",
    bold: "System",
    heavy: "System",
  },
}) as any;

export const COLORS = {
  bg: "#FFF7FA",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  brand: "#FF4D6D",
  brandSoft: "#FFF1F5",
  border: "#F1F5F9",
  success: "#10B981",
  blue: "#3B82F6",
};

export const styles = StyleSheet.create({
  // ----- screen / header -----
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },

  headerTopRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    color: COLORS.text,
    fontFamily: FONT.heavy,
    letterSpacing: -0.8,
  },
  subTitle: {
    marginTop: 4,
    fontSize: 15,
    color: COLORS.muted,
    fontFamily: FONT.medium,
  },

  // ----- tabs -----
  tabsWrap: {
    marginTop: 20,
    flexDirection: "row",
    borderRadius: 22,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tabIndicator: {
    position: "absolute",
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 16,
    backgroundColor: COLORS.brand,
    shadowColor: COLORS.brand,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  tabText: {
    color: COLORS.muted,
    fontFamily: FONT.bold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  tabCount: {
    display: "none", // Hide count inside text for cleaner look
  },
  tabTextActive: { color: "#FFFFFF" },

  // ----- list -----
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ----- section header -----
  sectionHeaderWrap: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeaderTop: {
    paddingLeft: 4,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontFamily: FONT.heavy,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionHint: {
    marginTop: 4,
    color: COLORS.muted,
    fontFamily: FONT.medium,
    fontSize: 12,
    opacity: 0.8,
  },
  sectionDivider: {
    display: "none", // cleaner look without dividers
  },

  // ----- card -----
  card: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  emojiPill: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brandSoft,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 109, 0.1)",
  },
  emojiTxt: { fontSize: 24 },

  cardTitle: {
    color: COLORS.text,
    fontFamily: FONT.heavy,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontFamily: FONT.medium,
    fontSize: 12,
  },

  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FONT.bold,
    textTransform: "uppercase",
  },
  badgeService: { backgroundColor: COLORS.blue },
  badgeFree: { backgroundColor: COLORS.success },
  badgeActive: { backgroundColor: COLORS.success },
  badgePaused: { backgroundColor: COLORS.muted },

  rightCol: {
    alignItems: "flex-end",
    gap: 8,
  },

  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.text,
  },
  priceTxt: {
    color: "#FFFFFF",
    fontFamily: FONT.heavy,
    fontSize: 12,
    letterSpacing: 0.5,
  },

  toggleWrap: {
    padding: 2,
    borderRadius: 999,
  },

  // ----- meta -----
  metaGrid: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  metaCell: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaLabel: {
    color: COLORS.muted,
    fontFamily: FONT.bold,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaValue: {
    marginTop: 4,
    color: COLORS.text,
    fontFamily: FONT.heavy,
    fontSize: 13,
  },

  // ----- action sub-card -----
  actionSub: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.brandSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextMain: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 13,
  },
  actionTextSub: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 1,
    fontWeight: "600",
  },

  // ----- empty / errors -----
  empty: {
    marginTop: 20,
    padding: 30,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.text,
    fontFamily: FONT.heavy,
    fontSize: 18,
    marginTop: 12,
  },
  emptySub: {
    marginTop: 8,
    color: COLORS.muted,
    fontFamily: FONT.medium,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  muted: {
    color: COLORS.muted,
    fontFamily: FONT.bold,
    marginTop: 12,
  },

  err: { color: COLORS.brand, fontFamily: FONT.bold, textAlign: "center", fontSize: 16 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.text,
  },
  retryTxt: { color: "#FFFFFF", fontFamily: FONT.bold, fontSize: 15 },
});
