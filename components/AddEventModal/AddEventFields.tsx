// import React, { useMemo } from "react";
// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     ActivityIndicator,
//     Platform,
//     ScrollView,
//     Pressable,
//     Modal,
//     LayoutAnimation,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import DateTimePicker from "@react-native-community/datetimepicker";

// import { styles } from "./AddEvent.styles";
// import type { Suggestion, ListingKind } from "./types";

// type Props = {
//     // Header
//     emoji: string;
//     title: string;
//     kind: ListingKind;
//     onClose: () => void;

//     // Basics
//     setTitle: (v: string) => void;
//     setKind: (k: ListingKind) => void;
//     priceText: string;
//     setPriceText: (v: string) => void;
//     priceCents: number | null;

//     // Details
//     showDetails: boolean;
//     setShowDetails: (v: boolean) => void;
//     description: string;
//     setDescription: (v: string) => void;

//     // Capacity
//     limitEnabled: boolean;
//     setLimitEnabled: (v: boolean) => void;
//     capacityText: string;
//     setCapacityText: (v: string) => void;
//     capacityOk: boolean;

//     // When
//     showWhen: boolean;
//     setShowWhen: (v: boolean) => void;
//     dateISO: string;
//     setDateISO: (v: string) => void;
//     time24: string;
//     setTime24: (v: string) => void;
//     dateLabel: string;
//     timeLabel: string;
//     dateOpen: boolean;
//     setDateOpen: (v: boolean) => void;
//     timeOpen: boolean;
//     setTimeOpen: (v: boolean) => void;

//     // Where
//     query: string;
//     setQuery: (v: string) => void;
//     suggestions: Suggestion[];
//     loadingSug: boolean;
//     onPickSuggestion: (s: Suggestion) => void;
//     clearQuery: () => void;
//     selectedAddress: string;
//     locLoading: boolean;

//     googleKey?: string;
//     mapRef: React.RefObject<WebView>;
//     mapHtml: string;
//     onMapMessage: (e: any) => void;

//     // Errors + Actions
//     err: string | null;
//     submitting: boolean;
//     canCreate: boolean;
//     onCancel: () => void;
//     onCreate: () => void;
// };

// export default function AddEventFields(props: Props) {
//     const {
//         emoji,
//         title,
//         kind,
//         onClose,

//         setTitle,
//         setKind,
//         priceText,
//         setPriceText,
//         priceCents,

//         showDetails,
//         setShowDetails,
//         description,
//         setDescription,

//         limitEnabled,
//         setLimitEnabled,
//         capacityText,
//         setCapacityText,
//         capacityOk,

//         showWhen,
//         setShowWhen,
//         dateISO,
//         setDateISO,
//         time24,
//         setTime24,
//         dateLabel,
//         timeLabel,
//         dateOpen,
//         setDateOpen,
//         timeOpen,
//         setTimeOpen,

//         query,
//         setQuery,
//         suggestions,
//         loadingSug,
//         onPickSuggestion,
//         clearQuery,
//         selectedAddress,
//         locLoading,

//         googleKey,
//         mapRef,
//         mapHtml,
//         onMapMessage,

//         err,
//         submitting,
//         canCreate,
//         onCancel,
//         onCreate,
//     } = props;

//     const primaryLabel = useMemo(() => {
//         if (submitting) return "Creating…";
//         if (kind === "service") return "Create service";
//         if (kind === "event_paid") return "Create paid event";
//         return "Create free event";
//     }, [submitting, kind]);

//     const tag = kind === "service" ? "Service" : kind === "event_paid" ? "Paid event" : "Free event";

//     return (
//         <>
//             <Header
//                 emoji={emoji}
//                 title={title}
//                 tag={tag}
//                 onClose={onClose}
//             />

//             <View style={styles.body}>
//                 {/* BASICS */}
//                 <Card>
//                     <CardTitle title="Name your event" subtitle="Give it a title people will click." />

//                     <InputShell>
//                         <Text style={styles.inlineEmoji}>{emoji}</Text>
//                         <TextInput
//                             value={title}
//                             onChangeText={setTitle}
//                             placeholder="e.g., Saturday yoga in the park"
//                             placeholderTextColor="#94A3B8"
//                             style={styles.textInput}
//                             returnKeyType="done"
//                         />
//                     </InputShell>

//                     <View style={{ height: 12 }} />

//                     <TriSegment
//                         a={{
//                             label: "Free",
//                             hint: "Join",
//                             active: kind === "event_free",
//                             onPress: () => setKind("event_free"),
//                         }}
//                         b={{
//                             label: "Paid",
//                             hint: "Ticket",
//                             active: kind === "event_paid",
//                             onPress: () => setKind("event_paid"),
//                         }}
//                         c={{
//                             label: "Service",
//                             hint: "Book",
//                             active: kind === "service",
//                             onPress: () => setKind("service"),
//                         }}
//                     />

//                     {(kind === "event_paid" || kind === "service") && (
//                         <View style={{ marginTop: 14 }}>
//                             <FieldLabel>
//                                 Price (USD){" "}
//                                 <Text style={{ color: "#64748B", fontWeight: "800" }}>
//                                     {kind === "event_paid" ? "• ticket" : "• service fee"}
//                                 </Text>
//                             </FieldLabel>

//                             <InputShell>
//                                 <Text style={styles.pricePrefix}>$</Text>
//                                 <TextInput
//                                     value={priceText}
//                                     onChangeText={setPriceText}
//                                     placeholder={kind === "event_paid" ? "15" : "25"}
//                                     placeholderTextColor="#94A3B8"
//                                     keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
//                                     style={styles.priceInput}
//                                 />
//                                 {priceCents !== null && (
//                                     <View style={styles.goodPill}>
//                                         <Text style={styles.goodPillText}>OK</Text>
//                                     </View>
//                                 )}
//                             </InputShell>

//                             {priceText.length > 0 && priceCents === null && (
//                                 <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>
//                                     Enter a valid price greater than 0.
//                                 </Text>
//                             )}
//                         </View>
//                     )}
//                 </Card>

//                 {/* ATTENDANCE (FREE ONLY) */}
//                 {kind === "event_free" && (
//                     <Card>
//                         <CardTitle
//                             title="Attendance"
//                             subtitle="Keep it open or limit how many people can join."
//                         />

//                         <View style={styles.segmented}>
//                             <SegmentButton
//                                 label="Open"
//                                 hint="Unlimited"
//                                 active={!limitEnabled}
//                                 onPress={() => setLimitEnabled(false)}
//                             />
//                             <SegmentButton
//                                 label="Limit"
//                                 hint="Set max"
//                                 active={limitEnabled}
//                                 onPress={() => setLimitEnabled(true)}
//                             />
//                         </View>

//                         {limitEnabled && (
//                             <View style={{ marginTop: 12 }}>
//                                 <FieldLabel>Max people</FieldLabel>

//                                 <InputShell>
//                                     <TextInput
//                                         value={capacityText}
//                                         onChangeText={setCapacityText}
//                                         placeholder="e.g., 20"
//                                         placeholderTextColor="#94A3B8"
//                                         keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
//                                         style={styles.textInput}
//                                     />
//                                 </InputShell>

//                                 {!capacityOk && (
//                                     <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>
//                                         Enter a valid number greater than 0.
//                                     </Text>
//                                 )}
//                             </View>
//                         )}
//                     </Card>
//                 )}

//                 {/* DETAILS */}
//                 <Card>
//                     <ToggleRow
//                         title="Details"
//                         subtitle={showDetails ? "Tap to hide" : "Tap to add description"}
//                         open={showDetails}
//                         onToggle={() => {
//                             LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//                             setShowDetails(!showDetails);
//                         }}
//                     />

//                     {showDetails && (
//                         <View style={{ marginTop: 12 }}>
//                             <View style={styles.descShell}>
//                                 <TextInput
//                                     value={description}
//                                     onChangeText={setDescription}
//                                     placeholder="Meetup point, what to bring, rules, contact info, etc."
//                                     placeholderTextColor="#94A3B8"
//                                     multiline
//                                     textAlignVertical="top"
//                                     style={styles.descInput}
//                                     returnKeyType="default"
//                                 />
//                             </View>
//                         </View>
//                     )}
//                 </Card>


//                 {/* WHEN */}
//                 <Card>
//                     <ToggleRow
//                         title="When"
//                         subtitle={showWhen ? "Tap to hide" : "Tap to add date/time"}
//                         open={showWhen}
//                         onToggle={() => {
//                             LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//                             setShowWhen(!showWhen);
//                         }}
//                     />

