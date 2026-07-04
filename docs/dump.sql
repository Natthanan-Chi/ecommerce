-- =========================================================================
-- SUPABASE E-COMMERCE DATABASE MIGRATION SCRIPT
-- Tailored for PostgreSQL 15+ and Supabase Auth Integration
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up any existing structures (Optional - use with caution in production)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.order_items CASCADE;
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.reviews CASCADE;
-- DROP TABLE IF EXISTS public.product_images CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- =========================================================================
-- 1. TABLE CREATION
-- =========================================================================

-- TABLE: users (Linked directly to Supabase Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    oauth_provider VARCHAR(50) NOT NULL,
    oauth_id VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff', 'support')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(2048),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_oauth_identity UNIQUE (oauth_provider, oauth_id)
);

-- TABLE: categories (Self-referential hierarchy)
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    parent_id INT REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: products (Catalog Core)
CREATE TABLE public.products (
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

-- TABLE: product_images (Multi-image support per product)
CREATE TABLE public.product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url VARCHAR(2048) NOT NULL,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: reviews (User feedback and ratings)
CREATE TABLE public.reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    display_name VARCHAR(80),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: orders (Transactional headers)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
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

-- TABLE: order_items (Strict snapshot of historical price mapping)
CREATE TABLE public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- =========================================================================
-- 2. HIGH PERFORMANCE INDEXES
-- =========================================================================

CREATE INDEX idx_products_category_active ON public.products(category_id, is_active);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_orders_user_created ON public.orders(user_id, created_at DESC);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_users_oauth ON public.users(oauth_provider, oauth_id);
CREATE INDEX idx_users_role ON public.users(role);

-- =========================================================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- =========================================================================

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to updating tables
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- =========================================================================
-- 4. SUPABASE AUTH INTEGRATION AUTOMATION
-- =========================================================================

-- Trigger function to automatically insert new Supabase Auth sign-ups (OAuth ONLY)
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
    -- Extract the identity provider information from identity metadata
    provider := COALESCE(new.raw_app_meta_data->>'provider', 'oauth');
    prov_id := COALESCE(new.raw_user_meta_data->>'sub', new.id::text);
    
    -- Extract profile metadata from standard OAuth metadata schemas
    u_avatar := COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '');
    full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Valued Customer');
    
    -- Split name helper
    IF POSITION(' ' IN full_name) > 0 THEN
        f_name := SUBSTRING(full_name FROM 1 FOR POSITION(' ' IN full_name) - 1);
        l_name := SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1);
    ELSE
        f_name := full_name;
        l_name := '';
    END IF;

    -- Insert into public.users
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
        new.id,
        new.email,
        provider,
        prov_id,
        'customer', -- Default role for newly registered OAuth users
        f_name,
        l_name,
        u_avatar,
        new.phone,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger directly to Supabase's user creation event
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 5. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable Row Level Security on public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if requesting user is an Admin/Staff
CREATE OR REPLACE FUNCTION public.is_admin_or_staff(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_uuid AND role IN ('admin', 'staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for public.categories
CREATE POLICY "Allow public read access to categories" ON public.categories 
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin/staff write access to categories" ON public.categories 
    FOR ALL TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- Policies for public.products
CREATE POLICY "Allow public read access to active products" ON public.products 
    FOR SELECT TO public USING (is_active = true OR public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Allow admin/staff write access to products" ON public.products 
    FOR ALL TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- Policies for public.product_images
CREATE POLICY "Allow public read access to product images" ON public.product_images 
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin/staff write access to product images" ON public.product_images 
    FOR ALL TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- Policies for public.users (Profiles)
CREATE POLICY "Allow users to view all profiles" ON public.users 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update own profile" ON public.users 
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Policies for public.reviews
CREATE POLICY "Allow public read access to reviews" ON public.reviews 
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated users to write reviews" ON public.reviews 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to manage own reviews" ON public.reviews 
    FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()));

-- Policies for public.orders
CREATE POLICY "Allow users/admins to view their own orders" ON public.orders 
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Allow users to place orders" ON public.orders 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin/staff to update orders" ON public.orders 
    FOR UPDATE TO authenticated USING (public.is_admin_or_staff(auth.uid()));

-- Policies for public.order_items
CREATE POLICY "Allow users/admins to view order items" ON public.order_items 
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR public.is_admin_or_staff(auth.uid()))
        )
    );

CREATE POLICY "Allow users to insert order items" ON public.order_items 
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );
