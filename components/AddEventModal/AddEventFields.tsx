import React, { useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    ScrollView,
    Pressable,
    Modal,
    LayoutAnimation,
} from "react-native";
import { WebView } from "react-native-webview";
import DateTimePicker from "@react-native-community/datetimepicker";

import { styles } from "./AddEvent.styles";
import type { Suggestion, ListingKind } from "./types";

type Props = {
    // Header
    emoji: string;
    title: string;
    kind: ListingKind;
    onClose: () => void;

    // Basics
    setTitle: (v: string) => void;
    setKind: (k: ListingKind) => void;
    priceText: string;
    setPriceText: (v: string) => void;
    priceCents: number | null;

    // Details
    showDetails: boolean;
    setShowDetails: (v: boolean) => void;
    description: string;
    setDescription: (v: string) => void;

    // Capacity
    limitEnabled: boolean;
    setLimitEnabled: (v: boolean) => void;
    capacityText: string;
    setCapacityText: (v: string) => void;
    capacityOk: boolean;

    // When
    showWhen: boolean;
    setShowWhen: (v: boolean) => void;
    dateISO: string;
    setDateISO: (v: string) => void;
    time24: string;
    setTime24: (v: string) => void;
    dateLabel: string;
    timeLabel: string;
    dateOpen: boolean;
    setDateOpen: (v: boolean) => void;
    timeOpen: boolean;
    setTimeOpen: (v: boolean) => void;

    // Where
    query: string;
    setQuery: (v: string) => void;
    suggestions: Suggestion[];
    loadingSug: boolean;
    onPickSuggestion: (s: Suggestion) => void;
    clearQuery: () => void;
    selectedAddress: string;
    locLoading: boolean;

    googleKey?: string;
    mapRef: React.RefObject<WebView>;
    mapHtml: string;
    onMapMessage: (e: any) => void;

    // Errors + Actions
    err: string | null;
    submitting: boolean;
    canCreate: boolean;
    onCancel: () => void;
    onCreate: () => void;
};

