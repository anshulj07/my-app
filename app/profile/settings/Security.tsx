// // // app/profile/settings/Security.tsx
// // // ✅ FIXED:
// // //   1. Delete Account → actual API call + sign out
// // //   2. "Log Out All Devices" → Clerk signOut
// // //   3. 2FA shows info (Clerk handles it)

// // import React, { useState } from "react";
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
// //   border: "#F1F5F9", danger: "#EF4444",
// // };

// // export default function Security() {
// //   const router  = useRouter();
// //   const { userId, signOut } = useAuth();

// //   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
// //   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

// //   const [deleting,  setDeleting]  = useState(false);
// //   const [loggingOut, setLoggingOut] = useState(false);

// //   const handleDeleteAccount = () => {
// //     Alert.alert(
// //       "Delete Account",
// //       "This permanently deletes your account and all data. This action cannot be undone.",
// //       [
// //         { text: "Cancel", style: "cancel" },
// //         {
// //           text: "Delete Forever",
// //           style: "destructive",
// //           onPress: async () => {
// //             setDeleting(true);
// //             try {
// //               if (API_BASE && userId) {
// //                 await apiFetch(`${API_BASE}/api/users/delete-account`, {
// //                   method: "DELETE",
// //                   headers: {
// //                     "Content-Type": "application/json",
// //                     ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
// //                   },
// //                   body: JSON.stringify({ clerkUserId: userId }),
// //                 });
// //               }
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

// //   const handleLogoutAll = () => {
// //     Alert.alert(
// //       "Log Out All Devices",
// //       "This will sign you out on all devices including this one.",
// //       [
// //         { text: "Cancel", style: "cancel" },
// //         {
// //           text: "Log Out All",
// //           style: "destructive",
// //           onPress: async () => {
// //             setLoggingOut(true);
// //             try {
// //               await signOut();
// //               router.replace("/sign-in" as any);
// //             } catch {}
// //             finally { setLoggingOut(false); }
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
// //           <Text style={S.title}>Security</Text>
// //           <View style={{ width: 44 }} />
// //         </View>

// //         <View style={S.intro}>
// //           <Text style={S.introHeading}>Account Safety</Text>
// //           <Text style={S.introSub}>Manage your security preferences.</Text>
// //         </View>

// //         <View style={S.formArea}>

// //           {/* 2FA info */}
// //           <View style={S.block}>
// //             <View style={S.blockHeader}>
// //               <View style={S.iconCircle}><Ionicons name="shield-checkmark-outline" size={14} color={C.brand} /></View>
// //               <Text style={S.blockLabel}>Two-Factor Auth</Text>
// //             </View>
// //             <View style={S.rowLayout}>
// //               <View style={{ flex: 1 }}>
// //                 <Text style={S.blockValue}>Managed via Clerk</Text>
// //                 <Text style={S.blockHint}>Configure in your Clerk account settings</Text>
// //               </View>
// //               <Ionicons name="open-outline" size={18} color="#CBD5E1" />
// //             </View>
// //           </View>

// //           {/* Change password */}
// //           <TouchableOpacity style={S.block} activeOpacity={0.8} onPress={() => {
// //             Alert.alert("Change Password", "Password management is handled through Clerk. Check your email for reset instructions.", [{ text: "OK" }]);
// //           }}>
// //             <View style={S.blockHeader}>
// //               <View style={S.iconCircle}><Ionicons name="key-outline" size={14} color={C.brand} /></View>
// //               <Text style={S.blockLabel}>Change Password</Text>
// //             </View>
// //             <View style={S.rowLayout}>
// //               <Text style={[S.blockValue, { flex: 1 }]}>Update your password</Text>
// //               <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
// //             </View>
// //           </TouchableOpacity>

// //           {/* Login Activity */}
// //           <TouchableOpacity style={S.block} activeOpacity={0.8} onPress={() => {
// //             Alert.alert("Login Activity", "You can view active sessions in your Clerk account dashboard.", [{ text: "OK" }]);
// //           }}>
// //             <View style={S.blockHeader}>
// //               <View style={S.iconCircle}><Ionicons name="lock-closed-outline" size={14} color={C.brand} /></View>
// //               <Text style={S.blockLabel}>Login Activity</Text>
// //             </View>
// //             <View style={S.rowLayout}>
// //               <Text style={[S.blockValue, { flex: 1 }]}>Check active sessions</Text>
// //               <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
// //             </View>
// //           </TouchableOpacity>

