// // // app/profile/settings/Social.tsx
// // // ✅ UPDATED: Invite Friends uses native Share API

// // import React from "react";
// // import {
// //   View, Text, StyleSheet, TouchableOpacity,
// //   ScrollView, SafeAreaView, Platform, Share, Alert,
// // } from "react-native";
// // import Ionicons from "@expo/vector-icons/Ionicons";
// // import { useRouter } from "expo-router";
// // import { useAuth } from "@clerk/clerk-expo";

// // const C = {
// //   bg: "#FFF7FA", card: "#FFFFFF", text: "#111827",
// //   muted: "#6B7280", brand: "#FF4D6D", brandSoft: "#FFF1F5",
// //   border: "#F1F5F9",
// // };

// // export default function Social() {
// //   const router = useRouter();
// //   const { userId } = useAuth();

// //   const handleInvite = async () => {
// //     try {
// //       await Share.share({
// //         title:   "Join me on Meetup!",
// //         message: "Hey! I'm using Meetup to discover cool local events. Download the app and let's connect! 🎉\n\nhttps://meetup.app/invite",
// //       });
// //     } catch (e: any) {
// //       if (e?.message !== "Share cancelled") {
// //         Alert.alert("Couldn't share", "Please try again.");
// //       }
// //     }
// //   };

// //   return (
// //     <SafeAreaView style={S.safe}>
// //       <ScrollView style={S.container} contentContainerStyle={S.content}>

// //         {/* Header */}
// //         <View style={S.header}>
// //           <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
// //             <Ionicons name="chevron-back" size={24} color={C.text} />
// //           </TouchableOpacity>
// //           <Text style={S.title}>Social</Text>
// //           <View style={{ width: 44 }} />
// //         </View>

// //         <View style={S.intro}>
// //           <Text style={S.introHeading}>Community</Text>
// //           <Text style={S.introSub}>Manage your connections and social activity.</Text>
// //         </View>

// //         {/* Social Rows */}
// //         <View style={S.card}>
// //           <SocialRow
// //             icon="people-outline"
// //             label="Friends & Following"
// //             hint="Manage your connections"
// //             onPress={() => router.push("/newApp/search" as any)}
// //           />
// //           <SocialRow
// //             icon="chatbubble-ellipses-outline"
// //             label="Messages"
// //             hint="View all your conversations"
// //             onPress={() => router.push("/newApp/chat" as any)}
// //           />
// //           <SocialRow
// //             icon="star-outline"
// //             label="Your Events"
// //             hint="Events you created or joined"
// //             onPress={() => router.push("/newApp/mybookings" as any)}
// //           />
// //           <SocialRow
// //             icon="notifications-outline"
// //             label="Notifications"
// //             hint="Activity on your events"
// //             onPress={() => router.push("/newApp/mybookings" as any)}
// //             isLast
// //           />
// //         </View>

// //         {/* Invite button — ✅ uses native Share */}
// //         <TouchableOpacity style={S.inviteBtn} onPress={handleInvite} activeOpacity={0.9}>
// //           <View style={S.inviteIcon}>
// //             <Ionicons name="gift-outline" size={24} color="#fff" />
// //           </View>
// //           <View style={{ flex: 1 }}>
// //             <Text style={S.inviteTitle}>Invite Friends</Text>
// //             <Text style={S.inviteSub}>Share the app with your network</Text>
// //           </View>
// //           <Ionicons name="share-outline" size={20} color="#fff" />
// //         </TouchableOpacity>

// //         <Text style={S.footer}>Building a global traveler community 🌍</Text>
// //       </ScrollView>
// //     </SafeAreaView>
// //   );
// // }

// // const SocialRow = ({ icon, label, hint, onPress, isLast }: any) => (
// //   <TouchableOpacity
// //     style={[S.row, isLast && S.rowLast]}
// //     activeOpacity={0.7}
// //     onPress={onPress}
// //   >
// //     <View style={S.iconCircle}>
// //       <Ionicons name={icon} size={20} color={C.brand} />
// //     </View>
// //     <View style={S.rowBody}>
// //       <Text style={S.label}>{label}</Text>
// //       <Text style={S.hint}>{hint}</Text>
// //     </View>
// //     <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
// //   </TouchableOpacity>
// // );

// // const S = StyleSheet.create({
// //   safe:    { flex: 1, backgroundColor: C.bg },
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
// //   intro: { marginBottom: 28, paddingLeft: 4 },
// //   introHeading: { fontSize: 28, fontWeight: "900", color: C.text, letterSpacing: -0.5 },
// //   introSub:     { fontSize: 15, fontWeight: "600", color: C.muted, marginTop: 4 },

