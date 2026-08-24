import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as dropApprovalService from "../services/dropApproval.service.js";

export const listPending = asyncHandler(async (_req: Request, res: Response) => {
  const bookings = await dropApprovalService.listPendingDropApprovals();
  res.json(bookings);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const dropApproval = await dropApprovalService.getDropApproval(req.params.id);
  res.json(dropApproval);
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const booking = await dropApprovalService.submitDropApproval(req.params.id, req.user.id, req.body);
  res.status(201).json(booking);
});
