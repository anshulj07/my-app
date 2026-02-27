import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.35)" },

  // ✅ totally new sheet layout
  sheet: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 100,
    bottom: 14,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 22 },
  emptyTitle: { color: "#0F172A", fontWeight: "900", fontSize: 16, marginBottom: 12 },

  // header
  header: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,42,0.07)",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.12)",
    marginBottom: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
  },
  headerCenter: { flex: 1, minWidth: 0 },
  headerKicker: { color: "rgba(22,101,52,0.85)", fontWeight: "900", fontSize: 12, letterSpacing: 0.2 },
  headerTitle: { marginTop: 2, color: "#0F172A", fontWeight: "950", fontSize: 16 },

  rightChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.03)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
  },
  rightChipEmoji: { fontSize: 22 },

  metaRow: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.03)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
  },
  metaPillStrong: {
    backgroundColor: "rgba(34,197,94,0.10)",
    borderColor: "rgba(34,197,94,0.22)",
  },
  metaText: { color: "rgba(15,23,42,0.74)", fontWeight: "900", fontSize: 12 },
  metaTextStrong: { color: "rgba(22,101,52,0.95)" },
  metaDot: { color: "rgba(15,23,42,0.35)", fontWeight: "900" },

  locationRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 12 },
  locationText: { flex: 1, color: "rgba(15,23,42,0.62)", fontWeight: "700", lineHeight: 18 },

  body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },

  // cards
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  cardTitle: { color: "#0F172A", fontWeight: "950", fontSize: 13 },
  cardHint: { marginTop: 8, color: "rgba(15,23,42,0.55)", fontWeight: "700", fontSize: 12, lineHeight: 16 },
  cardBody: { marginTop: 10, color: "rgba(15,23,42,0.72)", fontWeight: "700", fontSize: 13, lineHeight: 19 },
  link: { color: "rgba(22,101,52,0.95)", fontWeight: "900", fontSize: 12 },

  greenDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: "#22C55E" },

  // creator
  creatorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(34,197,94,0.07)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.997 }] },

  creatorAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
  },
  creatorAvatar: { width: "100%", height: "100%" },
  creatorAvatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  creatorTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  creatorName: { color: "#0F172A", fontWeight: "950", fontSize: 14 },
  creatorAbout: { marginTop: 4, color: "rgba(15,23,42,0.62)", fontWeight: "700", fontSize: 12, lineHeight: 16 },

  // footer
  footer: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    gap: 10,
  },

  // ✅ attendees row (above join)
  attendeeRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  attendeeLeft: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  attendeeText: { color: "rgba(15,23,42,0.68)", fontWeight: "800", fontSize: 12 },

  avatarStack: { flexDirection: "row", alignItems: "center" },
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(34,197,94,0.10)",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarInitials: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarInitialsText: { color: "#166534", fontWeight: "950", fontSize: 11 },

  avatarMore: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  avatarMoreText: { color: "#FFFFFF", fontWeight: "950", fontSize: 11 },

  // buttons
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#16A34A",
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#16A34A",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryPressed: { transform: [{ scale: 0.994 }], opacity: 0.96 },
  primaryDisabled: { opacity: 0.55 },
  primaryText: { color: "#FFFFFF", fontWeight: "950", fontSize: 15 },

  secondaryBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryPressed: { backgroundColor: "rgba(15,23,42,0.02)" },
  secondaryBtnText: { color: "rgba(15,23,42,0.72)", fontWeight: "900" },
});
