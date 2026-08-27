import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listAiActionLogs } from "../services/aiActionLog.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, action, from, to, page, pageSize } = req.query as Record<string, string | undefined>;
  const result = await listAiActionLogs({
    bookingId,
    action,
    from,
    to,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined
  });
  res.json(result);
});
