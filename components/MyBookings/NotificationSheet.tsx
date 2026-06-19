
// // // components/MyBookings/NotificationSheet.tsx
// // // ✅ Shows EXACT moderatorNote from backend — no fake synthesis
// // // ✅ If real flags exist → show them with individual cards (expandable)
// // // ✅ If only moderatorNote → show it DIRECTLY as the reason
// // // ✅ Never empty — title-based fallback only as absolute last resort

// // import React, { useState, useRef } from "react";
// // import {
// //   View,
// //   Text,
// //   ScrollView,
// //   TouchableOpacity,
// //   StyleSheet,
// //   Platform,
// //   Modal,
// //   Image,
// //   ActivityIndicator,
// //   Animated,
// //   LayoutAnimation,
// //   UIManager,
// // } from "react-native";
// // import Ionicons from "@expo/vector-icons/Ionicons";
// // import { BlurView } from "expo-blur";
// // import { NotifItem } from "../../context/NotificationContext";

// // if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
// //   UIManager.setLayoutAnimationEnabledExperimental(true);
// // }

// // const C = {
// //   bg:          "#FFFFFF",
// //   bgSoft:      "#F8F7F4",
// //   bgMuted:     "#F1EFE8",
// //   ink:         "#1C1A17",
// //   ink2:        "#4A453E",
// //   muted:       "#8A8278",
// //   border:      "#EAE6DF",
// //   white:       "#FFFFFF",
// //   purple:      "#534AB7",
// //   purpleSoft:  "#EEEDFE",
// //   purpleText:  "#3C3489",
// //   amber:       "#EF9F27",
// //   amberSoft:   "#FAEEDA",
// //   amberText:   "#633806",
// //   amberBorder: "#FAC775",
// //   coral:       "#D85A30",
// //   coralSoft:   "#FAECE7",
// //   coralText:   "#993C1D",
// //   coralBorder: "#F5C4B3",
// //   green:       "#1D9E75",
// //   greenSoft:   "#E1F5EE",
// //   greenText:   "#0F6E56",
// //   greenBorder: "#9FE1CB",
// //   teal:        "#1D9E75",
// //   tealSoft:    "#E1F5EE",
// //   tealText:    "#085041",
// //   blueSoft:    "#E6F1FB",
// //   blueText:    "#185FA5",
// //   blueBorder:  "#B5D4F4",
// //   gray:        "#888780",
// //   graySoft:    "#F1EFE8",
// //   grayText:    "#5F5E5A",
// // };

// // type CategoryKey =
// //   | "safety" | "fraud" | "image" | "incomplete"
// //   | "pricing" | "venue" | "spam" | "approved";

// // const CATEGORY: Record<CategoryKey, {
// //   label: string; icon: string; iconColor: string;
// //   iconBg: string; badgeBg: string; badgeText: string;
// // }> = {
// //   safety:     { label: "Safety review",       icon: "shield",           iconColor: C.amberText, iconBg: C.amberSoft, badgeBg: C.amberSoft, badgeText: C.amberText },
// //   fraud:      { label: "Suspicious activity", icon: "alert-circle",     iconColor: C.coralText, iconBg: C.coralSoft, badgeBg: C.coralSoft, badgeText: C.coralText },
// //   image:      { label: "Image quality",       icon: "image",            iconColor: C.amberText, iconBg: C.amberSoft, badgeBg: C.amberSoft, badgeText: "#412402"   },
// //   incomplete: { label: "Incomplete details",  icon: "document-text",    iconColor: C.blueText,  iconBg: C.blueSoft,  badgeBg: C.blueSoft,  badgeText: C.blueText  },
// //   pricing:    { label: "Pricing issue",       icon: "pricetag",         iconColor: C.coralText, iconBg: C.coralSoft, badgeBg: C.coralSoft, badgeText: C.coralText },
// //   venue:      { label: "Venue verification",  icon: "location",         iconColor: C.tealText,  iconBg: C.tealSoft,  badgeBg: C.tealSoft,  badgeText: C.tealText  },
// //   spam:       { label: "Low quality content", icon: "warning",          iconColor: C.grayText,  iconBg: C.graySoft,  badgeBg: C.graySoft,  badgeText: C.grayText  },
// //   approved:   { label: "Approved",            icon: "checkmark-circle", iconColor: C.greenText, iconBg: C.greenSoft, badgeBg: C.greenSoft, badgeText: C.greenText },
// // };

// // const SEVERITY_CONFIG = {
// //   high:   { bg: C.coralSoft, text: C.coralText, border: C.coralBorder, dot: C.coral, label: "High priority" },
// //   medium: { bg: C.amberSoft, text: C.amberText, border: C.amberBorder, dot: C.amber, label: "Medium"        },
// //   low:    { bg: C.graySoft,  text: C.grayText,  border: "#D3D1C7",     dot: C.gray,  label: "Low"           },
// // };

// // // ─── Strip "AI Risk Score: XX/100 — " prefix ─────────────────────────────────
// // function cleanNote(note: string): string {
// //   return note.replace(/^AI Risk Score:\s*\d+\/100\s*[—–\-]\s*/i, "").trim();
// // }

// // // ─── Detect category from note/flag text ──────────────────────────────────────
// // function detectCategory(text: string): CategoryKey {
// //   const l = text.toLowerCase();
// //   if (
// //     l.includes("fraud") || l.includes("scam") || l.includes("crypto") ||
// //     l.includes("invest") || l.includes("bitcoin") || l.includes("financial return") ||
// //     l.includes("cash payment") || l.includes("trading") || l.includes("profit") ||
// //     l.includes("lakh") || l.includes("unrealistic")
// //   ) return "fraud";
// //   if (
// //     l.includes("nsfw") || l.includes("inappropriate") || l.includes("explicit") ||
// //     l.includes("frightening") || l.includes("violent") || l.includes("adult") ||
// //     l.includes("image") || l.includes("photo") || l.includes("banner") ||
// //     l.includes("placeholder") || l.includes("stock photo")
// //   ) return "image";
// //   if (
// //     l.includes("price") || l.includes("ticket") || l.includes("₹") ||
// //     l.includes("payment") || l.includes("expensive") || l.includes("overpriced")
// //   ) return "pricing";
// //   if (
// //     l.includes("venue") || l.includes("location") || l.includes("address") ||
// //     l.includes("generic location")
// //   ) return "venue";
// //   if (
// //     l.includes("description") || l.includes("vague") || l.includes("no details") ||
// //     l.includes("no description") || l.includes("unclear") || l.includes("incomplete")
// //   ) return "incomplete";
// //   if (
// //     l.includes("host") || l.includes("organizer") || l.includes("unverified") ||
// //     l.includes("legitimacy") || l.includes("identity") || l.includes("safety") ||
// //     l.includes("risk") || l.includes("suspicious") || l.includes("concern")
// //   ) return "safety";
// //   return "safety";
// // }

// // // ─── Last resort when nothing at all is available ────────────────────────────
// // function titleFallback(eventTitle: string): { reason: string; category: CategoryKey } {
// //   const t = (eventTitle || "").toLowerCase();
// //   if (
// //     t.includes("crypto") || t.includes("invest") || t.includes("bitcoin") ||
// //     t.includes("trading") || t.includes("profit") || t.includes("forex")
// //   ) return {
// //     reason: "This listing promotes financial investments or guaranteed returns. Such events are not allowed on our platform as they are a common fraud indicator.",
// //     category: "fraud",
// //   };
// //   return {
// //     reason: "This listing did not pass our automated review. Common reasons include: vague description, unverifiable venue, suspicious pricing, or content that violates community standards. Please review all details carefully and resubmit.",
// //     category: "safety",
// //   };
// // }

// // // ─── helpers ──────────────────────────────────────────────────────────────────
// // function timeAgo(iso: string) {
// //   const diff = Date.now() - new Date(iso).getTime();
// //   const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
// //   if (d > 0) return d === 1 ? "1d ago" : `${d}d ago`;
// //   if (h > 0) return h === 1 ? "1h ago" : `${h}h ago`;
// //   if (m > 0) return m === 1 ? "1m ago" : `${m}m ago`;
// //   return "Just now";
// // }

// // function SectionHeader({ label, count }: { label: string; count?: number }) {
// //   return (
// //     <View style={S.sectionHeader}>
// //       <Text style={S.sectionLabel}>{label}</Text>
// //       {count !== undefined && count > 0 && (
// //         <View style={S.sectionBadge}>
// //           <Text style={S.sectionBadgeText}>{count}</Text>
// //         </View>
// //       )}
// //     </View>
// //   );
// // }

// // // ─── RejectedCard ──────────────────────────────────────────────────────────────
// // function RejectedCard({
// //   item,
// //   onPressEvent,
// // }: {
// //   item: NotifItem;
// //   onPressEvent: (id: string) => void;
// // }) {
// //   const [expanded, setExpanded] = useState(false);
// //   const rotateAnim = useRef(new Animated.Value(0)).current;

// //   const hasRealFlags = Array.isArray(item.flags) && item.flags.length > 0;
// //   const hasNote      = !!(item.moderatorNote && item.moderatorNote.trim().length > 5);
// // const noteToShow = hasNote ? item.moderatorNote! : (item.message || item.moderatorNote || "");
// //   // ────────────────────────────────────────────────────────────────────────────
// //   // PRIORITY:
// //   //   1. Real AI flags from backend  → show each flag as a card
// //   //   2. moderatorNote exists        → show it DIRECTLY (just strip score prefix)
// //   //   3. Neither                     → title-based fallback
// //   // ────────────────────────────────────────────────────────────────────────────
// //   let mainReason  = "";
// //   let mainCat: CategoryKey = "safety";
// //   let flagCards: Array<{
// //     type: string; description: string;
// //     severity: "high" | "medium" | "low"; category: CategoryKey;
// //   }> = [];

// //   if (hasRealFlags) {
// //     flagCards = item.flags!.map(f => ({
// //       type: f.type.replace(/^\[.*?\]\s*/i, "").trim(),
// //       description: f.description?.trim() || f.type,
// //       severity: (f.severity as "high" | "medium" | "low") ?? "medium",
// //       category: detectCategory(f.type + " " + (f.description || "")),
// //     }));
// //     const top  = flagCards.find(f => f.severity === "high") ?? flagCards[0];
// //     mainReason = top.description;
// //     mainCat    = top.category;

// //   } else if (hasNote) {
// //     // ── DIRECT: moderatorNote as-is (strip score prefix) ──
// //     mainReason = cleanNote(item.moderatorNote!);
// //     mainCat    = detectCategory(mainReason);
// //     // No flag cards — the note IS the full reason

// //   } 
// //   else if (item.message && item.message.trim().length > 20) {
// //   // ← YEH ADD KAR — message field use karo fallback ke roop mein
// //   mainReason = item.message.trim();
// //   mainCat = detectCategory(mainReason);
// // }
// // else {
// //     const fb   = titleFallback(item.eventTitle);
// //     mainReason = fb.reason;
// //     mainCat    = fb.category;
// //   }
// // console.log("NOTIF DEBUG:", {
// //   id: item.id,
// //   moderatorNote: item.moderatorNote,
// //   message: item.message,
// //   flags: item.flags,
// //   eventTitle: item.eventTitle,
// // });
// //   const catCfg = CATEGORY[mainCat];

// //   const toggle = () => {
// //     LayoutAnimation.configureNext({
// //       duration: 260,
// //       create: { type: "easeInEaseOut", property: "opacity" },
// //       update: { type: "easeInEaseOut" },
// //     });
// //     Animated.timing(rotateAnim, {
// //       toValue: expanded ? 0 : 1,
// //       duration: 220,
// //       useNativeDriver: true,
// //     }).start();
// //     setExpanded(v => !v);
// //   };

// //   const rotate = rotateAnim.interpolate({
// //     inputRange: [0, 1],
// //     outputRange: ["0deg", "180deg"],
// //   });

// //   return (
// //     <View style={S.card}>
// //       <View style={[S.cardAccent, { backgroundColor: C.coral }]} />
// //       <View style={S.cardBody}>

// //         {/* Header */}
// //         <View style={S.cardHeader}>
// //           <View style={[S.iconWrap, { backgroundColor: catCfg.iconBg }]}>
// //             <Ionicons name={catCfg.icon as any} size={18} color={catCfg.iconColor} />
// //           </View>
// //           <View style={S.cardMeta}>
// //             <View style={S.titleRow}>
// //               <Text style={S.eventTitle} numberOfLines={1}>
// //                 {item.eventEmoji} {item.eventTitle}
// //               </Text>
// //               <View style={[S.statusPill, { backgroundColor: C.coralSoft }]}>
// //                 <Text style={[S.statusPillText, { color: C.coralText }]}>Rejected</Text>
// //               </View>
// //             </View>
// //             <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
// //             <View style={[S.categoryBadge, { backgroundColor: catCfg.badgeBg }]}>
// //               <Ionicons name={catCfg.icon as any} size={10} color={catCfg.badgeText} />
// //               <Text style={[S.categoryBadgeText, { color: catCfg.badgeText }]}>
// //                 {catCfg.label}
// //               </Text>
// //             </View>
// //           </View>
// //           {!item.moderationRead && <View style={S.unreadDot} />}
// //         </View>

// //         {/* Rejection reason label */}
// //         <Text style={S.reasonLabel}>REJECTION REASON</Text>

// //         {/* Main reason — always shown */}
// //         <Text style={S.mainReason}>{mainReason}</Text>

// //         {/* Expandable detail cards — only when real AI flags AND multiple */}
// //         {hasRealFlags && flagCards.length > 1 && (
// //           <>
// //             <TouchableOpacity style={S.expandBtn} onPress={toggle} activeOpacity={0.7}>
// //               <Text style={S.expandBtnText}>
// //                 {expanded ? "Hide details" : `See all ${flagCards.length} issues`}
// //               </Text>
// //               <Animated.View style={{ transform: [{ rotate }] }}>
// //                 <Ionicons name="chevron-down" size={14} color={C.purple} />
// //               </Animated.View>
// //             </TouchableOpacity>

// //             {expanded && (
// //               <View style={S.expandedSection}>
// //                 <View style={S.divider} />
// //                 <Text style={S.detailLabel}>{flagCards.length} issues found</Text>
// //                 {flagCards.map((flag, idx) => {
// //                   const sev        = SEVERITY_CONFIG[flag.severity] ?? SEVERITY_CONFIG.medium;
// //                   const flagCatCfg = CATEGORY[flag.category];
// //                   return (
// //                     <View
// //                       key={idx}
// //                       style={[S.flagCard, { borderLeftColor: sev.dot, backgroundColor: sev.bg }]}
// //                     >
// //                       <View style={S.flagTopRow}>
// //                         <View style={[S.flagIconWrap, { backgroundColor: flagCatCfg.iconBg }]}>
// //                           <Ionicons
// //                             name={flagCatCfg.icon as any}
// //                             size={13}
// //                             color={flagCatCfg.iconColor}
// //                           />
// //                         </View>
// //                         <Text style={S.flagName}>{flag.type}</Text>
// //                         <View style={[S.sevBadge, { backgroundColor: "rgba(0,0,0,0.06)" }]}>
// //                           <Text style={[S.sevBadgeText, { color: sev.text }]}>{sev.label}</Text>
// //                         </View>
// //                       </View>
// //                       <Text style={[S.flagDesc, { color: sev.text }]}>{flag.description}</Text>
// //                     </View>
// //                   );
// //                 })}
// //               </View>
// //             )}
// //           </>
// //         )}