//                     {showWhen && (
//                         <>
//                             <View style={{ marginTop: 12 }}>
//                                 <View style={styles.whenGrid}>
//                                     {/* ✅ DATE TILE */}
//                                     <Pressable
//                                         onPress={() => {
//                                             // ✅ If empty, prefill today so selecting "today" works immediately
//                                             if (!dateISO) setDateISO(toLocalISODate(new Date()));
//                                             setDateOpen(true);
//                                         }}
//                                         style={styles.whenTile}
//                                         android_ripple={{ color: "#E2E8F0" }}
//                                     >
//                                         <View style={styles.whenTileTop}>
//                                             <View style={[styles.whenBadge, styles.whenBadgeBlue]}>
//                                                 <Text style={styles.whenBadgeText}>📅</Text>
//                                             </View>
//                                             <Text style={styles.whenTileLabel}>Date</Text>
//                                         </View>

//                                         <Text numberOfLines={1} style={[styles.whenTileValue, !dateISO && styles.whenTileValueMuted]}>
//                                             {dateISO ? dateLabel : "Select date"}
//                                         </Text>

//                                         <Text style={styles.whenTileHint}>Tap to choose</Text>
//                                     </Pressable>

//                                     {/* TIME TILE (unchanged) */}
//                                     <Pressable
//                                         onPress={() => setTimeOpen(true)}
//                                         style={styles.whenTile}
//                                         android_ripple={{ color: "#E2E8F0" }}
//                                     >
//                                         <View style={styles.whenTileTop}>
//                                             <View style={[styles.whenBadge, styles.whenBadgePurple]}>
//                                                 <Text style={styles.whenBadgeText}>⏰</Text>
//                                             </View>
//                                             <Text style={styles.whenTileLabel}>Time</Text>
//                                         </View>

//                                         <Text numberOfLines={1} style={[styles.whenTileValue, !time24 && styles.whenTileValueMuted]}>
//                                             {time24 ? timeLabel : "Select time"}
//                                         </Text>

//                                         <Text style={styles.whenTileHint}>Tap to choose</Text>
//                                     </Pressable>
//                                 </View>

//                                 {(dateISO || time24) ? (
//                                     <Pressable
//                                         hitSlop={10}
//                                         onPress={() => {
//                                             setDateISO("");
//                                             setTime24("");
//                                         }}
//                                         style={styles.clearPill}
//                                     >
//                                         <Text style={styles.clearPillText}>Clear date/time</Text>
//                                     </Pressable>
//                                 ) : null}
//                             </View>

//                             {/* ✅ DATE PICKER (fixed: allow today immediately + block past dates) */}
//                             <Modal transparent visible={dateOpen} animationType="fade" onRequestClose={() => setDateOpen(false)}>
//                                 <Pressable style={styles.pickerOverlay} onPress={() => setDateOpen(false)}>
//                                     <Pressable style={styles.pickerCard} onPress={() => { }}>
//                                         <Text style={styles.pickerTitle}>Pick a date</Text>

//                                         <DateTimePicker
//                                             value={dateISO ? isoToSafeDate(dateISO) : todayMidday()}
//                                             mode="date"
//                                             display={Platform.OS === "ios" ? "inline" : "default"}
//                                             themeVariant="light"
//                                             minimumDate={startOfToday()} // ✅ prevents selecting past dates
//                                             onChange={(_, d) => {
//                                                 if (!d) return;

//                                                 const chosen = new Date(d);
//                                                 chosen.setHours(12, 0, 0, 0);

//                                                 // ✅ safety: ignore any past date (extra guard)
//                                                 if (chosen.getTime() < startOfToday().getTime()) return;

//                                                 setDateISO(toLocalISODate(chosen));
//                                                 if (Platform.OS !== "ios") setDateOpen(false);
//                                             }}
//                                         />

//                                         <TouchableOpacity style={styles.pickerDone} onPress={() => setDateOpen(false)} activeOpacity={0.9}>
//                                             <Text style={styles.pickerDoneText}>Done</Text>
//                                         </TouchableOpacity>
//                                     </Pressable>
//                                 </Pressable>
//                             </Modal>

//                             {/* TIME PICKER (unchanged) */}
//                             <Modal transparent visible={timeOpen} animationType="fade" onRequestClose={() => setTimeOpen(false)}>
//                                 <Pressable style={styles.pickerOverlay} onPress={() => setTimeOpen(false)}>
//                                     <Pressable style={styles.pickerCard} onPress={() => { }}>
//                                         <Text style={styles.pickerTitle}>Pick a time</Text>
//                                         <DateTimePicker
//                                             value={timeToDate(time24)}
//                                             mode="time"
//                                             display={Platform.OS === "ios" ? "spinner" : "default"}
//                                             themeVariant="light"
//                                             onChange={(_, d) => {
//                                                 if (!d) return;
//                                                 const hh = d.getHours();
//                                                 const mm = d.getMinutes();
//                                                 setTime24(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
//                                                 if (Platform.OS !== "ios") setTimeOpen(false);
//                                             }}
//                                         />
//                                         <TouchableOpacity style={styles.pickerDone} onPress={() => setTimeOpen(false)} activeOpacity={0.9}>
//                                             <Text style={styles.pickerDoneText}>Done</Text>
//                                         </TouchableOpacity>
//                                     </Pressable>
//                                 </Pressable>
//                             </Modal>
//                         </>
//                     )}
//                 </Card>
                
//                 {/* WHERE */}
//                 <Card>
//                     <CardTitle title="Where" subtitle="Search a place or drop a pin on the map." />

//                     <InputShell>
//                         <Text style={styles.locationIcon}>📍</Text>
//                         <TextInput
//                             value={query}
//                             onChangeText={setQuery}
//                             placeholder="Search an address or place"
//                             placeholderTextColor="#94A3B8"
//                             style={styles.locationInput}
//                             returnKeyType="search"
//                         />
//                         {!!query && (
//                             <Pressable hitSlop={12} onPress={clearQuery} style={styles.iconBtn}>
//                                 <Text style={styles.iconBtnText}>×</Text>
//                             </Pressable>
//                         )}
//                     </InputShell>

//                     {(loadingSug || suggestions.length > 0) && (
//                         <View style={styles.dropdown}>
//                             {loadingSug ? (
//                                 <View style={styles.dropdownLoading}>
//                                     <ActivityIndicator />
//                                     <Text style={styles.dropdownLoadingText}>Searching…</Text>
//                                 </View>
//                             ) : (
//                                 <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
//                                     {suggestions.map((s) => (
//                                         <TouchableOpacity
//                                             key={s.id}
//                                             activeOpacity={0.9}
//                                             onPress={() => onPickSuggestion(s)}
//                                             style={styles.dropdownRow}
//                                         >
//                                             <View style={{ flex: 1 }}>
//                                                 <Text numberOfLines={1} style={styles.dropdownMain}>
//                                                     {s.main}
//                                                 </Text>
//                                                 {!!s.secondary && (
//                                                     <Text numberOfLines={1} style={styles.dropdownSecondary}>
//                                                         {s.secondary}
//                                                     </Text>
//                                                 )}
//                                             </View>
//                                             <Text style={styles.dropdownArrow}>›</Text>
//                                         </TouchableOpacity>
//                                     ))}
//                                 </ScrollView>
//                             )}
//                         </View>
//                     )}

//                     {!!selectedAddress && <Pill tone="success" text={selectedAddress} />}

//                     {locLoading && (
//                         <View style={styles.inlineLoading}>
//                             <ActivityIndicator />
//                             <Text style={styles.inlineLoadingText}>Resolving address…</Text>
//                         </View>
//                     )}

//                     <View style={styles.mapWrap}>
//                         {!googleKey ? (
//                             <View style={styles.mapFallback}>
//                                 <Text style={styles.mapFallbackTitle}>Google Maps key missing</Text>
//                                 <Text style={styles.mapFallbackBody}>
//                                     Add <Text style={{ fontWeight: "900" }}>extra.googleMapsKey</Text> in app config to use maps +
//                                     autocomplete.
//                                 </Text>
//                             </View>
//                         ) : (
//                             <>
//                                 <WebView
//                                     ref={mapRef}
//                                     style={styles.map}
//                                     originWhitelist={["*"]}
//                                     javaScriptEnabled
//                                     domStorageEnabled
//                                     source={{ html: mapHtml, baseUrl: "https://localhost" }}
//                                     onMessage={onMapMessage}
//                                 />

