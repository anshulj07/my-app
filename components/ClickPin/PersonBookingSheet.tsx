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
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { EventPin } from "../Map/MapView";
import JoinEventButton from "./JoinEventButton";


type Props = {
  visible: boolean;
  onClose: () => void;
  person?: EventPin | null;
  onEditDetails?: (ev: EventPin) => void;
};

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

export default function PersonBookingSheet({ visible, onClose, person, onEditDetails }: Props) {
  const router = useRouter();
  const { userId } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventPin | null>(null);
  const eventId = String((person as any)?._id || (person as any)?.id || (person as any)?.eventId || "");

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const creatorClerkId =
    (person as any)?.creatorClerkId ||
    (person as any)?.creator?.clerkUserId ||
    (person as any)?.creatorId ||
    "";

  const kind: "free" | "service" = ((person as any)?.kind || "free") as any;
  const priceLabel = moneyFromCents((person as any)?.priceCents);
  const status = String((person as any)?.status || "active");

  const isCreator = !!userId && !!creatorClerkId && String(userId) === String(creatorClerkId);

  const details = useMemo(() => {
    if (!person) return null;

    const loc = (person as any)?.location || {};
    const address = pickFirst(loc.formattedAddress, loc.address, (person as any)?.address, "");
    const city = pickFirst(loc.city, (person as any)?.city);
    const region = pickFirst(loc.admin1Code, loc.admin1, (person as any)?.region, (person as any)?.state);
    const country = pickFirst(loc.countryCode, loc.country, (person as any)?.country);

    const when =
      pickFirst(
        (person as any)?.when,
        (person as any)?.date && (person as any)?.time ? `${(person as any).date} · ${(person as any).time}` : "",
        (person as any)?.date
      ) || "";

    const tags = Array.isArray((person as any)?.tags) ? ((person as any).tags as string[]) : [];

    return {
      address,
      locationLine: [city, region, country].filter(Boolean).join(", "),
      when,
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
      : priceLabel
        ? `Book • ${priceLabel}`
        : "Book service";

  const onPrimary = () => {
    if (!person) return;

    if (isCreator) {
      close(() => onEditDetails?.(person)); // ✅ open edit modal after sheet closes
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

  // ------- Animations (completely new) -------
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
        after?.(); // ✅ ADD
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

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={() => close()}>
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
              {/* neon gradient-ish blobs (no libs) */}
              <View style={styles.blob1} />
              <View style={styles.blob2} />

              <View style={styles.heroTop}>
                <Pressable onPress={() => close()} hitSlop={12} style={styles.iconBtn}>
                  <Ionicons name="chevron-down" size={18} color="#E2E8F0" />
                </Pressable>

                <View style={{ flexDirection: "row", gap: 8 }}>
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
                  {person.title}
                </Text>

                <Text style={styles.heroSub} numberOfLines={2}>
                  {details?.locationLine || details?.address || "Location not available"}
                </Text>

                <View style={styles.heroChips}>
                  <View style={styles.bigChip}>
                    <Ionicons name="time-outline" size={16} color="rgba(226,232,240,0.92)" />
                    <Text style={styles.bigChipText}>{details?.when || "Time not set"}</Text>
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              {/* Creator horizontal card (new look) */}
              <Pressable onPress={goToCreatorProfile} style={({ pressed }) => [styles.creatorRow, pressed && styles.creatorRowPressed]}>
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
                    {loadingCreator ? <ActivityIndicator size="small" /> : <Ionicons name="open-outline" size={16} color="rgba(148,163,184,0.8)" />}
                  </View>
                  <Text style={styles.creatorRowAbout} numberOfLines={2}>
                    {creatorAbout || "View creator profile"}
                  </Text>
                </View>
              </Pressable>

              {/* Info grid (new) */}
              <View style={styles.grid}>
                <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>Type</Text>
                  <Text style={styles.gridValue}>{kind === "service" ? "Service" : "Free event"}</Text>
                </View>

                <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>Status</Text>
                  <Text style={styles.gridValue}>{titleCase(status)}</Text>
                </View>

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

              <View style={{ height: 120 }} />
            </ScrollView>

            {/* STICKY CTA (new) */}
            <View style={styles.ctaBar}>
              {isCreator ? (
                <Pressable onPress={onPrimary} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                  <View style={styles.ctaGlow} />
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={styles.ctaText}>{actionLabel}</Text>
                </Pressable>
              ) : kind === "free" ? (
                <JoinEventButton
                  eventId={String((person as any)?._id || (person as any)?.id || "")}
                  onJoined={() => close()}
                />
              ) : (
                <Pressable onPress={onPrimary} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                  <View style={styles.ctaGlow} />
                  <Ionicons name="card-outline" size={18} color="#fff" />
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

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  shell: {
    position: "absolute",
    left: 12,
    right: 12,
    top: Platform.OS === "ios" ? 56 : 28,
    bottom: 18,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#060913",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyTitle: { color: "#E2E8F0", fontWeight: "900", fontSize: 16, marginBottom: 12 },
  closePill: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  closePillText: { color: "rgba(226,232,240,0.9)", fontWeight: "900" },

  // HERO
  hero: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.10)",
  },
  blob1: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 360,
    left: -200,
    top: -220,
    backgroundColor: "rgba(34,211,238,0.18)",
  },
  blob2: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 340,
    right: -190,
    top: -250,
    backgroundColor: "rgba(168,85,247,0.18)",
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },

  miniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  miniBadgeText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  miniBadgeYou: { backgroundColor: "rgba(236,72,153,0.75)" },

  toneFree: { backgroundColor: "rgba(34,197,94,0.78)" },
  toneService: { backgroundColor: "rgba(139,92,246,0.78)" },
  toneActive: { backgroundColor: "rgba(59,130,246,0.78)" },
  tonePaused: { backgroundColor: "rgba(245,158,11,0.78)" },
  toneMuted: { backgroundColor: "rgba(148,163,184,0.55)" },

  heroMain: { marginTop: 14 },
  emojiHalo: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  emoji: { fontSize: 28 },

  heroTitle: { marginTop: 12, color: "#E2E8F0", fontWeight: "950" as any, fontSize: 20, letterSpacing: 0.2 },
  heroSub: { marginTop: 6, color: "rgba(226,232,240,0.70)", fontWeight: "700", lineHeight: 18 },

  heroChips: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 12 },
  bigChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },
  bigChipAccent: {
    backgroundColor: "rgba(10,132,255,0.85)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  bigChipText: { color: "rgba(226,232,240,0.92)", fontWeight: "900", fontSize: 13 },

  // BODY
  body: { padding: 14 },

  creatorRow: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.10)",
  },
  creatorRowPressed: { backgroundColor: "rgba(255,255,255,0.06)" },

  creatorAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },
  creatorAvatar: { width: "100%", height: "100%" },
  creatorAvatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },

  creatorRowName: { color: "#E2E8F0", fontWeight: "900", fontSize: 14 },
  creatorRowAbout: { marginTop: 4, color: "rgba(226,232,240,0.68)", fontWeight: "700", fontSize: 12, lineHeight: 16 },

  grid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCard: {
    width: "48%",
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.10)",
  },
  gridLabel: { color: "rgba(226,232,240,0.58)", fontWeight: "900", fontSize: 12 },
  gridValue: { marginTop: 6, color: "#E2E8F0", fontWeight: "900", fontSize: 13, lineHeight: 18 },

  // CTA
  ctaBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    gap: 10,
  },
  cta: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(10,132,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ctaPressed: { transform: [{ scale: 0.992 }], opacity: 0.96 },
  ctaGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    right: -140,
    top: -160,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  ctaText: { color: "#fff", fontWeight: "950" as any, fontSize: 15 },

  ctaGhost: {
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  ctaGhostPressed: { backgroundColor: "rgba(255,255,255,0.07)" },
  ctaGhostText: { color: "rgba(226,232,240,0.85)", fontWeight: "900" },
});
