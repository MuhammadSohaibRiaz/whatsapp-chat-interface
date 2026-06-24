"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import type { Session } from "@supabase/supabase-js";
import { Building2, LogOut, RefreshCw } from "lucide-react";
import { LoginCard } from "@/components/auth/login-card";
import { ChatView } from "@/components/dashboard/chat-view";
import { ConversationList } from "@/components/dashboard/conversation-list";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type {
  ClinicMembership,
  Conversation,
  ConversationPreview,
  Message,
} from "@/lib/types";

const FIVE_MINUTES = 5 * 60 * 1000;

type MobileView = "list" | "chat";

function sortByRecent(a: Conversation, b: Conversation) {
  return (
    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );
}

export function DashboardApp() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  const [membership, setMembership] = useState<ClinicMembership | null>(null);
  const [hasClinicAssignment, setHasClinicAssignment] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [previews, setPreviews] = useState<Record<string, ConversationPreview | undefined>>(
    {},
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [freshMessageIds, setFreshMessageIds] = useState<Set<string>>(new Set());

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const markFreshMessage = useCallback((messageId: string) => {
    setFreshMessageIds((current) => new Set(current).add(messageId));

    window.setTimeout(() => {
      setFreshMessageIds((current) => {
        const updated = new Set(current);
        updated.delete(messageId);
        return updated;
      });
    }, 1600);
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load messages", error);
        setMessages([]);
      } else {
        setMessages((data as Message[]) ?? []);
      }

      setLoadingMessages(false);
    },
    [supabase],
  );

  const loadWorkspace = useCallback(
    async (currentSession: Session) => {
      setWorkspaceLoading(true);
      setHasClinicAssignment(true);
      setMembership(null);
      setConversations([]);
      setPreviews({});
      setSelectedConversationId(null);
      setMessages([]);

      const { data: clinicUserData, error: clinicUserError } = await supabase
        .from("clinic_users")
        .select("clinic_id, email, role, clinics(id, name, display_number, phone_number_id)")
        .eq("auth_user_id", currentSession.user.id)
        .maybeSingle();

      if (clinicUserError) {
        console.error("Unable to resolve clinic membership", clinicUserError);
      }

      if (!clinicUserData) {
        setHasClinicAssignment(false);
        setWorkspaceLoading(false);
        return;
      }

      const membershipRow = clinicUserData as ClinicMembership;
      setMembership(membershipRow);

      const { data: conversationRows, error: conversationError } = await supabase
        .from("conversations")
        .select("*")
        .eq("clinic_id", membershipRow.clinic_id)
        .order("last_message_at", { ascending: false });

      if (conversationError) {
        console.error("Unable to load conversations", conversationError);
        setWorkspaceLoading(false);
        return;
      }

      const loadedConversations = (conversationRows as Conversation[]) ?? [];
      setConversations(loadedConversations);

      if (loadedConversations.length > 0) {
        const conversationIds = loadedConversations.map((conversation) => conversation.id);

        const { data: latestMessagesRows } = await supabase
          .from("messages")
          .select("conversation_id, body, direction, sender, created_at")
          .eq("clinic_id", membershipRow.clinic_id)
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        const previewMap: Record<string, ConversationPreview | undefined> = {};
        (latestMessagesRows as ConversationPreview[] | null)?.forEach((row) => {
          if (!previewMap[row.conversation_id]) {
            previewMap[row.conversation_id] = row;
          }
        });
        setPreviews(previewMap);

        const initialConversationId = loadedConversations[0]?.id ?? null;
        setSelectedConversationId(initialConversationId);

        if (initialConversationId) {
          await loadMessages(initialConversationId);
          setMobileView("list");
        }
      }

      setWorkspaceLoading(false);
    },
    [loadMessages, supabase],
  );

  useEffect(() => {
    let ignore = false;

    async function init() {
      const { data } = await supabase.auth.getSession();

      if (!ignore) {
        setSession(data.session ?? null);
        setAuthLoading(false);
      }

      if (data.session && !ignore) {
        await loadWorkspace(data.session);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);

      if (newSession) {
        await loadWorkspace(newSession);
      } else {
        setMembership(null);
        setConversations([]);
        setPreviews({});
        setSelectedConversationId(null);
        setMessages([]);
        setHasClinicAssignment(true);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [loadWorkspace, supabase]);

  useEffect(() => {
    if (!membership?.clinic_id) {
      return;
    }

    const conversationChannel = supabase
      .channel(`conversations-${membership.clinic_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `clinic_id=eq.${membership.clinic_id}`,
        },
        (payload) => {
          const nextConversation = payload.new as Conversation;
          const oldConversation = payload.old as Conversation;

          if (payload.eventType === "DELETE") {
            setConversations((current) =>
              current.filter((conversation) => conversation.id !== oldConversation.id),
            );
            return;
          }

          if (!nextConversation?.id) {
            return;
          }

          setConversations((current) => {
            const existing = current.find((conversation) => conversation.id === nextConversation.id);

            if (!existing) {
              return [...current, nextConversation].sort(sortByRecent);
            }

            return current
              .map((conversation) =>
                conversation.id === nextConversation.id ? { ...conversation, ...nextConversation } : conversation,
              )
              .sort(sortByRecent);
          });
        },
      )
      .subscribe();

    const messageChannel = supabase
      .channel(`messages-${membership.clinic_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `clinic_id=eq.${membership.clinic_id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          setPreviews((current) => ({
            ...current,
            [newMessage.conversation_id]: {
              conversation_id: newMessage.conversation_id,
              body: newMessage.body,
              direction: newMessage.direction,
              sender: newMessage.sender,
              created_at: newMessage.created_at,
            },
          }));

          setConversations((current) =>
            current
              .map((conversation) =>
                conversation.id === newMessage.conversation_id
                  ? { ...conversation, last_message_at: newMessage.created_at }
                  : conversation,
              )
              .sort(sortByRecent),
          );

          if (selectedConversationId === newMessage.conversation_id) {
            setMessages((current) => {
              if (current.some((message) => message.id === newMessage.id)) {
                return current;
              }
              return [...current, newMessage];
            });
            markFreshMessage(newMessage.id);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(conversationChannel);
      void supabase.removeChannel(messageChannel);
    };
  }, [markFreshMessage, membership?.clinic_id, selectedConversationId, supabase]);

  useEffect(() => {
    if (!chatScrollRef.current) {
      return;
    }

    chatScrollRef.current.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRefreshTick((tick) => tick + 1);
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const nowTimestamp = useMemo(() => Date.now(), [refreshTick]);

  const isNeedsAttention = useCallback(
    (conversation: Conversation) => {
      if (conversation.status === "human") {
        return true;
      }

      const preview = previews[conversation.id];
      if (!preview || preview.direction !== "inbound") {
        return false;
      }

      const elapsed = nowTimestamp - new Date(preview.created_at).getTime();
      return elapsed > FIVE_MINUTES;
    },
    [nowTimestamp, previews],
  );

  async function switchConversationStatus(conversationId: string, status: "bot" | "human") {
    const { error } = await supabase
      .from("conversations")
      .update({ status })
      .eq("id", conversationId);

    if (error) {
      console.error("Failed to update status", error);
    }
  }

  async function handleSendMessage(body: string) {
    if (!selectedConversation || !membership) {
      return;
    }

    setIsSending(true);

    const { data: insertedRows, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        clinic_id: membership.clinic_id,
        direction: "outbound",
        sender: "staff",
        body,
      })
      .select("*")
      .limit(1);

    if (insertError) {
      console.error("Unable to insert staff message", insertError);
      setIsSending(false);
      return;
    }

    const insertedMessage = (insertedRows?.[0] as Message | undefined) ?? null;
    if (insertedMessage) {
      setMessages((current) => {
        if (current.some((message) => message.id === insertedMessage.id)) {
          return current;
        }
        return [...current, insertedMessage];
      });
      markFreshMessage(insertedMessage.id);
    }

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", selectedConversation.id);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (accessToken) {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          body,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("WhatsApp API route returned an error", payload);
      }
    }

    setIsSending(false);
  }

  async function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setMobileView("chat");
    await loadMessages(conversationId);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const clinicName = membership?.clinics?.name ?? "Clinic";
  const clinicNumber = membership?.clinics?.display_number ?? "";

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <LoadingSkeleton />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <LoginCard />
      </main>
    );
  }

  if (workspaceLoading) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <LoadingSkeleton />
      </main>
    );
  }

  if (!hasClinicAssignment) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-lg rounded-3xl border border-[color:var(--line)] bg-white/90 p-8 text-center shadow-[0_35px_90px_-45px_rgba(14,35,64,0.55)] backdrop-blur">
          <Building2 className="mx-auto mb-4 text-[color:var(--ink-soft)]" />
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--ink)]">
            No clinic assigned yet
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--ink-soft)]">
            Your account is authenticated, but there is no row in clinic_users linked to your auth user.
            Ask your admin to create your clinic mapping in Supabase.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--ink)] transition hover:border-[color:var(--line-strong)]"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-3xl border border-[color:var(--line)] bg-white/88 px-4 py-3 shadow-[0_24px_70px_-50px_rgba(17,40,71,0.55)] backdrop-blur sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
              WhatsApp Concierge
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--ink)] sm:text-xl">
              {clinicName}
            </h1>
            <p className="text-sm text-[color:var(--ink-soft)]">
              {clinicNumber} · {conversations.length} active conversation
              {conversations.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-1 text-xs font-medium text-[color:var(--ink-soft)]">
              Updated {formatDistanceToNowStrict(new Date(), { addSuffix: true })}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[color:var(--ink)] transition hover:border-[color:var(--line-strong)]"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="grid flex-1 gap-3 md:grid-cols-[340px,1fr]">
        <aside className={`${mobileView === "chat" ? "hidden" : "flex"} md:flex min-h-[65vh] flex-col rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-3 sm:p-4`}>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-[color:var(--ink)]">Conversations</h2>
            <button
              type="button"
              onClick={() => setRefreshTick((tick) => tick + 1)}
              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] bg-white px-2.5 py-1 text-[11px] font-medium text-[color:var(--ink-soft)] transition hover:border-[color:var(--line-strong)] hover:text-[color:var(--ink)]"
            >
              <RefreshCw size={12} />
              Refresh labels
            </button>
          </div>

          <div className="overflow-y-auto pr-1">
            <ConversationList
              conversations={conversations}
              previews={previews}
              selectedConversationId={selectedConversationId}
              onSelectConversation={(conversationId) => void handleSelectConversation(conversationId)}
              isNeedsAttention={isNeedsAttention}
            />
          </div>
        </aside>

        <div className={`${mobileView === "chat" ? "flex" : "hidden"} md:flex min-h-[65vh] flex-col`}>
          <ChatView
            conversation={selectedConversation}
            messages={messages}
            loadingMessages={loadingMessages}
            isSending={isSending}
            onTakeOver={() =>
              selectedConversation
                ? switchConversationStatus(selectedConversation.id, "human")
                : Promise.resolve()
            }
            onReturnToBot={() =>
              selectedConversation
                ? switchConversationStatus(selectedConversation.id, "bot")
                : Promise.resolve()
            }
            onSendMessage={handleSendMessage}
            scrollContainerRef={chatScrollRef}
            freshMessageIds={freshMessageIds}
            onBackToList={() => setMobileView("list")}
          />
        </div>
      </section>
    </main>
  );
}
