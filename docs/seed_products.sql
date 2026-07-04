-- =========================================================================
-- SUPABASE SEED DATA — Zenith E-Commerce
-- Extracted from: docs/zenith_premium_e_commerce_mockup.html
-- 9 seed users · 3 categories · 8 products · 16 images · 9 reviews
-- Run this AFTER the schema migration (dump.sql)
-- =========================================================================


-- ── 0. SEED USERS ────────────────────────────────────────────────────────────
-- We create one auth user per review author so reviews.user_id NOT NULL is satisfied.
-- These are demo accounts only — not intended for login.
-- Valid hex UUIDs are used to avoid type check errors.

INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
) VALUES
    ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','alex.mercer@zenith.demo',  crypt('SeedPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}','{}', FALSE),
    ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sarah.connor@zenith.demo', crypt('SeedPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}','{}', FALSE),
    ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','evelyn.k@zenith.demo',     crypt('SeedPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}','{}', FALSE),
    ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','daniel.h@zenith.demo',     crypt('SeedPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}','{}', FALSE),
    ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000005','authenticated','authenticated','marcus.v@zenith.demo',     crypt('SeedPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}','{}', FALSE),
    ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000006','authenticated','authenticated','code.master@zenith.demo',  crypt('SeedPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}','{}', FALSE),
    ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000007','authenticated','authenticated','runner.girl@zenith.demo',  crypt('SeedPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}','{}', FALSE),
    ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000008','authenticated','authenticated','hiker.joe@zenith.demo',    crypt('SeedPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}','{}', FALSE),
    ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000009','authenticated','authenticated','clara.s@zenith.demo',      crypt('SeedPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}','{}', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Trigger handle_new_user automatically inserts into public.users when auth.users is inserted.
-- We run an UPSERT on public.users to update details like first_name and last_name from the mockup.
INSERT INTO public.users (id, email, oauth_provider, oauth_id, role, first_name, last_name)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'alex.mercer@zenith.demo',  'email', 'alex.mercer@zenith.demo',  'customer', 'Alex',   'Mercer'),
    ('00000000-0000-0000-0000-000000000002', 'sarah.connor@zenith.demo', 'email', 'sarah.connor@zenith.demo', 'customer', 'Sarah',  'Connor'),
    ('00000000-0000-0000-0000-000000000003', 'evelyn.k@zenith.demo',     'email', 'evelyn.k@zenith.demo',     'customer', 'Evelyn', 'K.'),
    ('00000000-0000-0000-0000-000000000004', 'daniel.h@zenith.demo',     'email', 'daniel.h@zenith.demo',     'customer', 'Daniel', 'H.'),
    ('00000000-0000-0000-0000-000000000005', 'marcus.v@zenith.demo',     'email', 'marcus.v@zenith.demo',     'customer', 'Marcus', 'V.'),
    ('00000000-0000-0000-0000-000000000006', 'code.master@zenith.demo',  'email', 'code.master@zenith.demo',  'customer', 'Code',   'Master'),
    ('00000000-0000-0000-0000-000000000007', 'runner.girl@zenith.demo',  'email', 'runner.girl@zenith.demo',  'customer', 'Runner', 'Girl'),
    ('00000000-0000-0000-0000-000000000008', 'hiker.joe@zenith.demo',    'email', 'hiker.joe@zenith.demo',    'customer', 'Hiker',  'Joe'),
    ('00000000-0000-0000-0000-000000000009', 'clara.s@zenith.demo',      'email', 'clara.s@zenith.demo',      'customer', 'Clara',  'S.')
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;


-- ── 1. CATEGORIES ────────────────────────────────────────────────────────────

INSERT INTO public.categories (id, name, slug, description)
VALUES
    (1, 'Electronics', 'electronics', 'Cutting-edge tech gadgets and audio equipment'),
    (2, 'Fashion',     'fashion',     'Premium apparel, accessories and footwear'),
    (3, 'Home',        'home',        'Smart home devices and lifestyle essentials')
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.categories_id_seq', 3);


-- ── 2. PRODUCTS ──────────────────────────────────────────────────────────────

