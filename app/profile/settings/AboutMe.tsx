// import React, { useEffect, useState } from "react";
// import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import { useAuth } from "@clerk/clerk-expo";
// import Constants from "expo-constants";
// import { apiFetch } from "../../../lib/apiFetch";

// const ABOUT_KEY = "profile.aboutMe";
// const ACCENT = "#E11D48"; // match your profile accent if you want to change it

// export default function AboutMe() {
//   const router = useRouter();
//   const { userId } = useAuth();
//   const [text, setText] = useState("");
//   const [saving, setSaving] = useState(false);

//   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

//   useEffect(() => {
//     (async () => {
//       const v = await AsyncStorage.getItem(ABOUT_KEY);
//       if (typeof v === "string") setText(v);

//       if (!API_BASE || !userId) return;
//       try {
//         const base = API_BASE.replace(/\/$/, "");
//         const res = await apiFetch(`${base}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, {
//           method: "GET",
//           headers: {
//             ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//           },
//         });
//         if (!res.ok) return;
//         const j = await res.json().catch(() => ({} as any));
//         const about = typeof j?.about === "string" ? j.about : "";
//         if (about.trim()) setText(about);
//       } catch {}
//     })();
//   }, [API_BASE, EVENT_API_KEY, userId]);

//   const onSave = async () => {
//     try {
//       setSaving(true);
//       await AsyncStorage.setItem(ABOUT_KEY, text); // accepts any string incl emojis/special chars

//       if (API_BASE && userId) {
//         const base = API_BASE.replace(/\/$/, "");
//         const res = await apiFetch(`${base}/api/profile`, {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//           },
//           body: JSON.stringify({ clerkUserId: userId, about: text }),
//         });

//         if (!res.ok) {
//           const t = await res.text().catch(() => "");
//           throw new Error(t || `Failed to save about (${res.status})`);
//         }
//       }

//       router.back(); // returns to Profile
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1, backgroundColor: "#fff" }}
//       behavior={Platform.select({ ios: "padding", android: undefined })}
//     >
//       {/* Top bar */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
//           <Ionicons name="chevron-back" size={22} color="#111" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>About Me</Text>
//         <View style={{ width: 40 }} />
//       </View>

//       <View style={styles.content}>
//         <Text style={styles.label}>Write something about you</Text>

//         <View style={styles.inputWrap}>
//           <TextInput
//             value={text}
//             onChangeText={setText}
//             placeholder="I love travelling..."
//             placeholderTextColor="#9CA3AF"
//             style={styles.input}
//             multiline
//             textAlignVertical="top"
//             autoCorrect
//           />
//         </View>

//         <TouchableOpacity
//           onPress={onSave}
//           disabled={saving}
//           activeOpacity={0.9}
//           style={[styles.saveBtn, saving && { opacity: 0.7 }]}
//         >
//           <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   header: {
//     height: 54,
//     paddingHorizontal: 14,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: "#E5E7EB",
//   },
//   backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
//   headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },

//   content: { padding: 16 },
//   label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 10 },

//   inputWrap: {
//     borderRadius: 16,
//     backgroundColor: "#F9FAFB",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     padding: 12,
//     minHeight: 160,
//   },
//   input: { fontSize: 16, color: "#111", minHeight: 140 },

//   saveBtn: {
//     marginTop: 16,
//     height: 50,
//     borderRadius: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#E11D48",
//   },
//   saveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
// });
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { apiFetch } from "../../../lib/apiFetch";

const ABOUT_KEY = "profile.aboutMe";

// ── DESIGN TOKENS ──────────────────────────────────────────
const C = {
  bg: "#F7F8FA", card: "#FFFFFF", cardBorder: "#EAECF0",
  inputBg: "#F7F8FA", inputBorder: "#E2E5EA",
  ink: "#0D1117", muted: "#656D76", hint: "#AFB8C1",
  brand: "#6C63FF", brandBg: "#F5F3FF", brandBorder: "#DDD6FE",
  brandText: "#5B21B6",
  font: "Outfit_500Medium",
  fontBold: "Outfit_700Bold",
  fontExtraBold: "Outfit_800ExtraBold",
};

export default function AboutMe() {
  const router = useRouter();
  const { userId } = useAuth();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem(ABOUT_KEY);
      if (typeof v === "string") setText(v);
      if (!API_BASE || !userId) return;
      try {
        const base = API_BASE.replace(/\/$/, "");
        const res = await apiFetch(`${base}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, {
          method: "GET",
          headers: { ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
        });
        if (!res.ok) return;
        const j = await res.json().catch(() => ({} as any));
        const about = typeof j?.about === "string" ? j.about : "";
        if (about.trim()) setText(about);
      } catch {}
    })();
  }, [API_BASE, EVENT_API_KEY, userId]);

  const onSave = async () => {
    try {
      setSaving(true);
      await AsyncStorage.setItem(ABOUT_KEY, text);
      if (API_BASE && userId) {
        const base = API_BASE.replace(/\/$/, "");
        const res = await apiFetch(`${base}/api/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
          },
          body: JSON.stringify({ clerkUserId: userId, about: text }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `Failed to save about (${res.status})`);
        }
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={S.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>About Me</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={S.content}>
        {/* Intro */}
        <View style={S.intro}>
          <View style={S.introIconBox}>
            <Ionicons name="person-outline" size={22} color={C.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.introTitle}>Tell your story</Text>
            <Text style={S.introSub}>Help others know who you are.</Text>
          </View>
        </View>

        {/* Input card */}
        <View style={S.inputCard}>
          <View style={S.inputCardHeader}>
            <Ionicons name="create-outline" size={14} color={C.muted} />
            <Text style={S.inputCardLabel}>About You</Text>
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="I love travelling, meeting new people…"
            placeholderTextColor={C.hint}
            style={S.input}
            multiline
            textAlignVertical="top"
            autoCorrect
            selectionColor={C.brand}
          />
          <Text style={S.charCount}>{text.length} chars</Text>
        </View>

        {/* Tip */}
        <View style={S.tip}>
          <Ionicons name="information-circle-outline" size={14} color={C.hint} />
          <Text style={S.tipText}>A good bio helps people connect with you at events.</Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.9}
          style={[S.saveBtn, saving && { opacity: 0.7 }]}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={S.saveText}>Save</Text>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  header: {
    height: 56, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#EAECF0",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F7F8FA", borderWidth: 1, borderColor: "#EAECF0",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: C.fontExtraBold, color: C.ink },

  content: { padding: 20, flex: 1 },

  intro: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder,
    padding: 16, marginBottom: 16,
  },
  introIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.brandBg, borderWidth: 1, borderColor: C.brandBorder,
    alignItems: "center", justifyContent: "center",
  },
  introTitle: { fontSize: 15, fontFamily: C.fontBold, color: C.ink, marginBottom: 2 },
  introSub: { fontSize: 12, fontFamily: C.font, color: C.muted },

  inputCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder,
    padding: 16, marginBottom: 10,
  },
  inputCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  inputCardLabel: { fontSize: 11, fontFamily: C.fontExtraBold, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  input: {
    fontSize: 15, fontFamily: C.font, color: C.ink,
    minHeight: 140, lineHeight: 22,
  },
  charCount: { fontSize: 11, color: C.hint, fontFamily: C.fontBold, textAlign: "right", marginTop: 8 },

  tip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 24, paddingHorizontal: 2,
  },
  tipText: { fontSize: 12, color: C.hint, fontFamily: C.font, flex: 1 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 52, borderRadius: 999,
    backgroundColor: C.brand,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  saveText: { color: "#fff", fontSize: 16, fontFamily: C.fontExtraBold },
});
