// // import React, { useCallback, useEffect, useMemo, useState } from "react";
// // import {
// //   View,
// //   Text,
// //   StyleSheet,
// //   TouchableOpacity,
// //   TextInput,
// //   ScrollView,
// //   ActivityIndicator,
// //   Platform,
// // } from "react-native";
// // import Ionicons from "@expo/vector-icons/Ionicons";
// // import { useRouter } from "expo-router";
// // import { useAuth } from "@clerk/clerk-expo";
// // import Constants from "expo-constants";
// // import { apiFetch } from "../../../lib/apiFetch";

// // const MAX_INTERESTS = 20;
// // const MAX_LANGUAGES = 20;

// // const INTEREST_SUGGESTIONS = [
// //   "Gym",
// //   "Coffee",
// //   "Cooking",
// //   "Foodie",
// //   "Nightlife",
// //   "Self care",
// //   "Hiking",
// //   "Camping",
// //   "Road trips",
// //   "Beaches",
// //   "Cycling",
// //   "Nature",
// //   "Photography",
// //   "Music",
// //   "Dancing",
// //   "Art",
// //   "Writing",
// //   "Design",
// //   "Movies",
// //   "TV shows",
// //   "Anime",
// //   "Gaming",
// //   "Standup",
// //   "Karaoke",
// //   "AI",
// //   "Startups",
// //   "Coding",
// //   "Product",
// //   "Hackathons",
// //   "Gadgets",
// // ];

// // const LANGUAGE_SUGGESTIONS = [
// //   "English",
// //   "Hindi",
// //   "Punjabi",
// //   "Urdu",
// //   "Bengali",
// //   "Marathi",
// //   "Gujarati",
// //   "Tamil",
// //   "Telugu",
// //   "Kannada",
// //   "Malayalam",
// // ];

// // export default function Preferences() {
// //   const router = useRouter();
// //   const { userId } = useAuth();

// //   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
// //   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

// //   const [loading, setLoading] = useState(true);
// //   const [err, setErr] = useState<string | null>(null);

// //   const [savingInterests, setSavingInterests] = useState(false);
// //   const [savingLanguages, setSavingLanguages] = useState(false);

// //   const [interests, setInterests] = useState<string[]>([]);
// //   const [languages, setLanguages] = useState<string[]>([]);

// //   const [interestQuery, setInterestQuery] = useState("");
// //   const [languageQuery, setLanguageQuery] = useState("");

// //   const baseUrl = useMemo(() => (API_BASE ? API_BASE.replace(/\/$/, "") : ""), [API_BASE]);

// //   const loadProfile = useCallback(async () => {
// //     if (!baseUrl || !userId) return;

// //     setLoading(true);
// //     setErr(null);
// //     try {
// //       const res = await apiFetch(`${baseUrl}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, {
// //         method: "GET",
// //         headers: {
// //           ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
// //         },
// //       });

// //       if (!res.ok) {
// //         const t = await res.text().catch(() => "");
// //         throw new Error(t || `Failed to load profile (${res.status})`);
// //       }

// //       const j = await res.json().catch(() => ({} as any));
// //       const nextInterests = Array.isArray(j?.interests) ? j.interests : [];
// //       const nextLanguages = Array.isArray(j?.languages) ? j.languages : [];

// //       setInterests(nextInterests.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
// //       setLanguages(nextLanguages.filter((x: any) => typeof x === "string" && x.trim()).map((x: string) => x.trim()));
// //     } catch (e: any) {
// //       setErr(e?.message || "Failed to load preferences.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [EVENT_API_KEY, baseUrl, userId]);

// //   useEffect(() => {
// //     loadProfile();
// //   }, [loadProfile]);

// //   const toggleItem = useCallback((value: string, list: string[], setList: (v: string[]) => void, max: number) => {
// //     const v = value.trim();
// //     if (!v) return;
// //     setList((prev) => {
// //       const has = prev.includes(v);
// //       if (has) return prev.filter((x) => x !== v);
// //       if (prev.length >= max) return prev;
// //       return [...prev, v];
// //     });
// //   }, []);

