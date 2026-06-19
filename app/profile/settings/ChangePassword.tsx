// import React, { useState } from "react";
// import {
//   View, Text, TextInput, StyleSheet, TouchableOpacity,
//   Alert, SafeAreaView, Platform, KeyboardAvoidingView, ScrollView,
//   ActivityIndicator,
// } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { useRouter } from "expo-router";
// import { useUser, useSession } from "@clerk/clerk-expo";

// const COLORS = {
//   bg: "#FFF7FA",
//   card: "#FFFFFF",
//   text: "#111827",
//   muted: "#6B7280",
//   brand: "#FF4D6D",
//   brandSoft: "#FFF1F5",
//   border: "#F1F5F9",
//   success: "#10B981",
//   danger: "#EF4444",
// };

// export default function ChangePassword() {
//   const router = useRouter();
//   const { user } = useUser();
//   const { session } = useSession();

//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSave = async () => {
//     // Basic validation
//     if (!currentPassword || !newPassword || !confirmPassword) {
//       Alert.alert("Error", "Please fill in all fields.");
//       return;
//     }

//     if (newPassword.length < 8) {
//       Alert.alert("Error", "New password must be at least 8 characters long.");
//       return;
//     }

//     if (newPassword !== confirmPassword) {
//       Alert.alert("Error", "New passwords do not match.");
//       return;
//     }

//     if (currentPassword === newPassword) {
//       Alert.alert("Error", "New password cannot be the same as the current one.");
//       return;
//     }

//     setLoading(true);
//     try {
//       if (!user) throw new Error("User not found");

//       await user.updatePassword({
//         currentPassword,
//         newPassword,
//         signOutOfOtherSessions: false, // Keep the current device signed in
//       });

//       // Explicitly refresh the session token to prevent being signed out
//       if (session) {
//         await session.getToken();
//       }

//       setLoading(false);
//       Alert.alert("Success ✨", "Your password has been updated successfully.", [
//         { text: "OK", onPress: () => router.back() }
//       ]);
//       return;
//     } catch (err: any) {
//       console.error("Change password error:", err);
//       // Check for specific "signed out" error which might happen during sync
//       const msg = err.errors?.[0]?.message || err.message || "Failed to update password.";
      
//       if (msg.toLowerCase().includes("signed out")) {
//         Alert.alert("Session Sync", "Password updated, but session needs refresh. Please try navigating back or wait a moment.");
//       } else {
//         Alert.alert("Update Failed", msg);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safe}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={{ flex: 1 }}
//       >
//         <ScrollView
//           style={styles.container}
//           contentContainerStyle={styles.content}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//               <Ionicons name="chevron-back" size={24} color={COLORS.text} />
//             </TouchableOpacity>
//             <Text style={styles.title}>Change Password</Text>
//             <View style={{ width: 44 }} />
//           </View>

//           <View style={styles.intro}>
//             <Text style={styles.introHeading}>Security</Text>
//             <Text style={styles.introSub}>
//               Ensure your account is secure by using a strong password.
//             </Text>
//           </View>

//           <View style={styles.formArea}>
//             <PasswordField
//               label="Current Password"
//               value={currentPassword}
//               onChange={setCurrentPassword}
//               placeholder="Enter current password"
//             />
//             <PasswordField
//               label="New Password"
//               value={newPassword}
//               onChange={setNewPassword}
//               placeholder="Min. 8 characters"
//             />
//             <PasswordField
//               label="Confirm New Password"
//               value={confirmPassword}
//               onChange={setConfirmPassword}
//               placeholder="Repeat new password"
//             />
//           </View>

//           <TouchableOpacity
//             style={[styles.saveBtn, loading && { opacity: 0.7 }]}
//             onPress={handleSave}
//             disabled={loading}
//             activeOpacity={0.85}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <>
//                 <Text style={styles.saveText}>Update Password</Text>
//                 <Ionicons name="shield-checkmark" size={18} color="#fff" />
//               </>
//             )}
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const PasswordField = ({ label, value, onChange, placeholder }: any) => {
//   const [show, setShow] = useState(false);
//   return (
//     <View style={styles.block}>
//       <Text style={styles.blockLabel}>{label}</Text>
//       <View style={styles.inputRow}>
//         <TextInput
//           style={styles.input}
//           value={value}
//           onChangeText={onChange}
//           placeholder={placeholder}
//           placeholderTextColor="#94A3B8"
//           secureTextEntry={!show}
//           autoCapitalize="none"
//           selectionColor={COLORS.brand}
//         />
//         <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeBtn}>
//           <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.muted} />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: COLORS.bg },
//   container: { flex: 1 },
//   content: { padding: 20, paddingBottom: 60 },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 28,
//     marginTop: Platform.OS === "android" ? 10 : 0,
//   },
//   backBtn: {
//     width: 44,
//     height: 44,
//     borderRadius: 14,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#F1F5F9",
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 5,
//     shadowOffset: { width: 0, height: 2 },
//   },
//   title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
//   intro: { marginBottom: 32, paddingLeft: 4 },
//   introHeading: { fontSize: 28, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
//   introSub: { fontSize: 15, fontWeight: "600", color: COLORS.muted, marginTop: 4 },
//   formArea: { gap: 16 },
//   block: {
//     backgroundColor: COLORS.card,
//     borderRadius: 20,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     shadowColor: COLORS.brand,
//     shadowOpacity: 0.06,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 6 },
//   },
//   blockLabel: {
//     fontSize: 12,
//     fontWeight: "800",
//     color: COLORS.muted,
//     textTransform: "uppercase",
//     letterSpacing: 0.8,
//     marginBottom: 8,
//   },
//   inputRow: { flexDirection: "row", alignItems: "center" },
//   input: { flex: 1, fontSize: 16, fontWeight: "700", color: COLORS.text, paddingVertical: 4 },
//   eyeBtn: { padding: 4 },
//   saveBtn: {
//     marginTop: 40,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: COLORS.brand,
//     padding: 20,
//     borderRadius: 22,
//     gap: 12,
//     shadowColor: COLORS.brand,
//     shadowOpacity: 0.25,
//     shadowRadius: 15,
//     shadowOffset: { width: 0, height: 8 },
//     elevation: 8,
//   },
//   saveText: { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 0.3 },
// });
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useUser, useSession } from "@clerk/clerk-expo";

