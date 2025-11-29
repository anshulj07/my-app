// components/AddEventModal.tsx
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

/** The parent expects: onCreate({ title, lat, lng, emoji }) */
type CreateEvent = { title: string; lat: number; lng: number; emoji: string };
type Suggestion = { id: string; main: string; secondary?: string };

type Option = { label: string; value: string };

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

  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;
  const H = Dimensions.get("window").height;

  // Form
  const [title, setTitle] = useState("");
  const emoji = textToEmoji(title);

  const [dateISO, setDateISO] = useState(""); // YYYY-MM-DD
  const [time24, setTime24] = useState(""); // HH:MM

  // Places autocomplete
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  // Map selection
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // open/close
  useEffect(() => {
    if (visible) sheetRef.current?.open();
    else sheetRef.current?.close();
  }, [visible]);

  const hardReset = () => {
    setTitle("");
    setDateISO("");
    setTime24("");
    setQuery("");
    setSuggestions([]);
    setSelectedAddress("");
    setCoord(null);
    setErr(null);
    setSubmitting(false);
    setMapReady(false);
  };

  // reset on close
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
      const label = d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      out.push({ label, value: iso });
    }
    return out;
  }, []);

  const timeOptions: Option[] = useMemo(() => {
    const out: Option[] = [{ label: "No time", value: "" }];
    const start = 6 * 60; // 06:00
    const end = 23 * 60; // 23:00
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
      fetchAutocomplete(GOOGLE_KEY, query, setLoadingSug, setSuggestions, setErr);
    }, 250);
    return () => clearTimeout(t);
  }, [query, GOOGLE_KEY]);

  // when coord changes, update map marker
  useEffect(() => {
    if (!mapReady || !coord) return;
    mapRef.current?.postMessage(
      JSON.stringify({ type: "setMarker", lat: coord.lat, lng: coord.lng })
    );
  }, [coord, mapReady]);

  const canCreate = !!GOOGLE_KEY && !!title.trim() && !!coord && !submitting;

  const handlePickSuggestion = async (s: Suggestion) => {
    if (!GOOGLE_KEY) return;
    Keyboard.dismiss();
    setErr(null);
    setLoadingSug(true);
    try {
      const details = await fetchPlaceDetails(GOOGLE_KEY, s.id);
      if (!details?.latLng) {
        setErr("Couldn’t get coordinates for that place. Try another search.");
        return;
      }
      setCoord(details.latLng);
      const addr = details.display || [s.main, s.secondary].filter(Boolean).join(", ");
      setSelectedAddress(addr);
      setQuery(addr);
      setSuggestions([]); // dropdown closes
    } catch {
      setErr("Something went wrong while selecting that place.");
    } finally {
      setLoadingSug(false);
    }
  };

  const handleCreate = () => {
    if (!coord) return;
    setSubmitting(true);
    setErr(null);
    try {
      onCreate({
        title: buildTitle(title.trim(), dateISO.trim(), time24.trim()),
        lat: coord.lat,
        lng: coord.lng,
        emoji,
      });
      sheetRef.current?.close();
      // onClosed will reset + call onClose
    } catch {
      setErr("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const mapHtml = useMemo(() => makeGoogleMapHtml(GOOGLE_KEY, coord), [GOOGLE_KEY]);

  return (
    <Modalize
      ref={sheetRef}
      onClosed={handleFullClose}
      modalHeight={Math.min(740, Math.max(560, H * 0.86))}
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      overlayStyle={styles.overlay}
      keyboardAvoidingBehavior={Platform.select({ ios: "padding", android: "height" })}
      scrollViewProps={{ keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Create an event</Text>
          <Text style={styles.headerSub}>Title • When • Where</Text>
        </View>

        <Pressable
          onPress={() => {
            hardReset();
            sheetRef.current?.close();
          }}
          hitSlop={16}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Title */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Title</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inlineEmoji}>{emoji}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Morning run, Coffee meetup"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Date & time dropdowns */}
        <View style={[styles.card, { paddingBottom: 14 }]}>
          <Text style={styles.cardTitle}>When</Text>
          <View style={styles.twoCol}>
            <Dropdown label="Date" valueLabel={dateLabel} options={dateOptions} onSelect={setDateISO} />
            <Dropdown label="Time" valueLabel={timeLabel} options={timeOptions} onSelect={setTime24} />
          </View>
        </View>

        {/* Location: input + dropdown + map */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Where</Text>

          <View style={styles.locationInputWrap}>
            <Text style={styles.locationIcon}>📍</Text>
            <TextInput
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setSelectedAddress("");
                // don’t clear coord immediately: user may just edit a char
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
                  setErr(null);
                }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>×</Text>
              </Pressable>
            )}
          </View>

          {/* Suggestions dropdown */}
          {(loadingSug || suggestions.length > 0) && (
            <View style={styles.dropdown}>
              {loadingSug ? (
                <View style={styles.dropdownLoading}>
                  <ActivityIndicator />
                  <Text style={styles.dropdownLoadingText}>Searching…</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 210 }} keyboardShouldPersistTaps="handled">
                  {suggestions.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.85}
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

          {!!selectedAddress && (
            <View style={styles.selectedPill}>
              <Text numberOfLines={1} style={styles.selectedPillText}>
                {selectedAddress}
              </Text>
            </View>
          )}

          {/* Map */}
          <View style={styles.mapWrap}>
            {!GOOGLE_KEY ? (
              <View style={styles.mapFallback}>
                <Text style={styles.mapFallbackTitle}>Google Maps key missing</Text>
                <Text style={styles.mapFallbackBody}>
                  Add <Text style={{ fontWeight: "800" }}>extra.googleMapsKey</Text> in app config to use the map +
                  autocomplete.
                </Text>
              </View>
            ) : (
              <WebView
                ref={mapRef}
                style={styles.map}
                originWhitelist={["*"]}
                javaScriptEnabled
                domStorageEnabled
                source={{ html: mapHtml, baseUrl: "https://localhost" }}
                onMessage={(e) => {
                  try {
                    const msg = JSON.parse(e.nativeEvent.data);
                    if (msg?.type === "ready") setMapReady(true);
                    if (msg?.type === "picked" && typeof msg.lat === "number" && typeof msg.lng === "number") {
                      setCoord({ lat: msg.lat, lng: msg.lng });
                      setSelectedAddress("Dropped pin");
                      setSuggestions([]);
                      setErr(null);
                    }
                  } catch {
                    // ignore
                  }
                }}
              />
            )}
          </View>

          <Text style={styles.mapHint}>Tip: tap on the map to drop a pin.</Text>

          {!!err && <Text style={styles.err}>{err}</Text>}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              hardReset();
              sheetRef.current?.close();
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, !canCreate && { opacity: 0.5 }]}
            onPress={handleCreate}
            activeOpacity={0.92}
            disabled={!canCreate}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Create Event</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modalize>
  );
}

/* ---------------- dropdown ---------------- */

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

async function fetchAutocomplete(
  key: string,
  q: string,
  setLoading: (b: boolean) => void,
  setList: (v: Suggestion[]) => void,
  setErr: (m: string | null) => void
) {
  try {
    setLoading(true);
    setErr(null);
    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(q)}` +
      `&types=geocode&components=country:us&key=${key}`;
    const res = await fetch(url);
    const json = await res.json();
    const preds = Array.isArray(json?.predictions) ? json.predictions : [];
    setList(
      preds.map((p: any) => ({
        id: p.place_id,
        main: p.structured_formatting?.main_text ?? p.description,
        secondary: p.structured_formatting?.secondary_text,
      }))
    );
  } catch {
    setErr("Couldn’t fetch suggestions. Check your network.");
  } finally {
    setLoading(false);
  }
}

async function fetchPlaceDetails(key: string, placeId: string): Promise<{
  latLng: { lat: number; lng: number } | null;
  display?: string;
} | null> {
  const u =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}&fields=geometry,formatted_address,name&key=${key}`;
  const res = await fetch(u);
  const json = await res.json();
  const loc = json?.result?.geometry?.location;
  const lat = loc?.lat;
  const lng = loc?.lng;
  const display = json?.result?.formatted_address || json?.result?.name;
  if (typeof lat === "number" && typeof lng === "number") {
    return { latLng: { lat, lng }, display };
  }
  return { latLng: null, display };
}

function buildTitle(t: string, d?: string, tm?: string) {
  const parts = [t];
  if (d) parts.push(d);
  if (tm) parts.push(tm);
  return parts.join(" · ");
}

function formatTime12h(hh: number, mm: number) {
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function textToEmoji(t: string): string {
  const s = t.toLowerCase();
  if (/(run|jog|sprint)/.test(s)) return "🏃‍♂️";
  if (/(walk|stroll)/.test(s)) return "🚶‍♂️";
  if (/(gym|workout|lift|barbell)/.test(s)) return "🏋️‍♀️";
  if (/(coffee|cafe|espresso|latte)/.test(s)) return "☕️";
  if (/(drink|beer|pub)/.test(s)) return "🍺";
  if (/(eat|food|pizza|lunch|dinner|bites)/.test(s)) return "🍕";
  if (/(study|learn|read)/.test(s)) return "📚";
  if (/(party|club|dance)/.test(s)) return "🎉";
  if (/(sleep|nap)/.test(s)) return "🌙";
  if (/(yoga|meditate|stretch)/.test(s)) return "🧘‍♀️";
  if (/(park|picnic)/.test(s)) return "🌳";
  return "📍";
}

function makeGoogleMapHtml(
  key?: string,
  initial?: { lat: number; lng: number } | null
) {
  const center = initial ?? { lat: 40.7128, lng: -74.006 }; // default NYC-ish
  // NOTE: Using Google Maps JS in a WebView.
  // Enable: Maps JavaScript API. (Places API already used above for autocomplete/details.)
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; background: #0b1220; }
    #map { height: 100%; width: 100%; border-radius: 16px; overflow: hidden; }
    .gm-style .gm-style-iw-c { border-radius: 12px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      var map, marker;

      function post(msg){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }

      function init() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: { lat: ${center.lat}, lng: ${center.lng} },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });

        marker = new google.maps.Marker({
          position: { lat: ${center.lat}, lng: ${center.lng} },
          map: map,
          draggable: true
        });

        google.maps.event.addListener(map, 'click', function(e) {
          var p = e.latLng;
          marker.setPosition(p);
          post({ type: 'picked', lat: p.lat(), lng: p.lng() });
        });

        google.maps.event.addListener(marker, 'dragend', function(e) {
          var p = e.latLng;
          post({ type: 'picked', lat: p.lat(), lng: p.lng() });
        });

        window.document.addEventListener('message', onMsg);
        window.addEventListener('message', onMsg);

        post({ type: 'ready' });
      }

      function onMsg(ev) {
        try {
          var data = JSON.parse(ev.data);
          if (data.type === 'setMarker') {
            var p = { lat: data.lat, lng: data.lng };
            marker.setPosition(p);
            map.panTo(p);
            map.setZoom(15);
          }
        } catch(e) {}
      }

      window.initMap = init;
    })();
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${key ?? ""}&v=weekly&callback=initMap"></script>
</body>
</html>`;
}

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  overlay: { backgroundColor: "rgba(2,6,23,0.35)" },

  modal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0B1220",
    overflow: "hidden",
  },
  handle: {
    width: 56,
    height: 5,
    backgroundColor: "rgba(148,163,184,0.35)",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "rgba(56,189,248,0.18)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: { fontSize: 22 },
  headerTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 18 },
  headerSub: { color: "rgba(226,232,240,0.7)", marginTop: 2, fontSize: 12 },
  closeBtn: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(148,163,184,0.12)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#E2E8F0", fontSize: 22, lineHeight: 22, fontWeight: "900" },

  body: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  cardTitle: { fontWeight: "900", color: "#0F172A", marginBottom: 10, fontSize: 14 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  inlineEmoji: { fontSize: 18 },
  textInput: { flex: 1, color: "#0F172A", fontSize: 15, paddingVertical: 0 },

  twoCol: { flexDirection: "row", gap: 12 },

  smallLabel: { fontWeight: "800", color: "#0F172A", marginBottom: 8, fontSize: 12 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: { color: "#0F172A", fontWeight: "800" },
  chev: { color: "#64748B", fontWeight: "900" },

  locationInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  locationIcon: { fontSize: 16 },
  locationInput: { flex: 1, color: "#0F172A", fontSize: 15, paddingVertical: 0 },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "rgba(100,116,139,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: { color: "#334155", fontSize: 18, fontWeight: "900", lineHeight: 18 },

  dropdown: {
    marginTop: 10,
    borderRadius: 14,
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
  dropdownMain: { color: "#0F172A", fontWeight: "900", fontSize: 14 },
  dropdownSecondary: { color: "#64748B", marginTop: 2, fontSize: 12, fontWeight: "600" },
  dropdownArrow: { color: "#94A3B8", fontSize: 18, fontWeight: "900", marginLeft: 10 },

  selectedPill: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
    maxWidth: "100%",
  },
  selectedPillText: { color: "#166534", fontWeight: "900", fontSize: 12 },

  mapWrap: {
    marginTop: 12,
    height: 190,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#0B1220",
  },
  map: { flex: 1, backgroundColor: "#0B1220" },
  mapFallback: { flex: 1, padding: 16, justifyContent: "center" },
  mapFallbackTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 14 },
  mapFallbackBody: { color: "rgba(226,232,240,0.75)", marginTop: 8, lineHeight: 18 },

  mapHint: { marginTop: 10, color: "#64748B", fontSize: 12, fontWeight: "700" },

  err: { marginTop: 10, color: "#DC2626", fontWeight: "800" },

  actions: { flexDirection: "row", gap: 12, marginTop: 2 },
  secondaryBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryText: { color: "#0F172A", fontWeight: "900" },
  primaryBtn: {
    flex: 1.4,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A84FF",
    shadowColor: "#0A84FF",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  primaryText: { color: "#FFFFFF", fontWeight: "900" },

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
  optionTitle: { padding: 14, fontWeight: "900", color: "#0F172A", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  optionRow: { paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E8F0" },
  optionText: { color: "#0F172A", fontWeight: "800" },
});
