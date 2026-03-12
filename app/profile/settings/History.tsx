// app/profile/settings/History.tsx
// ✏️ FIXED — Was just a placeholder, now shows joined + created event history

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "../../../lib/apiFetch";

const C = {
  bg: "#FFF7FA", card: "#FFFFFF", text: "#111827",
  muted: "#6B7280", brand: "#FF4D6D", brandSoft: "#FFF1F5",
  border: "#F3F4F6", ring: "#FFD1DC",
  green: "#10B981", greenSoft: "#DCFCE7",
  amber: "#D97706", amberSoft: "#FEF3C7",
};

type TabKey = "joined" | "created";

type HistoryEvent = {
  _id: string; title: string; emoji?: string;
  date?: string; startsAt?: string;
  location?: { city?: string; formattedAddress?: string };
  status?: string; kind?: string;
  _role?: "created" | "attended";
};

function fmtDate(ev: HistoryEvent) {
  const raw = ev.startsAt || ev.date;
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function statusBadge(status?: string) {
  const s = (status || "active").toLowerCase();
  if (s === "ended")  return { label: "Ended",  bg: C.amberSoft, txt: C.amber };
  if (s === "active") return { label: "Active",  bg: C.greenSoft, txt: C.green };
  return { label: s.charAt(0).toUpperCase() + s.slice(1), bg: "#F3F4F6", txt: C.muted };
}

function EventRow({ item, onPress }: { item: HistoryEvent; onPress: () => void }) {
  const badge = statusBadge(item.status);
  const city  = item.location?.city || item.location?.formattedAddress?.split(",")[0] || "";
  const date  = fmtDate(item);

  return (
    <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.88}>
      <View style={S.emojiBox}>
        <Text style={S.emoji}>{item.emoji || "📍"}</Text>
      </View>
      <View style={S.rowBody}>
        <Text style={S.rowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={S.rowSub} numberOfLines={1}>
          {[city, date].filter(Boolean).join(" · ") || "No details"}
        </Text>
      </View>
      <View style={[S.badge, { backgroundColor: badge.bg }]}>
        <Text style={[S.badgeTxt, { color: badge.txt }]}>{badge.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function History() {
  const router = useRouter();
  const { userId } = useAuth();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const headers = { ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) };

  const [tab,        setTab]        = useState<TabKey>("joined");
  const [joined,     setJoined]     = useState<HistoryEvent[]>([]);
  const [created,    setCreated]    = useState<HistoryEvent[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!API_BASE || !userId) { setLoading(false); return; }
    try {
      const base = API_BASE.replace(/\/$/, "");
      const [resGoing, resCreated] = await Promise.all([
        apiFetch(`${base}/api/bookings/going?clerkUserId=${encodeURIComponent(userId)}`,       { method: "GET", headers }),
        apiFetch(`${base}/api/bookings/my-bookings?clerkUserId=${encodeURIComponent(userId)}`, { method: "GET", headers }),
      ]);

      const jGoing   = await resGoing.json().catch(() => ({}));
      const jCreated = await resCreated.json().catch(() => ({}));

      // All events user has joined (going + past joined)
      const allGoing = [
        ...(Array.isArray(jGoing?.going)   ? jGoing.going   : []),
        ...(Array.isArray(jGoing?.past)    ? jGoing.past    : []),
        ...(Array.isArray(jGoing?.pending) ? jGoing.pending : []),
      ].map(e => ({ ...e, _role: "attended" as const }));

      // All events user has created
      const allCreated = [
        ...(Array.isArray(jCreated?.events) ? jCreated.events : []),
        ...(Array.isArray(jCreated?.past)   ? jCreated.past   : []),
      ].map(e => ({ ...e, _role: "created" as const }));

      // Sort newest first
      const sortByDate = (arr: HistoryEvent[]) =>
        [...arr].sort((a, b) => {
          const ta = new Date(a.startsAt || a.date || 0).getTime();
          const tb = new Date(b.startsAt || b.date || 0).getTime();
          return tb - ta;
        });

      setJoined(sortByDate(allGoing));
      setCreated(sortByDate(allCreated));
    } catch {
      setJoined([]); setCreated([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [API_BASE, userId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const data = tab === "joined" ? joined : created;

  return (
    <SafeAreaView style={S.safe} edges={["top"]}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={S.title}>History</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tabs */}
      <View style={S.tabs}>
        {(["joined", "created"] as TabKey[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[S.tabBtn, tab === t && S.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.85}
          >
            <Text style={[S.tabTxt, tab === t && S.tabTxtActive]}>
              {t === "joined" ? `Attended (${joined.length})` : `Created (${created.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={S.center}><ActivityIndicator color={C.brand} /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={i => `${i._id}-${i._role}`}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
          ListEmptyComponent={
            <View style={S.empty}>
              <Text style={S.emptyEmoji}>{tab === "joined" ? "🎟️" : "🎉"}</Text>
              <Text style={S.emptyTitle}>No {tab === "joined" ? "events attended" : "events created"} yet</Text>
              <Text style={S.emptySub}>
                {tab === "joined" ? "Events you join will appear here" : "Events you create will appear here"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <EventRow
              item={item}
              onPress={() => {
                // navigate to event detail if you have that route
                // router.push({ pathname: "/event/[eventId]", params: { eventId: item._id } });
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: C.brandSoft,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.ring,
  },
  title: { fontSize: 18, fontWeight: "900", color: C.text },

  tabs: {
    flexDirection: "row", backgroundColor: C.card,
    borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16, gap: 8, paddingBottom: 12, paddingTop: 8,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  tabBtnActive: { backgroundColor: C.brand, borderColor: C.brand },
  tabTxt:       { fontSize: 13, fontWeight: "700", color: C.muted },
  tabTxtActive: { color: "#fff" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  row: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginVertical: 5,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  emojiBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.brandSoft, alignItems: "center", justifyContent: "center",
    marginRight: 12, borderWidth: 1, borderColor: C.ring,
  },
  emoji:    { fontSize: 20 },
  rowBody:  { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: "800", color: C.text, marginBottom: 3 },
  rowSub:   { fontSize: 12, fontWeight: "600", color: C.muted },
  badge:    { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  badgeTxt: { fontSize: 11, fontWeight: "800" },

  empty: { alignItems: "center", paddingTop: 60, padding: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: C.text, marginBottom: 6 },
  emptySub:   { fontSize: 14, fontWeight: "600", color: C.muted, textAlign: "center" },
});