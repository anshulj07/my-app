// // app/newApp/chat/index.tsx
// // Conversations list — tap karo kisi pe → DM screen [userId].tsx

// import React, { useCallback, useEffect, useRef, useState } from "react";
// import {
//   View, Text, FlatList, TouchableOpacity, Image,
//   TextInput, StyleSheet, ActivityIndicator,
//   RefreshControl, Platform, StatusBar,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuth } from "@clerk/clerk-expo";
// import Constants from "expo-constants";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { apiFetch } from "../../../lib/apiFetch";

// const COLORS = {
//   bg:        "#FFF7FA",
//   card:      "#FFFFFF",
//   brand:     "#FF4D6D",
//   brandSoft: "#FFF1F5",
//   text:      "#111827",
//   muted:     "#6B7280",
//   border:    "#F1F5F9",
// };

// type Conversation = {
//   otherUserId:   string;
//   otherName:     string;
//   otherAvatar:   string;
//   lastMessage:   string;
//   lastMessageAt: string;
//   unreadCount:   number;
// };

// function fmtTime(iso: string) {
//   if (!iso) return "";
//   const d   = new Date(iso);
//   const now = new Date();
//   if (!Number.isFinite(d.getTime())) return "";
//   const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
//   if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//   if (diffDays === 1) return "Yesterday";
//   if (diffDays < 7)  return d.toLocaleDateString(undefined, { weekday: "short" });
//   return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
// }

// export default function ChatListScreen() {
//   const router = useRouter();
//   const { userId } = useAuth();

//   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [loading,       setLoading]       = useState(true);
//   const [refreshing,    setRefreshing]    = useState(false);
//   const [search,        setSearch]        = useState("");

//   const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   const fetchConversations = useCallback(async () => {
//     if (!API_BASE || !userId) return;
//     try {
//       const res  = await apiFetch(
//         `${API_BASE}/api/messages/conversations?clerkUserId=${encodeURIComponent(userId)}`,
//         { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined }
//       );
//       const json = await res.json().catch(() => null);
//       if (res.ok && Array.isArray(json?.conversations)) {
//         setConversations(json.conversations);
//       }
//     } catch {}
//     finally { setLoading(false); setRefreshing(false); }
//   }, [API_BASE, EVENT_API_KEY, userId]);

//   useEffect(() => {
//     fetchConversations();
//     pollRef.current = setInterval(fetchConversations, 10000);
//     return () => { if (pollRef.current) clearInterval(pollRef.current); };
//   }, [fetchConversations]);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchConversations();
//   }, [fetchConversations]);

//   const openChat = (conv: Conversation) => {
//     router.push({
//       pathname: "/newApp/chat/[userId]" as any,
//       params: {
//         userId:    conv.otherUserId,
//         name:      conv.otherName,
//         avatarUrl: conv.otherAvatar,
//       },
//     });
//   };

//   // Local search filter
//   const filtered = search.trim()
//     ? conversations.filter(c =>
//         c.otherName.toLowerCase().includes(search.toLowerCase())
//       )
//     : conversations;

//   const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

//   const TOP_PAD = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

//   const avatarFallback = (name: string) =>
//     `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF4D6D&color=fff&size=80`;

//   return (
//     <View style={[s.screen, { paddingTop: TOP_PAD }]}>
//       <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

//       {/* ── Header ── */}
//       <View style={s.header}>
//         <Text style={s.title}>Messages</Text>
//         {totalUnread > 0 && (
//           <View style={s.unreadPill}>
//             <Text style={s.unreadPillText}>{totalUnread}</Text>
//           </View>
//         )}
//         <View style={{ flex: 1 }} />
//         <TouchableOpacity
//           onPress={() => router.push("/newApp/search" as any)}
//           style={s.newBtn}
//           hitSlop={10}
//         >
//           <Ionicons name="create-outline" size={22} color={COLORS.brand} />
//         </TouchableOpacity>
//       </View>