//                                 <View pointerEvents="none" style={styles.mapOverlay}>
//                                     <View style={styles.mapOverlayPill}>
//                                         <Text style={styles.mapOverlayText}>Tap / drag pin to choose location</Text>
//                                     </View>
//                                 </View>
//                             </>
//                         )}
//                     </View>

//                     {!!err && <Text style={styles.err}>{err}</Text>}
//                 </Card>

//                 <ActionsBar
//                     primaryLabel={primaryLabel}
//                     canCreate={canCreate}
//                     submitting={submitting}
//                     onCancel={onCancel}
//                     onCreate={onCreate}
//                 />
//             </View>
//         </>
//     );
// }

// /* ---------------- UI components ---------------- */

// function Header({
//     emoji,
//     title,
//     tag,
//     onClose,
// }: {
//     emoji: string;
//     title: string;
//     tag: string;
//     onClose: () => void;
// }) {
//     return (
//         <View style={styles.headerWrap}>
//             <View style={styles.headerGlow} />
//             <View style={styles.header}>
//                 <View style={styles.heroIcon}>
//                     <Text style={styles.heroEmoji}>{emoji}</Text>
//                 </View>

//                 <View style={{ flex: 1 }}>
//                     <Text style={styles.headerTitle}>Create</Text>
//                     <Text style={styles.headerSub} numberOfLines={1}>
//                         {title.trim() ? title.trim() : `${tag} • pick a location • add optional details`}
//                     </Text>
//                 </View>

//                 <Pressable onPress={onClose} hitSlop={16} style={styles.closeBtn}>
//                     <Text style={styles.closeText}>×</Text>
//                 </Pressable>
//             </View>
//         </View>
//     );
// }

// function Card({ children }: { children: React.ReactNode }) {
//     return <View style={styles.card}>{children}</View>;
// }

// function CardTitle({ title, subtitle }: { title: string; subtitle?: string }) {
//     return (
//         <View style={{ marginBottom: 12 }}>
//             <Text style={styles.cardTitle}>{title}</Text>
//             {!!subtitle && <Text style={styles.cardSub}>{subtitle}</Text>}
//         </View>
//     );
// }

// function FieldLabel({ children }: { children: React.ReactNode }) {
//     return <Text style={styles.smallLabel}>{children}</Text>;
// }

// function InputShell({ children }: { children: React.ReactNode }) {
//     return <View style={styles.inputShell}>{children}</View>;
// }

// function SegmentButton({
//     label,
//     hint,
//     active,
//     onPress,
// }: {
//     label: string;
//     hint?: string;
//     active: boolean;
//     onPress: () => void;
// }) {
//     return (
//         <Pressable onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
//             <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
//             {!!hint && <Text style={[styles.segmentHint, active && styles.segmentHintActive]}>{hint}</Text>}
//         </Pressable>
//     );
// }

// function TriSegment({
//     a,
//     b,
//     c,
// }: {
//     a: { label: string; hint?: string; active: boolean; onPress: () => void };
//     b: { label: string; hint?: string; active: boolean; onPress: () => void };
//     c: { label: string; hint?: string; active: boolean; onPress: () => void };
// }) {
//     return (
//         <View style={styles.segmented}>
//             <SegmentButton {...a} />
//             <SegmentButton {...b} />
//             <SegmentButton {...c} />
//         </View>
//     );
// }

// function ToggleRow({
//     title,
//     subtitle,
//     open,
//     onToggle,
// }: {
//     title: string;
//     subtitle: string;
//     open: boolean;
//     onToggle: () => void;
// }) {
//     return (
//         <Pressable onPress={onToggle} style={styles.toggleRow} android_ripple={{ color: "#E2E8F0" }}>
//             <View style={{ flex: 1 }}>
//                 <Text style={styles.toggleTitle}>{title}</Text>
//                 <Text style={styles.toggleSub}>{subtitle}</Text>
//             </View>
//             <View style={[styles.chevPill, open && styles.chevPillOpen]}>
//                 <Text style={[styles.chevText, open && styles.chevTextOpen]}>{open ? "−" : "+"}</Text>
//             </View>
//         </Pressable>
//     );
// }

// function Pill({ text, tone }: { text: string; tone: "success" | "info" }) {
//     const isSuccess = tone === "success";
//     return (
//         <View style={[styles.pill, isSuccess ? styles.pillSuccess : styles.pillInfo]}>
//             <Text numberOfLines={1} style={[styles.pillText, isSuccess ? styles.pillTextSuccess : styles.pillTextInfo]}>
//                 {text}
//             </Text>
//         </View>
//     );
// }

// function ActionsBar({
//     primaryLabel,
//     canCreate,
//     submitting,
//     onCancel,
//     onCreate,
// }: {
//     primaryLabel: string;
//     canCreate: boolean;
//     submitting: boolean;
//     onCancel: () => void;
//     onCreate: () => void;
// }) {
//     return (
//         <View style={styles.actions}>
//             <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel} activeOpacity={0.9}>
//                 <Text style={styles.secondaryText}>Cancel</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//                 style={[styles.primaryBtn, !canCreate && { opacity: 0.45 }]}
//                 onPress={onCreate}
//                 activeOpacity={0.92}
//                 disabled={!canCreate}
//             >
//                 {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{primaryLabel}</Text>}
//             </TouchableOpacity>
//         </View>
//     );
// }

// /* ---------------- helpers ---------------- */

// function isoToSafeDate(iso: string) {
//     if (!iso) return new Date();
//     return new Date(`${iso}T12:00:00`);
// }

// function timeToDate(time24: string) {
//     const d = new Date();
//     if (!time24) return d;
//     const [hh, mm] = time24.split(":").map((x) => parseInt(x, 10));
//     if (Number.isFinite(hh)) d.setHours(hh);
//     if (Number.isFinite(mm)) d.setMinutes(mm);
//     d.setSeconds(0);
//     d.setMilliseconds(0);
//     return d;
// }

// function startOfToday() {
//     const d = new Date();
//     d.setHours(0, 0, 0, 0);
//     return d;
// }

// // local YYYY-MM-DD (not UTC)
// function toLocalISODate(d: Date) {
//     const y = d.getFullYear();
//     const m = String(d.getMonth() + 1).padStart(2, "0");
//     const day = String(d.getDate()).padStart(2, "0");
//     return `${y}-${m}-${day}`;
// }

// // stable "today" value for picker (noon avoids DST edge cases)
// function todayMidday() {
//     const d = new Date();
//     d.setHours(12, 0, 0, 0);
//     return d;
// }











// import React, { useMemo } from "react";
// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     ActivityIndicator,
//     Platform,
//     ScrollView,
//     Pressable,
//     Modal,
//     LayoutAnimation,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import DateTimePicker from "@react-native-community/datetimepicker";

// import { styles } from "./AddEvent.styles";
// import type { Suggestion, ListingKind } from "./types";

// type Props = {
//     // Header
//     emoji: string;
//     title: string;
//     kind: ListingKind;
//     onClose: () => void;

//     // Basics
//     setTitle: (v: string) => void;
//     setKind: (k: ListingKind) => void;
//     priceText: string;
//     setPriceText: (v: string) => void;
//     priceCents: number | null;

//     // Details
//     showDetails: boolean;
//     setShowDetails: (v: boolean) => void;
//     description: string;
//     setDescription: (v: string) => void;

//     // Capacity
//     limitEnabled: boolean;
//     setLimitEnabled: (v: boolean) => void;
//     capacityText: string;
//     setCapacityText: (v: string) => void;
//     capacityOk: boolean;

//     // When
//     showWhen: boolean;
//     setShowWhen: (v: boolean) => void;
//     dateISO: string;
//     setDateISO: (v: string) => void;
//     time24: string;
//     setTime24: (v: string) => void;
//     dateLabel: string;
//     timeLabel: string;
//     dateOpen: boolean;
//     setDateOpen: (v: boolean) => void;
//     timeOpen: boolean;
//     setTimeOpen: (v: boolean) => void;

//     // Where
//     query: string;
//     setQuery: (v: string) => void;
//     suggestions: Suggestion[];
//     loadingSug: boolean;
//     onPickSuggestion: (s: Suggestion) => void;
//     clearQuery: () => void;
//     selectedAddress: string;
//     locLoading: boolean;

