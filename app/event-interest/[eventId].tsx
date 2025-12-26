// app/event-interest/[eventId].tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, FlatList, SectionList, RefreshControl, StatusBar, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";

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
    whenISO?: string;
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

    const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
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

                const map = new Map<string, BookingRow[]>();
                for (const b of list) {
                    const k = dateKey(b.whenISO);
                    map.set(k, [...(map.get(k) || []), b]);
                }

                const sections = Array.from(map.entries())
                    .map(([k, v]) => ({
                        title: k,
                        data: v.sort((a, b) => String(a.whenISO || "").localeCompare(String(b.whenISO || ""))),
                    }))
                    .sort((a, b) => a.title.localeCompare(b.title));

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

                const raw = Array.isArray(json?.attendees) ? json.attendees : [];

                const list: AttendeeRow[] = raw
                    .map((a: any) => {
                        if (!a) return null;

                        // if backend accidentally returns just ids
                        if (typeof a === "string") {
                            return { clerkId: a, name: "", email: "", imageUrl: "" };
                        }

                        const clerkId = String(a.clerkId || a.clerkUserId || a.id || "");
                        const name = typeof a.name === "string" ? a.name : "";

                        // ✅ important: make sure email is STRING only
                        const email =
                            typeof a.email === "string"
                                ? a.email
                                : typeof a.email?.email === "string"
                                    ? a.email.email
                                    : "";

                        const imageUrl = typeof a.imageUrl === "string" ? a.imageUrl : "";

                        return clerkId ? { clerkId, name, email, imageUrl } : null;
                    })
                    .filter(Boolean) as AttendeeRow[];

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
    const headerSub = kind === "service" ? "Grouped by date" : "People Attending your event";

    const TOP_PAD = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 50;

    return (
        <View style={{ flex: 1, backgroundColor: "#F7F8FC", paddingTop: TOP_PAD, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                <Pressable
                    onPress={() => router.back()}
                    style={{
                        padding: 10,
                        marginRight: 8,
                        borderRadius: 12,
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#E6EAF2",
                    }}
                >
                    <Ionicons name="chevron-back" size={18} color="#0F172A" />
                </Pressable>

                <View style={{ flex: 1 }}>
                    <Text style={{ color: "#0F172A", fontSize: 18, fontWeight: "900" }} numberOfLines={1}>
                        {emoji} {headerTitle}
                    </Text>
                    <Text style={{ color: "#64748B", marginTop: 2 }} numberOfLines={1}>
                        {title ? `${title} • ${headerSub}` : headerSub}
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator />
                    <Text style={{ color: "#64748B", marginTop: 10 }}>Loading…</Text>
                </View>
            ) : err ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 }}>
                    <Text style={{ color: "#DC2626", textAlign: "center", fontWeight: "800" }}>{err}</Text>
                    <Pressable
                        onPress={load}
                        style={{
                            marginTop: 12,
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                            borderRadius: 12,
                            backgroundColor: "#0F172A",
                        }}
                    >
                        <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>Retry</Text>
                    </Pressable>
                </View>
            ) : kind === "service" ? (
                <SectionList
                    sections={bookingSections}
                    keyExtractor={(item) => item._id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={{ padding: 18, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E6EAF2" }}>
                            <Text style={{ color: "#0F172A", fontWeight: "900" }}>No bookings yet</Text>
                            <Text style={{ color: "#64748B", marginTop: 6 }}>When users book your service, they’ll appear here.</Text>
                        </View>
                    }
                    renderSectionHeader={({ section }) => (
                        <View style={{ marginTop: 14, marginBottom: 10 }}>
                            <Text style={{ color: "#0F172A", fontWeight: "900" }}>{section.title}</Text>
                            <View style={{ height: 1, backgroundColor: "rgba(148,163,184,0.22)", marginTop: 8 }} />
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <View
                            style={{
                                paddingVertical: 12,
                                paddingHorizontal: 12,
                                borderRadius: 16,
                                backgroundColor: "#FFFFFF",
                                borderWidth: 1,
                                borderColor: "#E6EAF2",
                                marginBottom: 10,
                            }}
                        >
                            <Text style={{ color: "#0F172A", fontWeight: "900" }}>{item.customerName || "Customer"}</Text>
                            {!!item.customerEmail && <Text style={{ color: "#64748B", marginTop: 3 }}>{item.customerEmail}</Text>}
                            {!!item.whenISO && (
                                <Text style={{ color: "#64748B", marginTop: 6 }}>
                                    When: {new Date(item.whenISO).toLocaleString()}
                                </Text>
                            )}
                            {!!item.notes && <Text style={{ color: "#64748B", marginTop: 6 }}>Notes: {item.notes}</Text>}
                        </View>
                    )}
                />
            ) : (
                <FlatList
                    data={attendees}
                    keyExtractor={(x) => x.clerkId}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={{ padding: 18, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E6EAF2" }}>
                            <Text style={{ color: "#0F172A", fontWeight: "900" }}>No one yet</Text>
                            <Text style={{ color: "#64748B", marginTop: 6 }}>When users join, they’ll show up here.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View
                            style={{
                                paddingVertical: 12,
                                paddingHorizontal: 12,
                                borderRadius: 16,
                                backgroundColor: "#FFFFFF",
                                borderWidth: 1,
                                borderColor: "#E6EAF2",
                                marginBottom: 10,
                            }}
                        >
                            <Text style={{ color: "#0F172A", fontWeight: "900" }}>{item.name || "User"}</Text>
                            <Text style={{ color: "#64748B", marginTop: 3 }}>
                                {typeof (item as any).email === "string"
                                    ? (item as any).email
                                    : typeof (item as any).email?.email === "string"
                                        ? (item as any).email.email
                                        : String(item.clerkId)}
                            </Text>

                        </View>
                    )}
                />
            )}
        </View>
    );
}