// //         {/* How to fix */}
// //         <View style={[S.fixBox, { marginTop: 12 }]}>
// //           <Ionicons
// //             name="construct-outline"
// //             size={14}
// //             color={C.amberText}
// //             style={{ marginTop: 1 }}
// //           />
// //           <View style={{ flex: 1 }}>
// //             <Text style={S.fixTitle}>HOW TO FIX AND RESUBMIT</Text>
// //             <Text style={S.fixText}>
// //               Fix the issue above, update your listing details, and resubmit for review.
// //               Our team reviews all resubmissions within 24 hours.
// //             </Text>
// //           </View>
// //         </View>

// //       </View>
// //     </View>
// //   );
// // }

// // // ─── ApprovedCard ──────────────────────────────────────────────────────────────
// // // ─── ApprovedCard ──────────────────────────────────────────────────────────────
// // function ApprovedCard({ item, onPressEvent }: { item: NotifItem; onPressEvent: (id: string) => void; }) {
// //   const isService = item.eventEmoji === "🛠️";
// //   const hasWarnings = item.approvalStatus === "approved_with_warnings" &&
// //     ((item.moderatorNote && item.moderatorNote.trim().length > 5) ||
// //      (Array.isArray(item.flags) && item.flags.length > 0));

// //   return (
// //     <TouchableOpacity style={S.card} onPress={() => item.eventId && onPressEvent(item.eventId)} activeOpacity={0.88}>
// //       <View style={[S.cardAccent, { backgroundColor: hasWarnings ? C.amber : C.green }]} />
// //       <View style={S.cardBody}>

// //         {/* Header */}
// //         <View style={S.cardHeader}>
// //           <View style={[S.iconWrap, { backgroundColor: hasWarnings ? C.amberSoft : C.greenSoft }]}>
// //             <Ionicons name={hasWarnings ? "warning" : "checkmark-circle"} size={18} color={hasWarnings ? C.amberText : C.greenText} />
// //           </View>
// //           <View style={S.cardMeta}>
// //             <View style={S.titleRow}>
// //               <Text style={S.eventTitle} numberOfLines={1}>{item.eventEmoji} {item.eventTitle}</Text>
// //               <View style={[S.statusPill, { backgroundColor: hasWarnings ? C.amberSoft : C.greenSoft }]}>
// //                 <Text style={[S.statusPillText, { color: hasWarnings ? C.amberText : C.greenText }]}>
// //                   {hasWarnings ? "Live ⚠️" : "Approved"}
// //                 </Text>
// //               </View>
// //             </View>
// //             <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
// //             <View style={[S.categoryBadge, { backgroundColor: hasWarnings ? C.amberSoft : C.tealSoft }]}>
// //               <Ionicons name="rocket-outline" size={10} color={hasWarnings ? C.amberText : C.tealText} />
// //               <Text style={[S.categoryBadgeText, { color: hasWarnings ? C.amberText : C.tealText }]}>Now live</Text>
// //             </View>
// //           </View>
// //         </View>

// //         {/* Live status box */}
// //         <View style={[S.approvedBox, hasWarnings && { backgroundColor: C.amberSoft, borderColor: C.amberBorder }]}>
// //           <Ionicons
// //             name={hasWarnings ? "alert-circle-outline" : "rocket-outline"}
// //             size={15} color={hasWarnings ? C.amberText : C.greenText}
// //             style={{ marginTop: 1, flexShrink: 0 }}
// //           />
// //           <Text style={[S.approvedText, hasWarnings && { color: C.amberText }]}>
// //             {hasWarnings
// //               ? `Your ${isService ? "service" : "event"} is live but needs improvement to avoid future rejection.`
// //               : `Your ${isService ? "service" : "event"} is now discoverable on MyApp. Community members can find and join it.`
// //             }
// //           </Text>
// //         </View>

// //         {/* Warning suggestions */}
// //         {hasWarnings && item.moderatorNote && item.moderatorNote.trim().length > 5 && (
// //           <View style={S.warnBox}>
// //             <Text style={S.warnTitle}>💡 WHAT TO IMPROVE</Text>
// //             <Text style={S.warnText}>{item.moderatorNote}</Text>
// //           </View>
// //         )}

// //         {/* Individual flag cards */}
// //         {hasWarnings && Array.isArray(item.flags) && item.flags.length > 0 && (
// //           <View style={{ marginTop: 8 }}>
// //             {item.flags.slice(0, 3).map((flag, idx) => (
// //               <View key={idx} style={S.warnFlagRow}>
// //                 <Ionicons name="information-circle-outline" size={13} color={C.amberText} />
// //                 <Text style={S.warnFlagText}>
// //                   <Text style={{ fontWeight: "700" }}>{flag.type}: </Text>
// //                   {flag.description}
// //                 </Text>
// //               </View>
// //             ))}
// //           </View>
// //         )}

// //         {/* Risk score */}
// //         {item.riskScore != null && (
// //           <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 4 }}>
// //             <Text style={{ fontSize: 10, color: C.muted, fontWeight: "600" }}>AI Risk Score: </Text>
// //             <Text style={{ fontSize: 11, fontWeight: "800", color: item.riskScore >= 50 ? C.amberText : C.greenText }}>
// //               {item.riskScore}/100
// //             </Text>
// //           </View>
// //         )}

// //         <View style={S.actionsRow}>
// //           <TouchableOpacity style={[S.btnPrimaryGreen, hasWarnings && { backgroundColor: C.amber }]} activeOpacity={0.85}>
// //             <Ionicons name="eye-outline" size={14} color={C.white} />
// //             <Text style={S.btnPrimaryText}>View {isService ? "service" : "event"}</Text>
// //           </TouchableOpacity>
// //           <TouchableOpacity style={[S.btnGhostGreen, hasWarnings && { backgroundColor: C.amberSoft, borderColor: C.amberBorder }]} activeOpacity={0.8}>
// //             <Ionicons name="share-social-outline" size={14} color={hasWarnings ? C.amberText : C.greenText} />
// //             <Text style={[S.btnGhostText, { color: hasWarnings ? C.amberText : C.greenText }]}>Share</Text>
// //           </TouchableOpacity>
// //         </View>

// //       </View>
// //     </TouchableOpacity>
// //   );
// // }

// // // ─── JoinRequestCard ───────────────────────────────────────────────────────────
// // function JoinRequestCard({
// //   item, onAdmit, onReject, admitBusy,
// // }: {
// //   item: NotifItem;
// //   onAdmit: (item: NotifItem) => void;
// //   onReject: (item: NotifItem) => void;
// //   admitBusy: Record<string, boolean>;
// // }) {
// //   const admitKey  = `${item.id}-admit`;
// //   const rejectKey = `${item.id}-reject`;
// //   const busy = !!(admitBusy[admitKey] || admitBusy[rejectKey]);
// //   return (
// //     <View style={S.card}>
// //       <View style={[S.cardAccent, { backgroundColor: C.purple }]} />
// //       <View style={S.cardBody}>
// //         <View style={S.joinRow}>
// //           {item.userImageUrl
// //             ? <Image source={{ uri: item.userImageUrl }} style={S.avatar} />
// //             : <View style={S.avatarFallback}>
// //                 <Text style={S.avatarLetter}>{(item.userName || "?")[0].toUpperCase()}</Text>
// //               </View>
// //           }
// //           <View style={{ flex: 1 }}>
// //             <Text style={S.joinText}>
// //               <Text style={S.joinBold}>{item.userName}</Text>
// //               <Text style={S.joinMuted}> wants to join </Text>
// //               <Text style={S.joinEvent}>{item.eventEmoji} {item.eventTitle}</Text>
// //             </Text>
// //             <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
// //           </View>
// //         </View>
// //         {!!item.message && (
// //           <View style={S.msgBox}>
// //             <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.muted} />
// //             <Text style={S.msgText}>"{item.message}"</Text>
// //           </View>
// //         )}
// //         <View style={S.joinActionsRow}>
// //           <TouchableOpacity
// //             onPress={() => onAdmit(item)}
// //             disabled={busy}
// //             style={[S.btnPrimary, busy && S.btnDisabled, { flex: 1 }]}
// //             activeOpacity={0.85}
// //           >
// //             {admitBusy[admitKey]
// //               ? <ActivityIndicator color={C.white} size="small" />
// //               : <><Ionicons name="checkmark" size={15} color={C.white} /><Text style={S.btnPrimaryText}>Admit</Text></>
// //             }
// //           </TouchableOpacity>
// //           <TouchableOpacity
// //             onPress={() => onReject(item)}
// //             disabled={busy}
// //             style={[S.btnSecondary, busy && S.btnDisabled, { flex: 1 }]}
// //             activeOpacity={0.8}
// //           >
// //             {admitBusy[rejectKey]
// //               ? <ActivityIndicator color={C.muted} size="small" />
// //               : <><Ionicons name="close" size={15} color={C.ink2} /><Text style={S.btnSecondaryText}>Decline</Text></>
// //             }
// //           </TouchableOpacity>
// //         </View>
// //       </View>
// //     </View>
// //   );
// // }

// // // ─── ActivityRow ───────────────────────────────────────────────────────────────
// // function ActivityRow({
// //   item,
// //   onPressEvent,
// // }: {
// //   item: NotifItem;
// //   onPressEvent: (id: string) => void;
// // }) {
// //   return (
// //     <TouchableOpacity
// //       style={S.activityRow}
// //       onPress={() => onPressEvent(item.eventId)}
// //       activeOpacity={0.7}
// //     >
// //       {item.userImageUrl
// //         ? <Image source={{ uri: item.userImageUrl }} style={S.activityAvatar} />
// //         : <View style={S.activityAvatarFallback}>
// //             <Text style={S.activityAvatarLetter}>{(item.userName || "?")[0].toUpperCase()}</Text>
// //           </View>
// //       }
// //       <View style={{ flex: 1 }}>
// //         <Text style={S.activityText} numberOfLines={2}>
// //           <Text style={S.joinBold}>{item.userName}</Text>
// //           <Text style={S.joinMuted}> joined </Text>
// //           <Text style={S.joinEvent}>{item.eventEmoji} {item.eventTitle}</Text>
// //         </Text>
// //         <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
// //       </View>
// //       <View style={S.joinedBadge}>
// //         <Text style={S.joinedBadgeText}>Joined</Text>
// //       </View>
// //     </TouchableOpacity>
// //   );
// // }

// // // ─── Tabs ──────────────────────────────────────────────────────────────────────
// // type TabKey = "all" | "pending" | "approved" | "rejected" | "safety";
// // const TABS: { key: TabKey; label: string }[] = [
// //   { key: "all",      label: "All"           },
// //   { key: "pending",  label: "Pending"       },
// //   { key: "approved", label: "Approved"      },
// //   { key: "rejected", label: "Rejected"      },
// //   { key: "safety",   label: "Safety alerts" },
// // ];

// // // ─── Main export ───────────────────────────────────────────────────────────────
// // export default function NotificationSheet({
// //   visible, onClose, items, loading, admitBusy,
// //   onAdmit, onReject, onPressEvent, onMarkRead,
// // }: {
// //   visible: boolean;
// //   onClose: () => void;
// //   items: NotifItem[];
// //   loading: boolean;
// //   admitBusy: Record<string, boolean>;
// //   onAdmit: (item: NotifItem) => void;
// //   onReject: (item: NotifItem) => void;
// //   onPressEvent: (eventId: string) => void;
// //   onMarkRead: () => void;
// // }) {
// //   const [activeTab, setActiveTab] = useState<TabKey>("all");

// //   const pending  = items.filter(i => i.type === "pending");
// //   const joined   = items.filter(i => i.type === "joined");
// //   const approved = items.filter(i => i.type === "moderation_approved");
// //   const rejected = items.filter(i => i.type === "moderation_rejected");

// //   const safetyAlerts = rejected.filter(i => {
// //     const note  = (i.moderatorNote || "").toLowerCase();
// //     const title = (i.eventTitle || "").toLowerCase();
// //     if (Array.isArray(i.flags) && i.flags.length > 0) {
// //       const cat = detectCategory(i.flags![0].type + " " + (i.flags![0].description || ""));
// //       return cat === "safety" || cat === "fraud";
// //     }
// //     return (
// //       note.includes("fraud") || note.includes("scam") ||
// //       note.includes("safety") || note.includes("suspicious") ||
// //       note.includes("crypto") || note.includes("invest") ||
// //       note.includes("financial return") || note.includes("cash payment") ||
// //       title.includes("crypto") || title.includes("invest") || title.includes("bitcoin")
// //     );
// //   });

// //   const filterItems = (tab: TabKey) => {
// //     switch (tab) {
// //       case "pending":  return { pending, approved: [],       rejected: [],          joined: [] };
// //       case "approved": return { pending: [], approved,       rejected: [],          joined     };
// //       case "rejected": return { pending: [], approved: [],   rejected,              joined: [] };
// //       case "safety":   return { pending: [], approved: [],   rejected: safetyAlerts, joined: [] };
// //       default:         return { pending, approved,           rejected,              joined     };
// //     }
// //   };

// //   const { pending: fp, approved: fa, rejected: fr, joined: fj } = filterItems(activeTab);
// //   const totalUnread = items.filter(
// //     i => (i.type === "moderation_rejected" || i.type === "moderation_approved") && !i.moderationRead
// //   ).length;

// //   return (
// //     <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
// //       <View style={S.root}>
// //         <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={onClose} />
// //         <BlurView intensity={Platform.OS === "ios" ? 95 : 110} tint="light" style={S.sheet}>

// //           <View style={S.grabber} />

// //           <View style={S.header}>
// //             <View style={S.headerMain}>
// //               <View>
// //                 <Text style={S.headerTitle}>Notifications</Text>
// //                 <Text style={S.headerSub}>{items.length} updates</Text>
// //               </View>
// //               <View style={S.headerActions}>
// //                 {totalUnread > 0 && (
// //                   <TouchableOpacity style={S.markReadBtn} onPress={onMarkRead} activeOpacity={0.7}>
// //                     <Text style={S.markReadText}>Mark all read</Text>
// //                   </TouchableOpacity>
// //                 )}
// //                 <TouchableOpacity style={S.closeBtn} onPress={onClose} activeOpacity={0.7}>
// //                   <Ionicons name="close" size={18} color={C.muted} />
// //                 </TouchableOpacity>
// //               </View>
// //             </View>
// //             <ScrollView
// //               horizontal
// //               showsHorizontalScrollIndicator={false}
// //               contentContainerStyle={S.tabsContainer}
// //               style={S.tabsScroll}
// //             >
// //               {TABS.map(tab => (
// //                 <TouchableOpacity
// //                   key={tab.key}
// //                   style={[S.tab, activeTab === tab.key && S.tabActive]}
// //                   onPress={() => setActiveTab(tab.key)}
// //                   activeOpacity={0.75}
// //                 >
// //                   <Text style={[S.tabText, activeTab === tab.key && S.tabTextActive]}>
// //                     {tab.label}
// //                   </Text>
// //                   {tab.key === "safety" && safetyAlerts.length > 0 && (
// //                     <View style={S.tabBadge}>
// //                       <Text style={S.tabBadgeText}>{safetyAlerts.length}</Text>
// //                     </View>
// //                   )}
// //                   {tab.key === "pending" && pending.length > 0 && (
// //                     <View style={S.tabBadge}>
// //                       <Text style={S.tabBadgeText}>{pending.length}</Text>
// //                     </View>
// //                   )}
// //                 </TouchableOpacity>
// //               ))}
// //             </ScrollView>
// //           </View>

