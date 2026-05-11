import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { apiFetch } from "../../lib/apiFetch";
import EditEventModal from "../../components/EditEventModal/EditEvent";

export default function EditEventPage() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey;

  useEffect(() => {
    if (!eventId || !API_BASE) return;

    async function load() {
      try {
        const res = await apiFetch(`${API_BASE}/api/events/${eventId}`, {
          headers: { "x-api-key": EVENT_API_KEY || "" }
        });
        const json = await res.json();
        if (json.ok) {
          setEventData(json.event);
        }
      } catch (err) {
        console.error("Failed to load event for editing:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId, API_BASE]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <EditEventModal
        visible={true}
        event={eventData}
        onClose={() => router.back()}
        onUpdated={() => {
          // You might want to refresh state or just go back
          router.back();
        }}
        onDeleted={() => {
          router.replace("/newApp/mybookings");
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }
});