INSERT INTO public.products
    (id, category_id, sku, title, slug, description, price, original_price, stock_qty, is_active)
VALUES
    (
        'a1000001-0000-0000-0000-000000000001', 1, 'AERO-SOUND-MAX',
        'AeroSound Max', 'aerosound-max',
        'Experience absolute acoustical tranquility. The AeroSound Max headphones features top-tier hybrid active noise cancellation, custom responsive dynamic audio diaphragms, 45 hours of heavy-duty continuous playback, and ultra-ergonomic protein leather earmuffs.',
        299.99, 349.99, 42, TRUE
    ),
    (
        'a1000002-0000-0000-0000-000000000002', 2, 'CHRONOS-MESH-MIN',
        'Chronos Mesh Minimalist', 'chronos-mesh-minimalist',
        'A signature modern look that defines sophistication. Featuring high-precision Swiss movement architecture, dynamic mineral glass lens housing, and a bespoke surgical-grade stainless steel mesh strap that is fully self-adjustable.',
        149.00, 199.00, 28, TRUE
    ),
    (
        'a1000003-0000-0000-0000-000000000003', 3, 'LUMINA-SMART-LAMP',
        'Lumina Smart Ambient Lamp', 'lumina-smart-ambient-lamp',
        'Transform your surrounding workspace into custom ambient zones. Outfitted with comprehensive smart home hub integrations, dynamic RGB gradient transition animations, custom schedule configurations, and voice assistant trigger arrays.',
        79.50, 99.00, 65, TRUE
    ),
    (
        'a1000004-0000-0000-0000-000000000004', 2, 'TERRA-ORG-HOODIE',
        'Terra Organic Cotton Hoodie', 'terra-organic-cotton-hoodie',
        'Luxurious comfort crafted sustainably. Made using 100% GOTS-certified heavyweight organic cotton. Double-lined cozy hood, robust heavy metallic aglets, and dropped shoulder seam detailing for optimal streetwear silhouette structures.',
        59.00, 75.00, 110, TRUE
    ),
    (
        'a1000005-0000-0000-0000-000000000005', 1, 'ZENITH-MECH-KB',
        'Zenith Mechanical Keyboard', 'zenith-mechanical-keyboard',
        'Elevate your typing acoustics. Built with dynamic linear hot-swappable switches, genuine premium walnut wood integrated wrist support base, double-shot PBT custom profile keycaps, and custom dynamic multi-zone backlight layouts.',
        189.99, 220.00, 19, TRUE
    ),
    (
        'a1000006-0000-0000-0000-000000000006', 2, 'APEX-CARBON-SNKR',
        'Apex Carbon Active Sneakers', 'apex-carbon-active-sneakers',
        'Lighter than air, designed for maximum kinetic response. Integrating custom dual-density EVA high-rebound compound midsoles and fully engineered breathable mesh outer skins that form-fit directly onto your feet contours.',
        120.00, 150.00, 55, TRUE
    ),
    (
        'a1000007-0000-0000-0000-000000000007', 3, 'VIBE-FLASK-950',
        'Vibe Insulated Flask', 'vibe-insulated-flask',
        'Keep cold beverages icy chill for up to 36 hours. Engineered with dual-wall food-grade stainless vacuum technologies. Durable exterior powder-coat finishes that guarantee premium grippy holds and anti-sweat performances.',
        34.99, 42.00, 88, TRUE
    ),
    (
        'a1000008-0000-0000-0000-000000000008', 2, 'SENTRY-RFID-WLLT',
        'Sentry RFID Leather Wallet', 'sentry-rfid-leather-wallet',
        'High security meets minimalist lifestyle profiles. Outfitted with high-potency integrated Faraday cage RFID-blocking fabrics. Holds up to 8 cards and paper currency inside an elegant matte full grain leather construction.',
        45.00, 55.00, 74, TRUE
    )
ON CONFLICT (id) DO NOTHING;


-- ── 3. PRODUCT IMAGES ────────────────────────────────────────────────────────