// //           {/* Log Out All Devices — ✅ wired */}
// //           <TouchableOpacity
// //             style={S.block}
// //             activeOpacity={0.8}
// //             onPress={handleLogoutAll}
// //             disabled={loggingOut}
// //           >
// //             <View style={S.blockHeader}>
// //               <View style={S.iconCircle}><Ionicons name="exit-outline" size={14} color={C.brand} /></View>
// //               <Text style={S.blockLabel}>Log Out All Devices</Text>
// //             </View>
// //             <View style={S.rowLayout}>
// //               {loggingOut
// //                 ? <ActivityIndicator color={C.brand} style={{ flex: 1 }} />
// //                 : <>
// //                     <Text style={[S.blockValue, { flex: 1 }]}>Force sign out everywhere</Text>
// //                     <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
// //                   </>
// //               }
// //             </View>
// //           </TouchableOpacity>

// //           {/* Delete Account — ✅ wired */}
// //           <TouchableOpacity
// //             style={[S.block, { borderColor: "#FEE2E2", marginTop: 8 }]}
// //             onPress={handleDeleteAccount}
// //             disabled={deleting}
// //             activeOpacity={0.8}
// //           >
// //             <View style={S.blockHeader}>
// //               <View style={[S.iconCircle, { backgroundColor: "#FEF2F2" }]}>
// //                 <Ionicons name="trash-outline" size={14} color={C.danger} />
// //               </View>
// //               <Text style={[S.blockLabel, { color: C.danger }]}>Danger Zone</Text>
// //             </View>
// //             {deleting
// //               ? <ActivityIndicator color={C.danger} />
// //               : <Text style={[S.blockValue, { color: C.danger }]}>Delete Account Permanently</Text>
// //             }
// //           </TouchableOpacity>
// //         </View>

// //         <Text style={S.footer}>🔒 End-to-End Encrypted</Text>
// //       </ScrollView>
// //     </SafeAreaView>
// //   );
// // }

// // const S = StyleSheet.create({
// //   safe: { flex: 1, backgroundColor: C.bg },
// //   container: { flex: 1 },
// //   content: { padding: 20, paddingBottom: 60 },
// //   header: {
// //     flexDirection: "row", alignItems: "center", justifyContent: "space-between",
// //     marginBottom: 28, marginTop: Platform.OS === "android" ? 10 : 0,
// //   },
// //   backBtn: {
// //     width: 44, height: 44, borderRadius: 14, backgroundColor: "#fff",
// //     alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border,
// //   },
// //   title: { fontSize: 18, fontWeight: "800", color: C.text },
// //   intro: { marginBottom: 32, paddingLeft: 4 },
// //   introHeading: { fontSize: 28, fontWeight: "900", color: C.text, letterSpacing: -0.5 },
// //   introSub:     { fontSize: 15, fontWeight: "600", color: C.muted, marginTop: 4 },
// //   formArea: { gap: 14 },
// //   block: {
// //     backgroundColor: C.card, borderRadius: 20, padding: 18,
// //     borderWidth: 1, borderColor: C.border,
// //     shadowColor: C.brand, shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
// //   },
// //   blockHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
// //   iconCircle: {
// //     width: 28, height: 28, borderRadius: 9, backgroundColor: C.brandSoft,
// //     alignItems: "center", justifyContent: "center", marginRight: 10,
// //   },
// //   blockLabel: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 1 },
// //   blockValue: { fontSize: 16, fontWeight: "700", color: C.text },
// //   blockHint:  { fontSize: 12, fontWeight: "600", color: C.muted, marginTop: 2 },
// //   rowLayout:  { flexDirection: "row", alignItems: "center" },
// //   footer: { textAlign: "center", color: C.muted, fontSize: 12, fontWeight: "600", marginTop: 30, opacity: 0.7 },
// // });
// // app/profile/settings/Security.tsx
// import React,{useState} from "react";
// import {View,Text,StyleSheet,TouchableOpacity,ScrollView,SafeAreaView,Platform,Alert,ActivityIndicator} from "react-native";
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
//   coral:"#FF6F6F",coralBg:"#FFF0F0",
//   danger:"#EF4444",dangerBg:"#FEF2F2",
// };

