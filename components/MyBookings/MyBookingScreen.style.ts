// // MyBookingScreen.style.ts
// import { StyleSheet, Platform } from "react-native";

// const FONT = Platform.select({
//   ios: {
//     regular: "AvenirNext-Regular",
//     medium: "AvenirNext-Medium",
//     demi: "AvenirNext-DemiBold",
//     bold: "AvenirNext-Bold",
//     heavy: "AvenirNext-Heavy",
//   },
//   android: {
//     regular: "sans-serif",
//     medium: "sans-serif-medium",
//     demi: "sans-serif-medium",
//     bold: "sans-serif-bold",
//     heavy: "sans-serif-black",
//   },
//   default: {
//     regular: "System",
//     medium: "System",
//     demi: "System",
//     bold: "System",
//     heavy: "System",
//   },
// }) as any;

// export const COLORS = {
//   bg: "#FFF7FA",
//   card: "#FFFFFF",
//   text: "#111827",
//   muted: "#6B7280",
//   brand: "#FF4D6D",
//   brandSoft: "#FFF1F5",
//   border: "#F1F5F9",
//   success: "#10B981",
//   blue: "#3B82F6",
// };

// export const styles = StyleSheet.create({
//   // ----- screen / header -----
//   screen: {
//     flex: 1,
//     backgroundColor: COLORS.bg,
//   },

//   header: {
//     paddingHorizontal: 20,
//     paddingTop: 10,
//     paddingBottom: 20,
//   },

//   headerTopRow: {
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 32,
//     color: COLORS.text,
//     fontFamily: FONT.heavy,
//     letterSpacing: -0.8,
//   },
//   subTitle: {
//     marginTop: 4,
//     fontSize: 15,
//     color: COLORS.muted,
//     fontFamily: FONT.medium,
//   },

//   // ----- tabs -----
//   tabsWrap: {
//     marginTop: 20,
//     flexDirection: "row",
//     borderRadius: 22,
//     padding: 6,
//     backgroundColor: "rgba(255,255,255,0.8)",
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 2,
//   },
//   tabIndicator: {
//     position: "absolute",
//     left: 6,
//     top: 6,
//     bottom: 6,
//     borderRadius: 16,
//     backgroundColor: COLORS.brand,
//     shadowColor: COLORS.brand,
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//   },
//   tabBtn: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//   },
//   tabText: {
//     color: COLORS.muted,
//     fontFamily: FONT.bold,
//     fontSize: 13,
//     letterSpacing: 0.2,
//   },
//   tabCount: {
//     display: "none", // Hide count inside text for cleaner look
//   },
//   tabTextActive: { color: "#FFFFFF" },

//   // ----- list -----
//   list: {
//     paddingHorizontal: 20,
//     paddingBottom: 40,
//   },

//   // ----- section header -----
//   sectionHeaderWrap: {
//     marginTop: 24,
//     marginBottom: 12,
//   },
//   sectionHeaderTop: {
//     paddingLeft: 4,
//   },
//   sectionTitle: {
//     color: COLORS.muted,
//     fontSize: 13,
//     fontFamily: FONT.heavy,
//     textTransform: "uppercase",
//     letterSpacing: 1.2,
//   },
//   sectionHint: {
//     marginTop: 4,
//     color: COLORS.muted,
//     fontFamily: FONT.medium,
//     fontSize: 12,
//     opacity: 0.8,
//   },
//   sectionDivider: {
//     display: "none", // cleaner look without dividers
//   },

//   // ----- card -----
//   card: {
//     borderRadius: 24,
//     padding: 16,
//     backgroundColor: COLORS.card,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 15,
//     shadowOffset: { width: 0, height: 10 },
//     elevation: 3,
//   },

//   cardTop: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 14,
//   },
//   emojiPill: {
//     width: 48,
//     height: 48,
//     borderRadius: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: COLORS.brandSoft,
//     borderWidth: 1,
//     borderColor: "rgba(255, 77, 109, 0.1)",
//   },
//   emojiTxt: { fontSize: 24 },

