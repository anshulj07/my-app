// components/EditEventModal/EditEventModalView.tsx
import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    ScrollView,
    Pressable,
    Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Modalize } from "react-native-modalize";
import { WebView } from "react-native-webview";

import type { Suggestion, LocationPayload, EventKind } from "../AddEventModal/types";
import { formatTime12h, parsePriceToCents } from "../AddEventModal/utils/time";
import { reverseGeocode } from "../AddEventModal/google/geocode";
import { buildLocationFromAddressComponents } from "../AddEventModal/location/buildLocation";
import { textToEmoji } from "../AddEventModal/utils/emoji";


function makeCityKey(city: string) {
    return city
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s/g, "-");
}

function isoToSafeDate(iso: string) {
    // avoid timezone shifting by anchoring mid-day
    if (!iso) return new Date();
    return new Date(`${iso}T12:00:00`);
}

function timeToDate(time24: string) {
    const d = new Date();
    if (!time24) return d;
    const [hh, mm] = time24.split(":").map((x) => parseInt(x, 10));
    if (Number.isFinite(hh)) d.setHours(hh);
    if (Number.isFinite(mm)) d.setMinutes(mm);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
}

type ModalizeHandle = {
    open: () => void;
    close: () => void;
};

export default function EditEventModalView(props: {
    sheetRef: React.RefObject<ModalizeHandle | null>;
    onClosed: () => void;
    modalHeight: number;

    isCreator: boolean;
    canSave: boolean;

    title: string;
    setTitle: (v: string) => void;

    description: string; // ✅ NEW
    setDescription: (v: string) => void;

    kind: EventKind;
    setKind: (v: EventKind) => void;

    priceText: string;
    setPriceText: (v: string) => void;

    dateISO: string;
    setDateISO: (v: string) => void;

    time24: string;
    setTime24: (v: string) => void;

    query: string;
    setQuery: (v: string) => void;

    suggestions: Suggestion[];
    loadingSug: boolean;
    onPickSuggestion: (s: Suggestion) => void;

    coord: { lat: number; lng: number } | null;
    setCoord: (v: { lat: number; lng: number } | null) => void;

    selectedAddress: string;
    setSelectedAddress: (v: string) => void;

    locationPayload: LocationPayload | null;
    setLocationPayload: (v: LocationPayload | null) => void;

    locLoading: boolean;
    setLocLoading: (v: boolean) => void;

    mapRef: React.RefObject<WebView | null>;
    mapHtml: string;

    mapReady: boolean;
    setMapReady: (v: boolean) => void;

    GOOGLE_KEY?: string;

    err: string | null;
    submitting: boolean;
    deleting: boolean;

    onClosePress: () => void;
    onSave: () => void;
    onDelete: () => void;
}) {
    const priceCents = useMemo(() => {
        if (props.kind !== "service") return null;
        return parsePriceToCents(props.priceText);
    }, [props.kind, props.priceText]);

    const dateLabel = useMemo(() => {
        if (!props.dateISO) return "No date";
        return isoToSafeDate(props.dateISO).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    }, [props.dateISO]);

    const timeLabel = useMemo(() => {
        if (!props.time24) return "No time";
        const [hh, mm] = props.time24.split(":").map((x) => parseInt(x, 10));
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "No time";
        return formatTime12h(hh, mm);
    }, [props.time24]);

    // ✅ Apple-style pickers
    const [dateOpen, setDateOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    const emoji = useMemo(() => textToEmoji(props.title || ""), [props.title]);

    return (
        <Modalize
            ref={props.sheetRef}
            onClosed={props.onClosed}
            modalHeight={props.modalHeight}
            modalStyle={styles.modal}
            handleStyle={styles.handle}
            overlayStyle={styles.overlay}
            keyboardAvoidingBehavior={Platform.select({ ios: "padding", android: "height" })}
            scrollViewProps={{ keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false }}
        >
            <Header
                title={props.title}
                subtitle={!props.isCreator ? "View only • Not the creator" : "Edit details • Save changes"}
                onClose={props.onClosePress}
            />

            <View style={styles.body}>
                {/* Title */}
                <Card>
                    <CardTitle title="Title" subtitle="Make it obvious and clickable." />
                    <InputShell>
                        <Text style={styles.inlineEmoji}>{emoji}</Text>

                        <TextInput
                            value={props.title}
                            onChangeText={props.setTitle}
                            placeholder="e.g., Saturday yoga in the park"
                            placeholderTextColor="#94A3B8"
                            style={styles.textInput}
                            returnKeyType="done"
                        />
                    </InputShell>
                </Card>

                {/* ✅ Description (wide) */}
                <Card>
                    <CardTitle title="Description" subtitle="Add details people should know." />
                    <View style={styles.descShell}>
                        <TextInput
                            value={props.description}
                            onChangeText={props.setDescription}
                            placeholder="What to bring, exact meetup point, rules, etc."
                            placeholderTextColor="#94A3B8"
                            multiline
                            textAlignVertical="top"
                            style={styles.descInput}
                        />
                    </View>
                </Card>

                {/* Type + price */}
                <Card>
                    <CardTitle title="Type" subtitle="Free events are joinable. Service events are bookable." />
                    <Segmented
                        left={{
                            label: "Free",
                            hint: "Join",
                            active: props.kind === "free",
                            onPress: () => props.setKind("free"),
                        }}
                        right={{
                            label: "Service",
                            hint: "Book",
                            active: props.kind === "service",
                            onPress: () => props.setKind("service"),
                        }}
                    />

                    {props.kind === "service" && (
                        <View style={{ marginTop: 14 }}>
                            <FieldLabel>Price (USD)</FieldLabel>
                            <InputShell>
                                <Text style={styles.pricePrefix}>$</Text>
                                <TextInput
                                    value={props.priceText}
                                    onChangeText={props.setPriceText}
                                    placeholder="25"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
                                    style={styles.priceInput}
                                />
                                {priceCents !== null && (
                                    <View style={styles.goodPill}>
                                        <Text style={styles.goodPillText}>OK</Text>
                                    </View>
                                )}
                            </InputShell>

                            {props.priceText.length > 0 && priceCents === null && (
                                <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>
                                    Enter a valid price greater than 0.
                                </Text>
                            )}
                        </View>
                    )}
                </Card>

                {/* ✅ Apple calendar-style date/time (no dropdowns) */}
                {/* ✅ Apple-ish date/time */}
                <Card>
                    <View style={styles.whenHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>When</Text>
                            <Text style={styles.cardSub}>tap to pick</Text>
                        </View>

                        {(props.dateISO || props.time24) ? (
                            <Pressable
                                hitSlop={10}
                                onPress={() => {
                                    props.setDateISO("");
                                    props.setTime24("");
                                }}
                                style={styles.clearPill}
                            >
                                <Text style={styles.clearPillText}>Clear</Text>
                            </Pressable>
                        ) : null}
                    </View>

                    <View style={styles.whenGrid}>
                        {/* Date */}
                        <Pressable onPress={() => setDateOpen(true)} style={styles.whenTile} android_ripple={{ color: "#E2E8F0" }}>
                            <View style={styles.whenTileTop}>
                                <View style={[styles.whenBadge, styles.whenBadgeBlue]}>
                                    <Text style={styles.whenBadgeText}>📅</Text>
                                </View>
                                <Text style={styles.whenTileLabel}>Date</Text>
                            </View>

                            <Text numberOfLines={1} style={[styles.whenTileValue, !props.dateISO && styles.whenTileValueMuted]}>
                                {props.dateISO ? dateLabel : "Select date"}
                            </Text>

                            <Text style={styles.whenTileHint}>
                                Tap to choose
                            </Text>
                        </Pressable>

                        {/* Time */}
                        <Pressable onPress={() => setTimeOpen(true)} style={styles.whenTile} android_ripple={{ color: "#E2E8F0" }}>
                            <View style={styles.whenTileTop}>
                                <View style={[styles.whenBadge, styles.whenBadgePurple]}>
                                    <Text style={styles.whenBadgeText}>⏰</Text>
                                </View>
                                <Text style={styles.whenTileLabel}>Time</Text>
                            </View>

                            <Text numberOfLines={1} style={[styles.whenTileValue, !props.time24 && styles.whenTileValueMuted]}>
                                {props.time24 ? timeLabel : "Select time"}
                            </Text>

                            <Text style={styles.whenTileHint}>
                                Tap to choose
                            </Text>
                        </Pressable>
                    </View>
                </Card>

                {/* Date picker modal */}
                <Modal transparent visible={dateOpen} animationType="fade" onRequestClose={() => setDateOpen(false)}>
                    <Pressable style={styles.pickerOverlay} onPress={() => setDateOpen(false)}>
                        <Pressable style={styles.pickerCard} onPress={() => { }}>
                            <Text style={styles.pickerTitle}>Pick a date</Text>
                            <DateTimePicker
                                value={isoToSafeDate(props.dateISO)}
                                mode="date"
                                display={Platform.OS === "ios" ? "inline" : "default"}
                                themeVariant="light"            // ✅ forces black text UI on iOS
                                textColor="#0F172A"             // ✅ helps esp. spinner
                                accentColor="#0A84FF"           // optional but nice
                                onChange={(_, d) => {
                                    if (!d) return;
                                    const iso = d.toISOString().slice(0, 10);
                                    props.setDateISO(iso);
                                    if (Platform.OS !== "ios") setDateOpen(false);
                                }}
                            />
                            <TouchableOpacity style={styles.pickerDone} onPress={() => setDateOpen(false)} activeOpacity={0.9}>
                                <Text style={styles.pickerDoneText}>Done</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* Time picker modal */}
                <Modal transparent visible={timeOpen} animationType="fade" onRequestClose={() => setTimeOpen(false)}>
                    <Pressable style={styles.pickerOverlay} onPress={() => setTimeOpen(false)}>
                        <Pressable style={styles.pickerCard} onPress={() => { }}>
                            <Text style={styles.pickerTitle}>Pick a time</Text>
                            <DateTimePicker
                                value={timeToDate(props.time24)}
                                mode="time"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                themeVariant="light"
                                textColor="#0F172A"
                                accentColor="#0A84FF"
                                onChange={(_, d) => {
                                    if (!d) return;
                                    const hh = d.getHours();
                                    const mm = d.getMinutes();
                                    props.setTime24(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
                                    if (Platform.OS !== "ios") setTimeOpen(false);
                                }}
                            />
                            <TouchableOpacity style={styles.pickerDone} onPress={() => setTimeOpen(false)} activeOpacity={0.9}>
                                <Text style={styles.pickerDoneText}>Done</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* Where (same as before, unchanged UI block) */}
                <Card>
                    <CardTitle title="Where" subtitle="Search a place or drop a pin." />

                    <InputShell>
                        <Text style={styles.locationIcon}>📍</Text>
                        <TextInput
                            value={props.query}
                            onChangeText={props.setQuery}
                            placeholder="Search an address or place"
                            placeholderTextColor="#94A3B8"
                            style={styles.locationInput}
                            returnKeyType="search"
                        />
                        {!!props.query && (
                            <Pressable
                                hitSlop={12}
                                onPress={() => {
                                    props.setQuery("");
                                    props.setSelectedAddress("");
                                    props.setLocationPayload(null);
                                }}
                                style={styles.iconBtn}
                            >
                                <Text style={styles.iconBtnText}>×</Text>
                            </Pressable>
                        )}
                    </InputShell>

                    {(props.loadingSug || props.suggestions.length > 0) && (
                        <View style={styles.dropdown}>
                            {props.loadingSug ? (
                                <View style={styles.dropdownLoading}>
                                    <ActivityIndicator />
                                    <Text style={styles.dropdownLoadingText}>Searching…</Text>
                                </View>
                            ) : (
                                <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                                    {props.suggestions.map((s) => (
                                        <TouchableOpacity
                                            key={s.id}
                                            activeOpacity={0.9}
                                            onPress={() => props.onPickSuggestion(s)}
                                            style={styles.dropdownRow}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text numberOfLines={1} style={styles.dropdownMain}>
                                                    {s.main}
                                                </Text>
                                                {!!s.secondary && (
                                                    <Text numberOfLines={1} style={styles.dropdownSecondary}>
                                                        {s.secondary}
                                                    </Text>
                                                )}
                                            </View>
                                            <Text style={styles.dropdownArrow}>›</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}

                    {!!props.selectedAddress && <Pill tone="success" text={props.selectedAddress} />}
                    {!!props.locationPayload && (
                        <Pill
                            tone="info"
                            text={`${props.locationPayload.city}${props.locationPayload.admin1Code ? `, ${props.locationPayload.admin1Code}` : ""}${props.locationPayload.countryCode ? ` • ${props.locationPayload.countryCode}` : ""
                                }`}
                        />
                    )}

                    {props.locLoading && (
                        <View style={styles.inlineLoading}>
                            <ActivityIndicator />
                            <Text style={styles.inlineLoadingText}>Resolving address…</Text>
                        </View>
                    )}

                    <View style={styles.mapWrap}>
                        {!props.GOOGLE_KEY ? (
                            <View style={styles.mapFallback}>
                                <Text style={styles.mapFallbackTitle}>Google Maps key missing</Text>
                                <Text style={styles.mapFallbackBody}>
                                    Add <Text style={{ fontWeight: "900" }}>extra.googleMapsKey</Text> to enable maps + autocomplete.
                                </Text>
                            </View>
                        ) : (
                            <WebView
                                ref={props.mapRef}
                                style={styles.map}
                                originWhitelist={["*"]}
                                javaScriptEnabled
                                domStorageEnabled
                                source={{ html: props.mapHtml, baseUrl: "https://localhost" }}
                                onMessage={async (e) => {
                                    try {
                                        const msg = JSON.parse(e.nativeEvent.data);

                                        if (msg?.type === "ready") {
                                            props.setMapReady(true);
                                            if (props.coord) {
                                                props.mapRef.current?.postMessage(
                                                    JSON.stringify({ type: "setMarker", lat: props.coord.lat, lng: props.coord.lng })
                                                );
                                            }
                                        }

                                        if (msg?.type === "picked" && typeof msg.lat === "number" && typeof msg.lng === "number") {
                                            const picked = { lat: msg.lat, lng: msg.lng };
                                            props.setCoord(picked);

                                            if (!props.GOOGLE_KEY) return;

                                            props.setLocLoading(true);
                                            props.setSelectedAddress("Dropped pin");

                                            const geo = await reverseGeocode(props.GOOGLE_KEY, picked.lat, picked.lng);
                                            if (!geo?.formattedAddress || !geo?.components?.length) {
                                                props.setLocationPayload(null);
                                                props.setSelectedAddress("Dropped pin (no address found)");
                                                return;
                                            }

                                            props.setSelectedAddress(geo.formattedAddress);
                                            props.setQuery(geo.formattedAddress);

                                            const loc = buildLocationFromAddressComponents({
                                                lat: picked.lat,
                                                lng: picked.lng,
                                                formattedAddress: geo.formattedAddress,
                                                placeId: geo.placeId,
                                                components: geo.components,
                                                source: "reverse_geocode",
                                            });

                                            if (!loc?.countryCode || !loc?.city) {
                                                props.setLocationPayload(null);
                                                return;
                                            }

                                            props.setLocationPayload({
                                                ...loc,
                                                cityKey: loc.cityKey || makeCityKey(loc.city),
                                            } as LocationPayload);
                                        }
                                    } catch {
                                    } finally {
                                        props.setLocLoading(false);
                                    }
                                }}
                            />
                        )}
                    </View>

                    {!!props.err && <Text style={styles.err}>{props.err}</Text>}
                </Card>

                {/* ✅ Beautified buttons */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.ghostBtn} onPress={props.onClosePress} activeOpacity={0.9}>
                        <Text style={styles.ghostText}>Close</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dangerOutline, (props.deleting || props.submitting || !props.isCreator) && { opacity: 0.5 }]}
                        activeOpacity={0.92}
                        disabled={props.deleting || props.submitting || !props.isCreator}
                        onPress={props.onDelete}
                    >
                        {props.deleting ? <ActivityIndicator /> : <Text style={styles.dangerOutlineText}>Delete</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryBtn, !props.canSave && { opacity: 0.45 }]}
                        onPress={props.onSave}
                        activeOpacity={0.92}
                        disabled={!props.canSave}
                    >
                        {props.submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save</Text>}
                    </TouchableOpacity>
                </View>

                {!props.isCreator && (
                    <Text style={[styles.helper, { marginTop: 10 }]}>You’re not the creator of this event, so editing is disabled.</Text>
                )}
            </View>
        </Modalize>
    );
}

/* ---------------- small UI bits ---------------- */

function Header({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
    return (
        <View style={styles.headerWrap}>
            <View style={styles.headerGlow} />
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Edit event</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        {title.trim() ? title.trim() : subtitle}
                    </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={16} style={styles.closeBtn}>
                    <Text style={styles.closeText}>×</Text>
                </Pressable>
            </View>
        </View>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return <View style={styles.card}>{children}</View>;
}
function CardTitle({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <View style={{ marginBottom: 12 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            {!!subtitle && <Text style={styles.cardSub}>{subtitle}</Text>}
        </View>
    );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
    return <Text style={styles.smallLabel}>{children}</Text>;
}
function InputShell({ children }: { children: React.ReactNode }) {
    return <View style={styles.inputShell}>{children}</View>;
}

function SegmentButton({
    label,
    hint,
    active,
    onPress,
}: {
    label: string;
    hint?: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
            {!!hint && <Text style={[styles.segmentHint, active && styles.segmentHintActive]}>{hint}</Text>}
        </Pressable>
    );
}

function Segmented({
    left,
    right,
}: {
    left: { label: string; hint?: string; active: boolean; onPress: () => void };
    right: { label: string; hint?: string; active: boolean; onPress: () => void };
}) {
    return (
        <View style={styles.segmented}>
            <SegmentButton {...left} />
            <SegmentButton {...right} />
        </View>
    );
}

function Pill({ text, tone }: { text: string; tone: "success" | "info" }) {
    const isSuccess = tone === "success";
    return (
        <View style={[styles.pill, isSuccess ? styles.pillSuccess : styles.pillInfo]}>
            <Text numberOfLines={1} style={[styles.pillText, isSuccess ? styles.pillTextSuccess : styles.pillTextInfo]}>
                {text}
            </Text>
        </View>
    );
}

/* ---------------- styles (based on yours + updates) ---------------- */

const styles = StyleSheet.create({
    overlay: { backgroundColor: "rgba(2,6,23,0.40)" },

    modal: { borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: "#0B1220", overflow: "hidden" },
    handle: {
        width: 60,
        height: 5,
        backgroundColor: "rgba(148,163,184,0.35)",
        borderRadius: 999,
        alignSelf: "center",
        marginTop: 10,
        marginBottom: 4,
    },

    headerWrap: { backgroundColor: "#0B1220" },
    headerGlow: {
        position: "absolute",
        top: -120,
        left: -40,
        right: -40,
        height: 220,
        borderRadius: 220,
        backgroundColor: "rgba(10,132,255,0.18)",
        transform: [{ scaleX: 1.2 }],
    },
    header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, flexDirection: "row", alignItems: "center" },
    headerTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 18 },
    headerSub: { color: "rgba(226,232,240,0.75)", marginTop: 2, fontSize: 12 },
    closeBtn: {
        width: 38,
        height: 38,
        borderRadius: 14,
        backgroundColor: "rgba(148,163,184,0.12)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.18)",
        alignItems: "center",
        justifyContent: "center",
    },
    closeText: { color: "#E2E8F0", fontSize: 22, lineHeight: 22, fontWeight: "900" },

    body: {
        backgroundColor: "#F6F7FB",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 18,
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(226,232,240,0.95)",
        marginBottom: 12,
        shadowColor: "#0B1220",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 14 },
    },
    cardTitle: { fontWeight: "950" as any, color: "#0F172A", fontSize: 15 },
    cardSub: { marginTop: 6, color: "#64748B", fontSize: 12.5, fontWeight: "700" },

    smallLabel: { fontWeight: "900", color: "#0F172A", marginBottom: 8, fontSize: 12 },

    inputShell: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 10,
    },
    inlineEmoji: { fontSize: 18 },
    textInput: { flex: 1, color: "#0F172A", fontSize: 15.5, paddingVertical: 0, fontWeight: "700" },

    // ✅ description wide
    descShell: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    descInput: { minHeight: 110, color: "#0F172A", fontSize: 15, fontWeight: "700" },

    helper: { marginTop: 8, color: "#64748B", fontSize: 12, fontWeight: "800" },

    segmented: {
        flexDirection: "row",
        gap: 10,
        padding: 6,
        borderRadius: 18,
        backgroundColor: "#F1F5F9",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    segmentBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    segmentBtnActive: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.10)",
        shadowColor: "#0B1220",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
    },
    segmentLabel: { color: "#0F172A", fontWeight: "950" as any, fontSize: 14 },
    segmentLabelActive: { color: "#0A84FF" },
    segmentHint: { marginTop: 2, color: "#64748B", fontWeight: "800", fontSize: 11 },
    segmentHintActive: { color: "rgba(10,132,255,0.85)" },

    pricePrefix: { color: "#0F172A", fontWeight: "950" as any, fontSize: 16 },
    priceInput: { flex: 1, color: "#0F172A", fontSize: 15.5, paddingVertical: 0, fontWeight: "800" },
    goodPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(34,197,94,0.12)",
        borderWidth: 1,
        borderColor: "rgba(34,197,94,0.25)",
    },
    goodPillText: { color: "#166534", fontWeight: "900", fontSize: 12 },

    // ✅ when row
    whenHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    clearPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(148,163,184,0.14)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.22)",
    },
    clearPillText: { color: "#0F172A", fontWeight: "950" as any, fontSize: 12 },

    whenGrid: {
        flexDirection: "row",
        gap: 10,
    },

    whenTile: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        padding: 14,
        shadowColor: "#0B1220",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 10 },
    },

    whenTileTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },

    whenBadge: {
        width: 30,
        height: 30,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    whenBadgeBlue: {
        backgroundColor: "rgba(10,132,255,0.12)",
        borderColor: "rgba(10,132,255,0.22)",
    },
    whenBadgePurple: {
        backgroundColor: "rgba(139,92,246,0.12)",
        borderColor: "rgba(139,92,246,0.22)",
    },
    whenBadgeText: { fontSize: 14 },

    whenTileLabel: { color: "#64748B", fontWeight: "900", fontSize: 12 },

    whenTileValue: {
        color: "#0F172A",
        fontWeight: "950" as any,
        fontSize: 16,
        letterSpacing: -0.2,
    },
    whenTileValueMuted: { color: "#94A3B8" },

    whenTileHint: {
        marginTop: 6,
        color: "#64748B",
        fontWeight: "800",
        fontSize: 12,
    },


    // picker modal
    pickerOverlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.45)", padding: 16, justifyContent: "flex-end" },
    pickerCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        overflow: "hidden",
        paddingBottom: 10,
    },
    pickerTitle: { padding: 14, fontWeight: "950" as any, color: "#0F172A", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
    pickerDone: { marginTop: 8, marginHorizontal: 12, borderRadius: 14, paddingVertical: 12, backgroundColor: "#0A84FF", alignItems: "center" },
    pickerDoneText: { color: "#fff", fontWeight: "950" as any },

    locationIcon: { fontSize: 16 },
    locationInput: { flex: 1, color: "#0F172A", fontSize: 15.5, paddingVertical: 0, fontWeight: "700" },
    iconBtn: {
        width: 30,
        height: 30,
        borderRadius: 12,
        backgroundColor: "rgba(100,116,139,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    iconBtnText: { color: "#334155", fontSize: 18, fontWeight: "900", lineHeight: 18 },

    dropdown: { marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFFFFF", overflow: "hidden" },
    dropdownLoading: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
    dropdownLoadingText: { color: "#64748B", fontWeight: "800" },
    dropdownRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E8F0" },
    dropdownMain: { color: "#0F172A", fontWeight: "950" as any, fontSize: 14 },
    dropdownSecondary: { color: "#64748B", marginTop: 3, fontSize: 12, fontWeight: "700" },
    dropdownArrow: { color: "#94A3B8", fontSize: 18, fontWeight: "900", marginLeft: 10 },

    pill: { marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, maxWidth: "100%" },
    pillSuccess: { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.25)" },
    pillInfo: { backgroundColor: "rgba(14,165,233,0.10)", borderColor: "rgba(14,165,233,0.22)" },
    pillText: { fontWeight: "900", fontSize: 12 },
    pillTextSuccess: { color: "#166534" },
    pillTextInfo: { color: "#075985" },

    inlineLoading: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
    inlineLoadingText: { color: "#64748B", fontWeight: "900" },

    mapWrap: { marginTop: 12, height: 210, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#0B1220" },
    map: { flex: 1, backgroundColor: "#0B1220" },
    mapFallback: { flex: 1, padding: 16, justifyContent: "center" },
    mapFallbackTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 14 },
    mapFallbackBody: { color: "rgba(226,232,240,0.78)", marginTop: 8, lineHeight: 18 },

    err: { marginTop: 12, color: "#DC2626", fontWeight: "900" },

    // ✅ beautified action buttons
    actionsRow: { flexDirection: "row", gap: 10, marginTop: 4, alignItems: "center" },
    ghostBtn: {
        flex: 1,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(148,163,184,0.14)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.22)",
    },
    ghostText: { color: "#0F172A", fontWeight: "950" as any },

    dangerOutline: {
        borderRadius: 999,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "rgba(239,68,68,0.55)",
    },
    dangerOutlineText: { color: "#EF4444", fontWeight: "950" as any },

    primaryBtn: {
        flex: 1.2,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0A84FF",
        shadowColor: "#0A84FF",
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 14 },
    },
    primaryText: { color: "#FFFFFF", fontWeight: "950" as any },
});
