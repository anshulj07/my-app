import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import type { EventPin } from "../Map/MapView";

type Props = {
  visible: boolean;
  onClose: () => void;
  person?: EventPin | null;
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

export default function PersonBookingSheet({ visible, onClose, person }: Props) {
  const router = useRouter();
  const { userId } = useAuth();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const creatorClerkId =
    (person as any)?.creatorClerkId ||
    (person as any)?.creator?.clerkUserId ||
    (person as any)?.creatorId ||
    "";

  const kind: "free" | "service" = ((person as any)?.kind || "free") as any;
  const priceLabel = moneyFromCents((person as any)?.priceCents);
  const status = ((person as any)?.status || "active") as string;

  const isCreator = !!userId && !!creatorClerkId && userId === creatorClerkId;

  const details = useMemo(() => {
    if (!person) return null;

    const loc = (person as any)?.location || {};
    const address = pickFirst(loc.formattedAddress, loc.address, (person as any)?.address, "");
    const city = pickFirst(loc.city, (person as any)?.city);
    const region = pickFirst(loc.admin1Code, loc.admin1, (person as any)?.region, (person as any)?.state);
    const country = pickFirst(loc.countryCode, (person as any)?.country);

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
      lat: (person as any)?.lat,
      lng: (person as any)?.lng,
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
    ? "Edit event"
    : kind === "free"
      ? "Join free event"
      : priceLabel
        ? `Book service • ${priceLabel}`
        : "Book service";

  const onPrimary = () => {
    if (!person) return;

    if (isCreator) {
      // change to your edit route if you have one
      router.push({ pathname: "/newtab/edit-event", params: { id: String((person as any)?._id || "") } } as any);
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

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.bg}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.sheet}>
              {!person ? (
                <Text style={styles.placeholder}>Nothing selected</Text>
              ) : (
                <>
                  <View style={styles.grabber} />

                  {/* Hero */}
                  <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>{(person as any)?.emoji || "📍"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title} numberOfLines={2}>
                        {person.title}
                      </Text>

                      <View style={styles.chips}>
                        <View style={[styles.chip, kind === "service" ? styles.chipPurple : styles.chipGreen]}>
                          <Text style={styles.chipText}>
                            {kind === "service" ? (priceLabel ? `Service • ${priceLabel}` : "Service") : "Free"}
                          </Text>
                        </View>

                        <View style={[styles.chip, status === "active" ? styles.chipBlue : styles.chipGray]}>
                          <Text style={styles.chipText}>{status}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Creator */}
                  <Pressable onPress={goToCreatorProfile} style={styles.creatorCard}>
                    <View style={styles.avatarWrap}>
                      {creatorPhoto ? (
                        <Image source={{ uri: creatorPhoto }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarFallbackText}>👤</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.creatorName}>{creatorName}</Text>
                      <Text style={styles.creatorAbout} numberOfLines={1}>
                        {creatorAbout || "Tap to view profile"}
                      </Text>
                    </View>

                    {loadingCreator && <ActivityIndicator />}
                  </Pressable>

                  {/* Details */}
                  <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
                    <View style={styles.block}>
                      <Text style={styles.blockLabel}>When</Text>
                      <Text style={styles.blockValue}>{details?.when || "Not set"}</Text>
                    </View>

                    <View style={styles.block}>
                      <Text style={styles.blockLabel}>Location</Text>
                      <Text style={styles.blockValue}>
                        {details?.locationLine || details?.address || "Not available"}
                      </Text>
                      {!!details?.address && <Text style={styles.subValue}>{details.address}</Text>}
                    </View>

                    {!!details?.tags?.length && (
                      <View style={styles.block}>
                        <Text style={styles.blockLabel}>Tags</Text>
                        <Text style={styles.blockValue}>{details.tags.join(", ")}</Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Action */}
                  <TouchableOpacity style={styles.primary} activeOpacity={0.9} onPress={onPrimary}>
                    <Text style={styles.primaryText}>{actionLabel}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(2,6,23,0.55)", justifyContent: "flex-end" },
  sheet: {
    height: "82%",
    backgroundColor: "#0B1220",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  grabber: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.35)",
    marginBottom: 12,
  },
  placeholder: { color: "rgba(226,232,240,0.75)", textAlign: "center", marginTop: 20 },

  hero: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
  },
  heroEmoji: { fontSize: 34 },
  title: { color: "#E2E8F0", fontWeight: "900", fontSize: 18 },

  chips: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { color: "#E2E8F0", fontWeight: "800", fontSize: 12 },
  chipGreen: { backgroundColor: "rgba(34,197,94,0.14)", borderColor: "rgba(34,197,94,0.25)" },
  chipPurple: { backgroundColor: "rgba(139,92,246,0.16)", borderColor: "rgba(139,92,246,0.28)" },
  chipBlue: { backgroundColor: "rgba(59,130,246,0.16)", borderColor: "rgba(59,130,246,0.28)" },
  chipGray: { backgroundColor: "rgba(148,163,184,0.12)", borderColor: "rgba(148,163,184,0.22)" },

  creatorCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
  },
  avatarWrap: { width: 48, height: 48, borderRadius: 18, overflow: "hidden" },
  avatar: { width: "100%", height: "100%" },
  avatarFallback: { flex: 1, backgroundColor: "rgba(148,163,184,0.18)", alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontSize: 18 },
  creatorName: { color: "#E2E8F0", fontWeight: "900", fontSize: 14 },
  creatorAbout: { color: "rgba(226,232,240,0.72)", fontWeight: "700", marginTop: 2, fontSize: 12 },

  block: {
    marginTop: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  blockLabel: { color: "rgba(226,232,240,0.72)", fontWeight: "800", fontSize: 12 },
  blockValue: { color: "#E2E8F0", fontWeight: "900", fontSize: 13, marginTop: 6 },
  subValue: { color: "rgba(226,232,240,0.68)", fontWeight: "700", fontSize: 12, marginTop: 6 },

  primary: {
    marginTop: 14,
    backgroundColor: "#0A84FF",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});