// export default function Security(){
//   const router=useRouter();const{userId,signOut}=useAuth();
//   const API_BASE=(Constants.expoConfig?.extra as any)?.apiBaseUrl as string|undefined;
//   const EVENT_API_KEY=(Constants.expoConfig?.extra as any)?.eventApiKey as string|undefined;
//   const[deleting,setDeleting]=useState(false);const[loggingOut,setLoggingOut]=useState(false);

//   const handleDelete=()=>Alert.alert("Delete Account","Permanently deletes your account and all data.",[
//     {text:"Cancel",style:"cancel"},
//     {text:"Delete Forever",style:"destructive",onPress:async()=>{
//       setDeleting(true);
//       try{if(API_BASE&&userId)await apiFetch(`${API_BASE}/api/users/delete-account`,{method:"DELETE",headers:{"Content-Type":"application/json",...(EVENT_API_KEY?{"x-api-key":EVENT_API_KEY}:{})},body:JSON.stringify({clerkUserId:userId})});}
//       catch{}finally{setDeleting(false);await signOut();router.replace("/sign-in"as any);}
//     }},
//   ]);

//   const handleLogoutAll=()=>Alert.alert("Log Out All Devices","Signs you out on all devices including this one.",[
//     {text:"Cancel",style:"cancel"},
//     {text:"Log Out All",style:"destructive",onPress:async()=>{setLoggingOut(true);try{await signOut();router.replace("/sign-in"as any);}catch{}finally{setLoggingOut(false);}}},
//   ]);

//   const Block=({icon,iconBg,iconColor=C.teal,label,children,onPress,danger=false}:any)=>(
//     <TouchableOpacity style={[S.block,danger&&{borderColor:C.coral+"55"}]} activeOpacity={onPress?0.8:1} onPress={onPress}>
//       <View style={S.blockHeader}>
//         <View style={[S.iconCircle,{backgroundColor:iconBg||C.tealBg}]}><Ionicons name={icon} size={14} color={iconColor}/></View>
//         <Text style={[S.blockLabel,danger&&{color:C.coral}]}>{label}</Text>
//       </View>
//       {children}
//     </TouchableOpacity>
//   );

