import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, RefreshControl, Animated, SectionList, SectionListData } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "../MyBookingScreen.style";
import type { EventDoc } from "./CreatedTab";

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

export default function GoingTab({
  going,
  refreshing,
  onRefresh,
  onPressEvent,
}: {
  going: EventDoc[];
  refreshing: boolean;
  onRefresh: () => void;
  onPressEvent: (ev: EventDoc) => void;
}) {
  const sections: SectionT[] = going.length
    ? [{ title: "Going", hint: "Upcoming events you’re attending", data: going }]
    : [];

  return (
    <SectionList
      sections={sections as SectionListData<EventDoc>[]}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here</Text>
          <Text style={styles.emptySub}>You’re not going to any events yet.</Text>
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
        <EventCard e={item} index={index} onPress={() => onPressEvent(item)} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

function EventCard({ e, index, onPress }: { e: EventDoc; index: number; onPress: () => void }) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 220, delay: Math.min(index * 35, 180), useNativeDriver: true }),
    ]).start();
  }, [a, y, index]);

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
            </View>
          </View>

          <View style={styles.rightCol}>
            <View style={styles.pricePill}>
              <Text style={styles.priceTxt}>{priceLabel(e)}</Text>
            </View>
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
      </Pressable>
    </Animated.View>
  );
}
