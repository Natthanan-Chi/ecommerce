"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "../../../components/AuthProvider";
import {
  fetchAdminChatThreads,
  markThreadMessagesRead,
  sendChatMessage,
  subscribeToAdminChatChanges,
  updateChatThreadStatus,
  type AdminChatThread,
  type ChatRealtimeStatus,
  type ChatThreadStatus,
} from "../../../data/chat";
import {
  AdminChatSkeleton,
  AdminErrorState,
} from "../../../components/admin/AdminLoadingAndErrorStates";

const STATUS_LABELS: Record<ChatThreadStatus, string> = {
  open: "Open",
  waiting_admin: "Waiting Admin",
  waiting_customer: "Waiting Customer",
  resolved: "Resolved",
};

const STATUS_CLASSNAMES: Record<ChatThreadStatus, string> = {
  open: "text-brand-300",
  waiting_admin: "text-amber-300",
  waiting_customer: "text-sky-300",
  resolved: "text-emerald-300",
};

const QUICK_REPLIES = [
  "Thanks for reaching out. We received your message and will help right away.",
  "We are checking this order for you now.",
  "We will update the tracking number as soon as it is available.",
];

function customerName(thread: AdminChatThread) {
  const name = `${thread.users?.first_name ?? ""} ${thread.users?.last_name ?? ""}`.trim();
  return name || thread.users?.email || "Customer";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<AdminChatThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ChatThreadStatus>("all");
  const [threadTypeFilter, setThreadTypeFilter] = useState<"all" | "general" | "order">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<ChatRealtimeStatus>("closed");
  const [error, setError] = useState<string | null>(null);

  const selectedThread = threads.find((thread) => thread.id === selectedId) ?? threads[0] ?? null;
  const selectedThreadId = selectedThread?.id ?? null;

  const filteredThreads = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return threads.filter((thread) => {
      const matchesStatus = statusFilter === "all" || thread.status === statusFilter;
      const matchesType =
        threadTypeFilter === "all" ||
        (threadTypeFilter === "general" && !thread.order_id) ||
        (threadTypeFilter === "order" && Boolean(thread.order_id));
      const haystack = [
        customerName(thread),
        thread.users?.email,
        thread.id,
        thread.order_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && matchesType && (!search || haystack.includes(search));
    });
  }, [searchQuery, statusFilter, threadTypeFilter, threads]);

  const loadThreads = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAdminChatThreads();
      setThreads(data);
      setSelectedId((current) => current ?? data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load chat.");
    } finally {
      if (!options?.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadThreads();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadThreads]);

  useEffect(() => {
    const unsubscribe = subscribeToAdminChatChanges(
      () => void loadThreads({ silent: true }),
      setRealtimeStatus
    );

    return () => unsubscribe();
  }, [loadThreads]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadThreads({ silent: true });
    }, 45000);

    return () => window.clearInterval(interval);
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedThreadId) return;
    void markThreadMessagesRead(selectedThreadId, "staff");
    const timer = window.setTimeout(() => {
      const readAt = new Date().toISOString();
      setThreads((current) =>
        current.map((thread) =>
          thread.id === selectedThreadId
            ? {
                ...thread,
                chat_messages: thread.chat_messages.map((message) =>
                  message.sender_role === "customer" && !message.read_at
                    ? { ...message, read_at: readAt }
                    : message
                ),
              }
            : thread
        )
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedThreadId]);

  const handleSend = async () => {
    if (!user || !selectedThread || !draft.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      const sent = await sendChatMessage({
        threadId: selectedThread.id,
        senderId: user.id,
        senderRole: "staff",
        body: draft,
      });
      setThreads((current) =>
        current.map((thread) =>
          thread.id === selectedThread.id
            ? {
                ...thread,
                status: "waiting_customer",
                last_message_at: sent.created_at,
                chat_messages: [...thread.chat_messages, sent],
              }
            : thread
        )
      );
      await updateChatThreadStatus(selectedThread.id, "waiting_customer");
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (status: ChatThreadStatus) => {
    if (!selectedThread) return;

    setError(null);
    setThreads((current) =>
      current.map((thread) =>
        thread.id === selectedThread.id ? { ...thread, status } : thread
      )
    );

    try {
      await updateChatThreadStatus(selectedThread.id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status.");
      void loadThreads();
    }
  };

  const waitingAdminCount = threads.filter((thread) => thread.status === "waiting_admin").length;
  const waitingCustomerCount = threads.filter(
    (thread) => thread.status === "waiting_customer"
  ).length;
  const openCount = threads.filter((thread) => thread.status === "open").length;
  const resolvedCount = threads.filter((thread) => thread.status === "resolved").length;
  const orderThreadCount = threads.filter((thread) => thread.order_id).length;
  const generalThreadCount = threads.length - orderThreadCount;
  const unreadCount = threads.reduce(
    (sum, thread) =>
      sum +
      thread.chat_messages.filter(
        (message) => message.sender_role === "customer" && !message.read_at
      ).length,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900/70 px-8 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-400">
              Customer Support
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Live Chat
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Reply to customer questions, review order context, and resolve conversations.
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-600">
              {realtimeStatus === "subscribed" ? "Live updates on" : "Polling backup active"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadThreads()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-brand-500 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <AdminChatSkeleton />
      ) : error && threads.length === 0 ? (
        <div className="p-6">
          <AdminErrorState
            title="Unable to load chat"
            message="The admin chat inbox could not be loaded right now."
            detail={error}
            onAction={() => void loadThreads()}
          />
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-[380px_1fr]">
        <aside className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="grid grid-cols-3 border-b border-slate-800 text-center">
            <div className="p-4">
              <p className="text-xl font-black text-white">{threads.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total</p>
            </div>
            <div className="border-x border-slate-800 p-4">
              <p className="text-xl font-black text-amber-300">{waitingAdminCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Needs Reply</p>
            </div>
            <div className="p-4">
              <p className="text-xl font-black text-brand-300">{unreadCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Unread</p>
            </div>
          </div>

          <div className="space-y-3 border-b border-slate-800 p-4">
            <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search customer, email, order"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | ChatThreadStatus)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 outline-none"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="waiting_admin">Waiting Admin</option>
              <option value="waiting_customer">Waiting Customer</option>
              <option value="resolved">Resolved</option>
            </select>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "all", label: "All" },
                { value: "general", label: "General" },
                { value: "order", label: "Orders" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setThreadTypeFilter(option.value as "all" | "general" | "order")
                  }
                  className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
                    threadTypeFilter === option.value
                      ? "border-brand-500 bg-brand-600 text-white"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[calc(100vh-330px)] overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <MessageSquareText className="mx-auto mb-3 h-9 w-9 text-slate-600" />
                <p className="text-sm font-bold text-slate-300">No conversations yet</p>
                <p className="mt-1 text-xs text-slate-500">New customer messages will appear here.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const lastMessage = thread.chat_messages.at(-1);
                const isActive = selectedThread?.id === thread.id;
                const unread = thread.chat_messages.filter(
                  (message) => message.sender_role === "customer" && !message.read_at
                ).length;

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedId(thread.id)}
                    className={`w-full border-b border-slate-800 px-4 py-4 text-left transition ${
                      isActive ? "bg-brand-600/15" : "hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-white">
                          {customerName(thread)}
                        </p>
                        <p className="truncate text-xs text-slate-500">{thread.users?.email}</p>
                      </div>
                      {unread > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                      {lastMessage?.body ?? "No messages yet"}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide">
                      <span className={STATUS_CLASSNAMES[thread.status]}>
                        {STATUS_LABELS[thread.status]}
                      </span>
                      <span className="text-slate-500">
                        {thread.order_id ? `Order #${thread.order_id.slice(0, 8)}` : "General"}
                      </span>
                      <span className="text-slate-600">{formatDateTime(thread.last_message_at)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          {selectedThread ? (
            <div className="grid min-h-[calc(100vh-190px)] grid-cols-1 xl:grid-cols-[1fr_320px]">
              <div className="flex min-h-[580px] flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <UserCircle2 className="h-10 w-10 text-slate-500" />
                    <div>
                      <p className="font-extrabold text-white">{customerName(selectedThread)}</p>
                      <p className="text-xs text-slate-500">
                        {selectedThread.order_id
                          ? `Order #${selectedThread.order_id.slice(0, 8).toUpperCase()}`
                          : selectedThread.users?.email}
                      </p>
                    </div>
                  </div>
                  <select
                    value={selectedThread.status}
                    onChange={(event) =>
                      void handleStatusChange(event.target.value as ChatThreadStatus)
                    }
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="waiting_admin">Waiting Admin</option>
                    <option value="waiting_customer">Waiting Customer</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-950/60 p-5">
                  <div className="space-y-4">
                    {selectedThread.chat_messages.map((message) => {
                      const isCustomer = message.sender_role === "customer";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[76%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                              isCustomer
                                ? "bg-slate-800 text-slate-100"
                                : "bg-brand-600 text-white"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            <p
                              className={`mt-2 text-[10px] ${
                                isCustomer ? "text-slate-500" : "text-brand-100"
                              }`}
                            >
                              {message.sender_role} | {formatDateTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="border-t border-red-900/50 bg-red-950/40 px-5 py-2 text-xs text-red-200">
                    {error}
                  </div>
                )}

                <div className="border-t border-slate-800 p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => setDraft(reply)}
                        className="rounded-full bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                      >
                        {reply.length > 38 ? `${reply.slice(0, 38)}...` : reply}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-end gap-3">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSend();
                        }
                      }}
                      rows={3}
                      placeholder="Reply to customer"
                      className="min-h-20 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={isSending || !draft.trim()}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send
                    </button>
                  </div>
                </div>
              </div>

              <aside className="border-t border-slate-800 bg-slate-950/50 p-5 xl:border-l xl:border-t-0">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                  Context
                </p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">Customer</p>
                    <p className="mt-1 text-sm font-bold text-white">{customerName(selectedThread)}</p>
                    <p className="mt-1 break-words text-xs text-slate-400">{selectedThread.users?.email}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">Linked Order</p>
                    {selectedThread.orders ? (
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="font-bold text-white">#{selectedThread.orders.id.slice(0, 8)}</p>
                        <p className="text-slate-400">Status: {selectedThread.orders.status}</p>
                        <p className="text-slate-400">
                          Total: ${Number(selectedThread.orders.grand_total).toFixed(2)}
                        </p>
                        <p className="text-slate-400">
                          Items:{" "}
                          {selectedThread.orders.order_items.reduce(
                            (sum, item) => sum + Number(item.quantity ?? 0),
                            0
                          )}
                        </p>
                        <p className="break-words text-slate-400">
                          Tracking: {selectedThread.orders.tracking_number || "Not set"}
                        </p>
                        <p className="mt-3 break-words border-t border-slate-800 pt-3 text-xs leading-relaxed text-slate-500">
                          {selectedThread.orders.shipping_address}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">General support chat</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-500">Inbox Overview</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        { label: "Needs reply", value: waitingAdminCount, tone: "text-amber-300" },
                        { label: "Unread", value: unreadCount, tone: "text-red-300" },
                        { label: "Waiting customer", value: waitingCustomerCount, tone: "text-sky-300" },
                        { label: "Open", value: openCount, tone: "text-brand-300" },
                        { label: "Order chats", value: orderThreadCount, tone: "text-violet-300" },
                        { label: "General", value: generalThreadCount, tone: "text-slate-300" },
                        { label: "Resolved", value: resolvedCount, tone: "text-emerald-300" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-slate-950 px-3 py-2">
                          <p className={`text-lg font-black ${item.tone}`}>{item.value}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
                      <ClipboardList className="h-4 w-4 text-brand-400" />
                      <span>Customer messages move threads to Waiting Admin automatically.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleStatusChange("resolved")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Resolved
                  </button>
                </div>
              </aside>
            </div>
          ) : (
            <div className="flex min-h-[580px] flex-col items-center justify-center text-center">
              <MessageSquareText className="mb-3 h-12 w-12 text-slate-700" />
              <p className="text-lg font-extrabold text-white">Select a conversation</p>
              <p className="mt-1 text-sm text-slate-500">Customer messages will show here.</p>
            </div>
          )}
        </section>
      </div>
      )}
    </main>
  );
}
