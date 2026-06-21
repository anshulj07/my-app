// components/MyBookings/Tabs/CreatedTab.tsx
import React, { useState } from "react";
import {
  View, Text, Image, RefreshControl,
  SectionList, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiFetch } from "../../../lib/apiFetch";
import Constants from "expo-constants";
import OtpVerifyModal from "../../../components/modals/OtpVerifyModal";

const C = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#F1F5F9",
  ink: "#111827",
  muted: "#6B7280",
  accent: "#6C63FF",
  accentLight: "#EEF2FF",
  green: "#ECFDF5",
  greenText: "#10B981",
  red: "#FEF2F2",
  redText: "#EF4444",
  blue: "#EFF6FF",
  blueText: "#2563EB",
};

export type EventDoc = {
  _id: string;
  title: string;
  emoji?: string;
  date?: string;
  time?: string;
  location?: any;
  kind?: string;
  status?: string;
  priceCents?: number;
  creatorClerkId?: string;
  bannerUri?: string;
  bannerImage?: string;
  attendees?: any[];
  startsAt?: string;
  endsAt?: string;
  joinPolicy?: string;
};

function eventStartMs(ev: EventDoc): number {
  if (ev.startsAt) { const t = new Date(ev.startsAt).getTime(); if (Number.isFinite(t)) return t; }
  const date = (ev.date ?? "").trim(); const time = (ev.time ?? "").trim();
  if (date && time) { const t = new Date(`${date} ${time}`).getTime(); if (Number.isFinite(t)) return t; }
  return Number.POSITIVE_INFINITY;
}

function getDisplayState(ev: EventDoc) {
  const status = String(ev.status || "active").toLowerCase();
  if (status === "paused") return { label: "Paused", color: C.red, text: C.redText, key: "paused" };
  if (status === "ended") return { label: "Ended", color: "#F1F5F9", text: C.muted, key: "ended" };
  if (ev.kind === "service") return { label: "Active", color: C.green, text: C.greenText, key: "active" };
  const start = eventStartMs(ev);
  if (!Number.isFinite(start) || start === Number.POSITIVE_INFINITY) return { label: "Upcoming", color: C.blue, text: C.blueText, key: "upcoming" };
  const now = Date.now();
  const endTs = ev.endsAt ? new Date(ev.endsAt).getTime() : start + (4 * 3600000);
  if (now > endTs) return { label: "Ended", color: "#F1F5F9", text: C.muted, key: "ended" };
  if (now >= start) return { label: "Live", color: "#EF4444", text: "#FFFFFF", key: "live" };
  return { label: "Upcoming", color: C.blue, text: C.blueText, key: "upcoming" };
}