// //   const filteredInterestSuggestions = useMemo(() => {
// //     const q = interestQuery.trim().toLowerCase();
// //     const base = INTEREST_SUGGESTIONS;
// //     const list = q ? base.filter((x) => x.toLowerCase().includes(q)) : base;
// //     return list.slice(0, 30);
// //   }, [interestQuery]);

// //   const filteredLanguageSuggestions = useMemo(() => {
// //     const q = languageQuery.trim().toLowerCase();
// //     const base = LANGUAGE_SUGGESTIONS;
// //     const list = q ? base.filter((x) => x.toLowerCase().includes(q)) : base;
// //     return list.slice(0, 30);
// //   }, [languageQuery]);

// //   const saveInterests = useCallback(async () => {
// //     if (!baseUrl || !userId) return;
// //     setSavingInterests(true);
// //     setErr(null);
// //     try {
// //       const res = await apiFetch(`${baseUrl}/api/profile`, {
// //         method: "PATCH",
// //         headers: {
// //           "Content-Type": "application/json",
// //           ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
// //         },
// //         body: JSON.stringify({ clerkUserId: userId, interests }),
// //       });
// //       if (!res.ok) {
// //         const t = await res.text().catch(() => "");
// //         throw new Error(t || `Failed to save interests (${res.status})`);
// //       }
// //       router.back();
// //     } catch (e: any) {
// //       setErr(e?.message || "Failed to save interests.");
// //     } finally {
// //       setSavingInterests(false);
// //     }
// //   }, [EVENT_API_KEY, baseUrl, interests, router, userId]);

// //   const saveLanguages = useCallback(async () => {
// //     if (!baseUrl || !userId) return;
// //     setSavingLanguages(true);
// //     setErr(null);
// //     try {
// //       const res = await apiFetch(`${baseUrl}/api/profile`, {
// //         method: "PATCH",
// //         headers: {
// //           "Content-Type": "application/json",
// //           ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
// //         },
// //         body: JSON.stringify({ clerkUserId: userId, languages }),
// //       });
// //       if (!res.ok) {
// //         const t = await res.text().catch(() => "");
// //         throw new Error(t || `Failed to save languages (${res.status})`);
// //       }
// //       router.back();
// //     } catch (e: any) {
// //       setErr(e?.message || "Failed to save languages.");
// //     } finally {
// //       setSavingLanguages(false);
// //     }
// //   }, [EVENT_API_KEY, baseUrl, languages, router, userId]);

// //   return (
// //     <View style={styles.page}>
// //       <View style={styles.header}>
// //         <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
// //           <Ionicons name="chevron-back" size={22} color="#111" />
// //         </TouchableOpacity>
// //         <Text style={styles.headerTitle}>Preferences</Text>
// //         <View style={{ width: 40 }} />
// //       </View>

// //       {!API_BASE ? (
// //         <View style={styles.center}>
// //           <Text style={styles.errText}>Config issue: extra.apiBaseUrl is missing.</Text>
// //         </View>
// //       ) : loading ? (
// //         <View style={styles.center}>
// //           <ActivityIndicator />
// //         </View>
// //       ) : (
// //         <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps={Platform.OS === "web" ? "handled" : "always"}>
// //           {!!err && (
// //             <View style={styles.errBox}>
// //               <Text style={styles.errText}>{err}</Text>
// //             </View>
// //           )}

// //           <View style={styles.section}>
// //             <View style={styles.sectionTop}>
// //               <Text style={styles.sectionTitle}>Interests</Text>
// //               <Text style={styles.sectionHint}>{interests.length}/{MAX_INTERESTS}</Text>
// //             </View>

// //             <TextInput
// //               value={interestQuery}
// //               onChangeText={setInterestQuery}
// //               placeholder="Search interests..."
// //               placeholderTextColor="#9CA3AF"
// //               style={styles.search}
// //               autoCorrect={false}
// //               autoCapitalize="none"
// //             />

// //             <View style={styles.chipsWrap}>
// //               {filteredInterestSuggestions.map((label) => {
// //                 const on = interests.includes(label);
// //                 const disabled = !on && interests.length >= MAX_INTERESTS;
// //                 return (
// //                   <TouchableOpacity
// //                     key={label}
// //                     onPress={() => toggleItem(label, interests, setInterests, MAX_INTERESTS)}
// //                     disabled={disabled}
// //                     activeOpacity={0.9}
// //                     style={[styles.chip, on && styles.chipOn, disabled && styles.chipDisabled]}
// //                   >
// //                     <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
// //                   </TouchableOpacity>
// //                 );
// //               })}
// //             </View>

