// // // app/profile/settings/PersonalInfo.tsx
// // // ✏️ FIXED — Now saves to DB via PATCH /api/profile (was only AsyncStorage before)

// // import React, { useEffect, useState } from "react";
// // import {
// //   View, Text, TextInput, StyleSheet, TouchableOpacity,
// //   Alert, ScrollView, SafeAreaView, Platform, KeyboardAvoidingView,
// //   ActivityIndicator,
// // } from "react-native";
// // import AsyncStorage from "@react-native-async-storage/async-storage";
// // import Ionicons from "@expo/vector-icons/Ionicons";
// // import { useRouter } from "expo-router";
// // import Constants from "expo-constants";
// // import { useAuth } from "@clerk/clerk-expo";
// // import { apiFetch } from "../../../lib/apiFetch";

// // const COLORS = {
// //   bg: "#FFF7FA", card: "#FFFFFF", text: "#111827",
// //   muted: "#6B7280", brand: "#FF4D6D", brandSoft: "#FFF1F5",
// //   border: "#F1F5F9", danger: "#EF4444",
// // };

// // const STORAGE_KEY = "user_profile";

// // export default function PersonalInfo() {
// //   const router = useRouter();
// //   const { userId } = useAuth();

// //   const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
// //   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

// //   const [form, setForm] = useState({
// //     name: "", email: "", phone: "", gender: "", city: "", country: "",
// //   });
// //   const [saving,  setSaving]  = useState(false);
// //   const [loading, setLoading] = useState(true);

// //   // Load from DB first, fallback to AsyncStorage
// //   useEffect(() => {
// //     (async () => {
// //       // Try AsyncStorage first for instant display
// //       const stored = await AsyncStorage.getItem(STORAGE_KEY);
// //       if (stored) {
// //         try { setForm(f => ({ ...f, ...JSON.parse(stored) })); } catch {}
// //       }

// //       // Then fetch from DB
// //       if (!API_BASE || !userId) { setLoading(false); return; }
// //       try {
// //         const res  = await apiFetch(
// //           `${API_BASE.replace(/\/$/, "")}/api/profile?clerkUserId=${encodeURIComponent(userId)}`,
// //           { method: "GET", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {} }
// //         );
// //         if (res.ok) {
// //           const src  = await res.json().catch(() => ({}));
// //           setForm({
// //             name:    src?.name     || "",
// //             email:   src?.email    || "",
// //             phone:   src?.phone    || "",
// //             gender:  src?.gender   || "",
// //             city:    src?.city     || "",
// //             country: src?.country  || "",
// //           });
// //         }
// //       } catch {}
// //       setLoading(false);
// //     })();
// //   }, [API_BASE, userId, EVENT_API_KEY]);

// //   const saveProfile = async () => {
// //     if (!API_BASE || !userId) {
// //       // Fallback: only AsyncStorage
// //       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
// //       Alert.alert("Saved ✨", "Profile updated locally.");
// //       return;
// //     }

// //     setSaving(true);
// //     try {
// //       // Split name into firstName + lastName
// //       const parts     = form.name.trim().split(/\s+/);
// //       const firstName = parts[0] || "";
// //       const lastName  = parts.slice(1).join(" ") || "";

// //       const res = await apiFetch(
// //         `${API_BASE.replace(/\/$/, "")}/api/profile`,
// //         {
// //           method: "PATCH",
// //           headers: {
// //             "Content-Type": "application/json",
// //             ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
// //           },
// //           body: JSON.stringify({
// //             clerkUserId: userId,
// //             firstName,
// //             lastName,
// //             phone:   form.phone.trim()   || undefined,
// //             gender:  form.gender.trim()  || undefined,
// //             city:    form.city.trim()    || undefined,
// //             country: form.country.trim() || undefined,
// //           }),
// //         }
// //       );

// //       if (!res.ok) {
// //         const t = await res.text().catch(() => "");
// //         throw new Error(t || `Failed (${res.status})`);
// //       }

// //       // Also save to AsyncStorage as cache
// //       await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
// //       Alert.alert("Saved ✨", "Your profile has been updated.");
// //     } catch (e: any) {
// //       Alert.alert("Error", e?.message || "Failed to save. Please try again.");
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   const handleChange = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

