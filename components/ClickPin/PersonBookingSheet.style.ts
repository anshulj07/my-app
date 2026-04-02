import { Platform, StyleSheet } from "react-native";


export const styles = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)" },

  shell: {
    position: "absolute",
    left: 8,
    right: 8,
    top: Platform.OS === "ios" ? 56 : 28,
    bottom: 18,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#060913",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 16, marginBottom: 12 },
  closePill: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  closePillText: { color: "rgba(226,232,240,0.9)", fontWeight: "900" },

  hero: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.10)",
  },

  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },

  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  miniBadgeText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  miniBadgeYou: { backgroundColor: "rgba(236,72,153,0.75)" },

  editPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  editPillPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  editPillText: { color: "rgba(226,232,240,0.95)", fontWeight: "900", fontSize: 12 },

  toneFree: { backgroundColor: "rgba(34,197,94,0.78)" },
  toneService: { backgroundColor: "rgba(139,92,246,0.78)" },
  toneActive: { backgroundColor: "rgba(59,130,246,0.78)" },
  tonePaused: { backgroundColor: "rgba(245,158,11,0.78)" },
  toneMuted: { backgroundColor: "rgba(148,163,184,0.55)" },

  heroMain: { marginTop: 14 },
  emojiHalo: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  emoji: { fontSize: 28 },

  heroTitle: { marginTop: 12, color: "#E2E8F0", fontWeight: "950" as any, fontSize: 20, letterSpacing: 0.2 },
  heroSub: { marginTop: 6, color: "rgba(226,232,240,0.70)", fontWeight: "700", lineHeight: 18 },

  heroChips: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 12 },
  bigChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },
  bigChipAccent: {
    backgroundColor: "rgba(10,132,255,0.85)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  bigChipText: { color: "rgba(226,232,240,0.92)", fontWeight: "900", fontSize: 13 },

  body: { padding: 14 },

  creatorRow: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.10)",
  },
  creatorRowPressed: { backgroundColor: "rgba(255,255,255,0.06)" },

  creatorAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },
  creatorAvatar: { width: "100%", height: "100%" },
  creatorAvatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },

  creatorRowName: { color: "#E2E8F0", fontWeight: "900", fontSize: 14 },
  creatorRowAbout: { marginTop: 4, color: "rgba(226,232,240,0.68)", fontWeight: "700", fontSize: 12, lineHeight: 16 },

  sectionCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.10)",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: "#E2E8F0", fontWeight: "950" as any, fontSize: 13 },
  sectionHint: { marginTop: 8, color: "rgba(226,232,240,0.64)", fontWeight: "700", fontSize: 12, lineHeight: 16 },

  linkText: { color: "rgba(10,132,255,0.95)", fontWeight: "900", fontSize: 12 },

  descText: { marginTop: 10, color: "rgba(226,232,240,0.82)", fontWeight: "700", fontSize: 13, lineHeight: 18 },

  grid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCard: {
    width: "48%",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.10)",
  },
  gridLabel: { color: "rgba(226,232,240,0.58)", fontWeight: "900", fontSize: 12 },
  gridValue: { marginTop: 6, color: "#E2E8F0", fontWeight: "900", fontSize: 13, lineHeight: 18 },

  ctaBar: { position: "absolute", left: 14, right: 14, bottom: 14, gap: 10 },
  cta: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(10,132,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ctaDisabled: { opacity: 0.55 },
  ctaPressed: { transform: [{ scale: 0.992 }], opacity: 0.96 },
  ctaGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    right: -140,
    top: -160,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  ctaText: { color: "#fff", fontWeight: "950" as any, fontSize: 15 },

  ctaGhost: {
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  ctaGhostPressed: { backgroundColor: "rgba(255,255,255,0.07)" },
  ctaGhostText: { color: "rgba(226,232,240,0.85)", fontWeight: "900" },

  ctaDelete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(248,113,113,0.07)",
    borderColor: "rgba(248,113,113,0.25)",
  },
  ctaDeleteText: { color: "#F87171", fontWeight: "900" as any },
  
  // Capacity Dashboard Styles
  capacityCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },
  capacityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  capacityLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  capacityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  capacityStatusText: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "900",
  },
  capacityStatusFull: {
    backgroundColor: "rgba(248,113,113,0.12)",
  },
  capacityStatusFullText: {
    color: "#F87171",
  },
  // ✅ Approval required badge styles
  capacityStatusApproval: {
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  capacityStatusApprovalText: {
    color: "#F59E0B",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0A84FF",
    borderRadius: 4,
  },
  capacityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  capacityJoinedText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "900",
  },
  capacityRemainingText: {
    color: "rgba(226,232,240,0.5)",
    fontSize: 11,
    fontWeight: "700",
  },
  
  // Pending Approval Banner
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.22)",
  },
  pendingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBannerTitle: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "900",
  },
  pendingBannerSub: {
    color: "rgba(245,158,11,0.7)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
});