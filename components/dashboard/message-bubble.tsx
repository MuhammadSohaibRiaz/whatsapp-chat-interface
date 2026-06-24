import { format } from "date-fns";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isFresh: boolean;
}

export function MessageBubble({ message, isFresh }: MessageBubbleProps) {
  const isPatient = message.sender === "patient";
  const isBot = message.sender === "bot";

  return (
    <div
      className={cn("flex w-full", isPatient ? "justify-start" : "justify-end")}
      data-message-id={message.id}
    >
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm transition md:max-w-[72%]",
          isPatient
            ? "rounded-tl-md border border-[color:var(--line)] bg-white text-[color:var(--ink)]"
            : "rounded-tr-md text-[color:var(--ink)]",
          isBot ? "bg-[color:var(--bot-bubble)]" : "bg-[color:var(--staff-bubble)]",
          isFresh ? "new-message" : undefined,
        )}
      >
        <div className="mb-1 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              isPatient
                ? "bg-[color:var(--surface)] text-[color:var(--ink-soft)]"
                : isBot
                  ? "bg-[color:var(--status-bot-bg)] text-[color:var(--status-bot-text)]"
                  : "bg-[color:var(--status-human-bg)] text-[color:var(--status-human-text)]",
            )}
          >
            {message.sender === "patient"
              ? "Patient"
              : message.sender === "bot"
                ? "Bot"
                : "Staff"}
          </span>
          <time className="text-[11px] text-[color:var(--ink-soft)]">
            {format(new Date(message.created_at), "HH:mm")}
          </time>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
      </div>
    </div>
  );
}
