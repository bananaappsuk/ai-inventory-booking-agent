import { ChatSession } from "../models/ChatSession.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { ApiError } from "../utils/apiError.js";

export async function createSession(userId: string, title?: string) {
  return ChatSession.create({ user: userId, title: title ?? "New chat" });
}

export async function listSessions(userId: string) {
  return ChatSession.find({ user: userId }).sort({ updatedAt: -1 });
}

export async function getSessionMessages(userId: string, sessionId: string) {
  const session = await ChatSession.findOne({ _id: sessionId, user: userId });
  if (!session) throw ApiError.notFound("Chat session not found");
  return ChatMessage.find({ session: sessionId }).sort({ createdAt: 1 });
}

export async function assertOwnedSession(userId: string, sessionId: string) {
  const session = await ChatSession.findOne({ _id: sessionId, user: userId });
  if (!session) throw ApiError.notFound("Chat session not found");
  return session;
}
