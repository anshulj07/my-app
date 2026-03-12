import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, SafeAreaView, Platform, KeyboardAvoidingView, ScrollView,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useUser, useSession } from "@clerk/clerk-expo";

const COLORS = {
  bg: "#FFF7FA",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  brand: "#FF4D6D",
  brandSoft: "#FFF1F5",
  border: "#F1F5F9",
  success: "#10B981",
  danger: "#EF4444",
};

export default function ChangePassword() {
  const router = useRouter();
  const { user } = useUser();
  const { session } = useSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password cannot be the same as the current one.");
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error("User not found");

      await user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: false, // Keep the current device signed in
      });

      // Explicitly refresh the session token to prevent being signed out
      if (session) {
        await session.getToken();
      }

      setLoading(false);
      Alert.alert("Success ✨", "Your password has been updated successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
      return;
    } catch (err: any) {
      console.error("Change password error:", err);
      // Check for specific "signed out" error which might happen during sync
      const msg = err.errors?.[0]?.message || err.message || "Failed to update password.";
      
      if (msg.toLowerCase().includes("signed out")) {
        Alert.alert("Session Sync", "Password updated, but session needs refresh. Please try navigating back or wait a moment.");
      } else {
        Alert.alert("Update Failed", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Change Password</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.intro}>
            <Text style={styles.introHeading}>Security</Text>
            <Text style={styles.introSub}>
              Ensure your account is secure by using a strong password.
            </Text>
          </View>

          <View style={styles.formArea}>
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Min. 8 characters"
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat new password"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveText}>Update Password</Text>
                <Ionicons name="shield-checkmark" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PasswordField = ({ label, value, onChange, placeholder }: any) => {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={!show}
          autoCapitalize="none"
          selectionColor={COLORS.brand}
        />
        <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeBtn}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
    marginTop: Platform.OS === "android" ? 10 : 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  intro: { marginBottom: 32, paddingLeft: 4 },
  introHeading: { fontSize: 28, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
  introSub: { fontSize: 15, fontWeight: "600", color: COLORS.muted, marginTop: 4 },
  formArea: { gap: 16 },
  block: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.brand,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, fontSize: 16, fontWeight: "700", color: COLORS.text, paddingVertical: 4 },
  eyeBtn: { padding: 4 },
  saveBtn: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.brand,
    padding: 20,
    borderRadius: 22,
    gap: 12,
    shadowColor: COLORS.brand,
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  saveText: { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 0.3 },
});
