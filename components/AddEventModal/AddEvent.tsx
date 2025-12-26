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
  LayoutAnimation,
} from "react-native";
import { Modalize } from "react-native-modalize";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import { useAuth } from "@clerk/clerk-expo";
import DateTimePicker from "@react-native-community/datetimepicker";

import { styles } from "./AddEvent.styles";

import type { CreateEvent, Suggestion, LocationPayload, ListingKind } from "./types"; // ✅ import from types.ts

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
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const H = Dimensions.get("window").height;

  // Basics
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ListingKind>("event_free");
  const [priceText, setPriceText] = useState("");

  // Optional
  const [description, setDescription] = useState("");
  const [dateISO, setDateISO] = useState(""); // YYYY-MM-DD
  const [time24, setTime24] = useState(""); // HH:mm

  // “Show more” sections
  const [showDetails, setShowDetails] = useState(false);
  const [showWhen, setShowWhen] = useState(false);

  // Pickers
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  // Location + Places
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);

  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [locationPayload, setLocationPayload] = useState<LocationPayload | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const emoji = useMemo(() => textToEmoji(title), [title]);

  const priceCents = useMemo(() => {
    if (kind === "event_free") return null;
    return parsePriceToCents(priceText);
  }, [kind, priceText]);

  const dateLabel = useMemo(() => {
    if (!dateISO) return "Select date";
    return isoToSafeDate(dateISO).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [dateISO]);

  const timeLabel = useMemo(() => {
    if (!time24) return "Select time";
    const [hh, mm] = time24.split(":").map((x) => parseInt(x, 10));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "Select time";
    return formatTime12h(hh, mm);
  }, [time24]);

  const hasLocation = useMemo(() => {
    // Keep this simple on frontend; backend will validate “schema” later
    return !!coord && Number.isFinite(coord.lat) && Number.isFinite(coord.lng);
  }, [coord]);

  const canCreate = useMemo(() => {
    const needsPrice = kind === "event_paid" || kind === "service";
    const priceOk = !needsPrice || priceCents !== null;
    return (
      !!GOOGLE_KEY &&
      !!API_BASE &&
      !!userId &&
      !!title.trim() &&
      hasLocation &&
      !submitting &&
      !locLoading &&
      priceOk
    );
  }, [GOOGLE_KEY, API_BASE, userId, title, hasLocation, submitting, locLoading, kind, priceCents]);

  // open/close sheet
  useEffect(() => {
    if (visible) sheetRef.current?.open();
    else sheetRef.current?.close();
  }, [visible]);

  useEffect(() => {
    if (visible) initialCenterRef.current = coord ?? initialCenterRef.current ?? DEFAULT_CENTER;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // debounce suggestions
  useEffect(() => {
    const t = setTimeout(() => {
      if (!GOOGLE_KEY) return;
      const q = query.trim();
      if (!q) {
        setSuggestions([]);
        return;
      }
      fetchAutocomplete({
        key: GOOGLE_KEY,
        q,
        setLoading: setLoadingSug,
        setList: setSuggestions,
        setErr,
      });
    }, 250);

    return () => clearTimeout(t);
  }, [query, GOOGLE_KEY]);

  // update map marker
  useEffect(() => {
    if (!mapReady || !coord) return;
    mapRef.current?.postMessage(JSON.stringify({ type: "setMarker", lat: coord.lat, lng: coord.lng }));
  }, [coord, mapReady]);

  const hardReset = () => {
    setTitle("");
    setKind("event_free");
    setPriceText("");
    setDescription("");
    setDateISO("");
    setTime24("");
    setShowDetails(false);
    setShowWhen(false);

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

      // ✅ only set if required fields exist (matches LocationPayload)
      if (!loc?.countryCode || !loc?.city) {
        setLocationPayload(null);
        setErr("Couldn’t extract city/country from that place. Try a different result.");
        return;
      }

      setLocationPayload({
        ...loc,
        lat: details.latLng.lat,
        lng: details.latLng.lng,
        formattedAddress: addr,
        placeId: s.id,
        source: "places_autocomplete",
      });
    } catch {
      setErr("Something went wrong while selecting that place.");
    } finally {
      setLoadingSug(false);
      setLocLoading(false);
    }
  };

async function createListing() {
  if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");
  if (!userId) throw new Error("You must be signed in.");
  if (!coord) throw new Error("Pick a location.");

  // ✅ require structured location (your DB has countryCode/city etc)
  if (!locationPayload?.countryCode || !locationPayload?.city) {
    throw new Error("Please select a place so city/country are available.");
  }

  // ✅ backend/db expects: free | paid | service (not event_free/event_paid)
  const backendKind = kind === "event_free" ? "free" : kind === "event_paid" ? "paid" : "service";

  const needsPrice = backendKind === "paid" || backendKind === "service";
  if (needsPrice && priceCents === null) throw new Error("Enter a valid price.");

  const timezone =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/New_York";

  // ✅ DB has startsAt (UTC). This uses device-local interpretation of date/time.
  // If you need strict timezone conversion, do it on the backend.
  const startsAt =
    dateISO && time24 ? new Date(`${dateISO}T${time24}:00`).toISOString() : undefined;

  const payload = {
    title: title.trim(),
    description: description.trim(),
    emoji,

    creatorClerkId: userId,
    kind: backendKind,                  // ✅ "free" | "paid" | "service"
    priceCents: needsPrice ? priceCents : null,

    timezone,
    startsAt,                           // ✅ matches DB (omit if not set)
    date: dateISO.trim(),
    time: time24.trim(),

    tags: [],                           // ✅ matches DB
    visibility: "public",               // ✅ matches DB
    status: "active",                   // ✅ matches DB

    location: {
      lat: coord.lat,
      lng: coord.lng,

      // ✅ geo point matches DB (lng first)
      geo: { type: "Point", coordinates: [coord.lng, coord.lat] },

      formattedAddress: selectedAddress || locationPayload.formattedAddress || "",
      placeId: locationPayload.placeId || "",

      countryCode: locationPayload.countryCode,
      countryName: locationPayload.countryName || "",

      admin1: locationPayload.admin1 || "",
      admin1Code: locationPayload.admin1Code || "",

      city: locationPayload.city,
      cityKey: locationPayload.cityKey || "",

      postalCode: locationPayload.postalCode || "",
      neighborhood: locationPayload.neighborhood || "",

      source: locationPayload.source || "user_typed",
    },
  };

  const res = await fetch(`${API_BASE}/api/events/create-event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Failed to create");
  return json;
}

  const handleCreate = async () => {
    setErr(null);

    if (!GOOGLE_KEY) {
      setErr("Google Maps key missing (extra.googleMapsKey).");
      return;
    }
    if (!API_BASE) {
      setErr("API base missing (extra.apiBaseUrl).");
      return;
    }
    if (!userId) {
      setErr("Sign in required.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await createListing();
      const ev = created?.event;

      onCreate({
        title: ev?.title ?? title.trim(),
        lat: ev?.location?.lat ?? coord?.lat ?? DEFAULT_CENTER.lat,
        lng: ev?.location?.lng ?? coord?.lng ?? DEFAULT_CENTER.lng,
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
      modalHeight={Math.min(820, Math.max(640, H * 0.92))}
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      overlayStyle={styles.overlay}
      keyboardAvoidingBehavior={Platform.select({ ios: "padding", android: "height" })}
      scrollViewProps={{
        keyboardShouldPersistTaps: "handled",
        showsVerticalScrollIndicator: false,
      }}
    >
      <Header
        emoji={emoji}
        title={title}
        kind={kind}
        onClose={() => {
          hardReset();
          sheetRef.current?.close();
        }}
      />

      <View style={styles.body}>
        {/* BASICS */}
        <Card>
          <CardTitle title="Basics" subtitle="Title + type. Add price only if needed." />

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
              onPress: () => {
                setKind("event_free");
                setPriceText("");
                setErr(null);
              },
            }}
            b={{
              label: "Paid",
              hint: "Ticket",
              active: kind === "event_paid",
              onPress: () => {
                setKind("event_paid");
                setErr(null);
              },
            }}
            c={{
              label: "Service",
              hint: "Book",
              active: kind === "service",
              onPress: () => {
                setKind("service");
                setErr(null);
              },
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
                  onChangeText={(t) => {
                    setPriceText(t);
                    setErr(null);
                  }}
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

        {/* SHOW MORE: DETAILS */}
        <Card>
          <ToggleRow
            title="Details (optional)"
            subtitle={showDetails ? "Tap to hide" : "Tap to add description"}
            open={showDetails}
            onToggle={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowDetails((v) => !v);
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

        {/* SHOW MORE: WHEN */}
        <Card>
          <ToggleRow
            title="When (optional)"
            subtitle={showWhen ? "Tap to hide" : "Tap to add date/time"}
            open={showWhen}
            onToggle={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowWhen((v) => !v);
            }}
          />

          {showWhen && (
            <>
              <View style={{ marginTop: 12 }}>
                <View style={styles.whenGrid}>
                  <Pressable onPress={() => setDateOpen(true)} style={styles.whenTile} android_ripple={{ color: "#E2E8F0" }}>
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

                  <Pressable onPress={() => setTimeOpen(true)} style={styles.whenTile} android_ripple={{ color: "#E2E8F0" }}>
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

              {/* Date picker */}
              <Modal transparent visible={dateOpen} animationType="fade" onRequestClose={() => setDateOpen(false)}>
                <Pressable style={styles.pickerOverlay} onPress={() => setDateOpen(false)}>
                  <Pressable style={styles.pickerCard} onPress={() => { }}>
                    <Text style={styles.pickerTitle}>Pick a date</Text>
                    <DateTimePicker
                      value={isoToSafeDate(dateISO)}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      themeVariant="light"
                      textColor="#0F172A"
                      accentColor="#0A84FF"
                      onChange={(_, d) => {
                        if (!d) return;
                        const iso = d.toISOString().slice(0, 10);
                        setDateISO(iso);
                        if (Platform.OS !== "ios") setDateOpen(false);
                      }}
                    />
                    <TouchableOpacity style={styles.pickerDone} onPress={() => setDateOpen(false)} activeOpacity={0.9}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </Pressable>
                </Pressable>
              </Modal>

              {/* Time picker */}
              <Modal transparent visible={timeOpen} animationType="fade" onRequestClose={() => setTimeOpen(false)}>
                <Pressable style={styles.pickerOverlay} onPress={() => setTimeOpen(false)}>
                  <Pressable style={styles.pickerCard} onPress={() => { }}>
                    <Text style={styles.pickerTitle}>Pick a time</Text>
                    <DateTimePicker
                      value={timeToDate(time24)}
                      mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      themeVariant="light"
                      textColor="#0F172A"
                      accentColor="#0A84FF"
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

          {!!selectedAddress && <Pill tone="success" text={selectedAddress} />}

          {locLoading && (
            <View style={styles.inlineLoading}>
              <ActivityIndicator />
              <Text style={styles.inlineLoadingText}>Resolving address…</Text>
            </View>
          )}

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
                          setSelectedAddress("Dropped pin (no address found)");
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

                        setLocationPayload({
                          ...loc,
                          lat: picked.lat,
                          lng: picked.lng,
                          formattedAddress: geo.formattedAddress,
                          placeId: geo.placeId ?? "",
                          source: "reverse_geocode",
                          countryCode: loc?.countryCode ?? "",
                          countryName: loc?.countryName ?? "",
                          admin1: loc?.admin1 ?? "",
                          admin1Code: loc?.admin1Code ?? "",
                          city: loc?.city ?? "",
                          cityKey: loc?.cityKey ?? "",
                          postalCode: loc?.postalCode ?? "",
                          neighborhood: loc?.neighborhood ?? "",
                        });
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
          primaryLabel={
            submitting
              ? "Creating…"
              : kind === "service"
                ? "Create service"
                : kind === "event_paid"
                  ? "Create paid event"
                  : "Create free event"
          }
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

/* ---------------- UI components ---------------- */

function Header({
  emoji,
  title,
  kind,
  onClose,
}: {
  emoji: string;
  title: string;
  kind: ListingKind;
  onClose: () => void;
}) {
  const tag = kind === "service" ? "Service" : kind === "event_paid" ? "Paid event" : "Free event";

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

