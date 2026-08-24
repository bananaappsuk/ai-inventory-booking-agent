import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as notificationService from "../services/notification.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const unreadOnly = req.query.unreadOnly === "true";
  const notifications = await notificationService.listNotifications(req.user.id, unreadOnly);
  res.json(notifications);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await notificationService.markRead(req.user.id, req.params.id);
  res.status(204).send();
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await notificationService.markAllRead(req.user.id);
  res.status(204).send();
});