//   cardTitle: {
//     color: COLORS.text,
//     fontFamily: FONT.heavy,
//     fontSize: 17,
//     letterSpacing: -0.3,
//   },
//   cardSubtitle: {
//     marginTop: 2,
//     color: COLORS.muted,
//     fontFamily: FONT.medium,
//     fontSize: 12,
//   },

//   badgesRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//     marginTop: 8,
//   },
//   badge: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 10,
//   },
//   badgeText: {
//     color: "#fff",
//     fontSize: 11,
//     fontFamily: FONT.bold,
//     textTransform: "uppercase",
//   },
//   badgeService: { backgroundColor: COLORS.blue },
//   badgeFree: { backgroundColor: COLORS.success },
//   badgeActive: { backgroundColor: COLORS.success },
//   badgePaused: { backgroundColor: COLORS.muted },

//   rightCol: {
//     alignItems: "flex-end",
//     gap: 8,
//   },

//   pricePill: {
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 12,
//     backgroundColor: COLORS.text,
//   },
//   priceTxt: {
//     color: "#FFFFFF",
//     fontFamily: FONT.heavy,
//     fontSize: 12,
//     letterSpacing: 0.5,
//   },

//   toggleWrap: {
//     padding: 2,
//     borderRadius: 999,
//   },

//   // ----- meta -----
//   metaGrid: {
//     marginTop: 16,
//     flexDirection: "row",
//     gap: 12,
//   },
//   metaCell: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 18,
//     backgroundColor: COLORS.bg,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   metaLabel: {
//     color: COLORS.muted,
//     fontFamily: FONT.bold,
//     fontSize: 10,
//     textTransform: "uppercase",
//     letterSpacing: 0.8,
//   },
//   metaValue: {
//     marginTop: 4,
//     color: COLORS.text,
//     fontFamily: FONT.heavy,
//     fontSize: 13,
//   },

//   // ----- action sub-card -----
//   actionSub: {
//     marginTop: 14,
//     padding: 14,
//     borderRadius: 18,
//     backgroundColor: COLORS.brandSoft,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   actionIconBox: {
//     width: 32,
//     height: 32,
//     borderRadius: 10,
//     backgroundColor: COLORS.brand,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   actionTextMain: {
//     color: COLORS.text,
//     fontWeight: "800",
//     fontSize: 13,
//   },
//   actionTextSub: {
//     color: COLORS.muted,
//     fontSize: 11,
//     marginTop: 1,
//     fontWeight: "600",
//   },

//   // ----- empty / errors -----
//   empty: {
//     marginTop: 20,
//     padding: 30,
//     borderRadius: 24,
//     backgroundColor: COLORS.card,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   emptyTitle: {
//     color: COLORS.text,
//     fontFamily: FONT.heavy,
//     fontSize: 18,
//     marginTop: 12,
//   },
//   emptySub: {
//     marginTop: 8,
//     color: COLORS.muted,
//     fontFamily: FONT.medium,
//     fontSize: 14,
//     textAlign: "center",
//     lineHeight: 20,
//   },

//   center: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 20,
//   },
//   muted: {
//     color: COLORS.muted,
//     fontFamily: FONT.bold,
//     marginTop: 12,
//   },

//   err: { color: COLORS.brand, fontFamily: FONT.bold, textAlign: "center", fontSize: 16 },
//   retryBtn: {
//     marginTop: 16,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 16,
//     backgroundColor: COLORS.text,
//   },
//   retryTxt: { color: "#FFFFFF", fontFamily: FONT.bold, fontSize: 15 },
// });
// MyBookingScreen.style.ts
import { StyleSheet } from "react-native";

