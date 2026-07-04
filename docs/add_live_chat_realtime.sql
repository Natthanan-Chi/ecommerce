-- Optional Live Chat Realtime publication.
-- Run this after docs/add_live_chat.sql if you want instant chat updates.
-- The app still falls back to polling when Realtime is not enabled.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
