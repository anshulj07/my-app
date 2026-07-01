// components/EditRecurringModal/EditRecurring.tsx
// Dedicated modal for editing recurring activities with Pause/Resume support.
// Pausing sets status="paused" on the backend → frontend can filter out paused pins.

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Pressable, Modal, Platform, ActivityIndicator,
  Alert, Dimensions, Image
} from "react-native";
import { Modalize } from "react-native-modalize";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { apiFetch } from "../../lib/apiFetch";

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg: "#FFFFFF",
  card: "#F8FAFC",
  border: "#E2E8F0",
  ink: "#0F172A",
  ink2: "#334155",
  muted: "#64748B",
  hint: "#94A3B8",
  inputBg: "#F1F5F9",
  inputBorder: "#E2E8F0",
  green: "#10B981",
  greenBg: "#ECFDF5",
  greenBorder: "#A7F3D0",
  greenText: "#059669",
  purple: "#6366F1",
  purpleBg: "#EEF2FF",
  purpleText: "#4F46E5",
  amber: "#F59E0B",
  amberBg: "#FFFBEB",
  orange: "#F97316",
  orangeBg: "#FFF7ED",
  orangeText: "#EA580C",
  red: "#EF4444",
  redBg: "#FEF2F2",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Types ──────────────────────────────────────────────────────────────────
