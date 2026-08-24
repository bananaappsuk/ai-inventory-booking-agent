import type { ChatMessage as ChatMessageT } from "../../api/chat.api";

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
}

function extractDisplayText(content: unknown): { text: string; toolCalls: string[] } {
  if (typeof content === "string") return { text: content, toolCalls: [] };
  if (!Array.isArray(content)) return { text: "", toolCalls: [] };

  const blocks = content as ContentBlock[];
  const text = blocks
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n");
  const toolCalls = blocks.filter((b) => b.type === "tool_use" && b.name).map((b) => b.name as string);

  return { text, toolCalls };
}

export function ChatMessageBubble({ message }: { message: ChatMessageT }) {
  const { text, toolCalls } = extractDisplayText(message.content);
  if (!text && toolCalls.length === 0) return null;

  return (
    <div className={`chat-bubble chat-bubble-${message.role}`}>
      {toolCalls.length > 0 && (
        <div className="chat-tool-indicator">Using: {toolCalls.join(", ")}</div>
      )}
      {text && <p>{text}</p>}
    </div>
  );
}
