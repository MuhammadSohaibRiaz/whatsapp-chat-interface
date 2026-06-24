import { formatDistanceToNowStrict } from "date-fns";
import { MessageCircleMore } from "lucide-react";
import type { Conversation, ConversationPreview } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  previews: Record<string, ConversationPreview | undefined>;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isNeedsAttention: (conversation: Conversation) => boolean;
}

function statusBadge(conversation: Conversation, needsAttention: boolean) {
  if (conversation.status === "human") {
    return {
      label: "Human",
      className:
        "bg-[color:var(--status-human-bg)] text-[color:var(--status-human-text)]",
    };
  }

  if (needsAttention) {
    return {
      label: "Needs attention",
      className:
        "bg-[color:var(--status-attention-bg)] text-[color:var(--status-attention-text)]",
    };
  }

  return {
    label: "Bot",
    className: "bg-[color:var(--status-bot-bg)] text-[color:var(--status-bot-text)]",
  };
}

export function ConversationList({
  conversations,
  previews,
  selectedConversationId,
  onSelectConversation,
  isNeedsAttention,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-6 text-center">
        <MessageCircleMore className="mx-auto mb-3 text-[color:var(--ink-soft)]" />
        <h3 className="text-sm font-semibold text-[color:var(--ink)]">No conversations yet</h3>
        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
          As soon as a patient messages your clinic, their thread appears here live.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const preview = previews[conversation.id];
        const needsAttention = isNeedsAttention(conversation);
        const badge = statusBadge(conversation, needsAttention);
        const patientLabel =
          conversation.patient_name?.trim() || conversation.patient_wa_number;

        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelectConversation(conversation.id)}
            className={cn(
              "w-full rounded-2xl border px-3.5 py-3 text-left transition",
              selectedConversationId === conversation.id
                ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[0_14px_30px_-28px_rgba(52,95,180,0.8)]"
                : "border-[color:var(--line)] bg-white/85 hover:border-[color:var(--line-strong)] hover:bg-white",
            )}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h3 className="line-clamp-1 text-sm font-semibold text-[color:var(--ink)]">
                  {patientLabel}
                </h3>
                <p className="line-clamp-1 text-xs text-[color:var(--ink-soft)]">
                  {conversation.patient_wa_number}
                </p>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", badge.className)}>
                {badge.label}
              </span>
            </div>
            <p className="line-clamp-2 text-sm text-[color:var(--ink-soft)]">
              {preview?.body ?? "No messages yet"}
            </p>
            <p className="mt-2 text-[11px] text-[color:var(--ink-soft)]/90">
              {formatDistanceToNowStrict(new Date(conversation.last_message_at), {
                addSuffix: true,
              })}
            </p>
          </button>
        );
      })}
    </div>
  );
}
