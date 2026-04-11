// // // app/profile/settings/AccountSettings.tsx
// // // ✅ FIXED:
// // //   1. Delete Account → actual API call (sets isDeleted: true, then signs out)
// // //   2. Private Profile → saved to DB via PATCH /api/profile

// // import React, { useEffect, useState } from "react";
// // import {
// //   View, Text, StyleSheet, TouchableOpacity,
// //   Switch, ScrollView, SafeAreaView, Platform, Alert, ActivityIndicator,
// // } from "react-native";
// // import Ionicons from "@expo/vector-icons/Ionicons";
// // import { useRouter } from "expo-router";
// // import Constants from "expo-constants";
// // import { useAuth } from "@clerk/clerk-expo";
// // import { apiFetch } from "../../../lib/apiFetch";

// // const C = {
// //   bg: "#FFF7FA", card: "#FFFFFF", text: "#111827",
// //   muted: "#6B7280", brand: "#FF4D6D", brandSoft: "#FFF1F5",
// //   border: "#F3F4F6", danger: "#EF4444", success: "#10B981",
// // };

// // export default function AccountSettings() {
// //   const router = useRouter();
// //   const { userId, signOut } = useAuth();

// //   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
// //   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

// //   const [privateProfile, setPrivateProfile] = useState(false);
// //   const [savingPrivacy,  setSavingPrivacy]  = useState(false);
// //   const [deleting,       setDeleting]       = useState(false);

// //   const headers = {
// //     "Content-Type": "application/json",
// //     ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
// //   };

// //   // Load current privacy setting
// //   useEffect(() => {
// //     if (!API_BASE || !userId) return;
// //     (async () => {
// //       try {
// //         const res  = await apiFetch(
// //           `${API_BASE}/api/profile?clerkUserId=${encodeURIComponent(userId)}`,
// //           { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined }
// //         );
// //         const json = await res.json().catch(() => ({}));
// //         const src  = json?.profile || json?.data || json;
// //         setPrivateProfile(!!src?.isPrivate);
// //       } catch {}
// //     })();
// //   }, [API_BASE, userId]);

// //   const togglePrivate = async (val: boolean) => {
// //     setPrivateProfile(val);
// //     if (!API_BASE || !userId) return;
// //     setSavingPrivacy(true);
// //     try {
// //       await apiFetch(`${API_BASE}/api/profile`, {
// //         method: "PATCH", headers,
// //         body: JSON.stringify({ clerkUserId: userId, isPrivate: val }),
// //       });
// //     } catch {
// //       setPrivateProfile(!val); // revert
// //     } finally {
// //       setSavingPrivacy(false);
// //     }
// //   };

// //   // ✅ FIXED: actual DB call + sign out
// //   const handleDeleteAccount = () => {
// //     Alert.alert(
// //       "Delete Account",
// //       "This will permanently delete all your data. This cannot be undone.",
// //       [
// //         { text: "Cancel", style: "cancel" },
// //         {
// //           text: "Delete Forever",
// //           style: "destructive",
// //           onPress: async () => {
// //             if (!API_BASE || !userId) { await signOut(); return; }
// //             setDeleting(true);
// //             try {
// //               await apiFetch(`${API_BASE}/api/users/delete-account`, {
// //                 method: "DELETE", headers,
// //                 body: JSON.stringify({ clerkUserId: userId }),
// //               });
// //             } catch {}
// //             finally {
// //               setDeleting(false);
// //               await signOut();
// //               router.replace("/sign-in" as any);
// //             }
// //           },
// //         },
// //       ]
// //     );
// //   };

// //   return (
// //     <SafeAreaView style={S.safe}>
// //       <ScrollView style={S.container} contentContainerStyle={S.content}>

// //         {/* Header */}
// //         <View style={S.header}>
// //           <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
// //             <Ionicons name="chevron-back" size={24} color={C.text} />
// //           </TouchableOpacity>
// //           <Text style={S.title}>Account Settings</Text>
// //           <View style={{ width: 40 }} />
// //         </View>

// //         {/* Security & Access */}
// //         <Section title="Security & Access">
// //           <Row icon="key-outline"             label="Change Password"    onPress={() => router.push("/profile/settings/ChangePassword" as any)} showChevron />
// //           <Row icon="person-outline"          label="Manage Account Type" onPress={() => {}} showChevron />
// //           <Row icon="shield-checkmark-outline" label="Two-Factor Auth"   hint="Managed via Clerk" onPress={() => {}} showChevron />
// //         </Section>

