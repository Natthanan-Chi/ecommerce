import { supabase } from "../lib/supabase";

// ============================================================================
// STOREFRONT TYPES  (customer-facing UI)
// ============================================================================

export interface Review {
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Specs {
  warranty: string;
  materials: string;
  dimensions: string;
}

export interface Product {
  id: string; // UUID from Supabase
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  description: string;
  mainImage: string;
  alternateImages: string[];
  rating: number;
  specs: Specs;
  reviews: Review[];
}

// ============================================================================
// ADMIN TYPES  (raw DB shapes used by the admin panel)
// ============================================================================

export interface AdminProductImage {
  id: number;
  image_url: string;
  is_main: boolean;
  sort_order: number;
}

export interface AdminProduct {
  id: string;
  sku: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  stock_qty: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_id: number | null;
  categories: { id: number; name: string } | null;
  product_images: AdminProductImage[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImageInput {
  image_url: string;
  is_main: boolean;
  sort_order: number;
}

export interface ProductFormData {
  sku: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  stock_qty: number;
  is_active: boolean;
  category_id: number | null;
  images: ProductImageInput[];
}

// ============================================================================
// INTERNAL SUPABASE RAW TYPES  (storefront join shape)
// ============================================================================

interface SupabaseReview {
  rating: number;
  comment: string;
  created_at: string;
  users: { first_name: string; last_name: string } | null;
}

interface SupabaseProductImage {
  image_url: string;
  is_main: boolean;
  sort_order: number;
}

interface SupabaseProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  categories: { name: string } | null;
  product_images: SupabaseProductImage[];
  reviews: SupabaseReview[];
}

// ============================================================================
// MAPPER  (Supabase row → storefront Product)
// ============================================================================

function mapProduct(row: SupabaseProduct): Product {
  const images = row.product_images ?? [];

  const mainImageRow = images.find((img) => img.is_main);
  const mainImage = mainImageRow?.image_url ?? "";

  const alternateImages = images
    .filter((img) => !img.is_main)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.image_url);

  const reviews: Review[] = (row.reviews ?? []).map((r) => ({
    author: r.users
      ? `${r.users.first_name} ${r.users.last_name}`.trim()
      : "Anonymous",
    rating: r.rating,
    date: r.created_at ? r.created_at.split("T")[0] : "",
    comment: r.comment,
  }));

  const rating =
    reviews.length > 0
      ? parseFloat(
          (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        )
      : 0;

  return {
    id: row.id,
    title: row.title,
    category: row.categories?.name ?? "Uncategorized",
    price: Number(row.price),
    originalPrice: Number(row.original_price ?? row.price),
    description: row.description,
    mainImage,
    alternateImages,
    rating,
    // Specs columns not yet in DB schema — empty defaults so components don't break
    specs: { warranty: "", materials: "", dimensions: "" },
    reviews,
  };
}

// ============================================================================
// STOREFRONT API
// ============================================================================

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      title,
      description,
      price,
      original_price,
      categories ( name ),
      product_images ( image_url, is_main, sort_order ),
      reviews (
        rating,
        comment,
        created_at,
        users ( first_name, last_name )
      )
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchProducts] Supabase error:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(mapProduct);
}

// ============================================================================
// ADMIN API
// ============================================================================

const ADMIN_SELECT = `
  id,
  sku,
  title,
  slug,
  description,
  price,
  original_price,
  stock_qty,
  is_active,
  created_at,
  updated_at,
  category_id,
  categories ( id, name ),
  product_images ( id, image_url, is_main, sort_order )
`;

/** Fetch ALL products (including inactive) for the admin panel. */
export async function fetchAllProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchAllProducts] Supabase error:", error.message);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as unknown[]) as AdminProduct[];
}

/** Fetch a single product by UUID for admin view/edit. */
export async function fetchProductById(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[fetchProductById] Supabase error:", error.message);
    return null;
  }
  return data as unknown as AdminProduct;
}

/** Fetch all categories for the category dropdown. */
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  if (error) {
    console.error("[fetchCategories] Supabase error:", error.message);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]) as Category[];
}

/** Insert a new product + its images. Returns the new product UUID. */
export async function createProduct(
  formData: ProductFormData
): Promise<{ id: string }> {
  const { images, ...fields } = formData;

  const { data, error } = await supabase
    .from("products")
    .insert({
      sku: fields.sku,
      title: fields.title,
      slug: fields.slug,
      description: fields.description,
      price: fields.price,
      original_price: fields.original_price,
      stock_qty: fields.stock_qty,
      is_active: fields.is_active,
      category_id: fields.category_id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const productId = (data as { id: string }).id;

  if (images.length > 0) {
    const { error: imgErr } = await supabase.from("product_images").insert(
      images.map((img, i) => ({
        product_id: productId,
        image_url: img.image_url,
        is_main: img.is_main,
        sort_order: img.sort_order ?? i,
      }))
    );
    if (imgErr) console.error("[createProduct] Image insert error:", imgErr.message);
  }

  return { id: productId };
}

/** Update an existing product and re-sync its images. */
export async function updateProduct(
  id: string,
  formData: ProductFormData
): Promise<void> {
  const { images, ...fields } = formData;

  const { error } = await supabase
    .from("products")
    .update({
      sku: fields.sku,
      title: fields.title,
      slug: fields.slug,
      description: fields.description,
      price: fields.price,
      original_price: fields.original_price,
      stock_qty: fields.stock_qty,
      is_active: fields.is_active,
      category_id: fields.category_id,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Sync images: delete existing, re-insert
  await supabase.from("product_images").delete().eq("product_id", id);

  if (images.length > 0) {
    const { error: imgErr } = await supabase.from("product_images").insert(
      images.map((img, i) => ({
        product_id: id,
        image_url: img.image_url,
        is_main: img.is_main,
        sort_order: img.sort_order ?? i,
      }))
    );
    if (imgErr) console.error("[updateProduct] Image sync error:", imgErr.message);
  }
}

/** Soft-delete a product by setting is_active = false. */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
