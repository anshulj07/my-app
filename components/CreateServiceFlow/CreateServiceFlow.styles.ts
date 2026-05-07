import { StyleSheet, Dimensions, Platform } from "react-native";

const { height: H } = Dimensions.get("window");

export const C = {
  bg: "#FFFFFF",
  purple: "#7C4DFF",
  purpleBg: "#F0EEFF",
  purpleText: "#7C4DFF",
  border: "#E0E0E0",
  text: "#1A1A1A",
  muted: "#757575",
  progressBg: "#EEEEEE",
  white: "#FFFFFF",
  overlay: "rgba(0,0,0,0.5)",
  greyLight: "#F5F5F5",
  success: "#4CAF50",
  amber: "#FFB300",
  amberBg: "#FFF8E1",
  error: "#F44336",
  inputBorder: "#F0F0F0",
};

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: C.bg,
  },
  modal: {
    flex: 1,
    backgroundColor: C.bg,
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    marginLeft: 4,
    fontSize: 16,
    color: C.text,
    fontWeight: "600",
  },
  stepCount: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "500",
  },
  closeBtn: {
    padding: 4,
  },
  
  // Progress Bar
  progressContainer: {
    height: 6,
    backgroundColor: C.progressBg,
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: C.purple,
    borderRadius: 3,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: C.text,
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: C.muted,
    marginBottom: 24,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginVertical: 16,
  },

  // Form
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: C.text,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputWrapper: {
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: C.text,
    fontWeight: "600",
    padding: 16,
    backgroundColor: C.greyLight,
    borderRadius: 16,
    minHeight: 56,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  
  // Floating Label Input
  floatingContainer: {
    paddingTop: 12,
    marginBottom: 8,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 64,
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  inputBoxFocused: {
    borderColor: C.purple,
    borderWidth: 2,
  },
  inputBoxFilled: {
    borderColor: C.success,
    borderWidth: 2,
  },
  inputBoxError: {
    borderColor: C.error,
    borderWidth: 2,
  },
  labelBase: {
    position: 'absolute',
    left: 20,
    color: C.muted,
    fontWeight: '500',
    zIndex: 1,
  },
  labelFloating: {
    top: -12,
    left: 12,
    fontSize: 13,
    fontWeight: '700',
    color: C.purple,
    backgroundColor: C.white,
    paddingHorizontal: 6,
  },
  labelFloatingFilled: {
    color: C.success,
  },
  labelFloatingError: {
    color: C.error,
  },
  textInputFloating: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
    paddingTop: 6,
    textAlignVertical: 'center',
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },

  // Character Counter (Removed from Step 2, keeping for others if any)
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  counterText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },
  charBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginRight: 10,
    overflow: "hidden",
  },
  charBar: {
    height: "100%",
    backgroundColor: C.purple,
  },

  // Preview Card
  previewHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: C.muted,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  previewUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEE",
    marginRight: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
  },
  previewLocation: {
    fontSize: 14,
    color: C.muted,
    marginTop: 2,
  },
  previewHeadline: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    lineHeight: 26,
    marginBottom: 16,
  },
  previewPlaceholder: {
    color: "#CCC",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
  },

  // Step 3 Specific
  methodGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  methodCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    backgroundColor: C.white,
  },
  methodCardSelected: {
    borderColor: C.purple,
    backgroundColor: C.purpleBg,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  methodSub: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 16,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: C.purple,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.purple,
  },

  rateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.greyLight,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
    marginRight: 12,
  },
  rateInputSeparator: {
    width: 1,
    height: 24,
    backgroundColor: "#DDD",
    marginRight: 12,
  },
  rateInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    paddingVertical: 16,
  },

  quickFillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  quickFillChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  quickFillText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  hintBox: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    color: C.muted,
    lineHeight: 20,
    fontWeight: "500",
  },
  warningTip: {
    marginTop: 8,
    color: C.amber,
    fontSize: 13,
    fontWeight: "600",
  },

  // Step 4 Specific
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    borderWidth: 1.5,
    borderColor: "#EEE",
  },
  durationChipSelected: {
    backgroundColor: C.purple,
    borderColor: C.purple,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },
  durationTextSelected: {
    color: C.white,
  },

  scheduleList: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEE",
    overflow: "hidden",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  dayInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dayName: {
    width: 40,
    fontSize: 16,
    fontWeight: "600",
    color: C.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EEE",
  },
  statusDotActive: {
    backgroundColor: C.purple,
  },
  timeRange: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
  },
  timeRangeMuted: {
    color: C.muted,
    fontWeight: "500",
  },
  editTimeBtn: {
    padding: 8,
  },

  calendarToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  calendarToggleText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.purple,
  },
  calendarContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderRadius: 20,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekDayLabel: {
    width: 32,
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
  },
  dayCellToday: {
    backgroundColor: "#F0F0F0",
  },
  dayCellBlocked: {
    backgroundColor: "#333",
  },
  dayTextBlocked: {
    color: C.white,
  },
  dayCellOff: {
    backgroundColor: "#EEE",
  },
  dayTextOff: {
    color: "#AAA",
  },

  calendarLegend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },

  // Modal Sub-UI
  timeSheet: {
    backgroundColor: C.white,
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  timeSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  timeSheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
  },
  timePickerBox: {
    marginBottom: 20,
  },
  timePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.greyLight,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  timePickerText: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    marginLeft: 12,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  sheetBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnSecondary: {
    backgroundColor: C.greyLight,
  },
  sheetBtnPrimary: {
    backgroundColor: C.purple,
  },
  sheetBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },
  sheetBtnTextPrimary: {
    color: C.white,
  },

  // Step 1 Options
  optionsList: {
    gap: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    backgroundColor: C.white,
    position: "relative",
  },
  optionCardSelected: {
    borderColor: C.purple,
    backgroundColor: C.purpleBg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  optionSub: {
    fontSize: 14,
    color: C.muted,
    lineHeight: 18,
  },
  
  // Step 5
  locationSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.greyLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: C.text,
    marginLeft: 12,
  },
  currentLocBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 20,
    gap: 12,
  },
  currentLocText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.purple,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    gap: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontWeight: "600",
  },
  mapPreviewBox: {
    height: 200,
    borderRadius: 24,
    backgroundColor: "#EEE",
    overflow: "hidden",
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
  },
  priorityHint: {
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  priorityHintText: {
    flex: 1,
    fontSize: 13,
    color: C.muted,
    lineHeight: 18,
    fontWeight: "600",
  },
  checkCircle: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // Footer
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  continueBtn: {
    backgroundColor: C.purple,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueBtnDisabled: {
    backgroundColor: "#E0E0E0",
  },
  continueText: {
    color: C.white,
    fontSize: 18,
    fontWeight: "700",
  },

  // Banner Image
  bannerZone: {
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: C.purple + "44",
    backgroundColor: C.purpleBg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 24,
  },
  bannerZoneHasImage: {
    borderStyle: "solid",
    borderColor: C.purple + "88",
    borderWidth: 2,
  },
  bannerPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bannerPlaceholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: C.purple + "18",
    borderWidth: 2,
    borderColor: C.purple + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerPlaceholderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: C.purple,
  },
  bannerPlaceholderSub: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  bannerActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  bannerActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: C.purple,
  },
  bannerActionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.purple + "44",
  },
  bannerActionBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: C.white,
  },
  bannerActionBtnOutlineText: {
    fontSize: 14,
    fontWeight: "800",
    color: C.purple,
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  bannerOverlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  bannerOverlayBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: C.white,
  },
  bannerOverlayBtnDanger: {
    backgroundColor: "rgba(244,67,54,0.3)",
    borderColor: "rgba(244,67,54,0.4)",
  },
  bannerTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  bannerTipText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "500",
  },

  // Step 6 & Success
  checklistContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    gap: 16,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checklistIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.success + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  checklistText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
  },
  reviewNotice: {
    backgroundColor: C.amberBg,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: C.amber + "33",
  },
  reviewNoticeText: {
    flex: 1,
    fontSize: 14,
    color: C.amber,
    lineHeight: 20,
    fontWeight: "600",
  },
  editJumpBtn: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  editJumpText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.muted,
  },

  // Edit Menu
  editMenuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  editBox: {
    backgroundColor: C.white,
    borderRadius: 32,
    padding: 24,
  },
  editMenuTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  editMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  editMenuLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },

  // Success View Redesign
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: C.white,
  },
  successIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    position: 'relative',
  },
  successIconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: C.purple,
    opacity: 0.3,
    transform: [{ scale: 1.3 }],
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: C.text,
    textAlign: "center",
    marginBottom: 12,
  },
  successSub: {
    fontSize: 16,
    color: C.muted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  successCardPreview: {
    width: '100%',
    marginBottom: 40,
  },
  successPreviewLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.muted,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  miniCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 6 }
    })
  },
  successActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  shareBtnPremium: {
    flex: 1,
    backgroundColor: C.text,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareBtnTextPremium: {
    fontSize: 16,
    fontWeight: "700",
    color: C.white,
  },
  doneBtnPremium: {
    flex: 1.2,
    backgroundColor: C.purple,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnTextPremium: {
    fontSize: 18,
    fontWeight: "700",
    color: C.white,
  },
});