// //         {/* Social Connections */}
// //         <Section title="Social Login Connections">
// //           <Row icon="logo-google"   label="Google"   hint="Connected"    iconColor="#DB4437" onPress={() => {}} showChevron />
// //           <Row icon="logo-apple"    label="Apple"    hint="Not connected" iconColor="#000"   onPress={() => {}} showChevron />
// //           <Row icon="logo-facebook" label="Facebook" hint="Not connected" iconColor="#4267B2" onPress={() => {}} showChevron />
// //         </Section>

// //         {/* Privacy */}
// //         <Section title="Privacy & Visibility">
// //           <View style={S.row}>
// //             <View style={[S.iconBox, { backgroundColor: C.brandSoft }]}>
// //               <Ionicons name="eye-off-outline" size={20} color={C.brand} />
// //             </View>
// //             <View style={S.rowBody}>
// //               <Text style={S.label}>Private Profile</Text>
// //               <Text style={S.hint}>Only connections can see your full profile</Text>
// //             </View>
// //             {savingPrivacy
// //               ? <ActivityIndicator color={C.brand} />
// //               : <Switch
// //                   value={privateProfile}
// //                   onValueChange={togglePrivate}
// //                   trackColor={{ false: "#E2E8F0", true: C.brand }}
// //                   thumbColor="#fff"
// //                   ios_backgroundColor="#E2E8F0"
// //                 />
// //             }
// //           </View>
// //           <Row icon="document-text-outline" label="Data Usage & Privacy" onPress={() => {}} showChevron />
// //         </Section>

// //         {/* Danger Zone */}
// //         <Section title="Danger Zone" titleColor={C.danger}>
// //           <TouchableOpacity
// //             style={[S.row, S.rowLast]}
// //             activeOpacity={0.7}
// //             onPress={handleDeleteAccount}
// //             disabled={deleting}
// //           >
// //             <View style={[S.iconBox, { backgroundColor: "#FEF2F2" }]}>
// //               {deleting
// //                 ? <ActivityIndicator color={C.danger} size="small" />
// //                 : <Ionicons name="trash-outline" size={20} color={C.danger} />
// //               }
// //             </View>
// //             <Text style={[S.label, { color: C.danger }]}>
// //               {deleting ? "Deleting account…" : "Delete Account"}
// //             </Text>
// //           </TouchableOpacity>
// //         </Section>

// //         <Text style={S.footer}>Version 1.0.4 • Made with ❤️</Text>
// //       </ScrollView>
// //     </SafeAreaView>
// //   );
// // }

// // const Section = ({ title, children, titleColor = C.muted }: any) => (
// //   <View style={S.section}>
// //     <Text style={[S.sectionTitle, { color: titleColor }]}>{title}</Text>
// //     <View style={S.card}>{children}</View>
// //   </View>
// // );

// // const Row = ({ icon, label, hint, onPress, showChevron, iconColor = C.brand }: any) => (
// //   <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.6}>
// //     <View style={[S.iconBox, { backgroundColor: C.brandSoft }]}>
// //       <Ionicons name={icon} size={20} color={iconColor} />
// //     </View>
// //     <View style={S.rowBody}>
// //       <Text style={S.label}>{label}</Text>
// //       {!!hint && <Text style={S.hint}>{hint}</Text>}
// //     </View>
// //     {showChevron && <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />}
// //   </TouchableOpacity>
// // );

