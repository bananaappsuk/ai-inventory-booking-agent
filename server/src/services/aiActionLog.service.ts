import { AiActionLog, type AiAction } from "../models/AiActionLog.js";
import type { RuleResult } from "./approvalRules.service.js";

// Append-only by construction: this is the only write path for AiActionLog, and there is
// no update/delete function anywhere in the codebase.
export async function createAiActionLog(params: {
  bookingId: string;
  action: AiAction;
  ruleResults: RuleResult[];
  confidence?: number;
  reason: string;
  historySignal?: string;
  model: string;
  latencyMs?: number;
  promptVersion?: string;
}) {
  return AiActionLog.create(params);
}

export async function listAiActionLogs(filters: {
  bookingId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const query: Record<string, unknown> = {};
  if (filters.bookingId) query.bookingId = filters.bookingId;
  if (filters.action) query.action = filters.action;
  if (filters.from || filters.to) {
    query.createdAt = {
      ...(filters.from ? { $gte: new Date(filters.from) } : {}),
      ...(filters.to ? { $lte: new Date(filters.to) } : {})
    };
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));

  const [items, total] = await Promise.all([
    AiActionLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("bookingId", "eventTitle"),
    AiActionLog.countDocuments(query)
  ]);

  return { items, total, page, pageSize };
}