// //             <TouchableOpacity
// //               onPress={saveInterests}
// //               disabled={savingInterests}
// //               activeOpacity={0.9}
// //               style={[styles.saveBtn, savingInterests && { opacity: 0.7 }]}
// //             >
// //               {savingInterests ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Interests</Text>}
// //             </TouchableOpacity>
// //           </View>

// //           <View style={styles.section}>
// //             <View style={styles.sectionTop}>
// //               <Text style={styles.sectionTitle}>Languages</Text>
// //               <Text style={styles.sectionHint}>{languages.length}/{MAX_LANGUAGES}</Text>
// //             </View>

// //             <TextInput
// //               value={languageQuery}
// //               onChangeText={setLanguageQuery}
// //               placeholder="Search languages..."
// //               placeholderTextColor="#9CA3AF"
// //               style={styles.search}
// //               autoCorrect={false}
// //               autoCapitalize="none"
// //             />

// //             <View style={styles.chipsWrap}>
// //               {filteredLanguageSuggestions.map((label) => {
// //                 const on = languages.includes(label);
// //                 const disabled = !on && languages.length >= MAX_LANGUAGES;
// //                 return (
// //                   <TouchableOpacity
// //                     key={label}
// //                     onPress={() => toggleItem(label, languages, setLanguages, MAX_LANGUAGES)}
// //                     disabled={disabled}
// //                     activeOpacity={0.9}
// //                     style={[styles.chip, on && styles.chipOn, disabled && styles.chipDisabled]}
// //                   >
// //                     <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
// //                   </TouchableOpacity>
// //                 );
// //               })}
// //             </View>

// //             <TouchableOpacity
// //               onPress={saveLanguages}
// //               disabled={savingLanguages}
// //               activeOpacity={0.9}
// //               style={[styles.saveBtn, savingLanguages && { opacity: 0.7 }]}
// //             >
// //               {savingLanguages ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Languages</Text>}
// //             </TouchableOpacity>
// //           </View>
// //         </ScrollView>
// //       )}
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   page: { flex: 1, backgroundColor: "#fff" },
// //   header: {
// //     height: 54,
// //     paddingHorizontal: 14,
// //     flexDirection: "row",
// //     alignItems: "center",
// //     justifyContent: "space-between",
// //     borderBottomWidth: StyleSheet.hairlineWidth,
// //     borderBottomColor: "#E5E7EB",
// //   },
// //   backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
// //   headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
// //   content: { padding: 16, paddingBottom: 40 },
// //   center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
// //   section: {
// //     borderWidth: 1,
// //     borderColor: "#E5E7EB",
// //     backgroundColor: "#F9FAFB",
// //     borderRadius: 16,
// //     padding: 14,
// //     marginBottom: 16,
// //   },
// //   sectionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
// //   sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
// //   sectionHint: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
// //   search: {
// //     height: 44,
// //     borderRadius: 12,
// //     paddingHorizontal: 12,
// //     backgroundColor: "#fff",
// //     borderWidth: 1,
// //     borderColor: "#E5E7EB",
// //     color: "#111",
// //   },
// //   chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
// //   chip: {
// //     paddingVertical: 8,
// //     paddingHorizontal: 12,
// //     borderRadius: 999,
// //     backgroundColor: "#fff",
// //     borderWidth: 1,
// //     borderColor: "#E5E7EB",
// //   },
// //   chipOn: { backgroundColor: "#E11D48", borderColor: "#E11D48" },
// //   chipDisabled: { opacity: 0.5 },
// //   chipText: { color: "#111", fontWeight: "700" },
// //   chipTextOn: { color: "#fff" },
// //   saveBtn: {
// //     marginTop: 14,
// //     height: 48,
// //     borderRadius: 14,
// //     alignItems: "center",
// //     justifyContent: "center",
// //     backgroundColor: "#111827",
// //   },
// //   saveText: { color: "#fff", fontSize: 15, fontWeight: "900" },
// //   errBox: { marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
// //   errText: { color: "#991B1B", fontWeight: "700" },
// // });
// // app/profile/settings/Preferences.tsx
// import React,{useCallback,useEffect,useMemo,useState} from "react";
// import {View,Text,StyleSheet,TouchableOpacity,TextInput,ScrollView,ActivityIndicator,Platform} from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import {useRouter} from "expo-router";
// import {useAuth} from "@clerk/clerk-expo";
// import Constants from "expo-constants";
// import {apiFetch} from "../../../lib/apiFetch";

