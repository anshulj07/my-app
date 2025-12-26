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

import type { Suggestion, LocationPayload, ListingKind } from "../AddEventModal/types";
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

    description: string;
    setDescription: (v: string) => void;

    kind: ListingKind;
    setKind: (v: ListingKind) => void;

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
    const priceRequired = props.kind === "service" || props.kind === ("event_paid" as ListingKind);

    const priceCents = useMemo(() => {
        if (!priceRequired) return null;
        return parsePriceToCents(props.priceText);
    }, [priceRequired, props.priceText]);

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

    const [dateOpen, setDateOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    const emoji = useMemo(() => textToEmoji(props.title || ""), [props.title]);

    const typeSubtitle =
        props.kind === "event_free"
            ? "Free • joinable"
            : props.kind === ("event_paid" as ListingKind)
                ? "Paid • ticketed"
                : "Service • bookable";

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
            withReactModal
            reactModalProps={{
                presentationStyle: "overFullScreen",
                transparent: true,
                statusBarTranslucent: true,
            }}
        >
            <Header
                title={props.title}
                subtitle={!props.isCreator ? "View only • Not the creator" : "Edit details • Save changes"}
                emoji={emoji}
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

                {/* Description */}
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
                    <CardTitle title="Type" subtitle={typeSubtitle} />

                    <Segmented3
                        items={[
                            {
                                key: "event_free",
                                label: "Free",
                                hint: "Join",
                                active: props.kind === "event_free",
                                onPress: () => props.setKind("event_free"),
                            },
                            {
                                key: "event_paid",
                                label: "Paid",
                                hint: "Ticket",
                                active: props.kind === ("event_paid" as ListingKind),
                                onPress: () => props.setKind("event_paid" as ListingKind),
                            },
                            {
                                key: "service",
                                label: "Service",
                                hint: "Book",
                                active: props.kind === "service",
                                onPress: () => props.setKind("service"),
                            },
                        ]}
                    />

                    {priceRequired && (
                        <View style={{ marginTop: 14 }}>
                            <FieldLabel>Price (USD)</FieldLabel>
                            <InputShell>
                                <Text style={styles.pricePrefix}>$</Text>
                                <TextInput
                                    value={props.priceText}
                                    onChangeText={props.setPriceText}
                                    placeholder={props.kind === "service" ? "25" : "10"}
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

                {/* When */}
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

                            <Text style={styles.whenTileHint}>Tap to choose</Text>
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

                            <Text style={styles.whenTileHint}>Tap to choose</Text>
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
                                themeVariant="light"
                                textColor="#0F172A"
                                accentColor="#0A84FF"
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

                {/* Where */}
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

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.closePillBtn} onPress={props.onClosePress} activeOpacity={0.92}>
                        <Text style={styles.closePillText}>✕ Close</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.deletePillBtn, (props.deleting || props.submitting || !props.isCreator) && { opacity: 0.45 }]}
                        activeOpacity={0.92}
                        disabled={props.deleting || props.submitting || !props.isCreator}
                        onPress={props.onDelete}
                    >
                        {props.deleting ? <ActivityIndicator /> : <Text style={styles.deletePillText}>🗑 Delete</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.savePillBtn, !props.canSave && { opacity: 0.45 }]}
                        onPress={props.onSave}
                        activeOpacity={0.92}
                        disabled={!props.canSave}
                    >
                        {props.submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.savePillText}>✓ Save</Text>}
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



