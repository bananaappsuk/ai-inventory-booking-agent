import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApprovalRule, RULE_TYPES, type RuleType } from "../models/ApprovalRule.js";
import { getOrCreateDefaultRules } from "../services/approvalRules.service.js";
import { DECIDE_SYSTEM_PROMPT } from "../agents/bookingApproval/prompts.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const rules = await getOrCreateDefaultRules(req.user.id);
  res.json(rules);
});

export const upsert = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const ruleType = req.params.ruleType as RuleType;
  if (!RULE_TYPES.includes(ruleType)) throw ApiError.badRequest("Unknown rule type");

  const { enabled, params, naturalLanguageText } = req.body as {
    enabled?: boolean;
    params?: Record<string, number>;
    naturalLanguageText?: string;
  };

  const rule = await ApprovalRule.findOneAndUpdate(
    { ruleType },
    {
      $set: {
        ...(enabled !== undefined ? { enabled } : {}),
        ...(params !== undefined ? { params } : {}),
        ...(naturalLanguageText !== undefined ? { naturalLanguageText } : {})
      },
      $inc: { version: 1 },
      $setOnInsert: { createdBy: req.user.id }
    },
    { upsert: true, new: true }
  );

  res.json(rule);
});

export const getPrompt = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ prompt: DECIDE_SYSTEM_PROMPT });
});
