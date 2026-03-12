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
  Alert,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { EventPin } from "../Map/MapView";
import JoinEventButton from "./JoinEventButton";
import { styles } from "./PersonBookingSheet.style";
import { apiFetch } from "../../lib/apiFetch";

type Props = {
  visible: boolean;
  onClose: () => void;
  person?: EventPin | null;
  onEditDetails?: (ev: EventPin) => void;
  onStatusChanged?: (eventId: string, nextStatus: string) => void;
  onDeleteEvent?: (eventId: string) => void;
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

export default function PersonBookingSheet({ visible, onClose, person, onEditDetails, onStatusChanged, onDeleteEvent }: Props) {
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

  const kind: "free" | "service" | "paid" | "event_free" | "event_paid" = ((person as any)?.kind || "free") as any;
  const isPaid = kind === "paid" || kind === "event_paid";
  const priceLabel = moneyFromCents((person as any)?.priceCents);
  const priceCents: number | null = (person as any)?.priceCents ?? null;

  const isCreator = !!userId && !!creatorClerkId && String(userId) === String(creatorClerkId);

  // ✅ Delete event handler
  const handleDelete = () => {
    Alert.alert(
      "Delete Event?",
      "This will permanently delete the event. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!API_BASE || !eventId || !userId) return;
            try {
              await apiFetch(`${API_BASE}/api/events/delete-event`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
                },
                body: JSON.stringify({ eventId, creatorClerkId: userId }),
              });
              close(() => onDeleteEvent?.(eventId));
            } catch {
              Alert.alert("Error", "Failed to delete event. Please try again.");
            }
          },
        },
      ]
    );
  };

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
    const attendees = Array.isArray((person as any)?.attendees) ? (person as any).attendees : [];
    const pendingRequests = Array.isArray((person as any)?.pendingRequests) ? (person as any).pendingRequests : [];
    const attendance = (person as any)?.attendance; // capacity

    const isPending = !!userId && pendingRequests.some((p: any) => String(p.clerkUserId) === String(userId));

    return {
      address,
      locationLine: [city, region, country].filter(Boolean).join(", "),
      dateLabel: formatDateLong(person),
      tags,
      joinedCount: attendees.length,
      capacity: typeof attendance === "number" ? attendance : parseInt(String(attendance || ""), 10) || null,
      isPending,
      joinPolicy: (person as any)?.joinPolicy as "open" | "approval" | undefined,
    };
  }, [person, userId]);


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
        const res = await apiFetch(url, { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined });
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
    : isPaid && priceCents
      ? `Pay ₹${(priceCents / 100).toFixed(0)} & Join`
      : kind === "service"
        ? status.toLowerCase() === "paused"
          ? "Service paused"
          : priceLabel
            ? `Book • ${priceLabel}`
            : "Book service"
        : details?.joinPolicy === "approval"
          ? "Request to Join"
          : "Join Event";

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
    router.push({
      pathname: "/profile/[clerkUserId]",
      params: {
        clerkUserId: creatorClerkId,
        name: creatorName || "",
        imageUrl: creatorPhoto || "",
      },
    } as any);
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

      const res = await apiFetch(`${API_BASE}/api/events/toggle-service`, {
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

  const kindTone = kind === "service" || isPaid ? styles.toneService : styles.toneFree;

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
                    <Ionicons name={kind === "service" ? "sparkles" : isPaid ? "card" : "leaf"} size={14} color="#fff" />
                  <Text style={styles.miniBadgeText}>{kind === "service" ? "Service" : isPaid ? "Paid" : "Free"}</Text>
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

                  {kind === "free" ? (
                    <View style={[
                      styles.bigChip,
                      details?.isPending ? { borderColor: "rgba(245,158,11,0.4)" } :
                      (!!details?.capacity && details.joinedCount >= details.capacity) ? { borderColor: "rgba(248,113,113,0.4)" } : undefined
                    ]}>
                      <Ionicons
                        name={details?.isPending ? "time-outline" : "people-outline"}
                        size={16}
                        color={details?.isPending ? "#F59E0B" : (!!details?.capacity && details.joinedCount >= details.capacity) ? "#F87171" : "rgba(226,232,240,0.92)"}
                      />
                      <Text style={[
                        styles.bigChipText,
                        details?.isPending ? { color: "#F59E0B" } :
                        (!!details?.capacity && details.joinedCount >= details.capacity) ? { color: "#F87171" } : undefined
                      ]}>
                        {details?.isPending ? "Awaiting Approval" :
                         details?.capacity
                          ? `${details.joinedCount} / ${details.capacity} joined`
                          : `${details?.joinedCount || 0} joined`
                        }
                      </Text>
                    </View>
                  ) : null}

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
              {/* ✅ Pending Approval Banner */}
              {details?.isPending && (
                <View style={styles.pendingBanner}>
                  <View style={styles.pendingIconWrap}>
                    <Ionicons name="hourglass" size={20} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingBannerTitle}>Request under review</Text>
                    <Text style={styles.pendingBannerSub}>The host will notify you once you're admitted.</Text>
                  </View>
                </View>
              )}

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

              {/* ✅ Spot Availability (Prominent Dashboard) */}
              {kind === "free" && details && (
                <View style={styles.capacityCard}>
                  <View style={styles.capacityHeader}>
                    <View style={styles.capacityLabelRow}>
                      <Ionicons name="people" size={16} color="#0A84FF" />
                      <Text style={styles.sectionTitle}>Spot Availability</Text>
                    </View>
                    <View style={[
                      styles.capacityStatus,
                      details.capacity && details.joinedCount >= details.capacity ? styles.capacityStatusFull :
                      details.joinPolicy === "approval" ? styles.capacityStatusApproval : undefined
                    ]}>
                      <Text style={[
                        styles.capacityStatusText,
                        details.capacity && details.joinedCount >= details.capacity ? styles.capacityStatusFullText :
                        details.joinPolicy === "approval" ? styles.capacityStatusApprovalText : undefined
                      ]}>
                        {details.capacity && details.joinedCount >= details.capacity ? "EVENT FULL" :
                         details.joinPolicy === "approval" ? "HOST APPROVAL" : "OPEN"}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  {details.capacity ? (
                    <View style={styles.progressBarContainer}>
                      <View style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(100, (details.joinedCount / details.capacity) * 100)}%`,
                          backgroundColor: details.joinedCount >= details.capacity ? "#F87171" : "#0A84FF"
                        }
                      ]} />
                    </View>
                  ) : (
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: "100%", backgroundColor: "#10B981" }]} />
                    </View>
                  )}

                  <View style={styles.capacityInfo}>
                    <Text style={styles.capacityJoinedText}>
                      {details.joinedCount} {details.joinedCount === 1 ? "person" : "people"} joined
                      {details.capacity ? ` of ${details.capacity}` : " (No limit)"}
                    </Text>
                    {details.capacity && (
                      <Text style={styles.capacityRemainingText}>
                        {Math.max(0, details.capacity - details.joinedCount)} spots left
                      </Text>
                    )}
                  </View>
                </View>
              )}

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
                <>
                  <Pressable onPress={onPrimary} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                    <View style={styles.ctaGlow} />
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={styles.ctaText}>{actionLabel}</Text>
                  </Pressable>
                  <Pressable onPress={handleDelete} style={({ pressed }) => [styles.ctaGhost, styles.ctaDelete, pressed && styles.ctaGhostPressed]}>
                    <Ionicons name="trash-outline" size={16} color="#F87171" />
                    <Text style={styles.ctaDeleteText}>Delete Event</Text>
                  </Pressable>
                </>
              ) : kind === "free" ? (
                <JoinEventButton
                  eventId={String((person as any)?._id || (person as any)?.id || "")}
                  kind={((person as any)?.kind || "free") as any}
                  priceCents={(person as any)?.priceCents ?? null}
                  joinPolicy={((person as any)?.joinPolicy || "open") as any}
                  onJoined={() => close()}
                />
              ) : (
                <JoinEventButton
                  eventId={eventId}
                  kind={kind as any}
                  priceCents={priceCents}
                  eventTitle={String((person as any)?.title || "Event")}
                  joinPolicy={((person as any)?.joinPolicy || "open") as any}
                  onJoined={() => close()}
                  disabled={kind === "service" && status.toLowerCase() === "paused"}
                />
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