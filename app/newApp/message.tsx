import { View, Text, StyleSheet } from "react-native";

export default function Message() {
  return (
    <View style={styles.container}>
      <Text style={styles.txt}>Messages</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  txt: { fontSize: 20 },
});