// // const S = StyleSheet.create({
// //   safe:    { flex: 1, backgroundColor: C.bg },
// //   container: { flex: 1 },
// //   content: { padding: 20, paddingBottom: 40 },
// //   header: {
// //     flexDirection: "row", alignItems: "center", justifyContent: "space-between",
// //     marginBottom: 24, marginTop: Platform.OS === "android" ? 10 : 0,
// //   },
// //   backBtn: {
// //     width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff",
// //     alignItems: "center", justifyContent: "center",
// //     borderWidth: 1, borderColor: C.border,
// //   },
// //   title: { fontSize: 20, fontWeight: "900", color: C.text, letterSpacing: -0.5 },
// //   section: { marginBottom: 24 },
// //   sectionTitle: {
// //     fontSize: 13, fontWeight: "800", textTransform: "uppercase",
// //     letterSpacing: 1, marginBottom: 10, marginLeft: 4,
// //   },
// //   card: {
// //     backgroundColor: C.card, borderRadius: 20, overflow: "hidden",
// //     borderWidth: 1, borderColor: C.border,
// //     shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
// //   },
// //   row: {
// //     flexDirection: "row", alignItems: "center",
// //     padding: 16, borderBottomWidth: 1, borderBottomColor: C.border,
// //   },
// //   rowLast: { borderBottomWidth: 0 },
// //   iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 14 },
// //   rowBody: { flex: 1 },
// //   label:   { fontSize: 16, fontWeight: "700", color: C.text },
// //   hint:    { fontSize: 12, fontWeight: "600", color: C.muted, marginTop: 2 },
// //   footer:  { textAlign: "center", color: C.muted, fontSize: 12, fontWeight: "600", marginTop: 10 },
// // });
// // app/profile/settings/AccountSettings.tsx
// import React,{useEffect,useState} from "react";
// import {View,Text,StyleSheet,TouchableOpacity,Switch,ScrollView,SafeAreaView,Platform,Alert,ActivityIndicator} from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import {useRouter} from "expo-router";
// import Constants from "expo-constants";
// import {useAuth} from "@clerk/clerk-expo";
// import {apiFetch} from "../../../lib/apiFetch";

// const C={
//   bg:"#FFFBF5",card:"#FFFFFF",cardBorder:"#F0EBE3",
//   inputBg:"#FAF7F2",inputBorder:"#E8E0D5",
//   ink:"#1C1A17",muted:"#8A8278",hint:"#BCB6AD",
//   teal:"#3ECFB2",tealBg:"#E8FAF7",tealText:"#1A7A6A",
//   coral:"#FF6F6F",coralBg:"#FFF0F0",coralText:"#C0392B",
//   purple:"#A78BFA",purpleBg:"#F3F0FF",purpleText:"#5B21B6",
//   amber:"#F59E0B",amberBg:"#FFFBEB",
//   danger:"#EF4444",dangerBg:"#FEF2F2",
// };

// export default function AccountSettings(){
//   const router=useRouter();const{userId,signOut}=useAuth();
//   const API_BASE=(Constants.expoConfig?.extra as any)?.apiBaseUrl as string|undefined;
//   const EVENT_API_KEY=(Constants.expoConfig?.extra as any)?.eventApiKey as string|undefined;
//   const[privateProfile,setPrivateProfile]=useState(false);
//   const[savingPrivacy,setSavingPrivacy]=useState(false);
//   const[deleting,setDeleting]=useState(false);
//   const headers={"Content-Type":"application/json",...(EVENT_API_KEY?{"x-api-key":EVENT_API_KEY}:{})};

//   useEffect(()=>{
//     if(!API_BASE||!userId)return;
//     (async()=>{try{const res=await apiFetch(`${API_BASE}/api/profile?clerkUserId=${encodeURIComponent(userId)}`,{headers:EVENT_API_KEY?{"x-api-key":EVENT_API_KEY}:undefined});const j=await res.json().catch(()=>({}));const src=j?.profile||j?.data||j;setPrivateProfile(!!src?.isPrivate);}catch{}})();
//   },[API_BASE,userId]);

//   const togglePrivate=async(val:boolean)=>{
//     setPrivateProfile(val);if(!API_BASE||!userId)return;setSavingPrivacy(true);
//     try{await apiFetch(`${API_BASE}/api/profile`,{method:"PATCH",headers,body:JSON.stringify({clerkUserId:userId,isPrivate:val})});}
//     catch{setPrivateProfile(!val);}finally{setSavingPrivacy(false);}
//   };

//   const handleDelete=()=>Alert.alert("Delete Account","This permanently deletes all your data. Cannot be undone.",[
//     {text:"Cancel",style:"cancel"},
//     {text:"Delete Forever",style:"destructive",onPress:async()=>{
//       if(!API_BASE||!userId){await signOut();return;}setDeleting(true);
//       try{await apiFetch(`${API_BASE}/api/users/delete-account`,{method:"DELETE",headers,body:JSON.stringify({clerkUserId:userId})});}catch{}
//       finally{setDeleting(false);await signOut();router.replace("/sign-in"as any);}
//     }},
//   ]);