// //   return (
// //     <SafeAreaView style={styles.safe}>
// //       <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
// //         <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
// //           {/* Header */}
// //           <View style={styles.header}>
// //             <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
// //               <Ionicons name="chevron-back" size={24} color={COLORS.text} />
// //             </TouchableOpacity>
// //             <Text style={styles.title}>Edit Profile</Text>
// //             <View style={{ width: 44 }} />
// //           </View>

// //           <View style={styles.intro}>
// //             <Text style={styles.introHeading}>Personal Details</Text>
// //             <Text style={styles.introSub}>Customize how others see you on the platform.</Text>
// //           </View>

// //           {loading ? (
// //             <View style={{ alignItems: "center", paddingTop: 40 }}>
// //               <ActivityIndicator color={COLORS.brand} />
// //             </View>
// //           ) : (
// //             <View style={styles.formArea}>
// //               <FloatingField icon="person-outline"   label="Full Name"      value={form.name}    placeholder="e.g. Anshul Sharma"   onChange={(v: string) => handleChange("name", v)} />
// //               <FloatingField icon="mail-outline"     label="Email Address"  value={form.email}   placeholder="anshul@example.com"   onChange={(v: string) => handleChange("email", v)} keyboardType="email-address" autoCapitalize="none" />
// //               <FloatingField icon="call-outline"     label="Phone Number"   value={form.phone}   placeholder="+91 98765 43210"      onChange={(v: string) => handleChange("phone", v)} keyboardType="phone-pad" />
// //               <FloatingField icon="people-outline"   label="Gender"         value={form.gender}  placeholder="Male / Female / Other" onChange={(v: string) => handleChange("gender", v)} />
// //               <View style={styles.rowLayout}>
// //                 <View style={{ flex: 1, marginRight: 8 }}>
// //                   <FloatingField icon="location-outline" label="City"    value={form.city}    placeholder="Indore" onChange={(v: string) => handleChange("city", v)} />
// //                 </View>
// //                 <View style={{ flex: 1, marginLeft: 8 }}>
// //                   <FloatingField icon="globe-outline"    label="Country" value={form.country} placeholder="India"  onChange={(v: string) => handleChange("country", v)} />
// //                 </View>
// //               </View>
// //             </View>
// //           )}

// //           <TouchableOpacity
// //             style={[styles.saveBtn, (saving || loading) && { opacity: 0.7 }]}
// //             onPress={saveProfile}
// //             disabled={saving || loading}
// //             activeOpacity={0.85}
// //           >
// //             {saving
// //               ? <ActivityIndicator color="#fff" />
// //               : <>
// //                   <Text style={styles.saveText}>Save Information</Text>
// //                   <Ionicons name="arrow-forward" size={18} color="#fff" />
// //                 </>
// //             }
// //           </TouchableOpacity>
// //         </ScrollView>
// //       </KeyboardAvoidingView>
// //     </SafeAreaView>
// //   );
// // }

// // const FloatingField = ({ icon, label, value, placeholder, onChange, keyboardType, autoCapitalize }: any) => (
// //   <View style={styles.block}>
// //     <View style={styles.blockHeader}>
// //       <View style={styles.iconCircle}>
// //         <Ionicons name={icon} size={14} color={COLORS.brand} />
// //       </View>
// //       <Text style={styles.blockLabel}>{label}</Text>
// //     </View>
// //     <TextInput
// //       style={styles.input}
// //       value={value}
// //       onChangeText={onChange}
// //       placeholder={placeholder}
// //       placeholderTextColor="#94A3B8"
// //       keyboardType={keyboardType}
// //       autoCapitalize={autoCapitalize}
// //       selectionColor={COLORS.brand}
// //     />
// //   </View>
// // );