// //   card: {
// //     backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border,
// //     overflow: "hidden", marginBottom: 20,
// //     shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
// //   },
// //   row: {
// //     flexDirection: "row", alignItems: "center",
// //     padding: 18, borderBottomWidth: 1, borderBottomColor: C.border,
// //   },
// //   rowLast: { borderBottomWidth: 0 },
// //   iconCircle: {
// //     width: 42, height: 42, borderRadius: 12, backgroundColor: C.brandSoft,
// //     alignItems: "center", justifyContent: "center", marginRight: 16,
// //   },
// //   rowBody: { flex: 1 },
// //   label:   { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 2 },
// //   hint:    { fontSize: 13, fontWeight: "600", color: C.muted },

// //   inviteBtn: {
// //     flexDirection: "row", alignItems: "center",
// //     backgroundColor: C.brand, padding: 20, borderRadius: 24,
// //     shadowColor: C.brand, shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 10 },
// //     elevation: 8,
// //   },
// //   inviteIcon: {
// //     width: 44, height: 44, borderRadius: 12,
// //     backgroundColor: "rgba(255,255,255,0.2)",
// //     alignItems: "center", justifyContent: "center", marginRight: 16,
// //   },
// //   inviteTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
// //   inviteSub:   { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", marginTop: 2 },

// //   footer: { textAlign: "center", color: C.muted, fontSize: 12, fontWeight: "600", marginTop: 30, opacity: 0.7 },
// // });
// // app/profile/settings/Social.tsx
// import React from "react";
// import {View,Text,StyleSheet,TouchableOpacity,ScrollView,SafeAreaView,Platform,Share,Alert} from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import {useRouter} from "expo-router";
// import {useAuth} from "@clerk/clerk-expo";

// const C={
//   bg:"#FFFBF5",card:"#FFFFFF",cardBorder:"#F0EBE3",
//   inputBg:"#FAF7F2",inputBorder:"#E8E0D5",
//   ink:"#1C1A17",muted:"#8A8278",hint:"#BCB6AD",
//   teal:"#3ECFB2",tealBg:"#E8FAF7",tealText:"#1A7A6A",
//   pink:"#F472B6",pinkBg:"#FDF2F8",pinkText:"#9D174D",
//   purple:"#A78BFA",purpleBg:"#F3F0FF",
//   amber:"#F59E0B",amberBg:"#FFFBEB",
// };

// const ROWS=[
//   {icon:"people-outline",label:"Friends & Following",hint:"Manage your connections",href:"/newApp/search",bg:C.tealBg,color:C.teal},
//   {icon:"chatbubble-ellipses-outline",label:"Messages",hint:"View all conversations",href:"/newApp/chat",bg:C.purpleBg,color:C.purple},
//   {icon:"star-outline",label:"Your Events",hint:"Events you created or joined",href:"/newApp/mybookings",bg:C.amberBg,color:C.amber},
//   {icon:"notifications-outline",label:"Notifications",hint:"Activity on your events",href:"/newApp/mybookings",bg:C.pinkBg,color:C.pink},
// ];

// export default function Social(){
//   const router=useRouter();
//   const handleInvite=async()=>{
//     try{await Share.share({title:"Join me on Meetup!",message:"Hey! I'm using Meetup to discover cool local events. Download the app and let's connect! 🎉\n\nhttps://meetup.app/invite"});}
//     catch(e:any){if(e?.message!=="Share cancelled")Alert.alert("Couldn't share","Please try again.");}
//   };

//   return(
//     <SafeAreaView style={S.safe}>
//       <ScrollView style={S.container} contentContainerStyle={S.content}>
//         <View style={S.header}>
//           <TouchableOpacity onPress={()=>router.back()} style={S.backBtn}><Ionicons name="chevron-back" size={24} color={C.ink}/></TouchableOpacity>
//           <Text style={S.title}>Social</Text>
//           <View style={{width:44}}/>
//         </View>
//         <View style={S.intro}>
//           <Text style={S.introH}>Community</Text>
//           <Text style={S.introS}>Manage your connections and social activity.</Text>
//         </View>

