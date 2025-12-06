// components/AddEventModal/AddEventModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Dimensions,
  Keyboard,
} from "react-native";
import { Modalize } from "react-native-modalize";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import { useAuth } from "@clerk/clerk-expo";

import type { CreateEvent, Suggestion, Option, LocationPayload, EventKind } from "./types";
import { textToEmoji } from "./utils/emoji";
import { formatTime12h, parsePriceToCents } from "./utils/time";
import { fetchAutocomplete, fetchPlaceDetails } from "./google/places";
import { reverseGeocode } from "./google/geocode";
import { buildLocationFromAddressComponents } from "./location/buildLocation";
import { makeGoogleMapHtml } from "./map/googleMapHtml";

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

export default function AddEventModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (e: CreateEvent) => void;
}) {
  const sheetRef = useRef<Modalize>(null);
  const mapRef = useRef<WebView>(null);
  const initialCenterRef = useRef<{ lat: number; lng: number }>(DEFAULT_CENTER);

  const { userId } = useAuth();

  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined; // optional

  const H = Dimensions.get("window").height;

  // Form
  const [title, setTitle] = useState("");
  const emoji = textToEmoji(title);

  const [kind, setKind] = useState<EventKind>("free");
  const [priceText, setPriceText] = useState("");

  const priceCents = useMemo(() => {
    if (kind !== "service") return null;
    return parsePriceToCents(priceText);
  }, [kind, priceText]);

  const [dateISO, setDateISO] = useState("");
  const [time24, setTime24] = useState("");

  // Places autocomplete
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);

  // Location state (structured)
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [locationPayload, setLocationPayload] = useState<LocationPayload | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // open/close
  useEffect(() => {
    if (visible) sheetRef.current?.open();
    else sheetRef.current?.close();
  }, [visible]);

  useEffect(() => {
    // keep initial center stable for WebView (avoid reload flicker)
    if (visible) {
      initialCenterRef.current = coord ?? initialCenterRef.current ?? DEFAULT_CENTER;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const hardReset = () => {
    setTitle("");
    setKind("free");
    setPriceText("");
    setDateISO("");
    setTime24("");
    setQuery("");
    setSuggestions([]);
    setSelectedAddress("");
    setCoord(null);
    setLocationPayload(null);
    setErr(null);
    setSubmitting(false);
    setMapReady(false);
    setLoadingSug(false);
    setLocLoading(false);
  };

  const handleFullClose = () => {
    hardReset();
    onClose();
  };

  // dropdown options
  const dateOptions: Option[] = useMemo(() => {
    const out: Option[] = [{ label: "No date", value: "" }];
    const base = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      out.push({ label, value: iso });
    }
    return out;
  }, []);

  const timeOptions: Option[] = useMemo(() => {
    const out: Option[] = [{ label: "No time", value: "" }];
    const start = 6 * 60;
    const end = 23 * 60;
    for (let m = start; m <= end; m += 30) {
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      const value = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      out.push({ label: formatTime12h(hh, mm), value });
    }
    return out;
  }, []);

  const dateLabel = dateOptions.find((o) => o.value === dateISO)?.label ?? "No date";
  const timeLabel = timeOptions.find((o) => o.value === time24)?.label ?? "No time";

  // debounce suggestions
  useEffect(() => {
    const t = setTimeout(() => {
      if (!GOOGLE_KEY) return;
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      fetchAutocomplete({
        key: GOOGLE_KEY,
        q: query,
        setLoading: setLoadingSug,
        setList: setSuggestions,
        setErr,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query, GOOGLE_KEY]);

  // when coord changes, update map marker
  useEffect(() => {
    if (!mapReady || !coord) return;
    mapRef.current?.postMessage(JSON.stringify({ type: "setMarker", lat: coord.lat, lng: coord.lng }));
  }, [coord, mapReady]);

  const hasStructuredLocation =
    !!locationPayload?.countryCode &&
    !!locationPayload?.city &&
    Number.isFinite(locationPayload.lat) &&
    Number.isFinite(locationPayload.lng);

  const canCreate =
    !!GOOGLE_KEY &&
    !!title.trim() &&
    !!coord &&
    hasStructuredLocation &&
    !!userId &&
    !submitting &&
    !locLoading &&
    (kind === "free" || priceCents !== null);

  async function createEventInDb(args: {
    apiBase: string;
    apiKey?: string;
    title: string;
    emoji: string;
    date?: string;
    time?: string;
    timezone?: string;
    location: LocationPayload;
    creatorClerkId: string;
    kind: EventKind;
    priceCents: number | null;
  }) {
    const res = await fetch(`${args.apiBase}/api/events/create-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(args.apiKey ? { "x-api-key": args.apiKey } : {}),
      },
      body: JSON.stringify({
        title: args.title,
        emoji: args.emoji,
        date: args.date ?? "",
        time: args.time ?? "",
        timezone: args.timezone ?? "",
        creatorClerkId: args.creatorClerkId,
        kind: args.kind,
        priceCents: args.priceCents,
        location: {
          ...args.location,
          cityKey: args.location.cityKey || makeCityKey(args.location.city),
          formattedAddress: args.location.formattedAddress ?? "",
          source: args.location.source ?? "user_typed",
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to create event");
    return json;
  }

  const handlePickSuggestion = async (s: Suggestion) => {
    if (!GOOGLE_KEY) return;
    Keyboard.dismiss();
    setErr(null);
    setLoadingSug(true);
    setLocLoading(true);

    try {
      const details = await fetchPlaceDetails(GOOGLE_KEY, s.id);
      if (!details?.latLng) {
        setErr("Couldn’t get coordinates for that place. Try another search.");
        return;
      }

      const addr = details.formattedAddress || [s.main, s.secondary].filter(Boolean).join(", ");
      setCoord(details.latLng);
      setSelectedAddress(addr);
      setQuery(addr);
      setSuggestions([]);

      const loc = buildLocationFromAddressComponents({
        lat: details.latLng.lat,
        lng: details.latLng.lng,
        formattedAddress: addr,
        placeId: s.id,
        components: details.addressComponents ?? [],
        source: "places_autocomplete",
      });

      if (!loc?.countryCode || !loc?.city) {
        setLocationPayload(null);
        setErr("Couldn’t extract city/country from that place. Try a different result.");
        return;
      }

      setLocationPayload(loc);
    } catch {
      setErr("Something went wrong while selecting that place.");
    } finally {
      setLoadingSug(false);
      setLocLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!coord || !locationPayload) return;

    if (!API_BASE) {
      setErr("Missing API base URL (extra.apiBaseUrl).");
      return;
    }

    if (!userId) {
      setErr("You must be signed in to create an event.");
      return;
    }

    if (kind === "service" && priceCents === null) {
      setErr("Enter a valid price for a service event.");
      return;
    }

    setSubmitting(true);
    setErr(null);

    try {
      const timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

      const created = await createEventInDb({
        apiBase: API_BASE,
        apiKey: EVENT_API_KEY,
        title: title.trim(),
        emoji,
        date: dateISO.trim(),
        time: time24.trim(),
        timezone,
        location: locationPayload,
        creatorClerkId: userId,
        kind,
        priceCents,
      });

      const ev = created?.event;

      onCreate({
        title: ev?.title ?? title.trim(),
        lat: ev?.location?.lat ?? coord.lat,
        lng: ev?.location?.lng ?? coord.lng,
        emoji: ev?.emoji ?? emoji,
      });

      sheetRef.current?.close();
    } catch (e: any) {
      setErr(e?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const mapHtml = useMemo(() => makeGoogleMapHtml(GOOGLE_KEY, initialCenterRef.current), [GOOGLE_KEY]);

  return (
    <Modalize
      ref={sheetRef}
      onClosed={handleFullClose}
      modalHeight={Math.min(780, Math.max(600, H * 0.90))}
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      overlayStyle={styles.overlay}
      keyboardAvoidingBehavior={Platform.select({ ios: "padding", android: "height" })}
      scrollViewProps={{ keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false }}
    >
      <Header
        emoji={emoji}
        title={title}
        onClose={() => {
          hardReset();
          sheetRef.current?.close();
        }}
      />

      <View style={styles.body}>
        <Card>
          <CardTitle title="What’s happening?" subtitle="Give it a clear title people will click." />
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
        </Card>

        <Card>
          <CardTitle title="Event type" subtitle="Free events are joinable. Service events are bookable." />

          <Segmented
            left={{ label: "Free", hint: "Join", active: kind === "free", onPress: () => { setKind("free"); setPriceText(""); } }}
            right={{ label: "Service", hint: "Book", active: kind === "service", onPress: () => setKind("service") }}
          />

          {kind === "service" && (
            <View style={{ marginTop: 14 }}>
              <FieldLabel>Price (USD)</FieldLabel>
              <InputShell>
                <Text style={styles.pricePrefix}>$</Text>
                <TextInput
                  value={priceText}
                  onChangeText={(t) => {
                    setPriceText(t);
                    setErr(null);
                  }}
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

              {priceText.length > 0 && priceCents === null && (
                <Text style={[styles.helper, { color: "#DC2626", fontWeight: "900" }]}>
                  Enter a valid price greater than 0.
                </Text>
              )}
            </View>
          )}
        </Card>

        <Card>
          <CardTitle title="When" subtitle="Optional — you can add date/time later too." />
          <View style={styles.twoCol}>
            <Dropdown label="Date" valueLabel={dateLabel} options={dateOptions} onSelect={setDateISO} />
            <Dropdown label="Time" valueLabel={timeLabel} options={timeOptions} onSelect={setTime24} />
          </View>
        </Card>

        <Card>
          <CardTitle title="Where" subtitle="Search a place or drop a pin on the map." />

          <InputShell>
            <Text style={styles.locationIcon}>📍</Text>
            <TextInput
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setSelectedAddress("");
                setLocationPayload(null);
                setErr(null);
              }}
              placeholder="Search an address or place"
              placeholderTextColor="#94A3B8"
              style={styles.locationInput}
              returnKeyType="search"
            />
            {!!query && (
              <Pressable
                hitSlop={12}
                onPress={() => {
                  setQuery("");
                  setSuggestions([]);
                  setSelectedAddress("");
                  setLocationPayload(null);
                  setErr(null);
                }}
                style={styles.iconBtn}
              >
                <Text style={styles.iconBtnText}>×</Text>
              </Pressable>
            )}
          </InputShell>

          {/* Suggestions */}
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
                      onPress={() => handlePickSuggestion(s)}
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

          {/* Selected */}
          {!!selectedAddress && <Pill tone="success" text={selectedAddress} />}
          {!!locationPayload && (
            <Pill
              tone="info"
              text={`${locationPayload.city}${
                locationPayload.admin1Code ? `, ${locationPayload.admin1Code}` : locationPayload.admin1 ? `, ${locationPayload.admin1}` : ""
              }${locationPayload.countryCode ? ` • ${locationPayload.countryCode}` : ""}`}
            />
          )}

          {locLoading && (
            <View style={styles.inlineLoading}>
              <ActivityIndicator />
              <Text style={styles.inlineLoadingText}>Resolving address…</Text>
            </View>
          )}

          {/* Map */}
          <View style={styles.mapWrap}>
            {!GOOGLE_KEY ? (
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
                  onMessage={async (e) => {
                    try {
                      const msg = JSON.parse(e.nativeEvent.data);
                      if (msg?.type === "ready") setMapReady(true);

                      if (msg?.type === "picked" && typeof msg.lat === "number" && typeof msg.lng === "number") {
                        const picked = { lat: msg.lat, lng: msg.lng };
                        setCoord(picked);
                        setSuggestions([]);
                        setErr(null);

                        if (!GOOGLE_KEY) return;

                        setLocLoading(true);
                        setSelectedAddress("Dropped pin");

                        const geo = await reverseGeocode(GOOGLE_KEY, picked.lat, picked.lng);
                        if (!geo?.formattedAddress || !geo?.components?.length) {
                          setLocationPayload(null);
                          setSelectedAddress("Dropped pin (no address found)");
                          setErr("Couldn’t resolve city/country for that pin. Try a different spot.");
                          return;
                        }

                        setSelectedAddress(geo.formattedAddress);

                        const loc = buildLocationFromAddressComponents({
                          lat: picked.lat,
                          lng: picked.lng,
                          formattedAddress: geo.formattedAddress,
                          placeId: geo.placeId,
                          components: geo.components,
                          source: "reverse_geocode",
                        });

                        if (!loc?.countryCode || !loc?.city) {
                          setLocationPayload(null);
                          setErr("Couldn’t extract city/country for that pin. Try a different spot.");
                          return;
                        }

                        setLocationPayload(loc);
                      }
                    } catch {
                      // ignore
                    } finally {
                      setLocLoading(false);
                    }
                  }}
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
          primaryLabel={submitting ? "Creating…" : kind === "service" ? "Create service event" : "Create free event"}
          canCreate={canCreate}
          submitting={submitting}
          onCancel={() => {
            hardReset();
            sheetRef.current?.close();
          }}
          onCreate={handleCreate}
        />
      </View>
    </Modalize>
  );
}

/* ---------------- UI (broken into components IN SAME FILE) ---------------- */

function Header({
  emoji,
  title,
  onClose,
}: {
  emoji: string;
  title: string;
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
          <Text style={styles.headerTitle}>Create event</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {title.trim() ? title.trim() : "Free or service • Optional time • Pick a place"}
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

/* ---------------- Dropdown (kept inline) ---------------- */

function Dropdown({
  label,
  valueLabel,
  options,
  onSelect,
}: {
  label: string;
  valueLabel: string;
  options: Option[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.smallLabel}>{label}</Text>

      <Pressable onPress={() => setOpen(true)} style={styles.select}>
        <Text numberOfLines={1} style={styles.selectText}>
          {valueLabel}
        </Text>
        <Text style={styles.chev}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.optionSheet} onPress={() => {}}>
            <Text style={styles.optionTitle}>{label}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((o) => (
                <Pressable
                  key={o.label + o.value}
                  style={styles.optionRow}
                  onPress={() => {
                    onSelect(o.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{o.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ---------------- helpers ---------------- */

function makeCityKey(city: string) {
  return city
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

/* ---------------- styles (kept IN THIS FILE) ---------------- */

const styles = StyleSheet.create({
  overlay: { backgroundColor: "rgba(2,6,23,0.40)" },

  modal: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#0B1220",
    overflow: "hidden",
  },
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
    backgroundColor: "rgba(56,189,248,0.18)",
    transform: [{ scaleX: 1.2 }],
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  headerTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 18 },
  headerSub: { color: "rgba(226,232,240,0.75)", marginTop: 2, fontSize: 12 },
  closeBtn: {
    marginLeft: "auto",
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
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
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

  twoCol: { flexDirection: "row", gap: 12 },

  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: { color: "#0F172A", fontWeight: "850" as any },
  chev: { color: "#64748B", fontWeight: "900" },

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

  dropdown: {
    marginTop: 10,
    borderRadius: 16,
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

  pill: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: "100%",
  },
  pillSuccess: { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.25)" },
  pillInfo: { backgroundColor: "rgba(14,165,233,0.10)", borderColor: "rgba(14,165,233,0.22)" },
  pillText: { fontWeight: "900", fontSize: 12 },
  pillTextSuccess: { color: "#166534" },
  pillTextInfo: { color: "#075985" },

  inlineLoading: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  inlineLoadingText: { color: "#64748B", fontWeight: "900" },

  mapWrap: {
    marginTop: 12,
    height: 210,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#0B1220",
  },
  map: { flex: 1, backgroundColor: "#0B1220" },

  mapOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    alignItems: "flex-start",
  },
  mapOverlayPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.75)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
  },
  mapOverlayText: { color: "#E2E8F0", fontWeight: "900", fontSize: 12 },

  mapFallback: { flex: 1, padding: 16, justifyContent: "center" },
  mapFallbackTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 14 },
  mapFallbackBody: { color: "rgba(226,232,240,0.78)", marginTop: 8, lineHeight: 18 },

  err: { marginTop: 12, color: "#DC2626", fontWeight: "900" },

  actions: { flexDirection: "row", gap: 12, marginTop: 2 },
  secondaryBtn: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryText: { color: "#0F172A", fontWeight: "950" as any },

  primaryBtn: {
    flex: 1.6,
    borderRadius: 18,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.45)",
    padding: 16,
    justifyContent: "flex-end",
  },
  optionSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    maxHeight: "70%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionTitle: {
    padding: 14,
    fontWeight: "950" as any,
    color: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  optionText: { color: "#0F172A", fontWeight: "850" as any },
});