// // const styles = StyleSheet.create({
// //   safe: { flex: 1, backgroundColor: COLORS.bg },
// //   container: { flex: 1 },
// //   content: { padding: 20, paddingBottom: 60 },
// //   header: {
// //     flexDirection: "row", alignItems: "center", justifyContent: "space-between",
// //     marginBottom: 28, marginTop: Platform.OS === "android" ? 10 : 0,
// //   },
// //   backBtn: {
// //     width: 44, height: 44, borderRadius: 14, backgroundColor: "#fff",
// //     alignItems: "center", justifyContent: "center",
// //     borderWidth: 1, borderColor: "#F1F5F9",
// //     shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
// //   },
// //   title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
// //   intro: { marginBottom: 32, paddingLeft: 4 },
// //   introHeading: { fontSize: 28, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
// //   introSub: { fontSize: 15, fontWeight: "600", color: COLORS.muted, marginTop: 4 },
// //   formArea: { gap: 16 },
// //   rowLayout: { flexDirection: "row", alignItems: "flex-start" },
// //   block: {
// //     backgroundColor: COLORS.card, borderRadius: 20, padding: 16,
// //     borderWidth: 1, borderColor: COLORS.border,
// //     shadowColor: COLORS.brand, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
// //     marginBottom: 4,
// //   },
// //   blockHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
// //   iconCircle: {
// //     width: 26, height: 26, borderRadius: 8, backgroundColor: COLORS.brandSoft,
// //     alignItems: "center", justifyContent: "center", marginRight: 10,
// //   },
// //   blockLabel: { fontSize: 12, fontWeight: "800", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.8 },
// //   input: { fontSize: 16, fontWeight: "700", color: COLORS.text, paddingVertical: 4 },
// //   saveBtn: {
// //     marginTop: 40, flexDirection: "row", alignItems: "center", justifyContent: "center",
// //     backgroundColor: COLORS.brand, padding: 20, borderRadius: 22, gap: 12,
// //     shadowColor: COLORS.brand, shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 8,
// //   },
// //   saveText: { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 0.3 },
// // });
// // app/profile/settings/PersonalInfo.tsx
// import React,{useEffect,useState} from "react";
// import {View,Text,TextInput,StyleSheet,TouchableOpacity,Alert,ScrollView,SafeAreaView,Platform,KeyboardAvoidingView,ActivityIndicator} from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
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
//   amber:"#F59E0B",amberBg:"#FFFBEB",
//   coral:"#FF6F6F",coralBg:"#FFF0F0",
//   danger:"#EF4444",
// };
// const STORAGE_KEY="user_profile";

// export default function PersonalInfo(){
//   const router=useRouter();
//   const{userId}=useAuth();
//   const API_BASE=(Constants.expoConfig?.extra as any)?.apiBaseUrl as string|undefined;
//   const EVENT_API_KEY=(Constants.expoConfig?.extra as any)?.eventApiKey as string|undefined;
//   const[form,setForm]=useState({name:"",email:"",phone:"",gender:"",city:"",country:""});
//   const[saving,setSaving]=useState(false);
//   const[loading,setLoading]=useState(true);

//   useEffect(()=>{(async()=>{
//     const stored=await AsyncStorage.getItem(STORAGE_KEY);
//     if(stored){try{setForm(f=>({...f,...JSON.parse(stored)}));}catch{}}
//     if(!API_BASE||!userId){setLoading(false);return;}
//     try{
//       const res=await apiFetch(`${API_BASE.replace(/\/$/,"")}/api/profile?clerkUserId=${encodeURIComponent(userId)}`,{method:"GET",headers:EVENT_API_KEY?{"x-api-key":EVENT_API_KEY}:{}});
//       if(res.ok){const src=await res.json().catch(()=>({}));setForm({name:src?.name||"",email:src?.email||"",phone:src?.phone||"",gender:src?.gender||"",city:src?.city||"",country:src?.country||""});}
//     }catch{}
//     setLoading(false);
//   })();},[API_BASE,userId,EVENT_API_KEY]);