//       {/* ── Search ── */}
//       <View style={s.searchBar}>
//         <Ionicons name="search-outline" size={17} color={COLORS.muted} />
//         <TextInput
//           style={s.searchInput}
//           placeholder="Search conversations"
//           placeholderTextColor={COLORS.muted}
//           value={search}
//           onChangeText={setSearch}
//           returnKeyType="search"
//         />
//         {!!search && (
//           <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
//             <Ionicons name="close-circle" size={17} color={COLORS.muted} />
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* ── List ── */}
//       {loading ? (
//         <View style={s.center}>
//           <ActivityIndicator color={COLORS.brand} size="large" />
//         </View>
//       ) : (
//         <FlatList
//           data={filtered}
//           keyExtractor={(item) => item.otherUserId}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />
//           }
//           contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
//           ItemSeparatorComponent={() => <View style={s.separator} />}
//           ListEmptyComponent={
//             <View style={s.center}>
//               <View style={s.emptyIcon}>
//                 <Ionicons name="chatbubbles-outline" size={36} color={COLORS.brand} style={{ opacity: 0.35 }} />
//               </View>
//               <Text style={s.emptyTitle}>
//                 {search ? "No results found" : "No conversations yet"}
//               </Text>
//               <Text style={s.emptySub}>
//                 {search
//                   ? `No chats matching "${search}"`
//                   : "Start a conversation from someone's profile"}
//               </Text>
//             </View>
//           }
//           renderItem={({ item }) => {
//             const unread = item.unreadCount > 0;
//             return (
//               <TouchableOpacity
//                 style={s.row}
//                 onPress={() => openChat(item)}
//                 activeOpacity={0.7}
//               >
//                 {/* Avatar */}
//                 <View style={s.avatarWrap}>
//                   <Image
//                     source={{
//                       uri: typeof (item.otherAvatar || avatarFallback(item.otherName)) === "string"
//                         ? (item.otherAvatar || avatarFallback(item.otherName))
//                         : (item.otherAvatar as any)?.url || avatarFallback(item.otherName)
//                     }}
//                     style={s.avatar}
//                   />
//                   {/* Online dot — future feature placeholder */}
//                 </View>

//                 {/* Content */}
//                 <View style={s.rowContent}>
//                   <View style={s.rowTop}>
//                     <Text style={[s.rowName, unread && s.rowNameUnread]} numberOfLines={1}>
//                       {item.otherName}
//                     </Text>
//                     <Text style={[s.rowTime, unread && { color: COLORS.brand }]}>
//                       {fmtTime(item.lastMessageAt)}
//                     </Text>
//                   </View>
//                   <View style={s.rowBottom}>
//                     <Text
//                       style={[s.rowLast, unread && s.rowLastUnread]}
//                       numberOfLines={1}
//                     >
//                       {item.lastMessage || "Start a conversation"}
//                     </Text>
//                     {unread && (
//                       <View style={s.unreadBadge}>
//                         <Text style={s.unreadBadgeText}>
//                           {item.unreadCount > 9 ? "9+" : item.unreadCount}
//                         </Text>
//                       </View>
//                     )}
//                   </View>
//                 </View>
//               </TouchableOpacity>
//             );
//           }}
//         />
//       )}
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: COLORS.bg },

//   header: {
//     flexDirection: "row", alignItems: "center",
//     paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
//   },
//   title: {
//     fontSize: 28, fontWeight: "900",
//     color: COLORS.text, letterSpacing: -0.5,
//   },
//   unreadPill: {
//     marginLeft: 8, minWidth: 22, height: 22,
//     borderRadius: 11, backgroundColor: COLORS.brand,
//     alignItems: "center", justifyContent: "center",
//     paddingHorizontal: 6,
//   },
//   unreadPillText: { color: "#fff", fontSize: 11, fontWeight: "900" },
//   newBtn: {
//     width: 38, height: 38, borderRadius: 13,
//     backgroundColor: COLORS.brandSoft,
//     alignItems: "center", justifyContent: "center",
//     borderWidth: 1, borderColor: "#FFD6DF",
//   },

//   searchBar: {
//     flexDirection: "row", alignItems: "center", gap: 8,
//     marginHorizontal: 16, marginBottom: 8,
//     paddingHorizontal: 14, paddingVertical: 10,
//     backgroundColor: COLORS.card,
//     borderRadius: 14,
//     borderWidth: 1, borderColor: COLORS.border,
//   },
//   searchInput: {
//     flex: 1, fontSize: 14, fontWeight: "600",
//     color: COLORS.text, padding: 0,
//   },

