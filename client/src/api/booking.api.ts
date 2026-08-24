import { api } from "./client";
import type { Booking, BookingStatus, Session } from "../types";

export const bookingApi = {
  create: (data: {
    eventTitle: string;
    eventDate: string;
    session: Session;
    items: { inventoryItem: string; quantity: number }[];
    bookedByUserId?: string;
  }) => api.post<Booking>("/bookings", data),
  list: (params: { status?: BookingStatus; mine?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.mine) qs.set("mine", "true");
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<Booking[]>(`/bookings${suffix}`);
  },
  get: (id: string) => api.get<Booking>(`/bookings/${id}`),
  update: (id: string, data: Partial<{ eventTitle: string; eventDate: string; session: Session }>) =>
    api.patch<Booking>(`/bookings/${id}`, data),
  approve: (id: string, note?: string) => api.patch<Booking>(`/bookings/${id}/approve`, { note }),
  reject: (id: string, note: string) => api.patch<Booking>(`/bookings/${id}/reject`, { note }),
  reschedule: (id: string, eventDate: string, session: Session) =>
    api.patch<Booking>(`/bookings/${id}/reschedule`, { eventDate, session }),
  cancel: (id: string) => api.delete<void>(`/bookings/${id}`)
};
