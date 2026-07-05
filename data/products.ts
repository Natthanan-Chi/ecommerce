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

export interface UserProfile {
  id: string;
  email: string;
  role: "customer" | "admin" | "staff" | "support";
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

// ============================================================================
// INTERNAL SUPABASE RAW TYPES  (storefront join shape)
// ============================================================================

interface SupabaseReview {
  rating: number;
  comment: string;
  created_at: string;
  display_name?: string | null;
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

interface SupabaseOrderProduct {
  id: string;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  categories: { name: string } | null;
  product_images: SupabaseProductImage[];
}

interface SupabaseOrderItem {
  quantity: number;
  unit_price: number;
  products: SupabaseOrderProduct | null;
}

interface SupabaseOrder {
  id: string;
  created_at: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  shipping_fee: number;
  grand_total: number;
  shipping_address: string;
  tracking_number: string | null;
  order_items: SupabaseOrderItem[];
}

export interface CustomerOrder {
  id: string;
  date: string;
  createdAt: string;
  status: OrderStatus;
  trackingNumber: string | null;
  address: string;
  items: { product: Product; qty: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface AdminOrderItem {
  quantity: number;
  unit_price: number;
  products: { id: string; title: string } | null;
}

export interface AdminOrder {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  shipping_fee: number;
  grand_total: number;
  shipping_address: string;
  tracking_number: string | null;
  created_at: string;
  users: { email: string; first_name: string; last_name: string } | null;
  order_items: AdminOrderItem[];
}

export interface AdminReview {
  id: number;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  display_name: string | null;
  created_at: string;
  users: { email: string; first_name: string; last_name: string } | null;
  products: { id: string; title: string } | null;
}

export interface AccountReview {
  id: number;
  rating: number;
  comment: string;
  display_name: string | null;
  created_at: string;
  products: { id: string; title: string } | null;
}

export interface ReviewInput {
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  display_name?: string | null;
}

const PRODUCT_SELECT_WITH_REVIEW_DISPLAY_NAME = `
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
    display_name,
    users ( first_name, last_name )
  )
`;

const PRODUCT_SELECT_LEGACY = `
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
`;

const REVIEW_SELECT_WITH_DISPLAY_NAME = `
  id,
  product_id,
  user_id,
  rating,
  comment,
  display_name,
  created_at,
  users ( email, first_name, last_name ),
  products ( id, title )
`;

const REVIEW_SELECT_LEGACY = `
  id,
  product_id,
  user_id,
  rating,
  comment,
  created_at,
  users ( email, first_name, last_name ),
  products ( id, title )
`;

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

  const reviews: Review[] = (row.reviews ?? [])
    .map((r) => {
      const authorName = r.users
        ? `${r.users.first_name} ${r.users.last_name}`.trim()
        : "";
      const displayName = r.display_name?.trim();

      return {
        author: displayName || authorName || "Anonymous",
        rating: r.rating,
        date: r.created_at ? r.created_at.split("T")[0] : "",
        comment: r.comment,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

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

function mapOrderProduct(row: SupabaseOrderProduct, unitPrice: number): Product {
  const images = row.product_images ?? [];
  const mainImage = images.find((img) => img.is_main)?.image_url ?? images[0]?.image_url ?? "";
  const alternateImages = images
    .filter((img) => img.image_url !== mainImage)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.image_url);

  return {
    id: row.id,
    title: row.title,
    category: row.categories?.name ?? "Uncategorized",
    price: Number(unitPrice),
    originalPrice: Number(row.original_price ?? row.price ?? unitPrice),
    description: row.description ?? "",
    mainImage,
    alternateImages,
    rating: 0,
    specs: { warranty: "", materials: "", dimensions: "" },
    reviews: [],
  };
}

// ============================================================================
// STOREFRONT API
// ============================================================================

export async function fetchProducts(): Promise<Product[]> {
  const initialResult = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_REVIEW_DISPLAY_NAME)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  let data = initialResult.data as unknown[] | null;
  let error = initialResult.error;

  if (error && error.message.includes("display_name")) {
    const legacyResult = await supabase
      .from("products")
      .select(PRODUCT_SELECT_LEGACY)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    data = legacyResult.data as unknown[] | null;
    error = legacyResult.error;
  }

  if (error) {
    console.error("[fetchProducts] Supabase error:", error.message);
    return [];
  }

  return ((data ?? []) as SupabaseProduct[]).map(mapProduct);
}

export async function fetchCurrentUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, first_name, last_name, avatar_url")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[fetchCurrentUserProfile] Supabase error:", error.message);
    return null;
  }

  return data as UserProfile;
}

export async function fetchMyOrders(userId: string): Promise<CustomerOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      status,
      subtotal,
      discount,
      tax,
      shipping_fee,
      grand_total,
      shipping_address,
      tracking_number,
      order_items (
        quantity,
        unit_price,
        products (
          id,
          title,
          description,
          price,
          original_price,
          categories ( name ),
          product_images ( image_url, is_main, sort_order )
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchMyOrders] Supabase error:", error.message);
    return [];
  }