export type RecurringEvent = {
  _id: string;
  title?: string;
  description?: string;
  kind?: string;
  /** "active" | "paused" | "cancelled" */
  status?: string;
  recurringSchedule?: { day: number; startTime: string; endTime: string }[];
  bookingWindowDays?: number;
  dailyCapacity?: number | null;
  joinPolicy?: string;
  creatorClerkId?: string;
  bannerUri?: string;
  location?: {
    lat?: number | null;
    lng?: number | null;
    formattedAddress?: string;
    address?: string;
    city?: string;
    countryCode?: string;
  };
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function timeToDate(time24: string) {
  const d = new Date();
  if (!time24) return d;
  const [hh, mm] = time24.split(":").map(Number);
  if (Number.isFinite(hh)) d.setHours(hh);
  if (Number.isFinite(mm)) d.setMinutes(mm);
  d.setSeconds(0); d.setMilliseconds(0);
  return d;
}

function fmtTime(t: string) {
  if (!t) return "";
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh)) return t;
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function EditRecurringModal({
  visible,
  event,
  onClose,
  onUpdated,
  onDeleted,
  onPauseToggled,
}: {
  visible: boolean;
  event: RecurringEvent | null;
  onClose: () => void;
  onUpdated?: (updated: any) => void;
  onDeleted?: (_id: string) => void;
  /** Fired after a successful pause/resume so the parent can hide/show map pins */
  onPauseToggled?: (_id: string, status: "active" | "paused") => void;
}) {
  const { userId } = useAuth();
  const sheetRef = useRef<Modalize>(null);
  const H = Dimensions.get("window").height;
  const TOP_GAP = 40;

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const API_KEY  = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  // ── Form state ─────────────────────────────────────────────────────────
  const [title,            setTitle]            = useState("");
  const [description,      setDescription]      = useState("");
  const [bannerUri,        setBannerUri]        = useState("");
  const [recurringSchedule, setRecurringSchedule] = useState<{ day: number; startTime: string; endTime: string }[]>([]);
  const [bookingWindow,    setBookingWindow]    = useState<number>(1);
  const [dailyCapText,     setDailyCapText]     = useState("");
  const [joinPolicy,       setJoinPolicy]       = useState<"open" | "approval">("open");
  const [status,           setStatus]           = useState<"active" | "paused">("active");

  const [schedDayObj, setSchedDayObj] = useState<{ day: number; field: "start" | "end" } | null>(null);

  const [saving,   setSaving]   = useState(false);
  const [pausing,  setPausing]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err,      setErr]      = useState<string | null>(null);

  const isPaused  = status === "paused";
  const isCreator = !!event?.creatorClerkId && !!userId && event.creatorClerkId === userId;
  const busy      = saving || pausing || deleting;
  const canSave   = !!event?._id && !!title.trim() && isCreator && !busy;

  // ── Open / close ───────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) sheetRef.current?.open();
    else         sheetRef.current?.close();
  }, [visible]);

  // ── Prefill from event prop ────────────────────────────────────────────
  useEffect(() => {
    if (!visible || !event) return;
    setTitle(event.title ?? "");
    setDescription(event.description ?? "");
    setBannerUri(event.bannerUri || (event as any).bannerImage || "");
    setRecurringSchedule(event.recurringSchedule ?? []);
    setBookingWindow(event.bookingWindowDays ?? 1);
    setDailyCapText(event.dailyCapacity ? String(event.dailyCapacity) : "");
    setJoinPolicy((event.joinPolicy as "open" | "approval") ?? "open");
    setStatus((event.status as "active" | "paused") ?? "active");
    setErr(null);
    setSaving(false);
    setPausing(false);
    setDeleting(false);
  }, [visible, event]);

  // ── API helpers ────────────────────────────────────────────────────────
  const headers = {
    "Content-Type": "application/json",
    ...(API_KEY ? { "x-api-key": API_KEY } : {}),
  };

  async function patchEvent(updates: Record<string, any>) {
    if (!event?._id || !API_BASE || !userId) throw new Error("Missing required info.");
    const res = await apiFetch(`${API_BASE}/api/events/update-event`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        _id: event._id,
        eventId: event._id,
        creatorClerkId: userId,
        updates,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || json?.message || "Request failed");
    return json;
  }

  // ── Pause / Resume ─────────────────────────────────────────────────────
  const handlePauseToggle = () => {
    if (!isCreator || busy) return;
    const nextStatus: "active" | "paused" = isPaused ? "active" : "paused";

    Alert.alert(
      isPaused ? "Resume Activity?" : "Pause Activity?",
      isPaused
        ? "Your activity will reappear on the map and people can book again."
        : "Your activity will be hidden from the map temporarily. Existing bookings are NOT affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isPaused ? "Resume" : "Pause",
          style: isPaused ? "default" : "destructive",
          onPress: async () => {
            setPausing(true);
            setErr(null);
            try {
              await patchEvent({ status: nextStatus });
              setStatus(nextStatus);
              onPauseToggled?.(event!._id, nextStatus);
            } catch (e: any) {
              setErr(e?.message || "Failed to update status.");
            } finally {
              setPausing(false);
            }
          },
        },
      ]
    );
  };

  // ── Save edits ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!canSave) return;
    if (recurringSchedule.length === 0) { setErr("Enable at least one day in the schedule."); return; }

    setSaving(true);
    setErr(null);
    try {
      const cap = dailyCapText.trim() ? (parseInt(dailyCapText, 10) || null) : null;
      const json = await patchEvent({
        title:            title.trim(),
        description:      description.trim(),
        bannerUri,
        recurringSchedule,
        recurringDays:    recurringSchedule.map(s => s.day), // fallback
        bookingWindowDays: bookingWindow,
        dailyCapacity:    cap,
        joinPolicy,
      });
      onUpdated?.(json?.event ?? json);
      sheetRef.current?.close();
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!isCreator || busy || !event?._id) return;
    Alert.alert(
      "Delete Event?",
      "This will permanently remove the recurring event and all its pins. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            if (!API_BASE || !userId) return;
            setDeleting(true);
            setErr(null);
            try {
              const res = await apiFetch(`${API_BASE}/api/events/delete-event`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  _id: event._id, eventId: event._id, creatorClerkId: userId,
                }),
              });
              const json = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(json?.error || "Failed to delete");
              onDeleted?.(event._id);
              sheetRef.current?.close();
            } catch (e: any) {
              setErr(e?.message || "Failed to delete.");
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const hardClose = () => { setErr(null); setSaving(false); setPausing(false); setDeleting(false); onClose(); };

  return (
    <Modalize
      ref={sheetRef}
      withReactModal
      onClosed={hardClose}
      modalHeight={H - TOP_GAP}
      modalTopOffset={TOP_GAP}
      modalStyle={S.modal}
      handleStyle={S.handle}
      overlayStyle={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      keyboardAvoidingBehavior="padding"
      scrollViewProps={{ keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false }}
      panGestureEnabled={false}
      closeOnOverlayTap={false}
      reactModalProps={{
        presentationStyle: "overFullScreen",
        statusBarTranslucent: true,
        animationType: "slide",
        onRequestClose: () => {},
      }}
    >
      {/* ══ HEADER ════════════════════════════════════════════════════════ */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          <View style={[S.headerIcon, isPaused && S.headerIconPaused]}>
            <Ionicons name="repeat" size={22} color={isPaused ? C.orange : C.green} />
          </View>
          <View>
            <Text style={S.headerTitle}>Edit Recurring Event</Text>
            {/* Live / Paused status pill */}
            <View style={[S.statusPill, isPaused ? S.statusPillPaused : S.statusPillLive]}>
              <View style={[S.statusDot, isPaused ? S.statusDotPaused : S.statusDotLive]} />
              <Text style={[S.statusTxt, isPaused ? S.statusTxtPaused : S.statusTxtLive]}>
                {isPaused ? "Paused · Hidden from map" : "Live · Visible on map"}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={S.closeBtn} onPress={() => sheetRef.current?.close()} hitSlop={12}>
          <Ionicons name="close" size={19} color={C.muted} />
        </TouchableOpacity>
      </View>

      {/* ══ PAUSE / RESUME BANNER ═════════════════════════════════════════ */}
      {isCreator && (
        <TouchableOpacity
          style={[S.pauseBanner, isPaused ? S.pauseBannerResume : S.pauseBannerPause]}
          onPress={handlePauseToggle}
          activeOpacity={0.82}
          disabled={busy}
        >
          <View style={[S.pauseIconWrap, isPaused ? S.pauseIconWrapResume : S.pauseIconWrapPause]}>
            {pausing
              ? <ActivityIndicator color={isPaused ? C.green : C.orange} size="small" />
              : <Ionicons name={isPaused ? "play-circle" : "pause-circle"} size={26} color={isPaused ? C.green : C.orange} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.pauseBannerTitle, isPaused ? { color: C.greenText } : { color: C.orangeText }]}>
              {pausing ? "Updating status…" : isPaused ? "Resume Activity" : "Pause Activity"}
            </Text>
            <Text style={S.pauseBannerSub}>
              {isPaused
                ? "Tap to make it visible on the map again"
                : "Temporarily hides pins from the map · bookings are kept"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isPaused ? C.greenText : C.orangeText} />
        </TouchableOpacity>
      )}

      {/* ══ SCROLL CONTENT ════════════════════════════════════════════════ */}
      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={S.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── BANNER ── */}
        <Text style={S.label}>Cover Photo</Text>
        <TouchableOpacity
          style={S.bannerZone}
          onPress={async () => {
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [16, 9],
              quality: 0.8,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
              setBannerUri(res.assets[0].uri);
              setErr(null);
            }
          }}
        >
          {bannerUri ? (
            <View style={S.bannerZoneHasImage}>
              <Image source={{ uri: bannerUri }} style={S.bannerImg} />
              <View style={S.bannerOverlay}>
                <View style={S.editCircle}>
                  <Ionicons name="pencil" size={16} color={C.purple} />
                </View>
              </View>
            </View>
          ) : (
            <View style={S.bannerPlaceholder}>
              <View style={S.bannerPlaceholderIcon}>
                <Ionicons name="image-outline" size={28} color={C.purpleText} />
              </View>
              <Text style={S.bannerPlaceholderTitle}>Tap to add cover photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── TITLE ── */}
        <Text style={S.label}>Activity Name</Text>
        <View style={S.inputRow}>
          <Ionicons name="pencil-outline" size={16} color={C.hint} />
          <TextInput
            value={title}
            onChangeText={t => { setTitle(t); setErr(null); }}
            placeholder="e.g., Morning Yoga Session"
            placeholderTextColor={C.hint}
            style={S.textInput}
            returnKeyType="done"
          />
        </View>

        {/* ── DESCRIPTION ── */}
        <Text style={S.label}>Description</Text>
        <View style={S.descShell}>
          <TextInput
            value={description}
            onChangeText={t => { setDescription(t); setErr(null); }}
            placeholder="What happens, what to bring, rules…"
            placeholderTextColor={C.hint}
            style={S.descInput}
            multiline textAlignVertical="top"
          />
        </View>

        {/* ── WEEKLY SCHEDULE ── */}
        <Text style={S.label}>Weekly Schedule</Text>
        <View style={S.card}>
          <View style={{ gap: 12 }}>
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((dayName, i) => {
              const sched = recurringSchedule.find(s => s.day === i);
              const isActive = !!sched;
              return (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: isActive ? C.greenBg : C.card, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: isActive ? C.greenBorder : C.border }}>
                  {/* Toggle */}
                  <Pressable
                    style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: isActive ? C.green : C.hint, backgroundColor: isActive ? C.green : "transparent", alignItems: "center", justifyContent: "center" }}
                    onPress={() => {
                      if (isActive) {
                        setRecurringSchedule(recurringSchedule.filter(s => s.day !== i));
                      } else {
                        setRecurringSchedule([...recurringSchedule, { day: i, startTime: "09:00", endTime: "17:00" }].sort((a,b) => a.day - b.day));
                      }
                      setErr(null);
                    }}
                  >
                    {isActive && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </Pressable>
                  
                  <Text style={{ width: 80, fontSize: 14, fontWeight: "700", color: isActive ? C.greenText : C.muted }}>{dayName}</Text>

                  {/* Times */}
                  {isActive ? (
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Pressable
                        style={{ flex: 1, backgroundColor: C.bg, paddingVertical: 8, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: C.border }}
                        onPress={() => setSchedDayObj({ day: i, field: "start" })}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "700", color: C.ink }}>{fmtTime(sched.startTime)}</Text>
                      </Pressable>
                      <Text style={{ color: C.hint, fontSize: 12, fontWeight: "800" }}>to</Text>
                      <Pressable
                        style={{ flex: 1, backgroundColor: C.bg, paddingVertical: 8, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: C.border }}
                        onPress={() => setSchedDayObj({ day: i, field: "end" })}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "700", color: C.ink }}>{fmtTime(sched.endTime)}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={{ flex: 1, fontSize: 13, color: C.hint, fontWeight: "600", fontStyle: "italic", textAlign: "center" }}>Unavailable</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── BOOKING WINDOW ── */}
        <Text style={S.label}>Booking Window</Text>
        <View style={S.card}>
          <Text style={S.cardSub}>How far ahead can users book a session?</Text>
          <View style={S.chipsWrap}>
            {[
              { label: "Same Day", v: 0 },
              { label: "1 Day",    v: 1 },
              { label: "3 Days",   v: 3 },
              { label: "1 Week",   v: 7 },
              { label: "2 Weeks",  v: 14 },
              { label: "1 Month",  v: 30 },
            ].map(o => {
              const on = bookingWindow === o.v;
              return (
                <Pressable key={o.v} onPress={() => setBookingWindow(o.v)}
                  style={[S.chip, on && S.chipOn]}>
                  <Text style={[S.chipTxt, on && S.chipTxtOn]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={S.infoRow}>
            <Ionicons name="information-circle-outline" size={13} color="#0284C7" />
            <Text style={S.infoTxt}>
              {bookingWindow === 0
                ? "Users can only book on the same day."
                : `Users can book up to ${bookingWindow} day${bookingWindow > 1 ? "s" : ""} in advance.`}
            </Text>
          </View>
        </View>

        {/* ── DAILY CAPACITY ── */}
        <Text style={S.label}>Daily Capacity</Text>
        <View style={S.card}>
          <Text style={S.cardSub}>Max bookings per day (empty = unlimited)</Text>
          <View style={S.inputRow}>
            <Ionicons name="people-outline" size={16} color={C.hint} />
            <TextInput
              value={dailyCapText}
              onChangeText={t => setDailyCapText(t.replace(/[^\d]/g, ""))}
              placeholder="Unlimited"
              placeholderTextColor={C.hint}
              keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
              style={S.textInput}
            />
            {!!dailyCapText && parseInt(dailyCapText) > 0 && (
              <View style={S.setPill}><Text style={S.setPillTxt}>Set</Text></View>
            )}
          </View>
        </View>

        {/* ── ACCESS ── */}
        <Text style={S.label}>Who Can Join?</Text>
        <View style={S.card}>
          {(["open", "approval"] as const).map(pol => (
            <TouchableOpacity
              key={pol}
              style={[S.accessRow, joinPolicy === pol && S.accessRowOn]}
              onPress={() => setJoinPolicy(pol)}
              activeOpacity={0.85}
            >
              <View style={[S.radio, joinPolicy === pol && S.radioOn]}>
                {joinPolicy === pol && <View style={S.radioDot} />}
              </View>
              <Ionicons
                name={pol === "open" ? "globe-outline" : "checkmark-done-outline"}
                size={16}
                color={joinPolicy === pol ? C.green : C.muted}
              />
              <View style={{ flex: 1 }}>
                <Text style={S.accessTitle}>
                  {pol === "open" ? "Anyone — direct join" : "Approval required"}
                </Text>
                <Text style={S.accessSub}>
                  {pol === "open" ? "People join instantly, no approval needed" : "You review and approve each request"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── LOCATION (read-only) ── */}
        {!!(event?.location?.formattedAddress || event?.location?.address) && (
          <>
            <Text style={S.label}>Location</Text>
            <View style={[S.card, S.locRow]}>
              <Ionicons name="location-outline" size={18} color={C.muted} />
              <Text style={S.locTxt} numberOfLines={2}>
                {event.location?.formattedAddress || event.location?.address}
              </Text>
              <View style={S.fixedBadge}><Text style={S.fixedTxt}>Fixed</Text></View>
            </View>
          </>
        )}

        {/* ── ERROR ── */}
        {!!err && (
          <View style={S.errBox}>
            <Ionicons name="alert-circle-outline" size={15} color={C.red} />
            <Text style={S.errTxt}>{err}</Text>
          </View>
        )}

        {/* ── ACTIONS ── */}
        {isCreator ? (
          <View style={S.actions}>
            {/* 🗑 Delete */}
            <TouchableOpacity
              style={[S.deleteBtn, busy && { opacity: 0.45 }]}
              onPress={handleDelete}
              disabled={busy}
              activeOpacity={0.8}
            >
              {deleting
                ? <ActivityIndicator color={C.red} size="small" />
                : <Ionicons name="trash-outline" size={18} color={C.red} />}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={[S.cancelBtn, busy && { opacity: 0.5 }]}
              onPress={() => sheetRef.current?.close()}
              disabled={busy}
              activeOpacity={0.8}
            >
              <Text style={S.cancelTxt}>Cancel</Text>
            </TouchableOpacity>

            {/* ✓ Save */}
            <TouchableOpacity
              style={[S.saveBtn, !canSave && { opacity: 0.42 }]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.88}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={S.saveTxt}>Save Changes</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <View style={S.notOwner}>
            <Ionicons name="lock-closed-outline" size={16} color={C.muted} />
            <Text style={S.notOwnerTxt}>Only the creator can edit this activity.</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ══ SCHEDULE TIME PICKER MODAL ════════════════════════════════════════════ */}
      <Modal transparent visible={!!schedDayObj} animationType="slide" onRequestClose={() => setSchedDayObj(null)}>
        <Pressable style={S.overlay} onPress={() => setSchedDayObj(null)}>
          <Pressable style={S.pickerCard} onPress={() => {}}>
            <Text style={S.pickerTitle}>Pick {schedDayObj?.field === "start" ? "start" : "end"} time</Text>
            {schedDayObj && (
              <DateTimePicker
                value={timeToDate(recurringSchedule.find(s => s.day === schedDayObj.day)?.[schedDayObj.field === "start" ? "startTime" : "endTime"] || "09:00")} mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"} themeVariant="light"
                onChange={(_, d) => {
                  if (!d) return;
                  const val = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                  setRecurringSchedule(recurringSchedule.map(s => {
                    if (s.day === schedDayObj.day) {
                      return { ...s, [schedDayObj.field === "start" ? "startTime" : "endTime"]: val };
                    }
                    return s;
                  }));
                  if (Platform.OS !== "ios") setSchedDayObj(null);
                }}
              />
            )}
            <TouchableOpacity style={S.pickerDone} onPress={() => setSchedDayObj(null)}>
              <Text style={S.pickerDoneTxt}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </Modalize>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  modal: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    shadowColor: "#000", shadowOpacity: 0.13, shadowRadius: 22, elevation: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 99,
    backgroundColor: "#D1D5DB", alignSelf: "center", marginTop: 10,
  },

  // ── Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerIcon: {
    width: 46, height: 46, borderRadius: 15,
    backgroundColor: C.greenBg, borderWidth: 1.5, borderColor: C.greenBorder,
    alignItems: "center", justifyContent: "center",
  },
  headerIconPaused: { backgroundColor: "#FFF7ED", borderColor: "#FDBA74" },
  headerTitle: { fontSize: 17, fontWeight: "900", color: C.ink, letterSpacing: -0.3 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
    marginTop: 4, alignSelf: "flex-start", borderWidth: 1,
  },
  statusPillLive:   { backgroundColor: C.greenBg,  borderColor: C.greenBorder },
  statusPillPaused: { backgroundColor: "#FFF7ED",   borderColor: "#FDBA74" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotLive:   { backgroundColor: C.green },
  statusDotPaused: { backgroundColor: C.orange },
  statusTxt: { fontSize: 11, fontWeight: "700" },
  statusTxtLive:   { color: C.greenText },
  statusTxtPaused: { color: C.orangeText },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },

  // ── Pause banner
  pauseBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginTop: 14, marginBottom: 2,
    paddingHorizontal: 14, paddingVertical: 14, borderRadius: 18, borderWidth: 1.5,
  },
  pauseBannerPause:  { backgroundColor: "#FFF7ED", borderColor: "#FDBA74" },
  pauseBannerResume: { backgroundColor: C.greenBg,  borderColor: C.greenBorder },
  pauseIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  pauseIconWrapPause:  { backgroundColor: "#FFE4C4" },
  pauseIconWrapResume: { backgroundColor: "#BBF7D0" },
  pauseBannerTitle: { fontSize: 15, fontWeight: "800" },
  pauseBannerSub:   { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 2, lineHeight: 17 },

  // ── Body
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  label: {
    fontSize: 11, fontWeight: "800", color: C.muted,
    textTransform: "uppercase", letterSpacing: 1.2,
    marginTop: 20, marginBottom: 8, paddingHorizontal: 2,
  },
  bannerZone: {
    height: 160, borderRadius: 16, overflow: "hidden",
    borderWidth: 2, borderStyle: "dashed", borderColor: C.purple + "55",
    backgroundColor: C.purpleBg, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  bannerZoneHasImage: { flex: 1, width: "100%", height: "100%", borderRadius: 14, overflow: "hidden", borderStyle: "solid", borderColor: C.purple + "88", borderWidth: 2 },
  bannerImg: { width: "100%", height: "100%", resizeMode: "cover" },
  bannerPlaceholder: { alignItems: "center", justifyContent: "center", gap: 10 },
  bannerPlaceholderIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.purple + "18", borderWidth: 2, borderColor: C.purple + "33",
    alignItems: "center", justifyContent: "center",
  },
  bannerPlaceholderTitle: { fontSize: 13, fontWeight: "800", color: C.purpleText },
  bannerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(15,23,42,0.3)", alignItems: "center", justifyContent: "center",
  },
  editCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  card: {
    backgroundColor: "#F8FAFC", borderRadius: 16,
    borderWidth: 1.5, borderColor: C.border, padding: 14, gap: 8,
  },
  cardSub: { fontSize: 12, color: C.muted, fontWeight: "500" },

  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: 14, paddingHorizontal: 14,
  },
  textInput: { flex: 1, fontSize: 14, fontWeight: "600", color: C.ink, paddingVertical: 13 },
  descShell: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: 14, padding: 14, minHeight: 90,
  },
  descInput: { fontSize: 14, fontWeight: "500", color: C.ink, minHeight: 80, lineHeight: 22 },

  // Days
  daysRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  dayBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center",
  },
  dayBtnOn: { backgroundColor: C.greenBg, borderColor: C.green },
  dayTxt:   { fontSize: 11, fontWeight: "700", color: C.hint },
  dayTxtOn: { color: C.greenText },
  dayHint:  { fontSize: 11, color: C.muted, fontWeight: "600", textAlign: "center" },

  // Time
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeTile: {
    flex: 1, backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: 14, padding: 14, alignItems: "flex-start", gap: 5,
  },
  timeBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tileLbl:   { fontSize: 9, fontWeight: "800", color: C.hint, textTransform: "uppercase", letterSpacing: 0.8 },
  tileVal:   { fontSize: 14, fontWeight: "800", color: C.ink },
  tileValMuted: { color: C.hint, fontWeight: "600" },
  timeSep:   { alignItems: "center" },
  timeSepTxt:{ fontSize: 16, color: C.muted, fontWeight: "700" },

  // Chips
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    borderWidth: 1.5, borderColor: C.inputBorder, backgroundColor: C.inputBg,
  },
  chipOn:  { borderColor: "#0284C7", backgroundColor: "#E0F2FE" },
  chipTxt: { fontSize: 12, fontWeight: "700", color: C.muted },
  chipTxtOn: { color: "#0284C7" },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F0F9FF", borderRadius: 10, padding: 10,
  },
  infoTxt: { fontSize: 12, color: "#0369A1", fontWeight: "600", flex: 1 },

  // Capacity
  setPill: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99,
    backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenBorder,
  },
  setPillTxt: { fontSize: 11, fontWeight: "800", color: C.greenText },

  // Access
  accessRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 1.5,
    borderColor: C.inputBorder, backgroundColor: C.inputBg, marginBottom: 8,
  },
  accessRowOn: { borderColor: C.green, backgroundColor: C.greenBg },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: C.hint, alignItems: "center", justifyContent: "center",
  },
  radioOn:  { borderColor: C.green, backgroundColor: C.green },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  accessTitle: { fontSize: 14, fontWeight: "800", color: C.ink },
  accessSub:   { fontSize: 12, color: C.muted, fontWeight: "500", marginTop: 2 },

  // Location
  locRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  locTxt: { flex: 1, fontSize: 13, color: C.muted, fontWeight: "500" },
  fixedBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: C.border,
  },
  fixedTxt: { fontSize: 10, fontWeight: "700", color: C.muted },

  // Error
  errBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 12, padding: 12, borderRadius: 12,
    backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
  },
  errTxt: { flex: 1, fontSize: 13, fontWeight: "700", color: C.red },

  // Actions
  actions: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border,
  },
  deleteBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA",
    alignItems: "center", justifyContent: "center",
  },
  cancelBtn: {
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14,
    backgroundColor: "#F1F5F9", borderWidth: 1.5, borderColor: C.border,
  },
  cancelTxt: { fontSize: 14, fontWeight: "800", color: C.muted },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: C.green,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    shadowColor: C.green, shadowOpacity: 0.28, shadowRadius: 10, elevation: 4,
  },
  saveTxt: { fontSize: 14, fontWeight: "900", color: "#fff" },
  notOwner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 16, padding: 14, borderRadius: 14,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  notOwnerTxt: { fontSize: 14, color: C.muted, fontWeight: "600" },

  // Picker modals
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.52)", justifyContent: "flex-end" },
  pickerCard: {
    backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 42,
  },
  pickerTitle:   { fontSize: 17, fontWeight: "800", color: C.ink, textAlign: "center", marginBottom: 16 },
  pickerDone: {
    marginTop: 16, paddingVertical: 14, borderRadius: 99,
    backgroundColor: C.purple, alignItems: "center",
  },
  pickerDoneTxt: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
