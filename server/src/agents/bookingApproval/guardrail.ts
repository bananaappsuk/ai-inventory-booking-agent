import type { Decision } from "./schema.js";

// Only two members exist — there is no representable "auto_reject" value, so the
// never-auto-reject invariant is enforced by the type system, not just by logic.
export type GuardrailAction = "auto_approve" | "escalate";

export function applyGuardrail(params: {
  flagEnabled: boolean;
  gatesPassed: boolean;
  decision: Decision | null;
  confidenceThreshold: number;
}): GuardrailAction {
  if (!params.flagEnabled) return "escalate";
  if (!params.gatesPassed) return "escalate";
  if (!params.decision) return "escalate";
  if (params.decision.recommendation !== "approve") return "escalate";
  if (params.decision.confidence < params.confidenceThreshold) return "escalate";
  return "auto_approve";
}
