import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { anthropic } from "../../config/anthropic.js";
import { DecisionSchema, type Decision } from "./schema.js";
import { DECIDE_SYSTEM_PROMPT } from "./prompts.js";

export interface DecideInput {
  booking: {
    eventTitle: string;
    eventDate: string;
    session: string;
    items: { name: string; quantity: number }[];
  };
  userHistory: {
    totalBookings: number;
    fulfilled: number;
    rejected: number;
    cancelled: number;
    recent: { eventTitle: string; eventDate: string; status: string }[];
  };
}

export interface DecideResult {
  decision: Decision | null;
  unavailableReason?: string;
  model: string;
  latencyMs: number;
}

export async function decide(input: DecideInput): Promise<DecideResult> {
  const start = Date.now();

  if (!anthropic) {
    return {
      decision: null,
      unavailableReason: "AI unavailable (ANTHROPIC_API_KEY not configured); escalated for manual review.",
      model: "stub",
      latencyMs: Date.now() - start
    };
  }

  try {
    const message = await anthropic.beta.messages.parse({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: DECIDE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(input) }],
      output_config: { format: betaZodOutputFormat(DecisionSchema) }
    });
    return { decision: message.parsed_output ?? null, model: "claude-opus-5", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      decision: null,
      unavailableReason: `AI decision call failed: ${err instanceof Error ? err.message : String(err)}`,
      model: "error",
      latencyMs: Date.now() - start
    };
  }
}
