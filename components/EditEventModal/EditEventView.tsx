 import React, { useMemo, useState } from "react";
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    ActivityIndicator, Platform, ScrollView, Pressable,
    Modal, Image, Dimensions, Switch
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Modalize } from "react-native-modalize";
import { WebView } from "react-native-webview";
import Ionicons from "@expo/vector-icons/Ionicons";

import type { Suggestion, LocationPayload, ListingKind } from "../AddEventModal/types";
import { formatTime12h, parsePriceToCents } from "../AddEventModal/utils/time";
import { textToEmoji } from "../AddEventModal/utils/emoji";

const { width: SW } = Dimensions.get("window");

const C = {
    bg:          "#F8FAFC",
    white:       "#FFFFFF",
    ink:         "#0F172A",
    muted:       "#64748B",
    accent:      "#6366F1",
    accentLight: "#EEF2FF",
    border:      "#E2E8F0",
    red:         "#EF4444",
};

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
    d.setSeconds(0); d.setMilliseconds(0);
    return d;
}

type ModalizeHandle = { open: () => void; close: () => void; };

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
    selectedAddress: string;

    mapRef: React.RefObject<WebView | null>;
    mapHtml: string;
    mapReady: boolean;
    setMapReady: (v: boolean) => void;

    GOOGLE_KEY?: string;
    err: string | null;
    submitting: boolean;
    deleting: boolean;

    limitEnabled: boolean;
    setLimitEnabled: (v: boolean) => void;
    capacityText: string;
    setCapacityText: (v: string) => void;

    onClosePress: () => void;
    onSave: () => void;
    onDelete: () => void;

    bannerUri: string | null;
    setBannerUri: (v: string | null) => void;
}) {
    const insets = useSafeAreaInsets();
    const [dateOpen, setDateOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    
    // Mock states for UI demo (can be connected to props later)
    const [isPrivate, setIsPrivate] = useState(false);
    const [maxCapacity, setMaxCapacity] = useState(true);

    const dateLabel = useMemo(() => {
        if (!props.dateISO) return "Nov 24, 2024";
        return isoToSafeDate(props.dateISO).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }, [props.dateISO]);

    const timeLabel = useMemo(() => {
        if (!props.time24) return "17:30 PM";
        const [hh, mm] = props.time24.split(":").map(x => parseInt(x, 10));
        return formatTime12h(hh, mm);
    }, [props.time24]);

    return (
        <Modalize
            ref={props.sheetRef}
            onClosed={props.onClosed}
            modalHeight={props.modalHeight}
            modalStyle={S.modal}
            handlePosition="inside"
            handleStyle={{ backgroundColor: C.border }}
            overlayStyle={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            scrollViewProps={{ keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false }}
            withReactModal
            reactModalProps={{ presentationStyle: "overFullScreen", transparent: true, statusBarTranslucent: true }}
        >
            {/* 1. HEADER */}
            <View style={[S.header, { paddingTop: 20 }]}>
               <TouchableOpacity onPress={props.onClosePress} style={S.iconBtn}>
                  <Ionicons name="arrow-back" size={24} color={C.ink} />
               </TouchableOpacity>
               <Text style={S.headerTitle}>Edit Event</Text>
               <TouchableOpacity 
                 onPress={props.onSave} 
                 style={[S.saveSmallBtn, !props.canSave && { opacity: 0.5 }]}
                 disabled={!props.canSave || props.submitting}
               >
                  {props.submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={S.saveSmallText}>Save</Text>}
               </TouchableOpacity>
            </View>

            <View style={S.body}>
                
                {/* 2. HERO IMAGE */}
                <View style={S.heroContainer}>
                   <Image source={{ uri: props.bannerUri || "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1000" }} style={S.heroImg} />
                   <View style={S.heroOverlay}>
                      <TouchableOpacity style={S.editCircle}>
                        <Ionicons name="pencil" size={20} color={C.accent} />
                      </TouchableOpacity>
                   </View>
                </View>
                <Text style={S.heroHint}>Tap image to change cover photo</Text>

                {/* 3. INPUT FIELDS */}
                <View style={S.section}>
                    <Text style={S.label}>Event Title</Text>
                    <TextInput
                      style={S.input}
                      value={props.title}
                      onChangeText={props.setTitle}
                      placeholder="Sunset Co-working & Cocktails"
                      placeholderTextColor={C.muted}
                    />
                </View>

                <View style={S.section}>
                    <Text style={S.label}>Description</Text>
                    <TextInput
                      style={[S.input, S.textArea]}
                      value={props.description}
                      onChangeText={props.setDescription}
                      placeholder="Join us for our weekly sunset session..."
                      placeholderTextColor={C.muted}
                      multiline
                    />
                </View>

                {/* 4. ACCESS TYPE */}
                <View style={S.section}>
                   <Text style={S.label}>Access Type</Text>
                   <View style={S.segmented}>
                      <TouchableOpacity 
                        style={[S.segmentBtn, props.kind === "event_free" && S.segmentBtnActive]}
                        onPress={() => props.setKind("event_free")}
                      >
                         <Text style={[S.segmentText, props.kind === "event_free" && S.segmentTextActive]}>Free</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[S.segmentBtn, props.kind === "event_paid" && S.segmentBtnActive]}
                        onPress={() => props.setKind("event_paid")}
                      >
                         <Text style={[S.segmentText, props.kind === "event_paid" && S.segmentTextActive]}>Paid</Text>
                      </TouchableOpacity>
                   </View>
                </View>

                {/* PRICE INPUT (Show if Paid) */}
                {props.kind === "event_paid" && (
                    <View style={S.section}>
                        <Text style={S.label}>Event Price (₹)</Text>
                        <View style={S.inputShell}>
                            <Text style={{ marginLeft: 15, fontSize: 18, fontWeight: "900", color: C.accent }}>₹</Text>
                            <TextInput
                                style={S.locationInput}
                                value={props.priceText}
                                onChangeText={props.setPriceText}
                                placeholder="0"
                                placeholderTextColor={C.muted}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                )}

                {/* 5. DATE & TIME TILES */}
                <View style={S.row}>
                   <TouchableOpacity style={S.tile} onPress={() => setDateOpen(true)}>
                      <Ionicons name="calendar-outline" size={20} color={C.accent} />
                      <Text style={S.tileLabel}>DATE</Text>
                      <Text style={S.tileValue}>{dateLabel}</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={S.tile} onPress={() => setTimeOpen(true)}>
                      <Ionicons name="time-outline" size={20} color={C.accent} />
                      <Text style={S.tileLabel}>TIME</Text>
                      <Text style={S.tileValue}>{timeLabel}</Text>
                   </TouchableOpacity>
                </View>

                {/* 6. LOCATION */}
                <View style={S.section}>
                    <Text style={S.label}>Location</Text>
                    <View style={S.inputShell}>
                        <Ionicons name="search-outline" size={18} color={C.muted} style={{ marginLeft: 15 }} />
                        <TextInput
                            value={props.query}
                            onChangeText={props.setQuery}
                            placeholder="Search an address or place"
                            placeholderTextColor={C.muted}
                            style={S.locationInput}
                        />
                        {!!props.query && (
                            <TouchableOpacity onPress={() => props.setQuery("")} style={{ padding: 10 }}>
                                <Ionicons name="close-circle" size={18} color={C.muted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Suggestions Dropdown */}
                    {(props.loadingSug || props.suggestions.length > 0) && (
                        <View style={S.dropdown}>
                            {props.loadingSug ? (
                                <ActivityIndicator style={{ padding: 20 }} />
                            ) : (
                                props.suggestions.map((s) => (
                                    <TouchableOpacity key={s.id} onPress={() => props.onPickSuggestion(s)} style={S.dropdownRow}>
                                        <Ionicons name="location-outline" size={16} color={C.muted} />
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={S.dropdownMain} numberOfLines={1}>{s.main}</Text>
                                            <Text style={S.dropdownSub} numberOfLines={1}>{s.secondary}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}

                    <View style={S.locationCard}>
                        <View style={S.locHeader}>
                            <Ionicons name="location" size={18} color={C.accent} />
                            <Text style={S.locTitle} numberOfLines={1}>{props.selectedAddress || "Pick a location"}</Text>
                        </View>
                        <View style={S.mapWrap}>
                            {props.GOOGLE_KEY ? (
                                <WebView
                                    ref={props.mapRef}
                                    style={S.map}
                                    originWhitelist={["*"]}
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
                                                props.onPickSuggestion({ id: "picked", main: "Dropped pin", secondary: "" }); // Trigger parent handling if needed, or update coord directly if props allow
                                                // Note: The previous logic was more complex, but the parent should handle state updates.
                                            }
                                        } catch {}
                                    }}
                                />
                            ) : (
                                <View style={S.mapMock} />
                            )}
                            <TouchableOpacity style={S.expandBtn}>
                                <Ionicons name="scan-outline" size={14} color={C.ink} />
                                <Text style={S.expandText}>Expand Map</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* 7. CAPACITY LIMIT */}
                <View style={S.section}>
                   <Text style={S.label}>Capacity Limit</Text>
                   <View style={S.settingsCard}>
                      <View style={S.settingRow}>
                         <View style={S.settingIconBox}>
                            <Ionicons name="people-outline" size={18} color={C.accent} />
                         </View>
                         <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={S.settingTitle}>Limit Attendance</Text>
                            <Text style={S.settingSub}>Restrict how many people can join</Text>
                         </View>
                         <Switch 
                           value={props.limitEnabled} 
                           onValueChange={props.setLimitEnabled} 
                           trackColor={{ false: C.border, true: C.accent }}
                           thumbColor="#fff"
                         />
                      </View>

                      {props.limitEnabled && (
                        <>
                          <View style={S.divider} />
                          <View style={{ padding: 15, paddingTop: 5 }}>
                             <Text style={S.smallLabel}>Max people</Text>
                             <View style={S.inputShell}>
                                <Ionicons name="person-add-outline" size={16} color={C.muted} style={{ marginLeft: 15 }} />
                                <TextInput
                                  value={props.capacityText}
                                  onChangeText={props.setCapacityText}
                                  placeholder="e.g. 20"
                                  placeholderTextColor={C.muted}
                                  keyboardType="numeric"
                                  style={S.locationInput}
                                />
                             </View>
                          </View>
                        </>
                      )}
                   </View>
                </View>

                {/* 8. DELETE LINK */}
                <TouchableOpacity style={S.deleteLink} onPress={props.onDelete}>
                   <Ionicons name="trash-outline" size={16} color={C.red} />
                   <Text style={S.deleteText}>Delete Event</Text>
                </TouchableOpacity>

                {/* 9. UPDATE BUTTON */}
                <TouchableOpacity 
                  style={[S.updateBtn, !props.canSave && { opacity: 0.7 }]} 
                  onPress={props.onSave}
                  disabled={!props.canSave || props.submitting}
                >
                   {props.submitting ? <ActivityIndicator color="#fff" /> : <Text style={S.updateBtnText}>Update Event</Text>}
                </TouchableOpacity>

                <View style={{ height: insets.bottom + 40 }} />
            </View>

            {/* PICKERS */}
            {dateOpen && (
              <DateTimePicker
                value={isoToSafeDate(props.dateISO)}
                mode="date"
                display="default"
                onChange={(_, d) => {
                  setDateOpen(false);
                  if (d) props.setDateISO(d.toISOString().slice(0,10));
                }}
              />
            )}
            {timeOpen && (
              <DateTimePicker
                value={timeToDate(props.time24)}
                mode="time"
                display="default"
                onChange={(_, d) => {
                  setTimeOpen(false);
                  if (d) props.setTime24(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`);
                }}
              />
            )}
        </Modalize>
    );
}

const S = StyleSheet.create({
    modal: { backgroundColor: C.white, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 15 },
    iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontWeight: "800", color: C.ink },
    saveSmallBtn: { backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    saveSmallText: { color: "#fff", fontSize: 14, fontWeight: "800" },

    body: { paddingHorizontal: 20 },

    heroContainer: { height: 240, borderRadius: 24, overflow: "hidden", marginTop: 10 },
    heroImg: { width: "100%", height: "100%" },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
    editCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
    heroHint: { textAlign: "center", color: C.muted, fontSize: 12, marginTop: 10, fontWeight: "600" },

    section: { marginTop: 25 },
    label: { fontSize: 13, fontWeight: "800", color: C.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    smallLabel: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
    input: { backgroundColor: "#F8FAFC", borderRadius: 16, padding: 16, fontSize: 16, color: C.ink, fontWeight: "600", borderWidth: 1, borderColor: C.border },
    inputShell: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 16, borderWidth: 1, borderColor: C.border },
    locationInput: { flex: 1, padding: 16, fontSize: 16, color: C.ink, fontWeight: "600" },
    textArea: { height: 100, textAlignVertical: "top" },

    dropdown: { backgroundColor: "#fff", borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
    dropdownRow: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: C.border },
    dropdownMain: { fontSize: 14, fontWeight: "700", color: C.ink },
    dropdownSub: { fontSize: 12, color: C.muted, marginTop: 2 },

    segmented: { flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 16, padding: 4 },
    segmentBtn: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
    segmentBtnActive: { backgroundColor: C.accent },
    segmentText: { fontSize: 14, fontWeight: "800", color: C.muted },
    segmentTextActive: { color: "#fff" },

    row: { flexDirection: "row", gap: 12, marginTop: 25 },
    tile: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 20, padding: 15, alignItems: "center", borderWidth: 1, borderColor: C.border },
    tileLabel: { fontSize: 10, fontWeight: "800", color: C.muted, marginTop: 8 },
    tileValue: { fontSize: 15, fontWeight: "900", color: C.ink, marginTop: 4 },

    locationCard: { backgroundColor: "#F8FAFC", borderRadius: 20, padding: 12, borderWidth: 1, borderColor: C.border, marginTop: 15 },
    locHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    locTitle: { fontSize: 14, fontWeight: "700", color: C.ink, flex: 1 },
    mapWrap: { height: 200, backgroundColor: "#E2E8F0", borderRadius: 24, overflow: "hidden" },
    map: { width: "100%", height: "100%" },
    mapMock: { ...StyleSheet.absoluteFillObject, backgroundColor: "#334155" },
    expandBtn: { position: "absolute", bottom: 10, right: 10, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 5 },
    expandText: { fontSize: 11, fontWeight: "800", color: C.ink },

    settingsCard: { backgroundColor: "#F8FAFC", borderRadius: 20, padding: 5, borderWidth: 1, borderColor: C.border },
    settingRow: { flexDirection: "row", alignItems: "center", padding: 12 },
    settingIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accentLight, alignItems: "center", justifyContent: "center" },
    settingTitle: { fontSize: 15, fontWeight: "800", color: C.ink },
    settingSub: { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 2 },
    divider: { height: 1, backgroundColor: C.border, marginHorizontal: 15 },

    deleteLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 30 },
    deleteText: { color: C.red, fontSize: 14, fontWeight: "800" },

    updateBtn: { backgroundColor: C.accent, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 30, shadowColor: C.accent, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    updateBtnText: { color: "#fff", fontSize: 18, fontWeight: "900" },
});
