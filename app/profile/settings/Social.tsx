// app/(tabs)/profile/Social.tsx
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Social() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Social & Community</Text>

      <TouchableOpacity style={styles.row}>
        <Ionicons name="people-outline" size={22} />
        <Text style={styles.label}>Friends & Following</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row}>
        <Ionicons name="chatbubble-ellipses-outline" size={22} />
        <Text style={styles.label}>Activity Feed</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row}>
        <Ionicons name="star-outline" size={22} />
        <Text style={styles.label}>Your Interactions</Text>
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
});
