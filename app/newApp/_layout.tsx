// // // app/newApp/_layout.tsx
// // // ✏️ UPDATED — 5 tabs: Home | Search | Explore | Bookings | Chats
// // // Profile (Me) accessible via ProfileHeaderButton top-right on Home
// // // NOTE: If you want a dedicated Me tab, rename this tab from "chat" and add profile back

// // import { Tabs } from "expo-router";
// // import { Platform, View, StyleSheet } from "react-native";
// // import Ionicons from "@expo/vector-icons/Ionicons";
// // import { useSafeAreaInsets } from "react-native-safe-area-context";
// // import { useNotifications } from "../../context/NotificationContext";

// // const BRAND  = "#FF4D6D";
// // const BG     = "#FFFFFF";
// // const MUTED  = "#9CA3AF";
// // const BORDER = "#F3F4F6";

// // export default function NewAppLayout() {
// //   const insets = useSafeAreaInsets();
// //   const { unreadCount } = useNotifications();

// //   return (
// //     <Tabs
// //       screenOptions={{
// //         headerShown: false,
// //         tabBarStyle: {
// //           backgroundColor: BG,
// //           borderTopColor: BORDER,
// //           borderTopWidth: 1,
// //           height: 56 + (Platform.OS === "ios" ? insets.bottom : 10),
// //           paddingBottom: Platform.OS === "ios" ? insets.bottom : 10,
// //           paddingTop: 8,
// //           elevation: 0,
// //           shadowColor: "#000",
// //           shadowOpacity: 0.04,
// //           shadowRadius: 8,
// //           shadowOffset: { width: 0, height: -2 },
// //         },
// //         tabBarActiveTintColor: BRAND,
// //         tabBarInactiveTintColor: MUTED,
// //         tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
// //         tabBarHideOnKeyboard: true,
// //       }}
// //     >
// //       {/* 1 — Home */}
// //       <Tabs.Screen
// //         name="home"
// //         options={{
// //           title: "Home",
// //           tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
// //         }}
// //       />

// //       {/* 2 — Search */}
// //       <Tabs.Screen
// //         name="search"
// //         options={{
// //           title: "Search",
// //           tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
// //         }}
// //       />

// //       {/* 3 — Explore */}
// //       <Tabs.Screen
// //         name="trip"
// //         options={{
// //           title: "Explore",
// //           tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
// //         }}
// //       />

// //       {/* 4 — Bookings (with notification dot) */}
// //       <Tabs.Screen
// //         name="mybookings"
// //         options={{
// //           title: "Bookings",
// //           tabBarIcon: ({ color, size, focused }) => (
// //             <View>
// //               <Ionicons name="calendar-outline" size={size} color={color} />
// //               {unreadCount > 0 && !focused && <View style={s.dot} />}
// //             </View>
// //           ),
// //         }}
// //       />

// //       {/* 5 — Chats (folder-based route: chat/index.tsx) */}
// //       <Tabs.Screen
// //         name="chat/index"
// //         options={{
// //           title: "Chats",
// //           tabBarIcon: ({ color, size }) => (
// //             <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
// //           ),
// //         }}
// //       />

// //       {/* Hide chat/[userId] from tab bar — it's a detail screen */}
// //       <Tabs.Screen
// //         name="chat/[userId]"
// //         options={{ href: null }}
// //       />

// //       {/* Hide profile tab — accessible via header profile button */}
// //       <Tabs.Screen
// //         name="profile"
// //         options={{ href: null }}
// //       />
// //     </Tabs>
// //   );
// // }

// // const s = StyleSheet.create({
// //   dot: {
// //     position: "absolute", top: -2, right: -4,
// //     width: 8, height: 8, borderRadius: 4,
// //     backgroundColor: BRAND, borderWidth: 1.5, borderColor: BG,
// //   },
// // });
// // app/newApp/_layout.tsx
// import { Tabs } from "expo-router";
// import { Platform, View, StyleSheet } from "react-native";
// import Ionicons from "@expo/vector-icons/Ionicons";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useNotifications } from "../../context/NotificationContext";

// // ─────────────────────────────────────────────
// //  DESIGN TOKENS
// // ─────────────────────────────────────────────
// const C = {
//   bg:        "#FFFFFF",       // pure white tab bar
//   border:    "#F0EBE3",       // warm card border
//   active:    "#3ecf41",       // teal active
//   inactive:  "#BCB6AD",       // hint / muted
//   dot:       "#FF6F6F",       // coral notification dot
// };

