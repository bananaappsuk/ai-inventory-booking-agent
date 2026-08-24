import { api } from "./client";
import type { Notification } from "../types";

export const notificationApi = {
  list: (unreadOnly = false) =>
    api.get<Notification[]>(`/notifications${unreadOnly ? "?unreadOnly=true" : ""}`),
  markRead: (id: string) => api.patch<void>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<void>("/notifications/read-all")
};
