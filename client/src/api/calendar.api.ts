import { api } from "./client";
import type { Booking, CalendarBooking, Session } from "../types";

export const calendarApi = {
  list: (start: string, end: string) =>
    api.get<CalendarBooking[]>(
      `/calendar/bookings?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    ),
  move: (id: string, eventDate: string, session: Session) =>
    api.patch<Booking>(`/calendar/bookings/${id}/move`, { eventDate, session })
};