//   separator: {
//     height: 1, backgroundColor: COLORS.border,
//     marginLeft: 80,
//   },

//   row: {
//     flexDirection: "row", alignItems: "center",
//     paddingHorizontal: 16, paddingVertical: 12,
//     backgroundColor: COLORS.bg,
//     gap: 12,
//   },
//   avatarWrap: { position: "relative" },
//   avatar: {
//     width: 52, height: 52, borderRadius: 26,
//     backgroundColor: COLORS.brandSoft,
//   },

//   rowContent: { flex: 1 },
//   rowTop: {
//     flexDirection: "row", alignItems: "center",
//     justifyContent: "space-between", marginBottom: 4,
//   },
//   rowName: {
//     fontSize: 15, fontWeight: "700",
//     color: COLORS.text, flex: 1, marginRight: 8,
//   },
//   rowNameUnread: { fontWeight: "900", color: "#0F172A" },
//   rowTime: {
//     fontSize: 12, fontWeight: "600", color: COLORS.muted,
//   },

//   rowBottom: {
//     flexDirection: "row", alignItems: "center",
//     justifyContent: "space-between",
//   },
//   rowLast: {
//     fontSize: 13, fontWeight: "500",
//     color: COLORS.muted, flex: 1, marginRight: 8,
//   },
//   rowLastUnread: { fontWeight: "700", color: "#374151" },

//   unreadBadge: {
//     minWidth: 20, height: 20, borderRadius: 10,
//     backgroundColor: COLORS.brand,
//     alignItems: "center", justifyContent: "center",
//     paddingHorizontal: 5,
//   },
//   unreadBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },

//   center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
//   emptyIcon: {
//     width: 72, height: 72, borderRadius: 36,
//     backgroundColor: COLORS.brandSoft,
//     alignItems: "center", justifyContent: "center",
//     marginBottom: 16,
//   },
//   emptyTitle: {
//     color: COLORS.text, fontWeight: "800", fontSize: 17, marginBottom: 6,
//   },
//   emptySub: {
//     color: COLORS.muted, fontWeight: "600", fontSize: 13,
//     textAlign: "center", lineHeight: 19,
//   },
// });
// app/newApp/chat/index.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, Platform, StatusBar,
  Animated, Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiFetch } from "../../../lib/apiFetch";

