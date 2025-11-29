import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function SettingsIndex() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      <Link href="./PersonalInfo" asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="person-circle-outline" size={26} />
          <Text style={styles.label}>Personal Information</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./AccountSettings" asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="settings-outline" size={26} />
          <Text style={styles.label}>Account Settings</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./Preferences" asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="options-outline" size={26} />
          <Text style={styles.label}>Preferences</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./History" asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="time-outline" size={26} />
          <Text style={styles.label}>History</Text>
        </TouchableOpacity>
      </Link>

      <Link href="./Security" asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="shield-checkmark-outline" size={26} />
          <Text style={styles.label}>Security</Text>
        </TouchableOpacity>
      </Link>

      {/* If your file is social.tsx, keep it ./social */}
      <Link href="./social" asChild>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="people-outline" size={26} />
          <Text style={styles.label}>Social & Community</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  label: { marginLeft: 14, fontSize: 18 },
});
