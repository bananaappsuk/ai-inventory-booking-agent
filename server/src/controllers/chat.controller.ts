import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as chatService from "../services/chat.service.js";
import { runChatTurn } from "../chat/agent.js";

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const session = await chatService.createSession(req.user.id, req.body?.title);
  res.status(201).json(session);
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const sessions = await chatService.listSessions(req.user.id);
  res.json(sessions);
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const messages = await chatService.getSessionMessages(req.user.id, req.params.id);
  res.json(messages);
});

export const postMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await chatService.assertOwnedSession(req.user.id, req.params.id);

  const { text } = req.body as { text: string };
  const result = await runChatTurn({
    sessionId: req.params.id,
    ctx: { id: req.user.id, role: req.user.role },
    userText: text
  });

  res.status(201).json(result);
});