// const C={
//   bg:"#FFFBF5",card:"#FFFFFF",cardBorder:"#F0EBE3",
//   inputBg:"#FAF7F2",inputBorder:"#E8E0D5",
//   ink:"#1C1A17",muted:"#8A8278",hint:"#BCB6AD",
//   teal:"#3ECFB2",tealBg:"#E8FAF7",tealText:"#1A7A6A",
//   purple:"#A78BFA",purpleBg:"#F3F0FF",purpleText:"#5B21B6",
// };
// const MAX=20;
// const INTERESTS=["Gym","Coffee","Cooking","Foodie","Nightlife","Self care","Hiking","Camping","Road trips","Beaches","Cycling","Nature","Photography","Music","Dancing","Art","Writing","Design","Movies","TV shows","Anime","Gaming","Standup","Karaoke","AI","Startups","Coding","Product","Hackathons","Gadgets"];
// const LANGUAGES=["English","Hindi","Punjabi","Urdu","Bengali","Marathi","Gujarati","Tamil","Telugu","Kannada","Malayalam"];

// export default function Preferences(){
//   const router=useRouter();const{userId}=useAuth();
//   const API_BASE=(Constants.expoConfig?.extra as any)?.apiBaseUrl as string|undefined;
//   const EVENT_API_KEY=(Constants.expoConfig?.extra as any)?.eventApiKey as string|undefined;
//   const[loading,setLoading]=useState(true);const[err,setErr]=useState<string|null>(null);
//   const[savingI,setSavingI]=useState(false);const[savingL,setSavingL]=useState(false);
//   const[interests,setInterests]=useState<string[]>([]);const[languages,setLanguages]=useState<string[]>([]);
//   const[iQ,setIQ]=useState("");const[lQ,setLQ]=useState("");
//   const base=useMemo(()=>(API_BASE?API_BASE.replace(/\/$/,""):""),[API_BASE]);

//   const load=useCallback(async()=>{
//     if(!base||!userId)return;setLoading(true);setErr(null);
//     try{
//       const res=await apiFetch(`${base}/api/profile?clerkUserId=${encodeURIComponent(userId)}`,{method:"GET",headers:EVENT_API_KEY?{"x-api-key":EVENT_API_KEY}:{}});
//       if(!res.ok)throw new Error(`Failed (${res.status})`);
//       const j=await res.json().catch(()=>({}as any));
//       setInterests((Array.isArray(j?.interests)?j.interests:[]).filter((x:any)=>typeof x==="string"&&x.trim()).map((x:string)=>x.trim()));
//       setLanguages((Array.isArray(j?.languages)?j.languages:[]).filter((x:any)=>typeof x==="string"&&x.trim()).map((x:string)=>x.trim()));
//     }catch(e:any){setErr(e?.message||"Failed.");}finally{setLoading(false);}
//   },[EVENT_API_KEY,base,userId]);
//   useEffect(()=>{load();},[load]);

//   const toggle=(val:string,list:string[],setList:(v:string[])=>void)=>{
//     const v=val.trim();if(!v)return;
//     setList(prev=>{const has=prev.includes(v);if(has)return prev.filter(x=>x!==v);if(prev.length>=MAX)return prev;return[...prev,v];});
//   };

//   const filteredI=useMemo(()=>{const q=iQ.trim().toLowerCase();return(q?INTERESTS.filter(x=>x.toLowerCase().includes(q)):INTERESTS).slice(0,30);},[iQ]);
//   const filteredL=useMemo(()=>{const q=lQ.trim().toLowerCase();return(q?LANGUAGES.filter(x=>x.toLowerCase().includes(q)):LANGUAGES).slice(0,30);},[lQ]);

