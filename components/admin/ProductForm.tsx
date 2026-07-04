"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Star,
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  createProduct,
  updateProduct,
  fetchCategories,
  type Category,
  type ProductFormData,
  type ProductImageInput,
} from "../../data/products";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const DEFAULT_FORM: ProductFormData = {
  sku: "",
  title: "",
  slug: "",
  description: "",
  price: 0,
  original_price: null,
  stock_qty: 0,
  is_active: true,
  category_id: null,
  images: [],
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
      <span className="w-5 h-5 rounded bg-brand-600 flex items-center justify-center text-[10px] font-black text-white">
        {step}
      </span>
      {title}
    </h3>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

const INPUT_CLS =
  "w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";

// ── Main component ────────────────────────────────────────────────────────────

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialData?: ProductFormData;
}

export default function ProductForm({ mode, productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(initialData ?? DEFAULT_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slugEdited, setSlugEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  // Auto-generate slug from title unless user edited it manually
  useEffect(() => {
    if (!slugEdited) {
      setForm((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [form.title, slugEdited]);

  const set = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Image helpers ──

  const addImage = () =>
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          image_url: "",
          is_main: prev.images.length === 0,
          sort_order: prev.images.length,
        },
      ],
    }));

  const updateImage = (index: number, patch: Partial<ProductImageInput>) =>
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = { ...images[index], ...patch };
      return { ...prev, images };
    });

  const setMain = (index: number) =>
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, is_main: i === index })),
    }));

  const removeImage = (index: number) =>
    setForm((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      const wasMain = prev.images[index].is_main;
      if (wasMain && images.length > 0) images[0].is_main = true;
      return { ...prev, images: images.map((img, i) => ({ ...img, sort_order: i })) };
    });

  // ── Submit ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      if (mode === "create") {
        const { id } = await createProduct(form);
        setFeedback({ type: "success", message: "Product created successfully!" });
        setTimeout(() => router.push(`/products/${id}`), 1000);
      } else {
        await updateProduct(productId!, form);
        setFeedback({ type: "success", message: "Changes saved successfully!" });
        setTimeout(() => router.push(`/products/${productId}`), 1000);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
      });
      setSubmitting(false);
    }
  };

  const discount =
    form.price > 0 && form.original_price && form.original_price > form.price
      ? Math.round((1 - form.price / form.original_price) * 100)
      : null;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-950/60 border border-green-900 text-green-300"
              : "bg-red-950/60 border border-red-900 text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT — core fields ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <SectionHeader step={1} title="Basic Information" />
            <div className="space-y-4">
              <div>
                <FieldLabel required>Title</FieldLabel>
                <input
                  id="product-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={INPUT_CLS}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>SKU</FieldLabel>
                  <input
                    id="product-sku"
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => set("sku", e.target.value.toUpperCase())}
                    className={`${INPUT_CLS} font-mono`}
                    placeholder="PROD-001"
                  />
                </div>
                <div>
                  <FieldLabel required>Slug</FieldLabel>
                  <input
                    id="product-slug"
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      set("slug", e.target.value);
                    }}
                    className={`${INPUT_CLS} font-mono`}
                    placeholder="product-slug"
                  />
                </div>
              </div>

              <div>
                <FieldLabel required>Description</FieldLabel>
                <textarea
                  id="product-description"
                  required
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={5}
                  className={`${INPUT_CLS} resize-none`}
                  placeholder="Full product description visible to customers…"
                />
              </div>
            </div>
          </div>

          {/* 2. Images */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader step={2} title="Images" />
              <button
                type="button"
                onClick={addImage}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Image
              </button>
            </div>

            {form.images.length === 0 ? (
              <button
                type="button"
                onClick={addImage}
                className="w-full border-2 border-dashed border-slate-700 rounded-xl py-10 flex flex-col items-center gap-2 text-slate-500 hover:border-brand-600/50 hover:text-slate-300 transition cursor-pointer"
              >
                <ImageIcon className="w-8 h-8 opacity-30" />
                <span className="text-sm">Click to add your first image URL</span>
              </button>
            ) : (
              <div className="space-y-3">
                {form.images.map((img, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {/* Preview */}
                    <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
                      {img.image_url ? (
                        <img
                          src={img.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            ((e.target as HTMLImageElement).style.display = "none")
                          }
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    {/* URL */}
                    <input
                      type="url"
                      value={img.image_url}
                      onChange={(e) => updateImage(i, { image_url: e.target.value })}
                      placeholder="https://…/image.jpg"
                      className="flex-1 min-w-0 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                    />

                    {/* Star — set as main */}
                    <button
                      type="button"
                      onClick={() => setMain(i)}
                      title={img.is_main ? "Main image" : "Set as main"}
                      className={`p-2 rounded-lg shrink-0 transition cursor-pointer ${
                        img.is_main
                          ? "bg-amber-500/20 text-amber-400"
                          : "text-slate-600 hover:text-amber-400 hover:bg-amber-500/10"
                      }`}
                    >
                      <Star
                        className="w-4 h-4"
                        fill={img.is_main ? "currentColor" : "none"}
                      />
                    </button>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/30 transition shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-slate-600 pt-1">
                  ★ = main image shown on storefront and in the product list
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT — metadata + actions ── */}
        <div className="space-y-5">
          {/* Status & category */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Product Details</h3>
            <div className="space-y-4">
              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-300">Active</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Visible on storefront</p>
                </div>
                <button
                  id="toggle-active"
                  type="button"
                  onClick={() => set("is_active", !form.is_active)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    form.is_active ? "bg-brand-600" : "bg-slate-700"
                  }`}
                  aria-pressed={form.is_active}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      form.is_active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Category */}
              <div>
                <FieldLabel>Category</FieldLabel>
                <select
                  id="product-category"
                  value={form.category_id ?? ""}
                  onChange={(e) =>
                    set("category_id", e.target.value ? Number(e.target.value) : null)
                  }
                  className={`${INPUT_CLS} appearance-none cursor-pointer`}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock */}
              <div>
                <FieldLabel>Stock Qty</FieldLabel>
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  value={form.stock_qty}
                  onChange={(e) => set("stock_qty", Number(e.target.value))}
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Pricing</h3>
            <div className="space-y-4">
              <div>
                <FieldLabel required>Price</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => set("price", Number(e.target.value))}
                    className={`${INPUT_CLS} pl-7`}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Original Price</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                    $
                  </span>
                  <input
                    id="product-original-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.original_price ?? ""}
                    onChange={(e) =>
                      set("original_price", e.target.value ? Number(e.target.value) : null)
                    }
                    className={`${INPUT_CLS} pl-7`}
                    placeholder="Optional"
                  />
                </div>
              </div>
              {discount !== null && (
                <div className="bg-green-950/40 border border-green-900/50 rounded-xl px-3.5 py-2.5">
                  <p className="text-xs font-bold text-green-400">
                    {discount}% discount badge will be shown
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <button
              id="submit-product-form"
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-brand-900/30 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "create" ? "Creating…" : "Saving…"}
                </>
              ) : mode === "create" ? (
                "Create Product"
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full mt-2 px-4 py-2.5 text-slate-400 hover:text-white text-sm font-medium rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
