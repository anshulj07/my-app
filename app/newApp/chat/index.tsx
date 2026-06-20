// app/newApp/chat/index.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Platform, StatusBar,
  Animated, Pressable, ScrollView, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiFetch } from "../../../lib/apiFetch";

const { width: SW } = Dimensions.get("window");

const C = {
  bg:          "#F8FAFF",
  white:       "#FFFFFF",
  ink:         "#1A1C2E",
  muted:       "#7E8494",
  accent:      "#6366F1",
  accentLight: "#EEF2FF",
  border:      "#EAEFF5",
  green:       "#10B981",
  red:         "#EF4444",
};

const CHIPS = ["All", "Unread"];

type Conversation = {
  otherUserId: string; otherName: string; otherAvatar: string;
  lastMessage: string; lastMessageAt: string; unreadCount: number;
};

function fmtTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  if (!Number.isFinite(d.getTime())) return "";
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ChatListScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const onboardingComplete = user?.unsafeMetadata?.onboardingComplete === true;
  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [activeChip, setActiveChip] = useState("All");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!API_BASE || !userId) return;
    try {
      const res  = await apiFetch(
        `${API_BASE}/api/messages/conversations?clerkUserId=${encodeURIComponent(userId)}`,
        { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined }
      );
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.conversations)) setConversations(json.conversations);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [API_BASE, EVENT_API_KEY, userId]);

  useEffect(() => {
    fetchConversations();
    pollRef.current = setInterval(fetchConversations, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchConversations]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchConversations(); }, [fetchConversations]);

  const openChat = (conv: Conversation) => {
    router.push({
      pathname: "/newApp/chat/[userId]" as any,
      params: { userId: conv.otherUserId, name: conv.otherName, avatarUrl: conv.otherAvatar, isVerified: String((conv as any).isVerified) },
    });
  };

  const filtered = conversations.filter(c => {
    const matchesSearch = c.otherName.toLowerCase().includes(search.toLowerCase());
    const matchesChip = activeChip === "All" || (activeChip === "Unread" && c.unreadCount > 0);
    return matchesSearch && matchesChip;
  });

  const TOP = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 10;
  const fallback = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366F1&color=fff&size=100`;

  return (
    <View style={[S.screen, { paddingTop: TOP }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.iconBtn}><Ionicons name="menu-outline" size={24} color={C.ink} /></TouchableOpacity>
        <Text style={S.headerTitle}>Messages</Text>
        <View style={S.headerActions}>
          {/* Global search/create removed per request */}
        </View>
      </View>

      {/* Search Bar */}
      <View style={S.searchRow}>
        <View style={S.searchShell}>
          <Ionicons name="search-outline" size={20} color={C.muted} />
          <TextInput
            style={S.searchInput}
            placeholder="Search conversations"
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={S.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipScroll}>
          {CHIPS.map(chip => {
            const active = activeChip === chip;
            return (
              <TouchableOpacity 
                key={chip} 
                style={[S.chip, active && S.chipActive]} 
                onPress={() => setActiveChip(chip)}
              >
                <Text style={[S.chipText, active && S.chipTextActive]}>{chip}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={S.center}><ActivityIndicator color={C.accent} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.otherUserId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          contentContainerStyle={S.listContent}
          ListEmptyComponent={
            <View style={S.center}>
              <Text style={S.emptyText}>No conversations found</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isFirst = index === 0;
            const unread = item.unreadCount > 0;
            const avatarUri = item.otherAvatar || fallback(item.otherName);
            
            return (
              <TouchableOpacity 
                style={[S.convItem, isFirst && S.convItemCard]} 
                onPress={() => openChat(item)}
                activeOpacity={0.8}
              >
                <View style={S.avatarBox}>
                  <Image source={{ uri: avatarUri }} style={S.avatar} />
                  <View style={S.onlineDot} />
                </View>

                <View style={S.convDetails}>
                  <View style={S.convRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1, marginRight: 10 }}>
                      <Text style={S.convName} numberOfLines={1}>{item.otherName}</Text>
                      {(item as any).isVerified && <Ionicons name="checkmark-circle" size={14} color="#0A84FF" />}
                    </View>
                    <Text style={S.convTime}>{fmtTime(item.lastMessageAt)}</Text>
                  </View>
                  <View style={S.convRow}>
                    <Text style={S.convLast} numberOfLines={1}>{item.lastMessage || "Say hi!"}</Text>
                    {unread && (
                      <View style={S.unreadBadge}>
                        <Text style={S.unreadBadgeTxt}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  
  header: { 
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", 
    paddingHorizontal: 20, paddingVertical: 10 
  },
  headerTitle: { fontSize: 24, fontFamily: "Outfit_900Black", color: "#2E3A59" },
  headerActions: { flexDirection: "row", gap: 15 },
  iconBtn: { padding: 5 },

  searchRow: { paddingHorizontal: 20, marginTop: 15 },
  searchShell: { 
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F0F3F9", borderRadius: 15, paddingHorizontal: 15, height: 50
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Outfit_500Medium", color: C.ink },

  chipRow: { marginTop: 20, marginBottom: 10 },
  chipScroll: { paddingHorizontal: 20, gap: 10 },
  chip: { 
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, 
    backgroundColor: "#E8EDF5", borderWidth: 1, borderColor: "transparent"
  },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: 14, fontFamily: "Outfit_600SemiBold", color: "#7E8DA6" },
  chipTextActive: { color: "#FFF" },

  listContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 40 },
  convItem: { 
    flexDirection: "row", alignItems: "center", gap: 15, 
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#F1F4F9" 
  },
  convItemCard: { 
    backgroundColor: C.white, borderRadius: 25, padding: 18, marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 15, elevation: 3,
    borderBottomWidth: 0
  },
  
  avatarBox: { position: "relative" },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#E1E8F0" },
  onlineDot: { 
    position: "absolute", bottom: 2, right: 2, width: 12, height: 12, 
    borderRadius: 6, backgroundColor: C.green, borderWidth: 2, borderColor: "#FFF" 
  },

  convDetails: { flex: 1, gap: 4 },
  convRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convName: { fontSize: 17, fontFamily: "Outfit_800ExtraBold", color: "#2E3A59" },
  convTime: { fontSize: 11, fontFamily: "Outfit_500Medium", color: C.muted },
  convLast: { fontSize: 14, fontFamily: "Outfit_500Medium", color: "#7E8494", flex: 1, marginRight: 10 },
  
  unreadBadge: { 
    backgroundColor: C.accent, minWidth: 20, height: 20, borderRadius: 10, 
    alignItems: "center", justifyContent: "center", paddingHorizontal: 5
  },
  unreadBadgeTxt: { color: "#FFF", fontSize: 11, fontFamily: "Outfit_900Black" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 50 },
  emptyText: { fontSize: 16, fontFamily: "Outfit_600SemiBold", color: C.muted },
});