// //           <ScrollView
// //             showsVerticalScrollIndicator={false}
// //             contentContainerStyle={S.scrollContent}
// //           >
// //             {loading && (
// //               <View style={S.loadingWrap}>
// //                 <ActivityIndicator color={C.purple} size="large" />
// //                 <Text style={S.loadingText}>Loading notifications…</Text>
// //               </View>
// //             )}
// //             {!loading && items.length === 0 && (
// //               <View style={S.emptyWrap}>
// //                 <View style={S.emptyIconCircle}>
// //                   <Ionicons name="notifications-off-outline" size={28} color={C.muted} />
// //                 </View>
// //                 <Text style={S.emptyTitle}>All caught up</Text>
// //                 <Text style={S.emptySub}>
// //                   Join requests, activity, and moderation decisions will appear here.
// //                 </Text>
// //               </View>
// //             )}

// //             {fr.length > 0 && (
// //               <View style={S.section}>
// //                 <SectionHeader
// //                   label="Needs attention"
// //                   count={fr.filter(i => !i.moderationRead).length}
// //                 />
// //                 {fr.map(item => (
// //                   <RejectedCard key={item.id} item={item} onPressEvent={onPressEvent} />
// //                 ))}
// //               </View>
// //             )}
// //             {fa.length > 0 && (
// //               <View style={S.section}>
// //                 <SectionHeader label="Good news" />
// //                 {fa.map(item => (
// //                   <ApprovedCard key={item.id} item={item} onPressEvent={onPressEvent} />
// //                 ))}
// //               </View>
// //             )}
// //             {fp.length > 0 && (
// //               <View style={S.section}>
// //                 <SectionHeader label="Join requests" count={fp.length} />
// //                 {fp.map(item => (
// //                   <JoinRequestCard
// //                     key={item.id}
// //                     item={item}
// //                     onAdmit={onAdmit}
// //                     onReject={onReject}
// //                     admitBusy={admitBusy}
// //                   />
// //                 ))}
// //               </View>
// //             )}
// //             {fj.length > 0 && (
// //               <View style={S.section}>
// //                 <SectionHeader label="Recent activity" />
// //                 <View style={S.activityContainer}>
// //                   {fj.map(item => (
// //                     <ActivityRow key={item.id} item={item} onPressEvent={onPressEvent} />
// //                   ))}
// //                 </View>
// //               </View>
// //             )}
// //           </ScrollView>

// //         </BlurView>
// //       </View>
// //     </Modal>
// //   );
// // }

// // const S = StyleSheet.create({
// //   root:     { flex: 1, justifyContent: "flex-end" },
// //   backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.48)" },
// //   sheet: {
// //     height: "93%",
// //     backgroundColor: "rgba(255,255,255,0.9)",
// //     borderTopLeftRadius: 28,
// //     borderTopRightRadius: 28,
// //     overflow: "hidden",
// //   },
// //   grabber: {
// //     width: 36, height: 4, borderRadius: 2,
// //     backgroundColor: "rgba(0,0,0,0.12)",
// //     alignSelf: "center", marginTop: 12, marginBottom: 4,
// //   },
// //   header: {
// //     paddingHorizontal: 20, paddingBottom: 0,
// //     borderBottomWidth: 0.5, borderBottomColor: C.border,
// //   },
// //   headerMain: {
// //     flexDirection: "row", alignItems: "flex-start",
// //     justifyContent: "space-between", paddingVertical: 12,
// //   },
// //   headerTitle: { fontSize: 24, fontWeight: "700", color: C.ink, letterSpacing: -0.3 },
// //   headerSub:   { fontSize: 13, color: C.muted, fontWeight: "500", marginTop: 2 },
// //   headerActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
// //   markReadBtn: {
// //     paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
// //     backgroundColor: C.bgMuted, borderWidth: 0.5, borderColor: C.border,
// //   },
// //   markReadText: { fontSize: 12, fontWeight: "600", color: C.ink2 },
// //   closeBtn: {
// //     width: 34, height: 34, borderRadius: 17,
// //     backgroundColor: C.bgMuted, borderWidth: 0.5, borderColor: C.border,
// //     alignItems: "center", justifyContent: "center",
// //   },
// //   tabsScroll: { marginTop: 4 },
// //   tabsContainer: { paddingBottom: 12, paddingRight: 4, gap: 6, flexDirection: "row" },
// //   tab: {
// //     paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
// //     borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg,
// //     flexDirection: "row", alignItems: "center", gap: 6,
// //   },
// //   tabActive:     { backgroundColor: C.purple, borderColor: C.purple },
// //   tabText:       { fontSize: 12, fontWeight: "600", color: C.muted },
// //   tabTextActive: { color: C.purpleSoft },
// //   tabBadge: {
// //     backgroundColor: C.coral, paddingHorizontal: 6,
// //     paddingVertical: 1, borderRadius: 8, minWidth: 18, alignItems: "center",
// //   },
// //   tabBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
// //   scrollContent: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 12 },
// //   loadingWrap: { paddingVertical: 48, alignItems: "center", gap: 12 },
// //   loadingText: { fontSize: 14, color: C.muted, fontWeight: "500" },
// //   emptyWrap: { paddingVertical: 56, alignItems: "center" },
// //   emptyIconCircle: {
// //     width: 60, height: 60, borderRadius: 20,
// //     backgroundColor: C.bgMuted, alignItems: "center",
// //     justifyContent: "center", marginBottom: 16,
// //   },
// //   emptyTitle: { fontSize: 17, fontWeight: "700", color: C.ink, marginBottom: 6 },
// //   emptySub: {
// //     fontSize: 13, color: C.muted, textAlign: "center",
// //     paddingHorizontal: 36, lineHeight: 19,
// //   },
// //   section: { marginBottom: 28 },
// //   sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
// //   sectionLabel: {
// //     fontSize: 11, fontWeight: "700", color: C.muted,
// //     letterSpacing: 0.8, textTransform: "uppercase",
// //   },
// //   sectionBadge: {
// //     backgroundColor: C.coralSoft, paddingHorizontal: 8,
// //     paddingVertical: 2, borderRadius: 10,
// //   },
// //   sectionBadgeText: { color: C.coralText, fontSize: 10, fontWeight: "700" },
// //   card: {
// //     backgroundColor: C.bg, borderRadius: 16, borderWidth: 0.5,
// //     borderColor: C.border, marginBottom: 10, flexDirection: "row",
// //     overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04,
// //     shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
// //   },
// //   cardAccent: { width: 4 },
// //   cardBody:   { flex: 1, padding: 14 },
// //   cardHeader: {
// //     flexDirection: "row", alignItems: "flex-start",
// //     gap: 12, marginBottom: 10,
// //   },
// //   iconWrap: {
// //     width: 38, height: 38, borderRadius: 10,
// //     alignItems: "center", justifyContent: "center", flexShrink: 0,
// //   },
// //   cardMeta:   { flex: 1, minWidth: 0 },
// //   titleRow: {
// //     flexDirection: "row", alignItems: "center",
// //     gap: 8, flexWrap: "wrap", marginBottom: 3,
// //   },
// //   eventTitle: { fontSize: 14, fontWeight: "600", color: C.ink, flex: 1 },
// //   statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
// //   statusPillText: { fontSize: 10, fontWeight: "600" },
// //   cardTime: { fontSize: 11, color: C.muted, fontWeight: "500", marginBottom: 6 },
// //   categoryBadge: {
// //     flexDirection: "row", alignItems: "center", gap: 5,
// //     alignSelf: "flex-start", paddingHorizontal: 9,
// //     paddingVertical: 3, borderRadius: 8,
// //   },
// //   categoryBadgeText: { fontSize: 10, fontWeight: "600" },
// //   unreadDot: {
// //     width: 8, height: 8, borderRadius: 4,
// //     backgroundColor: C.purple, flexShrink: 0, marginTop: 6,
// //   },
// //   // ── Reason display ──
// //   reasonLabel: {
// //     fontSize: 9, fontWeight: "700", color: C.muted,
// //     letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6,
// //   },
// //   mainReason: {
// //     fontSize: 13, color: C.ink2, lineHeight: 20, marginBottom: 10,
// //   },
// //   expandBtn: {
// //     flexDirection: "row", alignItems: "center",
// //     gap: 5, alignSelf: "flex-start", marginBottom: 4,
// //   },
// //   expandBtnText: { fontSize: 12, fontWeight: "600", color: C.purple },
// //   expandedSection: { marginTop: 4 },
// //   divider: { height: 0.5, backgroundColor: C.border, marginVertical: 12 },
// //   detailLabel: {
// //     fontSize: 10, fontWeight: "700", color: C.muted,
// //     letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8,
// //   },
// //   flagCard: {
// //     borderLeftWidth: 3, borderRadius: 0,
// //     borderTopRightRadius: 8, borderBottomRightRadius: 8,
// //     padding: 10, marginBottom: 8,
// //   },
// //   flagTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
// //   flagIconWrap: {
// //     width: 24, height: 24, borderRadius: 7,
// //     alignItems: "center", justifyContent: "center", flexShrink: 0,
// //   },
// //   flagName:     { flex: 1, fontSize: 12, fontWeight: "600", color: C.ink },
// //   sevBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
// //   sevBadgeText: { fontSize: 9, fontWeight: "700" },
// //   flagDesc:     { fontSize: 13, lineHeight: 19, paddingLeft: 32 },
// //   fixBox: {
// //     flexDirection: "row", gap: 10, alignItems: "flex-start",
// //     backgroundColor: C.amberSoft, borderRadius: 10, padding: 12,
// //     borderWidth: 0.5, borderColor: C.amberBorder,
// //   },
// //   fixTitle: {
// //     fontSize: 10, fontWeight: "700", color: C.amberText,
// //     letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4,
// //   },
// //   fixText: { fontSize: 12, color: C.amberText, lineHeight: 17, fontWeight: "500" },
// //   approvedBox: {
// //     flexDirection: "row", gap: 10, alignItems: "flex-start",
// //     backgroundColor: C.greenSoft, borderRadius: 10, padding: 12,
// //     borderWidth: 0.5, borderColor: C.greenBorder, marginVertical: 10,
// //   },
// //   approvedText: { flex: 1, fontSize: 13, color: C.greenText, lineHeight: 19, fontWeight: "500" },
// //   actionsRow:     { flexDirection: "row", gap: 8, flexWrap: "wrap" },
// //   joinActionsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
// //   btnPrimary: {
// //     flexDirection: "row", alignItems: "center", gap: 6,
// //     backgroundColor: C.purple, paddingHorizontal: 16,
// //     paddingVertical: 10, borderRadius: 10, justifyContent: "center",
// //   },
// //   btnPrimaryGreen: {
// //     flexDirection: "row", alignItems: "center", gap: 6,
// //     backgroundColor: C.green, paddingHorizontal: 16,
// //     paddingVertical: 10, borderRadius: 10, justifyContent: "center",
// //   },
// //   btnPrimaryText: { color: C.white, fontSize: 13, fontWeight: "700" },
// //   btnSecondary: {
// //     flexDirection: "row", alignItems: "center", gap: 6,
// //     backgroundColor: C.bg, paddingHorizontal: 16, paddingVertical: 10,
// //     borderRadius: 10, borderWidth: 0.5, borderColor: C.border, justifyContent: "center",
// //   },
// //   btnSecondaryText: { color: C.ink2, fontSize: 13, fontWeight: "600" },
// //   btnGhostGreen: {
// //     flexDirection: "row", alignItems: "center", gap: 6,
// //     backgroundColor: C.greenSoft, paddingHorizontal: 16, paddingVertical: 10,
// //     borderRadius: 10, borderWidth: 0.5, borderColor: C.greenBorder,
// //   },
// //   btnGhostText: { fontSize: 13, fontWeight: "600" },
// //   btnDisabled:  { opacity: 0.5 },
// //   joinRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 4 },
// //   avatar:       { width: 44, height: 44, borderRadius: 14, backgroundColor: C.bgSoft },
// //   avatarFallback: {
// //     width: 44, height: 44, borderRadius: 14,
// //     backgroundColor: C.purpleSoft, alignItems: "center", justifyContent: "center",
// //   },
// //   avatarLetter: { fontSize: 17, fontWeight: "700", color: C.purple },
// //   joinText:  { fontSize: 14, lineHeight: 21, flex: 1 },
// //   joinBold:  { fontWeight: "700", color: C.ink },
// //   joinMuted: { color: C.ink2, fontWeight: "500" },
// //   joinEvent: { color: C.purple, fontWeight: "700" },
// //   msgBox: {
// //     flexDirection: "row", gap: 8, alignItems: "flex-start",
// //     marginTop: 10, padding: 12, backgroundColor: C.bgSoft,
// //     borderRadius: 10, borderWidth: 0.5, borderColor: C.border,
// //   },
// //   msgText: { flex: 1, fontSize: 13, color: C.ink2, fontStyle: "italic", fontWeight: "500" },
// //   activityContainer: {
// //     backgroundColor: C.bg, borderRadius: 14, borderWidth: 0.5,
// //     borderColor: C.border, paddingHorizontal: 14, overflow: "hidden",
// //   },
// //   activityRow: {
// //     flexDirection: "row", alignItems: "center", gap: 12,
// //     paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.border,
// //   },
// //   activityAvatar:        { width: 38, height: 38, borderRadius: 12 },
// //   activityAvatarFallback: {
// //     width: 38, height: 38, borderRadius: 12,
// //     backgroundColor: C.tealSoft, alignItems: "center", justifyContent: "center",
// //   },
// //   warnBox: {
// //     marginTop: 10, padding: 12, borderRadius: 10,
// //     backgroundColor: "#FFF8E7",
// //     borderWidth: 0.5, borderColor: C.amberBorder,
// //     borderLeftWidth: 3, borderLeftColor: C.amber,
// //   },
// //   warnTitle: {
// //     fontSize: 9, fontWeight: "700", color: C.amberText,
// //     letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 5,
// //   },
// //   warnText: { fontSize: 12, color: C.amberText, lineHeight: 18, fontWeight: "500" },
// //   warnFlagRow: {
// //     flexDirection: "row", gap: 7, alignItems: "flex-start",
// //     paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.amberBorder,
// //   },
// //   warnFlagText: { flex: 1, fontSize: 11, color: C.amberText, lineHeight: 16 },
// //   activityAvatarLetter: { fontSize: 14, fontWeight: "700", color: C.tealText },
// //   activityText: { fontSize: 13, color: C.ink, lineHeight: 19 },
// //   joinedBadge: {
// //     backgroundColor: C.greenSoft, paddingHorizontal: 10,
// //     paddingVertical: 4, borderRadius: 10,
// //     borderWidth: 0.5, borderColor: C.greenBorder,
// //   },
// //   joinedBadgeText: { color: C.greenText, fontSize: 11, fontWeight: "600" },
// // });
// // components/MyBookings/NotificationSheet.tsx
// // ✅ Pending section removed
// // ✅ Join requests as their own section (not a tab)
// // ✅ All tab shows approved + rejected + joined
// // ✅ Sentence case labels throughout
// // ✅ moderatorNote shown directly — no fake synthesis
// // ✅ Real AI flags → individual expandable cards
// // ✅ Title-based fallback only as absolute last resort