//     googleKey?: string;
//     mapRef: React.RefObject<WebView>;
//     mapHtml: string;
//     onMapMessage: (e: any) => void;

//     // Errors + Actions
//     err: string | null;
//     submitting: boolean;
//     canCreate: boolean;
//     onCancel: () => void;
//     onCreate: () => void;
// };

// export default function AddEventFields(props: Props) {
//     const {
//         emoji,
//         title,
//         kind,
//         onClose,

//         setTitle,
//         setKind,
//         priceText,
//         setPriceText,
//         priceCents,

//         showDetails,
//         setShowDetails,
//         description,
//         setDescription,

//         limitEnabled,
//         setLimitEnabled,
//         capacityText,
//         setCapacityText,
//         capacityOk,

//         showWhen,
//         setShowWhen,
//         dateISO,
//         setDateISO,
//         time24,
//         setTime24,
//         dateLabel,
//         timeLabel,
//         dateOpen,
//         setDateOpen,
//         timeOpen,
//         setTimeOpen,

//         query,
//         setQuery,
//         suggestions,
//         loadingSug,
//         onPickSuggestion,
//         clearQuery,
//         selectedAddress,
//         locLoading,

//         googleKey,
//         mapRef,
//         mapHtml,
//         onMapMessage,

//         err,
//         submitting,
//         canCreate,
//         onCancel,
//         onCreate,
//     } = props;

//     const primaryLabel = useMemo(() => {
//         if (submitting) return "Creating…";
//         if (kind === "service") return "Create service";
//         if (kind === "event_paid") return "Create paid event";
//         return "Create free event";
//     }, [submitting, kind]);

//     const tag = kind === "service" ? "Service" : kind === "event_paid" ? "Paid event" : "Free event";

//     return (
//         <>
//             <Header
//                 emoji={emoji}
//                 title={title}
//                 tag={tag}
//                 onClose={onClose}
//             />

//             <View style={styles.body}>
//                 {/* BASICS */}
//                 <Card>
//                     <CardTitle title="Name your event" subtitle="Give it a title people will click." />

//                     <InputShell>
//                         <Text style={styles.inlineEmoji}>{emoji}</Text>
//                         <TextInput
//                             value={title}
//                             onChangeText={setTitle}
//                             placeholder="e.g., Saturday yoga in the park"
//                             placeholderTextColor="#94A3B8"
//                             style={styles.textInput}
//                             returnKeyType="done"
//                         />
//                     </InputShell>

//                     <View style={{ height: 12 }} />

//                     <TriSegment
//                         a={{
//                             label: "Free",
//                             hint: "Join",
//                             active: kind === "event_free",
//                             onPress: () => setKind("event_free"),
//                         }}
//                         b={{
//                             label: "Paid",
//                             hint: "Ticket",
//                             active: kind === "event_paid",
//                             onPress: () => setKind("event_paid"),
//                         }}
//                         c={{
//                             label: "Service",
//                             hint: "Book",
//                             active: kind === "service",
//                             onPress: () => setKind("service"),
//                         }}
//                     />

//                     {(kind === "event_paid" || kind === "service") && (
//                         <View style={{ marginTop: 14 }}>
//                             <FieldLabel>
//                                 Price (USD){" "}
//                                 <Text style={{ color: "#64748B", fontWeight: "800" }}>
//                                     {kind === "event_paid" ? "• ticket" : "• service fee"}
//                                 </Text>
//                             </FieldLabel>

//                             <InputShell>
//                                 <Text style={styles.pricePrefix}>$</Text>
//                                 <TextInput
//                                     value={priceText}
//                                     onChangeText={setPriceText}
//                                     placeholder={kind === "event_paid" ? "15" : "25"}
//                                     placeholderTextColor="#94A3B8"
//                                     keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
//                                     style={styles.priceInput}
//                                 />
//                                 {priceCents !== null && (
//                                     <View style={styles.goodPill}>
//                                         <Text style={styles.goodPillText}>OK</Text>
//                                     </View>
//                                 )}
//                             </InputShell>

//                             {priceText.length > 0 && priceCents === null && (
//                                 <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>
//                                     Enter a valid price greater than 0.
//                                 </Text>
//                             )}
//                         </View>
//                     )}
//                 </Card>

//                 {/* ATTENDANCE (FREE ONLY) */}
//                 {kind === "event_free" && (
//                     <Card>
//                         <CardTitle
//                             title="Attendance"
//                             subtitle="Keep it open or limit how many people can join."
//                         />

//                         <View style={styles.segmented}>
//                             <SegmentButton
//                                 label="Open"
//                                 hint="Unlimited"
//                                 active={!limitEnabled}
//                                 onPress={() => setLimitEnabled(false)}
//                             />
//                             <SegmentButton
//                                 label="Limit"
//                                 hint="Set max"
//                                 active={limitEnabled}
//                                 onPress={() => setLimitEnabled(true)}
//                             />
//                         </View>

//                         {limitEnabled && (
//                             <View style={{ marginTop: 12 }}>
//                                 <FieldLabel>Max people</FieldLabel>

//                                 <InputShell>
//                                     <TextInput
//                                         value={capacityText}
//                                         onChangeText={setCapacityText}
//                                         placeholder="e.g., 20"
//                                         placeholderTextColor="#94A3B8"
//                                         keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
//                                         style={styles.textInput}
//                                     />
//                                 </InputShell>

//                                 {!capacityOk && (
//                                     <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>
//                                         Enter a valid number greater than 0.
//                                     </Text>
//                                 )}
//                             </View>
//                         )}
//                     </Card>
//                 )}

//                 {/* DETAILS */}
//                 <Card>
//                     <ToggleRow
//                         title="Details"
//                         subtitle={showDetails ? "Tap to hide" : "Tap to add description"}
//                         open={showDetails}
//                         onToggle={() => {
//                             LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//                             setShowDetails(!showDetails);
//                         }}
//                     />

//                     {showDetails && (
//                         <View style={{ marginTop: 12 }}>
//                             <View style={styles.descShell}>
//                                 <TextInput
//                                     value={description}
//                                     onChangeText={setDescription}
//                                     placeholder="Meetup point, what to bring, rules, contact info, etc."
//                                     placeholderTextColor="#94A3B8"
//                                     multiline
//                                     textAlignVertical="top"
//                                     style={styles.descInput}
//                                     returnKeyType="default"
//                                 />
//                             </View>
//                         </View>
//                     )}
//                 </Card>


//                 {/* WHEN */}
//                 <Card>
//                     <ToggleRow
//                         title="When"
//                         subtitle={showWhen ? "Tap to hide" : "Tap to add date/time"}
//                         open={showWhen}
//                         onToggle={() => {
//                             LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//                             setShowWhen(!showWhen);
//                         }}
//                     />

//                     {showWhen && (
//                         <>
//                             <View style={{ marginTop: 12 }}>
//                                 <View style={styles.whenGrid}>
//                                     {/* ✅ DATE TILE */}
//                                     <Pressable
//                                         onPress={() => {
//                                             // ✅ If empty, prefill today so selecting "today" works immediately
//                                             if (!dateISO) setDateISO(toLocalISODate(new Date()));
//                                             setDateOpen(true);
//                                         }}
//                                         style={styles.whenTile}
//                                         android_ripple={{ color: "#E2E8F0" }}
//                                     >
//                                         <View style={styles.whenTileTop}>
//                                             <View style={[styles.whenBadge, styles.whenBadgeBlue]}>
//                                                 <Text style={styles.whenBadgeText}>📅</Text>
//                                             </View>
//                                             <Text style={styles.whenTileLabel}>Date</Text>
//                                         </View>

//                                         <Text numberOfLines={1} style={[styles.whenTileValue, !dateISO && styles.whenTileValueMuted]}>
//                                             {dateISO ? dateLabel : "Select date"}
//                                         </Text>

//                                         <Text style={styles.whenTileHint}>Tap to choose</Text>
//                                     </Pressable>

//                                     {/* TIME TILE (unchanged) */}
//                                     <Pressable
//                                         onPress={() => setTimeOpen(true)}
//                                         style={styles.whenTile}
//                                         android_ripple={{ color: "#E2E8F0" }}
//                                     >
//                                         <View style={styles.whenTileTop}>
//                                             <View style={[styles.whenBadge, styles.whenBadgePurple]}>
//                                                 <Text style={styles.whenBadgeText}>⏰</Text>
//                                             </View>
//                                             <Text style={styles.whenTileLabel}>Time</Text>
//                                         </View>

