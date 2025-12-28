import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Animated,
  SectionList,
  SectionListData,
  Switch,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "../MyBookingScreen.style";

export type EventKind = "free" | "paid" | "service";

export type EventDoc = {
  _id: string;
  title: string;
  emoji?: string;
  description?: string;

  creatorClerkId: string;

  kind: EventKind;
  priceCents: number | null;

  startsAt?: string | null;
  date?: string;
  time?: string;
  status?: string;

  attendance?: number | null;
  attendees?: string[];

  location?: { city?: string; admin1Code?: string; countryCode?: string };
};

type SectionT = { title: string; hint: string; data: EventDoc[] };

function eventStartMs(ev: EventDoc): number {
  if (ev.startsAt) {
    const t = new Date(ev.startsAt).getTime();
    if (Number.isFinite(t)) return t;
  }
  const date = (ev.date ?? "").trim();
  const time = (ev.time ?? "").trim();
  if (date && time) {
    const t = new Date(`${date}T${time}:00Z`).getTime();
    if (Number.isFinite(t)) return t;
  }
  if (date) {
    const t = new Date(`${date}T12:00:00Z`).getTime();
    if (Number.isFinite(t)) return t;
  }
  return Number.POSITIVE_INFINITY;
}

function fmtWhen(ev: EventDoc) {
  const ms = eventStartMs(ev);
  if (!Number.isFinite(ms) || ms === Number.POSITIVE_INFINITY) return "No time set";
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtWhere(ev: EventDoc) {
  const city = ev.location?.city?.trim();
  const s = ev.location?.admin1Code?.trim();
  const cc = ev.location?.countryCode?.trim();
  if (!city && !cc) return "Location not set";
  return `${city ?? ""}${s ? `, ${s}` : ""}${cc ? ` · ${cc}` : ""}`.trim();
}

function priceLabel(ev: EventDoc) {
  if (ev.kind === "free") return "FREE";
  return `$${((ev.priceCents ?? 0) / 100).toFixed(2)}`;
}

function kindLabel(ev: EventDoc) {
  if (ev.kind === "service") return "Service";
  if (ev.kind === "paid") return "Paid event";
  return "Free event";
}

function statusLabel(ev: EventDoc) {
  const s = String(ev.status || "active").toLowerCase();
  return s === "paused" ? "Paused" : "Active";
}

function isEnabled(ev: EventDoc) {
  return String(ev.status || "active").toLowerCase() !== "paused";
}

export default function CreatedTab({
  created,
  refreshing,
  onRefresh,
  toggleBusyById,
  onToggleServiceEnabled,
  onPressEvent,
}: {
  created: EventDoc[];
  refreshing: boolean;
  onRefresh: () => void;
  toggleBusyById: Record<string, boolean>;
  onToggleServiceEnabled: (ev: EventDoc, next: boolean) => void;
  onPressEvent: (ev: EventDoc) => void;
}) {
  const nowMs = Date.now();

  const sections = useMemo<SectionT[]>(() => {
    const upcoming = created
      .filter((e) => eventStartMs(e) >= nowMs)
      .sort((a, b) => eventStartMs(a) - eventStartMs(b));

    const pastCreated = created
      .filter((e) => eventStartMs(e) < nowMs)
      .sort((a, b) => eventStartMs(b) - eventStartMs(a));

    const out: SectionT[] = [];
    out.push({ title: "Upcoming", hint: "Events you created that haven’t started", data: upcoming });
    out.push({ title: "Past", hint: "Events you created earlier", data: pastCreated });
    return out.filter((s) => s.data.length > 0);
  }, [created, nowMs]);

  return (
    <SectionList
      sections={sections as SectionListData<EventDoc>[]}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySub}>Explore events to get started.</Text>
        </View>
      }
      renderSectionHeader={({ section }: any) => (
        <View style={styles.sectionHeaderWrap}>
          <View style={styles.sectionHeaderTop}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {!!section.hint && <Text style={styles.sectionHint}>{section.hint}</Text>}
          </View>
          <View style={styles.sectionDivider} />
        </View>
      )}
      renderItem={({ item, index }) => (
        <EventCard
          e={item}
          index={index}
          showToggle={item.kind === "service"}
          toggleBusy={!!toggleBusyById[item._id]}
          onToggle={(next) => onToggleServiceEnabled(item, next)}
          onPress={() => onPressEvent(item)}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

function EventCard({
  e,
  index,
  showToggle,
  toggleBusy,
  onToggle,
  onPress,
}: {
  e: EventDoc;
  index: number;
  showToggle: boolean;
  toggleBusy: boolean;
  onToggle: (next: boolean) => void;
  onPress: () => void;
}) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
    ]).start();
  }, [a, y, index]);

  const enabled = isEnabled(e);
  const statusTxt = statusLabel(e);

  const actionLabel = e.kind === "service" ? "View bookings" : "View interested people";

  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
        style={({ pressed }) => [
          styles.card,
          {
            borderWidth: 1,
            borderColor: pressed ? "rgba(10,132,255,0.65)" : "rgba(255,255,255,0.10)",
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={styles.emojiPill}>
            <Text style={styles.emojiTxt}>{e.emoji || "📍"}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {e.title}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="rgba(226,232,240,0.80)"
                style={{ marginLeft: "auto" }}
              />
            </View>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, e.kind === "service" ? styles.badgeService : styles.badgeFree]}>
                <Ionicons
                  name={e.kind === "service" ? "sparkles" : e.kind === "paid" ? "card" : "leaf"}
                  size={12}
                  color="#fff"
                />
                <Text style={styles.badgeText}>{kindLabel(e)}</Text>
              </View>

              <View style={[styles.badge, enabled ? styles.badgeActive : styles.badgePaused]}>
                <Ionicons name={enabled ? "checkmark" : "pause"} size={12} color="#fff" />
                <Text style={styles.badgeText}>{statusTxt}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rightCol}>
            <View style={styles.pricePill}>
              <Text style={styles.priceTxt}>{priceLabel(e)}</Text>
            </View>

            {showToggle ? (
              <View style={styles.toggleWrap}>
                {toggleBusy ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Switch
                    value={enabled}
                    onValueChange={onToggle}
                    trackColor={{
                      false: "rgba(148,163,184,0.22)",
                      true: "rgba(10,132,255,0.55)",
                    }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(148,163,184,0.22)"
                  />
                )}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>When</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {fmtWhen(e)}
            </Text>
          </View>

          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Where</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {fmtWhere(e)}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(0, 0, 0, 0.95)", fontWeight: "900", fontSize: 13 }}>
              {actionLabel}
            </Text>
            <Text style={{ color: "rgba(0, 0, 0, 0.95)", fontSize: 12, marginTop: 2 }}>
              Opens details & list
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={16} color="rgba(0, 0, 0, 0.85)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}