//   const Row=({icon,label,hint,onPress,showChevron,iconBg=C.tealBg,iconColor=C.teal}:any)=>(
//     <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.7}>
//       <View style={[S.iconBox,{backgroundColor:iconBg}]}><Ionicons name={icon} size={20} color={iconColor}/></View>
//       <View style={S.rowBody}><Text style={S.label}>{label}</Text>{!!hint&&<Text style={S.hint}>{hint}</Text>}</View>
//       {showChevron&&<Ionicons name="chevron-forward" size={16} color={C.hint}/>}
//     </TouchableOpacity>
//   );

//   return(
//     <SafeAreaView style={S.safe}>
//       <ScrollView style={S.container} contentContainerStyle={S.content}>
//         <View style={S.header}>
//           <TouchableOpacity onPress={()=>router.back()} style={S.backBtn}><Ionicons name="chevron-back" size={24} color={C.ink}/></TouchableOpacity>
//           <Text style={S.title}>Account Settings</Text>
//           <View style={{width:40}}/>
//         </View>

//         <SectionCard title="Security & Access" dotColor={C.teal}>
//           <Row icon="key-outline" label="Change Password" onPress={()=>router.push("/profile/settings/ChangePassword"as any)} showChevron/>
//           <Row icon="person-outline" label="Manage Account Type" onPress={()=>{}} showChevron/>
//           <Row icon="shield-checkmark-outline" label="Two-Factor Auth" hint="Managed via Clerk" onPress={()=>{}} showChevron/>
//         </SectionCard>

//         <SectionCard title="Social Login" dotColor={C.purple}>
//           <Row icon="logo-google" label="Google" hint="Connected" iconBg="#FEF2F2" iconColor="#DB4437" onPress={()=>{}} showChevron/>
//           <Row icon="logo-apple" label="Apple" hint="Not connected" iconBg={C.inputBg} iconColor={C.ink} onPress={()=>{}} showChevron/>
//           <Row icon="logo-facebook" label="Facebook" hint="Not connected" iconBg="#EFF6FF" iconColor="#4267B2" onPress={()=>{}} showChevron/>
//         </SectionCard>

//         <SectionCard title="Privacy" dotColor={C.amber}>
//           <View style={S.row}>
//             <View style={[S.iconBox,{backgroundColor:C.tealBg}]}><Ionicons name="eye-off-outline" size={20} color={C.teal}/></View>
//             <View style={S.rowBody}><Text style={S.label}>Private Profile</Text><Text style={S.hint}>Only connections see your full profile</Text></View>
//             {savingPrivacy?<ActivityIndicator color={C.teal}/>:<Switch value={privateProfile} onValueChange={togglePrivate} trackColor={{false:C.inputBorder,true:C.teal}} thumbColor="#fff" ios_backgroundColor={C.inputBorder}/>}
//           </View>
//           <Row icon="document-text-outline" label="Data Usage & Privacy" onPress={()=>{}} showChevron/>
//         </SectionCard>

//         <SectionCard title="Danger Zone" dotColor={C.coral}>
//           <TouchableOpacity style={[S.row,{borderBottomWidth:0}]} activeOpacity={0.7} onPress={handleDelete} disabled={deleting}>
//             <View style={[S.iconBox,{backgroundColor:C.dangerBg}]}>
//               {deleting?<ActivityIndicator color={C.danger} size="small"/>:<Ionicons name="trash-outline" size={20} color={C.danger}/>}
//             </View>
//             <Text style={[S.label,{color:C.danger}]}>{deleting?"Deleting…":"Delete Account"}</Text>
//           </TouchableOpacity>
//         </SectionCard>

//         <Text style={S.footer}>Version 1.0.4 · Made with ❤️</Text>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const SectionCard=({title,children,dotColor=C.teal}:any)=>(
//   <View style={S.section}>
//     <View style={S.sectionHeader}>
//       <View style={[S.sectionDot,{backgroundColor:dotColor}]}/>
//       <Text style={S.sectionTitle}>{title}</Text>
//     </View>
//     <View style={S.card}>{children}</View>
//   </View>
// );

