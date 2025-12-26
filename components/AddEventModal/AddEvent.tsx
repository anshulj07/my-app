import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Keyboard } from "react-native";
import { Modalize } from "react-native-modalize";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import { useAuth } from "@clerk/clerk-expo";

import { styles } from "./AddEvent.styles";
import AddEventFields from "./AddEventFields";

import type { CreateEvent, Suggestion, LocationPayload, ListingKind } from "./types";

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

  // Capacity (NEW)
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [capacityText, setCapacityText] = useState("");

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
    return !!coord && Number.isFinite(coord.lat) && Number.isFinite(coord.lng);
  }, [coord]);

  // Capacity derived
  const capacity = useMemo(() => {
    if (!limitEnabled) return null;
    const n = parseInt(capacityText.trim(), 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [limitEnabled, capacityText]);

  const capacityOk = useMemo(() => {
    // ✅ only validate capacity for free events
    if (kind !== "event_free") return true;
    if (!limitEnabled) return true;

    const n = parseInt(capacityText.trim(), 10);
    return Number.isFinite(n) && n > 0;
  }, [kind, limitEnabled, capacityText]);


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
      priceOk &&
      capacityOk
    );
  }, [GOOGLE_KEY, API_BASE, userId, title, hasLocation, submitting, locLoading, kind, priceCents, capacityOk]);

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

    // capacity reset
    setLimitEnabled(false);
    setCapacityText("");

    setShowDetails(false);
    setShowWhen(false);

    setDateOpen(false);
    setTimeOpen(false);

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

  const onMapMessage = async (e: any) => {
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
  };

  async function createListing() {
    if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");
    if (!userId) throw new Error("You must be signed in.");
    if (!coord) throw new Error("Pick a location.");

    if (!locationPayload?.countryCode || !locationPayload?.city) {
      throw new Error("Please select a place so city/country are available.");
    }

    const backendKind = kind === "event_free" ? "free" : kind === "event_paid" ? "paid" : "service";

    const needsPrice = backendKind === "paid" || backendKind === "service";
    if (needsPrice && priceCents === null) throw new Error("Enter a valid price.");

    if (backendKind === "free" && limitEnabled && !capacityOk) {
      throw new Error("Enter a valid capacity.");
    }

    const timezone =
      typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/New_York";

    const startsAt = dateISO && time24 ? new Date(`${dateISO}T${time24}:00`).toISOString() : undefined;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      emoji,

      creatorClerkId: userId,
      kind: backendKind,
      priceCents: needsPrice ? priceCents : null,

      // NEW: capacity (null => open/unlimited)
      capacity: backendKind === "free" && limitEnabled ? capacity : null,

      timezone,
      startsAt,
      date: dateISO.trim(),
      time: time24.trim(),

      tags: [],
      visibility: "public",
      status: "active",

      location: {
        lat: coord.lat,
        lng: coord.lng,
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
  const TOP_GAP = 48;

  return (
    <Modalize
      ref={sheetRef}
      withReactModal
      onClosed={handleFullClose}
      modalHeight={H - TOP_GAP}
      modalTopOffset={TOP_GAP}
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      overlayStyle={styles.overlay}
      keyboardAvoidingBehavior="padding"
      scrollViewProps={{
        keyboardShouldPersistTaps: "handled",
        showsVerticalScrollIndicator: false,
      }}
      reactModalProps={{
        presentationStyle: "overFullScreen",
        statusBarTranslucent: true,
        animationType: "fade",
      }}
    >
      <AddEventFields
        // header
        emoji={emoji}
        title={title}
        kind={kind}
        onClose={() => {
          hardReset();
          sheetRef.current?.close();
        }}

        // basics
        setTitle={setTitle}
        setKind={(k) => {
          setKind(k);
          if (k === "event_free") setPriceText("");
          else {
            // ✅ if not free, disable + clear capacity
            setLimitEnabled(false);
            setCapacityText("");
          }
          setErr(null);
        }}
        priceText={priceText}
        setPriceText={(t) => {
          setPriceText(t);
          setErr(null);
        }}
        priceCents={priceCents}

        // details
        showDetails={showDetails}
        setShowDetails={setShowDetails}
        description={description}
        setDescription={setDescription}

        // capacity
        limitEnabled={limitEnabled}
        setLimitEnabled={(v) => {
          setLimitEnabled(v);
          if (!v) setCapacityText("");
          setErr(null);
        }}
        capacityText={capacityText}
        setCapacityText={(t) => {
          // digits only keeps it clean
          const digits = t.replace(/[^\d]/g, "");
          setCapacityText(digits);
          setErr(null);
        }}
        capacityOk={capacityOk}

        // when
        showWhen={showWhen}
        setShowWhen={setShowWhen}
        dateISO={dateISO}
        setDateISO={setDateISO}
        time24={time24}
        setTime24={setTime24}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        dateOpen={dateOpen}
        setDateOpen={setDateOpen}
        timeOpen={timeOpen}
        setTimeOpen={setTimeOpen}

        // where
        query={query}
        setQuery={(t) => {
          setQuery(t);
          setSelectedAddress("");
          setLocationPayload(null);
          setErr(null);
        }}
        suggestions={suggestions}
        loadingSug={loadingSug}
        onPickSuggestion={handlePickSuggestion}
        clearQuery={() => {
          setQuery("");
          setSuggestions([]);
          setSelectedAddress("");
          setLocationPayload(null);
          setErr(null);
        }}
        selectedAddress={selectedAddress}
        locLoading={locLoading}
        googleKey={GOOGLE_KEY}
        mapRef={mapRef}
        mapHtml={mapHtml}
        onMapMessage={onMapMessage}

        // errors + actions
        err={err}
        submitting={submitting}
        canCreate={canCreate}
        onCancel={() => {
          hardReset();
          sheetRef.current?.close();
        }}
        onCreate={handleCreate}
      />
    </Modalize>
  );
}

/* ---- helpers used by UI too ---- */
function isoToSafeDate(iso: string) {
  if (!iso) return new Date();
  return new Date(`${iso}T12:00:00`);
}
