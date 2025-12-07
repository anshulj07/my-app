import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // ✅ IMPORTANT: keep native header off (map overlays + touch issues)
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#e34343ff",
        tabBarInactiveTintColor: "#e34343ff",
        tabBarStyle: { height: 60, paddingBottom: 10 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trip"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "airplane" : "airplane-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="message"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