// export default function NewAppLayout() {
//   const insets = useSafeAreaInsets();
//   const { unreadCount } = useNotifications();

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: C.bg,
//           borderTopColor: C.border,
//           borderTopWidth: 1.5,
//           height: 90 + (Platform.OS === "ios" ? insets.bottom : 10),
//           paddingBottom: Platform.OS === "ios" ? insets.bottom : 10,
//           paddingTop: 8,
//           elevation: 0,
//           shadowColor: "#3ECFB2",
//           shadowOpacity: 0.06,
//           shadowRadius: 12,
//           shadowOffset: { width: 0, height: -3 },
//         },
//         tabBarActiveTintColor:   C.active,
//         tabBarInactiveTintColor: C.inactive,
//         tabBarLabelStyle: {
//           fontSize:   11,
//           fontWeight: "800",
//           marginTop:  2,
//           letterSpacing: 0.1,
//         },
//         tabBarHideOnKeyboard: true,
//       }}
//     >
//       {/* 1 — Home */}
//       <Tabs.Screen
//         name="home"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color, size, focused }) => (
//  <Ionicons
//     name={focused ? "home" : "home-outline"}
//     size={size}
//     color={color}
//   />          ),
//         }}
//       />

//       {/* 2 — Search */}
//       <Tabs.Screen
//         name="search"
//         options={{
//           title: "Search",
//           tabBarIcon: ({ color, size, focused }) => (
//             <Ionicons name={focused ? "search" : "search-outline"} size={size} color={color} />
//           ),
//         }}
//       />

//       {/* 3 — Explore */}
//       <Tabs.Screen
//         name="trip"
//         options={{
//           title: "Trip",    tabBarLabel: "Trip",
//           tabBarIcon: ({ color, size, focused }) => (
// <Ionicons
//   name={focused ? "paper-plane" : "paper-plane-outline"}
//   size={size}
//   color={color}
// />          ),
//         }}
//       />

//       {/* 4 — Bookings (with notification dot) */}
//       <Tabs.Screen
//         name="mybookings"
//         options={{
//           title: "Bookings",
//           tabBarIcon: ({ color, size, focused }) => (
//             <View>
//  <Ionicons
//   name={focused ? "calendar" : "calendar-outline"}
//   size={size}
//   color={color}
// />           {unreadCount > 0 && !focused && <View style={S.dot} />}
//             </View>
//           ),
//         }}
//       />

//       {/* 5 — Chats */}
//       <Tabs.Screen
//         name="chat/index"
//         options={{
//           title: "Chats",
//           tabBarIcon: ({ color, size, focused }) => (
//             <Ionicons
//               name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
//               size={size} color={color}
//             />
//           ),
//         }}
//       />

//       {/* Hidden screens */}
//       <Tabs.Screen name="chat/[userId]" options={{ href: null }} />
//       <Tabs.Screen name="profile"       options={{ href: null }} />
//     </Tabs>
//   );
// }

// const S = StyleSheet.create({
//   dot: {
//     position:   "absolute",
//     top:        -2,
//     right:      -4,
//     width:      8,
//     height:     8,
//     borderRadius: 4,
//     backgroundColor: C.dot,
//     borderWidth: 1.5,
//     borderColor: C.bg,
//   },
// });
// app/newApp/_layout.tsx
import { Tabs } from "expo-router";
import { Platform, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications } from "../../context/NotificationContext";

// ─────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg:       "#FFFFFF",
  border:   "#F0EBE3",
  active:   "#3ecf41",
  inactive: "#BCB6AD",
  dot:      "#FF6F6F",
};

export default function NewAppLayout() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.border,
          borderTopWidth: 1.5,
          height: 90 + (Platform.OS === "ios" ? insets.bottom : 10),
          paddingBottom: Platform.OS === "ios" ? insets.bottom : 10,
          paddingTop: 8,
          elevation: 0,
          shadowColor: "#3ECFB2",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
        },
        tabBarActiveTintColor:   "#6C63FF",
        tabBarInactiveTintColor: C.inactive,
        tabBarLabelStyle: {
          fontSize:      11,
          fontFamily:    "Outfit_800ExtraBold",
          marginTop:     2,
          letterSpacing: 0.1,
        },
        tabBarHideOnKeyboard: true,
        tabBarPressOpacity: 0.7,
        tabBarPressColor: "transparent",
      }}
    >

      {/* ── VISIBLE TABS ── */}

      {/* 1 — Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />

      {/* 2 — Trip */}
      <Tabs.Screen
        name="trip"
        options={{
          title: "Trip",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "paper-plane" : "paper-plane-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 3 — Bookings */}
      <Tabs.Screen
        name="mybookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={size}
                color={color}
              />
              {unreadCount > 0 && !focused && <View style={S.dot} />}
            </View>
          ),
        }}
      />

      {/* 4 — Chats */}
      <Tabs.Screen
        name="chat/index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ── HIDDEN — tab bar mein nahi dikhenge ── */}
      <Tabs.Screen name="search"          options={{ href: null }} />
      <Tabs.Screen name="chat/[userId]"   options={{ href: null }} />
      <Tabs.Screen name="profile"         options={{ href: null }} />
      <Tabs.Screen name="filters"         options={{ href: null }} />
      <Tabs.Screen name="section-events"  options={{ href: null }} />
      <Tabs.Screen name="event-detail"    options={{ href: null }} /> 
      

    </Tabs>
  );
}

const S = StyleSheet.create({
  dot: {
    position:        "absolute",
    top:             -2,
    right:           -4,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: C.dot,
    borderWidth:     1.5,
    borderColor:     C.bg,
  },
});