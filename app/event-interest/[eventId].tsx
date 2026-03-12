import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ActivityIndicator, Pressable, FlatList, Image,
  SectionList, RefreshControl, StatusBar, Platform, StyleSheet, Dimensions,
  LayoutAnimation, UIManager,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width: W } = Dimensions.get("window");

type EventKind = "free" | "paid" | "service";

type AttendeeRow = {
  clerkId: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  imageUrl?: string;
  joinedAt?: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
};

type BookingRow = {
  _id: string;
  customerClerkId?: string;
  customerName?: string;
  customerEmail?: string;
  whenISO?: string;
  notes?: string;
};

type EventDoc = {
  _id: string;
  title: string;
  emoji?: string;
  kind: EventKind;
  attendance?: number | null; // Limit
  attendees?: any[];
  pendingRequests?: any[];
};

function safeJson(txt: string) { try { return JSON.parse(txt); } catch { return null; } }

function dateKey(iso?: string) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Unknown date";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function fmtJoinedAt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function EventInterestScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const params = useLocalSearchParams<{ eventId: string; kind: EventKind; title?: string; emoji?: string }>();
  const eventId = String(params.eventId || "");
  const kind = (String(params.kind || "free") as EventKind);
  const titleParam = String(params.title || "");
  const emojiParam = String(params.emoji || "📍");

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
  }), [EVENT_API_KEY]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventDoc | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AttendeeRow[]>([]);
  const [bookingSections, setBookingSections] = useState<Array<{ title: string; data: BookingRow[] }>>([]);
  const [admitBusy, setAdmitBusy] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!API_BASE) { setErr("Missing API base URL."); setLoading(false); setRefreshing(false); return; }
    if (!userId) { setErr("You must be signed in."); setLoading(false); setRefreshing(false); return; }
    if (!eventId) { setErr("Missing event ID."); setLoading(false); setRefreshing(false); return; }

    setErr(null); setLoading(true);

    try {
      if (kind === "service") {
        const res = await fetch(
          `${API_BASE}/api/bookings/service-bookings?eventId=${encodeURIComponent(eventId)}&creatorClerkId=${encodeURIComponent(userId)}`,
          { method: "GET", headers }
        );
        const json = safeJson(await res.text());
        if (!res.ok) throw new Error(json?.error || "Failed to fetch service bookings");

        const list: BookingRow[] = Array.isArray(json?.bookings) ? json.bookings : [];
        const map = new Map<string, BookingRow[]>();
        for (const b of list) {
          const k = dateKey(b.whenISO);
          map.set(k, [...(map.get(k) || []), b]);
        }
        const sections = Array.from(map.entries())
          .map(([k, v]) => ({ title: k, data: v.sort((a, b) => String(a.whenISO || "").localeCompare(String(b.whenISO || ""))) }))
          .sort((a, b) => a.title.localeCompare(b.title));
        setBookingSections(sections);
        setAttendees([]);
      } else {
        const res = await fetch(
          `${API_BASE}/api/events/${encodeURIComponent(eventId)}`,
          { method: "GET", headers }
        );
        const json = safeJson(await res.text());
        if (!res.ok) throw new Error(json?.error || "Event not found");

        const ev = json?.event;
        setEventData(ev);

        const raw = Array.isArray(ev?.attendees) ? ev.attendees : [];

        const list: AttendeeRow[] = raw
          .map((a: any) => {
            if (!a) return null;
            if (typeof a === "string") return { clerkId: a };
            return {
              clerkId: String(a.clerkId || a.clerkUserId || a.id || ""),
              name: typeof a.name === "string" ? a.name : "",
              email: typeof a.email === "string" ? a.email : "",
              phone: typeof a.phone === "string" ? a.phone : "",
              message: typeof a.message === "string" ? a.message : "",
              imageUrl: String(a.imageUrl || a.avatar || a.photo || ""),
              joinedAt: typeof a.joinedAt === "string" ? a.joinedAt : "",
              checkedIn: !!a.checkedIn,
              checkedInAt: a.checkedInAt || null,
            };
          })
          .filter((a: any) => a && a.clerkId) as AttendeeRow[];

        setAttendees(list);
        setBookingSections([]);

        const rawPending = Array.isArray(ev?.pendingRequests) ? ev.pendingRequests : [];
        const pendingList: AttendeeRow[] = rawPending.map((p: any) => ({
          clerkId: String(p.clerkUserId || ""),
          name: p.name || "",
          message: p.message || "",
          imageUrl: String(p.imageUrl || p.avatar || p.photo || ""),
          joinedAt: p.requestedAt || "",
          email: p.email || "",
          phone: p.phone || "",
        })).filter((p: AttendeeRow) => p.clerkId);
        setPendingRequests(pendingList);
      }
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [API_BASE, userId, eventId, kind, headers]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const handleAdmitReject = async (targetClerkId: string, action: "admit" | "reject") => {
    if (!API_BASE || !userId || !eventId) return;
    const busyKey = `${targetClerkId}-${action}`;
    setAdmitBusy(prev => ({ ...prev, [busyKey]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/events/admit-request`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId,
          creatorClerkId: userId,
          requestClerkUserId: targetClerkId,
          action,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Action failed");
      
      // ✅ Smoothly remove the card
      if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental)
        UIManager.setLayoutAnimationEnabledExperimental(true);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      await load(); // Refresh lists
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAdmitBusy(prev => {
        const next = { ...prev };
        delete next[busyKey];
        return next;
      });
    }
  };

  const checkedInCount = attendees.filter((a) => a.checkedIn).length;
  const capacity = eventData?.attendance || null;
  const remaining = capacity ? Math.max(0, capacity - attendees.length) : null;
  const fillPct = capacity ? Math.min(100, (attendees.length / capacity) * 100) : 0;

  const headerTitle = kind === "service" ? "Service Bookings" : "Manage Attendees";
  const currentTitle = eventData?.title || titleParam;
  const currentEmoji = eventData?.emoji || emojiParam;

  const TOP_PAD = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 40;

  return (
    <View style={[sc.screen, { paddingTop: TOP_PAD }]}>
      <StatusBar barStyle="dark-content" translucent />
      
      {/* Header */}
      <View style={sc.header}>
        <Pressable onPress={() => router.back()} style={sc.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={sc.emojiText}>{currentEmoji}</Text>
            <Text style={sc.eventTitle} numberOfLines={1}>{currentTitle}</Text>
          </View>
          <Text style={sc.headerActionText}>{headerTitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={sc.center}>
          <ActivityIndicator color="#0A84FF" size="large" />
          <Text style={sc.muted}>Loading dashboard…</Text>
        </View>
      ) : err ? (
        <View style={sc.center}>
          <View style={sc.errorIcon}>
            <Ionicons name="alert-circle" size={40} color="#F87171" />
          </View>
          <Text style={sc.errText}>{err}</Text>
          <Pressable onPress={load} style={sc.retryBtn}><Text style={sc.retryText}>Retry</Text></Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Dashboard Stats */}
          {kind !== "service" && (
            <View style={sc.dashContainer}>
              <View style={sc.dashRow}>
                <View style={sc.statBox}>
                  <Text style={sc.statVal}>{attendees.length}</Text>
                  <Text style={sc.statLab}>Total Joined</Text>
                </View>
                <View style={sc.statBox}>
                  <Text style={[sc.statVal, { color: "#4ADE80" }]}>{checkedInCount}</Text>
                  <Text style={sc.statLab}>Checked In</Text>
                </View>
                {capacity !== null && (
                  <View style={sc.statBox}>
                    <Text style={[sc.statVal, { color: remaining === 0 ? "#F87171" : "#FFD700" }]}>{remaining}</Text>
                    <Text style={sc.statLab}>Remaining</Text>
                  </View>
                )}
              </View>

              {capacity !== null && (
                <View style={sc.progressWrap}>
                  <View style={sc.progressLabelRow}>
                    <Text style={sc.progressText}>Event Capacity</Text>
                    <Text style={sc.progressText}>{attendees.length} / {capacity}</Text>
                  </View>
                  <View style={sc.progressBar}>
                    <View style={[sc.progressFill, { width: `${fillPct}%` }]} />
                  </View>
                  {remaining !== null && remaining <= 5 && remaining > 0 && (
                    <Text style={sc.urgentText}>Hurry! Only {remaining} spaces left.</Text>
                  )}
                  {remaining === 0 && (
                    <Text style={[sc.urgentText, { color: "#F87171" }]}>Event is fully booked.</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {kind === "service" ? (
            <SectionList
              sections={bookingSections}
              keyExtractor={(item) => item._id}
              contentContainerStyle={sc.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A84FF" />}
              ListEmptyComponent={<EmptyCard title="No bookings yet" sub="When users book your service, they'll appear here." />}
              renderSectionHeader={({ section }) => (
                <View style={sc.sectionHead}>
                  <Text style={sc.sectionTitle}>{section.title}</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <View style={sc.card}>
                  <View style={sc.cardTopRow}>
                    <View style={sc.avatarBox}>
                      <Text style={sc.avatarText}>{(item.customerName || "?").charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sc.cardName}>{item.customerName || "Customer"}</Text>
                      {!!item.customerEmail && <Text style={sc.cardMeta}>{item.customerEmail}</Text>}
                    </View>
                  </View>
                  {!!item.whenISO && (
                    <View style={sc.metaRow}>
                      <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.4)" />
                      <Text style={sc.cardMeta}>{new Date(item.whenISO).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    </View>
                  )}
                  {!!item.notes && (
                    <View style={sc.notesBox}>
                      <Text style={sc.notesText}>"{item.notes}"</Text>
                    </View>
                  )}
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            <FlatList
              data={attendees}
              keyExtractor={(x) => x.clerkId}
              contentContainerStyle={sc.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A84FF" />}
              ListHeaderComponent={
                <View>
                  {pendingRequests.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={[sc.listLabel, { color: "#F59E0B" }]}>Pending Approvals ({pendingRequests.length})</Text>
                      {pendingRequests.map((p: AttendeeRow) => (
                        <PendingRequestCard
                          key={p.clerkId}
                          item={p}
                          onAdmit={() => handleAdmitReject(p.clerkId, "admit")}
                          onReject={() => handleAdmitReject(p.clerkId, "reject")}
                          admitBusy={admitBusy}
                        />
                      ))}
                    </View>
                  )}
                  <Text style={sc.listLabel}>Attendee List ({attendees.length})</Text>
                </View>
              }
              ListEmptyComponent={<EmptyCard title="No attendees yet" sub="When users join your event, their details will show up here." />}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [sc.card, item.checkedIn && sc.cardChecked, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }]}
                  onPress={() => {
                    if (item.clerkId) {
                      router.push({
                        pathname: "/profile/[clerkUserId]",
                        params: {
                          clerkUserId: item.clerkId,
                          name: item.name || "",
                          imageUrl: item.imageUrl || "",
                        },
                      } as any);
                    }
                  }}
                >
                  <View style={sc.cardTopRow}>
                    <View style={sc.avatarBox}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={sc.avatarImage} />
                      ) : (
                        <Text style={[sc.avatarText, item.checkedIn && { color: "#4ADE80" }]}>
                          {(item.name || "G").charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sc.cardName}>{item.name || "Guest"}</Text>
                      <Text style={sc.cardTime}>Joined {fmtJoinedAt(item.joinedAt)}</Text>
                    </View>
                    {item.checkedIn ? (
                      <View style={sc.checkedInBadge}>
                        <Ionicons name="checkmark-done" size={12} color="#4ADE80" />
                        <Text style={sc.checkedInBadgeText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={sc.pendingBadge}>
                        <Text style={sc.pendingBadgeText}>Pending check-in</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={14} color="rgba(148,163,184,0.3)" style={{ marginLeft: 4 }} />
                  </View>

                  <View style={sc.contactRow}>
                    {!!item.email && (
                      <View style={sc.contactChip}>
                        <Ionicons name="mail" size={12} color="#94A3B8" />
                        <Text style={sc.contactChipText} numberOfLines={1}>{item.email}</Text>
                      </View>
                    )}
                    {!!item.phone && (
                      <View style={sc.contactChip}>
                        <Ionicons name="call" size={12} color="#94A3B8" />
                        <Text style={sc.contactChipText}>{item.phone}</Text>
                      </View>
                    )}
                  </View>

                  {!!item.message && (
                    <View style={sc.notesBox}>
                      <Text style={sc.notesText}>"{item.message}"</Text>
                    </View>
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
        </View>
      )}
    </View>
  );
}

function EmptyCard({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={sc.emptyCard}>
      <Ionicons name="people-outline" size={32} color="rgba(255,255,255,0.15)" />
      <Text style={sc.emptyTitle}>{title}</Text>
      <Text style={sc.emptySub}>{sub}</Text>
    </View>
  );
}

function PendingRequestCard({ item, onAdmit, onReject, admitBusy }: {
  item: AttendeeRow;
  onAdmit: () => void;
  onReject: () => void;
  admitBusy: Record<string, boolean>;
}) {
  const admitKey = `${item.clerkId}-admit`;
  const rejectKey = `${item.clerkId}-reject`;
  const busy = !!(admitBusy[admitKey] || admitBusy[rejectKey]);

  return (
    <View style={[sc.card, { marginBottom: 10, borderColor: "rgba(245,158,11,0.2)" }]}>
      <View style={sc.cardTopRow}>
        <View style={sc.avatarBox}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={sc.avatarImage} />
          ) : (
            <Text style={[sc.avatarText, { color: "#F59E0B" }]}>{(item.name || "P").charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sc.cardName}>{item.name || "User"}</Text>
          <Text style={sc.cardTime}>Requested {fmtJoinedAt(item.joinedAt)}</Text>
        </View>
      </View>
      {!!item.message && (
        <View style={sc.notesBox}>
          <Text style={sc.notesText}>"{item.message}"</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Pressable
          onPress={onAdmit}
          disabled={busy}
          style={({ pressed }) => [sc.admitBtn, busy && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}
        >
          {admitBusy[admitKey] ? <ActivityIndicator color="#fff" size="small" /> : <Text style={sc.admitText}>✓ Admit</Text>}
        </Pressable>
        <Pressable
          onPress={onReject}
          disabled={busy}
          style={({ pressed }) => [sc.rejectBtn, busy && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}
        >
          {admitBusy[rejectKey] ? <ActivityIndicator color="rgba(255,255,255,0.4)" size="small" /> : <Text style={sc.rejectText}>✕ Decline</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF7FA" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 20, gap: 14 },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
  },
  emojiText: { fontSize: 20 },
  eventTitle: { color: "#111827", fontSize: 18, fontWeight: "900", flex: 1 },
  headerActionText: { color: "#6B7280", fontSize: 13, fontWeight: "700", marginTop: 1 },

  dashContainer: {
    marginHorizontal: 16, marginBottom: 20,
    padding: 18, borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  dashRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  statBox: { flex: 1, alignItems: "center" },
  statVal: { color: "#0A84FF", fontSize: 24, fontWeight: "900" },
  statLab: { color: "#6B7280", fontSize: 10, fontWeight: "800", marginTop: 4, textAlign: "center", textTransform: "uppercase" },

  progressWrap: { marginTop: 20 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressText: { color: "#6B7280", fontSize: 12, fontWeight: "800" },
  progressBar: { height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#0A84FF", borderRadius: 4 },
  urgentText: { color: "#F59E0B", fontSize: 11, fontWeight: "800", marginTop: 8, textAlign: "center" },

  list: { paddingHorizontal: 16, paddingBottom: 100 },
  listLabel: { color: "#111827", fontSize: 15, fontWeight: "900", marginBottom: 12, marginTop: 4 },

  sectionHead: { marginTop: 20, marginBottom: 10, paddingHorizontal: 4 },
  sectionTitle: { color: "#0A84FF", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 },

  card: {
    padding: 14, borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  cardChecked: {
    backgroundColor: "rgba(74,222,128,0.03)",
    borderColor: "rgba(74,222,128,0.15)",
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBox: {
    width: 44, height: 44, borderRadius: 15,
    backgroundColor: "rgba(10,132,255,0.1)",
    borderWidth: 1.5, borderColor: "rgba(10,132,255,0.2)",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarText: { color: "#0A84FF", fontSize: 18, fontWeight: "900" },
  cardName: { color: "#111827", fontWeight: "900", fontSize: 15 },
  cardTime: { color: "#6B7280", fontSize: 11, fontWeight: "700", marginTop: 2 },

  checkedInBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    backgroundColor: "rgba(74,222,128,0.1)",
    borderWidth: 1, borderColor: "rgba(74,222,128,0.2)",
  },
  checkedInBadgeText: { color: "#4ADE80", fontSize: 10, fontWeight: "900" },
  pendingBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  pendingBadgeText: { color: "#6B7280", fontSize: 10, fontWeight: "800" },

  contactRow: { flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" },
  contactChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1, borderColor: "#F1F5F9",
    maxWidth: W * 0.5,
  },
  contactChipText: { color: "#4B5563", fontSize: 11, fontWeight: "700" },

  notesBox: {
    marginTop: 12, padding: 10, borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1, borderColor: "#F1F5F9",
  },
  notesText: { color: "#6B7280", fontSize: 12, fontWeight: "600", fontStyle: "italic", lineHeight: 18 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  cardMeta: { color: "#6B7280", fontSize: 12, fontWeight: "700" },

  admitBtn: {
    flex: 1, height: 42, borderRadius: 13,
    backgroundColor: "#0A84FF", alignItems: "center", justifyContent: "center",
  },
  admitText: { color: "#fff", fontWeight: "900", fontSize: 13 },
  rejectBtn: {
    flex: 1, height: 42, borderRadius: 13,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  rejectText: { color: "#4B5563", fontWeight: "800", fontSize: 13 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  errorIcon: { marginBottom: 16 },
  errText: { color: "#EF4444", fontWeight: "800", textAlign: "center", lineHeight: 22 },
  muted: { color: "#6B7280", marginTop: 14, fontWeight: "700" },
  retryBtn: {
    marginTop: 20, paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 15, backgroundColor: "rgba(10,132,255,0.12)",
    borderWidth: 1, borderColor: "rgba(10,132,255,0.3)",
  },
  retryText: { color: "#0A84FF", fontWeight: "900" },

  emptyCard: {
    paddingVertical: 40, alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24, borderWidth: 1, borderColor: "#F1F5F9",
    marginTop: 10,
  },
  emptyTitle: { color: "#111827", fontWeight: "900", fontSize: 16, marginTop: 12 },
  emptySub: { color: "#6B7280", marginTop: 6, fontWeight: "700", textAlign: "center", paddingHorizontal: 30 },
});
