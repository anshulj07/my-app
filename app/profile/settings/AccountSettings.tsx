// app/(tabs)/profile/AccountSettings.tsx
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AccountSettings() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [appleConnected, setAppleConnected] = useState(false);
  const [fbConnected, setFbConnected] = useState(false);

  const [privateProfile, setPrivateProfile] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Settings</Text>

      {/* Change Password */}
      <TouchableOpacity style={styles.row}>
        <Ionicons name="key-outline" size={22} />
        <Text style={styles.label}>Change Password</Text>
      </TouchableOpacity>

      {/* Account Type */}
      <TouchableOpacity style={styles.row}>
        <Ionicons name="person-outline" size={22} />
        <Text style={styles.label}>Manage Account Type</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Social Login Connections</Text>

      {/* Google */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Google</Text>
        <Switch value={googleConnected} onValueChange={setGoogleConnected} />
      </View>

      {/* Apple */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Apple</Text>
        <Switch value={appleConnected} onValueChange={setAppleConnected} />
      </View>

      {/* Facebook */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Facebook</Text>
        <Switch value={fbConnected} onValueChange={setFbConnected} />
      </View>

      <Text style={styles.section}>Privacy</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Private Profile</Text>
        <Switch value={privateProfile} onValueChange={setPrivateProfile} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  section: {
    marginTop: 25,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: { marginLeft: 14, fontSize: 16 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  switchLabel: { fontSize: 16 },
});