//   const saveProfile=async()=>{
//     if(!API_BASE||!userId){await AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(form));Alert.alert("Saved ✨","Profile updated locally.");return;}
//     setSaving(true);
//     try{
//       const parts=form.name.trim().split(/\s+/);
//       const res=await apiFetch(`${API_BASE.replace(/\/$/,"")}/api/profile`,{method:"PATCH",headers:{"Content-Type":"application/json",...(EVENT_API_KEY?{"x-api-key":EVENT_API_KEY}:{})},body:JSON.stringify({clerkUserId:userId,firstName:parts[0]||"",lastName:parts.slice(1).join(" ")||"",phone:form.phone.trim()||undefined,gender:form.gender.trim()||undefined,city:form.city.trim()||undefined,country:form.country.trim()||undefined})});
//       if(!res.ok){const t=await res.text().catch(()=>"");throw new Error(t||`Failed (${res.status})`);}
//       await AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(form));
//       Alert.alert("Saved ✨","Your profile has been updated.");
//     }catch(e:any){Alert.alert("Error",e?.message||"Failed to save.");}
//     finally{setSaving(false);}
//   };
//   const set=(key:string,val:string)=>setForm(f=>({...f,[key]:val}));

//   return(
//     <SafeAreaView style={S.safe}>
//       <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{flex:1}}>
//         <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

//           <View style={S.header}>
//             <TouchableOpacity onPress={()=>router.back()} style={S.backBtn}>
//               <Ionicons name="chevron-back" size={24} color={C.ink}/>
//             </TouchableOpacity>
//             <Text style={S.headerTitle}>Edit Profile</Text>
//             <View style={{width:44}}/>
//           </View>

//           <View style={S.intro}>
//             <Text style={S.introH}>Personal Details</Text>
//             <Text style={S.introS}>How others see you on the platform.</Text>
//           </View>

//           {loading?(<View style={{alignItems:"center",paddingTop:40}}><ActivityIndicator color={C.teal}/></View>):(
//             <View style={S.formArea}>
//               <Field icon="person-outline" label="Full Name" value={form.name} placeholder="e.g. Anshul Sharma" onChange={(v:string)=>set("name",v)}/>
//               <Field icon="mail-outline" label="Email Address" value={form.email} placeholder="anshul@example.com" onChange={(v:string)=>set("email",v)} keyboardType="email-address" autoCapitalize="none"/>
//               <Field icon="call-outline" label="Phone Number" value={form.phone} placeholder="+91 98765 43210" onChange={(v:string)=>set("phone",v)} keyboardType="phone-pad"/>
//               <Field icon="people-outline" label="Gender" value={form.gender} placeholder="Male / Female / Other" onChange={(v:string)=>set("gender",v)}/>
//               <View style={S.row}>
//                 <View style={{flex:1,marginRight:8}}><Field icon="location-outline" label="City" value={form.city} placeholder="Indore" onChange={(v:string)=>set("city",v)}/></View>
//                 <View style={{flex:1,marginLeft:8}}><Field icon="globe-outline" label="Country" value={form.country} placeholder="India" onChange={(v:string)=>set("country",v)}/></View>
//               </View>
//             </View>
//           )}

