-- Add a public-facing review display name while keeping reviews.user_id
-- for admin/audit identity checks.

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS display_name VARCHAR(80);

COMMENT ON COLUMN public.reviews.display_name IS
  'Optional storefront name shown with a review. Leave NULL to display Anonymous. The reviewer identity remains reviews.user_id.';
