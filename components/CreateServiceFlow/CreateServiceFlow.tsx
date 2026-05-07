import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Animated,
  TextInput,
  Image,
  Alert,
  Share,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser, useAuth } from "@clerk/clerk-expo";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import { apiFetch } from "../../lib/apiFetch";
import { fetchAutocomplete, fetchPlaceDetails } from "../AddEventModal/google/places";
import { reverseGeocode } from "../AddEventModal/google/geocode";
import { buildLocationFromAddressComponents } from "../AddEventModal/location/buildLocation";
import { makeGoogleMapHtml } from "../AddEventModal/map/googleMapHtml";
import { styles, C } from "./CreateServiceFlow.styles";
import { generateReactNativeHelpers } from "@uploadthing/expo";

const API_BASE_RAW = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
const UT_ENDPOINT = API_BASE_RAW ? `${API_BASE_RAW.replace(/\/$/, "")}/api/uploadthing` : undefined;

const { useImageUploader } = generateReactNativeHelpers({
  url: UT_ENDPOINT || "http://localhost:3000/api/uploadthing",
});

interface CompanionType {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

const COMPANION_TYPES: CompanionType[] = [
  {
    id: "show_around",
    title: "Show Around City",
    subtitle: "Experience the city through a local's eyes",
    icon: "🗺️",
  },
  {
    id: "food_buddy",
    title: "Food & Café Buddy",
    subtitle: "Explore the best local dining and cafe culture",
    icon: "🍜",
  },
  {
    id: "activity_partner",
    title: "Activity Partner",
    subtitle: "Trek, gym, sports, games",
    icon: "🎯",
  },
  {
    id: "hangout",
    title: "Just Hang Out",
    subtitle: "Chill, talk, timepass no agenda",
    icon: "💬",
  },
];

interface CreateServiceFlowProps {
  visible: boolean;
  cityName?: string;
  onClose: () => void;
  onBackToPicker: () => void;
  onCreate?: (event: any) => void;
}

function CalendarView({ blockedDates, onToggleDate }: { blockedDates: string[], onToggleDate: (d: string) => void }) {
  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const year = viewDate.getFullYear();

  const daysInMonth = new Date(year, viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(year, viewDate.getMonth(), 1).getDay(); // 0 is Sun

  const days = [];
  // Adjusted firstDay for Mon-start (M=0...S=6)
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isToday = (d: number) => {
    return now.getDate() === d && now.getMonth() === viewDate.getMonth() && now.getFullYear() === viewDate.getFullYear();
  };

  const isBlocked = (d: number) => {
    const iso = new Date(year, viewDate.getMonth(), d).toISOString().split('T')[0];
    return blockedDates.includes(iso);
  };

  const handleToggle = (d: number) => {
    const iso = new Date(year, viewDate.getMonth(), d).toISOString().split('T')[0];
    onToggleDate(iso);
  };

  const nextMonth = () => setViewDate(new Date(year, viewDate.getMonth() + 1, 1));
  const prevMonth = () => setViewDate(new Date(year, viewDate.getMonth() - 1, 1));

  return (
    <View>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={prevMonth}><Ionicons name="chevron-back" size={20} color={C.text} /></TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName} {year}</Text>
        <TouchableOpacity onPress={nextMonth}><Ionicons name="chevron-forward" size={20} color={C.text} /></TouchableOpacity>
      </View>

      <View style={styles.weekDaysRow}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={styles.weekDayLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((d, i) => {
          if (d === null) return <View key={`empty-${i}`} style={styles.dayCell} />;
          const blocked = isBlocked(d);
          const today = isToday(d);
          return (
            <TouchableOpacity
              key={d}
              onPress={() => handleToggle(d)}
              style={[
                styles.dayCell,
                today && styles.dayCellToday,
                blocked && styles.dayCellBlocked
              ]}
            >
              <Text style={[styles.dayCellText, blocked && styles.dayTextBlocked]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Custom Animated Floating Label Input
function FloatingLabelInput({ label, value, onChangeText, placeholder, error, multiline, ...props }: any) {
  const [isFocused, setIsFocused] = React.useState(false);
  const animatedValue = React.useRef(new Animated.Value(value.length > 0 ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -12], // More reliable offset
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    fontWeight: (isFocused || value.length > 0 ? '700' : '500') as any,
  };

  const isFilled = value.length > 0;
  const showPlaceholder = isFocused; // Only show placeholder when focused to avoid overlap

  return (
    <View style={styles.floatingContainer}>
      <View style={[
        styles.inputBox,
        isFocused && styles.inputBoxFocused,
        isFilled && !isFocused && !error && styles.inputBoxFilled,
        error && styles.inputBoxError
      ]}>
        <Animated.Text 
          pointerEvents="none"
          style={[
            styles.labelBase,
            labelStyle,
            isFocused && { color: C.purple },
            (isFocused || isFilled) && { backgroundColor: C.white, paddingHorizontal: 6, left: 16 },
            isFilled && !isFocused && !error && styles.labelFloatingFilled,
            error && styles.labelFloatingError
        ]}>
          {label}
        </Animated.Text>
        <TextInput
          {...props}
          style={[
            styles.textInputFloating, 
            multiline && { minHeight: 100, textAlignVertical: 'top' }
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={showPlaceholder ? placeholder : ""}
          placeholderTextColor="#BBB"
          multiline={multiline}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// Success View Component
function SuccessView({ selectedLoc, cityName, rate, user, onShare, onClose, bannerUri }: any) {
  return (
    <View style={styles.successContainer}>
      <View style={styles.successIconBox}>
        <View style={styles.successIconGlow} />
        <Ionicons name="checkmark" size={48} color={C.white} />
      </View>

      <Text style={styles.successTitle}>You're Live! 🎉</Text>
      <Text style={styles.successSub}>
        Your companion profile is now visible to everyone in {selectedLoc?.city || cityName}.
      </Text>

      <View style={styles.successCardPreview}>
        <Text style={styles.successPreviewLabel}>YOUR NEW CARD</Text>
        <View style={styles.miniCard}>
          {bannerUri ? (
            <View style={{ height: 120, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
               <Image source={{ uri: bannerUri }} style={{ width: '100%', height: '100%' }} />
            </View>
          ) : null}
          <View style={styles.previewUserRow}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.previewAvatar} />
            ) : (
              <View style={styles.previewAvatar} />
            )}
            <View>
              <Text style={styles.previewName}>{user?.firstName || "User"}</Text>
              <Text style={styles.previewLocation}>{selectedLoc?.city || cityName} • ₹{rate}/hr</Text>
            </View>
          </View>
          <View style={styles.chipContainer}>
             <View style={styles.chip}>
               <Ionicons name="flash" size={12} color={C.purple} />
               <Text style={styles.chipText}>New Companion</Text>
             </View>
          </View>
        </View>
      </View>

      <View style={styles.successActions}>
        <TouchableOpacity onPress={onShare} style={styles.shareBtnPremium}>
          <Ionicons name="share-social" size={20} color={C.white} />
          <Text style={styles.shareBtnTextPremium}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.doneBtnPremium}>
          <Text style={styles.doneBtnTextPremium}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CreateServiceFlow({
  visible,
  cityName = "Bhopal",
  onClose,
  onBackToPicker,
  onCreate,
}: CreateServiceFlowProps) {
  const { user } = useUser();
  const mapRef = React.useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [chargeMethod, setChargeMethod] = useState<"hour" | "day">("hour");
  const [rate, setRate] = useState("");
  const [bannerUri, setBannerUri] = useState<string | null>(null);

  const [minDuration, setMinDuration] = useState("1 hr");
  const [schedule, setSchedule] = useState([
    { day: "Mon", active: true, start: "09:00", end: "21:00" },
    { day: "Tue", active: true, start: "09:00", end: "21:00" },
    { day: "Wed", active: false, start: "09:00", end: "21:00" },
    { day: "Thu", active: true, start: "09:00", end: "21:00" },
    { day: "Fri", active: true, start: "09:00", end: "21:00" },
    { day: "Sat", active: true, start: "10:00", end: "18:00" },
    { day: "Sun", active: false, start: "09:00", end: "21:00" },
  ]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  // Time Edit Modal State
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [isStartMode, setIsStartMode] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  // Step 5 State
  const [meetupStyle, setMeetupStyle] = useState<"my_area" | "go_to_guest" | "decide_on_chat">("my_area");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<{ lat: number, lng: number, address: string, city: string } | null>(null);
  const [locationPayload, setLocationPayload] = useState<any>(null);
  const [isLocLoading, setIsLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { userId } = useAuth();
  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey;
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey;

  const [isSuccess, setIsSuccess] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  React.useEffect(() => {
    if (!mapReady || !selectedLoc) return;
    mapRef.current?.postMessage(JSON.stringify({ type: "setMarker", lat: selectedLoc.lat, lng: selectedLoc.lng }));
  }, [selectedLoc, mapReady]);

  const { openImagePicker, isUploading } = useImageUploader("bannerImage", {
    headers: {
      ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      "ngrok-skip-browser-warning": "1",
    },
    onUploadBegin(fileName) { console.log("🟦 [UT][banner] Upload begin:", fileName); },
    onClientUploadComplete(res) {
      console.log("🟩 [UT][banner] Upload complete:", res);
      if (Array.isArray(res) && res.length > 0) {
        setBannerUri(res[0].url);
      }
    },
    onUploadError(e) {
      console.log("🟥 [UT][banner] Upload error:", e);
      Alert.alert("Upload Failed", e.message || "Failed to upload banner.");
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

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const progress = useMemo(() => {
    return (step / 6) * 100;
  }, [step]);

  const canContinue = useMemo(() => {
    if (step === 1) return selectedTypes.length > 0;
    if (step === 2) return headline.trim().length > 0;
    if (step === 3) return rate.trim().length > 0 && Number(rate) > 0;
    if (step === 5) return !!selectedLoc && !!meetupStyle && !submitting;
    return true;
  }, [step, selectedTypes, headline, rate, selectedLoc, meetupStyle, submitting]);

  const handleBack = () => {
    if (step === 1) {
      onBackToPicker();
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleFinish = async () => {
    if (!selectedLoc || !locationPayload) return;
    setSubmitting(true);
    try {
      const timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata";
      
      const payload = {
        title: headline.trim(),
        description: about.trim(),
        emoji: COMPANION_TYPES.find(t => selectedTypes.includes(t.id))?.icon || "✨",
        creatorClerkId: userId,
        creatorName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "Companion",
        kind: "service",
        priceCents: Number(rate) * 100,
        rateType: chargeMethod, // "hour" | "day"
        timezone,
        visibility: "public",
        status: "active",
        tags: selectedTypes,
        bannerUri: bannerUri || "",
        // Schedule Info
        serviceMetadata: {
          minDuration,
          schedule,
          blockedDates,
          meetupStyle,
        },
        location: {
          lat: selectedLoc.lat,
          lng: selectedLoc.lng,
          geo: { type: "Point", coordinates: [selectedLoc.lng, selectedLoc.lat] },
          formattedAddress: selectedLoc.address,
          placeId: locationPayload.placeId || "",
          countryCode: locationPayload.countryCode,
          city: selectedLoc.city,
          cityKey: locationPayload.cityKey || "",
          neighborhood: locationPayload.neighborhood || "",
          source: locationPayload.source || "autocomplete",
        }
      };

      const res = await apiFetch(`${API_BASE}/api/events/create-event`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) 
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to create service");
      }

      // Premium Success - Transition directly
      if (onCreate) onCreate(json.event || payload);
      setIsSuccess(true);
    } catch (e: any) {
      Alert.alert("Oops!", e.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickLocation = async (item: any) => {
    if (!GOOGLE_KEY) return;
    setIsLocLoading(true);
    setLocationSuggestions([]);
    try {
      const details = await fetchPlaceDetails(GOOGLE_KEY, item.id);
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLocLoading(false);
    }
  };

  const searchLocation = async (text: string) => {
    setLocationQuery(text);
    if (text.length < 3 || !GOOGLE_KEY) {
      setLocationSuggestions([]);
      return;
    }
    fetchAutocomplete({
      key: GOOGLE_KEY,
      q: text,
      setLoading: () => {},
      setList: setLocationSuggestions,
      setErr: () => {}
    });
  };

  const shareProfile = async () => {
    try {
      await Share.share({
        message: `Hey! I'm now available as a companion on Meetup. Check out my profile: ${headline}`,
        url: 'https://meetup-app.com/profile/' + userId // Placeholder URL
      });
    } catch (e) { console.error(e); }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>What kind of companion are you? 😊</Text>
            <Text style={styles.subtitle}>Pick all that feel like you</Text>

            <View style={styles.optionsList}>
              {COMPANION_TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type.id);
                return (
                  <TouchableOpacity
                    key={type.id}
                    activeOpacity={0.8}
                    onPress={() => toggleType(type.id)}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                  >
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={14} color={C.white} />
                      </View>
                    )}
                    <View style={styles.iconContainer}>
                      <Text style={styles.iconText}>{type.icon}</Text>
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionTitle}>{type.title}</Text>
                      <Text style={styles.optionSub}>{type.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 2:
        const headlineError = showErrors && !headline.trim() ? "Headline is required" : "";

        return (
          <View style={styles.content}>
            <Text style={styles.title}>Describe Your Service</Text>
            <Text style={styles.subtitle}>Help guests understand what makes your company special</Text>

            {/* Info Section */}
            <View style={[styles.hintBox, { backgroundColor: '#F0EEFF', borderColor: '#7C4DFF20', marginBottom: 24 }]}>
              <Ionicons name="information-circle" size={24} color={C.purple} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.hintText, { color: C.purple, fontWeight: '800', marginBottom: 2, fontSize: 13 }]}>
                  HOW IT WORKS
                </Text>
                <Text style={[styles.hintText, { fontSize: 13, color: '#4B5563' }]}>
                  This information will be displayed on your profile card. A good profile gets 3x more bookings!
                </Text>
              </View>
            </View>

            {/* Inputs at Top */}
            <FloatingLabelInput
              label="Service Name / Title"
              value={headline}
              onChangeText={(t: string) => setHeadline(t.slice(0, 60))}
              placeholder='e.g. "Weekend Foodie Tour" or "Local Art Explorer"'
              error={headlineError}
            />

            <View style={[styles.sectionDivider, { marginVertical: 12 }]} />

            <FloatingLabelInput
              label="About Your Service "
              value={about}
              onChangeText={(t: string) => setAbout(t.slice(0, 300))}
              placeholder='Tell guests about your personality, favorite spots, or what they can expect from a meetup with you...'
              multiline
            />

            <View style={[styles.sectionDivider, { marginVertical: 12 }]} />

            {/* Banner Section */}
            <Text style={styles.label}>COVER PHOTO (OPTIONAL)</Text>
            <View style={[styles.bannerZone, bannerUri ? styles.bannerZoneHasImage : {}]}>
              {isUploading ? (
                <View style={styles.bannerPlaceholder}>
                  <ActivityIndicator size="large" color={C.purple} />
                  <Text style={styles.bannerPlaceholderTitle}>Uploading banner…</Text>
                </View>
              ) : bannerUri ? (
                <>
                  <Image source={{ uri: bannerUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
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
                <View style={styles.bannerPlaceholder}>
                  <View style={styles.bannerPlaceholderIcon}>
                    <Ionicons name="image-outline" size={28} color={C.purple} />
                  </View>
                  <Text style={styles.bannerPlaceholderTitle}>Add a cover photo</Text>
                  <Text style={styles.bannerPlaceholderSub}>Give your service a face — 16:9 works best</Text>
                </View>
              )}
            </View>

            {!bannerUri && !isUploading && (
              <View style={styles.bannerActions}>
                <TouchableOpacity style={styles.bannerActionBtn}
                  onPress={() => handlePick("gallery")} activeOpacity={0.88}>
                  <Ionicons name="images-outline" size={16} color="#fff" />
                  <Text style={styles.bannerActionBtnText}>Choose photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bannerActionBtnOutline}
                  onPress={() => handlePick("camera")} activeOpacity={0.88}>
                  <Ionicons name="camera-outline" size={16} color={C.purple} />
                  <Text style={styles.bannerActionBtnOutlineText}>Take photo</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.bannerTip}>
              <Ionicons name="information-circle-outline" size={14} color={C.muted} />
              <Text style={styles.bannerTipText}>
                {bannerUri ? "Tap the image to edit or remove it." : "Optional — but services with banners get 2x more views!"}
              </Text>
            </View>

            <View style={[styles.sectionDivider, { marginVertical: 12 }]} />

            {/* Guidance Box */}
            <View style={styles.hintBox}>
              <Ionicons name="sparkles" size={24} color={C.purple} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.hintText, { color: C.text, fontWeight: '700', marginBottom: 2 }]}>
                  Pro Tip: Be Specific
                </Text>
                <Text style={styles.hintText}>
                  "I'll show you the best street food in Indore" works better than "I am a local guide".
                </Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </View>
        );

      case 3:
        const rateNum = Number(rate);
        const showLowWarning = rate && rateNum < 150;
        const showHighWarning = rate && chargeMethod === "hour" && rateNum > 1500;
        const quickPills = chargeMethod === "hour" ? ["199", "299", "499", "999"] : ["999", "1499", "1999", "2999"];

        return (
          <View style={styles.content}>
            <Text style={styles.title}>What's your rate? 💸</Text>
            <Text style={styles.subtitle}>Guests will see this before booking</Text>

            <View style={styles.sectionDivider} />

            {/* Charge Method */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>HOW DO YOU CHARGE?</Text>
              <View style={styles.methodGrid}>
                {/* Per Hour */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setChargeMethod("hour")}
                  style={[styles.methodCard, chargeMethod === "hour" && styles.methodCardSelected]}
                >
                  <View style={styles.radioRow}>
                    <View style={[styles.radioOuter, chargeMethod === "hour" && styles.radioOuterSelected]}>
                      {chargeMethod === "hour" && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <Text style={styles.methodTitle}>Per Hour</Text>
                  <Text style={styles.methodSub}>Guest pays per hour spent</Text>
                </TouchableOpacity>

                {/* Per Day */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setChargeMethod("day")}
                  style={[styles.methodCard, chargeMethod === "day" && styles.methodCardSelected]}
                >
                  <View style={styles.radioRow}>
                    <View style={[styles.radioOuter, chargeMethod === "day" && styles.radioOuterSelected]}>
                      {chargeMethod === "day" && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <Text style={styles.methodTitle}>Per Day</Text>
                  <Text style={styles.methodSub}>Fixed full day rate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionDivider} />

            {/* Rate Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>YOUR {chargeMethod === "hour" ? "HOURLY" : "DAILY"} RATE</Text>
              <View style={styles.rateInputRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <View style={styles.rateInputSeparator} />
                <TextInput
                  style={styles.rateInput}
                  placeholder="0"
                  placeholderTextColor="#CCC"
                  value={rate}
                  onChangeText={setRate}
                  keyboardType="numeric"
                />
                <Text style={[styles.counterText, { fontSize: 16 }]}>/{chargeMethod === "hour" ? "hr" : "day"}</Text>
              </View>

              {/* Warnings */}
              {showLowWarning && (
                <Text style={styles.warningTip}>⚠️ Are you sure? This seems low for your area.</Text>
              )}
              {showHighWarning && (
                <Text style={styles.warningTip}>⚠️ High rates get fewer bookings in your city.</Text>
              )}

              {/* Quick Fill */}
              <View style={styles.quickFillRow}>
                {quickPills.map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setRate(p)}
                    style={styles.quickFillChip}
                  >
                    <Text style={styles.quickFillText}>₹{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Hint Box */}
            <View style={styles.hintBox}>
              <Ionicons name="bulb" size={24} color={C.amber} />
              <Text style={styles.hintText}>
                Companions in {cityName} typically charge between ₹299–₹599/hr.
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </View>
        );

      case 5:
        const styles_step5 = [
          { id: "my_area", title: "My Area", sub: "Guests meet at my preferred location", icon: "📍" },
          { id: "go_to_guest", title: "I Go to Guest", sub: "I travel to the guest's location", icon: "🧭" },
          { id: "decide_on_chat", title: "We Decide on Chat", sub: "Final location to be discussed in chat", icon: "🤝" },
        ];

        return (
          <View style={styles.content}>
            <Text style={styles.title}>Where do you meet guests? 📍</Text>
            <Text style={styles.subtitle}>Help guests understand where you prefer to meet</Text>

            <View style={styles.sectionDivider} />

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>MEETUP STYLE</Text>
              <View style={styles.optionsList}>
                {styles_step5.map((s) => {
                  const isSelected = meetupStyle === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      activeOpacity={0.8}
                      onPress={() => setMeetupStyle(s.id as any)}
                      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    >
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Ionicons name="checkmark" size={14} color={C.white} />
                        </View>
                      )}
                      <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>{s.icon}</Text>
                      </View>
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionTitle}>{s.title}</Text>
                        <Text style={styles.optionSub}>{s.sub}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.sectionDivider} />

            {/* Location Search */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>YOUR CITY / AREA</Text>
              <View style={styles.locationSearchBox}>
                <Ionicons name="search" size={20} color={C.muted} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Search area or city"
                  value={locationQuery}
                  onChangeText={searchLocation}
                  placeholderTextColor="#999"
                />
                {isLocLoading && <ActivityIndicator size="small" color={C.purple} />}
              </View>

              {locationSuggestions.length > 0 && (
                <View style={{ backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' }}>
                  {locationSuggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handlePickLocation(item)}
                      style={styles.suggestionItem}
                    >
                      <Ionicons name="location-sharp" size={18} color={C.muted} />
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {item.main} {item.secondary ? `, ${item.secondary}` : ""}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Map Preview */}
              {selectedLoc && (
                <View style={styles.mapPreviewBox}>
                   <WebView 
                    ref={mapRef}
                    scrollEnabled={false}
                    pointerEvents="none"
                    source={{ html: makeGoogleMapHtml(GOOGLE_KEY, { lat: selectedLoc.lat, lng: selectedLoc.lng }) }}
                    onMessage={(e) => {
                      try {
                        const msg = JSON.parse(e.nativeEvent.data);
                        if (msg?.type === 'ready') setMapReady(true);
                        if (msg?.type === 'log') console.log('[CreateServiceFlow Map]', msg.msg);
                      } catch(ex) {}
                    }}
                  />
                  <View style={styles.mapOverlay}>
                    <Ionicons name="location" size={32} color={C.purple} />
                  </View>
                </View>
              )}

              <View style={styles.priorityHint}>
                <Ionicons name="shield-checkmark" size={20} color={C.purple} />
                <Text style={styles.priorityHintText}>
                  Your exact address remains hidden; guests only see your general area
                </Text>
              </View>

              {meetupStyle === "go_to_guest" && (
                <View style={[styles.hintBox, { marginTop: 16 }]}>
                  <Ionicons name="bulb" size={20} color={C.amber} />
                  <Text style={styles.hintText}>
                    You will travel to the guest's area. Exact coordinates will be shared after booking. Please set your base city.
                  </Text>
                </View>
              )}
            </View>
            <View style={{ height: 40 }} />
          </View>
        );

      case 6:
        const activeDaysCount = schedule.filter(d => d.active).length;
        const meetupText = {
          my_area: "Meets in My Area",
          go_to_guest: "I Go to Guest",
          decide_on_chat: "We Decide on Chat"
        }[meetupStyle];

        return (
          <View style={styles.content}>
            <Text style={styles.title}>You're all set! 🎉</Text>
            <Text style={styles.subtitle}>This is how your companion card will appear to guests</Text>

            <View style={styles.sectionDivider} />

            <Text style={styles.previewHeader}>CARD PREVIEW</Text>
            <View style={styles.previewCard}>
              {bannerUri ? (
                <View style={{ height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
                  <Image source={{ uri: bannerUri }} style={{ width: '100%', height: '100%' }} />
                </View>
              ) : null}
              <View style={styles.previewUserRow}>
                {user?.imageUrl ? (
                  <Image source={{ uri: user.imageUrl }} style={styles.previewAvatar} />
                ) : (
                  <View style={styles.previewAvatar} />
                )}
                <View>
                  <Text style={styles.previewName}>
                    {user?.firstName || "User"} • {cityName}
                    {rate ? `  ₹${rate}/${chargeMethod === "hour" ? "hr" : "day"}` : ""}
                  </Text>
                  <Text style={styles.previewLocation}>Active now</Text>
                </View>
              </View>

              <Text style={styles.previewHeadline}>{headline}</Text>

              <View style={[styles.chipContainer, { marginBottom: 16 }]}>
                {selectedTypes.map(id => {
                  const type = COMPANION_TYPES.find(t => t.id === id);
                  if (!type) return null;
                  return (
                    <View key={id} style={styles.chip}>
                      <Text style={{ fontSize: 12 }}>{type.icon}</Text>
                      <Text style={styles.chipText}>{type.title.split(' ')[0]}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={{ gap: 8 }}>
                <View style={styles.checklistItem}>
                  <Ionicons name="calendar-outline" size={16} color={C.success} />
                  <Text style={[styles.checklistText, { fontSize: 13 }]}>Free {activeDaysCount} days/week</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="time-outline" size={16} color={C.success} />
                  <Text style={[styles.checklistText, { fontSize: 13 }]}>Min {minDuration}</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="location-outline" size={16} color={C.success} />
                  <Text style={[styles.checklistText, { fontSize: 13 }]}>{meetupText}</Text>
                </View>
              </View>
            </View>

            <View style={styles.checklistContainer}>
              <View style={styles.checklistItem}>
                <View style={styles.checklistIcon}><Ionicons name="checkmark" size={12} color={C.success} /></View>
                <Text style={styles.checklistText}>Companion types set</Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={styles.checklistIcon}><Ionicons name="checkmark" size={12} color={C.success} /></View>
                <Text style={styles.checklistText}>Rate: ₹{rate}/{chargeMethod === "hour" ? "hr" : "day"}</Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={styles.checklistIcon}><Ionicons name="checkmark" size={12} color={C.success} /></View>
                <Text style={styles.checklistText}>Location: {selectedLoc?.city || cityName}</Text>
              </View>
            </View>

            <View style={styles.reviewNotice}>
              <Ionicons name="alert-circle" size={20} color={C.amber} />
              <Text style={styles.reviewNoticeText}>
                Once live, your profile will be visible on the discovery map
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowEditMenu(true)}
              style={styles.editJumpBtn}
            >
              <Text style={styles.editJumpText}>Modify section →</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        );

      case 4:
        const durations = ["1 hr", "2 hr", "3 hr", "4 hr", "Half Day", "Full Day"];

        return (
          <View style={styles.content}>
            <Text style={styles.title}>When are you free to meet? 📅</Text>
            <Text style={styles.subtitle}>Guests can only book your services during your available hours</Text>

            <View style={styles.sectionDivider} />

            {/* Min Duration */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>MINIMUM MEET DURATION</Text>
              <Text style={[styles.optionSub, { marginBottom: 12 }]}>What is the minimum booking duration?</Text>
              <View style={styles.durationRow}>
                {durations.map(d => (
                  <TouchableOpacity
                    key={d}
                    activeOpacity={0.8}
                    onPress={() => setMinDuration(d)}
                    style={[styles.durationChip, minDuration === d && styles.durationChipSelected]}
                  >
                    <Text style={[styles.durationText, minDuration === d && styles.durationTextSelected]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sectionDivider} />

            {/* Weekly Schedule */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>YOUR WEEK</Text>
              <View style={styles.scheduleList}>
                {schedule.map((day, idx) => (
                  <View key={day.day} style={styles.dayRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        const next = [...schedule];
                        next[idx].active = !next[idx].active;
                        setSchedule(next);
                      }}
                      style={styles.dayInfo}
                    >
                      <Text style={styles.dayName}>{day.day}</Text>
                      <View style={[styles.statusDot, day.active && styles.statusDotActive]} />
                      <Text style={[styles.timeRange, !day.active && styles.timeRangeMuted]}>
                        {day.active ? `${day.start} – ${day.end}` : "Unavailable"}
                      </Text>
                    </TouchableOpacity>

                    {day.active && (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingDayIndex(idx);
                        }}
                        style={styles.editTimeBtn}
                      >
                        <Ionicons name="pencil" size={18} color={C.muted} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionDivider} />

            {/* Blocked Dates */}
            <View style={{ marginBottom: 40 }}>
              <Text style={styles.label}>BLOCK SPECIFIC DATES</Text>
              <Text style={styles.optionSub}>Holidays, travel, personal</Text>

              <TouchableOpacity
                onPress={() => setShowCalendar(!showCalendar)}
                style={styles.calendarToggle}
              >
                <Text style={styles.calendarToggleText}>
                  {showCalendar ? "Hide calendar" : "+ Add blocked dates"}
                </Text>
                <Ionicons name={showCalendar ? "chevron-up" : "chevron-down"} size={20} color={C.purple} />
              </TouchableOpacity>

              {showCalendar && (
                <View style={styles.calendarContainer}>
                  <CalendarView
                    blockedDates={blockedDates}
                    onToggleDate={(date) => {
                      setBlockedDates(prev =>
                        prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
                      );
                    }}
                  />
                  <View style={styles.calendarLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBox, { backgroundColor: '#EEE' }]} />
                      <Text style={styles.legendLabel}>Weekly off</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendBox, { backgroundColor: '#333' }]} />
                      <Text style={styles.legendLabel}>Blocked</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <SafeAreaView style={{ flex: 1 }}>
            {isSuccess ? (
              <SuccessView
                selectedLoc={selectedLoc}
                cityName={cityName}
                rate={rate}
                user={user}
                onShare={shareProfile}
                onClose={onClose}
                bannerUri={bannerUri}
              />
            ) : (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.navRow}>
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                      <Ionicons name="chevron-back" size={24} color={C.text} />
                      <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.stepCount}>{step === 6 ? "Done" : `${step} of 5`}</Text>

                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                      <Ionicons name="close" size={24} color={C.muted} />
                    </TouchableOpacity>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View
                      style={[styles.progressBar, { width: `${progress}%` }]}
                    />
                  </View>
                </View>

                {/* Scrollable Content */}
                <ScrollView showsVerticalScrollIndicator={false}>
                  {renderStep()}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={() => {
                      if (step === 2 && !headline.trim()) {
                        setShowErrors(true);
                        return;
                      }
                      setShowErrors(false);
                      if (step === 6) handleFinish();
                      else setStep(s => s + 1);
                    }}
                    disabled={!canContinue}
                    activeOpacity={0.8}
                    style={[
                      styles.continueBtn,
                      !canContinue && styles.continueBtnDisabled,
                      step === 6 && { backgroundColor: C.purple }
                    ]}
                  >
                    {submitting ? (
                      <ActivityIndicator color={C.white} />
                    ) : (
                      <>
                        <Text style={styles.continueText}>
                          {step === 6 ? "✨ Go Live" : "Continue"}
                        </Text>
                        <Ionicons name={step === 6 ? "sparkles" : "arrow-forward"} size={20} color={C.white} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </SafeAreaView>
        </View>
      </View>

      {/* Edit Direct Jump Menu */}
      <Modal visible={showEditMenu} transparent animationType="fade">
        <Pressable 
          style={styles.editMenuBackdrop}
          onPress={() => setShowEditMenu(false)}
        >
          <View style={styles.editBox}>
            <Text style={styles.editMenuTitle}>Select a section to modify</Text>
            {[
              { s: 1, l: "1. Companion Type" },
              { s: 2, l: "2. Headline & About" },
              { s: 3, l: "3. Rate" },
              { s: 4, l: "4. Availability" },
              { s: 5, l: "5. Location" },
            ].map((m) => (
              <TouchableOpacity
                key={m.s}
                onPress={() => {
                  setStep(m.s);
                  setShowEditMenu(false);
                }}
                style={styles.editMenuItem}
              >
                <Text style={styles.editMenuLabel}>{m.l}</Text>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={editingDayIndex !== null} transparent animationType="fade">
        <View style={[styles.backdrop, { justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={styles.timeSheet}>
            <View style={styles.timeSheetHeader}>
              <Text style={styles.timeSheetTitle}>
                {editingDayIndex !== null ? schedule[editingDayIndex].day : ""} Hours
              </Text>
              <TouchableOpacity onPress={() => setEditingDayIndex(null)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerBox}>
              <Text style={styles.label}>Start Time</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsStartMode(true);
                  setShowPicker(true);
                }}
                style={styles.timePickerBtn}
              >
                <Ionicons name="time-outline" size={24} color={C.purple} />
                <Text style={styles.timePickerText}>
                  {editingDayIndex !== null ? schedule[editingDayIndex].start : ""}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerBox}>
              <Text style={styles.label}>End Time</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsStartMode(false);
                  setShowPicker(true);
                }}
                style={styles.timePickerBtn}
              >
                <Ionicons name="time-outline" size={24} color={C.purple} />
                <Text style={styles.timePickerText}>
                  {editingDayIndex !== null ? schedule[editingDayIndex].end : ""}
                </Text>
              </TouchableOpacity>
            </View>

            {showPicker && (
              <DateTimePicker
                value={tempDate}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, date) => {
                  setShowPicker(false);
                  if (date && editingDayIndex !== null) {
                    const timeStr =
                      date.getHours().toString().padStart(2, "0") +
                      ":" +
                      date.getMinutes().toString().padStart(2, "0");
                    const next = [...schedule];
                    if (isStartMode) next[editingDayIndex].start = timeStr;
                    else next[editingDayIndex].end = timeStr;
                    setSchedule(next);
                  }
                }}
              />
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity
                onPress={() => setEditingDayIndex(null)}
                style={[styles.sheetBtn, styles.sheetBtnPrimary]}
              >
                <Text style={[styles.sheetBtnText, styles.sheetBtnTextPrimary]}>Save Hours</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
