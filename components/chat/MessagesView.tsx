"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusMark } from "@/components/ui/StatusMark";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/cn";
import type { ChatMessage, ConversationSummary, ServiceRequest } from "@/lib/types";

export function MessagesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useApp();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get("c"));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  const businessId = searchParams.get("business");

  useEffect(() => {
    async function openFromBusiness() {
      if (!businessId) return;
      const conversation = await api<ConversationSummary>("/conversations", {
        method: "POST",
        body: JSON.stringify({ business_id: businessId }),
      });
      router.replace(`/messages?c=${conversation.id}`);
      setActiveId(conversation.id);
    }
    void openFromBusiness();
  }, [businessId, router]);

  useEffect(() => {
    api<ConversationSummary[]>("/conversations")
      .then((rows) => {
        setConversations(rows);
        if (!activeId && rows[0]) setActiveId(rows[0].id);
      })
      .catch(() => setConversations([]));
    api<ServiceRequest[]>("/requests")
      .then(setRequests)
      .catch(() => setRequests([]));
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    async function load() {
      const rows = await api<ChatMessage[]>(`/conversations/${activeId}/messages`);
      if (!cancelled) setMessages(rows);
    }
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeId]);

  const active = conversations.find((item) => item.id === activeId);
  const counterpart =
    user?.activeRole === "provider" ? active?.customerName : active?.businessName;

  const requestById = useMemo(() => {
    return new Map(requests.map((item) => [item.id, item]));
  }, [requests]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!activeId || !draft.trim()) return;
    const created = await api<ChatMessage>(`/conversations/${activeId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: draft.trim() }),
    });
    setMessages((current) => [...current, created]);
    setDraft("");
  }

  async function sendRequest() {
    if (!active || !requestTitle.trim()) return;
    const created = await api<ServiceRequest>("/requests", {
      method: "POST",
      body: JSON.stringify({
        business_id: active.businessId,
        conversation_id: active.id,
        title: requestTitle.trim(),
      }),
    });
    setRequests((current) => [created, ...current]);
    setRequestTitle("");
    const rows = await api<ChatMessage[]>(`/conversations/${active.id}/messages`);
    setMessages(rows);
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] md:h-dvh">
      <aside className="hidden w-72 shrink-0 border-r border-line md:flex md:flex-col">
        <div className="border-b border-line px-4 py-4">
          <p className="font-display text-lg text-ink">Messages</p>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {conversations.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(item.id);
                  router.replace(`/messages?c=${item.id}`);
                }}
                className={cn(
                  "flex w-full flex-col items-start border-b border-line px-4 py-3 text-left",
                  item.id === activeId ? "bg-card" : "hover:bg-card/70",
                )}
              >
                <span className="text-[14px] font-medium text-ink">
                  {user?.activeRole === "provider"
                    ? item.customerName
                    : item.businessName}
                </span>
                <span className="mt-0.5 line-clamp-1 text-[12px] text-ink-soft">
                  {item.lastMessage}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <>
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[20px] bg-ink text-[11px] text-paper">
                {active.businessMonogram}
              </span>
              <div>
                <p className="text-[14px] font-medium text-ink">{counterpart}</p>
                <p className="text-[12px] text-ink-soft">Conversation</p>
              </div>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => {
                if (message.kind === "request" && message.requestId) {
                  const request = requestById.get(message.requestId);
                  return (
                    <article
                      key={message.id}
                      className="max-w-[22rem] rounded-[8px] border border-line bg-card px-3 py-3"
                    >
                      <p className="text-[11px] tracking-[0.12em] text-ink-soft uppercase">
                        Service request
                      </p>
                      <p className="mt-1 text-[14px] font-medium text-ink">
                        {request?.title ?? message.body}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink">
                        <StatusMark tone="accent" />
                        {request?.statusLabel ?? "Waiting for reply"}
                      </p>
                    </article>
                  );
                }
                if (message.kind === "system") {
                  return (
                    <p
                      key={message.id}
                      className="text-center text-[12px] text-ink-soft"
                    >
                      {message.body}
                    </p>
                  );
                }
                return (
                  <div
                    key={message.id}
                    className={cn("flex", message.mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-[12px] px-3 py-2 text-[14px] leading-5",
                        message.mine
                          ? "bg-ink text-paper"
                          : "border border-line bg-card text-ink",
                      )}
                    >
                      {message.body}
                    </div>
                  </div>
                );
              })}
            </div>
            {user?.activeRole === "customer" ? (
              <div className="flex gap-2 border-t border-line px-4 py-2">
                <input
                  value={requestTitle}
                  onChange={(event) => setRequestTitle(event.target.value)}
                  placeholder="Request title, e.g. Trouser alteration"
                  className="h-9 flex-1 border-0 bg-transparent text-[13px] outline-none"
                />
                <Button size="sm" variant="secondary" onClick={() => void sendRequest()}>
                  Send request
                </Button>
              </div>
            ) : null}
            <form
              onSubmit={(event) => void send(event)}
              className="flex items-center gap-2 border-t border-line px-3 py-3"
            >
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center text-ink-soft"
                aria-label="File uploads come in a later phase"
                title="File uploads come next"
              >
                <Paperclip size={18} strokeWidth={1.65} />
              </button>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write a message"
                className="h-10 flex-1 rounded-[8px] border border-line bg-card px-3 text-sm outline-none focus:border-accent"
              />
              <Button type="submit" size="sm" disabled={!draft.trim()}>
                <Send size={14} strokeWidth={1.65} />
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6">
            <p className="max-w-sm text-center text-sm leading-6 text-ink-soft">
              Pick a business from Discover and start a conversation. It will
              appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
