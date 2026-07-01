// // app/newApp/chat/[userId].tsx
// // WhatsApp-style 1-on-1 DM conversation screen
// // Params: userId (clerkUserId of other person), name, avatarUrl

// import React, { useCallback, useEffect, useRef, useState } from "react";
// import {
//   View, Text, TextInput, TouchableOpacity, FlatList,
//   KeyboardAvoidingView, Platform, StyleSheet, Image,
//   ActivityIndicator, StatusBar, Pressable,
// } from "react-native";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useAuth } from "@clerk/clerk-expo";
// import Constants from "expo-constants";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { apiFetch } from "../../../lib/apiFetch";

// const COLORS = {
//   bg:         "#FFF7FA",
//   brand:      "#FF4D6D",
//   brandSoft:  "#FFF1F5",
//   myBubble:   "#FF4D6D",
//   theirBubble:"#FFFFFF",
//   text:       "#111827",
//   muted:      "#6B7280",
//   border:     "#F1F5F9",
//   inputBg:    "#FFFFFF",
// };

// type Message = {
//   _id:             string;
//   fromClerkUserId: string;
//   toClerkUserId:   string;
//   text:            string;
//   createdAt:       string;
//   status:          "sent" | "delivered" | "read";
// };

// function fmtTime(iso: string) {
//   const d = new Date(iso);
//   if (!Number.isFinite(d.getTime())) return "";
//   return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
// }

// function fmtDateSeparator(iso: string) {
//   const d   = new Date(iso);
//   const now = new Date();
//   if (!Number.isFinite(d.getTime())) return "";
//   const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
//   if (diffDays === 0) return "Today";
//   if (diffDays === 1) return "Yesterday";
//   return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
// }

// function sameDay(a: string, b: string) {
//   return new Date(a).toDateString() === new Date(b).toDateString();
// }

// export default function ChatDMScreen() {
//   const router = useRouter();
//   const { userId } = useAuth();
//   const params = useLocalSearchParams<{ userId: string; name?: string; avatarUrl?: string }>();

//   const otherId    = String(params.userId || "");
//   const otherName  = String(params.name || "User");
//   const otherAvatar= String(params.avatarUrl || "");

//   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   const [messages,  setMessages]  = useState<Message[]>([]);
//   const [text,      setText]      = useState("");
//   const [loading,   setLoading]   = useState(true);
//   const [sending,   setSending]   = useState(false);

//   const flatRef    = useRef<FlatList>(null);
//   const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
//   const inputRef   = useRef<TextInput>(null);

//   // ── Fetch messages ────────────────────────────────────────────
//   const fetchMessages = useCallback(async () => {
//     if (!API_BASE || !userId || !otherId) return;
//     try {
//       const res  = await apiFetch(
//         `${API_BASE}/api/messages?fromClerkUserId=${encodeURIComponent(userId)}&toClerkUserId=${encodeURIComponent(otherId)}`,
//         { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined }
//       );
//       const json = await res.json().catch(() => null);
//       if (res.ok && Array.isArray(json?.messages)) {
//         setMessages(json.messages);
//       }
//     } catch {}
//     finally { setLoading(false); }
//   }, [API_BASE, EVENT_API_KEY, userId, otherId]);

//   useEffect(() => {
//     fetchMessages();
//     // Poll every 8s
//     pollRef.current = setInterval(fetchMessages, 8000);
//     return () => { if (pollRef.current) clearInterval(pollRef.current); };
//   }, [fetchMessages]);

//   // Auto-scroll to bottom when messages update
//   useEffect(() => {
//     if (messages.length > 0) {
//       setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
//     }
//   }, [messages.length]);

//   // ── Send message ─────────────────────────────────────────────
//   const sendMessage = async () => {
//     const trimmed = text.trim();
//     if (!trimmed || !API_BASE || !userId || !otherId || sending) return;