//                                         <Text numberOfLines={1} style={[styles.whenTileValue, !time24 && styles.whenTileValueMuted]}>
//                                             {time24 ? timeLabel : "Select time"}
//                                         </Text>

//                                         <Text style={styles.whenTileHint}>Tap to choose</Text>
//                                     </Pressable>
//                                 </View>

//                                 {(dateISO || time24) ? (
//                                     <Pressable
//                                         hitSlop={10}
//                                         onPress={() => {
//                                             setDateISO("");
//                                             setTime24("");
//                                         }}
//                                         style={styles.clearPill}
//                                     >
//                                         <Text style={styles.clearPillText}>Clear date/time</Text>
//                                     </Pressable>
//                                 ) : null}
//                             </View>

//                             {/* ✅ DATE PICKER (fixed: allow today immediately + block past dates) */}
//                             <Modal transparent visible={dateOpen} animationType="fade" onRequestClose={() => setDateOpen(false)}>
//                                 <Pressable style={styles.pickerOverlay} onPress={() => setDateOpen(false)}>
//                                     <Pressable style={styles.pickerCard} onPress={() => { }}>
//                                         <Text style={styles.pickerTitle}>Pick a date</Text>

//                                         <DateTimePicker
//                                             value={dateISO ? isoToSafeDate(dateISO) : todayMidday()}
//                                             mode="date"
//                                             display={Platform.OS === "ios" ? "inline" : "default"}
//                                             themeVariant="light"
//                                             minimumDate={startOfToday()} // ✅ prevents selecting past dates
//                                             onChange={(_, d) => {
//                                                 if (!d) return;

//                                                 const chosen = new Date(d);
//                                                 chosen.setHours(12, 0, 0, 0);

//                                                 // ✅ safety: ignore any past date (extra guard)
//                                                 if (chosen.getTime() < startOfToday().getTime()) return;

//                                                 setDateISO(toLocalISODate(chosen));
//                                                 if (Platform.OS !== "ios") setDateOpen(false);
//                                             }}
//                                         />

//                                         <TouchableOpacity style={styles.pickerDone} onPress={() => setDateOpen(false)} activeOpacity={0.9}>
//                                             <Text style={styles.pickerDoneText}>Done</Text>
//                                         </TouchableOpacity>
//                                     </Pressable>
//                                 </Pressable>
//                             </Modal>

//                             {/* TIME PICKER (unchanged) */}
//                             <Modal transparent visible={timeOpen} animationType="fade" onRequestClose={() => setTimeOpen(false)}>
//                                 <Pressable style={styles.pickerOverlay} onPress={() => setTimeOpen(false)}>
//                                     <Pressable style={styles.pickerCard} onPress={() => { }}>
//                                         <Text style={styles.pickerTitle}>Pick a time</Text>
//                                         <DateTimePicker
//                                             value={timeToDate(time24)}
//                                             mode="time"
//                                             display={Platform.OS === "ios" ? "spinner" : "default"}
//                                             themeVariant="light"
//                                             onChange={(_, d) => {
//                                                 if (!d) return;
//                                                 const hh = d.getHours();
//                                                 const mm = d.getMinutes();
//                                                 setTime24(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
//                                                 if (Platform.OS !== "ios") setTimeOpen(false);
//                                             }}
//                                         />
//                                         <TouchableOpacity style={styles.pickerDone} onPress={() => setTimeOpen(false)} activeOpacity={0.9}>
//                                             <Text style={styles.pickerDoneText}>Done</Text>
//                                         </TouchableOpacity>
//                                     </Pressable>
//                                 </Pressable>
//                             </Modal>
//                         </>
//                     )}
//                 </Card>
                
//                 {/* WHERE */}
//                 <Card>
//                     <CardTitle title="Where" subtitle="Search a place or drop a pin on the map." />

//                     <InputShell>
//                         <Text style={styles.locationIcon}>📍</Text>
//                         <TextInput
//                             value={query}
//                             onChangeText={setQuery}
//                             placeholder="Search an address or place"
//                             placeholderTextColor="#94A3B8"
//                             style={styles.locationInput}
//                             returnKeyType="search"
//                         />
//                         {!!query && (
//                             <Pressable hitSlop={12} onPress={clearQuery} style={styles.iconBtn}>
//                                 <Text style={styles.iconBtnText}>×</Text>
//                             </Pressable>
//                         )}
//                     </InputShell>

//                     {(loadingSug || suggestions.length > 0) && (
//                         <View style={styles.dropdown}>
//                             {loadingSug ? (
//                                 <View style={styles.dropdownLoading}>
//                                     <ActivityIndicator />
//                                     <Text style={styles.dropdownLoadingText}>Searching…</Text>
//                                 </View>
//                             ) : (
//                                 <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
//                                     {suggestions.map((s) => (
//                                         <TouchableOpacity
//                                             key={s.id}
//                                             activeOpacity={0.9}
//                                             onPress={() => onPickSuggestion(s)}
//                                             style={styles.dropdownRow}
//                                         >
//                                             <View style={{ flex: 1 }}>
//                                                 <Text numberOfLines={1} style={styles.dropdownMain}>
//                                                     {s.main}
//                                                 </Text>
//                                                 {!!s.secondary && (
//                                                     <Text numberOfLines={1} style={styles.dropdownSecondary}>
//                                                         {s.secondary}
//                                                     </Text>
//                                                 )}
//                                             </View>
//                                             <Text style={styles.dropdownArrow}>›</Text>
//                                         </TouchableOpacity>
//                                     ))}
//                                 </ScrollView>
//                             )}
//                         </View>
//                     )}

//                     {!!selectedAddress && <Pill tone="success" text={selectedAddress} />}

//                     {locLoading && (
//                         <View style={styles.inlineLoading}>
//                             <ActivityIndicator />
//                             <Text style={styles.inlineLoadingText}>Resolving address…</Text>
//                         </View>
//                     )}

//                     <View style={styles.mapWrap}>
//                         {!googleKey ? (
//                             <View style={styles.mapFallback}>
//                                 <Text style={styles.mapFallbackTitle}>Google Maps key missing</Text>
//                                 <Text style={styles.mapFallbackBody}>
//                                     Add <Text style={{ fontWeight: "900" }}>extra.googleMapsKey</Text> in app config to use maps +
//                                     autocomplete.
//                                 </Text>
//                             </View>
//                         ) : (
//                             <>
//                                 <WebView
//                                     ref={mapRef}
//                                     style={styles.map}
//                                     originWhitelist={["*"]}
//                                     javaScriptEnabled
//                                     domStorageEnabled
//                                     source={{ html: mapHtml, baseUrl: "https://localhost" }}
//                                     onMessage={onMapMessage}
//                                 />

//                                 <View pointerEvents="none" style={styles.mapOverlay}>
//                                     <View style={styles.mapOverlayPill}>
//                                         <Text style={styles.mapOverlayText}>Tap / drag pin to choose location</Text>
//                                     </View>
//                                 </View>
//                             </>
//                         )}
//                     </View>

//                     {!!err && <Text style={styles.err}>{err}</Text>}
//                 </Card>

//                 <ActionsBar
//                     primaryLabel={primaryLabel}
//                     canCreate={canCreate}
//                     submitting={submitting}
//                     onCancel={onCancel}
//                     onCreate={onCreate}
//                 />
//             </View>
//         </>
//     );
// }

// /* ---------------- UI components ---------------- */

// function Header({
//     emoji,
//     title,
//     tag,
//     onClose,
// }: {
//     emoji: string;
//     title: string;
//     tag: string;
//     onClose: () => void;
// }) {
//     return (
//         <View style={styles.headerWrap}>
//             <View style={styles.headerGlow} />
//             <View style={styles.header}>
//                 <View style={styles.heroIcon}>
//                     <Text style={styles.heroEmoji}>{emoji}</Text>
//                 </View>

//                 <View style={{ flex: 1 }}>
//                     <Text style={styles.headerTitle}>Create</Text>
//                     <Text style={styles.headerSub} numberOfLines={1}>
//                         {title.trim() ? title.trim() : `${tag} • pick a location • add optional details`}
//                     </Text>
//                 </View>

//                 <Pressable onPress={onClose} hitSlop={16} style={styles.closeBtn}>
//                     <Text style={styles.closeText}>×</Text>
//                 </Pressable>
//             </View>
//         </View>
//     );
// }

