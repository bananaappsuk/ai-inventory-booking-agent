import { useEffect, useRef, useState } from "react";
import { chatApi, type ChatMessage as ChatMessageT } from "../../api/chat.api";
import { ChatMessageBubble } from "./ChatMessage";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageT[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingConfirmation]);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const session = await chatApi.createSession("Booking assistant");
    setSessionId(session._id);
    return session._id;
  }

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    setPendingConfirmation(null);
    try {
      const sid = await ensureSession();
      setMessages((prev) => [
        ...prev,
        { _id: `local-${Date.now()}`, role: "user", content: [{ type: "text", text }], createdAt: new Date().toISOString() }
      ]);
      setInput("");
      const result = await chatApi.postMessage(sid, text);
      setMessages((prev) => [
        ...prev,
        {
          _id: `local-reply-${Date.now()}`,
          role: "assistant",
          content: [{ type: "text", text: result.text }],
          createdAt: new Date().toISOString()
        }
      ]);
      if (result.pendingConfirmationSummary) setPendingConfirmation(result.pendingConfirmationSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="chat-fab" onClick={() => setOpen(true)}>
        <span className="material-symbols-outlined">smart_toy</span>
        Ask assistant
      </button>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-widget-header">
        <strong>Booking assistant</strong>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
          &times;
        </button>
      </div>
      <div className="chat-widget-messages">
        {messages.length === 0 && (
          <p className="hint">
            Ask me to check availability, create a booking, or (for admins) list approvals awaiting review.
          </p>
        )}
        {messages.map((m) => (
          <ChatMessageBubble key={m._id} message={m} />
        ))}
        {pendingConfirmation && (
          <div className="chat-confirmation">
            <p>{pendingConfirmation}</p>
            <div className="chat-confirmation-actions">
              <button type="button" onClick={() => send("Yes, please proceed with that.")} disabled={sending}>
                Confirm
              </button>
              <button type="button" onClick={() => send("No, cancel that.")} disabled={sending}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
        <div ref={bottomRef} />
      </div>
      <form
        className="chat-widget-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
