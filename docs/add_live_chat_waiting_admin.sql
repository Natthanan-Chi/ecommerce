-- Add the live chat "waiting_admin" workflow status.
-- Run this after docs/add_live_chat.sql if your chat tables already exist.

ALTER TABLE public.chat_threads
DROP CONSTRAINT IF EXISTS chat_threads_status_check;

ALTER TABLE public.chat_threads
ADD CONSTRAINT chat_threads_status_check
CHECK (status IN ('open', 'waiting_admin', 'waiting_customer', 'resolved'));

COMMENT ON COLUMN public.chat_threads.status IS
  'Support workflow: open, waiting_admin, waiting_customer, resolved.';