// function Card({ children }: { children: React.ReactNode }) {
//     return <View style={styles.card}>{children}</View>;
// }

// function CardTitle({ title, subtitle }: { title: string; subtitle?: string }) {
//     return (
//         <View style={{ marginBottom: 12 }}>
//             <Text style={styles.cardTitle}>{title}</Text>
//             {!!subtitle && <Text style={styles.cardSub}>{subtitle}</Text>}
//         </View>
//     );
// }

// function FieldLabel({ children }: { children: React.ReactNode }) {
//     return <Text style={styles.smallLabel}>{children}</Text>;
// }

// function InputShell({ children }: { children: React.ReactNode }) {
//     return <View style={styles.inputShell}>{children}</View>;
// }

// function SegmentButton({
//     label,
//     hint,
//     active,
//     onPress,
// }: {
//     label: string;
//     hint?: string;
//     active: boolean;
//     onPress: () => void;
// }) {
//     return (
//         <Pressable onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
//             <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
//             {!!hint && <Text style={[styles.segmentHint, active && styles.segmentHintActive]}>{hint}</Text>}
//         </Pressable>
//     );
// }

// function TriSegment({
//     a,
//     b,
//     c,
// }: {
//     a: { label: string; hint?: string; active: boolean; onPress: () => void };
//     b: { label: string; hint?: string; active: boolean; onPress: () => void };
//     c: { label: string; hint?: string; active: boolean; onPress: () => void };
// }) {
//     return (
//         <View style={styles.segmented}>
//             <SegmentButton {...a} />
//             <SegmentButton {...b} />
//             <SegmentButton {...c} />
//         </View>
//     );
// }

// function ToggleRow({
//     title,
//     subtitle,
//     open,
//     onToggle,
// }: {
//     title: string;
//     subtitle: string;
//     open: boolean;
//     onToggle: () => void;
// }) {
//     return (
//         <Pressable onPress={onToggle} style={styles.toggleRow} android_ripple={{ color: "#E2E8F0" }}>
//             <View style={{ flex: 1 }}>
//                 <Text style={styles.toggleTitle}>{title}</Text>
//                 <Text style={styles.toggleSub}>{subtitle}</Text>
//             </View>
//             <View style={[styles.chevPill, open && styles.chevPillOpen]}>
//                 <Text style={[styles.chevText, open && styles.chevTextOpen]}>{open ? "−" : "+"}</Text>
//             </View>
//         </Pressable>
//     );
// }

// function Pill({ text, tone }: { text: string; tone: "success" | "info" }) {
//     const isSuccess = tone === "success";
//     return (
//         <View style={[styles.pill, isSuccess ? styles.pillSuccess : styles.pillInfo]}>
//             <Text numberOfLines={1} style={[styles.pillText, isSuccess ? styles.pillTextSuccess : styles.pillTextInfo]}>
//                 {text}
//             </Text>
//         </View>
//     );
// }

// function ActionsBar({
//     primaryLabel,
//     canCreate,
//     submitting,
//     onCancel,
//     onCreate,
// }: {
//     primaryLabel: string;
//     canCreate: boolean;
//     submitting: boolean;
//     onCancel: () => void;
//     onCreate: () => void;
// }) {
//     return (
//         <View style={styles.actions}>
//             <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel} activeOpacity={0.9}>
//                 <Text style={styles.secondaryText}>Cancel</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//                 style={[styles.primaryBtn, !canCreate && { opacity: 0.45 }]}
//                 onPress={onCreate}
//                 activeOpacity={0.92}
//                 disabled={!canCreate}
//             >
//                 {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{primaryLabel}</Text>}
//             </TouchableOpacity>
//         </View>
//     );
// }

// /* ---------------- helpers ---------------- */

// function isoToSafeDate(iso: string) {
//     if (!iso) return new Date();
//     return new Date(`${iso}T12:00:00`);
// }

// function timeToDate(time24: string) {
//     const d = new Date();
//     if (!time24) return d;
//     const [hh, mm] = time24.split(":").map((x) => parseInt(x, 10));
//     if (Number.isFinite(hh)) d.setHours(hh);
//     if (Number.isFinite(mm)) d.setMinutes(mm);
//     d.setSeconds(0);
//     d.setMilliseconds(0);
//     return d;
// }

// function startOfToday() {
//     const d = new Date();
//     d.setHours(0, 0, 0, 0);
//     return d;
// }

// // local YYYY-MM-DD (not UTC)
// function toLocalISODate(d: Date) {
//     const y = d.getFullYear();
//     const m = String(d.getMonth() + 1).padStart(2, "0");
//     const day = String(d.getDate()).padStart(2, "0");
//     return `${y}-${m}-${day}`;
// }

// // stable "today" value for picker (noon avoids DST edge cases)
// function todayMidday() {
//     const d = new Date();
//     d.setHours(12, 0, 0, 0);
//     return d;
// }













// components/AddEventModal/AddEventFields.tsx
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Platform, ScrollView, Pressable, Modal, LayoutAnimation,
} from "react-native";
import { WebView } from "react-native-webview";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";

import { styles } from "./AddEvent.styles";
import type { Suggestion, ListingKind } from "./types";

type Props = {
  emoji: string; title: string; kind: ListingKind; onClose: () => void;
  setTitle: (v: string) => void; setKind: (k: ListingKind) => void;
  priceText: string; setPriceText: (v: string) => void; priceCents: number | null;
  showDetails: boolean; setShowDetails: (v: boolean) => void;
  description: string; setDescription: (v: string) => void;
  limitEnabled: boolean; setLimitEnabled: (v: boolean) => void;
  capacityText: string; setCapacityText: (v: string) => void; capacityOk: boolean;
  // Service slots
  slots: string[]; setSlots: (v: string[]) => void;
  slotDuration: string; setSlotDuration: (v: string) => void;
  showWhen: boolean; setShowWhen: (v: boolean) => void;
  dateISO: string; setDateISO: (v: string) => void;
  time24: string; setTime24: (v: string) => void;
  dateLabel: string; timeLabel: string;
  dateOpen: boolean; setDateOpen: (v: boolean) => void;
  timeOpen: boolean; setTimeOpen: (v: boolean) => void;
  query: string; setQuery: (v: string) => void;
  suggestions: Suggestion[]; loadingSug: boolean;
  onPickSuggestion: (s: Suggestion) => void; clearQuery: () => void;
  selectedAddress: string; locLoading: boolean;
  googleKey?: string;
  mapRef: React.RefObject<WebView>;
  mapHtml: string; onMapMessage: (e: any) => void;
  err: string | null; submitting: boolean; canCreate: boolean;
  onCancel: () => void; onCreate: () => void;
  joinPolicy: "open" | "approval"; setJoinPolicy: (v: "open" | "approval") => void;
  isServiceMode?: boolean;
};

// Common time slots for service
const COMMON_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];

