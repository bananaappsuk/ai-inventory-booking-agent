import { api } from "./client";
import type { Booking, Condition, Photo } from "../types";

export interface DropApprovalItemInput {
  inventoryItem: string;
  condition: Condition;
  note?: string;
  photos?: Photo[];
}

export const dropApprovalApi = {
  listPending: () => api.get<Booking[]>("/admin/check-inventory"),
  get: (bookingId: string) => api.get<Booking["dropApproval"]>(`/bookings/${bookingId}/drop-approval`),
  submit: (
    bookingId: string,
    data: {
      overallCondition: Condition;
      overallNote?: string;
      adminPhotos?: Photo[];
      items?: DropApprovalItemInput[];
    }
  ) => api.post<Booking>(`/bookings/${bookingId}/drop-approval`, data)
};
