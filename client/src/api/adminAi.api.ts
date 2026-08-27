import { api } from "./client";
import type { AiAction, AiActionLog, ApprovalRule, RuleType } from "../types";

export const adminAiApi = {
  listRules: () => api.get<ApprovalRule[]>("/admin/rules"),
  upsertRule: (ruleType: RuleType, body: { enabled?: boolean; params?: Record<string, number>; naturalLanguageText?: string }) =>
    api.patch<ApprovalRule>(`/admin/rules/${ruleType}`, body),
  getPrompt: () => api.get<{ prompt: string }>("/admin/rules-prompt"),
  getFlag: () => api.get<{ enabled: boolean }>("/admin/settings/auto-approval"),
  setFlag: (enabled: boolean) => api.patch<{ enabled: boolean }>("/admin/settings/auto-approval", { enabled }),
  listLogs: (filters: { bookingId?: string; action?: AiAction; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (filters.bookingId) qs.set("bookingId", filters.bookingId);
    if (filters.action) qs.set("action", filters.action);
    if (filters.page) qs.set("page", String(filters.page));
    if (filters.pageSize) qs.set("pageSize", String(filters.pageSize));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<{ items: AiActionLog[]; total: number; page: number; pageSize: number }>(
      `/admin/ai-logs${suffix}`
    );
  }
};