const C = {
  bg: "#F7F8FA", card: "#FFFFFF", cardBorder: "#EAECF0",
  inputBg: "#F7F8FA", inputBorder: "#E2E5EA",
  ink: "#0D1117", muted: "#656D76", hint: "#AFB8C1",
  green: "#22C55E", greenDark: "#16A34A", greenBg: "#DCFCE7",
  greenBorder: "#86EFAC", greenText: "#15803D",
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
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields."); return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long."); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match."); return;
    }
    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password cannot be the same as the current one."); return;
    }
    setLoading(true);
    try {
      if (!user) throw new Error("User not found");
      await user.updatePassword({ currentPassword, newPassword, signOutOfOtherSessions: false });
      if (session) { await session.getToken(); }
      setLoading(false);
      Alert.alert("Success", "Your password has been updated successfully.", [{ text: "OK", onPress: () => router.back() }]);
      return;
    } catch (err: any) {
      const msg = err.errors?.[0]?.message || err.message || "Failed to update password.";
      if (msg.toLowerCase().includes("signed out")) {
        Alert.alert("Session Sync", "Password updated, but session needs refresh.");
      } else { Alert.alert("Update Failed", msg); }
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={S.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

          <View style={S.header}>
            <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
              <Ionicons name="chevron-back" size={22} color={C.ink} />
            </TouchableOpacity>
            <Text style={S.title}>Change Password</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={S.intro}>
            <View style={S.introBadge}>
              <Ionicons name="shield-checkmark-outline" size={20} color={C.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.introH}>Update Password</Text>
              <Text style={S.introS}>Use a strong password to keep your account safe.</Text>
            </View>
          </View>

          <View style={S.formArea}>
            <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} placeholder="Enter current password" />
            <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} placeholder="Min. 8 characters" />
            <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat new password" />
          </View>

          {/* Password rules */}
          <View style={S.ruleCard}>
            <View style={S.ruleRow}>
              <Ionicons name={newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"} size={14} color={newPassword.length >= 8 ? C.green : C.hint} />
              <Text style={[S.ruleText, newPassword.length >= 8 && { color: C.greenText }]}>At least 8 characters</Text>
            </View>
            <View style={S.ruleRow}>
              <Ionicons name={newPassword === confirmPassword && newPassword.length > 0 ? "checkmark-circle" : "ellipse-outline"} size={14} color={newPassword === confirmPassword && newPassword.length > 0 ? C.green : C.hint} />
              <Text style={[S.ruleText, newPassword === confirmPassword && newPassword.length > 0 && { color: C.greenText }]}>Passwords match</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[S.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave} disabled={loading} activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={S.saveText}>Update Password</Text>
                  <Ionicons name="shield-checkmark" size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PasswordField = ({ label, value, onChange, placeholder }: any) => {
  const [show, setShow] = useState(false);
  return (
    <View style={S.block}>
      <View style={S.blockHeader}>
        <View style={S.iconCircle}><Ionicons name="key-outline" size={13} color={C.green} /></View>
        <Text style={S.blockLabel}>{label}</Text>
      </View>
      <View style={S.inputRow}>
        <TextInput
          style={S.input} value={value} onChangeText={onChange}
          placeholder={placeholder} placeholderTextColor={C.hint}
          secureTextEntry={!show} autoCapitalize="none" selectionColor={C.green}
        />
        <TouchableOpacity onPress={() => setShow(!show)} style={S.eyeBtn}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={C.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 24, marginTop: Platform.OS === "android" ? 10 : 0,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: C.card,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cardBorder,
  },
  title: { fontSize: 17, fontWeight: "800", color: C.ink },
  intro: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder,
    padding: 16, marginBottom: 20,
  },
  introBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenBorder,
    alignItems: "center", justifyContent: "center",
  },
  introH: { fontSize: 15, fontWeight: "800", color: C.ink, marginBottom: 2 },
  introS: { fontSize: 12, fontWeight: "500", color: C.muted },
  formArea: { gap: 12, marginBottom: 16 },
  block: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  iconCircle: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: C.greenBg, alignItems: "center", justifyContent: "center",
  },
  blockLabel: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, fontSize: 15, fontWeight: "600", color: C.ink, paddingVertical: 2 },
  eyeBtn: { padding: 4 },
  ruleCard: {
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder,
    padding: 14, gap: 8, marginBottom: 24,
  },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ruleText: { fontSize: 13, fontWeight: "600", color: C.hint },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    height: 52, borderRadius: 999, backgroundColor: C.green,
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
