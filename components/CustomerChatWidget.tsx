"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import {
  fetchCustomerUnreadChatCount,
  fetchChatMessages,
  getOrCreateCustomerThread,
  markThreadMessagesRead,
  sendChatMessage,
  updateChatThreadStatus,
  type ChatMessage,
  type ChatThread,
} from "../data/chat";

const HIDDEN_PATH_PREFIXES = ["/admin", "/login", "/auth"];
const LAST_THREAD_STORAGE_KEY = "zenith:last-chat-thread";
const OPEN_CHAT_EVENT = "zenith:open-chat";

const QUICK_TOPICS = [
  "I want to check my order status.",
  "I have a payment question.",
  "Can you help with shipping?",
  "I have a product question.",
];

type OpenChatEventDetail = {
  orderId?: string | null;
  orderLabel?: string | null;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerChatWidget() {
  const pathname = usePathname();
  const { isLoading, user, signInWithGitHub } = useAuth();
  const userId = user?.id ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderLabel, setActiveOrderLabel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unreadBadgeCount, setUnreadBadgeCount] = useState(0);
  const [isBooting, setIsBooting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const shouldHide = useMemo(
    () => HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
    [pathname]
  );

  const visibleUnreadCount = isOpen
    ? messages.filter(
        (message) => message.sender_role !== "customer" && !message.read_at
      ).length
    : unreadBadgeCount;

  const openThread = useCallback((orderId: string | null, orderLabel: string | null, open = true) => {
    setActiveOrderId(orderId);
    setActiveOrderLabel(orderLabel);
    setThread(null);
    setMessages([]);
    setError(null);
    if (open) setIsOpen(true);

    try {
      localStorage.setItem(
        LAST_THREAD_STORAGE_KEY,
        JSON.stringify({ orderId, orderLabel })
      );
    } catch (err) {
      console.warn("[chat] Unable to persist last thread:", err);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isOpen]);

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const detail = (event as CustomEvent<OpenChatEventDetail>).detail ?? {};
      openThread(detail.orderId ?? null, detail.orderLabel ?? null);
    };

    window.addEventListener(OPEN_CHAT_EVENT, handleOpenChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handleOpenChat);
  }, [openThread]);

  useEffect(() => {
    if (isLoading || !userId) return;

    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(LAST_THREAD_STORAGE_KEY);
        if (!raw) return;
        const stored = JSON.parse(raw) as OpenChatEventDetail;
        setActiveOrderId(stored.orderId ?? null);
        setActiveOrderLabel(stored.orderLabel ?? null);
      } catch (err) {
        console.warn("[chat] Unable to restore last thread:", err);
        localStorage.removeItem(LAST_THREAD_STORAGE_KEY);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isLoading, userId]);

  useEffect(() => {
    if (isLoading || !userId || shouldHide) return;

    let cancelled = false;
    const loadUnread = () => {
      void fetchCustomerUnreadChatCount(userId).then((count) => {
        if (!cancelled) setUnreadBadgeCount(count);
      });
    };

    loadUnread();
    const interval = window.setInterval(loadUnread, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isLoading, shouldHide, userId]);

  useEffect(() => {
    if (!isOpen || isLoading || !userId) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      setIsBooting(true);
      setError(null);

      void getOrCreateCustomerThread(userId, activeOrderId)
        .then(async (nextThread) => {
          if (cancelled) return;
          setThread(nextThread);
          const nextMessages = await fetchChatMessages(nextThread.id);
          if (cancelled) return;
          setMessages(nextMessages);
          void markThreadMessagesRead(nextThread.id, "customer");
          void fetchCustomerUnreadChatCount(userId).then((count) => {
            if (!cancelled) setUnreadBadgeCount(count);
          });
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setIsBooting(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeOrderId, isLoading, isOpen, userId]);

  useEffect(() => {
    if (!isOpen || !thread || !userId) return;

    const interval = window.setInterval(() => {
      void fetchChatMessages(thread.id)
        .then((nextMessages) => {
          setMessages(nextMessages);
          void markThreadMessagesRead(thread.id, "customer");
          void fetchCustomerUnreadChatCount(userId).then(setUnreadBadgeCount);
        })
        .catch((err: Error) => setError(err.message));
    }, 8000);

    return () => window.clearInterval(interval);
  }, [isOpen, thread, userId]);

  if (shouldHide) return null;

  const handleSend = async () => {
    if (!user || !thread || !draft.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const sent = await sendChatMessage({
        threadId: thread.id,
        senderId: user.id,
        senderRole: "customer",
        body: draft,
      });
      await updateChatThreadStatus(thread.id, "open");
      setMessages((current) => [...current, sent]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const threadTitle = activeOrderId
    ? `Order ${activeOrderLabel ?? activeOrderId.slice(0, 8).toUpperCase()}`
    : "Zenith Support";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <section className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-4 py-3 text-white dark:border-slate-800">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{threadTitle}</p>
              <p className="text-[11px] text-slate-400">Ask about products or orders</p>
            </div>
            <div className="flex items-center gap-1">
              {activeOrderId && (
                <button
                  type="button"
                  onClick={() => openThread(null, null)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  aria-label="Back to general support"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!user && !isLoading ? (
            <div className="p-5 text-center">
              <ShieldCheck className="mx-auto mb-3 h-9 w-9 text-brand-600" />
              <p className="mb-2 text-sm font-extrabold text-slate-900 dark:text-white">
                Sign in to chat
              </p>
              <p className="mb-4 text-xs leading-relaxed text-slate-500">
                We keep chat history with your account so support can help with orders.
              </p>
              <button
                type="button"
                onClick={() => void signInWithGitHub()}
                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-500"
              >
                Sign in with GitHub
              </button>
            </div>
          ) : (
            <>
              <div className="h-80 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900/60">
                {isBooting ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                    <p className="text-xs font-semibold">Loading chat</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageCircle className="mb-3 h-9 w-9 text-brand-600" />
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {activeOrderId ? "Ask about this order" : "How can we help?"}
                    </p>
                    <p className="mt-1 max-w-56 text-xs leading-relaxed text-slate-500">
                      Ask about stock, delivery, payment, or an order status.
                    </p>
                    <div className="mt-4 flex max-w-64 flex-wrap justify-center gap-2">
                      {QUICK_TOPICS.map((topic) => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => setDraft(topic)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          {topic.replace("I ", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const isMine = message.sender_role === "customer";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              isMine
                                ? "bg-brand-600 text-white"
                                : "bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            <p
                              className={`mt-1 text-[10px] ${
                                isMine ? "text-brand-100" : "text-slate-400"
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                {messages.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {QUICK_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setDraft(topic)}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        {topic.replace("I ", "")}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    rows={2}
                    placeholder="Type your message"
                    className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={isSending || !thread || !draft.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-2xl shadow-brand-900/30 transition hover:-translate-y-0.5 hover:bg-brand-500"
        aria-label="Open live chat"
      >
        <MessageCircle className="h-6 w-6" />
        {visibleUnreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-slate-950">
            {visibleUnreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
