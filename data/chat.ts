import { supabase } from "../lib/supabase";

export type ChatThreadStatus = "open" | "waiting_admin" | "waiting_customer" | "resolved";
export type ChatSenderRole = "customer" | "admin" | "staff" | "support";

export interface ChatMessage {
  id: number;
  thread_id: string;
  sender_id: string;
  sender_role: ChatSenderRole;
  body: string;
  read_at: string | null;
  created_at: string;
  users?: { email: string; first_name: string; last_name: string } | null;
}

export interface ChatThread {
  id: string;
  user_id: string;
  order_id: string | null;
  status: ChatThreadStatus;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface AdminChatThread extends ChatThread {
  users: { email: string; first_name: string; last_name: string } | null;
  orders: {
    id: string;
    status: string;
    grand_total: number;
    tracking_number: string | null;
    shipping_address: string;
    order_items: { quantity: number }[];
  } | null;
  chat_messages: ChatMessage[];
}

export interface AdminChatSummary {
  total: number;
  unread: number;
  waitingAdmin: number;
  waitingCustomer: number;
  resolved: number;
  orderLinked: number;
  general: number;
}

export type ChatRealtimeStatus = "subscribed" | "closed" | "channel_error" | "timed_out";

const THREAD_SELECT = `
  id,
  user_id,
  order_id,
  status,
  last_message_at,
  created_at,
  updated_at
`;

const MESSAGE_SELECT = `
  id,
  thread_id,
  sender_id,
  sender_role,
  body,
  read_at,
  created_at,
  users ( email, first_name, last_name )
`;

export async function getOrCreateCustomerThread(
  userId: string,
  orderId: string | null = null
): Promise<ChatThread> {
  let query = supabase
    .from("chat_threads")
    .select(THREAD_SELECT)
    .eq("user_id", userId);

  query = orderId ? query.eq("order_id", orderId) : query.is("order_id", null);

  const existing = await query
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.[0]) return existing.data[0] as ChatThread;

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: userId, order_id: orderId })
    .select(THREAD_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as ChatThread;
}

export async function fetchChatMessages(threadId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_SELECT)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]) as ChatMessage[];
}

export async function sendChatMessage(input: {
  threadId: string;
  senderId: string;
  senderRole: ChatSenderRole;
  body: string;
}): Promise<ChatMessage> {
  const body = input.body.trim();
  if (!body) throw new Error("Message is required.");

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: input.threadId,
      sender_id: input.senderId,
      sender_role: input.senderRole,
      body,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as ChatMessage;
}

export async function fetchCustomerUnreadChatCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select(
      `
      id,
      chat_messages (
        sender_role,
        read_at
      )
    `
    )
    .eq("user_id", userId);

  if (error) {
    console.warn("[fetchCustomerUnreadChatCount]", error.message);
    return 0;
  }

  return (((data ?? []) as unknown[]) as { chat_messages?: Pick<ChatMessage, "sender_role" | "read_at">[] }[])
    .flatMap((thread) => thread.chat_messages ?? [])
    .filter((message) => message.sender_role !== "customer" && !message.read_at).length;
}

export async function markThreadMessagesRead(
  threadId: string,
  viewerRole: "customer" | "staff"
): Promise<void> {
  const senderRoles =
    viewerRole === "customer" ? ["admin", "staff", "support"] : ["customer"];

  const { error } = await supabase
    .from("chat_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .is("read_at", null)
    .in("sender_role", senderRoles);

  if (error) console.warn("[markThreadMessagesRead]", error.message);
}

export async function fetchAdminChatThreads(): Promise<AdminChatThread[]> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select(
      `
      id,
      user_id,
      order_id,
      status,
      last_message_at,
      created_at,
      updated_at,
      users ( email, first_name, last_name ),
      orders (
        id,
        status,
        grand_total,
        tracking_number,
        shipping_address,
        order_items ( quantity )
      ),
      chat_messages (
        id,
        thread_id,
        sender_id,
        sender_role,
        body,
        read_at,
        created_at,
        users ( email, first_name, last_name )
      )
    `
    )
    .order("last_message_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (((data ?? []) as unknown[]) as AdminChatThread[]).map((thread) => ({
    ...thread,
    chat_messages: [...(thread.chat_messages ?? [])].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  }));
}

export async function fetchAdminChatSummary(): Promise<AdminChatSummary> {
  const { data, error } = await supabase
    .from("chat_threads")
    .select(
      `
      id,
      order_id,
      status,
      chat_messages (
        sender_role,
        read_at
      )
    `
    );

  if (error) {
    console.warn("[fetchAdminChatSummary]", error.message);
    return {
      total: 0,
      unread: 0,
      waitingAdmin: 0,
      waitingCustomer: 0,
      resolved: 0,
      orderLinked: 0,
      general: 0,
    };
  }

  const threads = ((data ?? []) as unknown[]) as {
    order_id: string | null;
    status: ChatThreadStatus;
    chat_messages?: Pick<ChatMessage, "sender_role" | "read_at">[];
  }[];

  return threads.reduce<AdminChatSummary>(
    (summary, thread) => {
      summary.total += 1;
      if (thread.order_id) summary.orderLinked += 1;
      else summary.general += 1;
      if (thread.status === "waiting_admin") summary.waitingAdmin += 1;
      if (thread.status === "waiting_customer") summary.waitingCustomer += 1;
      if (thread.status === "resolved") summary.resolved += 1;
      summary.unread += (thread.chat_messages ?? []).filter(
        (message) => message.sender_role === "customer" && !message.read_at
      ).length;
      return summary;
    },
    {
      total: 0,
      unread: 0,
      waitingAdmin: 0,
      waitingCustomer: 0,
      resolved: 0,
      orderLinked: 0,
      general: 0,
    }
  );
}

export async function updateChatThreadStatus(
  threadId: string,
  status: ChatThreadStatus,
  fallbackStatus?: ChatThreadStatus
): Promise<void> {
  const { error } = await supabase
    .from("chat_threads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", threadId);

  const isConstraintError =
    error &&
    (error.message.toLowerCase().includes("check constraint") ||
      error.message.toLowerCase().includes("violates check"));

  if (isConstraintError && fallbackStatus) {
    const retry = await supabase
      .from("chat_threads")
      .update({ status: fallbackStatus, updated_at: new Date().toISOString() })
      .eq("id", threadId);

    if (retry.error) throw new Error(retry.error.message);
    return;
  }

  if (error) throw new Error(error.message);
}

export function subscribeToCustomerThread(
  threadId: string,
  onChange: () => void,
  onStatus?: (status: ChatRealtimeStatus) => void
): () => void {
  const channel = supabase
    .channel(`customer-chat-thread:${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_messages",
        filter: `thread_id=eq.${threadId}`,
      },
      onChange
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chat_threads",
        filter: `id=eq.${threadId}`,
      },
      onChange
    )
    .subscribe((status) => {
      onStatus?.(status.toLowerCase() as ChatRealtimeStatus);
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToAdminChatChanges(
  onChange: () => void,
  onStatus?: (status: ChatRealtimeStatus) => void
): () => void {
  const channelName =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `admin-chat-inbox:${crypto.randomUUID()}`
      : `admin-chat-inbox:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chat_threads" },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chat_messages" },
      onChange
    )
    .subscribe((status) => {
      onStatus?.(status.toLowerCase() as ChatRealtimeStatus);
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