  return ((data as unknown[]) as SupabaseOrder[]).map((order) => ({
    id: order.id,
    createdAt: order.created_at,
    date: new Date(order.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    status: order.status,
    trackingNumber: order.tracking_number,
    address: order.shipping_address,
    items: (order.order_items ?? [])
      .filter((item) => item.products)
      .map((item) => ({
        product: mapOrderProduct(item.products!, item.unit_price),
        qty: item.quantity,
      })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax),
    shipping: Number(order.shipping_fee),
    total: Number(order.grand_total),
  }));
}

export async function createReview(input: ReviewInput): Promise<Review> {
  const displayName = input.display_name?.trim() || null;
  const initialResult = await supabase
    .from("reviews")
    .insert({
      product_id: input.product_id,
      user_id: input.user_id,
      rating: input.rating,
      comment: input.comment,
      display_name: displayName,
    })
    .select("rating, comment, created_at, display_name")
    .single();

  let data = initialResult.data as unknown;
  let error = initialResult.error;

  if (error && error.message.includes("display_name")) {
    const legacyResult = await supabase
      .from("reviews")
      .insert({
        product_id: input.product_id,
        user_id: input.user_id,
        rating: input.rating,
        comment: input.comment,
      })
      .select("rating, comment, created_at")
      .single();

    data = legacyResult.data as unknown;
    error = legacyResult.error;
  }

  if (error) throw new Error(error.message);

  const row = data as {
    rating: number;
    comment: string;
    created_at: string;
    display_name?: string | null;
  };
  return {
    author: row.display_name?.trim() || displayName || "Anonymous",
    rating: row.rating,
    date: row.created_at ? row.created_at.split("T")[0] : "",
    comment: row.comment,
  };
}

export async function fetchMyReviews(userId: string): Promise<AccountReview[]> {
  const initialResult = await supabase
    .from("reviews")
    .select(
      `
      id,
      rating,
      comment,
      display_name,
      created_at,
      products ( id, title )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  let data = initialResult.data as unknown[] | null;
  let error = initialResult.error;

  if (error && error.message.includes("display_name")) {
    const legacyResult = await supabase
      .from("reviews")
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        products ( id, title )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    data = legacyResult.data as unknown[] | null;
    error = legacyResult.error;
  }

  if (error) {
    console.error("[fetchMyReviews] Supabase error:", error.message);
    return [];
  }

  return ((data ?? []) as AccountReview[]).map((review) => ({
    ...review,
    display_name: review.display_name ?? null,
  }));
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

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      user_id,
      status,
      subtotal,
      discount,
      tax,
      shipping_fee,
      grand_total,
      shipping_address,
      tracking_number,
      created_at,
      users ( email, first_name, last_name ),
      order_items (
        quantity,
        unit_price,
        products ( id, title )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchAdminOrders] Supabase error:", error.message);
    return [];
  }

  return ((data ?? []) as unknown[]) as AdminOrder[];
}

export async function updateOrderAdminFields(
  orderId: string,
  values: { status: OrderStatus; tracking_number: string | null }
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: values.status,
      tracking_number: values.tracking_number,
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

export async function fetchAdminReviews(): Promise<AdminReview[]> {
  const initialResult = await supabase
    .from("reviews")
    .select(REVIEW_SELECT_WITH_DISPLAY_NAME)
    .order("created_at", { ascending: false });

  let data = initialResult.data as unknown[] | null;
  let error = initialResult.error;

  if (error && error.message.includes("display_name")) {
    const legacyResult = await supabase
      .from("reviews")
      .select(REVIEW_SELECT_LEGACY)
      .order("created_at", { ascending: false });

    data = legacyResult.data as unknown[] | null;
    error = legacyResult.error;
  }

  if (error) {
    console.error("[fetchAdminReviews] Supabase error:", error.message);
    return [];
  }

  return ((data ?? []) as AdminReview[]).map((review) => ({
    ...review,
    display_name: review.display_name ?? null,
  }));
}

export async function deleteReview(reviewId: number): Promise<void> {
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) throw new Error(error.message);
}

// ============================================================================
// ORDER TYPES & API
// ============================================================================

export interface OrderInput {
  user_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping_fee: number;
  grand_total: number;
  shipping_address: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

/** Insert a new order header and its items into Supabase. */
export async function createOrder(order: OrderInput): Promise<string> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: order.user_id,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      shipping_fee: order.shipping_fee,
      grand_total: order.grand_total,
      shipping_address: order.shipping_address,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const orderId = (data as { id: string }).id;

  if (order.items.length > 0) {
    const { error: itemsErr } = await supabase.from("order_items").insert(
      order.items.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
    );
    if (itemsErr) throw new Error(itemsErr.message);
  }

  return orderId;
}

