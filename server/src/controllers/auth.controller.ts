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
