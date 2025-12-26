// app/event-interest/[eventId].tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, FlatList, SectionList, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";

type EventKind = "free" | "paid" | "service";

type AttendeeRow = {
  clerkId: string;
  name?: string;
  email?: string;
  imageUrl?: string;
};

type BookingRow = {
  _id: string;
  customerClerkId?: string;
  customerName?: string;
  customerEmail?: string;
  whenISO?: string; // booking datetime
  notes?: string;
};

function safeJson(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function dateKey(iso?: string) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function EventInterestScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const params = useLocalSearchParams<{
    eventId: string;
    kind: EventKind;
    title?: string;
    emoji?: string;
  }>();

  const eventId = String(params.eventId || "");
  const kind = (String(params.kind || "free") as EventKind) || "free";
  const title = String(params.title || "");
  const emoji = String(params.emoji || "📍");

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const headers = useMemo(() => {
    return {
      "Content-Type": "application/json",
      ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
    };
  }, [EVENT_API_KEY]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // for free/paid
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);

  // for service
  const [bookingSections, setBookingSections] = useState<Array<{ title: string; data: BookingRow[] }>>([]);

  const load = useCallback(async () => {
    if (!API_BASE) {
      setErr("Missing API base URL (extra.apiBaseUrl).");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!userId) {
      setErr("You must be signed in.");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!eventId) {
      setErr("Missing eventId.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      if (kind === "service") {
        const res = await fetch(
          `${API_BASE}/api/bookings/service-bookings?eventId=${encodeURIComponent(eventId)}&creatorClerkId=${encodeURIComponent(userId)}`,
          { method: "GET", headers }
        );

        const txt = await res.text();
        const json = safeJson(txt);
        if (!res.ok) throw new Error(json?.error || json?.detail || "Failed to fetch service bookings");

        const list: BookingRow[] = Array.isArray(json?.bookings) ? json.bookings : [];

        // group by date
        const map = new Map<string, BookingRow[]>();
        for (const b of list) {
          const k = dateKey(b.whenISO);
          map.set(k, [...(map.get(k) || []), b]);
        }
        const sections = Array.from(map.entries()).map(([k, v]) => ({
          title: k,
          data: v.sort((a, b) => String(a.whenISO || "").localeCompare(String(b.whenISO || ""))),
        }));

        setBookingSections(sections);
        setAttendees([]);
      } else {
        const res = await fetch(
          `${API_BASE}/api/bookings/attendees?eventId=${encodeURIComponent(eventId)}&creatorClerkId=${encodeURIComponent(userId)}`,
          { method: "GET", headers }
        );

        const txt = await res.text();
        const json = safeJson(txt);
        if (!res.ok) throw new Error(json?.error || json?.detail || "Failed to fetch attendees");

        const list: AttendeeRow[] = Array.isArray(json?.attendees) ? json.attendees : [];
        setAttendees(list);
        setBookingSections([]);
      }
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE, userId, eventId, kind, headers]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const headerTitle = kind === "service" ? "Bookings" : "People interested";
  const headerSub = kind === "service" ? "Grouped by date" : "Fetched from attendees[]";

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1220", paddingTop: 52, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 10, marginRight: 8 }}>
          <Text style={{ color: "rgba(226,232,240,0.95)", fontSize: 16 }}>←</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(226,232,240,0.98)", fontSize: 18, fontWeight: "900" }}>
            {emoji} {headerTitle}
          </Text>
          <Text style={{ color: "rgba(148,163,184,0.95)", marginTop: 2 }} numberOfLines={1}>
            {title ? `${title} • ${headerSub}` : headerSub}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ color: "rgba(148,163,184,0.95)", marginTop: 10 }}>Loading…</Text>
        </View>
      ) : err ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#FCA5A5", textAlign: "center" }}>{err}</Text>
          <Pressable onPress={load} style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)" }}>
            <Text style={{ color: "rgba(226,232,240,0.95)", fontWeight: "900" }}>Retry</Text>
          </Pressable>
        </View>
      ) : kind === "service" ? (
        <SectionList
          sections={bookingSections}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{ padding: 18 }}>
              <Text style={{ color: "rgba(226,232,240,0.95)", fontWeight: "900" }}>No bookings yet</Text>
              <Text style={{ color: "rgba(148,163,184,0.95)", marginTop: 6 }}>When users book your service, they’ll appear here.</Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View style={{ marginTop: 14, marginBottom: 10 }}>
              <Text style={{ color: "rgba(226,232,240,0.95)", fontWeight: "900" }}>{section.title}</Text>
              <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 8 }} />
            </View>
          )}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 12, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 10 }}>
              <Text style={{ color: "rgba(226,232,240,0.98)", fontWeight: "900" }}>
                {item.customerName || "Customer"}
              </Text>
              {!!item.customerEmail && (
                <Text style={{ color: "rgba(148,163,184,0.95)", marginTop: 3 }}>{item.customerEmail}</Text>
              )}
              {!!item.whenISO && (
                <Text style={{ color: "rgba(148,163,184,0.95)", marginTop: 6 }}>
                  When: {new Date(item.whenISO).toLocaleString()}
                </Text>
              )}
              {!!item.notes && (
                <Text style={{ color: "rgba(148,163,184,0.95)", marginTop: 6 }}>
                  Notes: {item.notes}
                </Text>
              )}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={attendees}
          keyExtractor={(x) => x.clerkId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{ padding: 18 }}>
              <Text style={{ color: "rgba(226,232,240,0.95)", fontWeight: "900" }}>No one yet</Text>
              <Text style={{ color: "rgba(148,163,184,0.95)", marginTop: 6 }}>When users join, they’ll show up here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 12, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 10 }}>
              <Text style={{ color: "rgba(226,232,240,0.98)", fontWeight: "900" }}>
                {item.name || "User"}
              </Text>
              <Text style={{ color: "rgba(148,163,184,0.95)", marginTop: 3 }}>
                {item.email || item.clerkId}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
