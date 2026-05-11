// components/MyBookings/NotificationSheet.tsx
import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Modal, Image, ActivityIndicator, Pressable,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { NotifItem } from "../../context/NotificationContext";

// ─────────────────────────────────────────────────────────────
//  TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#FFFFFF",
  primary: "#6C63FF", // Brand Purple
  ink:     "#1C1A17",
  ink2:    "#4A453E",
  muted:   "#8A8278",
  border:  "#F0EBE3",
  surface: "#FAF7F2",
  white:   "#FFFFFF",
  coral:   "#FF6F6F",
  coralBg: "#FFF0F0",
  brandSoft: "#EEF2FF",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? "1d ago" : `${d}d ago`;
  if (h > 0) return h === 1 ? "1h ago" : `${h}h ago`;
  if (m > 0) return m === 1 ? "1m ago" : `${m}m ago`;
  return "Just now";
}

export default function NotificationSheet({
  visible, onClose, items, loading, admitBusy, onAdmit, onReject, onPressEvent, onPressUser, onMarkRead
}: {
  visible: boolean;
  onClose: () => void;
  items: NotifItem[];
  loading: boolean;
  admitBusy: Record<string, boolean>;
  onAdmit: (item: NotifItem) => void;
  onReject: (item: NotifItem) => void;
  onPressEvent: (eventId: string) => void;
  onPressUser: (clerkUserId: string) => void;
  onMarkRead: () => void;
}) {
  const pending = items.filter(i => i.type === "pending");
  const joined  = items.filter(i => i.type === "joined");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.root}>
        <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={onClose} />
        
        <BlurView intensity={Platform.OS === "ios" ? 100 : 120} tint="light" style={S.sheet}>
          {/* Header */}
          <View style={S.header}>
            <View style={S.grabber} />
            <View style={S.headerRow}>
              <View>
                <Text style={S.headerTitle}>Notifications</Text>
                <Text style={S.headerSub}>{items.length} updates found</Text>
              </View>
              <View style={S.headerActions}>
                <TouchableOpacity onPress={onMarkRead} style={S.markBtn}>
                   <Text style={S.markTxt}>Mark all read</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={S.closeBtn}>
                  <Ionicons name="close" size={20} color={C.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
            {loading && (
              <View style={S.center}>
                <ActivityIndicator color={C.primary} size="large" />
              </View>
            )}

            {!loading && items.length === 0 && (
              <View style={S.empty}>
                <View style={S.emptyIcon}>
                   <Ionicons name="notifications-off-outline" size={32} color={C.muted} />
                </View>
                <Text style={S.emptyTitle}>All caught up!</Text>
                <Text style={S.emptySub}>Join requests and recent activity will appear here.</Text>
              </View>
            )}

            {/* Join Requests */}
            {pending.length > 0 && (
              <View style={S.section}>
                <View style={S.sectionHead}>
                  <Text style={S.sectionTitle}>JOIN REQUESTS</Text>
                  <View style={S.badge}><Text style={S.badgeTxt}>{pending.length}</Text></View>
                </View>
                {pending.map(item => {
                  const admitKey  = `${item.id}-admit`;
                  const rejectKey = `${item.id}-reject`;
                  const busy      = !!(admitBusy[admitKey] || admitBusy[rejectKey]);
                  return (
                    <View key={item.id} style={S.card}>
                      <View style={S.cardRow}>
                        <View style={S.avatar}>
                          {item.userImageUrl
                            ? <Image source={{ uri: item.userImageUrl }} style={S.avatarImg} />
                            : <Text style={S.avatarLetter}>{(item.userName || "?")[0].toUpperCase()}</Text>
                          }
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={S.cardText} numberOfLines={2}>
                            <Text style={S.boldText} onPress={() => onPressUser(item.userClerkId)}>
                              {item.userName}
                            </Text>
                            <Text style={S.normalText}> wants to join </Text>
                            <Text style={S.eventText} onPress={() => onPressEvent(item.eventId)}>
                              {item.eventEmoji} {item.eventTitle}
                            </Text>
                          </Text>
                          <Text style={S.timeText}>{timeAgo(item.timestamp)}</Text>
                        </View>
                      </View>
                      
                      {!!item.message && (
                        <View style={S.msgBox}>
                          <Text style={S.msgText}>"{item.message}"</Text>
                        </View>
                      )}

                      <View style={S.actionRow}>
                        <TouchableOpacity 
                          onPress={() => onAdmit(item)} 
                          disabled={busy} 
                          style={[S.admitBtn, busy && { opacity: 0.5 }]}
                        >
                          {admitBusy[admitKey] ? <ActivityIndicator color="#fff" size="small" /> : <Text style={S.admitTxt}>Admit</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => onReject(item)} 
                          disabled={busy} 
                          style={[S.rejectBtn, busy && { opacity: 0.5 }]}
                        >
                          {admitBusy[rejectKey] ? <ActivityIndicator color={C.muted} size="small" /> : <Text style={S.rejectTxt}>Decline</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Recent Activity */}
            {joined.length > 0 && (
              <View style={S.section}>
                <View style={S.sectionHead}>
                  <Text style={S.sectionTitle}>RECENT ACTIVITY</Text>
                </View>
                {joined.map(item => (
                  <TouchableOpacity 
                    key={item.id} 
                    onPress={() => onPressEvent(item.eventId)} 
                    style={S.activityRow}
                    activeOpacity={0.7}
                  >
                    <View style={S.avatarSm}>
                      {item.userImageUrl
                        ? <Image source={{ uri: item.userImageUrl }} style={S.avatarImg} />
                        : <Text style={S.avatarLetterSm}>{(item.userName || "?")[0].toUpperCase()}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.cardText} numberOfLines={2}>
                        <Text style={S.boldText} onPress={() => onPressUser(item.userClerkId)}>
                          {item.userName}
                        </Text>
                        <Text style={S.normalText}> joined </Text>
                        <Text style={S.eventText} onPress={() => onPressEvent(item.eventId)}>
                          {item.eventEmoji} {item.eventTitle}
                        </Text>
                      </Text>
                      <Text style={S.timeText}>{timeAgo(item.timestamp)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={C.border} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    height: "90%", backgroundColor: "rgba(255,255,255,0.8)",
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    overflow: "hidden",
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.1)", alignSelf: "center", marginTop: 12 },
  header: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: C.ink },
  headerSub: { fontSize: 13, color: C.muted, fontWeight: "600", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  markBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: C.brandSoft },
  markTxt: { fontSize: 12, fontWeight: "800", color: C.primary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" },
  
  scroll: { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 20 },
  center: { paddingVertical: 40, alignItems: "center" },
  
  empty: { alignItems: "center", marginTop: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 24, backgroundColor: "rgba(0,0,0,0.03)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: C.ink, marginBottom: 4 },
  emptySub: { fontSize: 14, color: C.muted, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },

  section: { marginBottom: 32 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: C.muted, letterSpacing: 1 },
  badge: { backgroundColor: C.coral, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeTxt: { color: "#fff", fontSize: 10, fontWeight: "900" },

  card: { backgroundColor: C.white, borderRadius: 24, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.brandSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  avatarLetter: { fontSize: 18, fontWeight: "900", color: C.primary },
  cardText: { fontSize: 14, lineHeight: 20 },
  boldText: { fontWeight: "800", color: C.ink },
  normalText: { color: C.ink2, fontWeight: "600" },
  eventText: { color: C.primary, fontWeight: "800" },
  timeText: { fontSize: 11, color: C.muted, fontWeight: "700", marginTop: 4 },
  
  msgBox: { marginTop: 12, padding: 12, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  msgText: { fontSize: 13, color: C.ink2, fontWeight: "600", fontStyle: "italic" },
  
  actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  admitBtn: { flex: 1, height: 46, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  admitTxt: { color: "#fff", fontWeight: "900", fontSize: 14 },
  rejectBtn: { flex: 1, height: 46, borderRadius: 16, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  rejectTxt: { color: C.ink2, fontWeight: "800", fontSize: 14 },

  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.03)" },
  avatarSm: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.brandSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarLetterSm: { fontSize: 15, fontWeight: "900", color: C.primary },
});