export const COLORS = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  inputBorder: "#E8E0D5",
  ink:         "#1C1A17",
  ink2:        "#3D3A34",
  muted:       "#8A8278",
  hint:        "#BCB6AD",
  brand:       "#3ECFB2",   // teal as primary brand
  brandBg:     "#E8FAF7",
  brandText:   "#1A7A6A",
  coral:       "#FF6F6F",
  coralBg:     "#FFF0F0",
  coralText:   "#C0392B",
  amber:       "#F59E0B",
  amberBg:     "#FFFBEB",
  amberText:   "#92400E",
  purple:      "#A78BFA",
  purpleBg:    "#F3F0FF",
  purpleText:  "#5B21B6",
  green:       "#34D399",
  greenBg:     "#ECFDF5",
  greenText:   "#065F46",
  blue:        "#60A5FA",
  blueBg:      "#EFF6FF",
  blueText:    "#1D4ED8",
  border:      "#F0EBE3",   // alias kept for tab files
  success:     "#34D399",
};

export const styles = StyleSheet.create({
  // ── Screen ──
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.cardBorder,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.ink,
    letterSpacing: -0.4,
  },
  subTitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
  },

  // ── Tabs ──
  tabsWrap: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    backgroundColor: "#F5F0FF",
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    overflow: "hidden",
  },
  tabIndicator: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    shadowColor: COLORS.brand,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 999,
  },
  tabText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.1,
  },
  tabCount:      {},           // unused but kept for compat
  tabTextActive: { color: "#FFFFFF" },

  // ── List ──
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },

  // ── Section header ──
  sectionHeaderWrap: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionHeaderTop: { paddingLeft: 4 },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionHint: {
    marginTop: 3,
    color: COLORS.hint,
    fontSize: 12,
    fontWeight: "600",
  },
  sectionDivider: {
    height: 1.5,
    backgroundColor: COLORS.cardBorder,
    marginTop: 10,
  },

  // ── Card ──
  card: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  emojiPill: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brandBg,
    borderWidth: 1.5,
    borderColor: COLORS.brand + "33",
  },
  emojiTxt: { fontSize: 24 },
  cardTitle: {
    color: COLORS.ink,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  badgeText: { fontSize: 11, fontWeight: "800" },

  // kept for backwards compat from old tab files
  badgeService: { backgroundColor: COLORS.purpleBg, borderColor: COLORS.purple + "55" },
  badgeFree:    { backgroundColor: COLORS.brandBg,  borderColor: COLORS.brand + "55" },
  badgeActive:  { backgroundColor: COLORS.greenBg,  borderColor: COLORS.green + "55" },
  badgePaused:  { backgroundColor: COLORS.coralBg,  borderColor: COLORS.coral + "55" },

  rightCol: {
    alignItems: "flex-end",
    gap: 8,
  },
  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: COLORS.brandBg,
    borderColor: COLORS.brand + "55",
  },
  priceTxt: {
    color: COLORS.brandText,
    fontWeight: "900",
    fontSize: 12,
  },
  toggleWrap: {
    padding: 2,
    borderRadius: 999,
  },

  // ── Meta grid ──
  metaGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  metaCell: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
  },
  metaLabel: {
    color: COLORS.hint,
    fontWeight: "800",
    fontSize: 10,
    marginBottom: 3,
  },
  metaValue: {
    color: COLORS.ink2,
    fontWeight: "700",
    fontSize: 12,
  },

  // ── Action sub-row ──
  actionSub: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.brandBg,
    borderWidth: 1.5,
    borderColor: COLORS.brand + "55",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextMain: {
    color: COLORS.ink2,
    fontWeight: "800",
    fontSize: 13,
    marginBottom: 1,
  },
  actionTextSub: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Empty / error ──
  empty: {
    marginTop: 20,
    padding: 30,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  emptyTitle: {
    color: COLORS.ink,
    fontWeight: "900",
    fontSize: 17,
    marginTop: 12,
  },
  emptySub: {
    marginTop: 8,
    color: COLORS.muted,
    fontWeight: "600",
    fontSize: 13,
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
    fontWeight: "700",
    marginTop: 12,
    fontSize: 13,
  },
  err: {
    color: COLORS.coral,
    fontWeight: "800",
    textAlign: "center",
    fontSize: 15,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  retryTxt: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
});