-- Restrict customer order visibility to the signed-in owner.
-- Run this in Supabase SQL Editor.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users/admins to view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to place orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin/staff to update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users/admins to view order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow users to insert order items" ON public.order_items;

CREATE POLICY "Allow users/admins to view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_admin_or_staff(auth.uid())
);

CREATE POLICY "Allow users to place orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin/staff to update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_admin_or_staff(auth.uid()))
WITH CHECK (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Allow users/admins to view order items"
ON public.order_items
FOR SELECT
TO authenticated
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

CREATE POLICY "Allow users to insert order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  )
);