function Header({ title, subtitle, emoji, onClose }: { title: string; subtitle: string; emoji: string; onClose: () => void }) {
    return (
        <View style={styles.headerWrap}>
            <View style={styles.headerGlow} />
            <View style={styles.header}>
                <View style={styles.heroIcon}>
                    <Text style={styles.heroEmoji}>{emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
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

function Segmented3({
    items,
}: {
    items: Array<{ key: string; label: string; hint?: string; active: boolean; onPress: () => void }>;
}) {
    return (
        <View style={styles.segmented}>
            {items.map((it) => (
                <SegmentButton key={it.key} label={it.label} hint={it.hint} active={it.active} onPress={it.onPress} />
            ))}
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

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
    // Backdrop (keep it on top of everything)
    overlay: {
        backgroundColor: "rgba(2,6,23,0.55)",
        zIndex: 99999,
        elevation: 99999,
    },

    // Sheet (keep it on top of everything)
    modal: {
        borderTopLeftRadius: 34,
        borderTopRightRadius: 34,
        backgroundColor: "#0B1220",
        overflow: "hidden",
        zIndex: 100000,
        elevation: 100000,
    },

    heroIcon: {
        width: 48,
        height: 48,
        borderRadius: 18,
        backgroundColor: "rgba(56,189,248,0.18)",
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.35)",
        alignItems: "center",
        justifyContent: "center",
    },
    heroEmoji: { fontSize: 22 },

    handle: {
        width: 56,
        height: 5,
        borderRadius: 999,
        alignSelf: "center",
        marginTop: 10,
        marginBottom: 6,
        backgroundColor: "rgba(226,232,240,0.22)",
    },

    // Header
    headerWrap: { backgroundColor: "#0B1220" },
    headerGlow: {
        position: "absolute",
        top: -140,
        left: -60,
        right: -60,
        height: 260,
        borderRadius: 260,
        backgroundColor: "rgba(10,132,255,0.18)",
        transform: [{ scaleX: 1.15 }],
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        flexDirection: "row",
        alignItems: "center",
    },
    headerTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 18 },
    headerSub: { color: "rgba(226,232,240,0.72)", marginTop: 3, fontSize: 12 },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 16,
        backgroundColor: "rgba(148,163,184,0.10)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.18)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    closeText: { color: "#E2E8F0", fontSize: 22, lineHeight: 22, fontWeight: "900" },

    // Body surface
    body: {
        backgroundColor: "#F5F7FB",
        borderTopLeftRadius: 34,
        borderTopRightRadius: 34,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 18,
    },

    // Cards
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(226,232,240,0.92)",
        shadowColor: "#0B1220",
        shadowOpacity: 0.06,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 16 },
        elevation: 4,
    },
    cardTitle: { fontWeight: "950" as any, color: "#0F172A", fontSize: 15 },
    cardSub: { marginTop: 6, color: "#64748B", fontSize: 12.5, fontWeight: "700" },

    smallLabel: { fontWeight: "900", color: "#0F172A", marginBottom: 8, fontSize: 12 },

    // Inputs
    inputShell: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 10,
    },
    inlineEmoji: { fontSize: 18 },
    textInput: { flex: 1, color: "#0F172A", fontSize: 15.5, paddingVertical: 0, fontWeight: "700" },

    // Description
    descShell: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    descInput: { minHeight: 116, color: "#0F172A", fontSize: 15, fontWeight: "700" },

    helper: { marginTop: 8, color: "#64748B", fontSize: 12, fontWeight: "800" },

    // Segmented (3 buttons)
    segmented: {
        flexDirection: "row",
        gap: 10,
        padding: 6,
        borderRadius: 20,
        backgroundColor: "#F1F5F9",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    segmentBtnActive: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.10)",
        shadowColor: "#0B1220",
        shadowOpacity: 0.07,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
    },
    segmentLabel: { color: "#0F172A", fontWeight: "950" as any, fontSize: 14 },
    segmentLabelActive: { color: "#0A84FF" },
    segmentHint: { marginTop: 2, color: "#64748B", fontWeight: "800", fontSize: 11 },
    segmentHintActive: { color: "rgba(10,132,255,0.88)" },

    // Price
    pricePrefix: { color: "#0F172A", fontWeight: "950" as any, fontSize: 16 },
    priceInput: { flex: 1, color: "#0F172A", fontSize: 15.5, paddingVertical: 0, fontWeight: "800" },
    goodPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(34,197,94,0.10)",
        borderWidth: 1,
        borderColor: "rgba(34,197,94,0.22)",
    },
    goodPillText: { color: "#166534", fontWeight: "900", fontSize: 12 },

    // When
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
        backgroundColor: "rgba(148,163,184,0.12)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.20)",
    },
    clearPillText: { color: "#0F172A", fontWeight: "950" as any, fontSize: 12 },

    whenGrid: { flexDirection: "row", gap: 10 },
    whenTile: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        padding: 14,
        shadowColor: "#0B1220",
        shadowOpacity: 0.05,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 12 },
        elevation: 3,
    },
    whenTileTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    whenBadge: {
        width: 32,
        height: 32,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    whenBadgeBlue: { backgroundColor: "rgba(10,132,255,0.11)", borderColor: "rgba(10,132,255,0.20)" },
    whenBadgePurple: { backgroundColor: "rgba(139,92,246,0.11)", borderColor: "rgba(139,92,246,0.20)" },
    whenBadgeText: { fontSize: 14 },

    whenTileLabel: { color: "#64748B", fontWeight: "900", fontSize: 12 },
    whenTileValue: { color: "#0F172A", fontWeight: "950" as any, fontSize: 16, letterSpacing: -0.2 },
    whenTileValueMuted: { color: "#94A3B8" },
    whenTileHint: { marginTop: 6, color: "#64748B", fontWeight: "800", fontSize: 12 },

    // Picker modal (also keep above)
    pickerOverlay: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.55)",
        padding: 16,
        justifyContent: "flex-end",
        zIndex: 100001,
        elevation: 100001,
    },
    pickerCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        overflow: "hidden",
        paddingBottom: 10,
        shadowColor: "#0B1220",
        shadowOpacity: 0.10,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
        elevation: 10,
    },
    pickerTitle: {
        padding: 14,
        fontWeight: "950" as any,
        color: "#0F172A",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    pickerDone: {
        marginTop: 10,
        marginHorizontal: 12,
        borderRadius: 16,
        paddingVertical: 12,
        backgroundColor: "#0A84FF",
        alignItems: "center",
        shadowColor: "#0A84FF",
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8,
    },
    pickerDoneText: { color: "#fff", fontWeight: "950" as any },

    // Location
    locationIcon: { fontSize: 16 },
    locationInput: { flex: 1, color: "#0F172A", fontSize: 15.5, paddingVertical: 0, fontWeight: "700" },
    iconBtn: {
        width: 30,
        height: 30,
        borderRadius: 12,
        backgroundColor: "rgba(100,116,139,0.10)",
        alignItems: "center",
        justifyContent: "center",
    },
    iconBtnText: { color: "#334155", fontSize: 18, fontWeight: "900", lineHeight: 18 },

    // Dropdown
    dropdown: {
        marginTop: 10,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
    },
    dropdownLoading: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
    dropdownLoadingText: { color: "#64748B", fontWeight: "800" },
    dropdownRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E2E8F0",
    },
    dropdownMain: { color: "#0F172A", fontWeight: "950" as any, fontSize: 14 },
    dropdownSecondary: { color: "#64748B", marginTop: 3, fontSize: 12, fontWeight: "700" },
    dropdownArrow: { color: "#94A3B8", fontSize: 18, fontWeight: "900", marginLeft: 10 },

    // Pills
    pill: {
        marginTop: 10,
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        maxWidth: "100%",
    },
    pillSuccess: { backgroundColor: "rgba(34,197,94,0.10)", borderColor: "rgba(34,197,94,0.22)" },
    pillInfo: { backgroundColor: "rgba(14,165,233,0.08)", borderColor: "rgba(14,165,233,0.18)" },
    pillText: { fontWeight: "900", fontSize: 12 },
    pillTextSuccess: { color: "#166534" },
    pillTextInfo: { color: "#075985" },

    inlineLoading: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
    inlineLoadingText: { color: "#64748B", fontWeight: "900" },

    // Map
    mapWrap: {
        marginTop: 12,
        height: 214,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#0B1220",
    },
    map: { flex: 1, backgroundColor: "#0B1220" },
    mapFallback: { flex: 1, padding: 16, justifyContent: "center" },
    mapFallbackTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 14 },
    mapFallbackBody: { color: "rgba(226,232,240,0.78)", marginTop: 8, lineHeight: 18 },

    // Errors
    err: { marginTop: 12, color: "#DC2626", fontWeight: "900" },

    // Actions (fancier pills)
    actionsRow: { flexDirection: "row", gap: 10, marginTop: 6, alignItems: "center" },

    closePillBtn: {
        flex: 1,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.06)",
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.10)",
        shadowColor: "#0B1220",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 12 },
        elevation: 3,
    },
    closePillText: { color: "#0F172A", fontWeight: "950" as any },

    deletePillBtn: {
        borderRadius: 999,
        paddingVertical: 14,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(239,68,68,0.10)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.28)",
        shadowColor: "#EF4444",
        shadowOpacity: 0.14,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 14 },
        elevation: 4,
    },
    deletePillText: { color: "#B91C1C", fontWeight: "950" as any },

    savePillBtn: {
        flex: 1.15,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0A84FF",
        shadowColor: "#0A84FF",
        shadowOpacity: 0.28,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 16 },
        elevation: 6,
    },
    savePillText: { color: "#FFFFFF", fontWeight: "950" as any },
});
