import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
  Switch,
  StyleSheet,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { EventPin } from "../Map/MapView";
import JoinEventButton from "./JoinEventButton";
import AttendeeStack from "./AttendeeStack";
import { styles } from "./PersonBookingSheet.style";

type Props = {
  visible: boolean;
  onClose: () => void;
  person?: EventPin | null;
  onEditDetails?: (ev: EventPin) => void;
  onStatusChanged?: (eventId: string, nextStatus: string) => void;
};

function pickFirst(...vals: Array<any>) {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}

function titleCase(s: string) {
  return (s || "").replace(/\b\w/g, (c) => c.toUpperCase());
}

function moneyFromCents(cents: any) {
  const n = typeof cents === "string" ? Number(cents) : cents;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  return `$${(n / 100).toFixed(2)}`;
}

function formatDateTime(ev: any) {
  const tz = ev?.timezone || "America/New_York";

  // Prefer startsAt, else date+time
  let d: Date | null = null;

  if (ev?.startsAt) {
    const t = new Date(ev.startsAt);
    if (Number.isFinite(t.getTime())) d = t;
  } else if (typeof ev?.date === "string" && typeof ev?.time === "string") {
    // best-effort: treat date+time as local and show it
    const isoGuess = `${ev.date}T${ev.time}:00`;
    const t = new Date(isoGuess);
    if (Number.isFinite(t.getTime())) d = t;
  }

  if (!d) return { dateLabel: "Date not set", timeLabel: "" };

  const dateLabel = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  });

  const timeLabel = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });

  return { dateLabel, timeLabel };
}

function getAttendeeClerkId(a: any) {
  // ✅ supports: string ids OR objects
  if (typeof a === "string") return a;
  return String(a?.clerkUserId || a?.clerkId || a?.clerk_id || a?.userId || a?.id || "");
}

