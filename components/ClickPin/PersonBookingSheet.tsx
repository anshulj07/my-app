import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
  Platform,
  Switch,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { EventPin } from "../Map/MapView";
import JoinEventButton from "./JoinEventButton";
import { styles } from "./PersonBookingSheet.style";

type Props = {
  visible: boolean;
  onClose: () => void;
  person?: EventPin | null;
  onEditDetails?: (ev: EventPin) => void;
  onStatusChanged?: (eventId: string, nextStatus: string) => void;
};

function formatDateLong(ev: any) {
  // Prefer startsAt if present, else fallback to YYYY-MM-DD in ev.date
  let d: Date | null = null;

  if (ev?.startsAt) {
    const t = new Date(ev.startsAt);
    if (Number.isFinite(t.getTime())) d = t;
  }

  if (!d && typeof ev?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
    const [y, m, day] = ev.date.split("-").map(Number);
    d = new Date(Date.UTC(y, m - 1, day));
  }

  if (!d) return "";

  // Force a stable date-only output (no time)
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "2-digit",
    timeZone: "UTC",
  });
}
// Example output: "25 December 25"


function pickFirst(...vals: Array<any>) {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}

function moneyFromCents(cents: any) {
  const n = typeof cents === "string" ? Number(cents) : cents;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  return `$${(n / 100).toFixed(2)}`;
}

