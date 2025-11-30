import { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PersonalInfo() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    city: "",
    country: "",
  });

  // Load saved data
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("user_profile");
      if (stored) {
        setForm(JSON.parse(stored));
      }
    })();
  }, []);

  // Save updated data
  const saveProfile = async () => {
    await AsyncStorage.setItem("user_profile", JSON.stringify(form));
    Alert.alert("Saved", "Your details have been updated.");
  };

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Personal Information</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(v) => handleChange("name", v)}
        placeholder="Enter your name"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={form.email}
        onChangeText={(v) => handleChange("email", v)}
        placeholder="Enter your email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={form.phone}
        onChangeText={(v) => handleChange("phone", v)}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Gender</Text>
      <TextInput
        style={styles.input}
        value={form.gender}
        onChangeText={(v) => handleChange("gender", v)}
        placeholder="Male / Female / Other"
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={form.city}
        onChangeText={(v) => handleChange("city", v)}
        placeholder="City"
      />

      <Text style={styles.label}>Country</Text>
      <TextInput
        style={styles.input}
        value={form.country}
        onChangeText={(v) => handleChange("country", v)}
        placeholder="Country"
      />

      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { marginTop: 14, fontSize: 16, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#0A84FF",
    padding: 16,
    borderRadius: 10,
    marginTop: 30,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