//           <TouchableOpacity style={[S.saveBtn,(saving||loading)&&{opacity:0.7}]} onPress={saveProfile} disabled={saving||loading} activeOpacity={0.85}>
//             {saving?<ActivityIndicator color="#fff"/>:<><Text style={S.saveTxt}>Save Information</Text><Ionicons name="arrow-forward" size={18} color="#fff"/></>}
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const Field=({icon,label,value,placeholder,onChange,keyboardType,autoCapitalize}:any)=>(
//   <View style={S.block}>
//     <View style={S.blockHeader}>
//       <View style={S.iconCircle}><Ionicons name={icon} size={14} color={C.teal}/></View>
//       <Text style={S.blockLabel}>{label}</Text>
//     </View>
//     <TextInput style={S.input} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.hint} keyboardType={keyboardType} autoCapitalize={autoCapitalize} selectionColor={C.teal}/>
//   </View>
// );

// const S=StyleSheet.create({
//   safe:{flex:1,backgroundColor:C.bg},container:{flex:1},content:{padding:20,paddingBottom:60},
//   header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:24,marginTop:Platform.OS==="android"?10:0},
//   backBtn:{width:42,height:42,borderRadius:13,backgroundColor:C.card,alignItems:"center",justifyContent:"center",borderWidth:1.5,borderColor:C.cardBorder,shadowColor:"#000",shadowOpacity:0.04,shadowRadius:6,shadowOffset:{width:0,height:3}},
//   headerTitle:{fontSize:17,fontWeight:"800",color:C.ink},
//   intro:{marginBottom:28,paddingLeft:4},
//   introH:{fontSize:26,fontWeight:"900",color:C.ink,letterSpacing:-0.5},
//   introS:{fontSize:14,fontWeight:"500",color:C.muted,marginTop:4},
//   formArea:{gap:12},
//   row:{flexDirection:"row",alignItems:"flex-start"},
//   block:{backgroundColor:C.card,borderRadius:18,padding:16,borderWidth:1.5,borderColor:C.cardBorder,shadowColor:C.teal,shadowOpacity:0.05,shadowRadius:8,shadowOffset:{width:0,height:4}},
//   blockHeader:{flexDirection:"row",alignItems:"center",marginBottom:10},
//   iconCircle:{width:26,height:26,borderRadius:8,backgroundColor:C.tealBg,alignItems:"center",justifyContent:"center",marginRight:10},
//   blockLabel:{fontSize:11,fontWeight:"800",color:C.muted,textTransform:"uppercase",letterSpacing:0.8},
//   input:{fontSize:15,fontWeight:"700",color:C.ink,paddingVertical:4},
//   saveBtn:{marginTop:36,flexDirection:"row",alignItems:"center",justifyContent:"center",backgroundColor:C.teal,padding:18,borderRadius:999,gap:10,shadowColor:C.teal,shadowOpacity:0.35,shadowRadius:14,shadowOffset:{width:0,height:6},elevation:6},
//   saveTxt:{color:"#fff",fontSize:16,fontWeight:"900"},
// });
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, SafeAreaView, Platform, KeyboardAvoidingView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { apiFetch } from "../../../lib/apiFetch";

const STORAGE_KEY = "user_profile";

const C = {
  bg: "#F7F8FA", card: "#FFFFFF", cardBorder: "#EAECF0",
  inputBg: "#F7F8FA", inputBorder: "#E2E5EA",
  ink: "#0D1117", muted: "#656D76", hint: "#AFB8C1",
  green: "#22C55E", greenDark: "#16A34A", greenBg: "#DCFCE7",
  greenBorder: "#86EFAC", greenText: "#15803D",
  teal: "#0EA5E9", tealBg: "#E0F2FE",
  amber: "#F59E0B", amberBg: "#FEF3C7",
};

export default function PersonalInfo() {
  const router = useRouter(); const { userId } = useAuth();
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  const [form, setForm] = useState({ name: "", email: "", phone: "", gender: "", city: "", country: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) { try { setForm(f => ({ ...f, ...JSON.parse(stored) })); } catch {} }
      if (!API_BASE || !userId) { setLoading(false); return; }
      try {
        const res = await apiFetch(`${API_BASE.replace(/\/$/, "")}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, { method: "GET", headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {} });
        if (res.ok) {
          const src = await res.json().catch(() => ({}));
          setForm({ name: src?.name || "", email: src?.email || "", phone: src?.phone || "", gender: src?.gender || "", city: src?.city || "", country: src?.country || "" });
        }
      } catch {}
      setLoading(false);
    })();
  }, [API_BASE, userId, EVENT_API_KEY]);

  const saveProfile = async () => {
    if (!API_BASE || !userId) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      Alert.alert("Saved", "Profile updated locally."); return;
    }
    setSaving(true);
    try {
      const parts = form.name.trim().split(/\s+/);
      const res = await apiFetch(`${API_BASE.replace(/\/$/, "")}/api/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) },
        body: JSON.stringify({ clerkUserId: userId, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "", phone: form.phone.trim() || undefined, gender: form.gender.trim() || undefined, city: form.city.trim() || undefined, country: form.country.trim() || undefined }),
      });
      if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(t || `Failed (${res.status})`); }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) { Alert.alert("Error", e?.message || "Failed to save."); }
    finally { setSaving(false); }
  };
  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const FIELDS = [
    { key: "name", icon: "person-outline" as const, iconBg: C.greenBg, iconColor: C.green, label: "Full Name", placeholder: "e.g. Anshul Sharma" },
    { key: "email", icon: "mail-outline" as const, iconBg: C.tealBg, iconColor: C.teal, label: "Email Address", placeholder: "anshul@example.com", keyboardType: "email-address" as const, autoCapitalize: "none" as const },
    { key: "phone", icon: "call-outline" as const, iconBg: "#E0F2FE", iconColor: "#0EA5E9", label: "Phone Number", placeholder: "+91 98765 43210", keyboardType: "phone-pad" as const },
    { key: "gender", icon: "people-outline" as const, iconBg: C.amberBg, iconColor: C.amber, label: "Gender", placeholder: "Male / Female / Other" },
  ];

  return (
    <SafeAreaView style={S.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={S.container} contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>

          <View style={S.header}>
            <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
              <Ionicons name="chevron-back" size={22} color={C.ink} />
            </TouchableOpacity>
            <Text style={S.headerTitle}>Edit Profile</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={S.intro}>
            <Text style={S.introH}>Personal Details</Text>
            <Text style={S.introS}>How others see you on the platform.</Text>
          </View>

          {loading ? (
            <View style={{ alignItems: "center", paddingTop: 40 }}><ActivityIndicator color={C.green} /></View>
          ) : (
            <View style={S.formArea}>
              {FIELDS.map(f => (
                <View key={f.key} style={S.block}>
                  <View style={S.blockHeader}>
                    <View style={[S.iconCircle, { backgroundColor: f.iconBg }]}>
                      <Ionicons name={f.icon} size={13} color={f.iconColor} />
                    </View>
                    <Text style={S.blockLabel}>{f.label}</Text>
                  </View>
                  <TextInput
                    style={S.input} value={(form as any)[f.key]} onChangeText={v => set(f.key, v)}
                    placeholder={f.placeholder} placeholderTextColor={C.hint}
                    keyboardType={(f as any).keyboardType} autoCapitalize={(f as any).autoCapitalize}
                    selectionColor={C.green}
                  />
                </View>
              ))}

              {/* City + Country side by side */}
              <View style={S.rowLayout}>
                <View style={[S.block, { flex: 1, marginRight: 6 }]}>
                  <View style={S.blockHeader}>
                    <View style={[S.iconCircle, { backgroundColor: "#FEF3C7" }]}>
                      <Ionicons name="location-outline" size={13} color={C.amber} />
                    </View>
                    <Text style={S.blockLabel}>City</Text>
                  </View>
                  <TextInput style={S.input} value={form.city} onChangeText={v => set("city", v)} placeholder="Indore" placeholderTextColor={C.hint} selectionColor={C.green} />
                </View>
                <View style={[S.block, { flex: 1, marginLeft: 6 }]}>
                  <View style={S.blockHeader}>
                    <View style={[S.iconCircle, { backgroundColor: C.tealBg }]}>
                      <Ionicons name="globe-outline" size={13} color={C.teal} />
                    </View>
                    <Text style={S.blockLabel}>Country</Text>
                  </View>
                  <TextInput style={S.input} value={form.country} onChangeText={v => set("country", v)} placeholder="India" placeholderTextColor={C.hint} selectionColor={C.green} />
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[S.saveBtn, (saving || loading) && { opacity: 0.7 }]}
            onPress={saveProfile} disabled={saving || loading} activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <><Text style={S.saveTxt}>Save Information</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 24, marginTop: Platform.OS === "android" ? 10 : 0,
  },
  backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cardBorder },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  intro: { marginBottom: 24, paddingLeft: 2 },
  introH: { fontSize: 26, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  introS: { fontSize: 14, fontWeight: "500", color: C.muted, marginTop: 4 },
  formArea: { gap: 10 },
  rowLayout: { flexDirection: "row", alignItems: "flex-start" },
  block: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  iconCircle: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  blockLabel: { fontSize: 11, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 },
  input: { fontSize: 15, fontWeight: "600", color: C.ink, paddingVertical: 2 },
  saveBtn: {
    marginTop: 28, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    height: 52, borderRadius: 999, backgroundColor: C.green,
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  saveTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