// import React, { useState, useRef } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   Platform,
//   Modal,
//   Image,
//   ActivityIndicator,
//   Animated,
//   LayoutAnimation,
//   UIManager,
// } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { BlurView } from "expo-blur";
// import { NotifItem } from "../../context/NotificationContext";

// if (
//   Platform.OS === "android" &&
//   UIManager.setLayoutAnimationEnabledExperimental
// ) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// const C = {
//   bg:          "#FFFFFF",
//   bgSoft:      "#F8F7F4",
//   bgMuted:     "#F1EFE8",
//   ink:         "#1C1A17",
//   ink2:        "#4A453E",
//   muted:       "#8A8278",
//   border:      "#EAE6DF",
//   white:       "#FFFFFF",
//   purple:      "#534AB7",
//   purpleSoft:  "#EEEDFE",
//   purpleText:  "#3C3489",
//   amber:       "#EF9F27",
//   amberSoft:   "#FAEEDA",
//   amberText:   "#633806",
//   amberBorder: "#FAC775",
//   coral:       "#D85A30",
//   coralSoft:   "#FAECE7",
//   coralText:   "#993C1D",
//   coralBorder: "#F5C4B3",
//   green:       "#1D9E75",
//   greenSoft:   "#E1F5EE",
//   greenText:   "#0F6E56",
//   greenBorder: "#9FE1CB",
//   teal:        "#1D9E75",
//   tealSoft:    "#E1F5EE",
//   tealText:    "#085041",
//   blueSoft:    "#E6F1FB",
//   blueText:    "#185FA5",
//   blueBorder:  "#B5D4F4",
//   gray:        "#888780",
//   graySoft:    "#F1EFE8",
//   grayText:    "#5F5E5A",
// };

// type CategoryKey =
//   | "safety" | "fraud" | "image" | "incomplete"
//   | "pricing" | "venue" | "spam" | "approved";

// const CATEGORY: Record<CategoryKey, {
//   label: string; icon: string; iconColor: string;
//   iconBg: string; badgeBg: string; badgeText: string;
// }> = {
//   safety:     { label: "Safety review",       icon: "shield",           iconColor: C.amberText, iconBg: C.amberSoft, badgeBg: C.amberSoft, badgeText: C.amberText },
//   fraud:      { label: "Suspicious activity", icon: "alert-circle",     iconColor: C.coralText, iconBg: C.coralSoft, badgeBg: C.coralSoft, badgeText: C.coralText },
//   image:      { label: "Image quality",       icon: "image",            iconColor: C.amberText, iconBg: C.amberSoft, badgeBg: C.amberSoft, badgeText: "#412402"   },
//   incomplete: { label: "Incomplete details",  icon: "document-text",    iconColor: C.blueText,  iconBg: C.blueSoft,  badgeBg: C.blueSoft,  badgeText: C.blueText  },
//   pricing:    { label: "Pricing issue",       icon: "pricetag",         iconColor: C.coralText, iconBg: C.coralSoft, badgeBg: C.coralSoft, badgeText: C.coralText },
//   venue:      { label: "Venue verification",  icon: "location",         iconColor: C.tealText,  iconBg: C.tealSoft,  badgeBg: C.tealSoft,  badgeText: C.tealText  },
//   spam:       { label: "Low quality content", icon: "warning",          iconColor: C.grayText,  iconBg: C.graySoft,  badgeBg: C.graySoft,  badgeText: C.grayText  },
//   approved:   { label: "Approved",            icon: "checkmark-circle", iconColor: C.greenText, iconBg: C.greenSoft, badgeBg: C.greenSoft, badgeText: C.greenText },
// };

// const SEVERITY_CONFIG = {
//   high:   { bg: C.coralSoft, text: C.coralText, border: C.coralBorder, dot: C.coral, label: "High priority" },
//   medium: { bg: C.amberSoft, text: C.amberText, border: C.amberBorder, dot: C.amber, label: "Medium"        },
//   low:    { bg: C.graySoft,  text: C.grayText,  border: "#D3D1C7",     dot: C.gray,  label: "Low"           },
// };

// // ─── Strip "AI Risk Score: XX/100 — " prefix ─────────────────────────────────
// function cleanNote(note: string): string {
//   return note.replace(/^AI Risk Score:\s*\d+\/100\s*[—–\-]\s*/i, "").trim();
// }

// // ─── Detect category from note/flag text ─────────────────────────────────────
// function detectCategory(text: string): CategoryKey {
//   const l = text.toLowerCase();
//   if (
//     l.includes("fraud") || l.includes("scam") || l.includes("crypto") ||
//     l.includes("invest") || l.includes("bitcoin") || l.includes("financial return") ||
//     l.includes("cash payment") || l.includes("trading") || l.includes("profit") ||
//     l.includes("lakh") || l.includes("unrealistic")
//   ) return "fraud";
//   if (
//     l.includes("nsfw") || l.includes("inappropriate") || l.includes("explicit") ||
//     l.includes("frightening") || l.includes("violent") || l.includes("adult") ||
//     l.includes("image") || l.includes("photo") || l.includes("banner") ||
//     l.includes("placeholder") || l.includes("stock photo")
//   ) return "image";
//   if (
//     l.includes("price") || l.includes("ticket") || l.includes("₹") ||
//     l.includes("payment") || l.includes("expensive") || l.includes("overpriced")
//   ) return "pricing";
//   if (
//     l.includes("venue") || l.includes("location") || l.includes("address") ||
//     l.includes("generic location")
//   ) return "venue";
//   if (
//     l.includes("description") || l.includes("vague") || l.includes("no details") ||
//     l.includes("no description") || l.includes("unclear") || l.includes("incomplete")
//   ) return "incomplete";
//   if (
//     l.includes("host") || l.includes("organizer") || l.includes("unverified") ||
//     l.includes("legitimacy") || l.includes("identity") || l.includes("safety") ||
//     l.includes("risk") || l.includes("suspicious") || l.includes("concern")
//   ) return "safety";
//   return "safety";
// }

// // ─── Last resort fallback ─────────────────────────────────────────────────────
// function titleFallback(eventTitle: string): { reason: string; category: CategoryKey } {
//   const t = (eventTitle || "").toLowerCase();
//   if (
//     t.includes("crypto") || t.includes("invest") || t.includes("bitcoin") ||
//     t.includes("trading") || t.includes("profit") || t.includes("forex")
//   ) return {
//     reason: "This listing promotes financial investments or guaranteed returns. Such events are not allowed on our platform as they are a common fraud indicator.",
//     category: "fraud",
//   };
//   return {
//     reason: "This listing did not pass our automated review. Common reasons include: vague description, unverifiable venue, suspicious pricing, or content that violates community standards. Please review all details carefully and resubmit.",
//     category: "safety",
//   };
// }

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function timeAgo(iso: string) {
//   const diff = Date.now() - new Date(iso).getTime();
//   const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
//   if (d > 0) return d === 1 ? "1d ago" : `${d}d ago`;
//   if (h > 0) return h === 1 ? "1h ago" : `${h}h ago`;
//   if (m > 0) return m === 1 ? "1m ago" : `${m}m ago`;
//   return "Just now";
// }

// function SectionHeader({ label, count }: { label: string; count?: number }) {
//   return (
//     <View style={S.sectionHeader}>
//       <Text style={S.sectionLabel}>{label}</Text>
//       {count !== undefined && count > 0 && (
//         <View style={S.sectionBadge}>
//           <Text style={S.sectionBadgeText}>{count}</Text>
//         </View>
//       )}
//     </View>
//   );
// }

// // ─── RejectedCard ─────────────────────────────────────────────────────────────
// function RejectedCard({
//   item,
//   onPressEvent,
// }: {
//   item: NotifItem;
//   onPressEvent: (id: string) => void;
// }) {
//   const [expanded, setExpanded] = useState(false);
//   const rotateAnim = useRef(new Animated.Value(0)).current;

//   const hasRealFlags = Array.isArray(item.flags) && item.flags.length > 0;
//   const hasNote = !!(item.moderatorNote && item.moderatorNote.trim().length > 5);

//   let mainReason = "";
//   let mainCat: CategoryKey = "safety";
//   let flagCards: Array<{
//     type: string; description: string;
//     severity: "high" | "medium" | "low"; category: CategoryKey;
//   }> = [];

//   if (hasRealFlags) {
//     flagCards = item.flags!.map(f => ({
//       type: f.type.replace(/^\[.*?\]\s*/i, "").trim(),
//       description: f.description?.trim() || f.type,
//       severity: (f.severity as "high" | "medium" | "low") ?? "medium",
//       category: detectCategory(f.type + " " + (f.description || "")),
//     }));
//     const top  = flagCards.find(f => f.severity === "high") ?? flagCards[0];
//     mainReason = top.description;
//     mainCat    = top.category;
//   } else if (hasNote) {
//     mainReason = cleanNote(item.moderatorNote!);
//     mainCat    = detectCategory(mainReason);
//   } else if (item.message && item.message.trim().length > 20) {
//     mainReason = item.message.trim();
//     mainCat    = detectCategory(mainReason);
//   } else {
//     const fb   = titleFallback(item.eventTitle);
//     mainReason = fb.reason;
//     mainCat    = fb.category;
//   }

//   console.log("NOTIF DEBUG:", {
//     id: item.id,
//     moderatorNote: item.moderatorNote,
//     message: item.message,
//     flags: item.flags,
//     eventTitle: item.eventTitle,
//   });

//   const catCfg = CATEGORY[mainCat];

//   const toggle = () => {
//     LayoutAnimation.configureNext({
//       duration: 260,
//       create: { type: "easeInEaseOut", property: "opacity" },
//       update: { type: "easeInEaseOut" },
//     });
//     Animated.timing(rotateAnim, {
//       toValue: expanded ? 0 : 1,
//       duration: 220,
//       useNativeDriver: true,
//     }).start();
//     setExpanded(v => !v);
//   };

//   const rotate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["0deg", "180deg"],
//   });

//   return (
//     <View style={S.card}>
//       <View style={[S.cardAccent, { backgroundColor: C.coral }]} />
//       <View style={S.cardBody}>

//         {/* Header */}
//         <View style={S.cardHeader}>
//           <View style={[S.iconWrap, { backgroundColor: catCfg.iconBg }]}>
//             <Ionicons name={catCfg.icon as any} size={18} color={catCfg.iconColor} />
//           </View>
//           <View style={S.cardMeta}>
//             <View style={S.titleRow}>
//               <Text style={S.eventTitle} numberOfLines={1}>
//                 {item.eventEmoji} {item.eventTitle}
//               </Text>
//               <View style={[S.statusPill, { backgroundColor: C.coralSoft }]}>
//                 <Text style={[S.statusPillText, { color: C.coralText }]}>Rejected</Text>
//               </View>
//             </View>
//             <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
//             <View style={[S.categoryBadge, { backgroundColor: catCfg.badgeBg }]}>
//               <Ionicons name={catCfg.icon as any} size={10} color={catCfg.badgeText} />
//               <Text style={[S.categoryBadgeText, { color: catCfg.badgeText }]}>
//                 {catCfg.label}
//               </Text>
//             </View>
//           </View>
//           {!item.moderationRead && <View style={S.unreadDot} />}
//         </View>

//         {/* Rejection reason */}
//         <Text style={S.reasonLabel}>Rejection reason</Text>
//         <Text style={S.mainReason}>{mainReason}</Text>

//         {/* Expandable flag cards — only when multiple real AI flags */}
//         {hasRealFlags && flagCards.length > 1 && (
//           <>
//             <TouchableOpacity style={S.expandBtn} onPress={toggle} activeOpacity={0.7}>
//               <Text style={S.expandBtnText}>
//                 {expanded ? "Hide details" : `See all ${flagCards.length} issues`}
//               </Text>
//               <Animated.View style={{ transform: [{ rotate }] }}>
//                 <Ionicons name="chevron-down" size={14} color={C.purple} />
//               </Animated.View>
//             </TouchableOpacity>

//             {expanded && (
//               <View style={S.expandedSection}>
//                 <View style={S.divider} />
//                 <Text style={S.detailLabel}>{flagCards.length} issues found</Text>
//                 {flagCards.map((flag, idx) => {
//                   const sev        = SEVERITY_CONFIG[flag.severity] ?? SEVERITY_CONFIG.medium;
//                   const flagCatCfg = CATEGORY[flag.category];
//                   return (
//                     <View
//                       key={idx}
//                       style={[S.flagCard, { borderLeftColor: sev.dot, backgroundColor: sev.bg }]}
//                     >
//                       <View style={S.flagTopRow}>
//                         <View style={[S.flagIconWrap, { backgroundColor: flagCatCfg.iconBg }]}>
//                           <Ionicons
//                             name={flagCatCfg.icon as any}
//                             size={13}
//                             color={flagCatCfg.iconColor}
//                           />
//                         </View>
//                         <Text style={S.flagName}>{flag.type}</Text>
//                         <View style={[S.sevBadge, { backgroundColor: "rgba(0,0,0,0.06)" }]}>
//                           <Text style={[S.sevBadgeText, { color: sev.text }]}>{sev.label}</Text>
//                         </View>
//                       </View>
//                       <Text style={[S.flagDesc, { color: sev.text }]}>{flag.description}</Text>
//                     </View>
//                   );
//                 })}
//               </View>
//             )}
//           </>
//         )}

//         {/* How to fix */}
//         <View style={[S.fixBox, { marginTop: 12 }]}>
//           <Ionicons
//             name="construct-outline"
//             size={14}
//             color={C.amberText}
//             style={{ marginTop: 1 }}
//           />
//           <View style={{ flex: 1 }}>
//             <Text style={S.fixTitle}>How to fix and resubmit</Text>
//             <Text style={S.fixText}>
//               Fix the issue above, update your listing details, and resubmit for review.
//               Our team reviews all resubmissions within 24 hours.
//             </Text>
//           </View>
//         </View>

//       </View>
//     </View>
//   );
// }

// // ─── ApprovedCard ─────────────────────────────────────────────────────────────
// function ApprovedCard({
//   item,
//   onPressEvent,
// }: {
//   item: NotifItem;
//   onPressEvent: (id: string) => void;
// }) {
//   const isService = item.eventEmoji === "🛠️";
//   const hasWarnings =
//     item.approvalStatus === "approved_with_warnings" &&
//     ((item.moderatorNote && item.moderatorNote.trim().length > 5) ||
//       (Array.isArray(item.flags) && item.flags.length > 0));

//   return (
//     <TouchableOpacity
//       style={S.card}
//       onPress={() => item.eventId && onPressEvent(item.eventId)}
//       activeOpacity={0.88}
//     >
//       <View style={[S.cardAccent, { backgroundColor: hasWarnings ? C.amber : C.green }]} />
//       <View style={S.cardBody}>

//         {/* Header */}
//         <View style={S.cardHeader}>
//           <View style={[S.iconWrap, { backgroundColor: hasWarnings ? C.amberSoft : C.greenSoft }]}>
//             <Ionicons
//               name={hasWarnings ? "warning" : "checkmark-circle"}
//               size={18}
//               color={hasWarnings ? C.amberText : C.greenText}
//             />
//           </View>
//           <View style={S.cardMeta}>
//             <View style={S.titleRow}>
//               <Text style={S.eventTitle} numberOfLines={1}>
//                 {item.eventEmoji} {item.eventTitle}
//               </Text>
//               <View style={[S.statusPill, { backgroundColor: hasWarnings ? C.amberSoft : C.greenSoft }]}>
//                 <Text style={[S.statusPillText, { color: hasWarnings ? C.amberText : C.greenText }]}>
//                   {hasWarnings ? "Live ⚠️" : "Approved"}
//                 </Text>
//               </View>
//             </View>
//             <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
//             <View style={[S.categoryBadge, { backgroundColor: hasWarnings ? C.amberSoft : C.tealSoft }]}>
//               <Ionicons name="rocket-outline" size={10} color={hasWarnings ? C.amberText : C.tealText} />
//               <Text style={[S.categoryBadgeText, { color: hasWarnings ? C.amberText : C.tealText }]}>
//                 Now live
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Live status box */}
//         <View style={[S.approvedBox, hasWarnings && { backgroundColor: C.amberSoft, borderColor: C.amberBorder }]}>
//           <Ionicons
//             name={hasWarnings ? "alert-circle-outline" : "rocket-outline"}
//             size={15}
//             color={hasWarnings ? C.amberText : C.greenText}
//             style={{ marginTop: 1, flexShrink: 0 }}
//           />
//           <Text style={[S.approvedText, hasWarnings && { color: C.amberText }]}>
//             {hasWarnings
//               ? `Your ${isService ? "service" : "event"} is live but needs improvement to avoid future rejection.`
//               : `Your ${isService ? "service" : "event"} is now discoverable on the app. Community members can find and join it.`}
//           </Text>
//         </View>

