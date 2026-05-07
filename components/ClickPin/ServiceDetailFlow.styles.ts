import { StyleSheet, Dimensions, Platform } from "react-native";

const { height: H, width: W } = Dimensions.get("window");

export const C = {
  bg: "#FFFFFF",
  purple: "#7C4DFF",
  purpleBg: "#F0EEFF",
  purpleSoft: "rgba(124,77,255,0.08)",
  border: "#F0F0F0",
  text: "#1A1A1A",
  muted: "#757575",
  ink2: "#2C2C2C",
  white: "#FFFFFF",
  overlay: "rgba(0,0,0,0.65)",
  greyLight: "#F5F5F5",
  success: "#4CAF50",
  amber: "#FFB300",
  error: "#F44336",
};

export const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "96%",
    backgroundColor: C.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: "600",
    color: C.muted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.greyLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Detail View
  photoContainer: {
    width: "100%",
    height: 320,
    position: "relative",
  },
  heroPhoto: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.purple,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    gap: 6,
    shadowColor: C.purple,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  verifiedText: {
    color: C.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  mainContent: {
    padding: 24,
  },
  profileName: {
    fontSize: 28,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  locationText: {
    fontSize: 15,
    color: C.muted,
    fontWeight: "500",
  },
  
  // Trust Signals
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F8FC",
    padding: 16,
    borderRadius: 20,
    marginTop: 24,
  },
  trustItem: {
    flex: 1,
    alignItems: "center",
  },
  trustVal: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
  },
  trustLabel: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
    marginTop: 2,
  },
  trustSep: {
    width: 1,
    height: 30,
    backgroundColor: "#DDD",
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 24,
  },

  headline: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
    lineHeight: 30,
    fontStyle: "italic",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  tagChip: {
    backgroundColor: C.purpleSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    color: C.ink2,
    lineHeight: 22,
    fontWeight: "400",
  },
  readMore: {
    color: C.purple,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },

  // Availability Grid
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
  },
  dayNameLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
  },

  // Reviews
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  viewAll: {
    color: C.purple,
    fontSize: 14,
    fontWeight: "700",
  },
  reviewCard: {
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewName: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },
  reviewStars: {
    fontSize: 12,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: C.muted,
  },
  reviewText: {
    fontSize: 14,
    color: C.ink2,
    lineHeight: 20,
  },

  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  reportText: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "600",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerPrice: {
    fontSize: 22,
    fontWeight: "900",
    color: C.text,
  },
  footerPriceSub: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },
  bookBtn: {
    backgroundColor: C.purple,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: C.purple,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  bookBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "900",
  },

  // Common Step Styles
  stepContent: {
    padding: 24,
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: C.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  stepSub: {
    fontSize: 14,
    color: C.muted,
    marginBottom: 24,
    fontWeight: "500",
  },

  // Calendar
  calendarContainer: {
    backgroundColor: "#F9F9F9",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  weekDayLabel: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: C.muted,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 4,
  },
  dayCell: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 4,
  },
  dayCellSelected: {
    backgroundColor: C.purple,
  },
  dayCellDisabled: {
    backgroundColor: "transparent",
    opacity: 0.15,
  },
  dayCellText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DDD",
  },
  dayCellTextActive: {
    color: C.text,
  },
  dayCellTextSelected: {
    color: C.white,
  },
  availableDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.purple,
    position: "absolute",
    bottom: 6,
  },
  legend: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },

  // Time & Duration
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  durChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: C.greyLight,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  durChipSelected: {
    backgroundColor: C.purpleBg,
    borderColor: C.purple,
  },
  durText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },
  durTextSelected: {
    color: C.purple,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeChip: {
    width: "30.5%",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.greyLight,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  timeChipSelected: {
    backgroundColor: C.purple,
    borderColor: C.purple,
  },
  timeText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },
  timeTextSelected: {
    color: C.white,
  },
  errorBanner: {
    color: C.error,
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "#FFF5F5",
    padding: 12,
    borderRadius: 12,
  },

  pricePanel: {
    backgroundColor: "#F8F8FC",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: C.text,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceKey: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "500",
  },
  priceVal: {
    fontSize: 14,
    color: C.text,
    fontWeight: "700",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    marginTop: 8,
    paddingTop: 12,
  },
  totalKey: {
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: "900",
    color: C.purple,
  },

  // Confirm Step
  summaryCard: {
    backgroundColor: C.white,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  summaryProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  summaryAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.greyLight,
  },
  summaryName: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
  },
  summaryLoc: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "500",
    marginTop: 2,
  },
  summaryDetails: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryText: {
    fontSize: 15,
    color: C.ink2,
    fontWeight: "600",
  },
  contactInput: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    color: C.text,
    fontWeight: "600",
  },
  paymentBox: {
    marginTop: 32,
  },
  payLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: C.muted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  razorpayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    gap: 16,
  },
  rzpTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },
  rzpSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  escrowNotice: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: C.purpleSoft,
    padding: 16,
    borderRadius: 20,
    marginTop: 32,
  },
  escrowText: {
    flex: 1,
    fontSize: 13,
    color: C.purple,
    lineHeight: 18,
    fontWeight: "600",
  },

  // Success View
  successView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  confetti: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: C.text,
    textAlign: "center",
  },
  successSub: {
    fontSize: 16,
    color: C.muted,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
    marginBottom: 32,
  },
  nextSteps: {
    alignSelf: "stretch",
    backgroundColor: "#F8F8FC",
    padding: 24,
    borderRadius: 24,
    marginTop: 32,
  },
  nextTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: C.muted,
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: "center",
  },
  nextItem: {
    fontSize: 15,
    color: C.text,
    fontWeight: "700",
    marginBottom: 12,
  },
  successActions: {
    alignSelf: "stretch",
    gap: 12,
    marginTop: 40,
  },
  primaryAction: {
    backgroundColor: C.purple,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: C.white,
    fontSize: 17,
    fontWeight: "900",
  },
  secondaryAction: {
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#DDD",
  },
  secondaryActionText: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
  },

  // Footer Actions
  nextActionBtn: {
    backgroundColor: C.purple,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.purple,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  nextBtnDisabled: {
    backgroundColor: "#CCC",
    shadowOpacity: 0,
  },
  nextActionText: {
    color: C.white,
    fontSize: 18,
    fontWeight: "900",
  },
});