//   return(
//     <SafeAreaView style={S.safe}>
//       <ScrollView style={S.container} contentContainerStyle={S.content}>
//         <View style={S.header}>
//           <TouchableOpacity onPress={()=>router.back()} style={S.backBtn}><Ionicons name="chevron-back" size={24} color={C.ink}/></TouchableOpacity>
//           <Text style={S.title}>Security</Text>
//           <View style={{width:44}}/>
//         </View>
//         <View style={S.intro}>
//           <Text style={S.introH}>Account Safety</Text>
//           <Text style={S.introS}>Manage your security preferences.</Text>
//         </View>
//         <View style={S.formArea}>
//           <Block icon="shield-checkmark-outline" label="Two-Factor Auth">
//             <View style={S.rowLayout}>
//               <View style={{flex:1}}><Text style={S.blockValue}>Managed via Clerk</Text><Text style={S.blockHint}>Configure in your Clerk account settings</Text></View>
//               <Ionicons name="open-outline" size={18} color={C.hint}/>
//             </View>
//           </Block>
//           <Block icon="key-outline" label="Change Password" onPress={()=>Alert.alert("Change Password","Password management is handled through Clerk. Check your email for reset instructions.",[{text:"OK"}])}>
//             <View style={S.rowLayout}><Text style={[S.blockValue,{flex:1}]}>Update your password</Text><Ionicons name="chevron-forward" size={18} color={C.hint}/></View>
//           </Block>
//           <Block icon="lock-closed-outline" label="Login Activity" onPress={()=>Alert.alert("Login Activity","View active sessions in your Clerk account dashboard.",[{text:"OK"}])}>
//             <View style={S.rowLayout}><Text style={[S.blockValue,{flex:1}]}>Check active sessions</Text><Ionicons name="chevron-forward" size={18} color={C.hint}/></View>
//           </Block>
//           <Block icon="exit-outline" label="Log Out All Devices" onPress={handleLogoutAll}>
//             <View style={S.rowLayout}>
//               {loggingOut?<ActivityIndicator color={C.teal} style={{flex:1}}/>:<><Text style={[S.blockValue,{flex:1}]}>Force sign out everywhere</Text><Ionicons name="chevron-forward" size={18} color={C.hint}/></>}
//             </View>
//           </Block>
//           <Block icon="trash-outline" iconBg={C.dangerBg} iconColor={C.danger} label="Danger Zone" onPress={handleDelete} danger>
//             {deleting?<ActivityIndicator color={C.danger}/>:<Text style={[S.blockValue,{color:C.danger}]}>Delete Account Permanently</Text>}
//           </Block>
//         </View>
//         <Text style={S.footer}>🔒 End-to-End Encrypted</Text>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const S=StyleSheet.create({
//   safe:{flex:1,backgroundColor:C.bg},container:{flex:1},content:{padding:20,paddingBottom:60},
//   header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:24,marginTop:Platform.OS==="android"?10:0},
//   backBtn:{width:42,height:42,borderRadius:13,backgroundColor:C.card,alignItems:"center",justifyContent:"center",borderWidth:1.5,borderColor:C.cardBorder},
//   title:{fontSize:17,fontWeight:"800",color:C.ink},
//   intro:{marginBottom:28,paddingLeft:4},
//   introH:{fontSize:26,fontWeight:"900",color:C.ink,letterSpacing:-0.5},
//   introS:{fontSize:14,fontWeight:"500",color:C.muted,marginTop:4},
//   formArea:{gap:12},
//   block:{backgroundColor:C.card,borderRadius:18,padding:18,borderWidth:1.5,borderColor:C.cardBorder,shadowColor:C.teal,shadowOpacity:0.05,shadowRadius:8,shadowOffset:{width:0,height:4}},
//   blockHeader:{flexDirection:"row",alignItems:"center",marginBottom:10},
//   iconCircle:{width:28,height:28,borderRadius:9,alignItems:"center",justifyContent:"center",marginRight:10},
//   blockLabel:{fontSize:11,fontWeight:"800",color:C.muted,textTransform:"uppercase",letterSpacing:1},
//   blockValue:{fontSize:15,fontWeight:"700",color:C.ink},
//   blockHint:{fontSize:12,fontWeight:"500",color:C.muted,marginTop:2},
//   rowLayout:{flexDirection:"row",alignItems:"center"},
//   footer:{textAlign:"center",color:C.hint,fontSize:12,fontWeight:"600",marginTop:30},
// });
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "../../../lib/apiFetch";

const C = {
  bg: "#F7F8FA", card: "#FFFFFF", cardBorder: "#EAECF0",
  ink: "#0D1117", muted: "#656D76", hint: "#AFB8C1",
  green: "#22C55E", greenBg: "#DCFCE7", greenBorder: "#86EFAC", greenText: "#15803D",
  teal: "#0EA5E9", tealBg: "#E0F2FE",
  amber: "#F59E0B", amberBg: "#FEF3C7",
  danger: "#EF4444", dangerBg: "#FEF2F2",
};

