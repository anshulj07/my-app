import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";
import ProfileHeaderButton from "../../components/ProfileHeaderButton";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: "myApp",
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#e34343ff" },
        headerShadowVisible: false,
        headerLeft: () => <ProfileHeaderButton />,
        headerRight: () => <View style={{ width: 44 }} />, // keeps title visually centered

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
            <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
