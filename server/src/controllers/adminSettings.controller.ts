import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getFlag, setFlag } from "../services/featureFlag.service.js";

const AUTO_APPROVAL_FLAG_KEY = "booking_auto_approval";

export const getAutoApprovalFlag = asyncHandler(async (_req: Request, res: Response) => {
  const flag = await getFlag(AUTO_APPROVAL_FLAG_KEY);
  res.json(flag);
});

export const setAutoApprovalFlag = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { enabled } = req.body as { enabled: boolean };
  const flag = await setFlag(AUTO_APPROVAL_FLAG_KEY, enabled, req.user.id);
  res.json(flag);
});
