# New Supabase Database Setup

Use this checklist when the original Supabase project is deleted or when you need a fresh database for Zenith.

## 1. Create a New Supabase Project

1. Create a new Supabase project.
2. Copy the new project URL and anon/publishable key.
3. Update local `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_NEW_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_KEY="YOUR_NEW_PUBLISHABLE_OR_ANON_KEY"
```

4. Update the same variables in Vercel if the app is deployed.

## 2. Run SQL Files

Run these files in Supabase SQL Editor in this order:

1. `docs/00_setup_new_supabase_database.sql`
2. `docs/seed_products.sql`

The first file creates the schema, triggers, RLS policies, live chat tables, and Realtime publication.
The seed file creates demo categories, products, product images, and demo reviews.

## 3. Configure Authentication

In Supabase Dashboard:

1. Enable Email provider.
2. Enable GitHub provider if using GitHub OAuth.
3. Set Site URL:

```text
http://localhost:3000
```

For production, use the Vercel/custom domain.

4. Add Redirect URLs:

```text
http://localhost:3000/auth/callback
http://localhost:3000/**
https://YOUR_DOMAIN/auth/callback
https://YOUR_DOMAIN/**
```

## 4. Create an Admin Account

1. Open the app.
2. Sign up or sign in with the account that should become admin.
3. In Supabase SQL Editor, run:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

Allowed admin panel roles are:

```text
admin
staff
support
```

## 5. Verify Tables

After running setup and seed, this should show data:

```sql
SELECT 'users' AS table_name, COUNT(*) AS rows FROM public.users
UNION ALL SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL SELECT 'products', COUNT(*) FROM public.products
UNION ALL SELECT 'product_images', COUNT(*) FROM public.product_images
UNION ALL SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL SELECT 'order_items', COUNT(*) FROM public.order_items
UNION ALL SELECT 'chat_threads', COUNT(*) FROM public.chat_threads
UNION ALL SELECT 'chat_messages', COUNT(*) FROM public.chat_messages;
```

Expected seed baseline:

- `categories`: 3
- `products`: 8
- `product_images`: 16
- `reviews`: 9
- `users`: at least 9 demo users, plus any real accounts you create

## 6. App Test Checklist

Run locally:

```bash
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

Browser checks:

1. `/` loads product catalog.
2. `/products` filters products.
3. Customer sign in works.
4. Checkout creates an order.
5. `/account` shows only the signed-in user's orders.
6. Review submission works with anonymous/custom display name.
7. `/admin/login` accepts admin/staff/support accounts.
8. `/admin/products` loads all products.
9. `/admin/orders` can update status/tracking.
10. `/admin/reviews` can audit and delete reviews.
11. `/admin/chat` can read/respond to live chat.

## Notes

- If `seed_products.sql` fails on `crypt` or `gen_salt`, confirm that `pgcrypto` is enabled. The setup file already runs `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`.
- If GitHub OAuth redirects fail, check Supabase Auth Redirect URLs first.
- If admin routes block the account, confirm the user's `public.users.role`.
- If Realtime chat does not update instantly, the app still has polling fallback, but confirm Realtime publication includes `chat_threads` and `chat_messages`.