export default function Security() {
  const router = useRouter(); const { userId, signOut } = useAuth();
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  const [deleting, setDeleting] = useState(false); const [loggingOut, setLoggingOut] = useState(false);

  const handleDelete = () => Alert.alert("Delete Account", "Permanently deletes your account and all data.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete Forever", style: "destructive", onPress: async () => {
      setDeleting(true);
      try { if (API_BASE && userId) await apiFetch(`${API_BASE}/api/users/delete-account`, { method: "DELETE", headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) }, body: JSON.stringify({ clerkUserId: userId }) }); } catch {}
      finally { setDeleting(false); await signOut(); router.replace("/sign-in" as any); }
    }},
  ]);

  const handleLogoutAll = () => Alert.alert("Log Out All Devices", "Signs you out on all devices including this one.", [
    { text: "Cancel", style: "cancel" },
    { text: "Log Out All", style: "destructive", onPress: async () => { setLoggingOut(true); try { await signOut(); router.replace("/sign-in" as any); } catch {} finally { setLoggingOut(false); } } },
  ]);

  const BLOCKS = [
    {
      icon: "shield-checkmark-outline" as const, iconBg: C.greenBg, iconColor: C.green,
      label: "Two-Factor Auth", isDanger: false, onPress: undefined,
      content: () => (
        <View style={S.rowLayout}>
          <View style={{ flex: 1 }}>
            <Text style={S.blockValue}>Managed via Clerk</Text>
            <Text style={S.blockHint}>Configure in your Clerk account settings</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={C.hint} />
        </View>
      ),
    },
    {
      icon: "key-outline" as const, iconBg: C.tealBg, iconColor: C.teal,
      label: "Change Password", isDanger: false,
      onPress: () => Alert.alert("Change Password", "Password management is handled through Clerk.", [{ text: "OK" }]),
      content: () => (
        <View style={S.rowLayout}>
          <Text style={[S.blockValue, { flex: 1 }]}>Update your password</Text>
          <Ionicons name="chevron-forward" size={16} color={C.hint} />
        </View>
      ),
    },
    {
      icon: "lock-closed-outline" as const, iconBg: C.amberBg, iconColor: C.amber,
      label: "Login Activity", isDanger: false,
      onPress: () => Alert.alert("Login Activity", "View active sessions in your Clerk account dashboard.", [{ text: "OK" }]),
      content: () => (
        <View style={S.rowLayout}>
          <Text style={[S.blockValue, { flex: 1 }]}>Check active sessions</Text>
          <Ionicons name="chevron-forward" size={16} color={C.hint} />
        </View>
      ),
    },
    {
      icon: "exit-outline" as const, iconBg: C.greenBg, iconColor: C.green,
      label: "Log Out All Devices", isDanger: false, onPress: handleLogoutAll,
      content: () => (
        <View style={S.rowLayout}>
          {loggingOut
            ? <ActivityIndicator color={C.green} style={{ flex: 1 }} />
            : <><Text style={[S.blockValue, { flex: 1 }]}>Force sign out everywhere</Text><Ionicons name="chevron-forward" size={16} color={C.hint} /></>
          }
        </View>
      ),
    },
    {
      icon: "trash-outline" as const, iconBg: C.dangerBg, iconColor: C.danger,
      label: "Danger Zone", isDanger: true, onPress: handleDelete,
      content: () => (deleting
        ? <ActivityIndicator color={C.danger} />
        : <Text style={[S.blockValue, { color: C.danger }]}>Delete Account Permanently</Text>
      ),
    },
  ];

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView style={S.container} contentContainerStyle={S.content}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.ink} />
          </TouchableOpacity>
          <Text style={S.title}>Security</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={S.intro}>
          <Text style={S.introH}>Account Safety</Text>
          <Text style={S.introS}>Manage your security preferences.</Text>
        </View>

        <View style={S.formArea}>
          {BLOCKS.map(b => (
            <TouchableOpacity
              key={b.label}
              style={[S.block, b.isDanger && { borderColor: C.danger + "44" }]}
              activeOpacity={b.onPress ? 0.8 : 1}
              onPress={b.onPress}
              disabled={!b.onPress}
            >
              <View style={S.blockHeader}>
                <View style={[S.iconCircle, { backgroundColor: b.iconBg }]}>
                  <Ionicons name={b.icon} size={14} color={b.iconColor} />
                </View>
                <Text style={[S.blockLabel, b.isDanger && { color: C.danger }]}>{b.label}</Text>
              </View>
              {b.content()}
            </TouchableOpacity>
          ))}
        </View>

        <View style={S.footerRow}>
          <Ionicons name="lock-closed-outline" size={13} color={C.hint} />
          <Text style={S.footer}>End-to-End Encrypted</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, container: { flex: 1 }, content: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, marginTop: Platform.OS === "android" ? 10 : 0 },
  backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cardBorder },
  title: { fontSize: 17, fontWeight: "800", color: C.ink },
  intro: { marginBottom: 24, paddingLeft: 2 },
  introH: { fontSize: 26, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  introS: { fontSize: 14, fontWeight: "500", color: C.muted, marginTop: 4 },
  formArea: { gap: 10 },
  block: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  iconCircle: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  blockLabel: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 1 },
  blockValue: { fontSize: 14, fontWeight: "700", color: C.ink },
  blockHint: { fontSize: 12, fontWeight: "500", color: C.muted, marginTop: 2 },
  rowLayout: { flexDirection: "row", alignItems: "center" },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 28 },
  footer: { textAlign: "center", color: C.hint, fontSize: 12, fontWeight: "600" },
});
