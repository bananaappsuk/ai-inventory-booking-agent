import { z } from "zod/v4";

// Deliberately binary: this schema is only ever requested when all 4 deterministic gates
// have already passed, i.e. exactly the case where the rules leave discretion to a
// history-based judgement call. There is no "escalate" option here — escalation is a
// guardrail.ts decision made in code from the presence/absence of a decision, never
// something the model itself chooses.
export const DecisionSchema = z.object({
  recommendation: z.enum(["approve", "reject"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  historySignal: z.string().min(1)
});

export type Decision = z.infer<typeof DecisionSchema>;