// const S=StyleSheet.create({
//   safe:{flex:1,backgroundColor:C.bg},container:{flex:1},content:{padding:20,paddingBottom:48},
//   header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:24,marginTop:Platform.OS==="android"?10:0},
//   backBtn:{width:42,height:42,borderRadius:13,backgroundColor:C.card,alignItems:"center",justifyContent:"center",borderWidth:1.5,borderColor:C.cardBorder},
//   title:{fontSize:18,fontWeight:"900",color:C.ink,letterSpacing:-0.3},
//   section:{marginBottom:22},
//   sectionHeader:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:10,paddingLeft:4},
//   sectionDot:{width:8,height:8,borderRadius:4},
//   sectionTitle:{fontSize:12,fontWeight:"800",color:C.muted,textTransform:"uppercase",letterSpacing:1},
//   card:{backgroundColor:C.card,borderRadius:20,overflow:"hidden",borderWidth:1.5,borderColor:C.cardBorder,shadowColor:"#000",shadowOpacity:0.04,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:2},
//   row:{flexDirection:"row",alignItems:"center",padding:16,borderBottomWidth:1,borderBottomColor:C.cardBorder},
//   iconBox:{width:40,height:40,borderRadius:12,alignItems:"center",justifyContent:"center",marginRight:14},
//   rowBody:{flex:1},
//   label:{fontSize:15,fontWeight:"700",color:C.ink},
//   hint:{fontSize:12,fontWeight:"500",color:C.muted,marginTop:2},
//   footer:{textAlign:"center",color:C.hint,fontSize:12,fontWeight:"600",marginTop:10},
// });
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, SafeAreaView, Platform, Alert, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "../../../lib/apiFetch";

const C = {
  bg: "#F7F8FA", card: "#FFFFFF", cardBorder: "#EAECF0",
  inputBg: "#F7F8FA", inputBorder: "#E2E5EA",
  ink: "#0D1117", muted: "#656D76", hint: "#AFB8C1",
  green: "#22C55E", greenDark: "#16A34A", greenBg: "#DCFCE7",
  greenBorder: "#86EFAC", greenText: "#15803D",
  teal: "#0EA5E9", tealBg: "#E0F2FE",
  amber: "#F59E0B", amberBg: "#FEF3C7",
  purple: "#8B5CF6", purpleBg: "#EDE9FE",
  coral: "#F43F5E", coralBg: "#FFF1F2",
  danger: "#EF4444", dangerBg: "#FEF2F2",
};

