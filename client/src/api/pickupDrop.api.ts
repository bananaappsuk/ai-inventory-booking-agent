import { api } from "./client";
import type { Booking, Photo } from "../types";

export interface PickupItemInput {
  inventoryItem: string;
  pickedUp: boolean;
  quantityPickedUp: number;
  note?: string;
  photos?: Photo[];
}

export interface DropItemInput {
  inventoryItem: string;
  returned: boolean;
  quantityReturned: number;
  note?: string;
  photos?: Photo[];
}

export const pickupApi = {
  get: (bookingId: string) => api.get<Booking["pickup"]>(`/bookings/${bookingId}/pickup`),
  submit: (bookingId: string, data: { overallNote?: string; items: PickupItemInput[] }) =>
    api.post<Booking>(`/bookings/${bookingId}/pickup`, data)
};

export const dropApi = {
  get: (bookingId: string) => api.get<Booking["drop"]>(`/bookings/${bookingId}/drop`),
  submit: (bookingId: string, data: { overallNote?: string; items: DropItemInput[] }) =>
    api.post<Booking>(`/bookings/${bookingId}/drop`, data)
};