export default function AddEventFields(props: Props) {
    const {
        emoji,
        title,
        kind,
        onClose,

        setTitle,
        setKind,
        priceText,
        setPriceText,
        priceCents,

        showDetails,
        setShowDetails,
        description,
        setDescription,

        limitEnabled,
        setLimitEnabled,
        capacityText,
        setCapacityText,
        capacityOk,

        showWhen,
        setShowWhen,
        dateISO,
        setDateISO,
        time24,
        setTime24,
        dateLabel,
        timeLabel,
        dateOpen,
        setDateOpen,
        timeOpen,
        setTimeOpen,

        query,
        setQuery,
        suggestions,
        loadingSug,
        onPickSuggestion,
        clearQuery,
        selectedAddress,
        locLoading,

        googleKey,
        mapRef,
        mapHtml,
        onMapMessage,

        err,
        submitting,
        canCreate,
        onCancel,
        onCreate,
    } = props;

    const primaryLabel = useMemo(() => {
        if (submitting) return "Creating…";
        if (kind === "service") return "Create service";
        if (kind === "event_paid") return "Create paid event";
        return "Create free event";
    }, [submitting, kind]);

    const tag = kind === "service" ? "Service" : kind === "event_paid" ? "Paid event" : "Free event";

    return (
        <>
            <Header
                emoji={emoji}
                title={title}
                tag={tag}
                onClose={onClose}
            />

            <View style={styles.body}>
                {/* BASICS */}
                <Card>
                    <CardTitle title="Name your event" subtitle="Give it a title people will click." />

                    <InputShell>
                        <Text style={styles.inlineEmoji}>{emoji}</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g., Saturday yoga in the park"
                            placeholderTextColor="#94A3B8"
                            style={styles.textInput}
                            returnKeyType="done"
                        />
                    </InputShell>

                    <View style={{ height: 12 }} />

                    <TriSegment
                        a={{
                            label: "Free",
                            hint: "Join",
                            active: kind === "event_free",
                            onPress: () => setKind("event_free"),
                        }}
                        b={{
                            label: "Paid",
                            hint: "Ticket",
                            active: kind === "event_paid",
                            onPress: () => setKind("event_paid"),
                        }}
                        c={{
                            label: "Service",
                            hint: "Book",
                            active: kind === "service",
                            onPress: () => setKind("service"),
                        }}
                    />

                    {(kind === "event_paid" || kind === "service") && (
                        <View style={{ marginTop: 14 }}>
                            <FieldLabel>
                                Price (USD){" "}
                                <Text style={{ color: "#64748B", fontWeight: "800" }}>
                                    {kind === "event_paid" ? "• ticket" : "• service fee"}
                                </Text>
                            </FieldLabel>

                            <InputShell>
                                <Text style={styles.pricePrefix}>$</Text>
                                <TextInput
                                    value={priceText}
                                    onChangeText={setPriceText}
                                    placeholder={kind === "event_paid" ? "15" : "25"}
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

                            {priceText.length > 0 && priceCents === null && (
                                <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>
                                    Enter a valid price greater than 0.
                                </Text>
                            )}
                        </View>
                    )}
                </Card>

                {/* ATTENDANCE (FREE ONLY) */}
                {kind === "event_free" && (
                    <Card>
                        <CardTitle
                            title="Attendance"
                            subtitle="Keep it open or limit how many people can join."
                        />

                        <View style={styles.segmented}>
                            <SegmentButton
                                label="Open"
                                hint="Unlimited"
                                active={!limitEnabled}
                                onPress={() => setLimitEnabled(false)}
                            />
                            <SegmentButton
                                label="Limit"
                                hint="Set max"
                                active={limitEnabled}
                                onPress={() => setLimitEnabled(true)}
                            />
                        </View>

                        {limitEnabled && (
                            <View style={{ marginTop: 12 }}>
                                <FieldLabel>Max people</FieldLabel>

                                <InputShell>
                                    <TextInput
                                        value={capacityText}
                                        onChangeText={setCapacityText}
                                        placeholder="e.g., 20"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
                                        style={styles.textInput}
                                    />
                                </InputShell>

                                {!capacityOk && (
                                    <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>
                                        Enter a valid number greater than 0.
                                    </Text>
                                )}
                            </View>
                        )}
                    </Card>
                )}

                {/* DETAILS */}
                <Card>
                    <ToggleRow
                        title="Details"
                        subtitle={showDetails ? "Tap to hide" : "Tap to add description"}
                        open={showDetails}
                        onToggle={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setShowDetails(!showDetails);
                        }}
                    />

                    {showDetails && (
                        <View style={{ marginTop: 12 }}>
                            <View style={styles.descShell}>
                                <TextInput
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Meetup point, what to bring, rules, contact info, etc."
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    textAlignVertical="top"
                                    style={styles.descInput}
                                    returnKeyType="default"
                                />
                            </View>
                        </View>
                    )}
                </Card>


                {/* WHEN */}
                <Card>
                    <ToggleRow
                        title="When"
                        subtitle={showWhen ? "Tap to hide" : "Tap to add date/time"}
                        open={showWhen}
                        onToggle={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setShowWhen(!showWhen);
                        }}
                    />

                    {showWhen && (
                        <>
                            <View style={{ marginTop: 12 }}>
                                <View style={styles.whenGrid}>
                                    {/* ✅ DATE TILE */}
                                    <Pressable
                                        onPress={() => {
                                            // ✅ If empty, prefill today so selecting "today" works immediately
                                            if (!dateISO) setDateISO(toLocalISODate(new Date()));
                                            setDateOpen(true);
                                        }}
                                        style={styles.whenTile}
                                        android_ripple={{ color: "#E2E8F0" }}
                                    >
                                        <View style={styles.whenTileTop}>
                                            <View style={[styles.whenBadge, styles.whenBadgeBlue]}>
                                                <Text style={styles.whenBadgeText}>📅</Text>
                                            </View>
                                            <Text style={styles.whenTileLabel}>Date</Text>
                                        </View>

                                        <Text numberOfLines={1} style={[styles.whenTileValue, !dateISO && styles.whenTileValueMuted]}>
                                            {dateISO ? dateLabel : "Select date"}
                                        </Text>

                                        <Text style={styles.whenTileHint}>Tap to choose</Text>
                                    </Pressable>

                                    {/* TIME TILE (unchanged) */}
                                    <Pressable
                                        onPress={() => setTimeOpen(true)}
                                        style={styles.whenTile}
                                        android_ripple={{ color: "#E2E8F0" }}
                                    >
                                        <View style={styles.whenTileTop}>
                                            <View style={[styles.whenBadge, styles.whenBadgePurple]}>
                                                <Text style={styles.whenBadgeText}>⏰</Text>
                                            </View>
                                            <Text style={styles.whenTileLabel}>Time</Text>
                                        </View>

                                        <Text numberOfLines={1} style={[styles.whenTileValue, !time24 && styles.whenTileValueMuted]}>
                                            {time24 ? timeLabel : "Select time"}
                                        </Text>

                                        <Text style={styles.whenTileHint}>Tap to choose</Text>
                                    </Pressable>
                                </View>

                                {(dateISO || time24) ? (
                                    <Pressable
                                        hitSlop={10}
                                        onPress={() => {
                                            setDateISO("");
                                            setTime24("");
                                        }}
                                        style={styles.clearPill}
                                    >
                                        <Text style={styles.clearPillText}>Clear date/time</Text>
                                    </Pressable>
                                ) : null}
                            </View>

                            {/* ✅ DATE PICKER (fixed: allow today immediately + block past dates) */}
                            <Modal transparent visible={dateOpen} animationType="fade" onRequestClose={() => setDateOpen(false)}>
                                <Pressable style={styles.pickerOverlay} onPress={() => setDateOpen(false)}>
                                    <Pressable style={styles.pickerCard} onPress={() => { }}>
                                        <Text style={styles.pickerTitle}>Pick a date</Text>

                                        <DateTimePicker
                                            value={dateISO ? isoToSafeDate(dateISO) : todayMidday()}
                                            mode="date"
                                            display={Platform.OS === "ios" ? "inline" : "default"}
                                            themeVariant="light"
                                            minimumDate={startOfToday()} // ✅ prevents selecting past dates
                                            onChange={(_, d) => {
                                                if (!d) return;

                                                const chosen = new Date(d);
                                                chosen.setHours(12, 0, 0, 0);

                                                // ✅ safety: ignore any past date (extra guard)
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

                            {/* TIME PICKER (unchanged) */}
                            <Modal transparent visible={timeOpen} animationType="fade" onRequestClose={() => setTimeOpen(false)}>
                                <Pressable style={styles.pickerOverlay} onPress={() => setTimeOpen(false)}>
                                    <Pressable style={styles.pickerCard} onPress={() => { }}>
                                        <Text style={styles.pickerTitle}>Pick a time</Text>
                                        <DateTimePicker
                                            value={timeToDate(time24)}
                                            mode="time"
                                            display={Platform.OS === "ios" ? "spinner" : "default"}
                                            themeVariant="light"
                                            onChange={(_, d) => {
                                                if (!d) return;
                                                const hh = d.getHours();
                                                const mm = d.getMinutes();
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
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search an address or place"
                            placeholderTextColor="#94A3B8"
                            style={styles.locationInput}
                            returnKeyType="search"
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
                                <View style={styles.dropdownLoading}>
                                    <ActivityIndicator />
                                    <Text style={styles.dropdownLoadingText}>Searching…</Text>
                                </View>
                            ) : (
                                <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                                    {suggestions.map((s) => (
                                        <TouchableOpacity
                                            key={s.id}
                                            activeOpacity={0.9}
                                            onPress={() => onPickSuggestion(s)}
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

                    {!!selectedAddress && <Pill tone="success" text={selectedAddress} />}

                    {locLoading && (
                        <View style={styles.inlineLoading}>
                            <ActivityIndicator />
                            <Text style={styles.inlineLoadingText}>Resolving address…</Text>
                        </View>
                    )}

                    <View style={styles.mapWrap}>
                        {!googleKey ? (
                            <View style={styles.mapFallback}>
                                <Text style={styles.mapFallbackTitle}>Google Maps key missing</Text>
                                <Text style={styles.mapFallbackBody}>
                                    Add <Text style={{ fontWeight: "900" }}>extra.googleMapsKey</Text> in app config to use maps +
                                    autocomplete.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <WebView
                                    ref={mapRef}
                                    style={styles.map}
                                    originWhitelist={["*"]}
                                    javaScriptEnabled
                                    domStorageEnabled
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

                <ActionsBar
                    primaryLabel={primaryLabel}
                    canCreate={canCreate}
                    submitting={submitting}
                    onCancel={onCancel}
                    onCreate={onCreate}
                />
            </View>
        </>
    );
}

/* ---------------- UI components ---------------- */

function Header({
    emoji,
    title,
    tag,
    onClose,
}: {
    emoji: string;
    title: string;
    tag: string;
    onClose: () => void;
}) {
    return (
        <View style={styles.headerWrap}>
            <View style={styles.headerGlow} />
            <View style={styles.header}>
                <View style={styles.heroIcon}>
                    <Text style={styles.heroEmoji}>{emoji}</Text>
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Create</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        {title.trim() ? title.trim() : `${tag} • pick a location • add optional details`}
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

function TriSegment({
    a,
    b,
    c,
}: {
    a: { label: string; hint?: string; active: boolean; onPress: () => void };
    b: { label: string; hint?: string; active: boolean; onPress: () => void };
    c: { label: string; hint?: string; active: boolean; onPress: () => void };
}) {
    return (
        <View style={styles.segmented}>
            <SegmentButton {...a} />
            <SegmentButton {...b} />
            <SegmentButton {...c} />
        </View>
    );
}

function ToggleRow({
    title,
    subtitle,
    open,
    onToggle,
}: {
    title: string;
    subtitle: string;
    open: boolean;
    onToggle: () => void;
}) {
    return (
        <Pressable onPress={onToggle} style={styles.toggleRow} android_ripple={{ color: "#E2E8F0" }}>
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
            <Text numberOfLines={1} style={[styles.pillText, isSuccess ? styles.pillTextSuccess : styles.pillTextInfo]}>
                {text}
            </Text>
        </View>
    );
}

function ActionsBar({
    primaryLabel,
    canCreate,
    submitting,
    onCancel,
    onCreate,
}: {
    primaryLabel: string;
    canCreate: boolean;
    submitting: boolean;
    onCancel: () => void;
    onCreate: () => void;
}) {
    return (
        <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel} activeOpacity={0.9}>
                <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.primaryBtn, !canCreate && { opacity: 0.45 }]}
                onPress={onCreate}
                activeOpacity={0.92}
                disabled={!canCreate}
            >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{primaryLabel}</Text>}
            </TouchableOpacity>
        </View>
    );
}

/* ---------------- helpers ---------------- */

function isoToSafeDate(iso: string) {
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

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

// local YYYY-MM-DD (not UTC)
function toLocalISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// stable "today" value for picker (noon avoids DST edge cases)
function todayMidday() {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
}