//     // Optimistic
//     const tempId = `temp_${Date.now()}`;
//     const optimistic: Message = {
//       _id:             tempId,
//       fromClerkUserId: userId,
//       toClerkUserId:   otherId,
//       text:            trimmed,
//       createdAt:       new Date().toISOString(),
//       status:          "sent",
//     };
//     setMessages(prev => [...prev, optimistic]);
//     setText("");
//     setSending(true);
//     setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);

//     try {
//       await apiFetch(`${API_BASE}/api/messages`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//         },
//         body: JSON.stringify({
//           fromClerkUserId: userId,
//           toClerkUserId:   otherId,
//           text:            trimmed,
//         }),
//       });
//       await fetchMessages(); // Refresh to get real _id
//     } catch {
//       // Revert optimistic on failure
//       setMessages(prev => prev.filter(m => m._id !== tempId));
//       setText(trimmed);
//     } finally {
//       setSending(false);
//     }
//   };

//   const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=FF4D6D&color=fff&size=80`;

//   // ── Render message bubble ─────────────────────────────────────
//   const renderItem = ({ item, index }: { item: Message; index: number }) => {
//     const isMe   = item.fromClerkUserId === userId;
//     const showDate = index === 0 || !sameDay(messages[index - 1].createdAt, item.createdAt);
//     const isTemp = item._id.startsWith("temp_");

//     return (
//       <>
//         {showDate && (
//           <View style={s.dateSep}>
//             <Text style={s.dateSepText}>{fmtDateSeparator(item.createdAt)}</Text>
//           </View>
//         )}
//         <View style={[s.bubbleRow, isMe ? s.bubbleRowMe : s.bubbleRowThem]}>
//           {/* Other person's avatar — only show on their side */}
//           {!isMe && (
//             <Image
//               source={{
//                 uri: typeof (otherAvatar || avatarFallback) === "string"
//                   ? (otherAvatar || avatarFallback)
//                   : (otherAvatar as any)?.url || avatarFallback
//               }}
//               style={s.bubbleAvatar}
//             />
//           )}
//           <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
//             <Text style={[s.bubbleText, isMe ? s.bubbleTextMe : s.bubbleTextThem]}>
//               {item.text}
//             </Text>
//             <View style={s.bubbleMeta}>
//               <Text style={[s.bubbleTime, isMe && { color: "rgba(255,255,255,0.65)" }]}>
//                 {fmtTime(item.createdAt)}
//               </Text>
//               {/* Read receipts — only for my messages */}
//               {isMe && (
//                 <Ionicons
//                   name={item.status === "read" ? "checkmark-done" : "checkmark"}
//                   size={13}
//                   color={item.status === "read" ? "#93C5FD" : "rgba(255,255,255,0.55)"}
//                   style={{ marginLeft: 3 }}
//                 />
//               )}
//               {isMe && isTemp && (
//                 <ActivityIndicator size={10} color="rgba(255,255,255,0.5)" style={{ marginLeft: 3 }} />
//               )}
//             </View>
//           </View>
//         </View>
//       </>
//     );
//   };

//   const TOP_PAD = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

//   return (
//     <View style={[s.screen, { paddingTop: TOP_PAD }]}>
//       <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

//       {/* ── Header ── */}
//       <View style={s.header}>
//         <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
//           <Ionicons name="chevron-back" size={22} color={COLORS.brand} />
//         </TouchableOpacity>

//         <Pressable
//           onPress={() => router.push({
//             pathname: "/profile/[clerkUserId]" as any,
//             params: { clerkUserId: otherId, name: otherName, imageUrl: otherAvatar },
//           })}
//           style={s.headerProfile}
//         >
//           <Image
//             source={{
//               uri: typeof (otherAvatar || avatarFallback) === "string"
//                 ? (otherAvatar || avatarFallback)
//                 : (otherAvatar as any)?.url || avatarFallback
//             }}
//             style={s.headerAvatar}
//           />
//           <View>
//             <Text style={s.headerName} numberOfLines={1}>{otherName}</Text>
//             <Text style={s.headerSub}>Tap to view profile</Text>
//           </View>
//         </Pressable>