//         <View style={S.card}>
//           {ROWS.map((r,i)=>(
//             <TouchableOpacity key={r.label} style={[S.row,i===ROWS.length-1&&{borderBottomWidth:0}]} activeOpacity={0.7} onPress={()=>router.push(r.href as any)}>
//               <View style={[S.iconCircle,{backgroundColor:r.bg}]}><Ionicons name={r.icon as any} size={20} color={r.color}/></View>
//               <View style={S.rowBody}><Text style={S.label}>{r.label}</Text><Text style={S.hint}>{r.hint}</Text></View>
//               <Ionicons name="chevron-forward" size={16} color={C.hint}/>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Invite */}
//         <TouchableOpacity style={S.inviteBtn} onPress={handleInvite} activeOpacity={0.9}>
//           <View style={S.inviteIcon}><Ionicons name="gift-outline" size={22} color={C.teal}/></View>
//           <View style={{flex:1}}>
//             <Text style={S.inviteTitle}>Invite Friends</Text>
//             <Text style={S.inviteSub}>Share the app with your network</Text>
//           </View>
//           <Ionicons name="share-outline" size={18} color={C.tealText}/>
//         </TouchableOpacity>

//         <Text style={S.footer}>Building a global traveler community 🌍</Text>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const S=StyleSheet.create({
//   safe:{flex:1,backgroundColor:C.bg},container:{flex:1},content:{padding:20,paddingBottom:60},
//   header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:24,marginTop:Platform.OS==="android"?10:0},
//   backBtn:{width:42,height:42,borderRadius:13,backgroundColor:C.card,alignItems:"center",justifyContent:"center",borderWidth:1.5,borderColor:C.cardBorder},
//   title:{fontSize:17,fontWeight:"800",color:C.ink},
//   intro:{marginBottom:24,paddingLeft:4},
//   introH:{fontSize:26,fontWeight:"900",color:C.ink,letterSpacing:-0.5},
//   introS:{fontSize:14,fontWeight:"500",color:C.muted,marginTop:4},
//   card:{backgroundColor:C.card,borderRadius:20,borderWidth:1.5,borderColor:C.cardBorder,overflow:"hidden",marginBottom:16,shadowColor:"#000",shadowOpacity:0.04,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:2},
//   row:{flexDirection:"row",alignItems:"center",padding:16,borderBottomWidth:1,borderBottomColor:C.cardBorder},
//   iconCircle:{width:42,height:42,borderRadius:13,alignItems:"center",justifyContent:"center",marginRight:14},
//   rowBody:{flex:1},
//   label:{fontSize:15,fontWeight:"700",color:C.ink,marginBottom:2},
//   hint:{fontSize:12,fontWeight:"500",color:C.muted},
//   inviteBtn:{flexDirection:"row",alignItems:"center",gap:14,backgroundColor:C.tealBg,borderWidth:1.5,borderColor:C.teal+"55",padding:18,borderRadius:20},
//   inviteIcon:{width:44,height:44,borderRadius:13,backgroundColor:C.card,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.teal+"44"},
//   inviteTitle:{fontSize:15,fontWeight:"900",color:C.tealText},
//   inviteSub:{fontSize:12,fontWeight:"500",color:C.teal,marginTop:2},
//   footer:{textAlign:"center",color:C.hint,fontSize:12,fontWeight:"600",marginTop:28},
// });
import React from "react";
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, 
    SafeAreaView, Platform, Share, Alert, Dimensions 
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
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
    green: "#DCFCE7",
    greenText: "#15803D",
    font: "Outfit_500Medium",
    fontBold: "Outfit_700Bold",
    fontExtraBold: "Outfit_800ExtraBold",
};

const SOCIAL_ITEMS = [
    { 
        icon: "people-outline" as const, 
        iconBg: "#EEF2FF", iconColor: "#4F46E5", 
        label: "Friends & Following", hint: "Manage your connections", href: "/newApp/search" 
    },
    { 
        icon: "chatbox-outline" as const, 
        iconBg: "#E0F2FE", iconColor: "#0284C7", 
        label: "Messages", hint: "View all conversations", href: "/newApp/chat" 
    },
    { 
        icon: "star-outline" as const, 
        iconBg: "#FEF2F2", iconColor: "#DC2626", 
        label: "Your Events", hint: "Events you created or joined", href: "/newApp/mybookings" 
    },
    { 
        icon: "notifications-outline" as const, 
        iconBg: "#FFF7ED", iconColor: "#EA580C", 
        label: "Notifications", hint: "Activity on your events", href: "/newApp/mybookings" 
    },
];