//         {/* Warning suggestions */}
//         {hasWarnings && item.moderatorNote && item.moderatorNote.trim().length > 5 && (
//           <View style={S.warnBox}>
//             <Text style={S.warnTitle}>What to improve</Text>
//             <Text style={S.warnText}>{item.moderatorNote}</Text>
//           </View>
//         )}

//         {/* Individual flag rows */}
//         {hasWarnings && Array.isArray(item.flags) && item.flags.length > 0 && (
//           <View style={{ marginTop: 8 }}>
//             {item.flags.slice(0, 3).map((flag, idx) => (
//               <View key={idx} style={S.warnFlagRow}>
//                 <Ionicons name="information-circle-outline" size={13} color={C.amberText} />
//                 <Text style={S.warnFlagText}>
//                   <Text style={{ fontWeight: "700" }}>{flag.type}: </Text>
//                   {flag.description}
//                 </Text>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Risk score */}
//         {item.riskScore != null && (
//           <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 4 }}>
//             <Text style={{ fontSize: 10, color: C.muted, fontWeight: "600" }}>AI risk score: </Text>
//             <Text style={{ fontSize: 11, fontWeight: "800", color: item.riskScore >= 50 ? C.amberText : C.greenText }}>
//               {item.riskScore}/100
//             </Text>
//           </View>
//         )}

//         <View style={S.actionsRow}>
//           <TouchableOpacity
//             style={[S.btnPrimaryGreen, hasWarnings && { backgroundColor: C.amber }]}
//             activeOpacity={0.85}
//           >
//             <Ionicons name="eye-outline" size={14} color={C.white} />
//             <Text style={S.btnPrimaryText}>View {isService ? "service" : "event"}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[S.btnGhostGreen, hasWarnings && { backgroundColor: C.amberSoft, borderColor: C.amberBorder }]}
//             activeOpacity={0.8}
//           >
//             <Ionicons name="share-social-outline" size={14} color={hasWarnings ? C.amberText : C.greenText} />
//             <Text style={[S.btnGhostText, { color: hasWarnings ? C.amberText : C.greenText }]}>Share</Text>
//           </TouchableOpacity>
//         </View>

//       </View>
//     </TouchableOpacity>
//   );
// }

// // ─── JoinRequestCard ──────────────────────────────────────────────────────────
// function JoinRequestCard({
//   item,
//   onAdmit,
//   onReject,
//   admitBusy,
// }: {
//   item: NotifItem;
//   onAdmit: (item: NotifItem) => void;
//   onReject: (item: NotifItem) => void;
//   admitBusy: Record<string, boolean>;
// }) {
//   const admitKey  = `${item.id}-admit`;
//   const rejectKey = `${item.id}-reject`;
//   const busy = !!(admitBusy[admitKey] || admitBusy[rejectKey]);

//   return (
//     <View style={S.card}>
//       <View style={[S.cardAccent, { backgroundColor: C.purple }]} />
//       <View style={S.cardBody}>
//         <View style={S.joinRow}>
//           {item.userImageUrl ? (
//             <Image source={{ uri: item.userImageUrl }} style={S.avatar} />
//           ) : (
//             <View style={S.avatarFallback}>
//               <Text style={S.avatarLetter}>{(item.userName || "?")[0].toUpperCase()}</Text>
//             </View>
//           )}
//           <View style={{ flex: 1 }}>
//             <Text style={S.joinText}>
//               <Text style={S.joinBold}>{item.userName}</Text>
//               <Text style={S.joinMuted}> wants to join </Text>
//               <Text style={S.joinEvent}>{item.eventEmoji} {item.eventTitle}</Text>
//             </Text>
//             <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
//           </View>
//         </View>
//         {!!item.message && (
//           <View style={S.msgBox}>
//             <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.muted} />
//             <Text style={S.msgText}>"{item.message}"</Text>
//           </View>
//         )}
//         <View style={S.joinActionsRow}>
//           <TouchableOpacity
//             onPress={() => onAdmit(item)}
//             disabled={busy}
//             style={[S.btnPrimary, busy && S.btnDisabled, { flex: 1 }]}
//             activeOpacity={0.85}
//           >
//             {admitBusy[admitKey] ? (
//               <ActivityIndicator color={C.white} size="small" />
//             ) : (
//               <>
//                 <Ionicons name="checkmark" size={15} color={C.white} />
//                 <Text style={S.btnPrimaryText}>Admit</Text>
//               </>
//             )}
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() => onReject(item)}
//             disabled={busy}
//             style={[S.btnSecondary, busy && S.btnDisabled, { flex: 1 }]}
//             activeOpacity={0.8}
//           >
//             {admitBusy[rejectKey] ? (
//               <ActivityIndicator color={C.muted} size="small" />
//             ) : (
//               <>
//                 <Ionicons name="close" size={15} color={C.ink2} />
//                 <Text style={S.btnSecondaryText}>Decline</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// }

// // ─── ActivityRow ──────────────────────────────────────────────────────────────
// function ActivityRow({
//   item,
//   onPressEvent,
// }: {
//   item: NotifItem;
//   onPressEvent: (id: string) => void;
// }) {
//   return (
//     <TouchableOpacity
//       style={S.activityRow}
//       onPress={() => onPressEvent(item.eventId)}
//       activeOpacity={0.7}
//     >
//       {item.userImageUrl ? (
//         <Image source={{ uri: item.userImageUrl }} style={S.activityAvatar} />
//       ) : (
//         <View style={S.activityAvatarFallback}>
//           <Text style={S.activityAvatarLetter}>{(item.userName || "?")[0].toUpperCase()}</Text>
//         </View>
//       )}
//       <View style={{ flex: 1 }}>
//         <Text style={S.activityText} numberOfLines={2}>
//           <Text style={S.joinBold}>{item.userName}</Text>
//           <Text style={S.joinMuted}> joined </Text>
//           <Text style={S.joinEvent}>{item.eventEmoji} {item.eventTitle}</Text>
//         </Text>
//         <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
//       </View>
//       <View style={S.joinedBadge}>
//         <Text style={S.joinedBadgeText}>Joined</Text>
//       </View>
//     </TouchableOpacity>
//   );
// }

// // ─── Tabs ─────────────────────────────────────────────────────────────────────
// // NOTE: "pending" tab removed — join requests shown inline in "All"
// type TabKey = "all" | "approved" | "rejected" | "safety";
// const TABS: { key: TabKey; label: string }[] = [
//   { key: "all",      label: "All"           },
//   { key: "approved", label: "Approved"      },
//   { key: "rejected", label: "Rejected"      },
//   { key: "safety",   label: "Safety alerts" },
// ];

// // ─── Main export ──────────────────────────────────────────────────────────────
// export default function NotificationSheet({
//   visible,
//   onClose,
//   items,
//   loading,
//   admitBusy,
//   onAdmit,
//   onReject,
//   onPressEvent,
//   onMarkRead,
// }: {
//   visible: boolean;
//   onClose: () => void;
//   items: NotifItem[];
//   loading: boolean;
//   admitBusy: Record<string, boolean>;
//   onAdmit: (item: NotifItem) => void;
//   onReject: (item: NotifItem) => void;
//   onPressEvent: (eventId: string) => void;
//   onMarkRead: () => void;
// }) {
//   const [activeTab, setActiveTab] = useState<TabKey>("all");

//   // All buckets
//   const pending  = items.filter(i => i.type === "pending");
//   const joined   = items.filter(i => i.type === "joined");
//   const approved = items.filter(i => i.type === "moderation_approved");
//   const rejected = items.filter(i => i.type === "moderation_rejected");

//   const safetyAlerts = rejected.filter(i => {
//     const note  = (i.moderatorNote || "").toLowerCase();
//     const title = (i.eventTitle   || "").toLowerCase();
//     if (Array.isArray(i.flags) && i.flags.length > 0) {
//       const cat = detectCategory(
//         i.flags![0].type + " " + (i.flags![0].description || "")
//       );
//       return cat === "safety" || cat === "fraud";
//     }
//     return (
//       note.includes("fraud")    || note.includes("scam")    ||
//       note.includes("safety")   || note.includes("suspicious") ||
//       note.includes("crypto")   || note.includes("invest")  ||
//       note.includes("financial return") || note.includes("cash payment") ||
//       title.includes("crypto")  || title.includes("invest") || title.includes("bitcoin")
//     );
//   });

//   // Filter by active tab
//   // "All" always shows join requests inline — other tabs don't
//   const filterItems = (tab: TabKey) => {
//     switch (tab) {
//       case "approved": return { pending: [], approved, rejected: [],          joined     };
//       case "rejected": return { pending: [], approved: [],   rejected,        joined: [] };
//       case "safety":   return { pending: [], approved: [],   rejected: safetyAlerts, joined: [] };
//       default:         return { pending, approved,           rejected,        joined     };
//     }
//   };

//   const { pending: fp, approved: fa, rejected: fr, joined: fj } = filterItems(activeTab);

//   const totalUnread = items.filter(
//     i =>
//       (i.type === "moderation_rejected" || i.type === "moderation_approved") &&
//       !i.moderationRead
//   ).length;

//   return (
//     <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
//       <View style={S.root}>
//         <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={onClose} />
//         <BlurView
//           intensity={Platform.OS === "ios" ? 95 : 110}
//           tint="light"
//           style={S.sheet}
//         >
//           <View style={S.grabber} />

//           {/* Header */}
//           <View style={S.header}>
//             <View style={S.headerMain}>
//               <View>
//                 <Text style={S.headerTitle}>Notifications</Text>
//                 <Text style={S.headerSub}>{items.length} updates</Text>
//               </View>
//               <View style={S.headerActions}>
//                 {totalUnread > 0 && (
//                   <TouchableOpacity
//                     style={S.markReadBtn}
//                     onPress={onMarkRead}
//                     activeOpacity={0.7}
//                   >
//                     <Text style={S.markReadText}>Mark all read</Text>
//                   </TouchableOpacity>
//                 )}
//                 <TouchableOpacity style={S.closeBtn} onPress={onClose} activeOpacity={0.7}>
//                   <Ionicons name="close" size={18} color={C.muted} />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Tabs — no Pending tab */}
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={S.tabsContainer}
//               style={S.tabsScroll}
//             >
//               {TABS.map(tab => (
//                 <TouchableOpacity
//                   key={tab.key}
//                   style={[S.tab, activeTab === tab.key && S.tabActive]}
//                   onPress={() => setActiveTab(tab.key)}
//                   activeOpacity={0.75}
//                 >
//                   <Text style={[S.tabText, activeTab === tab.key && S.tabTextActive]}>
//                     {tab.label}
//                   </Text>
//                   {tab.key === "safety" && safetyAlerts.length > 0 && (
//                     <View style={S.tabBadge}>
//                       <Text style={S.tabBadgeText}>{safetyAlerts.length}</Text>
//                     </View>
//                   )}
//                   {tab.key === "rejected" && rejected.length > 0 && (
//                     <View style={S.tabBadge}>
//                       <Text style={S.tabBadgeText}>{rejected.length}</Text>
//                     </View>
//                   )}
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>

//           {/* Scroll body */}
//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={S.scrollContent}
//           >
//             {loading && (
//               <View style={S.loadingWrap}>
//                 <ActivityIndicator color={C.purple} size="large" />
//                 <Text style={S.loadingText}>Loading notifications…</Text>
//               </View>
//             )}

//             {!loading && items.length === 0 && (
//               <View style={S.emptyWrap}>
//                 <View style={S.emptyIconCircle}>
//                   <Ionicons name="notifications-off-outline" size={28} color={C.muted} />
//                 </View>
//                 <Text style={S.emptyTitle}>All caught up</Text>
//                 <Text style={S.emptySub}>
//                   Join requests, activity, and moderation decisions will appear here.
//                 </Text>
//               </View>
//             )}

//             {/* Rejected */}
//             {fr.length > 0 && (
//               <View style={S.section}>
//                 <SectionHeader
//                   label="Needs attention"
//                   count={fr.filter(i => !i.moderationRead).length}
//                 />
//                 {fr.map(item => (
//                   <RejectedCard key={item.id} item={item} onPressEvent={onPressEvent} />
//                 ))}
//               </View>
//             )}

//             {/* Approved */}
//             {fa.length > 0 && (
//               <View style={S.section}>
//                 <SectionHeader label="Good news" />
//                 {fa.map(item => (
//                   <ApprovedCard key={item.id} item={item} onPressEvent={onPressEvent} />
//                 ))}
//               </View>
//             )}

