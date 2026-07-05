-- ============================================================================
-- ZENITH E-COMMERCE - NEW SUPABASE DATABASE SETUP
-- Run this once in Supabase SQL Editor on a NEW project.
--
-- Includes:
-- - Core ecommerce schema
-- - Supabase Auth -> public.users sync trigger
-- - RBAC helper for admin/staff/support
-- - Row Level Security policies
-- - Live chat tables, policies, and optional realtime publication
--
-- After this file succeeds, run:
--   docs/seed_products.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  oauth_provider VARCHAR(50) NOT NULL,
  oauth_id VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin', 'staff', 'support')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(2048),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_oauth_identity UNIQUE (oauth_provider, oauth_id)
);

CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES public.categories(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id INT REFERENCES public.categories(id) ON DELETE SET NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  original_price DECIMAL(10, 2) CHECK (original_price >= 0),
  stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url VARCHAR(2048) NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  display_name VARCHAR(80),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  tax DECIMAL(10, 2) NOT NULL CHECK (tax >= 0),
  shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
  grand_total DECIMAL(10, 2) NOT NULL CHECK (grand_total >= 0),
  shipping_address TEXT NOT NULL,
  tracking_number VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'waiting_admin', 'waiting_customer', 'resolved')),
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
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.reviews.display_name IS
  'Optional storefront name shown with a review. Leave NULL to display Anonymous. The reviewer identity remains reviews.user_id.';

COMMENT ON COLUMN public.chat_threads.status IS
  'Support workflow: open, waiting_admin, waiting_customer, resolved.';

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON public.products(category_id, is_active);

CREATE INDEX IF NOT EXISTS idx_products_slug
  ON public.products(slug);

CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON public.orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_product
  ON public.reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_users_oauth
  ON public.users(oauth_provider, oauth_id);

CREATE INDEX IF NOT EXISTS idx_users_role
  ON public.users(role);

CREATE INDEX IF NOT EXISTS idx_chat_threads_user_id
  ON public.chat_threads(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message_at
  ON public.chat_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created
  ON public.chat_messages(thread_id, created_at ASC);

-- ============================================================================
-- 3. TRIGGERS AND FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider TEXT;
  prov_id TEXT;
  f_name TEXT := '';
  l_name TEXT := '';
  full_name TEXT := '';
  u_avatar TEXT := '';
BEGIN
  provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  prov_id := COALESCE(NEW.raw_user_meta_data->>'sub', NEW.id::text);
  u_avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '');
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, 'Customer'), '@', 1),
    'Customer'
  );

  IF POSITION(' ' IN full_name) > 0 THEN
    f_name := SUBSTRING(full_name FROM 1 FOR POSITION(' ' IN full_name) - 1);
    l_name := SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1);
  ELSE
    f_name := full_name;
    l_name := '';
  END IF;

  INSERT INTO public.users (
    id,
    email,
    oauth_provider,
    oauth_id,
    role,
    first_name,
    last_name,
    avatar_url,
    phone,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@unknown.local'),
    provider,
    prov_id,
    'customer',
    f_name,
    l_name,
    u_avatar,
    NEW.phone,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    oauth_provider = EXCLUDED.oauth_provider,
    oauth_id = EXCLUDED.oauth_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_chat_thread()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_threads
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_chat_thread_on_message ON public.chat_messages;
CREATE TRIGGER trg_touch_chat_thread_on_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_chat_thread();

-- Helper used by RLS policies and admin pages.
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_uuid
      AND role IN ('admin', 'staff', 'support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- categories
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories"
ON public.categories
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Allow admin/staff write access to categories" ON public.categories;
CREATE POLICY "Allow admin/staff write access to categories"
ON public.categories
FOR ALL TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- products
DROP POLICY IF EXISTS "Allow public read access to active products" ON public.products;
CREATE POLICY "Allow public read access to active products"
ON public.products
FOR SELECT TO public
USING (is_active = true OR public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Allow admin/staff write access to products" ON public.products;
CREATE POLICY "Allow admin/staff write access to products"
ON public.products
FOR ALL TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- product_images
DROP POLICY IF EXISTS "Allow public read access to product images" ON public.product_images;
CREATE POLICY "Allow public read access to product images"
ON public.product_images
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Allow admin/staff write access to product images" ON public.product_images;
CREATE POLICY "Allow admin/staff write access to product images"
ON public.product_images
FOR ALL TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- users
DROP POLICY IF EXISTS "Allow users to view all profiles" ON public.users;
CREATE POLICY "Allow users to view all profiles"
ON public.users
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
CREATE POLICY "Allow users to update own profile"
ON public.users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- reviews
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to reviews"
ON public.reviews
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to write reviews" ON public.reviews;
CREATE POLICY "Allow authenticated users to write reviews"
ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage own reviews" ON public.reviews;
CREATE POLICY "Allow users to manage own reviews"
ON public.reviews
FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()));

-- orders
DROP POLICY IF EXISTS "Allow users/admins to view their own orders" ON public.orders;
CREATE POLICY "Allow users/admins to view their own orders"
ON public.orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Allow users to place orders" ON public.orders;
CREATE POLICY "Allow users to place orders"
ON public.orders
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admin/staff to update orders" ON public.orders;
CREATE POLICY "Allow admin/staff to update orders"
ON public.orders
FOR UPDATE TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- order_items
DROP POLICY IF EXISTS "Allow users/admins to view order items" ON public.order_items;
CREATE POLICY "Allow users/admins to view order items"
ON public.order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid()
        OR public.is_admin_or_staff(auth.uid())
      )
  )
);

