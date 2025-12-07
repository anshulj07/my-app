import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,
        tabBarActiveTintColor: "#0A84FF",
        tabBarInactiveTintColor: "rgba(15,23,42,0.45)",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },

        tabBarStyle: {
          height: 74,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 18 : 12,
          borderTopWidth: 1,
          borderTopColor: "rgba(15,23,42,0.08)",
          backgroundColor: "rgba(255,255,255,0.94)",
          ...(Platform.OS === "ios"
            ? {
                shadowColor: "#0B1220",
                shadowOpacity: 0.08,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: -10 },
              }
            : { elevation: 18 }),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="trip"
        options={{
          title: "Trips",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "airplane" : "airplane-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="mybookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
