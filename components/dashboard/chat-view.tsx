import { FormEvent, RefObject, useState } from "react";
import { ArrowLeft, Bot, SendHorizonal, UserRoundCog } from "lucide-react";
import type { Conversation, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";

interface ChatViewProps {
  conversation: Conversation | null;
  messages: Message[];
  loadingMessages: boolean;
  isSending: boolean;
  onTakeOver: () => Promise<void>;
  onReturnToBot: () => Promise<void>;
  onSendMessage: (body: string) => Promise<void>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  freshMessageIds: Set<string>;
  onBackToList: () => void;
}

export function ChatView({
  conversation,
  messages,
  loadingMessages,
  isSending,
  onTakeOver,
  onReturnToBot,
  onSendMessage,
  scrollContainerRef,
  freshMessageIds,
  onBackToList,
}: ChatViewProps) {
  const [draft, setDraft] = useState("");

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-6 text-center">
        <h2 className="text-lg font-semibold text-[color:var(--ink)]">Pick a conversation</h2>
        <p className="mt-2 max-w-sm text-sm text-[color:var(--ink-soft)]">
          Select a patient thread on the left to read messages in real time and take over whenever needed.
        </p>
      </div>
    );
  }

  const title = conversation.patient_name?.trim() || conversation.patient_wa_number;
  const isHuman = conversation.status === "human";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();

    if (!body || !isHuman || isSending) {
      return;
    }

    setDraft("");
    await onSendMessage(body);
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--line)] px-4 py-3 md:px-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--line)] text-[color:var(--ink-soft)] transition hover:border-[color:var(--line-strong)] hover:text-[color:var(--ink)] md:hidden"
            aria-label="Back to conversation list"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--ink)] md:text-base">{title}</h2>
            <p className="text-xs text-[color:var(--ink-soft)]">{conversation.patient_wa_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHuman ? (
            <button
              type="button"
              onClick={onReturnToBot}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[color:var(--ink)] transition hover:border-[color:var(--line-strong)]"
            >
              <Bot size={14} />
              Return to Bot
            </button>
          ) : (
            <button
              type="button"
              onClick={onTakeOver}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--status-human-line)] bg-[color:var(--status-human-bg)] px-3 py-1.5 text-xs font-medium text-[color:var(--status-human-text)] transition hover:-translate-y-0.5"
            >
              <UserRoundCog size={14} />
              Take Over
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-5"
      >
        {loadingMessages ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`h-12 rounded-2xl bg-[color:var(--surface-muted)] skeleton-shimmer ${
                  index % 2 === 0 ? "w-2/3" : "ml-auto w-1/2"
                }`}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-white/65 p-5 text-center text-sm text-[color:var(--ink-soft)]">
            No messages yet in this conversation.
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isFresh={freshMessageIds.has(message.id)}
            />
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[color:var(--line)] p-3 md:p-4">
        <div className="flex items-end gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-3 py-2 transition focus-within:border-[color:var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={1}
            disabled={!isHuman || isSending}
            placeholder={
              isHuman
                ? "Type your reply to the patient..."
                : "Switch to Human mode to send a reply"
            }
            className="max-h-40 min-h-10 flex-1 resize-y bg-transparent pt-1 text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--ink-soft)]"
          />
          <button
            type="submit"
            disabled={!isHuman || isSending || !draft.trim()}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full transition",
              !isHuman || isSending || !draft.trim()
                ? "cursor-not-allowed bg-[color:var(--surface-muted)] text-[color:var(--ink-soft)]"
                : "bg-[color:var(--accent)] text-white hover:scale-[1.03] active:scale-[0.98]",
            )}
            aria-label="Send message"
          >
            <SendHorizonal size={16} className={isSending ? "animate-pulse" : undefined} />
          </button>
        </div>
        <p className="mt-2 text-xs text-[color:var(--ink-soft)]">
          {isHuman
            ? "Human mode active. Staff replies are sent to WhatsApp in real time."
            : "Bot mode active. The Flask assistant auto-replies until you take over."}
        </p>
      </form>
    </div>
  );
}