DROP POLICY IF EXISTS "Allow users to insert order items" ON public.order_items;
CREATE POLICY "Allow users to insert order items"
ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  )
);

-- chat_threads
DROP POLICY IF EXISTS "Customers can read their chat threads" ON public.chat_threads;
CREATE POLICY "Customers can read their chat threads"
ON public.chat_threads
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can create their chat threads" ON public.chat_threads;
CREATE POLICY "Customers can create their chat threads"
ON public.chat_threads
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers can update their open chat threads" ON public.chat_threads;
CREATE POLICY "Customers can update their open chat threads"
ON public.chat_threads
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can manage chat threads" ON public.chat_threads;
CREATE POLICY "Staff can manage chat threads"
ON public.chat_threads
FOR ALL TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- chat_messages
DROP POLICY IF EXISTS "Customers can read messages in their threads" ON public.chat_messages;
CREATE POLICY "Customers can read messages in their threads"
ON public.chat_messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_threads
    WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can send messages in their threads" ON public.chat_messages;
CREATE POLICY "Customers can send messages in their threads"
ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_role = 'customer'
  AND EXISTS (
    SELECT 1
    FROM public.chat_threads
    WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can mark admin messages read" ON public.chat_messages;
CREATE POLICY "Customers can mark admin messages read"
ON public.chat_messages
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_threads
    WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chat_threads
    WHERE chat_threads.id = chat_messages.thread_id
      AND chat_threads.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Staff can manage chat messages" ON public.chat_messages;
CREATE POLICY "Staff can manage chat messages"
ON public.chat_messages
FOR ALL TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- ============================================================================
-- 5. REALTIME PUBLICATION FOR LIVE CHAT
-- ============================================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

COMMIT;

-- ============================================================================
-- 6. VERIFY
-- ============================================================================

SELECT 'users' AS table_name, COUNT(*) AS rows FROM public.users
UNION ALL SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL SELECT 'products', COUNT(*) FROM public.products
UNION ALL SELECT 'product_images', COUNT(*) FROM public.product_images
UNION ALL SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL SELECT 'order_items', COUNT(*) FROM public.order_items
UNION ALL SELECT 'chat_threads', COUNT(*) FROM public.chat_threads
UNION ALL SELECT 'chat_messages', COUNT(*) FROM public.chat_messages;
