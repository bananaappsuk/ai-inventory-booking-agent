import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as dropService from "../services/drop.service.js";

export const getDrop = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const drop = await dropService.getDrop(req.params.id, req.user);
  res.json(drop);
});

export const submitDrop = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const booking = await dropService.submitDrop(req.params.id, req.user, req.body);
  res.status(201).json(booking);
});