INSERT INTO public.product_images (product_id, image_url, is_main, sort_order)
VALUES
    -- AeroSound Max
    ('a1000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80', TRUE,  0),
    ('a1000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&h=300&q=80',  FALSE, 1),
    ('a1000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=300&h=300&q=80',  FALSE, 2),
    -- Chronos Mesh Minimalist
    ('a1000002-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&h=600&q=80', TRUE,  0),
    ('a1000002-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=300&h=300&q=80',  FALSE, 1),
    -- Lumina Smart Ambient Lamp
    ('a1000003-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&h=600&q=80', TRUE,  0),
    ('a1000003-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=300&h=300&q=80',  FALSE, 1),
    -- Terra Organic Cotton Hoodie
    ('a1000004-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&h=600&q=80', TRUE,  0),
    ('a1000004-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&h=300&q=80',  FALSE, 1),
    -- Zenith Mechanical Keyboard
    ('a1000005-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&h=600&q=80', TRUE,  0),
    ('a1000005-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=300&h=300&q=80',  FALSE, 1),
    -- Apex Carbon Active Sneakers
    ('a1000006-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&h=600&q=80', TRUE,  0),
    ('a1000006-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=300&h=300&q=80',  FALSE, 1),
    -- Vibe Insulated Flask
    ('a1000007-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&h=600&q=80', TRUE,  0),
    ('a1000007-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=300&h=300&q=80',  FALSE, 1),
    -- Sentry RFID Leather Wallet
    ('a1000008-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&h=600&q=80', TRUE,  0),
    ('a1000008-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1588444839799-beca81d4efe9?auto=format&fit=crop&w=300&h=300&q=80',  FALSE, 1);


-- ── 4. REVIEWS ───────────────────────────────────────────────────────────────
-- Each review references a seed user created in step 0.

INSERT INTO public.reviews (product_id, user_id, rating, comment, created_at)
VALUES
    -- AeroSound Max
    ('a1000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 5, 'The soundstage is wide and active noise isolation works perfect on my flights!',     '2026-06-15T00:00:00Z'),
    ('a1000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 4, 'Comfortable over several continuous hours of work. Strong battery.',                '2026-06-11T00:00:00Z'),
    -- Chronos Mesh Minimalist
    ('a1000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 5, 'Super sleek look, looks extremely rich under soft warm lighting.',                  '2026-05-30T00:00:00Z'),
    -- Lumina Smart Ambient Lamp
    ('a1000003-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 4, 'Syncs instantly with my Google Home configuration. Great visual depth.',            '2026-06-02T00:00:00Z'),
    -- Terra Organic Cotton Hoodie
    ('a1000004-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 5, 'Insanely thick fabric. Feels incredibly high quality compared to fast fashion.',    '2026-06-21T00:00:00Z'),
    -- Zenith Mechanical Keyboard
    ('a1000005-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 5, 'The stock stabilization and lubing is incredible. Deep acoustic ''thock'' sounds.', '2026-06-18T00:00:00Z'),
    -- Apex Carbon Active Sneakers
    ('a1000006-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000007', 4, 'Very snappy spring action on roads. Great arch support.',                           '2026-04-10T00:00:00Z'),
    -- Vibe Insulated Flask
    ('a1000007-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', 5, 'Survived falling down a rocky slope and kept my water ice cold for 2 days!',        '2026-05-15T00:00:00Z'),
    -- Sentry RFID Leather Wallet
    ('a1000008-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000009', 4, 'Holds everything tightly. Minimal pocket bulge. Elegant texture.',                  '2026-06-29T00:00:00Z');


-- ── 5. VERIFY ────────────────────────────────────────────────────────────────
--   SELECT COUNT(*) FROM auth.users        WHERE email LIKE '%@zenith.demo'; -- 9
--   SELECT COUNT(*) FROM public.users;      -- 9
--   SELECT COUNT(*) FROM public.categories; -- 3
--   SELECT COUNT(*) FROM public.products;   -- 8
--   SELECT COUNT(*) FROM public.product_images; -- 16
--   SELECT COUNT(*) FROM public.reviews;    -- 9
-- =========================================================================
