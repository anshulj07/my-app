// app/(tabs)/profile/Security.tsx
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from "react-native";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Security() {
  const [twoFA, setTwoFA] = useState(false);

  const deleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {} },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Security</Text>

      {/* 2FA */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Two-Factor Authentication</Text>
        <Switch value={twoFA} onValueChange={setTwoFA} />
      </View>

      {/* Login Activity */}
      <TouchableOpacity style={styles.row}>
        <Ionicons name="lock-closed-outline" size={22} />
        <Text style={styles.label}>Recent Login Activity</Text>
      </TouchableOpacity>

      {/* Logout Everywhere */}
      <TouchableOpacity style={styles.row}>
        <Ionicons name="exit-outline" size={22} />
        <Text style={styles.label}>Log Out on All Devices</Text>
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={deleteAccount}>
        <Ionicons name="trash-outline" size={22} color="red" />
        <Text style={[styles.label, { color: "red" }]}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
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