function titleCase(s: string) {
  return (s || "").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PersonBookingSheet({ visible, onClose, person, onEditDetails, onStatusChanged }: Props) {
  const router = useRouter();
  const { userId } = useAuth();

  const eventId = String(
    (person as any)?._id?.$oid ||
    (person as any)?._id?.oid ||
    (person as any)?._id ||
    (person as any)?.id ||
    (person as any)?.eventId ||
    ""
  );

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const creatorClerkId =
    (person as any)?.creatorClerkId ||
    (person as any)?.creator?.clerkUserId ||
    (person as any)?.creatorId ||
    "";

  const kind: "free" | "service" = ((person as any)?.kind || "free") as any;
  const priceLabel = moneyFromCents((person as any)?.priceCents);

  const isCreator = !!userId && !!creatorClerkId && String(userId) === String(creatorClerkId);

  // ---- local status (so creator toggle can update immediately) ----
  const [statusLocal, setStatusLocal] = useState<string>("active");
  const status = statusLocal;

  // service-only creator toggle (quick enable/disable service listing)
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [togglingService, setTogglingService] = useState(false);

  // description
  const [descExpanded, setDescExpanded] = useState(false);
  const descriptionText = pickFirst((person as any)?.description, (person as any)?.desc, "");

  // hydrate local status/toggle each open
  useEffect(() => {
    if (!visible || !person) return;
    const s = String((person as any)?.status || "active");
    setStatusLocal(s);
    setServiceEnabled(s.toLowerCase() !== "paused"); // if you store "paused"
    setDescExpanded(false);
  }, [visible, eventId, person]);

  const details = useMemo(() => {
    if (!person) return null;

    const loc = (person as any)?.location || {};
    const address = pickFirst(loc.formattedAddress, loc.address, (person as any)?.address, "");
    const city = pickFirst(loc.city, (person as any)?.city);
    const region = pickFirst(loc.admin1Code, loc.admin1, (person as any)?.region, (person as any)?.state);
    const country = pickFirst(loc.countryCode, loc.country, (person as any)?.country);

    const tags = Array.isArray((person as any)?.tags) ? ((person as any).tags as string[]) : [];


    return {
      address,
      locationLine: [city, region, country].filter(Boolean).join(", "),
      dateLabel: formatDateLong(person),
      tags,
    };
  }, [person]);


  // ---- fetch creator from assist_users.users ----
  const [creator, setCreator] = useState<any | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!API_BASE) return;
    if (!creatorClerkId) return;

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

  const creatorAbout = pickFirst(creator?.profile?.about, "");
  const creatorPhoto = (creator?.profile?.photos && creator.profile.photos[0]) || "";

  const actionLabel = isCreator
    ? "Edit details"
    : kind === "free"
      ? "Join event"
      : status.toLowerCase() === "paused"
        ? "Service paused"
        : priceLabel
          ? `Book • ${priceLabel}`
          : "Book service";

  const onPrimary = () => {
    if (!person) return;

    if (isCreator) {
      close(() => onEditDetails?.(person));
      return;
    }

    if (kind === "free") {
      // join flow here
      return;
    }

    // booking flow here
  };

  const goToCreatorProfile = () => {
    if (!creatorClerkId) return;
    router.push({ pathname: "/newtab/profile", params: { clerkUserId: creatorClerkId } } as any);
  };

  // ---- creator toggle: patch status quickly (service only, creator only) ----
  const patchServiceEnabled = async (next: boolean) => {
    if (!API_BASE || !eventId || !creatorClerkId) return;

    const prevEnabled = serviceEnabled;
    const prevStatus = statusLocal;

    const optimisticStatus = next ? "active" : "paused";

    // ✅ optimistic UI
    setServiceEnabled(next);
    setStatusLocal(optimisticStatus);
    onStatusChanged?.(eventId, optimisticStatus); // ✅ tell Home immediately

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
      if (!res.ok) throw new Error(json?.error || "Failed to toggle service");

      const newStatus = String(
        json?.status || json?.event?.status || optimisticStatus
      );

      setStatusLocal(newStatus);
      setServiceEnabled(newStatus.toLowerCase() !== "paused");
      onStatusChanged?.(eventId, newStatus); // ✅ confirm final status
    } catch (e) {
      // ✅ revert UI + revert parent
      setServiceEnabled(prevEnabled);
      setStatusLocal(prevStatus);
      onStatusChanged?.(eventId, prevStatus); // ✅ revert parent too
    } finally {
      setTogglingService(false);
    }
  };
  // ------- Animations -------
  const a = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (!visible) return;
    a.setValue(0);
    cardY.setValue(18);

    Animated.parallel([
      Animated.timing(a, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardY, {
        toValue: 0,
        duration: 360,
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
        toValue: 10,
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

  const statusTone =
    status.toLowerCase() === "active"
      ? styles.toneActive
      : status.toLowerCase() === "paused"
        ? styles.tonePaused
        : styles.toneMuted;

  const kindTone = kind === "service" ? styles.toneService : styles.toneFree;

  const ctaDisabled = !isCreator && kind === "service" && status.toLowerCase() === "paused";

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
      {/* Dim background */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => close()}>
        <Animated.View style={[styles.dim, { opacity: a }]} />
      </Pressable>

      {/* Full screen card stack */}
      <Animated.View style={[styles.shell, { opacity: a, transform: [{ translateY: cardY }] }]}>
        {!person ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No event selected</Text>
            <Pressable onPress={() => close()} style={styles.closePill}>
              <Text style={styles.closePillText}>Close</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* HERO */}
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <Pressable onPress={() => close()} hitSlop={12} style={styles.iconBtn}>
                  <Ionicons name="chevron-down" size={18} color="#E2E8F0" />
                </Pressable>

                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  {isCreator ? (
                    <View style={[styles.miniBadge, styles.miniBadgeYou]}>
                      <Ionicons name="shield-checkmark" size={14} color="#fff" />
                      <Text style={styles.miniBadgeText}>You</Text>
                    </View>
                  ) : null}

                  <View style={[styles.miniBadge, kindTone]}>
                    <Ionicons name={kind === "service" ? "sparkles" : "leaf"} size={14} color="#fff" />
                    <Text style={styles.miniBadgeText}>{kind === "service" ? "Service" : "Free"}</Text>
                  </View>

                  <View style={[styles.miniBadge, statusTone]}>
                    <Ionicons name={status.toLowerCase() === "active" ? "checkmark" : "time"} size={14} color="#fff" />
                    <Text style={styles.miniBadgeText}>{titleCase(status)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroMain}>
                <View style={styles.emojiHalo}>
                  <Text style={styles.emoji}>{(person as any)?.emoji || "📍"}</Text>
                </View>

                <Text style={styles.heroTitle} numberOfLines={2}>
                  {(person as any)?.title || "Untitled"}
                </Text>

                <Text style={styles.heroSub} numberOfLines={2}>
                  {details?.locationLine || details?.address || "Location not available"}
                </Text>

                <View style={styles.heroChips}>
                  <View style={styles.bigChip}>
                    <Ionicons name="calendar-outline" size={16} color="rgba(226,232,240,0.92)" />
                    <Text style={styles.bigChipText}>{details?.dateLabel || "Date not set"}</Text>
                  </View>

                  {kind === "service" && priceLabel ? (
                    <View style={[styles.bigChip, styles.bigChipAccent]}>
                      <Ionicons name="cash-outline" size={16} color="#fff" />
                      <Text style={[styles.bigChipText, { color: "#fff" }]}>{priceLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* BODY */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
            >
              {/* Creator */}
              <Pressable
                onPress={goToCreatorProfile}
                style={({ pressed }) => [styles.creatorRow, pressed && styles.creatorRowPressed]}
              >
                <View style={styles.creatorAvatarWrap}>
                  {creatorPhoto ? (
                    <Image source={{ uri: creatorPhoto }} style={styles.creatorAvatar} />
                  ) : (
                    <View style={styles.creatorAvatarFallback}>
                      <Ionicons name="person" size={18} color="rgba(226,232,240,0.88)" />
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <Text style={styles.creatorRowName} numberOfLines={1}>
                      {creatorName}
                    </Text>
                    {loadingCreator ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Ionicons name="open-outline" size={16} color="rgba(148,163,184,0.8)" />
                    )}
                  </View>
                  <Text style={styles.creatorRowAbout} numberOfLines={2}>
                    {creatorAbout || "View creator profile"}
                  </Text>
                </View>
              </Pressable>

              {/* ✅ Creator-only toggle (service only) */}
              {isCreator && kind === "service" ? (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                      <Ionicons name="radio-outline" size={16} color="rgba(226,232,240,0.92)" />
                      <Text style={styles.sectionTitle}>Service availability</Text>
                    </View>

                    {togglingService ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Switch
                        value={serviceEnabled}
                        onValueChange={patchServiceEnabled}
                        trackColor={{
                          false: "rgba(148,163,184,0.22)",  // soft slate
                          true: "rgba(10,132,255,0.55)",   // premium blue glow
                        }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="rgba(148,163,184,0.22)"
                      />

                    )}
                  </View>

                  <Text style={styles.sectionHint}>
                    Turn off to pause bookings for this service.
                  </Text>
                </View>
              ) : null}

              {/* ✅ Description */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Ionicons name="document-text-outline" size={16} color="rgba(226,232,240,0.92)" />
                    <Text style={styles.sectionTitle}>Description</Text>
                  </View>

                  {!!descriptionText ? (
                    <Pressable onPress={() => setDescExpanded((v) => !v)} hitSlop={10}>
                      <Text style={styles.linkText}>{descExpanded ? "Less" : "More"}</Text>
                    </Pressable>
                  ) : null}
                </View>

                <Text style={styles.descText} numberOfLines={descExpanded ? 0 : 3}>
                  {descriptionText || "No description provided."}
                </Text>
              </View>

              {/* Info grid */}
              <View style={styles.grid}>
                {/* <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>Type</Text>
                  <Text style={styles.gridValue}>{kind === "service" ? "Service" : "Free event"}</Text>
                </View> */}

                {/* <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>Status</Text>
                  <Text style={styles.gridValue}>{titleCase(status)}</Text>
                </View> */}

                <View style={[styles.gridCard, { width: "100%" }]}>
                  <Text style={styles.gridLabel}>Address</Text>
                  <Text style={styles.gridValue} numberOfLines={3}>
                    {details?.address || details?.locationLine || "Not available"}
                  </Text>
                </View>

                {!!details?.tags?.length ? (
                  <View style={[styles.gridCard, { width: "100%" }]}>
                    <Text style={styles.gridLabel}>Tags</Text>
                    <Text style={styles.gridValue}>{details.tags.join(" • ")}</Text>
                  </View>
                ) : null}
              </View>

              <View style={{ height: 140 }} />
            </ScrollView>

            {/* STICKY CTA */}
            <View style={styles.ctaBar}>
              {isCreator ? (
                <Pressable onPress={onPrimary} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                  <View style={styles.ctaGlow} />
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={styles.ctaText}>{actionLabel}</Text>
                </Pressable>
              ) : kind === "free" ? (
                <JoinEventButton eventId={String((person as any)?._id || (person as any)?.id || "")} onJoined={() => close()} />
              ) : (
                <Pressable
                  onPress={ctaDisabled ? undefined : onPrimary}
                  style={({ pressed }) => [
                    styles.cta,
                    pressed && !ctaDisabled && styles.ctaPressed,
                    ctaDisabled && styles.ctaDisabled,
                  ]}
                >
                  <View style={styles.ctaGlow} />
                  <Ionicons name={ctaDisabled ? "pause-circle-outline" : "card-outline"} size={18} color="#fff" />
                  <Text style={styles.ctaText}>{actionLabel}</Text>
                </Pressable>
              )}

              <Pressable onPress={() => close()} style={({ pressed }) => [styles.ctaGhost, pressed && styles.ctaGhostPressed]}>
                <Text style={styles.ctaGhostText}>Dismiss</Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