export default function AccountSettings() {
  const router = useRouter(); const { userId, signOut } = useAuth();
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  const [privateProfile, setPrivateProfile] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const headers = { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) };

  useEffect(() => {
    if (!API_BASE || !userId) return;
    (async () => {
      try {
        const res = await apiFetch(`${API_BASE}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, { headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined });
        const json = await res.json().catch(() => ({}));
        const src = json?.profile || json?.data || json;
        setPrivateProfile(!!src?.isPrivate);
      } catch {}
    })();
  }, [API_BASE, userId]);

  const togglePrivate = async (val: boolean) => {
    setPrivateProfile(val); if (!API_BASE || !userId) return; setSavingPrivacy(true);
    try { await apiFetch(`${API_BASE}/api/profile`, { method: "PATCH", headers, body: JSON.stringify({ clerkUserId: userId, isPrivate: val }) }); }
    catch { setPrivateProfile(!val); } finally { setSavingPrivacy(false); }
  };

  const handleDelete = () => Alert.alert("Delete Account", "This permanently deletes all your data. Cannot be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete Forever", style: "destructive", onPress: async () => {
      if (!API_BASE || !userId) { await signOut(); return; } setDeleting(true);
      try { await apiFetch(`${API_BASE}/api/users/delete-account`, { method: "DELETE", headers, body: JSON.stringify({ clerkUserId: userId }) }); } catch {}
      finally { setDeleting(false); await signOut(); router.replace("/sign-in" as any); }
    }},
  ]);

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView style={S.container} contentContainerStyle={S.content}>

        <View style={S.header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.ink} />
          </TouchableOpacity>
          <Text style={S.title}>Account Settings</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Security & Access */}
        <SectionCard title="Security & Access" icon="shield-outline" iconBg={C.greenBg} iconColor={C.green}>
          <Row icon="key-outline" iconBg={C.greenBg} iconColor={C.green} label="Change Password" onPress={() => router.push("/profile/settings/ChangePassword" as any)} showChevron />
          <Row icon="person-outline" iconBg={C.tealBg} iconColor={C.teal} label="Manage Account Type" onPress={() => {}} showChevron />
          <Row icon="shield-checkmark-outline" iconBg="#EDE9FE" iconColor={C.purple} label="Two-Factor Auth" hint="Managed via Clerk" onPress={() => {}} showChevron last />
        </SectionCard>

        {/* Social Login */}
        <SectionCard title="Social Login" icon="link-outline" iconBg={C.tealBg} iconColor={C.teal}>
          <Row icon="logo-google" iconBg="#FEF2F2" iconColor="#DB4437" label="Google" hint="Connected" onPress={() => {}} showChevron />
          <Row icon="logo-apple" iconBg={C.inputBg} iconColor={C.ink} label="Apple" hint="Not connected" onPress={() => {}} showChevron />
          <Row icon="logo-facebook" iconBg="#EFF6FF" iconColor="#4267B2" label="Facebook" hint="Not connected" onPress={() => {}} showChevron last />
        </SectionCard>

        {/* Privacy */}
        <SectionCard title="Privacy" icon="eye-outline" iconBg={C.amberBg} iconColor={C.amber}>
          <View style={[S.row, { paddingVertical: 14 }]}>
            <View style={[S.iconBox, { backgroundColor: C.greenBg }]}>
              <Ionicons name="eye-off-outline" size={18} color={C.green} />
            </View>
            <View style={S.rowBody}>
              <Text style={S.label}>Private Profile</Text>
              <Text style={S.hint}>Only connections see your full profile</Text>
            </View>
            {savingPrivacy
              ? <ActivityIndicator color={C.green} />
              : <Switch value={privateProfile} onValueChange={togglePrivate}
                  trackColor={{ false: C.inputBorder, true: C.green }}
                  thumbColor="#fff" ios_backgroundColor={C.inputBorder} />
            }
          </View>
          <Row icon="document-text-outline" iconBg={C.amberBg} iconColor={C.amber} label="Data Usage & Privacy" onPress={() => {}} showChevron last />
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard title="Danger Zone" icon="warning-outline" iconBg={C.dangerBg} iconColor={C.danger}>
          <TouchableOpacity
            style={[S.row, { borderBottomWidth: 0, paddingVertical: 14 }]}
            activeOpacity={0.7} onPress={handleDelete} disabled={deleting}
          >
            <View style={[S.iconBox, { backgroundColor: C.dangerBg }]}>
              {deleting ? <ActivityIndicator color={C.danger} size="small" /> : <Ionicons name="trash-outline" size={18} color={C.danger} />}
            </View>
            <Text style={[S.label, { color: C.danger }]}>{deleting ? "Deleting account…" : "Delete Account"}</Text>
          </TouchableOpacity>
        </SectionCard>

        <Text style={S.footer}>Version 1.0.4 · Made with care</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const SectionCard = ({ title, icon, iconBg, iconColor, children }: any) => (
  <View style={S.section}>
    <View style={S.sectionHeader}>
      <View style={[S.sectionIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={S.sectionTitle}>{title}</Text>
    </View>
    <View style={S.card}>{children}</View>
  </View>
);

const Row = ({ icon, iconBg, iconColor, label, hint, onPress, showChevron, last }: any) => (
  <TouchableOpacity style={[S.row, last && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7}>
    <View style={[S.iconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={S.rowBody}>
      <Text style={S.label}>{label}</Text>
      {!!hint && <Text style={S.hint}>{hint}</Text>}
    </View>
    {showChevron && <Ionicons name="chevron-forward" size={16} color={C.hint} />}
  </TouchableOpacity>
);

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, container: { flex: 1 }, content: { padding: 20, paddingBottom: 48 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 24, marginTop: Platform.OS === "android" ? 10 : 0,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: C.card,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cardBorder,
  },
  title: { fontSize: 18, fontWeight: "800", color: C.ink, letterSpacing: -0.3 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingLeft: 2 },
  sectionIconBox: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 1 },
  card: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
  },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 14 },
  rowBody: { flex: 1 },
  label: { fontSize: 14, fontWeight: "700", color: C.ink },
  hint: { fontSize: 12, fontWeight: "500", color: C.muted, marginTop: 2 },
  footer: { textAlign: "center", color: C.hint, fontSize: 12, fontWeight: "600", marginTop: 8 },
});