function formatSlot(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh)) return t;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm || 0).padStart(2, "0")} ${ampm}`;
}

export default function AddEventFields(props: Props) {
  const {
    emoji, title, kind, onClose, setTitle, setKind, priceText, setPriceText, priceCents,
    showDetails, setShowDetails, description, setDescription,
    limitEnabled, setLimitEnabled, capacityText, setCapacityText, capacityOk,
    slots, setSlots, slotDuration, setSlotDuration,
    showWhen, setShowWhen, dateISO, setDateISO, time24, setTime24,
    dateLabel, timeLabel, dateOpen, setDateOpen, timeOpen, setTimeOpen,
    query, setQuery, suggestions, loadingSug, onPickSuggestion, clearQuery,
    selectedAddress, locLoading, googleKey, mapRef, mapHtml, onMapMessage,
  err, submitting, canCreate, onCancel, onCreate,
  joinPolicy, setJoinPolicy, isServiceMode,
} = props;

  const primaryLabel = useMemo(() => {
    if (submitting) return "Creating…";
    if (kind === "service") return "Create Service";
    if (kind === "event_paid") return "Create Paid Event";
    return "Create Free Event";
  }, [submitting, kind]);

  const tag = kind === "service" ? "Service" : kind === "event_paid" ? "Paid Event" : "Free Event";

  const toggleSlot = (slot: string) => {
    setSlots(slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot]);
  };

  return (
    <>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerGlow} />
        <View style={styles.header}>
          <View style={[styles.heroIcon, kind === "service" ? { backgroundColor: "rgba(139,92,246,0.18)", borderColor: "rgba(139,92,246,0.35)" } : kind === "event_paid" ? { backgroundColor: "rgba(234,179,8,0.18)", borderColor: "rgba(234,179,8,0.35)" } : {}]}>
            <Text style={styles.heroEmoji}>{kind === "service" ? "🛠️" : emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {kind === "service" ? "Create Service" : "Create Event"}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {title.trim() ? title.trim() : `${tag} • pick a location`}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={16} style={styles.closeBtn}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {/* BASICS */}
        <Card>
          <CardTitle title={kind === "service" ? "Name your service" : "Name your event"} subtitle="Give it a title people will click." />

          <InputShell>
            <Text style={styles.inlineEmoji}>{kind === "service" ? "🛠️" : emoji}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={kind === "service" ? "e.g., Yoga session, Photography" : "e.g., Saturday coffee meetup"}
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
              returnKeyType="done"
            />
          </InputShell>

          <View style={{ height: 12 }} />

          {/* ✅ Filtered Kind selector */}
          {!isServiceMode ? (
            <View style={styles.segmented}>
              <SegmentButton
                label="Free"
                hint="Join"
                active={kind === "event_free"}
                onPress={() => setKind("event_free")}
              />
              <SegmentButton
                label="Paid"
                hint="Ticket"
                active={kind === "event_paid"}
                onPress={() => setKind("event_paid")}
              />
            </View>
          ) : (
            <View style={[styles.goodPill, { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 16 }]}>
              <Text style={[styles.goodPillText, { fontSize: 14 }]}>✨ Professional Service Mode</Text>
            </View>
          )}

          {/* Price for paid/service */}
          {(kind === "event_paid" || kind === "service") && (
            <View style={{ marginTop: 14 }}>
              <FieldLabel>
                Price{" "}
                <Text style={{ color: "#64748B", fontWeight: "800" }}>
                  {kind === "event_paid" ? "• ticket" : "• per slot"}
                </Text>
              </FieldLabel>
              <InputShell>
                <Text style={styles.pricePrefix}>₹</Text>
                <TextInput
                  value={priceText}
                  onChangeText={setPriceText}
                  placeholder={kind === "event_paid" ? "299" : "500"}
                  placeholderTextColor="#94A3B8"
                  keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
                  style={styles.priceInput}
                />
                {priceCents !== null && (
                  <View style={styles.goodPill}><Text style={styles.goodPillText}>OK</Text></View>
                )}
              </InputShell>
              {priceText.length > 0 && priceCents === null && (
                <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>Enter a valid price greater than 0.</Text>
              )}
            </View>
          )}
        </Card>

        {/* SERVICE SLOTS */}
        {kind === "service" && (
          <Card>
            <CardTitle title="Available Slots" subtitle="Pick the time slots you offer" />

            {/* Duration */}
            <FieldLabel>Duration per slot (minutes)</FieldLabel>
            <View style={[styles.segmented, { marginBottom: 14 }]}>
              {["30", "45", "60", "90", "120"].map(d => (
                <Pressable
                  key={d}
                  onPress={() => setSlotDuration(d)}
                  style={[styles.segmentBtn, slotDuration === d && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentLabel, slotDuration === d && styles.segmentLabelActive]}>{d}</Text>
                  <Text style={[styles.segmentHint, slotDuration === d && styles.segmentHintActive]}>min</Text>
                </Pressable>
              ))}
            </View>

            {/* Slot picker */}
            <FieldLabel>Select available time slots</FieldLabel>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              {COMMON_SLOTS.map(slot => {
                const on = slots.includes(slot);
                return (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => toggleSlot(slot)}
                    activeOpacity={0.85}
                    style={{
                      paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1,
                      backgroundColor: on ? "rgba(139,92,246,0.18)" : "#F8FAFC",
                      borderColor: on ? "rgba(139,92,246,0.5)" : "#E2E8F0",
                    }}
                  >
                    <Text style={{ fontWeight: "900", fontSize: 12, color: on ? "#7c3aed" : "#0F172A" }}>
                      {formatSlot(slot)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {slots.length > 0 && (
              <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.goodPill]}>
                  <Text style={styles.goodPillText}>{slots.length} slots selected</Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* ATTENDANCE (FREE ONLY) */}
        {kind === "event_free" && (
          <Card>
            <CardTitle title="Attendance" subtitle="Keep it open or limit how many people can join." />
            <View style={styles.segmented}>
              <SegmentButton label="Open" hint="Unlimited" active={!limitEnabled} onPress={() => setLimitEnabled(false)} />
              <SegmentButton label="Limit" hint="Set max" active={limitEnabled} onPress={() => setLimitEnabled(true)} />
            </View>
            {limitEnabled && (
              <View style={{ marginTop: 12 }}>
                <FieldLabel>Max people</FieldLabel>
                <InputShell>
                  <TextInput
                    value={capacityText} onChangeText={setCapacityText}
                    placeholder="e.g., 20" placeholderTextColor="#94A3B8"
                    keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
                    style={styles.textInput}
                  />
                </InputShell>
                {!capacityOk && <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>Enter a valid number greater than 0.</Text>}
              </View>
            )}
          </Card>
        )}

        {/* DETAILS */}
        <Card>
          <ToggleRow
            title="Details" subtitle={showDetails ? "Tap to hide" : "Tap to add description"}
            open={showDetails}
            onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowDetails(!showDetails); }}
          />
          {showDetails && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.descShell}>
                <TextInput
                  value={description} onChangeText={setDescription}
                  placeholder="Meetup point, what to bring, rules, contact info, etc."
                  placeholderTextColor="#94A3B8" multiline textAlignVertical="top"
                  style={styles.descInput} returnKeyType="default"
                />
              </View>
            </View>
          )}
        </Card>

        {/* WHEN */}
        <Card>
          <ToggleRow
            title="When" subtitle={showWhen ? "Tap to hide" : "Tap to add date/time"}
            open={showWhen}
            onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowWhen(!showWhen); }}
          />
          {showWhen && (
            <>
              <View style={{ marginTop: 12 }}>
                <View style={styles.whenGrid}>
                  <Pressable onPress={() => { if (!dateISO) setDateISO(toLocalISODate(new Date())); setDateOpen(true); }} style={styles.whenTile}>
                    <View style={styles.whenTileTop}>
                      <View style={[styles.whenBadge, styles.whenBadgeBlue]}><Text style={styles.whenBadgeText}>📅</Text></View>
                      <Text style={styles.whenTileLabel}>Date</Text>
                    </View>
                    <Text numberOfLines={1} style={[styles.whenTileValue, !dateISO && styles.whenTileValueMuted]}>{dateISO ? dateLabel : "Select date"}</Text>
                    <Text style={styles.whenTileHint}>Tap to choose</Text>
                  </Pressable>

                  <Pressable onPress={() => setTimeOpen(true)} style={styles.whenTile}>
                    <View style={styles.whenTileTop}>
                      <View style={[styles.whenBadge, styles.whenBadgePurple]}><Text style={styles.whenBadgeText}>⏰</Text></View>
                      <Text style={styles.whenTileLabel}>Time</Text>
                    </View>
                    <Text numberOfLines={1} style={[styles.whenTileValue, !time24 && styles.whenTileValueMuted]}>{time24 ? timeLabel : "Select time"}</Text>
                    <Text style={styles.whenTileHint}>Tap to choose</Text>
                  </Pressable>
                </View>

                {(dateISO || time24) ? (
                  <Pressable hitSlop={10} onPress={() => { setDateISO(""); setTime24(""); }} style={styles.clearPill}>
                    <Text style={styles.clearPillText}>Clear date/time</Text>
                  </Pressable>
                ) : null}
              </View>

              <Modal transparent visible={dateOpen} animationType="fade" onRequestClose={() => setDateOpen(false)}>
                <Pressable style={styles.pickerOverlay} onPress={() => setDateOpen(false)}>
                  <Pressable style={styles.pickerCard} onPress={() => { }}>
                    <Text style={styles.pickerTitle}>Pick a date</Text>
                    <DateTimePicker
                      value={dateISO ? isoToSafeDate(dateISO) : todayMidday()}
                      mode="date" display={Platform.OS === "ios" ? "inline" : "default"}
                      themeVariant="light" minimumDate={startOfToday()}
                      onChange={(_, d) => {
                        if (!d) return;
                        const chosen = new Date(d); chosen.setHours(12, 0, 0, 0);
                        if (chosen.getTime() < startOfToday().getTime()) return;
                        setDateISO(toLocalISODate(chosen));
                        if (Platform.OS !== "ios") setDateOpen(false);
                      }}
                    />
                    <TouchableOpacity style={styles.pickerDone} onPress={() => setDateOpen(false)} activeOpacity={0.9}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </Pressable>
                </Pressable>
              </Modal>

              <Modal transparent visible={timeOpen} animationType="fade" onRequestClose={() => setTimeOpen(false)}>
                <Pressable style={styles.pickerOverlay} onPress={() => setTimeOpen(false)}>
                  <Pressable style={styles.pickerCard} onPress={() => { }}>
                    <Text style={styles.pickerTitle}>Pick a time</Text>
                    <DateTimePicker
                      value={timeToDate(time24)} mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "default"} themeVariant="light"
                      onChange={(_, d) => {
                        if (!d) return;
                        const hh = d.getHours(); const mm = d.getMinutes();
                        setTime24(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
                        if (Platform.OS !== "ios") setTimeOpen(false);
                      }}
                    />
                    <TouchableOpacity style={styles.pickerDone} onPress={() => setTimeOpen(false)} activeOpacity={0.9}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </Pressable>
                </Pressable>
              </Modal>
            </>
          )}
        </Card>

        {/* WHERE */}
        <Card>
          <CardTitle title="Where" subtitle="Search a place or drop a pin on the map." />
          <InputShell>
            <Text style={styles.locationIcon}>📍</Text>
            <TextInput
              value={query} onChangeText={setQuery}
              placeholder="Search an address or place" placeholderTextColor="#94A3B8"
              style={styles.locationInput} returnKeyType="search"
            />
            {!!query && (
              <Pressable hitSlop={12} onPress={clearQuery} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>×</Text>
              </Pressable>
            )}
          </InputShell>

          {(loadingSug || suggestions.length > 0) && (
            <View style={styles.dropdown}>
              {loadingSug ? (
                <View style={styles.dropdownLoading}><ActivityIndicator /><Text style={styles.dropdownLoadingText}>Searching…</Text></View>
              ) : (
                <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                  {suggestions.map((s) => (
                    <TouchableOpacity key={s.id} activeOpacity={0.9} onPress={() => onPickSuggestion(s)} style={styles.dropdownRow}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={styles.dropdownMain}>{s.main}</Text>
                        {!!s.secondary && <Text numberOfLines={1} style={styles.dropdownSecondary}>{s.secondary}</Text>}
                      </View>
                      <Text style={styles.dropdownArrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {!!selectedAddress && <Pill tone="success" text={selectedAddress} />}
          {locLoading && (
            <View style={styles.inlineLoading}>
              <ActivityIndicator /><Text style={styles.inlineLoadingText}>Resolving address…</Text>
            </View>
          )}

          <View style={styles.mapWrap}>
            {!googleKey ? (
              <View style={styles.mapFallback}>
                <Text style={styles.mapFallbackTitle}>Google Maps key missing</Text>
              </View>
            ) : (
              <>
                <WebView
                  ref={mapRef} style={styles.map} originWhitelist={["*"]}
                  javaScriptEnabled domStorageEnabled
                  source={{ html: mapHtml, baseUrl: "https://localhost" }}
                  onMessage={onMapMessage}
                />
                <View pointerEvents="none" style={styles.mapOverlay}>
                  <View style={styles.mapOverlayPill}>
                    <Text style={styles.mapOverlayText}>Tap / drag pin to choose location</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {!!err && <Text style={styles.err}>{err}</Text>}
        </Card>

        {/* ✅ WHO CAN JOIN — only for events (not services) */}
        {kind !== "service" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Who can join?</Text>
            <Text style={styles.cardSub}>Control how people get into your event</Text>

            <View style={{ marginTop: 14, gap: 10 }}>
              {/* Open */}
              <TouchableOpacity
                onPress={() => setJoinPolicy("open")}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 14,
                  padding: 14, borderRadius: 18, borderWidth: 2,
                  borderColor: joinPolicy === "open" ? "#0A84FF" : "#E2E8F0",
                  backgroundColor: joinPolicy === "open" ? "rgba(10,132,255,0.06)" : "#F8FAFC",
                }}
              >
                <View style={{
                  width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                  borderColor: joinPolicy === "open" ? "#0A84FF" : "#CBD5E1",
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: joinPolicy === "open" ? "#0A84FF" : "transparent",
                }}>
                  {joinPolicy === "open" && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 14 }}>Anyone — direct join</Text>
                  <Text style={{ color: "#64748B", fontWeight: "700", fontSize: 12, marginTop: 3 }}>
                    People can join instantly without approval
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Approval */}
              <TouchableOpacity
                onPress={() => setJoinPolicy("approval")}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 14,
                  padding: 14, borderRadius: 18, borderWidth: 2,
                  borderColor: joinPolicy === "approval" ? "#7C3AED" : "#E2E8F0",
                  backgroundColor: joinPolicy === "approval" ? "rgba(124,58,237,0.06)" : "#F8FAFC",
                }}
              >
                <View style={{
                  width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                  borderColor: joinPolicy === "approval" ? "#7C3AED" : "#CBD5E1",
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: joinPolicy === "approval" ? "#7C3AED" : "transparent",
                }}>
                  {joinPolicy === "approval" && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "900", color: "#0F172A", fontSize: 14 }}>Approval required</Text>
                  <Text style={{ color: "#64748B", fontWeight: "700", fontSize: 12, marginTop: 3 }}>
                    You review and approve each join request
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
                  backgroundColor: "rgba(124,58,237,0.10)", borderWidth: 1, borderColor: "rgba(124,58,237,0.25)",
                }}>
                  <Text style={{ color: "#7C3AED", fontWeight: "900", fontSize: 10 }}>HOST</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel} activeOpacity={0.9}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, !canCreate && { opacity: 0.45 },
              kind === "service" ? { backgroundColor: "#7c3aed" } :
              kind === "event_paid" ? { backgroundColor: "#b45309" } : {}
            ]}
            onPress={onCreate} activeOpacity={0.92} disabled={!canCreate}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{primaryLabel}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

/* --- UI Components --- */
function Card({ children }: { children: React.ReactNode }) { return <View style={styles.card}>{children}</View>; }
function CardTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.cardTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.cardSub}>{subtitle}</Text>}
    </View>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) { return <Text style={styles.smallLabel}>{children}</Text>; }
function InputShell({ children }: { children: React.ReactNode }) { return <View style={styles.inputShell}>{children}</View>; }

function SegmentButton({ label, hint, active, onPress }: { label: string; hint?: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
      {!!hint && <Text style={[styles.segmentHint, active && styles.segmentHintActive]}>{hint}</Text>}
    </Pressable>
  );
}

function TriSegment({ a, b, c }: { a: any; b: any; c: any }) {
  return (
    <View style={styles.segmented}>
      <SegmentButton {...a} />
      <SegmentButton {...b} />
      <SegmentButton {...c} />
    </View>
  );
}

function ToggleRow({ title, subtitle, open, onToggle }: { title: string; subtitle: string; open: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSub}>{subtitle}</Text>
      </View>
      <View style={[styles.chevPill, open && styles.chevPillOpen]}>
        <Text style={[styles.chevText, open && styles.chevTextOpen]}>{open ? "−" : "+"}</Text>
      </View>
    </Pressable>
  );
}

function Pill({ text, tone }: { text: string; tone: "success" | "info" }) {
  const isSuccess = tone === "success";
  return (
    <View style={[styles.pill, isSuccess ? styles.pillSuccess : styles.pillInfo]}>
      <Text numberOfLines={1} style={[styles.pillText, isSuccess ? styles.pillTextSuccess : styles.pillTextInfo]}>{text}</Text>
    </View>
  );
}

/* --- helpers --- */
function isoToSafeDate(iso: string) { if (!iso) return new Date(); return new Date(`${iso}T12:00:00`); }
function timeToDate(time24: string) {
  const d = new Date();
  if (!time24) return d;
  const [hh, mm] = time24.split(":").map((x) => parseInt(x, 10));
  if (Number.isFinite(hh)) d.setHours(hh);
  if (Number.isFinite(mm)) d.setMinutes(mm);
  d.setSeconds(0); d.setMilliseconds(0); return d;
}
function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayMidday() { const d = new Date(); d.setHours(12, 0, 0, 0); return d; }