//             {/* Join requests — always visible in All & Approved tabs */}
//             {fp.length > 0 && (
//               <View style={S.section}>
//                 <SectionHeader label="Join requests" count={fp.length} />
//                 {fp.map(item => (
//                   <JoinRequestCard
//                     key={item.id}
//                     item={item}
//                     onAdmit={onAdmit}
//                     onReject={onReject}
//                     admitBusy={admitBusy}
//                   />
//                 ))}
//               </View>
//             )}

//             {/* Recent activity */}
//             {fj.length > 0 && (
//               <View style={S.section}>
//                 <SectionHeader label="Recent activity" />
//                 <View style={S.activityContainer}>
//                   {fj.map(item => (
//                     <ActivityRow key={item.id} item={item} onPressEvent={onPressEvent} />
//                   ))}
//                 </View>
//               </View>
//             )}
//           </ScrollView>
//         </BlurView>
//       </View>
//     </Modal>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────
// const S = StyleSheet.create({
//   root:     { flex: 1, justifyContent: "flex-end" },
//   backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.48)" },
//   sheet: {
//     height: "93%",
//     backgroundColor: "rgba(255,255,255,0.9)",
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//     overflow: "hidden",
//   },
//   grabber: {
//     width: 36, height: 4, borderRadius: 2,
//     backgroundColor: "rgba(0,0,0,0.12)",
//     alignSelf: "center", marginTop: 12, marginBottom: 4,
//   },
//   header: {
//     paddingHorizontal: 20, paddingBottom: 0,
//     borderBottomWidth: 0.5, borderBottomColor: C.border,
//   },
//   headerMain: {
//     flexDirection: "row", alignItems: "flex-start",
//     justifyContent: "space-between", paddingVertical: 12,
//   },
//   headerTitle: { fontSize: 24, fontWeight: "700", color: C.ink, letterSpacing: -0.3 },
//   headerSub:   { fontSize: 13, color: C.muted, fontWeight: "500", marginTop: 2 },
//   headerActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
//   markReadBtn: {
//     paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
//     backgroundColor: C.bgMuted, borderWidth: 0.5, borderColor: C.border,
//   },
//   markReadText: { fontSize: 12, fontWeight: "600", color: C.ink2 },
//   closeBtn: {
//     width: 34, height: 34, borderRadius: 17,
//     backgroundColor: C.bgMuted, borderWidth: 0.5, borderColor: C.border,
//     alignItems: "center", justifyContent: "center",
//   },
//   tabsScroll:     { marginTop: 4 },
//   tabsContainer:  { paddingBottom: 12, paddingRight: 4, gap: 6, flexDirection: "row" },
//   tab: {
//     paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
//     borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg,
//     flexDirection: "row", alignItems: "center", gap: 6,
//   },
//   tabActive:     { backgroundColor: C.purple, borderColor: C.purple },
//   tabText:       { fontSize: 12, fontWeight: "600", color: C.muted },
//   tabTextActive: { color: C.purpleSoft },
//   tabBadge: {
//     backgroundColor: C.coral, paddingHorizontal: 6,
//     paddingVertical: 1, borderRadius: 8, minWidth: 18, alignItems: "center",
//   },
//   tabBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
//   scrollContent: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 12 },
//   loadingWrap:   { paddingVertical: 48, alignItems: "center", gap: 12 },
//   loadingText:   { fontSize: 14, color: C.muted, fontWeight: "500" },
//   emptyWrap:     { paddingVertical: 56, alignItems: "center" },
//   emptyIconCircle: {
//     width: 60, height: 60, borderRadius: 20,
//     backgroundColor: C.bgMuted, alignItems: "center",
//     justifyContent: "center", marginBottom: 16,
//   },
//   emptyTitle: { fontSize: 17, fontWeight: "700", color: C.ink, marginBottom: 6 },
//   emptySub: {
//     fontSize: 13, color: C.muted, textAlign: "center",
//     paddingHorizontal: 36, lineHeight: 19,
//   },
//   section:       { marginBottom: 28 },
//   sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
//   sectionLabel: {
//     fontSize: 11, fontWeight: "700", color: C.muted,
//     letterSpacing: 0.8, textTransform: "uppercase",
//   },
//   sectionBadge: {
//     backgroundColor: C.coralSoft, paddingHorizontal: 8,
//     paddingVertical: 2, borderRadius: 10,
//   },
//   sectionBadgeText: { color: C.coralText, fontSize: 10, fontWeight: "700" },
//   card: {
//     backgroundColor: C.bg, borderRadius: 16, borderWidth: 0.5,
//     borderColor: C.border, marginBottom: 10, flexDirection: "row",
//     overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04,
//     shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
//   },
//   cardAccent: { width: 4 },
//   cardBody:   { flex: 1, padding: 14 },
//   cardHeader: {
//     flexDirection: "row", alignItems: "flex-start",
//     gap: 12, marginBottom: 10,
//   },
//   iconWrap: {
//     width: 38, height: 38, borderRadius: 10,
//     alignItems: "center", justifyContent: "center", flexShrink: 0,
//   },
//   cardMeta:   { flex: 1, minWidth: 0 },
//   titleRow: {
//     flexDirection: "row", alignItems: "center",
//     gap: 8, flexWrap: "wrap", marginBottom: 3,
//   },
//   eventTitle:     { fontSize: 14, fontWeight: "600", color: C.ink, flex: 1 },
//   statusPill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
//   statusPillText: { fontSize: 10, fontWeight: "600" },
//   cardTime:       { fontSize: 11, color: C.muted, fontWeight: "500", marginBottom: 6 },
//   categoryBadge: {
//     flexDirection: "row", alignItems: "center", gap: 5,
//     alignSelf: "flex-start", paddingHorizontal: 9,
//     paddingVertical: 3, borderRadius: 8,
//   },
//   categoryBadgeText: { fontSize: 10, fontWeight: "600" },
//   unreadDot: {
//     width: 8, height: 8, borderRadius: 4,
//     backgroundColor: C.purple, flexShrink: 0, marginTop: 6,
//   },
//   // Reason
//   reasonLabel: {
//     fontSize: 10, fontWeight: "600", color: C.muted,
//     letterSpacing: 0.4, textTransform: "capitalize", marginBottom: 6,
//   },
//   mainReason: {
//     fontSize: 13, color: C.ink2, lineHeight: 20, marginBottom: 10,
//   },
//   expandBtn: {
//     flexDirection: "row", alignItems: "center",
//     gap: 5, alignSelf: "flex-start", marginBottom: 4,
//   },
//   expandBtnText:   { fontSize: 12, fontWeight: "600", color: C.purple },
//   expandedSection: { marginTop: 4 },
//   divider:         { height: 0.5, backgroundColor: C.border, marginVertical: 12 },
//   detailLabel: {
//     fontSize: 10, fontWeight: "700", color: C.muted,
//     letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8,
//   },
//   flagCard: {
//     borderLeftWidth: 3, borderRadius: 0,
//     borderTopRightRadius: 8, borderBottomRightRadius: 8,
//     padding: 10, marginBottom: 8,
//   },
//   flagTopRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
//   flagIconWrap: {
//     width: 24, height: 24, borderRadius: 7,
//     alignItems: "center", justifyContent: "center", flexShrink: 0,
//   },
//   flagName:     { flex: 1, fontSize: 12, fontWeight: "600", color: C.ink },
//   sevBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
//   sevBadgeText: { fontSize: 9, fontWeight: "700" },
//   flagDesc:     { fontSize: 13, lineHeight: 19, paddingLeft: 32 },
//   fixBox: {
//     flexDirection: "row", gap: 10, alignItems: "flex-start",
//     backgroundColor: C.amberSoft, borderRadius: 10, padding: 12,
//     borderWidth: 0.5, borderColor: C.amberBorder,
//   },
//   fixTitle: {
//     fontSize: 11, fontWeight: "700", color: C.amberText,
//     marginBottom: 4,
//   },
//   fixText: { fontSize: 12, color: C.amberText, lineHeight: 17, fontWeight: "500" },
//   approvedBox: {
//     flexDirection: "row", gap: 10, alignItems: "flex-start",
//     backgroundColor: C.greenSoft, borderRadius: 10, padding: 12,
//     borderWidth: 0.5, borderColor: C.greenBorder, marginVertical: 10,
//   },
//   approvedText: { flex: 1, fontSize: 13, color: C.greenText, lineHeight: 19, fontWeight: "500" },
//   actionsRow:     { flexDirection: "row", gap: 8, flexWrap: "wrap" },
//   joinActionsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
//   btnPrimary: {
//     flexDirection: "row", alignItems: "center", gap: 6,
//     backgroundColor: C.purple, paddingHorizontal: 16,
//     paddingVertical: 10, borderRadius: 10, justifyContent: "center",
//   },
//   btnPrimaryGreen: {
//     flexDirection: "row", alignItems: "center", gap: 6,
//     backgroundColor: C.green, paddingHorizontal: 16,
//     paddingVertical: 10, borderRadius: 10, justifyContent: "center",
//   },
//   btnPrimaryText: { color: C.white, fontSize: 13, fontWeight: "700" },
//   btnSecondary: {
//     flexDirection: "row", alignItems: "center", gap: 6,
//     backgroundColor: C.bg, paddingHorizontal: 16, paddingVertical: 10,
//     borderRadius: 10, borderWidth: 0.5, borderColor: C.border, justifyContent: "center",
//   },
//   btnSecondaryText: { color: C.ink2, fontSize: 13, fontWeight: "600" },
//   btnGhostGreen: {
//     flexDirection: "row", alignItems: "center", gap: 6,
//     backgroundColor: C.greenSoft, paddingHorizontal: 16, paddingVertical: 10,
//     borderRadius: 10, borderWidth: 0.5, borderColor: C.greenBorder,
//   },
//   btnGhostText: { fontSize: 13, fontWeight: "600" },
//   btnDisabled:  { opacity: 0.5 },
//   joinRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 4 },
//   avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.bgSoft },
//   avatarFallback: {
//     width: 44, height: 44, borderRadius: 14,
//     backgroundColor: C.purpleSoft, alignItems: "center", justifyContent: "center",
//   },
//   avatarLetter: { fontSize: 17, fontWeight: "700", color: C.purple },
//   joinText:  { fontSize: 14, lineHeight: 21, flex: 1 },
//   joinBold:  { fontWeight: "700", color: C.ink },
//   joinMuted: { color: C.ink2, fontWeight: "500" },
//   joinEvent: { color: C.purple, fontWeight: "700" },
//   msgBox: {
//     flexDirection: "row", gap: 8, alignItems: "flex-start",
//     marginTop: 10, padding: 12, backgroundColor: C.bgSoft,
//     borderRadius: 10, borderWidth: 0.5, borderColor: C.border,
//   },
//   msgText: { flex: 1, fontSize: 13, color: C.ink2, fontStyle: "italic", fontWeight: "500" },
//   activityContainer: {
//     backgroundColor: C.bg, borderRadius: 14, borderWidth: 0.5,
//     borderColor: C.border, paddingHorizontal: 14, overflow: "hidden",
//   },
//   activityRow: {
//     flexDirection: "row", alignItems: "center", gap: 12,
//     paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.border,
//   },
//   activityAvatar:        { width: 38, height: 38, borderRadius: 12 },
//   activityAvatarFallback: {
//     width: 38, height: 38, borderRadius: 12,
//     backgroundColor: C.tealSoft, alignItems: "center", justifyContent: "center",
//   },
//   activityAvatarLetter: { fontSize: 14, fontWeight: "700", color: C.tealText },
//   activityText:  { fontSize: 13, color: C.ink, lineHeight: 19 },
//   joinedBadge: {
//     backgroundColor: C.greenSoft, paddingHorizontal: 10,
//     paddingVertical: 4, borderRadius: 10,
//     borderWidth: 0.5, borderColor: C.greenBorder,
//   },
//   joinedBadgeText: { color: C.greenText, fontSize: 11, fontWeight: "600" },
//   warnBox: {
//     marginTop: 10, padding: 12, borderRadius: 10,
//     backgroundColor: "#FFF8E7",
//     borderWidth: 0.5, borderColor: C.amberBorder,
//     borderLeftWidth: 3, borderLeftColor: C.amber,
//   },
//   warnTitle: {
//     fontSize: 11, fontWeight: "700", color: C.amberText, marginBottom: 5,
//   },
//   warnText: { fontSize: 12, color: C.amberText, lineHeight: 18, fontWeight: "500" },
//   warnFlagRow: {
//     flexDirection: "row", gap: 7, alignItems: "flex-start",
//     paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.amberBorder,
//   },
//   warnFlagText: { flex: 1, fontSize: 11, color: C.amberText, lineHeight: 16 },
// });
// components/MyBookings/NotificationSheet.tsx
// ✅ Pending section removed
// ✅ Join requests as their own section (not a tab)
// ✅ All tab shows approved + rejected + joined
// ✅ Sentence case labels throughout
// ✅ moderatorNote shown directly — no fake synthesis
// ✅ Real AI flags → individual expandable cards
// ✅ Title-based fallback only as absolute last resort
// ✅ AI risk score hidden from ApprovedCard (not shown to user)
// ✅ View event / Share buttons removed from ApprovedCard

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Image,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  UIManager,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { NotifItem } from "../../context/NotificationContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = {
  bg:          "#FFFFFF",
  bgSoft:      "#F8F7F4",
  bgMuted:     "#F1EFE8",
  ink:         "#1C1A17",
  ink2:        "#4A453E",
  muted:       "#8A8278",
  border:      "#EAE6DF",
  white:       "#FFFFFF",
  purple:      "#534AB7",
  purpleSoft:  "#EEEDFE",
  purpleText:  "#3C3489",
  amber:       "#EF9F27",
  amberSoft:   "#FAEEDA",
  amberText:   "#633806",
  amberBorder: "#FAC775",
  coral:       "#D85A30",
  coralSoft:   "#FAECE7",
  coralText:   "#993C1D",
  coralBorder: "#F5C4B3",
  green:       "#1D9E75",
  greenSoft:   "#E1F5EE",
  greenText:   "#0F6E56",
  greenBorder: "#9FE1CB",
  teal:        "#1D9E75",
  tealSoft:    "#E1F5EE",
  tealText:    "#085041",
  blueSoft:    "#E6F1FB",
  blueText:    "#185FA5",
  blueBorder:  "#B5D4F4",
  gray:        "#888780",
  graySoft:    "#F1EFE8",
  grayText:    "#5F5E5A",
};

type CategoryKey =
  | "safety" | "fraud" | "image" | "incomplete"
  | "pricing" | "venue" | "spam" | "approved";

