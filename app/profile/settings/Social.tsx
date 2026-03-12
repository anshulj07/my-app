// app/profile/settings/Social.tsx
// ✅ UPDATED: Invite Friends uses native Share API

import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Platform, Share, Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

const C = {
  bg: "#FFF7FA", card: "#FFFFFF", text: "#111827",
  muted: "#6B7280", brand: "#FF4D6D", brandSoft: "#FFF1F5",
  border: "#F1F5F9",
};

export default function Social() {
  const router = useRouter();
  const { userId } = useAuth();

  const handleInvite = async () => {
    try {
      await Share.share({
        title:   "Join me on Meetup!",
        message: "Hey! I'm using Meetup to discover cool local events. Download the app and let's connect! 🎉\n\nhttps://meetup.app/invite",
      });
    } catch (e: any) {
      if (e?.message !== "Share cancelled") {
        Alert.alert("Couldn't share", "Please try again.");
      }
    }
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView style={S.container} contentContainerStyle={S.content}>

        {/* Header */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={S.title}>Social</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={S.intro}>
          <Text style={S.introHeading}>Community</Text>
          <Text style={S.introSub}>Manage your connections and social activity.</Text>
        </View>

        {/* Social Rows */}
        <View style={S.card}>
          <SocialRow
            icon="people-outline"
            label="Friends & Following"
            hint="Manage your connections"
            onPress={() => router.push("/newApp/search" as any)}
          />
          <SocialRow
            icon="chatbubble-ellipses-outline"
            label="Messages"
            hint="View all your conversations"
            onPress={() => router.push("/newApp/chat" as any)}
          />
          <SocialRow
            icon="star-outline"
            label="Your Events"
            hint="Events you created or joined"
            onPress={() => router.push("/newApp/mybookings" as any)}
          />
          <SocialRow
            icon="notifications-outline"
            label="Notifications"
            hint="Activity on your events"
            onPress={() => router.push("/newApp/mybookings" as any)}
            isLast
          />
        </View>

        {/* Invite button — ✅ uses native Share */}
        <TouchableOpacity style={S.inviteBtn} onPress={handleInvite} activeOpacity={0.9}>
          <View style={S.inviteIcon}>
            <Ionicons name="gift-outline" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.inviteTitle}>Invite Friends</Text>
            <Text style={S.inviteSub}>Share the app with your network</Text>
          </View>
          <Ionicons name="share-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={S.footer}>Building a global traveler community 🌍</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const SocialRow = ({ icon, label, hint, onPress, isLast }: any) => (
  <TouchableOpacity
    style={[S.row, isLast && S.rowLast]}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={S.iconCircle}>
      <Ionicons name={icon} size={20} color={C.brand} />
    </View>
    <View style={S.rowBody}>
      <Text style={S.label}>{label}</Text>
      <Text style={S.hint}>{hint}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
  </TouchableOpacity>
);

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 28, marginTop: Platform.OS === "android" ? 10 : 0,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border,
  },
  title: { fontSize: 18, fontWeight: "800", color: C.text },
  intro: { marginBottom: 28, paddingLeft: 4 },
  introHeading: { fontSize: 28, fontWeight: "900", color: C.text, letterSpacing: -0.5 },
  introSub:     { fontSize: 15, fontWeight: "600", color: C.muted, marginTop: 4 },

  card: {
    backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border,
    overflow: "hidden", marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: "row", alignItems: "center",
    padding: 18, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconCircle: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: C.brandSoft,
    alignItems: "center", justifyContent: "center", marginRight: 16,
  },
  rowBody: { flex: 1 },
  label:   { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 2 },
  hint:    { fontSize: 13, fontWeight: "600", color: C.muted },

  inviteBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.brand, padding: 20, borderRadius: 24,
    shadowColor: C.brand, shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  inviteIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginRight: 16,
  },
  inviteTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  inviteSub:   { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", marginTop: 2 },

  footer: { textAlign: "center", color: C.muted, fontSize: 12, fontWeight: "600", marginTop: 30, opacity: 0.7 },
});