//   const saveI=useCallback(async()=>{
//     if(!base||!userId)return;setSavingI(true);setErr(null);
//     try{const res=await apiFetch(`${base}/api/profile`,{method:"PATCH",headers:{"Content-Type":"application/json",...(EVENT_API_KEY?{"x-api-key":EVENT_API_KEY}:{})},body:JSON.stringify({clerkUserId:userId,interests})});if(!res.ok)throw new Error(`Failed (${res.status})`);router.back();}
//     catch(e:any){setErr(e?.message||"Failed.");}finally{setSavingI(false);}
//   },[EVENT_API_KEY,base,interests,router,userId]);

//   const saveL=useCallback(async()=>{
//     if(!base||!userId)return;setSavingL(true);setErr(null);
//     try{const res=await apiFetch(`${base}/api/profile`,{method:"PATCH",headers:{"Content-Type":"application/json",...(EVENT_API_KEY?{"x-api-key":EVENT_API_KEY}:{})},body:JSON.stringify({clerkUserId:userId,languages})});if(!res.ok)throw new Error(`Failed (${res.status})`);router.back();}
//     catch(e:any){setErr(e?.message||"Failed.");}finally{setSavingL(false);}
//   },[EVENT_API_KEY,base,languages,router,userId]);

//   return(
//     <View style={S.page}>
//       <View style={S.header}>
//         <TouchableOpacity onPress={()=>router.back()} hitSlop={12} style={S.backBtn}>
//           <Ionicons name="chevron-back" size={22} color={C.ink}/>
//         </TouchableOpacity>
//         <Text style={S.headerTitle}>Preferences</Text>
//         <View style={{width:40}}/>
//       </View>

//       {!API_BASE?(
//         <View style={S.center}><Text style={{color:"#EF4444",fontWeight:"700"}}>Config issue: apiBaseUrl missing.</Text></View>
//       ):loading?(
//         <View style={S.center}><ActivityIndicator color={C.teal}/></View>
//       ):(
//         <ScrollView contentContainerStyle={S.content} keyboardShouldPersistTaps="always">
//           {!!err&&<View style={S.errBox}><Text style={S.errTxt}>{err}</Text></View>}

//           {/* Interests */}
//           <View style={S.section}>
//             <View style={S.sectionTop}>
//               <View style={S.sectionDot}/>
//               <Text style={S.sectionTitle}>Interests</Text>
//               <Text style={S.sectionHint}>{interests.length}/{MAX}</Text>
//             </View>
//             <View style={S.searchWrap}>
//               <Ionicons name="search-outline" size={16} color={C.hint}/>
//               <TextInput value={iQ} onChangeText={setIQ} placeholder="Search interests…" placeholderTextColor={C.hint} style={S.searchInp} autoCorrect={false} autoCapitalize="none"/>
//             </View>
//             <View style={S.chips}>
//               {filteredI.map(label=>{const on=interests.includes(label);const dis=!on&&interests.length>=MAX;return(
//                 <TouchableOpacity key={label} onPress={()=>toggle(label,interests,setInterests)} disabled={dis} activeOpacity={0.85}
//                   style={[S.chip,on&&{backgroundColor:C.tealBg,borderColor:C.teal+"88"},dis&&{opacity:0.4}]}>
//                   <Text style={[S.chipTxt,on&&{color:C.tealText,fontWeight:"800"}]}>{label}</Text>
//                 </TouchableOpacity>
//               );})}
//             </View>
//             <TouchableOpacity onPress={saveI} disabled={savingI} activeOpacity={0.9} style={[S.saveBtn,{backgroundColor:C.teal},savingI&&{opacity:0.7}]}>
//               {savingI?<ActivityIndicator color="#fff"/>:<Text style={S.saveTxt}>Save Interests</Text>}
//             </TouchableOpacity>
//           </View>