const CATEGORY: Record<CategoryKey, {
  label: string; icon: string; iconColor: string;
  iconBg: string; badgeBg: string; badgeText: string;
}> = {
  safety:     { label: "Safety review",       icon: "shield",           iconColor: C.amberText, iconBg: C.amberSoft, badgeBg: C.amberSoft, badgeText: C.amberText },
  fraud:      { label: "Suspicious activity", icon: "alert-circle",     iconColor: C.coralText, iconBg: C.coralSoft, badgeBg: C.coralSoft, badgeText: C.coralText },
  image:      { label: "Image quality",       icon: "image",            iconColor: C.amberText, iconBg: C.amberSoft, badgeBg: C.amberSoft, badgeText: "#412402"   },
  incomplete: { label: "Incomplete details",  icon: "document-text",    iconColor: C.blueText,  iconBg: C.blueSoft,  badgeBg: C.blueSoft,  badgeText: C.blueText  },
  pricing:    { label: "Pricing issue",       icon: "pricetag",         iconColor: C.coralText, iconBg: C.coralSoft, badgeBg: C.coralSoft, badgeText: C.coralText },
  venue:      { label: "Venue verification",  icon: "location",         iconColor: C.tealText,  iconBg: C.tealSoft,  badgeBg: C.tealSoft,  badgeText: C.tealText  },
  spam:       { label: "Low quality content", icon: "warning",          iconColor: C.grayText,  iconBg: C.graySoft,  badgeBg: C.graySoft,  badgeText: C.grayText  },
  approved:   { label: "Approved",            icon: "checkmark-circle", iconColor: C.greenText, iconBg: C.greenSoft, badgeBg: C.greenSoft, badgeText: C.greenText },
};

const SEVERITY_CONFIG = {
  high:   { bg: C.coralSoft, text: C.coralText, border: C.coralBorder, dot: C.coral, label: "High priority" },
  medium: { bg: C.amberSoft, text: C.amberText, border: C.amberBorder, dot: C.amber, label: "Medium"        },
  low:    { bg: C.graySoft,  text: C.grayText,  border: "#D3D1C7",     dot: C.gray,  label: "Low"           },
};

// ─── Strip "AI Risk Score: XX/100 — " prefix ─────────────────────────────────
function cleanNote(note: string): string {
  return note.replace(/^AI Risk Score:\s*\d+\/100\s*[—–\-]\s*/i, "").trim();
}

// ─── Detect category from note/flag text ─────────────────────────────────────
function detectCategory(text: string): CategoryKey {
  const l = text.toLowerCase();
  if (
    l.includes("fraud") || l.includes("scam") || l.includes("crypto") ||
    l.includes("invest") || l.includes("bitcoin") || l.includes("financial return") ||
    l.includes("cash payment") || l.includes("trading") || l.includes("profit") ||
    l.includes("lakh") || l.includes("unrealistic")
  ) return "fraud";
  if (
    l.includes("nsfw") || l.includes("inappropriate") || l.includes("explicit") ||
    l.includes("frightening") || l.includes("violent") || l.includes("adult") ||
    l.includes("image") || l.includes("photo") || l.includes("banner") ||
    l.includes("placeholder") || l.includes("stock photo")
  ) return "image";
  if (
    l.includes("price") || l.includes("ticket") || l.includes("₹") ||
    l.includes("payment") || l.includes("expensive") || l.includes("overpriced")
  ) return "pricing";
  if (
    l.includes("venue") || l.includes("location") || l.includes("address") ||
    l.includes("generic location")
  ) return "venue";
  if (
    l.includes("description") || l.includes("vague") || l.includes("no details") ||
    l.includes("no description") || l.includes("unclear") || l.includes("incomplete")
  ) return "incomplete";
  if (
    l.includes("host") || l.includes("organizer") || l.includes("unverified") ||
    l.includes("legitimacy") || l.includes("identity") || l.includes("safety") ||
    l.includes("risk") || l.includes("suspicious") || l.includes("concern")
  ) return "safety";
  return "safety";
}