const C = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  inputBorder: "#E8E0D5",
  ink:         "#1C1A17",
  ink2:        "#3D3A34",
  muted:       "#8A8278",
  hint:        "#BCB6AD",
  teal:        "#22C55E",
  tealBg:      "#E8FAF7",
  tealText:    "#407a1a",
  coral:       "#FF6F6F",
  coralBg:     "#FFF0F0",
  coralText:   "#C0392B",
};
const R = { card: 20, input: 14, pill: 999 };

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
  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

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
      params: { userId: conv.otherUserId, name: conv.otherName, avatarUrl: conv.otherAvatar },
    });
  };

  const filtered = search.trim()
    ? conversations.filter(c => c.otherName.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
  const TOP = (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0) + 12;
  const fallback = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3ECFB2&color=fff&size=80`;

  return (
    <View style={[S.screen, { paddingTop: TOP }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <Animated.View style={[S.header, { opacity: fade }]}>

        <View style={S.headerInner}>
          <View style={S.heroIcon}><Text style={{ fontSize: 24 }}>💬</Text></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={S.headerTitle}>Messages</Text>
              {totalUnread > 0 && (
                <View style={S.unreadPill}>
                  <Text style={S.unreadPillText}>{totalUnread}</Text>
                </View>
              )}
            </View>
            <Text style={S.headerSub}>
              {conversations.length > 0 ? `${conversations.length} conversations` : "Start chatting"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/newApp/search" as any)}
            style={S.newBtn} hitSlop={10}
          >
            <Ionicons name="create-outline" size={20} color={C.tealText} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={S.searchShell}>
          <Ionicons name="search-outline" size={16} color={C.hint} />
          <TextInput
            style={S.searchInput}
            placeholder="Search conversations…"
            placeholderTextColor={C.hint}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} hitSlop={10} style={S.clearBtn}>
              <Text style={{ color: C.muted, fontSize: 15, fontWeight: "700", lineHeight: 17 }}>×</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* List */}
      {loading ? (
        <View style={S.center}>
          <View style={S.stateIcon}><Text style={{ fontSize: 32 }}>💬</Text></View>
          <Text style={S.stateTitle}>Loading chats…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.otherUserId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.teal} />}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 24, paddingTop: 8 }}
          ItemSeparatorComponent={() => <View style={S.separator} />}
          ListEmptyComponent={
            <View style={S.center}>
              <View style={S.stateIcon}>
                <Text style={{ fontSize: 32 }}>{search ? "🔎" : "💬"}</Text>
              </View>
              <Text style={S.stateTitle}>
                {search ? "No results found" : "No conversations yet"}
              </Text>
              <Text style={S.stateSub}>
                {search
                  ? `No chats matching "${search}"`
                  : "Start a conversation from someone's profile"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const unread = item.unreadCount > 0;
            const avatarUri = item.otherAvatar || fallback(item.otherName);
            return (
              <TouchableOpacity style={S.row} onPress={() => openChat(item)} activeOpacity={0.75}>
                {/* Avatar */}
                <View style={[S.avatarWrap, unread && { borderColor: C.teal + "88" }]}>
                  <Image source={{ uri: avatarUri }} style={S.avatar} />
                </View>

                {/* Content */}
                <View style={S.rowContent}>
                  <View style={S.rowTop}>
                    <Text style={[S.rowName, unread && S.rowNameUnread]} numberOfLines={1}>
                      {item.otherName}
                    </Text>
                    <Text style={[S.rowTime, unread && { color: C.tealText, fontWeight: "800" }]}>
                      {fmtTime(item.lastMessageAt)}
                    </Text>
                  </View>
                  <View style={S.rowBottom}>
                    <Text style={[S.rowLast, unread && S.rowLastUnread]} numberOfLines={1}>
                      {item.lastMessage || "Start a conversation"}
                    </Text>
                    {unread && (
                      <View style={S.unreadBadge}>
                        <Text style={S.unreadBadgeText}>
                          {item.unreadCount > 9 ? "9+" : item.unreadCount}
                        </Text>
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
    backgroundColor: C.card, borderBottomWidth: 1.5, borderBottomColor: C.cardBorder,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  headerInner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10,
  },
  heroIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: C.ink, letterSpacing: -0.4 },
  headerSub:   { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
  unreadPill:  {
    minWidth: 22, height: 22, borderRadius: R.pill,
    backgroundColor: C.coral, alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  unreadPillText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  newBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center",
  },

  searchShell: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: C.inputBg, borderRadius: R.input,
    borderWidth: 1.5, borderColor: C.inputBorder,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600", color: C.ink },
  clearBtn:    {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.inputBorder, alignItems: "center", justifyContent: "center",
  },

  separator: { height: 1.5, backgroundColor: C.cardBorder, marginLeft: 82 },

  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.bg, gap: 12,
  },
  avatarWrap: {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 2, borderColor: C.cardBorder, overflow: "hidden",
  },
  avatar:     { width: 54, height: 54 },
  rowContent: { flex: 1 },
  rowTop:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  rowName:        { fontSize: 15, fontWeight: "700", color: C.ink, flex: 1, marginRight: 8 },
  rowNameUnread:  { fontWeight: "900", color: C.ink },
  rowTime:        { fontSize: 11, fontWeight: "600", color: C.hint },
  rowBottom:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLast:        { fontSize: 13, fontWeight: "500", color: C.muted, flex: 1, marginRight: 8 },
  rowLastUnread:  { fontWeight: "700", color: C.ink2 },
  unreadBadge:    {
    minWidth: 20, height: 20, borderRadius: R.pill,
    backgroundColor: C.teal, alignItems: "center", justifyContent: "center", paddingHorizontal: 5,
  },
  unreadBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  center:     { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  stateIcon:  {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  stateTitle: { color: C.ink,  fontWeight: "900", fontSize: 17 },
  stateSub:   { color: C.muted, fontWeight: "600", fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 19 },
});