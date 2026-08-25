import { api } from "./client";
import type { User } from "../types";

export const adminUsersApi = {
  listPending: () => api.get<User[]>("/admin/users/pending"),
  approve: (id: string) => api.patch<User>(`/admin/users/${id}/approve`),
  reject: (id: string) => api.patch<User>(`/admin/users/${id}/reject`)
};
