"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Pencil,
  Trash2,
  Package,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Tag,
  BarChart3,
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  fetchProductById,
  deleteProduct,
  type AdminProduct,
} from "../../../data/products";

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
        active
          ? "bg-green-950/50 text-green-400 border-green-900"
          : "bg-red-950/50 text-red-400 border-red-900"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-400" : "bg-red-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 shrink-0 w-28">{label}</span>
      <span className="text-xs text-slate-300 text-right">{value}</span>
    </div>
  );
}

// ── Image gallery sub-component ───────────────────────────────────────────────

function ImageGallery({ product }: { product: AdminProduct }) {
  const sorted = [...product.product_images].sort((a, b) => {
    if (a.is_main) return -1;
    if (b.is_main) return 1;
    return a.sort_order - b.sort_order;
  });
  const [selected, setSelected] = useState(sorted[0]?.image_url ?? "");

  if (sorted.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
        <div className="text-center space-y-2 text-slate-600">
          <Package className="w-16 h-16 mx-auto opacity-20" />
          <p className="text-sm">No images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {selected ? (
          <img src={selected} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-slate-700" />
          </div>
        )}
      </div>
      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(img.image_url)}
              className={`w-16 h-16 rounded-xl shrink-0 overflow-hidden border-2 transition cursor-pointer ${
                selected === img.image_url
                  ? "border-brand-500"
                  : "border-slate-700 hover:border-slate-500"
              }`}
            >
              <img src={img.image_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Delete modal ──────────────────────────────────────────────────────────────

function DeleteModal({
  product,
  onConfirm,
  onCancel,
  loading,
}: {
  product: AdminProduct;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-950/60 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Deactivate Product?</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customers will no longer see this product
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-300 mb-6">
          Deactivate{" "}
          <span className="font-semibold text-white">{product.title}</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchProductById(id)
      .then(setProduct)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      router.push("/products");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to deactivate");
      setDeleting(false);
      setShowDelete(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 text-slate-500 gap-3">
        <Loader2 className="w-7 h-7 animate-spin" />
        <span className="text-sm">Loading product…</span>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="p-8 text-center space-y-3">
        <Package className="w-12 h-12 mx-auto text-slate-700" />
        <p className="text-red-400 font-semibold">Product not found</p>
        <p className="text-slate-500 text-sm">{error}</p>
        <Link href="/products" className="text-brand-400 hover:text-brand-300 text-sm underline">
          Back to Products
        </Link>
      </div>
    );
  }

  const discountPct =
    product.original_price && Number(product.original_price) > Number(product.price)
      ? Math.round((1 - Number(product.price) / Number(product.original_price)) * 100)
      : null;

  return (
    <>
      <div className="p-8 max-w-screen-xl">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
            <Link href="/products" className="hover:text-slate-300 transition-colors">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-300 truncate max-w-[200px]">{product.title}</span>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={`/products/${product.id}/edit`}
              id="edit-product-link"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-brand-900/30"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Link>
            <button
              id="deactivate-product-btn"
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-950/60 hover:bg-red-950 text-red-400 hover:text-red-300 rounded-xl text-sm font-bold transition border border-red-900 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Deactivate
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left — gallery */}
          <ImageGallery product={product} />

          {/* Right — details */}
          <div className="space-y-5">
            {/* Status + category */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge active={product.is_active} />
              {product.categories && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                  <Tag className="w-3 h-3" />
                  {product.categories.name}
                </span>
              )}
            </div>

            {/* Title + SKU */}
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                {product.title}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1.5">SKU: {product.sku}</p>
            </div>

            {/* Pricing */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-extrabold text-white">
                  ${Number(product.price).toFixed(2)}
                </span>
                {product.original_price && (
                  <>
                    <span className="text-xl text-slate-500 line-through mb-1">
                      ${Number(product.original_price).toFixed(2)}
                    </span>
                    {discountPct && (
                      <span className="mb-1 text-xs font-bold text-green-400 bg-green-950/50 px-2 py-0.5 rounded-full border border-green-900">
                        -{discountPct}%
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">Stock:</span>
                <span
                  className={`font-bold ${
                    product.stock_qty === 0
                      ? "text-red-400"
                      : product.stock_qty < 10
                      ? "text-amber-400"
                      : "text-white"
                  }`}
                >
                  {product.stock_qty} units
                </span>
                {product.stock_qty === 0 && (
                  <span className="text-red-400">— Out of stock</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Description
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Metadata */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Metadata
              </h3>
              <InfoRow
                label="Slug"
                value={<span className="font-mono text-brand-400">{product.slug}</span>}
              />
              <InfoRow label="Images" value={`${product.product_images.length} image(s)`} />
              <InfoRow
                label="Status"
                value={
                  product.is_active ? (
                    <span className="flex items-center gap-1 text-green-400 justify-end">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 justify-end">
                      <XCircle className="w-3 h-3" /> Inactive
                    </span>
                  )
                }
              />
              <InfoRow
                label="Created"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(product.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                }
              />
              <InfoRow
                label="Updated"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(product.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                }
              />
              <InfoRow
                label="ID"
                value={
                  <span className="font-mono text-[10px] text-slate-600">
                    <Hash className="w-3 h-3 inline mr-0.5" />
                    {product.id}
                  </span>
                }
              />
            </div>

            {/* Storefront link */}
            {product.is_active && (
              <a
                href={`/?product=${product.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on storefront
              </a>
            )}
          </div>
        </div>
      </div>

      {showDelete && (
        <DeleteModal
          product={product}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}
    </>
  );
}