//         {/* Optional: video/call icons in future */}
//         <View style={{ width: 40 }} />
//       </View>

//       {/* ── Messages ── */}
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
//       >
//         {loading ? (
//           <View style={s.center}>
//             <ActivityIndicator color={COLORS.brand} size="large" />
//           </View>
//         ) : messages.length === 0 ? (
//           <View style={s.center}>
//             <View style={s.emptyIcon}>
//               <Ionicons name="chatbubbles-outline" size={40} color={COLORS.brand} style={{ opacity: 0.4 }} />
//             </View>
//             <Text style={s.emptyTitle}>No messages yet</Text>
//             <Text style={s.emptySub}>Say hi to {otherName}! 👋</Text>
//           </View>
//         ) : (
//           <FlatList
//             ref={flatRef}
//             data={messages}
//             keyExtractor={(item) => item._id}
//             renderItem={renderItem}
//             contentContainerStyle={s.messageList}
//             showsVerticalScrollIndicator={false}
//             onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
//           />
//         )}

//         {/* ── Input bar ── */}
//         <View style={s.inputBar}>
//           <TextInput
//             ref={inputRef}
//             style={s.input}
//             placeholder={`Message ${otherName}...`}
//             placeholderTextColor={COLORS.muted}
//             value={text}
//             onChangeText={setText}
//             multiline
//             maxLength={1000}
//             returnKeyType="default"
//           />
//           <TouchableOpacity
//             onPress={sendMessage}
//             disabled={!text.trim() || sending}
//             style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
//             activeOpacity={0.8}
//           >
//             <Ionicons name="send" size={18} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: COLORS.bg },

//   // Header
//   header: {
//     flexDirection: "row", alignItems: "center",
//     paddingHorizontal: 12, paddingVertical: 10,
//     backgroundColor: COLORS.bg,
//     borderBottomWidth: 1, borderBottomColor: COLORS.border,
//     gap: 10,
//   },
//   backBtn: {
//     width: 36, height: 36, borderRadius: 12,
//     alignItems: "center", justifyContent: "center",
//     backgroundColor: COLORS.brandSoft,
//   },
//   headerProfile: {
//     flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
//   },
//   headerAvatar: {
//     width: 38, height: 38, borderRadius: 19,
//     backgroundColor: COLORS.brandSoft,
//   },
//   headerName: {
//     color: COLORS.text, fontWeight: "800", fontSize: 15,
//   },
//   headerSub: {
//     color: COLORS.muted, fontSize: 11, fontWeight: "600", marginTop: 1,
//   },

//   // Messages
//   messageList: {
//     paddingHorizontal: 12,
//     paddingTop: 12,
//     paddingBottom: 8,
//   },
//   dateSep: {
//     alignItems: "center", marginVertical: 16,
//   },
//   dateSepText: {
//     color: COLORS.muted, fontSize: 11, fontWeight: "700",
//     backgroundColor: COLORS.border,
//     paddingHorizontal: 10, paddingVertical: 3,
//     borderRadius: 99,
//     overflow: "hidden",
//   },
//   bubbleRow: {
//     flexDirection: "row", alignItems: "flex-end",
//     marginVertical: 2, gap: 6,
//   },
//   bubbleRowMe: { justifyContent: "flex-end" },
//   bubbleRowThem: { justifyContent: "flex-start" },

//   bubbleAvatar: {
//     width: 26, height: 26, borderRadius: 13,
//     backgroundColor: COLORS.brandSoft,
//     marginBottom: 2,
//   },

//   bubble: {
//     maxWidth: "75%",
//     paddingHorizontal: 14, paddingVertical: 9,
//     borderRadius: 18,
//   },
//   bubbleMe: {
//     backgroundColor: COLORS.myBubble,
//     borderBottomRightRadius: 4,
//     shadowColor: COLORS.brand,
//     shadowOpacity: 0.15,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 2,
//   },
//   bubbleThem: {
//     backgroundColor: COLORS.theirBubble,
//     borderBottomLeftRadius: 4,
//     borderWidth: 1, borderColor: COLORS.border,
//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 1 },
//     elevation: 1,
//   },
//   bubbleText: { fontSize: 15, lineHeight: 21 },
//   bubbleTextMe:   { color: "#fff", fontWeight: "600" },
//   bubbleTextThem: { color: COLORS.text, fontWeight: "500" },

