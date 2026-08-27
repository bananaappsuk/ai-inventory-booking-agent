// Minimum recommendation confidence required for an auto-approval to fire.
// Kept as a plain constant (not a DB-tunable rule param) since it governs the AI's own
// judgement call, not a deterministic gate — tune here and redeploy if it needs to change.
export const CONFIDENCE_THRESHOLD = 0.8;

export const DECIDE_PROMPT_VERSION = "v1";
