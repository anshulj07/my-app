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
import { 
    View, Text, StyleSheet, TouchableOpacity, Switch, 
    ScrollView, SafeAreaView, Platform, Alert, ActivityIndicator, 
    Dimensions 
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "../../../lib/apiFetch";
import * as Haptics from "expo-haptics";

const { width: W } = Dimensions.get("window");

const COLORS = {
    purple: "#6366F1",
    purpleBg: "#EEF2FF",
    bg: "#F9FAFB",
    card: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
    lightMuted: "#9CA3AF",
    border: "#F3F4F6",
    danger: "#EF4444",
    dangerBg: "#FEF2F2",
    font: "Outfit_500Medium",
    fontBold: "Outfit_700Bold",
    fontExtraBold: "Outfit_800ExtraBold",
};

export default function AccountSettings() {
    const router = useRouter();
    const { userId, signOut } = useAuth();
    
    const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
    const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
    
    const [privateProfile, setPrivateProfile] = useState(false);
    const [savingPrivacy, setSavingPrivacy] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);

    const headers = { 
        "Content-Type": "application/json", 
        ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) 
    };

    useEffect(() => {
        if (!API_BASE || !userId) { setLoading(false); return; }
        (async () => {
            try {
                const res = await apiFetch(`${API_BASE}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, { 
                    headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : undefined 
                });
                const json = await res.json().catch(() => ({}));
                const src = json?.profile || json?.data || json;
                setPrivateProfile(!!src?.isPrivate);
            } catch {}
            setLoading(false);
        })();
    }, [API_BASE, userId]);

    const togglePrivate = async (val: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPrivateProfile(val);
        if (!API_BASE || !userId) return;
        setSavingPrivacy(true);
        try {
            await apiFetch(`${API_BASE}/api/profile`, { 
                method: "PATCH", 
                headers, 
                body: JSON.stringify({ clerkUserId: userId, isPrivate: val }) 
            });
        } catch {
            setPrivateProfile(!val);
        } finally {
            setSavingPrivacy(false);
        }
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Delete Account", 
            "This will permanently delete all your data. This action cannot be undone.", 
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete Forever", 
                    style: "destructive", 
                    onPress: async () => {
                        if (!API_BASE || !userId) { await signOut(); return; }
                        setDeleting(true);
                        try {
                            await apiFetch(`${API_BASE}/api/users/delete-account`, { 
                                method: "DELETE", 
                                headers, 
                                body: JSON.stringify({ clerkUserId: userId }) 
                            });
                        } catch {}
                        finally {
                            setDeleting(false);
                            await signOut();
                            router.replace("/sign-in" as any);
                        }
                    }
                },
            ]
        );
    };

    const NavItem = ({ icon, label, hint, onPress, showChevron, last, color = COLORS.purple }: any) => (
        <TouchableOpacity 
            style={[S.row, last && { borderBottomWidth: 0 }]} 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }} 
            activeOpacity={0.7}
        >
            <View style={[S.iconBox, { backgroundColor: color + "10" }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={S.rowBody}>
                <Text style={S.label}>{label}</Text>
                {!!hint && <Text style={S.hint}>{hint}</Text>}
            </View>
            {showChevron && <Ionicons name="chevron-forward" size={18} color={COLORS.lightMuted} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={S.safe}>
            <View style={S.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.purple} />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Account Settings</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView 
                style={S.container} 
                contentContainerStyle={S.content} 
                showsVerticalScrollIndicator={false}
            >
                <View style={S.intro}>
                    <Text style={S.introH}>Manage Account</Text>
                    <Text style={S.introS}>Update your security preferences and account privacy settings.</Text>
                </View>

                {loading ? (
                    <View style={S.center}><ActivityIndicator color={COLORS.purple} size="large" /></View>
                ) : (
                    <>
                        <View style={S.section}>
                            <Text style={S.sectionTitle}>Security & Access</Text>
                            <View style={S.card}>
                                <NavItem 
                                    icon="key-outline" label="Change Password" 
                                    onPress={() => router.push("/profile/settings/ChangePassword")} 
                                    showChevron 
                                />
                                <NavItem 
                                    icon="shield-checkmark-outline" label="Two-Factor Auth" 
                                    hint="Managed Securely" onPress={() => {}} 
                                    showChevron last 
                                />
                            </View>
                        </View>

                        <View style={S.section}>
                            <Text style={S.sectionTitle}>Privacy & Visibility</Text>
                            <View style={S.card}>
                                <View style={S.row}>
                                    <View style={[S.iconBox, { backgroundColor: COLORS.purple + "10" }]}>
                                        <Ionicons name="eye-off-outline" size={20} color={COLORS.purple} />
                                    </View>
                                    <View style={S.rowBody}>
                                        <Text style={S.label}>Private Profile</Text>
                                        <Text style={S.hint}>Only connections can see your full profile</Text>
                                    </View>
                                    {savingPrivacy ? (
                                        <ActivityIndicator color={COLORS.purple} />
                                    ) : (
                                        <Switch 
                                            value={privateProfile} 
                                            onValueChange={togglePrivate}
                                            trackColor={{ false: COLORS.border, true: COLORS.purple }}
                                            thumbColor="#fff"
                                            ios_backgroundColor={COLORS.border}
                                        />
                                    )}
                                </View>
                                <NavItem 
                                    icon="document-text-outline" label="Data Usage & Privacy" 
                                    onPress={() => {}} 
                                    showChevron last 
                                />
                            </View>
                        </View>

                        <View style={S.section}>
                            <Text style={[S.sectionTitle, { color: COLORS.danger }]}>Danger Zone</Text>
                            <View style={[S.card, { borderColor: COLORS.danger + "30" }]}>
                                <TouchableOpacity 
                                    style={[S.row, { borderBottomWidth: 0 }]} 
                                    onPress={handleDelete} 
                                    disabled={deleting}
                                    activeOpacity={0.7}
                                >
                                    <View style={[S.iconBox, { backgroundColor: COLORS.danger + "10" }]}>
                                        {deleting ? (
                                            <ActivityIndicator color={COLORS.danger} size="small" />
                                        ) : (
                                            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                                        )}
                                    </View>
                                    <Text style={[S.label, { color: COLORS.danger }]}>
                                        {deleting ? "Deleting account..." : "Delete Account"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                <Text style={S.footer}>Version 1.0.8 • Made with ❤️</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const S = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1 },
    headerRow: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 10 : 20, paddingBottom: 10,
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 14,
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border,
    },
    headerTitle: { fontSize: 18, fontFamily: COLORS.fontExtraBold, color: COLORS.purple },
    content: { padding: 20, paddingBottom: 60 },
    intro: { marginBottom: 24, paddingLeft: 2 },
    introH: { fontSize: 32, fontFamily: COLORS.fontExtraBold, color: COLORS.text, letterSpacing: -0.5 },
    introS: { fontSize: 14, fontFamily: COLORS.font, color: COLORS.muted, marginTop: 4, lineHeight: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { 
        fontSize: 12, fontFamily: COLORS.fontExtraBold, color: COLORS.muted, 
        textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginLeft: 4 
    },
    card: {
        backgroundColor: COLORS.card, borderRadius: 24, overflow: "hidden",
        borderWidth: 1, borderColor: COLORS.border,
        shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    },
    row: {
        flexDirection: "row", alignItems: "center",
        padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 16 },
    rowBody: { flex: 1 },
    label: { fontSize: 16, fontFamily: COLORS.fontBold, color: COLORS.text },
    hint: { fontSize: 12, fontFamily: COLORS.font, color: COLORS.muted, marginTop: 2 },
    footer: { textAlign: "center", color: COLORS.lightMuted, fontSize: 12, fontFamily: COLORS.fontBold, marginTop: 20 },
    center: { paddingVertical: 60, alignItems: "center" },
});
