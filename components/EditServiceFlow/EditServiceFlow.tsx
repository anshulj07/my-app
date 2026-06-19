import React, { useState, useEffect, useMemo } from "react";
import {
  Modal, View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Pressable, Image, StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { styles } from "./EditServiceFlow.styles";
import { apiFetch } from "../../lib/apiFetch";
import { generateReactNativeHelpers } from "@uploadthing/expo";
import { fetchAutocomplete, fetchPlaceDetails } from "../AddEventModal/google/places";
import { buildLocationFromAddressComponents } from "../AddEventModal/location/buildLocation";
import { WebView } from "react-native-webview";
import { makeGoogleMapHtml } from "../AddEventModal/map/googleMapHtml";

const GOOGLE_KEY_GLOBAL = (Constants.expoConfig?.extra as any)?.googleMapsKey;

const API_BASE_RAW = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
const UT_ENDPOINT = API_BASE_RAW ? `${API_BASE_RAW.replace(/\/$/, "")}/api/uploadthing` : undefined;

const { useImageUploader } = generateReactNativeHelpers({
  url: UT_ENDPOINT || "http://localhost:3000/api/uploadthing",
});

const COMPANION_TYPES = [
  { id: "food", label: "Food", icon: "🍜" },
  { id: "tour", label: "City Tour", icon: "🗺️" },
  { id: "activity", label: "Activity", icon: "🎯" },
  { id: "hangout", label: "Hangout", icon: "💬" },
];

const MIN_DURATIONS = ["1 hr", "2 hr", "3 hr", "4 hr", "Half Day", "Full Day"];

interface Props {
  visible: boolean;
  service: any;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditServiceFlow({ visible, service, onClose, onUpdated }: Props) {
  const { userId } = useAuth();
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey;

  // -- STATE --
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [rateType, setRateType] = useState<"hour" | "day">("hour");
  const [rate, setRate] = useState("");
  const [schedule, setSchedule] = useState<any[]>([]);
  const [minDuration, setMinDuration] = useState("1 hr");
  const [meetupStyle, setMeetupStyle] = useState<string>("my_area");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Location State
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<{ lat: number, lng: number, address: string, city: string } | null>(null);
  const [locationPayload, setLocationPayload] = useState<any>(null);
  const [isLocLoading, setIsLocLoading] = useState(false);
  const [showLocSearch, setShowLocSearch] = useState(false);

  // Time Edit Modal
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isStartMode, setIsStartMode] = useState(true);

  const serviceId = useMemo(() => {
    if (!service) return "";
    return String(
      service._id?.$oid || service._id?.oid || service._id || service.id || service.eventId || ""
    );
  }, [service]);

  const { openImagePicker, isUploading } = useImageUploader("bannerImage", {
    headers: {
      ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      "ngrok-skip-browser-warning": "1",
    },
    onUploadBegin(fileName) { console.log("🟦 [Edit][banner] Upload begin:", fileName); },
    onClientUploadComplete(res) {
      console.log("🟩 [Edit][banner] Upload complete:", res);
      if (Array.isArray(res) && res.length > 0) setBannerUri(res[0].url);
    },
    onUploadError(e) { 
      console.log("🟥 [Edit][banner] Upload error:", e);
      Alert.alert("Upload Failed", e.message); 
    },
  });

  const handlePick = async (source: "camera" | "gallery") => {
    await openImagePicker({
      source: source === "camera" ? "camera" : "library",
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 9],
    });
    setOverlayVisible(false);
  };

  const searchLocation = async (text: string) => {
    setLocationQuery(text);
    if (text.length < 3 || !GOOGLE_KEY_GLOBAL) {
      setLocationSuggestions([]);
      return;
    }
    fetchAutocomplete({
      key: GOOGLE_KEY_GLOBAL,
      q: text,
      setLoading: () => {},
      setList: setLocationSuggestions,
      setErr: () => {}
    });
  };

  const handlePickLocation = async (item: any) => {
    if (!GOOGLE_KEY_GLOBAL) return;
    setIsLocLoading(true);
    setLocationSuggestions([]);
    try {
      const details = await fetchPlaceDetails(GOOGLE_KEY_GLOBAL, item.id);
      if (details?.latLng) {
        const loc = buildLocationFromAddressComponents({
          lat: details.latLng.lat,
          lng: details.latLng.lng,
          formattedAddress: details.formattedAddress || item.main,
          placeId: item.id,
          components: details.addressComponents || [],
          source: "places_autocomplete"
        });
        setSelectedLoc({
          lat: details.latLng.lat,
          lng: details.latLng.lng,
          address: details.formattedAddress || item.main,
          city: loc?.city || ""
        });
        setLocationPayload({ ...loc, placeId: item.id, source: "places_autocomplete" });
        setLocationQuery(details.formattedAddress || item.main);
        setShowLocSearch(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLocLoading(false);
    }
  };

  // -- INIT --
  useEffect(() => {
    if (visible && service) {
      setHeadline(service.title || "");
      setAbout(service.description || "");
      setRateType(service.rateType || "hour");
      setRate(String(service.priceCents ? service.priceCents / 100 : ""));
      setStatus(service.status || "active");
      setBannerUri(service.bannerUri || service.bannerImage || service.imageUrl || service.coverImage || service.image || null);
      
      const loc = service.location || {};
      setSelectedLoc({
        lat: loc.lat || 0,
        lng: loc.lng || 0,
        address: loc.formattedAddress || "",
        city: loc.city || ""
      });
      setLocationPayload(loc);
      setLocationQuery(loc.formattedAddress || "");

      const meta = service.serviceMetadata || {};
      setMinDuration(meta.minDuration || "1 hr");
      setMeetupStyle(meta.meetupStyle || "my_area");
      setSchedule(meta.schedule || [
        { day: "Mon", active: true, start: "09:00", end: "21:00" },
        { day: "Tue", active: true, start: "09:00", end: "21:00" },
        { day: "Wed", active: false, start: "09:00", end: "21:00" },
        { day: "Thu", active: true, start: "09:00", end: "21:00" },
        { day: "Fri", active: true, start: "09:00", end: "21:00" },
        { day: "Sat", active: true, start: "10:00", end: "18:00" },
        { day: "Sun", active: false, start: "09:00", end: "21:00" },
      ]);

      // Map tags back to types
      const tags = Array.isArray(service.tags) ? service.tags : [];
      setSelectedTypes(COMPANION_TYPES.filter(t => tags.includes(t.label)).map(t => t.id));
    }
  }, [visible, service]);

  const toggleType = (id: string) => {
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!userId || !serviceId) return;

    const price = Math.round(Number(rate) * 100);
    if (!price || price <= 0) {
      Alert.alert("Invalid Rate", "Please enter a valid rate greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        _id: serviceId,
        eventId: serviceId, // compat
        creatorClerkId: userId,
        title: headline.trim(),
        description: about.trim(),
        kind: "service",
        priceCents: price,
        rateType: rateType,
        bannerUri: bannerUri || "",
        tags: COMPANION_TYPES.filter(t => selectedTypes.includes(t.id)).map(t => t.label),
        serviceMetadata: {
          schedule,
          minDuration,
          meetupStyle,
        },
        location: locationPayload
      };

      const res = await apiFetch(`${API_BASE}/api/events/update-event`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Update failed");
      onUpdated();
    } catch (e) {
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async () => {
    const nextStatus = status === "active" ? "paused" : "active";
    // Optimistic UI
    const prevStatus = status;
    setStatus(nextStatus);
    try {
      const r = await apiFetch(`${API_BASE}/api/events/toggle-service`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
        body: JSON.stringify({ _id: serviceId, creatorClerkId: userId, enabled: nextStatus === "active" }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setStatus(prevStatus);
      Alert.alert("Error", "Failed to update status.");
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Service?", "This will permanently remove your listing from the map.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Permanently", style: "destructive", onPress: async () => {
        try {
          const r = await apiFetch(`${API_BASE}/api/events/delete-event`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
            body: JSON.stringify({ eventId: serviceId, creatorClerkId: userId })
          });
          if (r.ok) onUpdated();
          else throw new Error();
        } catch {
          Alert.alert("Error", "Failed to delete.");
        }
      }}
    ]);
  };

  const renderSchedule = () => (
    <View>
      {schedule.map((day, idx) => (
        <View key={day.day} style={styles.dayRow}>
          <View style={styles.dayLeftBound}>
            <TouchableOpacity onPress={() => {
              const next = [...schedule];
              next[idx].active = !next[idx].active;
              setSchedule(next);
            }}>
              <View style={[styles.dayDot, day.active && styles.dayDotActive]} />
            </TouchableOpacity>
            <Text style={styles.dayName}>{day.day}</Text>
          </View>
          
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {day.active ? (
              <>
                <Text style={styles.dayTime}>{day.start} – {day.end}</Text>
                <TouchableOpacity style={styles.dayEditBtn} onPress={() => { setEditingDayIndex(idx); setShowTimePicker(true); }}>
                  <Ionicons name="pencil" size={14} color="#6C5CE7" />
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.dayUnavailable}>Unavailable</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.full}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Service</Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* COVER PHOTO */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cover Photo</Text>
              <View style={[styles.bannerZone, bannerUri ? styles.bannerZoneHasImage : {}]}>
                {isUploading ? (
                  <View style={styles.bannerPlaceholder}>
                    <ActivityIndicator size="large" color="#6C5CE7" />
                    <Text style={styles.bannerPlaceholderTitle}>Uploading…</Text>
                  </View>
                ) : bannerUri ? (
                  <>
                    <Image source={{ uri: bannerUri }} style={{ width: "100%", height: "100%", borderRadius: 12 }} resizeMode="cover" />
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setOverlayVisible(v => !v)} />
                    {overlayVisible && (
                      <View style={styles.bannerOverlay}>
                        <Pressable style={styles.bannerOverlayBtn} onPress={() => handlePick("gallery")}>
                          <Ionicons name="image-outline" size={16} color="#fff" />
                          <Text style={styles.bannerOverlayBtnText}>Change</Text>
                        </Pressable>
                        <Pressable style={[styles.bannerOverlayBtn, styles.bannerOverlayBtnDanger]}
                          onPress={() => { setBannerUri(null); setOverlayVisible(false); }}>
                          <Ionicons name="trash-outline" size={16} color="#fff" />
                          <Text style={styles.bannerOverlayBtnText}>Remove</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                ) : (
                  <TouchableOpacity style={styles.bannerPlaceholder} onPress={() => handlePick("gallery")}>
                    <Ionicons name="image-outline" size={32} color="#6C5CE7" />
                    <Text style={styles.bannerPlaceholderTitle}>Add a cover photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* COMPANION TYPE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Companion Type</Text>
              <View style={styles.typeGrid}>
                {COMPANION_TYPES.map(t => (
                  <TouchableOpacity 
                    key={t.id} 
                    onPress={() => toggleType(t.id)}
                    style={[styles.typeTag, selectedTypes.includes(t.id) && styles.typeTagSelected]}
                  >
                    <Text>{t.icon}</Text>
                    <Text style={[styles.typeLabel, selectedTypes.includes(t.id) && styles.typeLabelSelected]}>{t.label}</Text>
                    {selectedTypes.includes(t.id) && <Ionicons name="checkmark" size={12} color="#6C5CE7" />}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.inputHint, { textAlign: "left", marginTop: 12 }]}>tap to add/remove</Text>
            </View>

            <View style={styles.divider} />

            {/* HEADLINE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Headline</Text>
              <View style={styles.headlineInputWrap}>
                <TextInput 
                  value={headline}
                  onChangeText={setHeadline}
                  maxLength={50}
                  placeholder="e.g. Bhopal ka yaar — chai aur ghumne wala!"
                  style={styles.headlineInput}
                />
              </View>
              <Text style={styles.inputHint}>Make it obvious and clickable.</Text>
            </View>

            <View style={styles.divider} />

            {/* ABOUT */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About · Optional</Text>
              <TextInput 
                value={about}
                onChangeText={setAbout}
                multiline
                placeholder="I have lived in Bhopal for 5 years..."
                style={styles.aboutInput}
              />
            </View>

            <View style={styles.divider} />

            {/* RATE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rate</Text>
              <View style={styles.rateRow}>
                <TouchableOpacity 
                  onPress={() => setRateType("hour")}
                  style={[styles.rateToggle, rateType === "hour" && styles.rateToggleActive]}
                >
                  <View style={[styles.rateToggleCircle, rateType === "hour" && styles.rateToggleCircleActive]} />
                  <Text style={[styles.rateToggleLabel, rateType === "hour" && styles.rateToggleLabelActive]}>Per Hour</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setRateType("day")}
                  style={[styles.rateToggle, rateType === "day" && styles.rateToggleActive]}
                >
                  <View style={[styles.rateToggleCircle, rateType === "day" && styles.rateToggleCircleActive]} />
                  <Text style={[styles.rateToggleLabel, rateType === "day" && styles.rateToggleLabelActive]}>Per Day</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceSymbol}>₹</Text>
                <TextInput 
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                  placeholder="0"
                  style={styles.priceInput}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* AVAILABILITY */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Availability</Text>
              {renderSchedule()}
            </View>

            <View style={styles.divider} />

            {/* MIN DURATION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Min Duration</Text>
              <View style={styles.durationGrid}>
                {MIN_DURATIONS.map(dur => (
                  <TouchableOpacity 
                    key={dur} 
                    onPress={() => setMinDuration(dur)}
                    style={[styles.durChip, minDuration === dur && styles.durChipActive]}
                  >
                    <Text style={[styles.durText, minDuration === dur && styles.durTextActive]}>{dur}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* MEETING STYLE */}
            <View style={styles.section}>
              <Text style={S.sectionHeader}>Meeting Style</Text>
              {[
                { id: "my_area", label: "My Area" },
                { id: "go_to_guest", label: "I Go to Guest" },
                { id: "decide_on_chat", label: "We Decide on Chat" }
              ].map(item => (
                <TouchableOpacity key={item.id} style={styles.styleBtn} onPress={() => setMeetupStyle(item.id)}>
                  <View style={[styles.styleRadio, meetupStyle === item.id && styles.styleRadioActive]}>
                    {meetupStyle === item.id && <View style={styles.styleRadioInner} />}
                  </View>
                  <Text style={[styles.styleLabel, meetupStyle === item.id && styles.styleLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.locRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                  <Ionicons name="location" size={16} color="#6C5CE7" />
                  <Text style={styles.locText} numberOfLines={1}>{selectedLoc?.address?.split(",")[0] || "Select Location"}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowLocSearch(true)}>
                  <Text style={styles.locChange}>Change location</Text>
                </TouchableOpacity>
              </View>

              {showLocSearch && (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.headlineInputWrap}>
                    <TextInput
                      placeholder="Search city or area..."
                      value={locationQuery}
                      onChangeText={searchLocation}
                      style={[styles.headlineInput, { textAlign: "left", fontSize: 14 }]}
                    />
                    {isLocLoading && <ActivityIndicator size="small" color="#6C5CE7" style={{ position: "absolute", right: 16, top: 16 }} />}
                  </View>
                  
                  {locationSuggestions.length > 0 && (
                    <View style={{ backgroundColor: "#fff", borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" }}>
                      {locationSuggestions.map((item, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          onPress={() => handlePickLocation(item)}
                          style={{ padding: 14, borderBottomWidth: idx === locationSuggestions.length - 1 ? 0 : 1, borderBottomColor: "#F1F5F9" }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "600", color: "#0F172A" }}>{item.main}</Text>
                          <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{item.sub}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* DANGER ZONE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Danger Zone</Text>
              <View style={styles.dangerBanner}>
                <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
                  <Text style={{ fontSize: 18 }}>{status === "active" ? "🔴" : "🟢"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dangerTitle}>{status === "active" ? "Pause Service" : "Resume Service"}</Text>
                    <Text style={styles.dangerSub}>
                      {status === "active" ? "Temporarily hide from map" : "Show back on the map"}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={styles.deleteText}>Delete Service</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.saveBtnText}>Save Changes</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* TIME PICKER MODAL */}
        <Modal visible={showTimePicker} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: "900" }}>{editingDayIndex !== null ? schedule[editingDayIndex].day : ""} Hours</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 16 }}>
                <TouchableOpacity onPress={() => setIsStartMode(true)} style={{ flex: 1, padding: 16, backgroundColor: isStartMode ? "#F5F3FF" : "#F7F9FC", borderRadius: 12, borderWidth: 1, borderColor: isStartMode ? "#6C5CE7" : "transparent" }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8" }}>START</Text>
                  <Text style={{ fontSize: 20, fontWeight: "800" }}>{editingDayIndex !== null ? schedule[editingDayIndex].start : ""}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsStartMode(false)} style={{ flex: 1, padding: 16, backgroundColor: !isStartMode ? "#F5F3FF" : "#F7F9FC", borderRadius: 12, borderWidth: 1, borderColor: !isStartMode ? "#6C5CE7" : "transparent" }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8" }}>END</Text>
                  <Text style={{ fontSize: 20, fontWeight: "800" }}>{editingDayIndex !== null ? schedule[editingDayIndex].end : ""}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 20 }}>
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => {
                    if (date && editingDayIndex !== null) {
                      const timeStr = date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0");
                      const next = [...schedule];
                      if (isStartMode) next[editingDayIndex].start = timeStr;
                      else next[editingDayIndex].end = timeStr;
                      setSchedule(next);
                      if (Platform.OS !== "ios") setShowTimePicker(false);
                    } else if (Platform.OS !== "ios") {
                      setShowTimePicker(false);
                    }
                  }}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, { marginTop: 24 }]} 
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.saveBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  sectionHeader: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
});
