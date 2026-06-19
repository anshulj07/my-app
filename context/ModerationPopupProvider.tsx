
// context/ModerationPopupProvider.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import EventNotificationPopup from "../components/NotificationPopup/EventNotificationPopup";
import type { AppNotification } from "../lib/useNotifications";

type ContextValue = {
  showPopup: (notif: AppNotification) => void;
};

const ModerationPopupContext = createContext<ContextValue | null>(null);

export function useModerationPopup() {
  const ctx = useContext(ModerationPopupContext);
  if (!ctx) throw new Error("useModerationPopup must be used within ModerationPopupProvider");
  return ctx;
}

export function ModerationPopupProvider({
  children,
  clerkUserId,
}: {
  children: React.ReactNode;
  clerkUserId: string | null | undefined;
}) {
  const [currentPopup, setCurrentPopup] = useState<AppNotification | null>(null);

  const shownIds = useRef<Set<string>>(new Set());
  const isShowingRef = useRef(false);
  const queueRef = useRef<AppNotification[]>([]);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const showNext = useCallback(() => {
    if (isShowingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    isShowingRef.current = true;
    setCurrentPopup(next);
    Haptics.notificationAsync(
      next.type === "event_approved" || next.type === "service_approved"
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    ).catch(() => {});
  }, []);

  const enqueue = useCallback(
    (notif: AppNotification) => {
      if (shownIds.current.has(notif._id)) return;
      shownIds.current.add(notif._id);
      queueRef.current.push(notif);
      showNext();
    },
    [showNext]
  );

  const poll = useCallback(async () => {
    if (!clerkUserId || !API_BASE) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/notifications?clerkUserId=${encodeURIComponent(clerkUserId)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
          },
        }
      );

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) return;

      const json = await res.json();

      if (json.ok && Array.isArray(json.notifications)) {
        const toShow = json.notifications.filter(
          (n: AppNotification) =>
            !n.read &&
            !shownIds.current.has(n._id) &&
            (
              n.type === "event_approved" ||
              n.type === "event_rejected" ||
              n.type === "service_approved" ||
              n.type === "service_rejected"
            )
        );

        toShow.sort(
          (a: AppNotification, b: AppNotification) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        for (const notif of toShow) {
          enqueue(notif);
        }
      }
    } catch (_) {}
  }, [clerkUserId, API_BASE, EVENT_API_KEY, enqueue]);

  useEffect(() => {
    if (!clerkUserId) return;
    poll();
    const timer = setInterval(poll, 5_000);
    return () => clearInterval(timer);
  }, [poll, clerkUserId]);

  const handleClose = useCallback(async () => {
    const notif = currentPopup;
    setCurrentPopup(null);
    isShowingRef.current = false;

    if (notif && API_BASE && clerkUserId) {
      try {
        await fetch(`${API_BASE}/api/notifications`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
          },
          body: JSON.stringify({
            clerkUserId,
            notificationId: notif._id,
          }),
        });
      } catch (_) {}
    }

    setTimeout(showNext, 400);
  }, [currentPopup, API_BASE, clerkUserId, EVENT_API_KEY, showNext]);

  const showPopup = useCallback(
    (notif: AppNotification) => {
      enqueue(notif);
    },
    [enqueue]
  );

  return (
    <ModerationPopupContext.Provider value={{ showPopup }}>
      {children}
      <EventNotificationPopup
        notification={currentPopup}
        onClose={handleClose}
        onMarkRead={(id) => handleClose()}
      />
    </ModerationPopupContext.Provider>
  );
}