//           {/* Languages */}
//           <View style={[S.section,{borderColor:C.purple+"44"}]}>
//             <View style={S.sectionTop}>
//               <View style={[S.sectionDot,{backgroundColor:C.purple}]}/>
//               <Text style={S.sectionTitle}>Languages</Text>
//               <Text style={S.sectionHint}>{languages.length}/{MAX}</Text>
//             </View>
//             <View style={S.searchWrap}>
//               <Ionicons name="search-outline" size={16} color={C.hint}/>
//               <TextInput value={lQ} onChangeText={setLQ} placeholder="Search languages…" placeholderTextColor={C.hint} style={S.searchInp} autoCorrect={false} autoCapitalize="none"/>
//             </View>
//             <View style={S.chips}>
//               {filteredL.map(label=>{const on=languages.includes(label);const dis=!on&&languages.length>=MAX;return(
//                 <TouchableOpacity key={label} onPress={()=>toggle(label,languages,setLanguages)} disabled={dis} activeOpacity={0.85}
//                   style={[S.chip,on&&{backgroundColor:C.purpleBg,borderColor:C.purple+"88"},dis&&{opacity:0.4}]}>
//                   <Text style={[S.chipTxt,on&&{color:C.purpleText,fontWeight:"800"}]}>{label}</Text>
//                 </TouchableOpacity>
//               );})}
//             </View>
//             <TouchableOpacity onPress={saveL} disabled={savingL} activeOpacity={0.9} style={[S.saveBtn,{backgroundColor:C.purple},savingL&&{opacity:0.7}]}>
//               {savingL?<ActivityIndicator color="#fff"/>:<Text style={S.saveTxt}>Save Languages</Text>}
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// const S=StyleSheet.create({
//   page:{flex:1,backgroundColor:C.bg},
//   header:{height:56,paddingHorizontal:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1.5,borderBottomColor:C.cardBorder,backgroundColor:C.card},
//   backBtn:{width:40,height:40,alignItems:"center",justifyContent:"center"},
//   headerTitle:{fontSize:17,fontWeight:"800",color:C.ink},
//   content:{padding:16,paddingBottom:48},
//   center:{flex:1,alignItems:"center",justifyContent:"center",padding:16},
//   section:{backgroundColor:C.card,borderRadius:20,borderWidth:1.5,borderColor:C.teal+"44",padding:16,marginBottom:16,shadowColor:"#000",shadowOpacity:0.04,shadowRadius:8,shadowOffset:{width:0,height:3}},
//   sectionTop:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:12},
//   sectionDot:{width:10,height:10,borderRadius:5,backgroundColor:C.teal},
//   sectionTitle:{fontSize:15,fontWeight:"900",color:C.ink,flex:1},
//   sectionHint:{fontSize:12,fontWeight:"700",color:C.muted},
//   searchWrap:{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:C.inputBg,borderRadius:12,borderWidth:1.5,borderColor:C.inputBorder,paddingHorizontal:12,marginBottom:12},
//   searchInp:{flex:1,height:42,fontSize:14,fontWeight:"600",color:C.ink},
//   chips:{flexDirection:"row",flexWrap:"wrap",gap:8},
//   chip:{paddingVertical:7,paddingHorizontal:12,borderRadius:999,backgroundColor:C.inputBg,borderWidth:1.5,borderColor:C.inputBorder},
//   chipTxt:{color:C.muted,fontWeight:"700",fontSize:13},
//   saveBtn:{marginTop:16,height:50,borderRadius:999,alignItems:"center",justifyContent:"center"},
//   saveTxt:{color:"#fff",fontSize:15,fontWeight:"900"},
//   errBox:{marginBottom:12,padding:12,borderRadius:12,backgroundColor:"#FEF2F2",borderWidth:1,borderColor:"#FECACA"},
//   errTxt:{color:"#991B1B",fontWeight:"700"},
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, 
    ActivityIndicator, Platform, SafeAreaView 
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { apiFetch } from "../../../lib/apiFetch";
import * as Haptics from "expo-haptics";

const COLORS = {
    purple: "#6366F1",
    purpleBg: "#EEF2FF",
    bg: "#F9FAFB",
    card: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
    lightMuted: "#9CA3AF",
    border: "#F3F4F6",
    font: "Outfit_500Medium",
    fontBold: "Outfit_700Bold",
    fontExtraBold: "Outfit_800ExtraBold",
};

