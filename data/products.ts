import { supabase } from "../lib/supabase";

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

// ---------------------------------------------------------------------------
// Supabase row shape (raw response from the joined query)
// ---------------------------------------------------------------------------

interface SupabaseReview {
  rating: number;
  comment: string;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
  } | null;
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
  // Spec fields stored as JSON metadata in the description or separate columns
  // We fall back to sensible defaults when not present in the DB schema.
}

// ---------------------------------------------------------------------------
// Mapper: Supabase row → Product shape used by the UI
// ---------------------------------------------------------------------------

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
    // Specs are not in the DB schema — provide empty defaults so existing
    // components don't break. Populate these columns in the DB when ready.
    specs: {
      warranty: "",
      materials: "",
      dimensions: "",
    },
    reviews,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
