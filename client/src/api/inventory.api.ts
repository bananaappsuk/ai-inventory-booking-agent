import { api } from "./client";
import type { InventoryItem } from "../types";

export const inventoryApi = {
  list: (includeHidden = false) =>
    api.get<InventoryItem[]>(`/inventory${includeHidden ? "?includeHidden=true" : ""}`),
  get: (id: string) => api.get<InventoryItem>(`/inventory/${id}`),
  create: (data: { name: string; category?: string; description?: string; totalQuantity: number }) =>
    api.post<InventoryItem>("/inventory", data),
  update: (id: string, data: Partial<{ name: string; category: string; description: string; totalQuantity: number }>) =>
    api.patch<InventoryItem>(`/inventory/${id}`, data),
  hide: (id: string) => api.patch<InventoryItem>(`/inventory/${id}/hide`),
  unhide: (id: string) => api.patch<InventoryItem>(`/inventory/${id}/unhide`),
  remove: (id: string) => api.delete<void>(`/inventory/${id}`),
  addPhotos: (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f));
    return api.postForm<InventoryItem>(`/inventory/${id}/photos`, formData);
  },
  removePhoto: (id: string, publicId: string) =>
    api.delete<InventoryItem>(`/inventory/${id}/photos/${encodeURIComponent(publicId)}`),
  availability: (id: string, date: string, session: "AM" | "PM") =>
    api.get<{ totalQuantity: number; booked: number; available: number }>(
      `/inventory/${id}/availability?date=${date}&session=${session}`
    )
};
