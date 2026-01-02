// components/add-event/steps/WhereStep.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
} from "react-native";
import { WebView } from "react-native-webview";
import StepShell from "./StepShell";
import type { WizardState } from "../wizard/wizardTypes";
import type { WizardAction } from "../wizard/wizardReducer";
import type { Suggestion, LocationPayload } from "../types";

import { fetchAutocomplete, fetchPlaceDetails } from "../google/places";
import { reverseGeocode } from "../google/geocode";
import { buildLocationFromAddressComponents } from "../location/buildLocation";
import { makeGoogleMapHtml } from "../map/googleMapHtml";

const DEFAULT_CENTER = { lat: 0, lng: 0 };

export default function WhereStep({
  state,
  dispatch,
  mapRef,
  googleKey,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  mapRef: React.RefObject<WebView>;
  googleKey?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const initialCenterRef = useRef(state.coord ?? DEFAULT_CENTER);

  // debounce autocomplete
  useEffect(() => {
    const t = setTimeout(() => {
      if (!googleKey) return;

      const q = (state.query || "").trim();

      // ✅ If we already selected something, don't re-open suggestions.
      if (state.selectedAddress && q === state.selectedAddress) {
        setSuggestions([]);
        return;
      }

      if (!q) {
        setSuggestions([]);
        return;
      }

      fetchAutocomplete({
        key: googleKey,
        q,
        setLoading: setLoadingSug,
        setList: setSuggestions,
        setErr: (e) => dispatch({ type: "SET_ERR", err: e }),
      });
    }, 240);

    return () => clearTimeout(t);
  }, [state.query, state.selectedAddress, googleKey, dispatch]);


  // init center when step mounts
  useEffect(() => {
    if (state.coord) initialCenterRef.current = state.coord;
  }, [state.coord]);

  // update marker on coord change
  useEffect(() => {
    if (!mapReady || !state.coord) return;
    mapRef.current?.postMessage(JSON.stringify({ type: "setMarker", lat: state.coord.lat, lng: state.coord.lng }));
  }, [state.coord, mapReady, mapRef]);

  const hasLocation = !!state.coord && Number.isFinite(state.coord.lat) && Number.isFinite(state.coord.lng);

  const clearQuery = () => {
    dispatch({ type: "SET", key: "query", value: "" });
    dispatch({ type: "SET", key: "selectedAddress", value: "" });
    dispatch({ type: "SET", key: "coord", value: null });
    dispatch({ type: "SET", key: "locationPayload", value: null });
    setSuggestions([]);
  };

  const pickSuggestion = async (s: Suggestion) => {
    if (!googleKey) return;
    Keyboard.dismiss();
    dispatch({ type: "SET_ERR", err: null });
    setLoadingSug(true);
    setLocLoading(true);

    try {
      const details = await fetchPlaceDetails(googleKey, s.id);
      if (!details?.latLng) {
        dispatch({ type: "SET_ERR", err: "Couldn’t get coordinates for that place. Try another search." });
        return;
      }

      const addr = details.formattedAddress || [s.main, s.secondary].filter(Boolean).join(", ");

      dispatch({ type: "SET", key: "coord", value: details.latLng });
      dispatch({ type: "SET", key: "selectedAddress", value: addr });
      dispatch({ type: "SET", key: "query", value: addr });
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
        dispatch({ type: "SET", key: "locationPayload", value: null });
        dispatch({ type: "SET_ERR", err: "Couldn’t extract city/country from that place. Try a different result." });
        return;
      }

      const payload: LocationPayload = {
        ...loc,
        lat: details.latLng.lat,
        lng: details.latLng.lng,
        formattedAddress: addr,
        placeId: s.id,
        source: "places_autocomplete",
      } as any;

      dispatch({ type: "SET", key: "locationPayload", value: payload });
    } catch {
      dispatch({ type: "SET_ERR", err: "Something went wrong while selecting that place." });
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

        dispatch({ type: "SET", key: "coord", value: picked });
        setSuggestions([]);
        dispatch({ type: "SET_ERR", err: null });

        if (!googleKey) return;

        setLocLoading(true);
        dispatch({ type: "SET", key: "selectedAddress", value: "Dropped pin" });

        const geo = await reverseGeocode(googleKey, picked.lat, picked.lng);
        if (!geo?.formattedAddress || !geo?.components?.length) {
          dispatch({ type: "SET", key: "selectedAddress", value: "Dropped pin (no address found)" });
          return;
        }

        dispatch({ type: "SET", key: "selectedAddress", value: geo.formattedAddress });

        const loc = buildLocationFromAddressComponents({
          lat: picked.lat,
          lng: picked.lng,
          formattedAddress: geo.formattedAddress,
          placeId: geo.placeId,
          components: geo.components,
          source: "reverse_geocode",
        });

        const payload: LocationPayload = {
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
        } as any;

        dispatch({ type: "SET", key: "locationPayload", value: payload });
      }
    } catch {
      // ignore
    } finally {
      setLocLoading(false);
    }
  };

  const mapHtml = useMemo(() => makeGoogleMapHtml(googleKey, initialCenterRef.current), [googleKey]);

  return (
    <>
      {!googleKey ? (
        <View style={styles.mapFallback}>
          <Text style={styles.mapFallbackTitle}>Google Maps key missing</Text>
          <Text style={styles.mapFallbackBody}>Add extra.googleMapsKey in app config to use maps + autocomplete.</Text>
        </View>
      ) : (
        <>
          <View style={styles.inputShell}>
            <Text style={styles.icon}>📍</Text>
            <TextInput
              value={state.query}
              onChangeText={(t) => {
                dispatch({ type: "SET", key: "query", value: t });
                dispatch({ type: "SET", key: "selectedAddress", value: "" });
                dispatch({ type: "SET", key: "locationPayload", value: null });
              }}
              placeholder="Search an address or place"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              returnKeyType="search"
            />
            {!!state.query && (
              <Pressable onPress={clearQuery} hitSlop={12} style={styles.xBtn}>
                <Text style={styles.xTxt}>×</Text>
              </Pressable>
            )}
          </View>

          {(loadingSug || suggestions.length > 0) && (
            <View style={styles.dropdown}>
              {loadingSug ? (
                <View style={styles.dropdownLoading}>
                  <ActivityIndicator />
                  <Text style={styles.dropdownLoadingText}>Searching…</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                  {suggestions.map((s) => (
                    <Pressable key={s.id} onPress={() => pickSuggestion(s)} style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.main} numberOfLines={1}>
                          {s.main}
                        </Text>
                        {!!s.secondary && (
                          <Text style={styles.secondary} numberOfLines={1}>
                            {s.secondary}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.arrow}>›</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {!!state.selectedAddress && (
            <View style={[styles.pill, styles.pillOk]}>
              <Text style={[styles.pillText, styles.pillTextOk]} numberOfLines={2}>
                {state.selectedAddress}
              </Text>
            </View>
          )}

          {locLoading && (
            <View style={styles.inlineLoading}>
              <ActivityIndicator />
              <Text style={styles.inlineLoadingText}>Resolving address…</Text>
            </View>
          )}

          <View style={styles.mapWrap}>

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
                <Text style={styles.mapOverlayText}>{hasLocation ? "Location selected ✅" : "Tap / drag pin to choose location"}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.pill, hasLocation ? styles.pillOk : styles.pillBad]}>
            <Text style={[styles.pillText, hasLocation ? styles.pillTextOk : styles.pillTextBad]}>
              {hasLocation ? "Location is set." : "Location required."}
            </Text>
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
  },
  icon: { marginRight: 10, fontSize: 16 },
  input: { flex: 1, fontWeight: "900", color: "#0F172A" },
  xBtn: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2FF" },
  xTxt: { fontSize: 22, lineHeight: 22, fontWeight: "900", color: "#0F172A" },

  dropdown: {
    marginTop: 10,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  dropdownLoading: { padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  dropdownLoadingText: { fontWeight: "900", color: "#64748B" },

  row: { padding: 12, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  main: { fontWeight: "900", color: "#0F172A" },
  secondary: { marginTop: 3, fontWeight: "800", color: "#64748B", fontSize: 12 },
  arrow: { fontSize: 22, fontWeight: "900", color: "#94A3B8" },

  inlineLoading: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  inlineLoadingText: { fontWeight: "900", color: "#64748B" },

  mapWrap: {
    marginTop: 12,
    height: 220,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  map: { flex: 1 },
  mapSkeleton: { ...StyleSheet.absoluteFillObject, padding: 10, zIndex: 2 },

  mapOverlay: { position: "absolute", bottom: 10, left: 10, right: 10, alignItems: "center" },
  mapOverlayPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.92)" },
  mapOverlayText: { fontWeight: "900", color: "#0F172A" },

  pill: { marginTop: 12, padding: 12, borderRadius: 18, borderWidth: 1 },
  pillOk: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  pillBad: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  pillText: { fontWeight: "900" },
  pillTextOk: { color: "#065F46" },
  pillTextBad: { color: "#991B1B" },

  mapFallback: { padding: 12, borderRadius: 18, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  mapFallbackTitle: { fontWeight: "900", color: "#991B1B" },
  mapFallbackBody: { marginTop: 6, fontWeight: "900", color: "#7F1D1D" },
});