export default function PersonBookingSheet({
  visible,
  onClose,
  person,
  onEditDetails,
  onStatusChanged,
}: Props) {
  const router = useRouter();
  const { userId } = useAuth();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const eventId = String(
    (person as any)?._id?.$oid ||
      (person as any)?._id?.oid ||
      (person as any)?._id ||
      (person as any)?.id ||
      (person as any)?.eventId ||
      ""
  );

  const creatorClerkId =
    (person as any)?.creatorClerkId ||
    (person as any)?.creator?.clerkUserId ||
    (person as any)?.creatorId ||
    "";

  const kind: "free" | "service" = ((person as any)?.kind || "free") as any;
  const priceLabel = moneyFromCents((person as any)?.priceCents);
  const isCreator = !!userId && !!creatorClerkId && String(userId) === String(creatorClerkId);

  // status (for service)
  const [statusLocal, setStatusLocal] = useState<string>("active");
  const status = statusLocal;
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [togglingService, setTogglingService] = useState(false);

  // description expand
  const [descExpanded, setDescExpanded] = useState(false);
  const descriptionText = pickFirst((person as any)?.description, (person as any)?.desc, "");

  // attendees
  const attendeeIds = useMemo(() => {
    const arr = (person as any)?.attendees;
    if (!Array.isArray(arr)) return [];
    return arr.map(getAttendeeClerkId).map((x) => String(x).trim()).filter(Boolean);
  }, [person]);

  // location
  const details = useMemo(() => {
    if (!person) return null;

    const loc = (person as any)?.location || {};
    const address = pickFirst(loc.formattedAddress, loc.address, (person as any)?.address, "");
    const city = pickFirst(loc.city, (person as any)?.city);
    const region = pickFirst(loc.admin1Code, loc.admin1, (person as any)?.region, (person as any)?.state);
    const country = pickFirst(loc.countryCode, loc.country, (person as any)?.country);

    const locationLine = [city, region, country].filter(Boolean).join(", ");
    const { dateLabel, timeLabel } = formatDateTime(person);

    return {
      address,
      locationLine,
      dateLabel,
      timeLabel,
    };
  }, [person]);

  // hydrate per open
  useEffect(() => {
    if (!visible || !person) return;
    const s = String((person as any)?.status || "active");
    setStatusLocal(s);
    setServiceEnabled(s.toLowerCase() !== "paused");
    setDescExpanded(false);
  }, [visible, eventId, person]);

  // creator fetch
  const [creator, setCreator] = useState<any | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);

  useEffect(() => {
    if (!visible || !API_BASE || !creatorClerkId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingCreator(true);
        const url = `${API_BASE}/api/users/get-user?clerkUserId=${encodeURIComponent(creatorClerkId)}`;
        const res = await fetch(url, { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        setCreator(res.ok ? json?.user ?? null : null);
      } catch {
        if (!cancelled) setCreator(null);
      } finally {
        if (!cancelled) setLoadingCreator(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, API_BASE, EVENT_API_KEY, creatorClerkId]);

  const creatorName = pickFirst(
    creator?.profile?.firstName && creator?.profile?.lastName
      ? `${creator.profile.firstName} ${creator.profile.lastName}`
      : "",
    creator?.profile?.firstName,
    "Creator"
  );

  const creatorPhoto = pickFirst(
    creator?.profile?.photos?.[0],
    creator?.profile?.photoUrl,
    creator?.profile?.avatarUrl,
    creator?.avatarUrl,
    ""
  );

  const creatorAbout = pickFirst(creator?.profile?.about, "");

  const actionLabel = isCreator
    ? "Edit details"
    : kind === "free"
    ? "Join"
    : status.toLowerCase() === "paused"
    ? "Paused"
    : priceLabel
    ? `Book • ${priceLabel}`
    : "Book";

  const ctaDisabled = !isCreator && kind === "service" && status.toLowerCase() === "paused";

  const onPrimary = () => {
    if (!person) return;
    if (isCreator) {
      close(() => onEditDetails?.(person));
      return;
    }
    // free join handled by JoinEventButton
    // service booking flow can go here
  };

  const goToCreatorProfile = () => {
    if (!creatorClerkId) return;
    router.push({ pathname: "/newtab/profile", params: { clerkUserId: creatorClerkId } } as any);
  };

  // service toggle
  const patchServiceEnabled = async (next: boolean) => {
    if (!API_BASE || !eventId || !creatorClerkId) return;

    const prevEnabled = serviceEnabled;
    const prevStatus = statusLocal;
    const optimisticStatus = next ? "active" : "paused";

    setServiceEnabled(next);
    setStatusLocal(optimisticStatus);
    onStatusChanged?.(eventId, optimisticStatus);

    try {
      setTogglingService(true);

      const res = await fetch(`${API_BASE}/api/events/toggle-service`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({
          _id: eventId,
          creatorClerkId,
          enabled: next,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to toggle");

      const newStatus = String(json?.status || json?.event?.status || optimisticStatus);
      setStatusLocal(newStatus);
      setServiceEnabled(newStatus.toLowerCase() !== "paused");
      onStatusChanged?.(eventId, newStatus);
    } catch {
      setServiceEnabled(prevEnabled);
      setStatusLocal(prevStatus);
      onStatusChanged?.(eventId, prevStatus);
    } finally {
      setTogglingService(false);
    }
  };

  // animations
  const a = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    if (!visible) return;
    a.setValue(0);
    cardY.setValue(22);

    Animated.parallel([
      Animated.timing(a, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, a, cardY]);

  const close = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(a, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardY, {
        toValue: 14,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
        after?.();
      }
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => close()}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      hardwareAccelerated
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => close()}>
        <Animated.View style={[styles.dim, { opacity: a }]} />
      </Pressable>

      <Animated.View style={[styles.sheet, { opacity: a, transform: [{ translateY: cardY }] }]}>
        {!person ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No event selected</Text>
            <Pressable onPress={() => close()} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Close</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.handle} />
              <View style={styles.headerRow}>
                <Pressable onPress={() => close()} hitSlop={12} style={styles.iconCircle}>
                  <Ionicons name="close" size={18} color="#0F172A" />
                </Pressable>

                <View style={styles.headerCenter}>
                  <Text style={styles.headerKicker}>{kind === "service" ? "Service" : "Event"}</Text>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {(person as any)?.title || "Untitled"}
                  </Text>
                </View>

                <View style={styles.rightChip}>
                  <Text style={styles.rightChipEmoji}>{(person as any)?.emoji || "📍"}</Text>
                </View>
              </View>

              {/* Meta row */}
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Ionicons name="calendar-outline" size={14} color="#166534" />
                  <Text style={styles.metaText}>{details?.dateLabel || "Date"}</Text>
                  {!!details?.timeLabel ? <Text style={styles.metaDot}>•</Text> : null}
                  {!!details?.timeLabel ? <Text style={styles.metaText}>{details.timeLabel}</Text> : null}
                </View>

                {kind === "service" ? (
                  <View style={[styles.metaPill, styles.metaPillStrong]}>
                    <Ionicons name="pricetag-outline" size={14} color="#166534" />
                    <Text style={[styles.metaText, styles.metaTextStrong]}>{priceLabel || "$0.00"}</Text>
                  </View>
                ) : null}
              </View>

              {/* Location */}
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="rgba(15,23,42,0.55)" />
                <Text style={styles.locationText} numberOfLines={2}>
                  {details?.locationLine || details?.address || "Location not available"}
                </Text>
              </View>
            </View>

            {/* Body */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              {/* Creator card */}
              <Pressable onPress={goToCreatorProfile} style={({ pressed }) => [styles.creatorCard, pressed && styles.pressed]}>
                <View style={styles.creatorAvatarWrap}>
                  {creatorPhoto ? (
                    <Image source={{ uri: creatorPhoto }} style={styles.creatorAvatar} />
                  ) : (
                    <View style={styles.creatorAvatarFallback}>
                      <Ionicons name="person" size={18} color="#14532D" />
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.creatorTopLine}>
                    <Text style={styles.creatorName} numberOfLines={1}>
                      {creatorName}
                    </Text>
                    {loadingCreator ? <ActivityIndicator size="small" /> : <Ionicons name="chevron-forward" size={16} color="#94A3B8" />}
                  </View>
                  <Text style={styles.creatorAbout} numberOfLines={2}>
                    {creatorAbout || "View profile"}
                  </Text>
                </View>
              </Pressable>

              {/* Service toggle */}
              {isCreator && kind === "service" ? (
                <View style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                      <View style={styles.greenDot} />
                      <Text style={styles.cardTitle}>Availability</Text>
                    </View>

                    {togglingService ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Switch
                        value={serviceEnabled}
                        onValueChange={patchServiceEnabled}
                        trackColor={{ false: "rgba(100,116,139,0.20)", true: "rgba(34,197,94,0.35)" }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="rgba(100,116,139,0.20)"
                      />
                    )}
                  </View>
                  <Text style={styles.cardHint}>Turn off to pause bookings for this service.</Text>
                </View>
              ) : null}

              {/* Description */}
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitle}>About</Text>
                  {!!descriptionText ? (
                    <Pressable onPress={() => setDescExpanded((v) => !v)} hitSlop={10}>
                      <Text style={styles.link}>{descExpanded ? "Show less" : "Show more"}</Text>
                    </Pressable>
                  ) : null}
                </View>

                <Text style={styles.cardBody} numberOfLines={descExpanded ? 0 : 4}>
                  {descriptionText || "No description provided."}
                </Text>
              </View>

              {/* Address */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Address</Text>
                <Text style={styles.cardBody}>{details?.address || details?.locationLine || "Not available"}</Text>
              </View>

              <View style={{ height: 160 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              {/* ✅ attendees ABOVE join */}
              <AttendeeStack visible={visible} apiBase={API_BASE} apiKey={EVENT_API_KEY} attendeeIds={attendeeIds} />

              {isCreator ? (
                <Pressable onPress={onPrimary} style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]}>
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryText}>{actionLabel}</Text>
                </Pressable>
              ) : kind === "free" ? (
                <JoinEventButton
                  eventId={String((person as any)?._id || (person as any)?.id || "")}
                  kind={((person as any)?.kind || "free") as any}
                  priceCents={(person as any)?.priceCents ?? null}
                  onJoined={() => close()}
                />
              ) : (
                <Pressable
                  onPress={ctaDisabled ? undefined : onPrimary}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && !ctaDisabled && styles.primaryPressed,
                    ctaDisabled && styles.primaryDisabled,
                  ]}
                >
                  <Ionicons name={ctaDisabled ? "pause-circle-outline" : "card-outline"} size={18} color="#FFFFFF" />
                  <Text style={styles.primaryText}>{actionLabel}</Text>
                </Pressable>
              )}

              <Pressable onPress={() => close()} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryPressed]}>
                <Text style={styles.secondaryBtnText}>Dismiss</Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}
