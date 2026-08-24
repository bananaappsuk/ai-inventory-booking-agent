import { api } from "./client";
import type { ChatSession } from "../types";

export interface ChatMessage {
  _id: string;
  role: "user" | "assistant";
  content: unknown;
  createdAt: string;
}

export const chatApi = {
  createSession: (title?: string) => api.post<ChatSession>("/chat/sessions", { title }),
  listSessions: () => api.get<ChatSession[]>("/chat/sessions"),
  getMessages: (sessionId: string) => api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`),
  postMessage: (sessionId: string, text: string) =>
    api.post<{ text: string; pendingConfirmationSummary?: string }>(
      `/chat/sessions/${sessionId}/messages`,
      { text }
    )
};
