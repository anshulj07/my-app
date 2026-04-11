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
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Share, Alert } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

const C = {
  bg: "#F7F8FA", card: "#FFFFFF", cardBorder: "#EAECF0",
  ink: "#0D1117", muted: "#656D76", hint: "#AFB8C1",
  green: "#22C55E", greenBg: "#DCFCE7", greenBorder: "#86EFAC", greenText: "#15803D",
  teal: "#0EA5E9", tealBg: "#E0F2FE",
  purple: "#8B5CF6", purpleBg: "#EDE9FE",
  amber: "#F59E0B", amberBg: "#FEF3C7",
};

const ROWS = [
  { icon: "people-outline" as const, iconBg: C.greenBg, iconColor: C.green, label: "Friends & Following", hint: "Manage your connections", href: "/newApp/search" },
  { icon: "chatbubble-ellipses-outline" as const, iconBg: C.purpleBg, iconColor: C.purple, label: "Messages", hint: "View all conversations", href: "/newApp/chat" },
  { icon: "star-outline" as const, iconBg: C.amberBg, iconColor: C.amber, label: "Your Events", hint: "Events you created or joined", href: "/newApp/mybookings" },
  { icon: "notifications-outline" as const, iconBg: C.tealBg, iconColor: C.teal, label: "Notifications", hint: "Activity on your events", href: "/newApp/mybookings" },
];

export default function Social() {
  const router = useRouter();

  const handleInvite = async () => {
    try {
      await Share.share({ title: "Join me on Meetup!", message: "Hey! I'm using Meetup to discover cool local events. Download the app and let's connect!\n\nhttps://meetup.app/invite" });
    } catch (e: any) {
      if (e?.message !== "Share cancelled") Alert.alert("Couldn't share", "Please try again.");
    }
  };

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView style={S.container} contentContainerStyle={S.content}>

        <View style={S.header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.ink} />
          </TouchableOpacity>
          <Text style={S.title}>Social</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={S.intro}>
          <Text style={S.introH}>Community</Text>
          <Text style={S.introS}>Manage your connections and social activity.</Text>
        </View>

        <View style={S.card}>
          {ROWS.map((r, i) => (
            <TouchableOpacity
              key={r.label}
              style={[S.row, i === ROWS.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => router.push(r.href as any)}
            >
              <View style={[S.iconBox, { backgroundColor: r.iconBg }]}>
                <Ionicons name={r.icon} size={18} color={r.iconColor} />
              </View>
              <View style={S.rowBody}>
                <Text style={S.label}>{r.label}</Text>
                <Text style={S.hint}>{r.hint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.hint} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Invite banner */}
        <TouchableOpacity style={S.inviteBtn} onPress={handleInvite} activeOpacity={0.9}>
          <View style={S.inviteIconBox}>
            <Ionicons name="gift-outline" size={22} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.inviteTitle}>Invite Friends</Text>
            <Text style={S.inviteSub}>Share the app with your network</Text>
          </View>
          <Ionicons name="share-outline" size={18} color={C.greenText} />
        </TouchableOpacity>

        {/* Community stats */}
        <View style={S.statsRow}>
          <View style={S.statItem}>
            <Ionicons name="globe-outline" size={18} color={C.teal} />
            <Text style={S.statLabel}>Global Community</Text>
          </View>
          <View style={S.statDivider} />
          <View style={S.statItem}>
            <Ionicons name="heart-outline" size={18} color={C.green} />
            <Text style={S.statLabel}>Meetup Together</Text>
          </View>
        </View>

        <Text style={S.footer}>Building a global traveler community</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, container: { flex: 1 }, content: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, marginTop: Platform.OS === "android" ? 10 : 0 },
  backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cardBorder },
  title: { fontSize: 17, fontWeight: "800", color: C.ink },
  intro: { marginBottom: 20, paddingLeft: 2 },
  introH: { fontSize: 26, fontWeight: "900", color: C.ink, letterSpacing: -0.5 },
  introS: { fontSize: 14, fontWeight: "500", color: C.muted, marginTop: 4 },
  card: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 14 },
  rowBody: { flex: 1 },
  label: { fontSize: 14, fontWeight: "700", color: C.ink, marginBottom: 2 },
  hint: { fontSize: 12, fontWeight: "500", color: C.muted },
  inviteBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.greenBg, borderWidth: 1, borderColor: C.greenBorder,
    borderRadius: 16, padding: 16, marginBottom: 14,
  },
  inviteIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.greenBorder },
  inviteTitle: { fontSize: 15, fontWeight: "800", color: C.greenText, marginBottom: 2 },
  inviteSub: { fontSize: 12, fontWeight: "500", color: C.green },
  statsRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder,
    padding: 14, marginBottom: 20,
  },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" },
  statLabel: { fontSize: 12, fontWeight: "700", color: C.muted },
  statDivider: { width: 1, height: 24, backgroundColor: C.cardBorder },
  footer: { textAlign: "center", color: C.hint, fontSize: 12, fontWeight: "600" },
});
