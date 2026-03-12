// app/newApp/search.tsx
// People search only — by name or @username, real-time from 1 char

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  ActivityIndicator, StyleSheet, Platform, StatusBar, Keyboard,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { apiFetch } from "../../lib/apiFetch";

const C = {
  bg:        "#FFF7FA",
  card:      "#FFFFFF",
  brand:     "#FF4D6D",
  brandSoft: "#FFF1F5",
  text:      "#111827",
  muted:     "#6B7280",
  border:    "#F3F4F6",
  ring:      "#FFD1DC",
};

type PersonResult = {
  clerkUserId: string;
  profile?: {
    firstName?: string; lastName?: string;
    username?: string; avatar?: string;
    photos?: string[]; about?: string;
  };
  clerk?: { firstName?: string; lastName?: string; imageUrl?: string };
};

function personName(p: PersonResult) {
  const fn = p.profile?.firstName || p.clerk?.firstName || "";
  const ln = p.profile?.lastName  || p.clerk?.lastName  || "";
  return [fn, ln].filter(Boolean).join(" ") || "Unknown";
}

function personAvatar(p: PersonResult): string {
  const raw = p.profile?.avatar || p.profile?.photos?.[0] || p.clerk?.imageUrl || "";
  return typeof raw === "string" ? raw : (raw as any)?.url || "";
}

// ─── Person card ───────────────────────────────────────────────
function PersonCard({
  item, onPress, onMessage,
}: {
  item: PersonResult;
  onPress: () => void;
  onMessage: () => void;
}) {
  const name     = personName(item);
  const avatar   = personAvatar(item);
  const uname    = item.profile?.username;
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  // Safe fallback avatar using ui-avatars so Image never receives null/undefined
  const safeAvatarUri = avatar
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF4D6D&color=fff&size=80`;

  return (
    <TouchableOpacity style={S.card} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: safeAvatarUri }} style={S.avatar} />

      <View style={S.cardBody}>
        <Text style={S.cardName} numberOfLines={1}>{name}</Text>
        {!!uname
          ? <Text style={S.cardSub} numberOfLines={1}>@{uname}</Text>
          : <Text style={S.cardSub} numberOfLines={1}>{item.profile?.about || "Member"}</Text>
        }
      </View>

      <TouchableOpacity
        style={S.msgBtn}
        onPress={(e) => { e.stopPropagation?.(); onMessage(); }}
        activeOpacity={0.85}
        hitSlop={8}
      >
        <Ionicons name="chatbubble-outline" size={15} color={C.brand} />
        <Text style={S.msgTxt}>Message</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function SearchScreen() {
  const router = useRouter();

  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [query,   setQuery]   = useState("");
  const [people,  setPeople]  = useState<PersonResult[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPeople = useCallback(async (q: string) => {
    if (!API_BASE) return;
    setLoading(true);
    try {
      const url = `${API_BASE.replace(/\/$/, "")}/api/users/get-user/search?q=${encodeURIComponent(q)}&limit=30`;
      const res  = await apiFetch(url, {
        headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined,
      });
      const json = await res.json().catch(() => ({}));
      setPeople(Array.isArray(json?.users) ? json.users : []);
    } catch {
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, EVENT_API_KEY]);

  // Real-time debounced search — triggers from 1 char
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setPeople([]); setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => searchPeople(query.trim()), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchPeople]);

  const TOP = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  const goToProfile = (item: PersonResult) => {
    router.push({
      pathname: "/profile/[clerkUserId]" as any,
      params: {
        clerkUserId: item.clerkUserId,
        name:        personName(item),
        imageUrl:    personAvatar(item),
      },
    });
  };

  const goToChat = (item: PersonResult) => {
    router.push({
      pathname: "/newApp/chat/[userId]" as any,
      params: {
        userId:    item.clerkUserId,
        name:      personName(item),
        avatarUrl: personAvatar(item),
      },
    });
  };

  return (
    <View style={[S.screen, { paddingTop: TOP }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={S.header}>
        <Text style={S.title}>Search People</Text>

        <View style={S.inputWrap}>
          <Ionicons name="search" size={17} color={C.muted} />
          <TextInput
            placeholder="Search by name or @username…"
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
            style={S.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setPeople([]); }} hitSlop={10}>
              <Ionicons name="close-circle" size={17} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Results ── */}
      {loading ? (
        <View style={S.center}>
          <ActivityIndicator color={C.brand} size="small" />
          <Text style={S.loadingTxt}>Searching…</Text>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={i => i.clerkUserId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={S.empty}>
              <Text style={S.emptyEmoji}>{query ? "🔍" : "👥"}</Text>
              <Text style={S.emptyTitle}>
                {query ? "No people found" : "Find people"}
              </Text>
              <Text style={S.emptySub}>
                {query
                  ? `No results for "${query}"`
                  : "Search by name or @username to find people and start chatting"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PersonCard
              item={item}
              onPress={() => goToProfile(item)}
              onMessage={() => goToChat(item)}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
    gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  title: { fontSize: 28, fontWeight: "900", color: C.text, letterSpacing: -0.5 },

  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.bg, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: C.border,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: C.text, padding: 0 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  loadingTxt: { color: C.muted, fontSize: 13, fontWeight: "700" },

  // Cards
  card: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 14, marginVertical: 5,
    backgroundColor: C.card, borderRadius: 18,
    padding: 14, borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.brandSoft,
    marginRight: 12,
  },

  cardBody:  { flex: 1, minWidth: 0 },
  cardName:  { fontSize: 15, fontWeight: "800", color: C.text, marginBottom: 3 },
  cardSub:   { fontSize: 12, fontWeight: "600", color: C.muted },

  msgBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 8,
    borderRadius: 10, backgroundColor: C.brandSoft,
    borderWidth: 1, borderColor: C.ring,
  },
  msgTxt: { fontSize: 12, fontWeight: "800", color: C.brand },

  // Empty state
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, marginTop: 40 },
  emptyEmoji: { fontSize: 44, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: C.text, marginBottom: 8 },
  emptySub:   { fontSize: 14, fontWeight: "600", color: C.muted, textAlign: "center", lineHeight: 20 },
});