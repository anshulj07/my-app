// components/EditEventModal/EditEventModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Keyboard } from "react-native";
import { Modalize } from "react-native-modalize";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import { useAuth } from "@clerk/clerk-expo";

import type { Suggestion, LocationPayload, ListingKind } from "../AddEventModal/types";
import { textToEmoji } from "../AddEventModal/utils/emoji";
import { parsePriceToCents } from "../AddEventModal/utils/time";
import { fetchAutocomplete, fetchPlaceDetails } from "../AddEventModal/google/places";
import { reverseGeocode } from "../AddEventModal/google/geocode";
import { buildLocationFromAddressComponents } from "../AddEventModal/location/buildLocation";
import { makeGoogleMapHtml } from "../AddEventModal/map/googleMapHtml";

import EditEventModalView from "./EditEventView";

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

export type EditableEvent = {
  _id: string;
  title?: string;
  description?: string; // ✅ NEW
  emoji?: string;
  kind?: ListingKind;
  priceCents?: number | string | null;
  date?: string;
  time?: string;
  timezone?: string;
  creatorClerkId?: string;
  location?: Partial<LocationPayload> & {
    lat?: number | string;
    lng?: number | string;
    formattedAddress?: string;
    address?: string;
    placeId?: string;
  };
};

function toNumber(v: any): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function makeCityKey(city: string) {
  return city
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

export default function EditEventModal({
  visible,
  onClose,
  event,
  onUpdated,
  onDeleted,
}: {
  visible: boolean;
  onClose: () => void;
  event: EditableEvent | null;
  onUpdated?: (updated: any) => void;
  onDeleted?: (_id: string) => void;
}) {
  const sheetRef = useRef<Modalize>(null);
  const mapRef = useRef<WebView>(null);
  const initialCenterRef = useRef<{ lat: number; lng: number }>(DEFAULT_CENTER);

  const { userId } = useAuth();

  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const H = Dimensions.get("window").height;

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // ✅ NEW
  const emoji = useMemo(() => (title.trim() ? textToEmoji(title) : "📍"), [title]);

  const [kind, setKind] = useState<ListingKind>("event_free");
  const [priceText, setPriceText] = useState("");

  const priceCents = useMemo(() => {
    const needsPrice = kind === "service" || kind === ("event_paid" as ListingKind);
    if (!needsPrice) return null;
    return parsePriceToCents(priceText);
  }, [kind, priceText]);


  const [dateISO, setDateISO] = useState("");
  const [time24, setTime24] = useState("");

  // Places autocomplete
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);

  // Location state
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [locationPayload, setLocationPayload] = useState<LocationPayload | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // open/close
  useEffect(() => {
    if (visible) sheetRef.current?.open();
    else sheetRef.current?.close();
  }, [visible]);

  // Prefill
  useEffect(() => {
    if (!visible || !event) return;

    const eTitle = (event.title ?? "").toString();
    const eDesc = (event.description ?? "").toString(); // ✅ NEW
    const eKind = (event.kind ?? "free") as ListingKind;

    const ePrice =
      event.priceCents == null
        ? ""
        : typeof event.priceCents === "string"
          ? event.priceCents
          : String(Math.max(0, Math.round(Number(event.priceCents)) / 100));

    const eDate = (event.date ?? "").toString();
    const eTime = (event.time ?? "").toString();

    const lat = toNumber(event.location?.lat);
    const lng = toNumber(event.location?.lng);
    const formatted = (event.location?.formattedAddress ?? event.location?.address ?? "").toString().trim();

    setTitle(eTitle);
    setDescription(eDesc); // ✅ NEW
    setKind(eKind);
    setPriceText(eKind === "service" ? ePrice : "");
    setDateISO(eDate);
    setTime24(eTime);

    setErr(null);
    setSubmitting(false);
    setDeleting(false);

    if (lat != null && lng != null) {
      setCoord({ lat, lng });
      initialCenterRef.current = { lat, lng };
    } else {
      setCoord(null);
      initialCenterRef.current = DEFAULT_CENTER;
    }

    if (formatted) {
      setQuery(formatted);
      setSelectedAddress(formatted);
    } else {
      setQuery("");
      setSelectedAddress("");
    }

    const lp = event.location as any;
    if (lp?.city && lp?.countryCode && Number.isFinite(toNumber(lp?.lat)) && Number.isFinite(toNumber(lp?.lng))) {
      setLocationPayload({
        ...(lp as LocationPayload),
        lat: toNumber(lp.lat) as number,
        lng: toNumber(lp.lng) as number,
        formattedAddress: lp.formattedAddress ?? lp.address ?? formatted ?? "",
        cityKey: lp.cityKey || makeCityKey(lp.city),
        source: lp.source ?? "db",
      });
    } else {
      setLocationPayload(null);
    }

    setSuggestions([]);
    setLoadingSug(false);
    setLocLoading(false);
    setMapReady(false);
  }, [visible, event]);

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

  const isCreator = !!event?.creatorClerkId && !!userId && event.creatorClerkId === userId;

  const canSave =
    !!event?._id &&
    !!GOOGLE_KEY &&
    !!title.trim() &&
    !!coord &&
    hasStructuredLocation &&
    !!userId &&
    isCreator &&
    !submitting &&
    !deleting &&
    !locLoading &&
    (kind === "event_free" || priceCents !== null);

  async function updateEventInDb(args: {
    apiBase: string;
    apiKey?: string;
    eventId: string;
    title: string;
    description: string; // ✅ NEW
    emoji: string;
    date?: string;
    time?: string;
    timezone?: string;
    location: LocationPayload;
    kind: ListingKind;
    priceCents: number | null;
    creatorClerkId: string;
  }) {
    const payload = {
      _id: args.eventId,
      eventId: args.eventId,

      updates: {
        title: args.title,
        description: args.description, // ✅ NEW
        emoji: args.emoji,
        date: args.date ?? "",
        time: args.time ?? "",
        timezone: args.timezone ?? "",
        kind: args.kind,
        priceCents: args.priceCents,
        location: {
          ...args.location,
          cityKey: args.location.cityKey || makeCityKey(args.location.city),
          formattedAddress: args.location.formattedAddress ?? "",
          source: args.location.source ?? "user_edit",
        },
      },

      title: args.title,
      description: args.description, // ✅ NEW
      emoji: args.emoji,
      date: args.date ?? "",
      time: args.time ?? "",
      timezone: args.timezone ?? "",
      kind: args.kind,
      priceCents: args.priceCents,
      location: {
        ...args.location,
        cityKey: args.location.cityKey || makeCityKey(args.location.city),
        formattedAddress: args.location.formattedAddress ?? "",
        source: args.location.source ?? "user_edit",
      },

      creatorClerkId: args.creatorClerkId,
    };

    const res = await fetch(`${args.apiBase}/api/events/update-event`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(args.apiKey ? { "x-api-key": args.apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch { }
    if (!res.ok) throw new Error(json?.error || json?.message || text || "Failed to update event");
    return json;
  }

  async function deleteEventInDb(args: { apiBase: string; apiKey?: string; eventId: string; creatorClerkId: string }) {
    const res = await fetch(`${args.apiBase}/api/events/delete-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(args.apiKey ? { "x-api-key": args.apiKey } : {}),
      },
      body: JSON.stringify({ _id: args.eventId, eventId: args.eventId, creatorClerkId: args.creatorClerkId }),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch { }
    if (!res.ok) throw new Error(json?.error || json?.message || text || "Failed to delete event");
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

  const handleSave = async () => {
    if (!event?._id || !coord || !locationPayload) return;

    if (!API_BASE) return setErr("Missing API base URL (extra.apiBaseUrl).");
    if (!userId) return setErr("You must be signed in to edit an event.");
    if (!isCreator) return setErr("Only the creator can edit this event.");
    if ((kind === "service" || kind === ("event_paid" as ListingKind)) && priceCents === null)
      return setErr("Enter a valid price.");


    setSubmitting(true);
    setErr(null);

    try {
      const timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

      const updated = await updateEventInDb({
        apiBase: API_BASE,
        apiKey: EVENT_API_KEY,
        eventId: event._id,
        title: title.trim(),
        description: description.trim(), // ✅ NEW
        emoji,
        date: dateISO.trim(),
        time: time24.trim(),
        timezone,
        location: locationPayload,
        kind,
        priceCents,
        creatorClerkId: userId,
      });

      onUpdated?.(updated?.event ?? updated);
      sheetRef.current?.close();
    } catch (e: any) {
      setErr(e?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event?._id) return;

    if (!API_BASE) return setErr("Missing API base URL (extra.apiBaseUrl).");
    if (!userId) return setErr("You must be signed in to delete an event.");
    if (!isCreator) return setErr("Only the creator can delete this event.");

    setDeleting(true);
    setErr(null);

    try {
      await deleteEventInDb({ apiBase: API_BASE, apiKey: EVENT_API_KEY, eventId: event._id, creatorClerkId: userId });
      onDeleted?.(event._id);
      sheetRef.current?.close();
    } catch (e: any) {
      setErr(e?.message || "Failed to delete event.");
      setDeleting(false);
    }
  };

  const mapHtml = useMemo(
    () => (GOOGLE_KEY ? makeGoogleMapHtml(GOOGLE_KEY, initialCenterRef.current) : ""),
    [GOOGLE_KEY]
  );

  const hardClose = () => {
    setSuggestions([]);
    setErr(null);
    setSubmitting(false);
    setDeleting(false);
    onClose();
  };

  return (
    <EditEventModalView
      // modal plumbing
      sheetRef={sheetRef}
      onClosed={hardClose}
      modalHeight={Math.min(820, Math.max(620, H * 0.92))}

      // auth/event flags
      isCreator={isCreator}
      canSave={canSave}

      // state
      title={title}
      setTitle={(t) => { setTitle(t); setErr(null); }}
      description={description}
      setDescription={(t) => { setDescription(t); setErr(null); }}

      kind={kind}
      setKind={(k) => {
        setKind(k);
        setErr(null);

        const needsPrice = k === "service" || k === ("event_paid" as ListingKind);
        if (!needsPrice) setPriceText(""); // only clear for free
      }}


      priceText={priceText}
      setPriceText={(t) => { setPriceText(t); setErr(null); }}

      dateISO={dateISO}
      setDateISO={(v) => { setDateISO(v); setErr(null); }}

      time24={time24}
      setTime24={(v) => { setTime24(v); setErr(null); }}

      query={query}
      setQuery={(t) => { setQuery(t); setSelectedAddress(""); setLocationPayload(null); setErr(null); }}
      suggestions={suggestions}
      loadingSug={loadingSug}
      onPickSuggestion={handlePickSuggestion}

      coord={coord}
      setCoord={setCoord}
      selectedAddress={selectedAddress}
      setSelectedAddress={setSelectedAddress}

      locationPayload={locationPayload}
      setLocationPayload={setLocationPayload}

      locLoading={locLoading}
      setLocLoading={setLocLoading}

      mapRef={mapRef}
      mapHtml={mapHtml}
      mapReady={mapReady}
      setMapReady={setMapReady}

      GOOGLE_KEY={GOOGLE_KEY}

      err={err}
      submitting={submitting}
      deleting={deleting}

      onClosePress={() => sheetRef.current?.close()}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
