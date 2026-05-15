import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { apiFetch } from "../lib/apiFetch";

export type NotifItem = {
  id: string;
  type: "joined" | "pending";
  eventId: string;
  eventTitle: string;
  eventEmoji: string;
  userName: string;
  userClerkId: string;
  userImageUrl: string;
  message: string;
  timestamp: string;
  paid?: boolean; // ✅ Added for payment tracking
};

type NotificationContextType = {
  notifications: NotifItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LAST_SEEN_KEY = "@notif_last_seen";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const { user } = useUser();
  const onboardingComplete = user?.unsafeMetadata?.onboardingComplete === true;
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(0);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
  }), [EVENT_API_KEY]);

  // Load last seen timestamp from storage
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(LAST_SEEN_KEY);
      if (stored) setLastSeen(parseInt(stored, 10));
    })();
  }, []);

  const refresh = useCallback(async () => {
    if (!API_BASE || !userId || !onboardingComplete) return;
    setLoading(true);
    try {
      const res = await apiFetch(
        `${API_BASE}/api/events/notifications?clerkUserId=${encodeURIComponent(userId)}`,
        { method: "GET", headers }
      );
      if (res.ok) {
        const json = await res.json();
        setNotifications(Array.isArray(json?.items) ? json.items : []);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, userId, onboardingComplete, headers]);

  useEffect(() => {
    if (userId && onboardingComplete) {
      refresh();
      // Optional: Polling every 60 seconds
      const timer = setInterval(refresh, 60000);
      return () => clearInterval(timer);
    }
  }, [userId, refresh]);

  const unreadCount = useMemo(() => {
    // A notification is unread if its timestamp > lastSeen
    return notifications.filter(n => new Date(n.timestamp).getTime() > lastSeen).length;
  }, [notifications, lastSeen]);

  const markAsRead = useCallback(async () => {
    const now = Date.now();
    setLastSeen(now);
    await AsyncStorage.setItem(LAST_SEEN_KEY, now.toString());
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
  }), [notifications, unreadCount, loading, refresh, markAsRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
