import { api } from "./client";
import type { User } from "../types";

export interface AuthResult {
  token: string;
  user: User;
}

export const authApi = {
  signup: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post<AuthResult>("/auth/signup", data),
  login: (data: { email: string; password: string }) => api.post<AuthResult>("/auth/login", data),
  me: () => api.get<User>("/auth/me")
};
