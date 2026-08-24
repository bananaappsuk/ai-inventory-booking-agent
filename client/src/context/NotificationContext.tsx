import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { notificationApi } from "../api/notification.api";
import type { Notification } from "../types";
import { useAuth } from "./AuthContext";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const POLL_INTERVAL_MS = 30000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function refresh() {
    if (!user) return;
    try {
      const list = await notificationApi.list();
      setNotifications(list);
    } catch {
      // best-effort; polling will retry
    }
  }

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function markRead(id: string) {
    await notificationApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  }

  async function markAllRead() {
    await notificationApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