//   bubbleMeta: {
//     flexDirection: "row", alignItems: "center",
//     marginTop: 3,
//   },
//   bubbleTime: {
//     fontSize: 10, fontWeight: "700", color: COLORS.muted,
//   },

//   // Input bar
//   inputBar: {
//     flexDirection: "row", alignItems: "flex-end",
//     paddingHorizontal: 12, paddingVertical: 10,
//     backgroundColor: COLORS.bg,
//     borderTopWidth: 1, borderTopColor: COLORS.border,
//     gap: 8,
//   },
//   input: {
//     flex: 1,
//     minHeight: 42, maxHeight: 120,
//     backgroundColor: COLORS.inputBg,
//     borderRadius: 21,
//     paddingHorizontal: 16, paddingVertical: 10,
//     fontSize: 15, fontWeight: "500",
//     color: COLORS.text,
//     borderWidth: 1, borderColor: COLORS.border,
//   },
//   sendBtn: {
//     width: 42, height: 42, borderRadius: 21,
//     backgroundColor: COLORS.brand,
//     alignItems: "center", justifyContent: "center",
//     shadowColor: COLORS.brand,
//     shadowOpacity: 0.3, shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 3,
//   },
//   sendBtnDisabled: { backgroundColor: "#E5E7EB", shadowOpacity: 0 },

//   // Empty / loading
//   center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
//   emptyIcon: {
//     width: 80, height: 80, borderRadius: 40,
//     backgroundColor: COLORS.brandSoft,
//     alignItems: "center", justifyContent: "center",
//     marginBottom: 16,
//   },
//   emptyTitle: { color: COLORS.text, fontWeight: "800", fontSize: 18 },
//   emptySub: { color: COLORS.muted, fontWeight: "600", fontSize: 14, marginTop: 6 },
// });
// app/newApp/chat/[userId].tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, StyleSheet, Image,
  ActivityIndicator, StatusBar, Pressable, Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiFetch } from "../../../lib/apiFetch";

const C = {
  bg:          "#FFFFFF",
  card:        "#FFFFFF",
  cardBorder:  "#F1F5F9",
  inputBg:     "#F8FAFC",
  inputBorder: "#E2E8F0",
  ink:         "#0F172A",
  muted:       "#64748B",
  hint:        "#94A3B8",
  purple:      "#6366F1",
  purpleBg:    "#EEF2FF",
  purpleText:  "#4F46E5",
};
const R = { pill: 999 };

