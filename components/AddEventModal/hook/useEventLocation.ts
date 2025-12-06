import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import type { Suggestion, LocationPayload } from "../types";
import { fetchAutocomplete, fetchPlaceDetails } from "../google/places";
import { reverseGeocode } from "../google/geocode";
import { buildLocationFromAddressComponents } from "../location/buildLocation";

export function useEventLocation(GOOGLE_KEY?: string) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);

  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [locationPayload, setLocationPayload] = useState<LocationPayload | null>(null);

  const [locLoading, setLocLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [err, setErr] = useState<string | null>(null);

  // debounce autocomplete
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

  function onQueryChange(t: string) {
    setQuery(t);
    setSelectedAddress("");
    setLocationPayload(null);
    setErr(null);
  }

  function clearQuery() {
    setQuery("");
    setSuggestions([]);
    setSelectedAddress("");
    setLocationPayload(null);
    setErr(null);
  }

  async function pickSuggestion(s: Suggestion) {
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
  }

  async function onMapPicked(lat: number, lng: number) {
    if (!GOOGLE_KEY) return;
    setLocLoading(true);
    setErr(null);
    setSuggestions([]);

    try {
      const picked = { lat, lng };
      setCoord(picked);
      setSelectedAddress("Dropped pin");

      const geo = await reverseGeocode(GOOGLE_KEY, lat, lng);
      if (!geo?.formattedAddress || !geo?.components?.length) {
        setLocationPayload(null);
        setSelectedAddress("Dropped pin (no address found)");
        setErr("Couldn’t resolve city/country for that pin. Try a different spot.");
        return;
      }

      setSelectedAddress(geo.formattedAddress);

      const loc = buildLocationFromAddressComponents({
        lat,
        lng,
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
    } finally {
      setLocLoading(false);
    }
  }

  function reset() {
    setQuery("");
    setSuggestions([]);
    setLoadingSug(false);
    setCoord(null);
    setSelectedAddress("");
    setLocationPayload(null);
    setLocLoading(false);
    setMapReady(false);
    setErr(null);
  }

  return {
    // state
    query,
    suggestions,
    loadingSug,
    coord,
    selectedAddress,
    locationPayload,
    locLoading,
    mapReady,
    err,

    // actions
    setCoord,
    setMapReady,
    setErr,
    onQueryChange,
    clearQuery,
    pickSuggestion,
    onMapPicked,
    reset,
  };
}
