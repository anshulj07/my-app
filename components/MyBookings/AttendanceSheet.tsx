import React from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  Modal, StyleSheet, Dimensions, Platform
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

const { height: SH } = Dimensions.get("window");

const C = {
  bg:          "#F8FAFC",
  white:       "#FFFFFF",
  ink:         "#0F172A",
  muted:       "#64748B",
  accent:      "#6366F1",
  border:      "#E2E8F0",
};

interface AttendanceSheetProps {
  visible: boolean;
  onClose: () => void;
  attendees: any[];
  title?: string;
}

export default function AttendanceSheet({ visible, onClose, attendees, title }: AttendanceSheetProps) {
  const router = useRouter();

  const timeAgo = (date: string | Date | undefined) => {
    if (!date) return "Recently";
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    let interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={S.overlay}>
        <TouchableOpacity style={S.dismissArea} activeOpacity={1} onPress={onClose} />
        <View style={S.sheet}>
          <View style={S.handle} />
          
          <View style={S.header}>
            <Text style={S.headerTitle}>Attendance List ({attendees.length})</Text>
            <TouchableOpacity onPress={onClose} style={S.closeBtn}>
              <Ionicons name="close" size={24} color={C.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={S.listContent}
          >
            {attendees.length > 0 ? attendees.map((att, i) => (
              <View key={i} style={S.attendeeItem}>
                <Image 
                  source={{ uri: att.imageUrl || `https://i.pravatar.cc/100?u=${att.clerkId || i}` }} 
                  style={S.avatar} 
                />
                <View style={S.info}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={S.name}>{att.name || "Guest"}</Text>
                    {att.isVerified && <Ionicons name="checkmark-circle" size={16} color="#0A84FF" />}
                  </View>
                  <Text style={S.status}>
                    {att.checkedIn ? "Checked in" : "Not checked in"} • {timeAgo(att.joinedAt)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={S.profileBtn} 
                  onPress={() => {
                    onClose();
                    router.push(`/profile/${att.clerkId || att.clerkUserId}`);
                  }}
                >
                  <Text style={S.profileBtnText}>Profile</Text>
                </TouchableOpacity>
              </View>
            )) : (
              <View style={S.empty}>
                <Ionicons name="people-outline" size={48} color={C.border} />
                <Text style={S.emptyText}>No attendees yet</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "flex-end" 
  },
  dismissArea: { 
    flex: 1 
  },
  sheet: { 
    backgroundColor: C.white, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    height: SH * 0.7,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 25, 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "900", 
    color: C.ink 
  },
  closeBtn: { 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  listContent: { 
    paddingHorizontal: 25, 
    paddingBottom: 40,
    paddingTop: 10,
  },
  attendeeItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: "#F1F5F9" 
  },
  info: { 
    flex: 1, 
    marginLeft: 15 
  },
  name: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: C.ink 
  },
  status: { 
    fontSize: 13, 
    color: C.muted, 
    marginTop: 2,
    fontWeight: "500"
  },
  profileBtn: { 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 12, 
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: C.border,
  },
  profileBtnText: { 
    fontSize: 13, 
    fontWeight: "700", 
    color: C.ink 
  },
  empty: { 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 60,
    gap: 15 
  },
  emptyText: { 
    fontSize: 16, 
    color: C.muted, 
    fontWeight: "600" 
  },
});
