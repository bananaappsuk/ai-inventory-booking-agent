import { api } from "./client";
import type { Role, User } from "../types";

export const adminUsersApi = {
  listAll: () => api.get<User[]>("/admin/users"),
  listPending: () => api.get<User[]>("/admin/users/pending"),
  create: (data: { name: string; email: string; password: string; role?: Role; phone?: string }) =>
    api.post<User>("/admin/users", data),
  approve: (id: string) => api.patch<User>(`/admin/users/${id}/approve`),
  reject: (id: string) => api.patch<User>(`/admin/users/${id}/reject`),
  activate: (id: string) => api.patch<User>(`/admin/users/${id}/activate`),
  deactivate: (id: string) => api.patch<User>(`/admin/users/${id}/deactivate`)
};