type Message = {
  _id: string; fromClerkUserId: string; toClerkUserId: string;
  text: string; createdAt: string; status: "sent" | "delivered" | "read";
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDateSep(iso: string) {
  const d = new Date(iso), now = new Date();
  if (!Number.isFinite(d.getTime())) return "";
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function ChatDMScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const params = useLocalSearchParams<{ userId: string; name?: string; avatarUrl?: string }>();
  const otherId = String(params.userId || "");
  const otherName = String(params.name || "User");
  const otherAvatar = String(params.avatarUrl || "");

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);

  const flatRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const fallbackUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=6366F1&color=fff&size=80`;

  const fetchMessages = useCallback(async () => {
    if (!API_BASE || !userId || !otherId) return;
    try {
      const res = await apiFetch(
        `${API_BASE}/api/messages?fromClerkUserId=${encodeURIComponent(userId)}&toClerkUserId=${encodeURIComponent(otherId)}`,
        { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined }
      );
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.messages)) {
        setMessages(json.messages);
        if (json.chatStatus) {
          setIsLocked(!!json.chatStatus.isLocked);
          setLockReason(json.chatStatus.reason || null);
        }
      }
    } catch {}
    finally { setLoading(false); }
  }, [API_BASE, EVENT_API_KEY, userId, otherId]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    if (messages.length > 0)
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !API_BASE || !userId || !otherId || sending) return;
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, {
      _id: tempId, fromClerkUserId: userId, toClerkUserId: otherId,
      text: trimmed, createdAt: new Date().toISOString(), status: "sent",
    }]);
    setText(""); setSending(true);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);
    try {
      await apiFetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
        body: JSON.stringify({ fromClerkUserId: userId, toClerkUserId: otherId, text: trimmed }),
      });
      await fetchMessages();
    } catch {
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setText(trimmed);
    } finally { setSending(false); }
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.fromClerkUserId === userId;
    const showDate = index === 0 || !sameDay(messages[index - 1].createdAt, item.createdAt);
    const isTemp = item._id.startsWith("temp_");
    const avatarUri = otherAvatar || fallbackUri;

    return (
      <>
        {showDate && (
          <View style={S.dateSep}>
            <View style={S.dateSepPill}>
              <Text style={S.dateSepText}>{fmtDateSep(item.createdAt)}</Text>
            </View>
          </View>
        )}
        <View style={[S.bubbleRow, isMe ? S.bubbleRowMe : S.bubbleRowThem]}>
          {!isMe && (
            <Image source={{ uri: avatarUri }} style={S.bubbleAvatar} />
          )}
          <View style={[S.bubble, isMe ? S.bubbleMe : S.bubbleThem]}>
            <Text style={[S.bubbleText, isMe ? S.bubbleTextMe : S.bubbleTextThem]}>
              {item.text}
            </Text>
            <View style={S.bubbleMeta}>
              <Text style={[S.bubbleTime, isMe && { color: "rgba(255,255,255,0.65)" }]}>
                {fmtTime(item.createdAt)}
              </Text>
              {isMe && (
                <Ionicons
                  name={item.status === "read" ? "checkmark-done" : "checkmark"}
                  size={12}
                  color={item.status === "read" ? "#93C5FD" : "rgba(255,255,255,0.55)"}
                  style={{ marginLeft: 3 }}
                />
              )}
              {isMe && isTemp && (
                <ActivityIndicator size={10} color="rgba(255,255,255,0.5)" style={{ marginLeft: 3 }} />
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  const TOP = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <View style={[S.screen, { paddingTop: TOP }]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <Animated.View style={[S.header, { opacity: fade }]}>

        <View style={S.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color={C.purple} />
          </TouchableOpacity>
          <Pressable
            onPress={() => router.push({
              pathname: "/profile/[clerkUserId]" as any,
              params: { clerkUserId: otherId, name: otherName, imageUrl: otherAvatar },
            })}
            style={S.headerProfile}
          >
            <View style={S.avatarWrap}>
              <Image source={{ uri: otherAvatar || fallbackUri }} style={S.headerAvatar} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={S.headerName} numberOfLines={1}>{otherName}</Text>
                {params.isVerified === "true" && <Ionicons name="checkmark-circle" size={14} color="#0A84FF" />}
              </View>
            </View>
          </Pressable>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {loading ? (
          <View style={S.center}>
            <View style={S.stateIcon}><Text style={{ fontSize: 30 }}>💬</Text></View>
            <Text style={S.stateTitle}>Loading messages…</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={S.center}>
            <View style={S.stateIcon}><Text style={{ fontSize: 32 }}>👋</Text></View>
            <Text style={S.stateTitle}>No messages yet</Text>
            <Text style={S.stateSub}>Say hi to {otherName}!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef} data={messages}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={S.messageList}
            showsVerticalScrollIndicator={false}
            onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {isLocked ? (
          <View style={S.lockedBar}>
            <View style={S.lockedIconCircle}>
              <Ionicons name="lock-closed" size={20} color={C.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.lockedTitle}>Chat Locked</Text>
              <Text style={S.lockedSub}>
                {lockReason === "no_confirmed_booking" 
                  ? "Confirm your booking to start chatting" 
                  : lockReason === "event_ended"
                  ? "This event has ended. Communication is closed."
                  : "This chat has been archived."}
              </Text>
            </View>
          </View>
        ) : (
          <View style={S.inputBar}>
            <View style={S.inputShell}>
              <TextInput
                style={S.input}
                placeholder={`Message ${otherName}…`}
                placeholderTextColor={C.hint}
                value={text}
                onChangeText={setText}
                multiline maxLength={1000}
              />
            </View>
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!text.trim() || sending}
              style={[S.sendBtn, (!text.trim() || sending) && S.sendBtnOff]}
              activeOpacity={0.85}
            >
              {sending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="send" size={17} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.card, borderBottomWidth: 1.5, borderBottomColor: C.cardBorder,
    shadowColor: C.purple, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  headerInner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.purpleBg, borderWidth: 1.5, borderColor: C.purple + "44",
    alignItems: "center", justifyContent: "center",
  },
  headerProfile: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  avatarWrap:    { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: C.purple + "55", overflow: "hidden" },
  headerAvatar:  { width: 40, height: 40 },
  headerName:    { fontSize: 15, fontWeight: "900", color: C.ink, letterSpacing: -0.2 },
  headerSub:     { fontSize: 11, fontWeight: "600", color: C.muted, marginTop: 1 },

  messageList: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },

  dateSep:     { alignItems: "center", marginVertical: 18 },
  dateSepPill: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: R.pill,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
  },
  dateSepText: { color: C.muted, fontSize: 11, fontWeight: "700" },

  bubbleRow:     { flexDirection: "row", alignItems: "flex-end", marginVertical: 3, gap: 7 },
  bubbleRowMe:   { justifyContent: "flex-end" },
  bubbleRowThem: { justifyContent: "flex-start" },
  bubbleAvatar:  {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.purpleBg, borderWidth: 1.5, borderColor: C.purple + "44", marginBottom: 2,
  },
  bubble: { maxWidth: "74%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: {
    backgroundColor: C.purple, borderBottomRightRadius: 5,
    shadowColor: C.purple, shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  bubbleThem: {
    backgroundColor: C.card, borderBottomLeftRadius: 5,
    borderWidth: 1.5, borderColor: C.cardBorder,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  bubbleText:     { fontSize: 15, lineHeight: 22 },
  bubbleTextMe:   { color: "#FFFFFF", fontWeight: "500" },
  bubbleTextThem: { color: C.ink, fontWeight: "500" },
  bubbleMeta:     { flexDirection: "row", alignItems: "center", marginTop: 4 },
  bubbleTime:     { fontSize: 10, fontWeight: "700", color: C.muted },
  
  lockedBar: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 18,
    backgroundColor: C.inputBg, borderTopWidth: 1.5, borderTopColor: C.inputBorder,
  },
  lockedIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.cardBorder, alignItems: "center", justifyContent: "center",
  },
  lockedTitle: { fontSize: 15, fontWeight: "900", color: C.ink, marginBottom: 2 },
  lockedSub:   { fontSize: 12, fontWeight: "600", color: C.muted, lineHeight: 16 },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.card, borderTopWidth: 1.5, borderTopColor: C.cardBorder,
  },
  inputShell: {
    flex: 1, backgroundColor: C.inputBg, borderRadius: 22,
    borderWidth: 1.5, borderColor: C.inputBorder,
    paddingHorizontal: 16, paddingVertical: 10, minHeight: 44,
  },
  input:      { fontSize: 15, fontWeight: "500", color: C.ink, maxHeight: 120 },
  sendBtn:    {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.purple,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.purple, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  sendBtnOff: { backgroundColor: C.inputBorder, shadowOpacity: 0 },

  center:     { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  stateIcon:  {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.tealBg, borderWidth: 1.5, borderColor: C.teal + "44",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  stateTitle: { color: C.ink,  fontWeight: "900", fontSize: 18 },
  stateSub:   { color: C.muted, fontWeight: "600", fontSize: 14, marginTop: 6 },
});