export default function Preferences() {
    const router = useRouter();
    const { userId } = useAuth();
    
    const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
    const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
    
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [counts, setCounts] = useState({ interests: 0, languages: 0 });

    const baseUrl = useMemo(() => (API_BASE ? API_BASE.replace(/\/$/, "") : ""), [API_BASE]);

    const loadProfile = useCallback(async () => {
        if (!baseUrl || !userId) return;
        setLoading(true); setErr(null);
        try {
            const res = await apiFetch(`${baseUrl}/api/profile?clerkUserId=${encodeURIComponent(userId)}`, { 
                method: "GET", 
                headers: { ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) } 
            });
            if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
            const j = await res.json().catch(() => ({} as any));
            setCounts({
                interests: Array.isArray(j?.interests) ? j.interests.length : 0,
                languages: Array.isArray(j?.languages) ? j.languages.length : 0
            });
        } catch (e: any) { setErr(e?.message || "Failed to load preferences."); }
        finally { setLoading(false); }
    }, [EVENT_API_KEY, baseUrl, userId]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const navigateTo = (path: "/profile/settings/Languages" | "/profile/settings/Interests") => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(path);
    };

    return (
        <SafeAreaView style={S.safe}>
            <View style={S.header}>
                <TouchableOpacity onPress={() => router.back()} style={S.headerBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.purple} />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Preferences</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={S.content} showsVerticalScrollIndicator={false}>
                <View style={S.intro}>
                    <Text style={S.introH}>Your Style</Text>
                    <Text style={S.introS}>Customize your experience and help us match you with the right tribe.</Text>
                </View>

                {loading ? (
                    <View style={S.center}><ActivityIndicator color={COLORS.purple} /></View>
                ) : (
                    <View style={S.menu}>
                        <TouchableOpacity 
                            style={S.card} 
                            onPress={() => navigateTo("/profile/settings/Languages")}
                            activeOpacity={0.7}
                        >
                            <View style={[S.iconBox, { backgroundColor: "#FDF2F8" }]}>
                                <Ionicons name="language-outline" size={24} color="#DB2777" />
                            </View>
                            <View style={S.cardInfo}>
                                <Text style={S.cardLabel}>Languages</Text>
                                <Text style={S.cardSub}>{counts.languages} languages selected</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.lightMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={S.card} 
                            onPress={() => navigateTo("/profile/settings/Interests")}
                            activeOpacity={0.7}
                        >
                            <View style={[S.iconBox, { backgroundColor: "#F0F9FF" }]}>
                                <Ionicons name="heart-outline" size={24} color="#0284C7" />
                            </View>
                            <View style={S.cardInfo}>
                                <Text style={S.cardLabel}>Interests</Text>
                                <Text style={S.cardSub}>{counts.interests} interests selected</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.lightMuted} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={S.tipCard}>
                    <Ionicons name="bulb-outline" size={24} color={COLORS.purple} />
                    <View style={{ flex: 1 }}>
                        <Text style={S.tipTitle}>Pro Tip</Text>
                        <Text style={S.tipSub}>Complete your preferences to unlock personalized event recommendations.</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const S = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, height: 60, backgroundColor: "#fff",
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontFamily: COLORS.fontExtraBold, color: COLORS.purple },
    content: { padding: 24 },
    intro: { marginBottom: 32 },
    introH: { fontSize: 32, fontFamily: COLORS.fontExtraBold, color: COLORS.text, marginBottom: 8 },
    introS: { fontSize: 15, fontFamily: COLORS.font, color: COLORS.muted, lineHeight: 22 },
    menu: { gap: 16 },
    card: {
        backgroundColor: "#fff", borderRadius: 24, padding: 20,
        flexDirection: "row", alignItems: "center", gap: 16,
        borderWidth: 1, borderColor: COLORS.border,
        shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    },
    iconBox: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    cardInfo: { flex: 1 },
    cardLabel: { fontSize: 17, fontFamily: COLORS.fontBold, color: COLORS.text },
    cardSub: { fontSize: 13, fontFamily: COLORS.font, color: COLORS.muted, marginTop: 2 },
    tipCard: {
        marginTop: 40, backgroundColor: COLORS.purpleBg, borderRadius: 24, padding: 24,
        flexDirection: "row", gap: 16, alignItems: "flex-start",
    },
    tipTitle: { fontSize: 16, fontFamily: COLORS.fontBold, color: COLORS.purple, marginBottom: 4 },
    tipSub: { fontSize: 14, fontFamily: COLORS.font, color: COLORS.muted, lineHeight: 20 },
    center: { paddingVertical: 60, alignItems: "center" },
});

