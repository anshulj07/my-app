import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const ABOUT_KEY = "profile.aboutMe";
const ACCENT = "#E11D48"; // match your profile accent if you want to change it

export default function AboutMe() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem(ABOUT_KEY);
      if (typeof v === "string") setText(v);
    })();
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);
      await AsyncStorage.setItem(ABOUT_KEY, text); // accepts any string incl emojis/special chars
      router.back(); // returns to Profile
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      {/* Top bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Me</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Write something about you</Text>

        <View style={styles.inputWrap}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="I love travelling..."
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            multiline
            textAlignVertical="top"
            autoCorrect
          />
        </View>

        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.9}
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        >
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },

  content: { padding: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 10 },

  inputWrap: {
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    minHeight: 160,
  },
  input: { fontSize: 16, color: "#111", minHeight: 140 },

  saveBtn: {
    marginTop: 16,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E11D48",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
