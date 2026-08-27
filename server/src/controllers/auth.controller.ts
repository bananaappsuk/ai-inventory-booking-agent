import type { Request, Response } from "express";
import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.getMe(req.user.id);
  res.json(user);
});

export const adminBootstrap = asyncHandler(async (req: Request, res: Response) => {
  const suppliedSecret = req.header("x-admin-invite-secret") ?? undefined;
  const user = await authService.adminBootstrap({
    ...req.body,
    callerRole: req.user?.role,
    suppliedSecret,
    expectedSecret: env.adminInviteSecret
  });
  res.status(201).json(user);
});

export const listPendingUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await authService.listPendingUsers();
  res.json(users);
});

export const approveUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.approveUser(req.params.id);
  res.json(user);
});

export const rejectUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.rejectUser(req.params.id);
  res.json(user);
});

export const listAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await authService.listAllUsers();
  res.json(users);
});

export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.setUserActive(req.params.id, true, req.user.id);
  res.json(user);
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.setUserActive(req.params.id, false, req.user.id);
  res.json(user);
});

export const adminCreateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.adminCreateUser(req.body);
  res.status(201).json(user);
});
