-- Live chat support tables for customer/admin conversations.
-- Run this in Supabase SQL Editor after the existing ecommerce schema.

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'waiting_customer', 'resolved')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, order_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL
    CHECK (sender_role IN ('customer', 'admin', 'staff', 'support')),
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_user_id
  ON public.chat_threads(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message_at
  ON public.chat_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created
  ON public.chat_messages(thread_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.touch_chat_thread()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_threads
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_chat_thread_on_message ON public.chat_messages;

CREATE TRIGGER trg_touch_chat_thread_on_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_chat_thread();

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read their chat threads" ON public.chat_threads;
CREATE POLICY "Customers can read their chat threads"
ON public.chat_threads
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can create their chat threads" ON public.chat_threads;
CREATE POLICY "Customers can create their chat threads"
ON public.chat_threads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can update their open chat threads" ON public.chat_threads;
CREATE POLICY "Customers can update their open chat threads"
ON public.chat_threads
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can manage chat threads" ON public.chat_threads;
CREATE POLICY "Staff can manage chat threads"
ON public.chat_threads
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff', 'support')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff', 'support')
  )
);

DROP POLICY IF EXISTS "Customers can read messages in their threads" ON public.chat_messages;
CREATE POLICY "Customers can read messages in their threads"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_threads
    WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can send messages in their threads" ON public.chat_messages;
CREATE POLICY "Customers can send messages in their threads"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND sender_role = 'customer'
  AND EXISTS (
    SELECT 1 FROM public.chat_threads
    WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can mark admin messages read" ON public.chat_messages;
CREATE POLICY "Customers can mark admin messages read"
ON public.chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_threads
    WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_threads
    WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Staff can manage chat messages" ON public.chat_messages;
CREATE POLICY "Staff can manage chat messages"
ON public.chat_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff', 'support')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'staff', 'support')
  )
);
