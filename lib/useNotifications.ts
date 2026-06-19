// // // lib/useNotifications.ts
// // import { useState, useEffect, useCallback } from "react";
// // import Constants from "expo-constants";

// // export type AppNotification = {
// //   __id: string;
// //   type: "event_approved" | "event_rejected" | "service_approved" | "service_rejected"; // ✅ ADD
// //   eventId?: string;
// //   serviceId?: string; // ✅ ADD
// //   eventTitle: string;
// //   message: string;
// //   moderatorNote?: string;
// //   read: boolean;
// //   createdAt: string;
// // };

// // export function useNotifications(clerkUserId: string | null | undefined) {
// //   const [notifications, setNotifications] = useState<AppNotification[]>([]);
// //   const [unreadCount, setUnreadCount] = useState(0);

// //   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string;
// //   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string;

// //   const fetchNotifications = useCallback(async () => {
// //     if (!clerkUserId || !API_BASE) return;
// //     try {
// //       const res = await fetch(
// //         `${API_BASE}/api/notifications?clerkUserId=${encodeURIComponent(clerkUserId)}`,
// //         { headers: { ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) } }
// //       );
// //       const json = await res.json();
// //       if (json.ok) {
// //         setNotifications(json.notifications || []);
// //         setUnreadCount((json.notifications || []).filter((n: AppNotification) => !n.read).length);
// //       }
// //     } catch (e) {
// //       console.log("Notification fetch error:", e);
// //     }
// //   }, [clerkUserId, API_BASE, EVENT_API_KEY]);

// //   const markAsRead = useCallback(async (notificationId: string) => {
// //     if (!clerkUserId || !API_BASE) return;
// //     try {
// //       await fetch(`${API_BASE}/api/notifications`, {
// //         method: "PATCH",
// //         headers: {
// //           "Content-Type": "application/json",
// //           ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
// //         },
// //         body: JSON.stringify({ clerkUserId, notificationId }),
// //       });
// //       setNotifications(prev =>
// //         prev.map(n => n.__id === notificationId ? { ...n, read: true } : n)
// //       );
// //       setUnreadCount(prev => Math.max(0, prev - 1));
// //     } catch (e) {}
// //   }, [clerkUserId, API_BASE, EVENT_API_KEY]);

// //   // Poll every 30 seconds for new notifications
// //   useEffect(() => {
// //     fetchNotifications();
// //     const interval = setInterval(fetchNotifications, 30000);
// //     return () => clearInterval(interval);
// //   }, [fetchNotifications]);

// //   return { notifications, unreadCount, fetchNotifications, markAsRead };
// // }
// // lib/useNotifications.ts
// import { useState, useEffect, useCallback } from "react";
// import Constants from "expo-constants";

// export type AppNotification = {
//   _id: string; // ✅ FIX: __ nahi, sirf _
//   type: "event_approved" | "event_rejected" | "service_approved" | "service_rejected";
//   eventId?: string;
//   serviceId?: string;
//   eventTitle: string;
//   message: string;
//   moderatorNote?: string;
//   read: boolean;
//   createdAt: string;
// };

// export function useNotifications(clerkUserId: string | null | undefined) {
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [unreadCount, setUnreadCount] = useState(0);

//   const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string;
//   const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string;

//   const fetchNotifications = useCallback(async () => {
//     if (!clerkUserId || !API_BASE) return;
//     try {
//       const res = await fetch(
//         `${API_BASE}/api/notifications?clerkUserId=${encodeURIComponent(clerkUserId)}`,
//         { headers: { ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) } }
//       );
//       const json = await res.json();
//       if (json.ok) {
//         setNotifications(json.notifications || []);
//         setUnreadCount(
//           (json.notifications || []).filter((n: AppNotification) => !n.read).length
//         );
//       }
//     } catch (e) {
//       console.log("Notification fetch error:", e);
//     }
//   }, [clerkUserId, API_BASE, EVENT_API_KEY]);

//   const markAsRead = useCallback(async (notificationId: string) => {
//     if (!clerkUserId || !API_BASE) return;
//     try {
//       await fetch(`${API_BASE}/api/notifications`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
//         },
//         body: JSON.stringify({ clerkUserId, notificationId }),
//       });
//       setNotifications(prev =>
//         prev.map(n => n._id === notificationId ? { ...n, read: true } : n) // ✅ FIX
//       );
//       setUnreadCount(prev => Math.max(0, prev - 1));
//     } catch (e) {}
//   }, [clerkUserId, API_BASE, EVENT_API_KEY]);

//   useEffect(() => {
//     fetchNotifications();
//     const interval = setInterval(fetchNotifications, 30000);
//     return () => clearInterval(interval);
//   }, [fetchNotifications]);

//   return { notifications, unreadCount, fetchNotifications, markAsRead };
// }
// lib/useNotifications.ts
import { useState, useEffect, useCallback } from "react";
import Constants from "expo-constants";

export type AppNotification = {
  _id: string;
  type: "event_approved" | "event_rejected" | "service_approved" | "service_rejected";
  eventId?: string;
  serviceId?: string;
  eventTitle: string;
  message: string;
  moderatorNote?: string;
  read: boolean;
  createdAt: string;
};

export function useNotifications(clerkUserId: string | null | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string;

  const fetchNotifications = useCallback(async () => {
    if (!clerkUserId || !API_BASE) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/notifications?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        { headers: { ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}) } }
      );
      const json = await res.json();
      if (json.ok) {
        setNotifications(json.notifications || []);
        setUnreadCount(
          (json.notifications || []).filter((n: AppNotification) => !n.read).length
        );
      }
    } catch (e) {
      console.log("Notification fetch error:", e);
    }
  }, [clerkUserId, API_BASE, EVENT_API_KEY]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!clerkUserId || !API_BASE) return;
    try {
      await fetch(`${API_BASE}/api/notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId, notificationId }),
      });
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  }, [clerkUserId, API_BASE, EVENT_API_KEY]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, unreadCount, fetchNotifications, markAsRead };
}