export default function Social() {
    const router = useRouter();

    const handleInvite = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await Share.share({ 
                title: "Join me on Meetup!", 
                message: "Hey! I'm using Meetup to discover cool local events. Download the app and let's connect!\n\nhttps://meetup.app/invite" 
            });
        } catch (e: any) {
            if (e?.message !== "Share cancelled") Alert.alert("Couldn't share", "Please try again.");
        }
    };

    return (
        <SafeAreaView style={S.safe}>
            <View style={S.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.purple} />
                </TouchableOpacity>
                <Text style={S.headerTitle}>Social</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView 
                style={S.container} 
                contentContainerStyle={S.content} 
                showsVerticalScrollIndicator={false}
            >
                <View style={S.intro}>
                    <Text style={S.introH}>Community</Text>
                    <Text style={S.introS}>Manage your connections and social activity.</Text>
                </View>

                <View style={S.card}>
                    {SOCIAL_ITEMS.map((r, i) => (
                        <TouchableOpacity
                            key={r.label}
                            style={[S.row, i === SOCIAL_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
                            activeOpacity={0.7}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(r.href as any);
                            }}
                        >
                            <View style={[S.iconBox, { backgroundColor: r.iconBg }]}>
                                <Ionicons name={r.icon} size={20} color={r.iconColor} />
                            </View>
                            <View style={S.rowBody}>
                                <Text style={S.label}>{r.label}</Text>
                                <Text style={S.hint}>{r.hint}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.lightMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={S.inviteCard}>
                    <View style={S.inviteHeader}>
                        <View style={S.inviteIconBg}>
                            <Ionicons name="gift-outline" size={20} color={COLORS.greenText} />
                        </View>
                        <Text style={S.inviteTitle}>Invite Friends</Text>
                    </View>
                    <Text style={S.inviteSub}>Share the app with your network and earn exclusive badges.</Text>
                    <TouchableOpacity 
                        style={S.shareButton} 
                        onPress={handleInvite}
                        activeOpacity={0.8}
                    >
                        <Text style={S.shareText}>Share Link</Text>
                    </TouchableOpacity>
                </View>

                <View style={S.statsGrid}>
                    <View style={S.statCard}>
                        <View style={[S.statIconBox, { backgroundColor: "#EEF2FF" }]}>
                            <Ionicons name="globe-outline" size={20} color="#4F46E5" />
                        </View>
                        <Text style={S.statLabel}>Global Community</Text>
                    </View>
                    <View style={S.statCard}>
                        <View style={[S.statIconBox, { backgroundColor: "#FEF2F2" }]}>
                            <Ionicons name="heart-outline" size={20} color="#DC2626" />
                        </View>
                        <Text style={S.statLabel}>Meetup Together</Text>
                    </View>
                </View>

                <Text style={S.footer}>Building a global traveler community.</Text>
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
    card: {
        backgroundColor: COLORS.card, borderRadius: 24, overflow: "hidden",
        borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
        shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    },
    row: {
        flexDirection: "row", alignItems: "center",
        padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 16 },
    rowBody: { flex: 1 },
    label: { fontSize: 16, fontFamily: COLORS.fontBold, color: COLORS.text },
    hint: { fontSize: 12, fontFamily: COLORS.font, color: COLORS.muted, marginTop: 2 },
    inviteCard: {
        backgroundColor: COLORS.green, borderRadius: 24, padding: 24, marginBottom: 20,
    },
    inviteHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
    inviteIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
    inviteTitle: { fontSize: 16, fontFamily: COLORS.fontExtraBold, color: COLORS.greenText },
    inviteSub: { fontSize: 13, fontFamily: COLORS.fontBold, color: COLORS.greenText, opacity: 0.8, lineHeight: 18, marginBottom: 16 },
    shareButton: {
        backgroundColor: COLORS.purple, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20,
        alignSelf: "flex-start", shadowColor: COLORS.purple, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    },
    shareText: { color: "#fff", fontSize: 14, fontFamily: COLORS.fontExtraBold },
    statsGrid: { flexDirection: "row", gap: 16, marginBottom: 40 },
    statCard: {
        flex: 1, backgroundColor: "#fff", borderRadius: 24, padding: 20,
        alignItems: "center", justifyContent: "center", gap: 12,
        borderWidth: 1, borderColor: COLORS.border,
    },
    statIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    statLabel: { fontSize: 13, fontFamily: COLORS.fontBold, color: COLORS.text, textAlign: "center" },
    footer: { textAlign: "center", color: COLORS.lightMuted, fontSize: 12, fontFamily: COLORS.fontBold },
});
