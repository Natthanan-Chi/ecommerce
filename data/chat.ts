import { supabase } from "../lib/supabase";

export type ChatThreadStatus = "open" | "waiting_customer" | "resolved";
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

export async function updateChatThreadStatus(
  threadId: string,
  status: ChatThreadStatus
): Promise<void> {
  const { error } = await supabase
    .from("chat_threads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", threadId);

  if (error) throw new Error(error.message);
}