// ─── Last resort fallback ─────────────────────────────────────────────────────
function titleFallback(eventTitle: string): { reason: string; category: CategoryKey } {
  const t = (eventTitle || "").toLowerCase();
  if (
    t.includes("crypto") || t.includes("invest") || t.includes("bitcoin") ||
    t.includes("trading") || t.includes("profit") || t.includes("forex")
  ) return {
    reason: "This listing promotes financial investments or guaranteed returns. Such events are not allowed on our platform as they are a common fraud indicator.",
    category: "fraud",
  };
  return {
    reason: "This listing did not pass our automated review. Common reasons include: vague description, unverifiable venue, suspicious pricing, or content that violates community standards. Please review all details carefully and resubmit.",
    category: "safety",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? "1d ago" : `${d}d ago`;
  if (h > 0) return h === 1 ? "1h ago" : `${h}h ago`;
  if (m > 0) return m === 1 ? "1m ago" : `${m}m ago`;
  return "Just now";
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <View style={S.sectionHeader}>
      <Text style={S.sectionLabel}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={S.sectionBadge}>
          <Text style={S.sectionBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ─── RejectedCard ─────────────────────────────────────────────────────────────
function RejectedCard({
  item,
  onPressEvent,
}: {
  item: NotifItem;
  onPressEvent: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const hasRealFlags = Array.isArray(item.flags) && item.flags.length > 0;
  const hasNote = !!(item.moderatorNote && item.moderatorNote.trim().length > 5);

  let mainReason = "";
  let mainCat: CategoryKey = "safety";
  let flagCards: Array<{
    type: string; description: string;
    severity: "high" | "medium" | "low"; category: CategoryKey;
  }> = [];

  if (hasRealFlags) {
    flagCards = item.flags!.map(f => ({
      type: f.type.replace(/^\[.*?\]\s*/i, "").trim(),
      description: f.description?.trim() || f.type,
      severity: (f.severity as "high" | "medium" | "low") ?? "medium",
      category: detectCategory(f.type + " " + (f.description || "")),
    }));
    const top  = flagCards.find(f => f.severity === "high") ?? flagCards[0];
    mainReason = top.description;
    mainCat    = top.category;
  } else if (hasNote) {
    mainReason = cleanNote(item.moderatorNote!);
    mainCat    = detectCategory(mainReason);
  } else if (item.message && item.message.trim().length > 20) {
    mainReason = item.message.trim();
    mainCat    = detectCategory(mainReason);
  } else {
    const fb   = titleFallback(item.eventTitle);
    mainReason = fb.reason;
    mainCat    = fb.category;
  }

  console.log("NOTIF DEBUG:", {
    id: item.id,
    moderatorNote: item.moderatorNote,
    message: item.message,
    flags: item.flags,
    eventTitle: item.eventTitle,
  });

  const catCfg = CATEGORY[mainCat];

  const toggle = () => {
    LayoutAnimation.configureNext({
      duration: 260,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
    });
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    setExpanded(v => !v);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={S.card}>
      <View style={[S.cardAccent, { backgroundColor: C.coral }]} />
      <View style={S.cardBody}>

        {/* Header */}
        <View style={S.cardHeader}>
          <View style={[S.iconWrap, { backgroundColor: catCfg.iconBg }]}>
            <Ionicons name={catCfg.icon as any} size={18} color={catCfg.iconColor} />
          </View>
          <View style={S.cardMeta}>
            <View style={S.titleRow}>
              <Text style={S.eventTitle} numberOfLines={1}>
                {item.eventEmoji} {item.eventTitle}
              </Text>
              <View style={[S.statusPill, { backgroundColor: C.coralSoft }]}>
                <Text style={[S.statusPillText, { color: C.coralText }]}>Rejected</Text>
              </View>
            </View>
            <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
            <View style={[S.categoryBadge, { backgroundColor: catCfg.badgeBg }]}>
              <Ionicons name={catCfg.icon as any} size={10} color={catCfg.badgeText} />
              <Text style={[S.categoryBadgeText, { color: catCfg.badgeText }]}>
                {catCfg.label}
              </Text>
            </View>
          </View>
          {!item.moderationRead && <View style={S.unreadDot} />}
        </View>

        {/* Rejection reason */}
        <Text style={S.reasonLabel}>Rejection reason</Text>
        <Text style={S.mainReason}>{mainReason}</Text>

        {/* Expandable flag cards — only when multiple real AI flags */}
        {hasRealFlags && flagCards.length > 1 && (
          <>
            <TouchableOpacity style={S.expandBtn} onPress={toggle} activeOpacity={0.7}>
              <Text style={S.expandBtnText}>
                {expanded ? "Hide details" : `See all ${flagCards.length} issues`}
              </Text>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Ionicons name="chevron-down" size={14} color={C.purple} />
              </Animated.View>
            </TouchableOpacity>

            {expanded && (
              <View style={S.expandedSection}>
                <View style={S.divider} />
                <Text style={S.detailLabel}>{flagCards.length} issues found</Text>
                {flagCards.map((flag, idx) => {
                  const sev        = SEVERITY_CONFIG[flag.severity] ?? SEVERITY_CONFIG.medium;
                  const flagCatCfg = CATEGORY[flag.category];
                  return (
                    <View
                      key={idx}
                      style={[S.flagCard, { borderLeftColor: sev.dot, backgroundColor: sev.bg }]}
                    >
                      <View style={S.flagTopRow}>
                        <View style={[S.flagIconWrap, { backgroundColor: flagCatCfg.iconBg }]}>
                          <Ionicons
                            name={flagCatCfg.icon as any}
                            size={13}
                            color={flagCatCfg.iconColor}
                          />
                        </View>
                        <Text style={S.flagName}>{flag.type}</Text>
                        <View style={[S.sevBadge, { backgroundColor: "rgba(0,0,0,0.06)" }]}>
                          <Text style={[S.sevBadgeText, { color: sev.text }]}>{sev.label}</Text>
                        </View>
                      </View>
                      <Text style={[S.flagDesc, { color: sev.text }]}>{flag.description}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* How to fix */}
        <View style={[S.fixBox, { marginTop: 12 }]}>
          <Ionicons
            name="construct-outline"
            size={14}
            color={C.amberText}
            style={{ marginTop: 1 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={S.fixTitle}>How to fix and resubmit</Text>
            <Text style={S.fixText}>
              Fix the issue above, update your listing details, and resubmit for review.
              Our team reviews all resubmissions within 24 hours.
            </Text>
          </View>
        </View>

      </View>
    </View>
  );
}

// ─── ApprovedCard ─────────────────────────────────────────────────────────────
// ✅ AI risk score removed — not shown to user
// ✅ View event / Share buttons removed
function ApprovedCard({
  item,
  onPressEvent,
}: {
  item: NotifItem;
  onPressEvent: (id: string) => void;
}) {
  const hasWarnings =
    item.approvalStatus === "approved_with_warnings" &&
    ((item.moderatorNote && item.moderatorNote.trim().length > 5) ||
      (Array.isArray(item.flags) && item.flags.length > 0));

  return (
    <TouchableOpacity
      style={S.card}
      onPress={() => item.eventId && onPressEvent(item.eventId)}
      activeOpacity={0.88}
    >
      <View style={[S.cardAccent, { backgroundColor: hasWarnings ? C.amber : C.green }]} />
      <View style={S.cardBody}>

        {/* Header */}
        <View style={S.cardHeader}>
          <View style={[S.iconWrap, { backgroundColor: hasWarnings ? C.amberSoft : C.greenSoft }]}>
            <Ionicons
              name={hasWarnings ? "warning" : "checkmark-circle"}
              size={18}
              color={hasWarnings ? C.amberText : C.greenText}
            />
          </View>
          <View style={S.cardMeta}>
            <View style={S.titleRow}>
              <Text style={S.eventTitle} numberOfLines={1}>
                {item.eventEmoji} {item.eventTitle}
              </Text>
              <View style={[S.statusPill, { backgroundColor: hasWarnings ? C.amberSoft : C.greenSoft }]}>
                <Text style={[S.statusPillText, { color: hasWarnings ? C.amberText : C.greenText }]}>
                  {hasWarnings ? "Live ⚠️" : "Approved"}
                </Text>
              </View>
            </View>
            <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
            <View style={[S.categoryBadge, { backgroundColor: hasWarnings ? C.amberSoft : C.tealSoft }]}>
              <Ionicons name="rocket-outline" size={10} color={hasWarnings ? C.amberText : C.tealText} />
              <Text style={[S.categoryBadgeText, { color: hasWarnings ? C.amberText : C.tealText }]}>
                Now live
              </Text>
            </View>
          </View>
        </View>

        {/* Live status box */}
        <View style={[S.approvedBox, hasWarnings && { backgroundColor: C.amberSoft, borderColor: C.amberBorder }]}>
          <Ionicons
            name={hasWarnings ? "alert-circle-outline" : "rocket-outline"}
            size={15}
            color={hasWarnings ? C.amberText : C.greenText}
            style={{ marginTop: 1, flexShrink: 0 }}
          />
          <Text style={[S.approvedText, hasWarnings && { color: C.amberText }]}>
            {hasWarnings
              ? "Your listing is live but needs improvement to avoid future rejection."
              : "Your listing is now discoverable on the app. Community members can find and join it."}
          </Text>
        </View>

        {/* Warning suggestions */}
        {hasWarnings && item.moderatorNote && item.moderatorNote.trim().length > 5 && (
          <View style={S.warnBox}>
            <Text style={S.warnTitle}>What to improve</Text>
            <Text style={S.warnText}>{item.moderatorNote}</Text>
          </View>
        )}

        {/* Individual flag rows */}
        {hasWarnings && Array.isArray(item.flags) && item.flags.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {item.flags.slice(0, 3).map((flag, idx) => (
              <View key={idx} style={S.warnFlagRow}>
                <Ionicons name="information-circle-outline" size={13} color={C.amberText} />
                <Text style={S.warnFlagText}>
                  <Text style={{ fontWeight: "700" }}>{flag.type}: </Text>
                  {flag.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ✅ AI risk score block REMOVED */}
        {/* ✅ View event / Share buttons REMOVED */}

      </View>
    </TouchableOpacity>
  );
}

// ─── JoinRequestCard ──────────────────────────────────────────────────────────
function JoinRequestCard({
  item,
  onAdmit,
  onReject,
  admitBusy,
}: {
  item: NotifItem;
  onAdmit: (item: NotifItem) => void;
  onReject: (item: NotifItem) => void;
  admitBusy: Record<string, boolean>;
}) {
  const admitKey  = `${item.id}-admit`;
  const rejectKey = `${item.id}-reject`;
  const busy = !!(admitBusy[admitKey] || admitBusy[rejectKey]);

  return (
    <View style={S.card}>
      <View style={[S.cardAccent, { backgroundColor: C.purple }]} />
      <View style={S.cardBody}>
        <View style={S.joinRow}>
          {item.userImageUrl ? (
            <Image source={{ uri: item.userImageUrl }} style={S.avatar} />
          ) : (
            <View style={S.avatarFallback}>
              <Text style={S.avatarLetter}>{(item.userName || "?")[0].toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={S.joinText}>
              <Text style={S.joinBold}>{item.userName}</Text>
              <Text style={S.joinMuted}> wants to join </Text>
              <Text style={S.joinEvent}>{item.eventEmoji} {item.eventTitle}</Text>
            </Text>
            <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
          </View>
        </View>
        {!!item.message && (
          <View style={S.msgBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.muted} />
            <Text style={S.msgText}>"{item.message}"</Text>
          </View>
        )}
        <View style={S.joinActionsRow}>
          <TouchableOpacity
            onPress={() => onAdmit(item)}
            disabled={busy}
            style={[S.btnPrimary, busy && S.btnDisabled, { flex: 1 }]}
            activeOpacity={0.85}
          >
            {admitBusy[admitKey] ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={15} color={C.white} />
                <Text style={S.btnPrimaryText}>Admit</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onReject(item)}
            disabled={busy}
            style={[S.btnSecondary, busy && S.btnDisabled, { flex: 1 }]}
            activeOpacity={0.8}
          >
            {admitBusy[rejectKey] ? (
              <ActivityIndicator color={C.muted} size="small" />
            ) : (
              <>
                <Ionicons name="close" size={15} color={C.ink2} />
                <Text style={S.btnSecondaryText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── ActivityRow ──────────────────────────────────────────────────────────────
function ActivityRow({
  item,
  onPressEvent,
}: {
  item: NotifItem;
  onPressEvent: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={S.activityRow}
      onPress={() => onPressEvent(item.eventId)}
      activeOpacity={0.7}
    >
      {item.userImageUrl ? (
        <Image source={{ uri: item.userImageUrl }} style={S.activityAvatar} />
      ) : (
        <View style={S.activityAvatarFallback}>
          <Text style={S.activityAvatarLetter}>{(item.userName || "?")[0].toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={S.activityText} numberOfLines={2}>
          <Text style={S.joinBold}>{item.userName}</Text>
          <Text style={S.joinMuted}> joined </Text>
          <Text style={S.joinEvent}>{item.eventEmoji} {item.eventTitle}</Text>
        </Text>
        <Text style={S.cardTime}>{timeAgo(item.timestamp)}</Text>
      </View>
      <View style={S.joinedBadge}>
        <Text style={S.joinedBadgeText}>Joined</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
// NOTE: "pending" tab removed — join requests shown inline in "All"
type TabKey = "all" | "approved" | "rejected" | "safety";
const TABS: { key: TabKey; label: string }[] = [
  { key: "all",      label: "All"           },
  { key: "approved", label: "Approved"      },
  { key: "rejected", label: "Rejected"      },
  { key: "safety",   label: "Safety alerts" },
];

// ─── Main export ──────────────────────────────────────────────────────────────
export default function NotificationSheet({
  visible,
  onClose,
  items,
  loading,
  admitBusy,
  onAdmit,
  onReject,
  onPressEvent,
  onMarkRead,
}: {
  visible: boolean;
  onClose: () => void;
  items: NotifItem[];
  loading: boolean;
  admitBusy: Record<string, boolean>;
  onAdmit: (item: NotifItem) => void;
  onReject: (item: NotifItem) => void;
  onPressEvent: (eventId: string) => void;
  onMarkRead: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // All buckets
  const pending  = items.filter(i => i.type === "pending");
  const joined   = items.filter(i => i.type === "joined");
  const approved = items.filter(i => i.type === "moderation_approved");
  const rejected = items.filter(i => i.type === "moderation_rejected");

  const safetyAlerts = rejected.filter(i => {
    const note  = (i.moderatorNote || "").toLowerCase();
    const title = (i.eventTitle   || "").toLowerCase();
    if (Array.isArray(i.flags) && i.flags.length > 0) {
      const cat = detectCategory(
        i.flags![0].type + " " + (i.flags![0].description || "")
      );
      return cat === "safety" || cat === "fraud";
    }
    return (
      note.includes("fraud")    || note.includes("scam")    ||
      note.includes("safety")   || note.includes("suspicious") ||
      note.includes("crypto")   || note.includes("invest")  ||
      note.includes("financial return") || note.includes("cash payment") ||
      title.includes("crypto")  || title.includes("invest") || title.includes("bitcoin")
    );
  });

  // Filter by active tab
  // "All" always shows join requests inline — other tabs don't
  const filterItems = (tab: TabKey) => {
    switch (tab) {
      case "approved": return { pending: [], approved, rejected: [],          joined     };
      case "rejected": return { pending: [], approved: [],   rejected,        joined: [] };
      case "safety":   return { pending: [], approved: [],   rejected: safetyAlerts, joined: [] };
      default:         return { pending, approved,           rejected,        joined     };
    }
  };

  const { pending: fp, approved: fa, rejected: fr, joined: fj } = filterItems(activeTab);

  const totalUnread = items.filter(
    i =>
      (i.type === "moderation_rejected" || i.type === "moderation_approved") &&
      !i.moderationRead
  ).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.root}>
        <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={onClose} />
        <BlurView
          intensity={Platform.OS === "ios" ? 95 : 110}
          tint="light"
          style={S.sheet}
        >
          <View style={S.grabber} />

          {/* Header */}
          <View style={S.header}>
            <View style={S.headerMain}>
              <View>
                <Text style={S.headerTitle}>Notifications</Text>
                <Text style={S.headerSub}>{items.length} updates</Text>
              </View>
              <View style={S.headerActions}>
                {totalUnread > 0 && (
                  <TouchableOpacity
                    style={S.markReadBtn}
                    onPress={onMarkRead}
                    activeOpacity={0.7}
                  >
                    <Text style={S.markReadText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={S.closeBtn} onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs — no Pending tab */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.tabsContainer}
              style={S.tabsScroll}
            >
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[S.tab, activeTab === tab.key && S.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[S.tabText, activeTab === tab.key && S.tabTextActive]}>
                    {tab.label}
                  </Text>
                  {tab.key === "safety" && safetyAlerts.length > 0 && (
                    <View style={S.tabBadge}>
                      <Text style={S.tabBadgeText}>{safetyAlerts.length}</Text>
                    </View>
                  )}
                  {tab.key === "rejected" && rejected.length > 0 && (
                    <View style={S.tabBadge}>
                      <Text style={S.tabBadgeText}>{rejected.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Scroll body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={S.scrollContent}
          >
            {loading && (
              <View style={S.loadingWrap}>
                <ActivityIndicator color={C.purple} size="large" />
                <Text style={S.loadingText}>Loading notifications…</Text>
              </View>
            )}

            {!loading && items.length === 0 && (
              <View style={S.emptyWrap}>
                <View style={S.emptyIconCircle}>
                  <Ionicons name="notifications-off-outline" size={28} color={C.muted} />
                </View>
                <Text style={S.emptyTitle}>All caught up</Text>
                <Text style={S.emptySub}>
                  Join requests, activity, and moderation decisions will appear here.
                </Text>
              </View>
            )}

            {/* Rejected */}
            {fr.length > 0 && (
              <View style={S.section}>
                <SectionHeader
                  label="Needs attention"
                  count={fr.filter(i => !i.moderationRead).length}
                />
                {fr.map(item => (
                  <RejectedCard key={item.id} item={item} onPressEvent={onPressEvent} />
                ))}
              </View>
            )}

            {/* Approved */}
            {fa.length > 0 && (
              <View style={S.section}>
                <SectionHeader label="Good news" />
                {fa.map(item => (
                  <ApprovedCard key={item.id} item={item} onPressEvent={onPressEvent} />
                ))}
              </View>
            )}

            {/* Join requests — always visible in All & Approved tabs */}
            {fp.length > 0 && (
              <View style={S.section}>
                <SectionHeader label="Join requests" count={fp.length} />
                {fp.map(item => (
                  <JoinRequestCard
                    key={item.id}
                    item={item}
                    onAdmit={onAdmit}
                    onReject={onReject}
                    admitBusy={admitBusy}
                  />
                ))}
              </View>
            )}

            {/* Recent activity */}
            {fj.length > 0 && (
              <View style={S.section}>
                <SectionHeader label="Recent activity" />
                <View style={S.activityContainer}>
                  {fj.map(item => (
                    <ActivityRow key={item.id} item={item} onPressEvent={onPressEvent} />
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:     { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.48)" },
  sheet: {
    height: "93%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  grabber: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  header: {
    paddingHorizontal: 20, paddingBottom: 0,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerMain: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", paddingVertical: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: C.ink, letterSpacing: -0.3 },
  headerSub:   { fontSize: 13, color: C.muted, fontWeight: "500", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  markReadBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: C.bgMuted, borderWidth: 0.5, borderColor: C.border,
  },
  markReadText: { fontSize: 12, fontWeight: "600", color: C.ink2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.bgMuted, borderWidth: 0.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  tabsScroll:     { marginTop: 4 },
  tabsContainer:  { paddingBottom: 12, paddingRight: 4, gap: 6, flexDirection: "row" },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg,
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  tabActive:     { backgroundColor: C.purple, borderColor: C.purple },
  tabText:       { fontSize: 12, fontWeight: "600", color: C.muted },
  tabTextActive: { color: C.purpleSoft },
  tabBadge: {
    backgroundColor: C.coral, paddingHorizontal: 6,
    paddingVertical: 1, borderRadius: 8, minWidth: 18, alignItems: "center",
  },
  tabBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 12 },
  loadingWrap:   { paddingVertical: 48, alignItems: "center", gap: 12 },
  loadingText:   { fontSize: 14, color: C.muted, fontWeight: "500" },
  emptyWrap:     { paddingVertical: 56, alignItems: "center" },
  emptyIconCircle: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: C.bgMuted, alignItems: "center",
    justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: C.ink, marginBottom: 6 },
  emptySub: {
    fontSize: 13, color: C.muted, textAlign: "center",
    paddingHorizontal: 36, lineHeight: 19,
  },
  section:       { marginBottom: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: C.muted,
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  sectionBadge: {
    backgroundColor: C.coralSoft, paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 10,
  },
  sectionBadgeText: { color: C.coralText, fontSize: 10, fontWeight: "700" },
  card: {
    backgroundColor: C.bg, borderRadius: 16, borderWidth: 0.5,
    borderColor: C.border, marginBottom: 10, flexDirection: "row",
    overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 14 },
  cardHeader: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, marginBottom: 10,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardMeta:   { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row", alignItems: "center",
    gap: 8, flexWrap: "wrap", marginBottom: 3,
  },
  eventTitle:     { fontSize: 14, fontWeight: "600", color: C.ink, flex: 1 },
  statusPill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: "600" },
  cardTime:       { fontSize: 11, color: C.muted, fontWeight: "500", marginBottom: 6 },
  categoryBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", paddingHorizontal: 9,
    paddingVertical: 3, borderRadius: 8,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: "600" },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.purple, flexShrink: 0, marginTop: 6,
  },
  // Reason
  reasonLabel: {
    fontSize: 10, fontWeight: "600", color: C.muted,
    letterSpacing: 0.4, textTransform: "capitalize", marginBottom: 6,
  },
  mainReason: {
    fontSize: 13, color: C.ink2, lineHeight: 20, marginBottom: 10,
  },
  expandBtn: {
    flexDirection: "row", alignItems: "center",
    gap: 5, alignSelf: "flex-start", marginBottom: 4,
  },
  expandBtnText:   { fontSize: 12, fontWeight: "600", color: C.purple },
  expandedSection: { marginTop: 4 },
  divider:         { height: 0.5, backgroundColor: C.border, marginVertical: 12 },
  detailLabel: {
    fontSize: 10, fontWeight: "700", color: C.muted,
    letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8,
  },
  flagCard: {
    borderLeftWidth: 3, borderRadius: 0,
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
    padding: 10, marginBottom: 8,
  },
  flagTopRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  flagIconWrap: {
    width: 24, height: 24, borderRadius: 7,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  flagName:     { flex: 1, fontSize: 12, fontWeight: "600", color: C.ink },
  sevBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sevBadgeText: { fontSize: 9, fontWeight: "700" },
  flagDesc:     { fontSize: 13, lineHeight: 19, paddingLeft: 32 },
  fixBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: C.amberSoft, borderRadius: 10, padding: 12,
    borderWidth: 0.5, borderColor: C.amberBorder,
  },
  fixTitle: {
    fontSize: 11, fontWeight: "700", color: C.amberText,
    marginBottom: 4,
  },
  fixText: { fontSize: 12, color: C.amberText, lineHeight: 17, fontWeight: "500" },
  approvedBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: C.greenSoft, borderRadius: 10, padding: 12,
    borderWidth: 0.5, borderColor: C.greenBorder, marginVertical: 10,
  },
  approvedText: { flex: 1, fontSize: 13, color: C.greenText, lineHeight: 19, fontWeight: "500" },
  actionsRow:     { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  joinActionsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  btnPrimary: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.purple, paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 10, justifyContent: "center",
  },
  btnPrimaryGreen: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.green, paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 10, justifyContent: "center",
  },
  btnPrimaryText: { color: C.white, fontSize: 13, fontWeight: "700" },
  btnSecondary: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.bg, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 0.5, borderColor: C.border, justifyContent: "center",
  },
  btnSecondaryText: { color: C.ink2, fontSize: 13, fontWeight: "600" },
  btnGhostGreen: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.greenSoft, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 0.5, borderColor: C.greenBorder,
  },
  btnGhostText: { fontSize: 13, fontWeight: "600" },
  btnDisabled:  { opacity: 0.5 },
  joinRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 4 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.bgSoft },
  avatarFallback: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.purpleSoft, alignItems: "center", justifyContent: "center",
  },
  avatarLetter: { fontSize: 17, fontWeight: "700", color: C.purple },
  joinText:  { fontSize: 14, lineHeight: 21, flex: 1 },
  joinBold:  { fontWeight: "700", color: C.ink },
  joinMuted: { color: C.ink2, fontWeight: "500" },
  joinEvent: { color: C.purple, fontWeight: "700" },
  msgBox: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    marginTop: 10, padding: 12, backgroundColor: C.bgSoft,
    borderRadius: 10, borderWidth: 0.5, borderColor: C.border,
  },
  msgText: { flex: 1, fontSize: 13, color: C.ink2, fontStyle: "italic", fontWeight: "500" },
  activityContainer: {
    backgroundColor: C.bg, borderRadius: 14, borderWidth: 0.5,
    borderColor: C.border, paddingHorizontal: 14, overflow: "hidden",
  },
  activityRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  activityAvatar:        { width: 38, height: 38, borderRadius: 12 },
  activityAvatarFallback: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.tealSoft, alignItems: "center", justifyContent: "center",
  },
  activityAvatarLetter: { fontSize: 14, fontWeight: "700", color: C.tealText },
  activityText:  { fontSize: 13, color: C.ink, lineHeight: 19 },
  joinedBadge: {
    backgroundColor: C.greenSoft, paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 10,
    borderWidth: 0.5, borderColor: C.greenBorder,
  },
  joinedBadgeText: { color: C.greenText, fontSize: 11, fontWeight: "600" },
  warnBox: {
    marginTop: 10, padding: 12, borderRadius: 10,
    backgroundColor: "#FFF8E7",
    borderWidth: 0.5, borderColor: C.amberBorder,
    borderLeftWidth: 3, borderLeftColor: C.amber,
  },
  warnTitle: {
    fontSize: 11, fontWeight: "700", color: C.amberText, marginBottom: 5,
  },
  warnText: { fontSize: 12, color: C.amberText, lineHeight: 18, fontWeight: "500" },
  warnFlagRow: {
    flexDirection: "row", gap: 7, alignItems: "flex-start",
    paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.amberBorder,
  },
  warnFlagText: { flex: 1, fontSize: 11, color: C.amberText, lineHeight: 16 },
});