export default function CreatedTab({
  created, refreshing, onRefresh, onPressEvent, onManageEvent,
}: {
  created: EventDoc[]; refreshing: boolean;
  onRefresh: () => void; onPressEvent: (ev: EventDoc) => void;
  onManageEvent?: (ev: EventDoc) => void;
}) {
  const sections: any[] = created.length ? [{ title: "CREATED BY YOU 🚀", data: created }] : [];
  const [verifyModal, setVerifyModal] = useState<{ visible: boolean; eventId: string; title: string }>({ visible: false, eventId: "", title: "" });

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={T.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        ListEmptyComponent={
          <View style={T.empty}>
            <View style={T.emptyImgBox}>
              <Ionicons name="create-outline" size={60} color={C.accent} />
            </View>
            <Text style={T.emptyTitle}>No Events Created</Text>
            <Text style={T.emptySub}>You haven't hosted any experiences yet.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={T.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <EventCard
            e={item}
            onPress={() => onPressEvent(item)}
            onManage={() => onManageEvent?.(item)}
            onVerify={() => setVerifyModal({ visible: true, eventId: item._id, title: item.title })}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <OtpVerifyModal
        visible={verifyModal.visible}
        onClose={() => setVerifyModal(prev => ({ ...prev, visible: false }))}
        eventId={verifyModal.eventId}
        eventTitle={verifyModal.title}
        onSuccess={onRefresh}
      />
    </>
  );
}

function EventCard({ e, onPress, onManage, onVerify }: any) {
  const banner = e.bannerUri || e.bannerImage || "";
  const attendees = Array.isArray(e.attendees) ? e.attendees : [];
  const state = getDisplayState(e);
  const isLive = state.key === "live" || state.key === "active";

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={T.card}>
      <View style={T.imgContainer}>
        {banner ? (
          <Image source={{ uri: banner }} style={T.img} />
        ) : (
          <View style={[T.img, { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ fontSize: 40 }}>{e.emoji || "📍"}</Text>
          </View>
        )}
        <View style={T.badgeLeft}>
          <View style={[T.statusBadge, { backgroundColor: state.color }]}>
            <View style={[T.dot, { backgroundColor: state.key === "live" ? "#FFFFFF" : state.text }]} />
            <Text style={[T.statusText, { color: state.text }]}>
              {state.label} {e.kind === "service" ? "Service" : "Event"}
            </Text>
          </View>
        </View>
      </View>

      <View style={T.body}>
        <View style={T.titleRow}>
          <Text style={T.title}>{e.title}</Text>
          <Ionicons name="ellipsis-horizontal" size={20} color={C.muted} />
        </View>

        <View style={T.grid}>
          <View style={T.gridCell}>
            <Text style={T.gridLabel}>WHEN</Text>
            <Text style={T.gridValue}>{e.date || "Not set"}</Text>
          </View>
          <View style={T.gridCell}>
            <Text style={T.gridLabel}>WHERE</Text>
            <Text style={T.gridValue} numberOfLines={1}>{e.location?.city || "Not set"}</Text>
          </View>
        </View>

        {/* QUICK OTP VERIFY - Only for Live/Active events */}
        {isLive && (
          <TouchableOpacity style={T.verifyBtn} onPress={(ev) => { ev.stopPropagation(); onVerify(); }}>
            <Ionicons name="key" size={16} color={C.accent} />
            <Text style={T.verifyBtnText}>Verify Guest OTP</Text>
          </TouchableOpacity>
        )}

        <View style={T.footer}>
          <View style={T.socialRow}>
            <Ionicons name="people" size={14} color={C.accent} />
            <Text style={T.goingText}>{attendees.length} joined</Text>
          </View>

          <TouchableOpacity style={T.manageBtn} onPress={(ev) => { ev.stopPropagation(); onManage(); }}>
            <Text style={T.manageBtnText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const T = StyleSheet.create({
  list: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: C.muted, marginBottom: 15, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { backgroundColor: C.white, borderRadius: 28, marginBottom: 25, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, overflow: "hidden" },
  imgContainer: { width: "100%", height: 160 },
  img: { width: "100%", height: "100%" },
  badgeLeft: { position: "absolute", top: 12, left: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "900" },
  body: { padding: 20 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  title: { fontSize: 18, fontWeight: "800", color: C.ink, flex: 1, marginRight: 10 },
  grid: { flexDirection: "row", gap: 10, marginBottom: 15 },
  gridCell: { flex: 1, backgroundColor: "#F8FAFC", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#F1F5F9" },
  gridLabel: { fontSize: 8, fontWeight: "900", color: C.muted, marginBottom: 4, letterSpacing: 0.5 },
  gridValue: { fontSize: 11, fontWeight: "700", color: C.ink },

  verifyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.accentLight,
    padding: 12, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: C.accent + "22"
  },
  verifyBtnText: { color: C.accent, fontSize: 13, fontWeight: "800" },

  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  socialRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  goingText: { fontSize: 12, color: C.muted, fontWeight: "800" },
  manageBtn: { backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  manageBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  empty: { alignItems: "center", justifyContent: "center", marginTop: 80 },
  emptyImgBox: { width: 120, height: 120, borderRadius: 30, backgroundColor: C.white, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 13, color: C.muted, textAlign: "center", paddingHorizontal: 40 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: C.ink },
  modalSub: { fontSize: 14, color: C.muted, fontWeight: "600", marginBottom: 20 },
  otpInput: {
    backgroundColor: "#F1F5F9", borderRadius: 14, padding: 16, fontSize: 18,
    fontWeight: "700", textAlign: "center", letterSpacing: 4, color: C.ink, marginBottom: 15
  },
  msgText: { textAlign: "center", fontSize: 13, fontWeight: "700", marginBottom: 15 },
  submitBtn: { backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});