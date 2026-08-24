import Anthropic from "@anthropic-ai/sdk";
import type { BetaContentBlock, BetaMessageParam, BetaTextBlock } from "@anthropic-ai/sdk/resources/beta";
import { anthropic } from "../config/anthropic.js";
import { buildToolsForRole } from "./toolRegistry.js";
import type { ToolContext } from "./toolContext.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { ApiError } from "../utils/apiError.js";

const SYSTEM_PROMPT_TEMPLATE = (role: string, today: string) => `
You are the booking assistant for an event inventory rental system (tables, chairs, marquees, etc.).
The current user is a "${role}". Today's date is ${today}.

Rules:
- Use tools to check facts (availability, booking status, notifications) rather than assuming.
- Every mutating tool (create_booking, cancel_booking, submit_drop_approval, etc.) must be called
  twice: first WITHOUT confirm (or confirm:false) to get a preview/summary, which you relay to the
  user in plain language; only call it again WITH confirm:true after the user explicitly agrees.
- Never claim an action succeeded unless a tool result confirms it.
- Be concise and helpful. If a request is ambiguous (e.g. an item name doesn't match), ask a clarifying question.
`;

function extractText(content: BetaContentBlock[]): string {
  return content
    .filter((block): block is BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function findPendingConfirmationSummary(messages: BetaMessageParam[]): string | undefined {
  for (const message of messages.slice().reverse()) {
    if (message.role !== "user" || typeof message.content === "string") continue;
    for (const block of message.content) {
      if (block.type !== "tool_result") continue;
      const content = block.content;
      const text = typeof content === "string" ? content : JSON.stringify(content);
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.requiresConfirmation) return parsed.summary as string;
      } catch {
        // not JSON, ignore
      }
    }
  }
  return undefined;
}

export async function runChatTurn(params: {
  sessionId: string;
  ctx: ToolContext;
  userText: string;
}): Promise<{ text: string; pendingConfirmationSummary?: string }> {
  if (!anthropic) {
    throw ApiError.badRequest("Chat assistant is not configured (missing ANTHROPIC_API_KEY)");
  }

  const priorMessages = await ChatMessage.find({ session: params.sessionId }).sort({ createdAt: 1 });
  const history: BetaMessageParam[] = priorMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content as BetaMessageParam["content"]
  }));

  const newUserMessage: BetaMessageParam = {
    role: "user",
    content: [{ type: "text", text: params.userText }]
  };
  const messages: BetaMessageParam[] = [...history, newUserMessage];

  const tools = buildToolsForRole(params.ctx);
  const today = new Date().toISOString().slice(0, 10);

  const runner = anthropic.beta.messages.toolRunner({
    model: "claude-opus-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT_TEMPLATE(params.ctx.role, today),
    tools,
    messages
  });

  let finalMessage;
  try {
    finalMessage = await runner;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      throw new ApiError(502, `Chat assistant request failed: ${err.message}`);
    }
    throw err;
  }
  const finalMessages = runner.params.messages;

  const newlyGenerated = finalMessages.slice(priorMessages.length);
  await ChatMessage.insertMany(
    newlyGenerated.map((m) => ({ session: params.sessionId, role: m.role, content: m.content }))
  );

  return {
    text: extractText(finalMessage.content),
    pendingConfirmationSummary: findPendingConfirmationSummary(newlyGenerated)
  };
}
