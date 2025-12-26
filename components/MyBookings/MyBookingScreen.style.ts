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

export const styles = StyleSheet.create({
  // ----- screen / header -----
  screen: {
    flex: 1,
    backgroundColor: "#F7F8FC",
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },

  // ✅ from sx.headerTopRow + sx.subTitle
  headerTopRow: {
    gap: 10,
    marginBottom: 10,
  },
  subTitle: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(100,116,139,0.92)", // slate-500
    fontFamily: FONT.medium,
  },

  title: {
    fontSize: 30,
    color: "#0F172A",
    fontFamily: FONT.heavy,
    letterSpacing: -0.4,
  },

  // ----- stats (optional) -----
  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  stat: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    shadowColor: "#0B1220",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 1,
  },
  statValue: {
    color: "#0F172A",
    fontSize: 18,
    fontFamily: FONT.bold,
    letterSpacing: -0.2,
  },
  statLabel: {
    marginTop: 4,
    color: "#64748B",
    fontFamily: FONT.medium,
    fontSize: 12,
  },

  // ✅ pills (from sx)
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    shadowColor: "#0B1220",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  pillText: {
    fontSize: 12,
    color: "#334155",
    fontFamily: FONT.medium,
  },
  pillValue: {
    fontFamily: FONT.bold,
    color: "#0F172A",
  },

  // ----- tabs -----
  tabsWrap: {
    marginTop: 12,
    flexDirection: "row",
    borderRadius: 18,
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    overflow: "hidden",
    shadowColor: "#0B1220",
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  tabIndicator: {
    position: "absolute",
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: 14,
    backgroundColor: "#F1F5FF",
    borderWidth: 1,
    borderColor: "#D9E2FF",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 3,
  },
  tabText: {
    color: "#475569",
    fontFamily: FONT.demi,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  tabTextActive: { color: "#0F172A" },
  tabCount: {
    color: "#94A3B8",
    fontFamily: FONT.bold,
    fontSize: 11,
  },
  tabCountActive: { color: "#0F172A" },

  // ----- list -----
  list: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  // ----- section header (merged with sx.sectionHeaderWrap etc) -----
  sectionHeaderWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  sectionHeaderTop: {
    gap: 6,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontFamily: FONT.bold,
    letterSpacing: -0.2,
  },
  sectionHint: {
    marginTop: 3,
    color: "#64748B",
    fontFamily: FONT.regular,
    fontSize: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.18)",
    marginTop: 10,
  },

  // ----- card -----
  card: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    shadowColor: "#0B1220",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 1,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emojiPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5FF",
    borderWidth: 1,
    borderColor: "#D9E2FF",
  },
  emojiTxt: { fontSize: 20 },

  cardTitle: {
    color: "#0F172A",
    fontFamily: FONT.bold,
    fontSize: 15,
    letterSpacing: -0.15,
  },
  cardSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontFamily: FONT.medium,
    fontSize: 12,
  },

  // ✅ badges (from sx)
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  badgeService: { backgroundColor: "rgba(59,130,246,0.75)" }, // blue
  badgeFree: { backgroundColor: "rgba(34,197,94,0.62)" }, // green
  badgeActive: { backgroundColor: "rgba(34,197,94,0.78)" },
  badgePaused: { backgroundColor: "rgba(148,163,184,0.85)" },

  // right column in card (toggle + price)
  rightCol: {
    alignItems: "flex-end",
    gap: 10,
  },

  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#0F172A",
  },
  priceTxt: {
    color: "#FFFFFF",
    fontFamily: FONT.bold,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  // ✅ toggle wrap (from sx)
  toggleWrap: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    shadowColor: "#0B1220",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },

  // ----- meta -----
  metaGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  metaCell: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E6EAF2",
  },
  metaLabel: {
    color: "#94A3B8",
    fontFamily: FONT.medium,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  metaValue: {
    marginTop: 6,
    color: "#0F172A",
    fontFamily: FONT.demi,
    fontSize: 12,
  },

  // ----- empty / errors -----
  empty: {
    marginTop: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAF2",
    shadowColor: "#0B1220",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 1,
  },
  emptyTitle: {
    color: "#0F172A",
    fontFamily: FONT.bold,
    fontSize: 16,
  },
  emptySub: {
    marginTop: 6,
    color: "#64748B",
    fontFamily: FONT.regular,
    fontSize: 13,
    lineHeight: 18,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  muted: { color: "#64748B", fontFamily: FONT.medium },
  err: { color: "#DC2626", fontFamily: FONT.bold, textAlign: "center" },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#0F172A",
  },
  retryTxt: { color: "#FFFFFF", fontFamily: FONT.bold },
});
