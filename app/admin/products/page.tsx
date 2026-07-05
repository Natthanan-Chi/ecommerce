"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  fetchAllProducts,
  deleteProduct,
  type AdminProduct,
} from "../../../data/products";
import {
  AdminErrorState,
  AdminTableSkeleton,
} from "../../../components/admin/AdminLoadingAndErrorStates";

// ── Delete confirmation modal ────────────────────────────────────────────────

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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-fade-in">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-950/60 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Deactivate Product</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              The product will be hidden from the storefront
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-300 mb-6">
          Are you sure you want to deactivate{" "}
          <span className="font-semibold text-white">{product.title}</span>? Customers
          will no longer see it.
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
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{value}</p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchAllProducts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categories?.name ?? "").toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "inactive" && !p.is_active);
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.is_active).length,
      inactive: products.filter((p) => !p.is_active).length,
      outOfStock: products.filter((p) => p.stock_qty === 0).length,
    }),
    [products]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) =>
        prev.map((p) => (p.id === deleteTarget.id ? { ...p, is_active: false } : p))
      );
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to deactivate");
    } finally {
      setDeleting(false);
    }
  };

  const thumbOf = (p: AdminProduct) =>
    p.product_images.find((i) => i.is_main)?.image_url ??
    p.product_images[0]?.image_url ??
    null;

  const filterButtonClass = (status: "all" | "active" | "inactive") => {
    const base =
      "px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer";

    if (statusFilter === status) {
      if (status === "active") {
        return `${base} bg-emerald-600 text-white shadow shadow-emerald-900/20 dark:bg-emerald-500 dark:text-slate-950`;
      }

      if (status === "inactive") {
        return `${base} bg-red-600 text-white shadow shadow-red-900/20`;
      }

      return `${base} bg-brand-600 text-white shadow shadow-brand-900/30`;
    }

    if (status === "active") {
      return `${base} border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-emerald-800 dark:hover:text-emerald-300`;
    }

    if (status === "inactive") {
      return `${base} border border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-red-900 dark:hover:text-red-300`;
    }

    return `${base} border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white`;
  };

  return (
    <div className="p-8 max-w-screen-xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Products</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          id="add-product-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-brand-900/30"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Products" value={stats.total} icon={Package} color="text-slate-400" />
        <StatCard label="Active" value={stats.active} icon={CheckCircle} color="text-green-400" />
        <StatCard label="Inactive" value={stats.inactive} icon={XCircle} color="text-red-400" />
        <StatCard label="Out of Stock" value={stats.outOfStock} icon={AlertTriangle} color="text-amber-400" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            id="product-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, SKU, or category…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              id={`filter-${s}`}
              onClick={() => setStatusFilter(s)}
              className={filterButtonClass(s)}
            >
              {s}
            </button>
          ))}
          <button
            id="refresh-products"
            onClick={load}
            title="Refresh"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {deleteError && (
        <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="contents [&>span]:sr-only">
          <AdminTableSkeleton rows={7} />
          <span className="sr-only">Loading products</span>
        </div>
      ) : error ? (
        <AdminErrorState
          title="Unable to load products"
          message="The product catalog could not be loaded right now."
          detail={error}
          onAction={load}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-32 text-slate-500 space-y-2">
          <Package className="w-12 h-12 mx-auto opacity-20" />
          <p className="font-medium">No products found</p>
          <p className="text-sm">Adjust your search or filters</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {["Product", "Category", "Price", "Stock", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className={`text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest px-5 py-4 ${
                      h === "" ? "text-right" : ""
                    } ${h === "Category" ? "hidden md:table-cell" : ""} ${
                      h === "Stock" ? "hidden lg:table-cell" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, idx) => {
                const thumb = thumbOf(product);
                const isLast = idx === filtered.length - 1;
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      !isLast ? "border-b border-slate-800/60" : ""
                    }`}
                  >
                    {/* Product */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).style.display = "none")
                              }
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate max-w-[180px]">
                            {product.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">{product.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      {product.categories ? (
                        <span className="text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                          {product.categories.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-white">
                        ${Number(product.price).toFixed(2)}
                      </p>
                      {product.original_price && (
                        <p className="text-[11px] text-slate-500 line-through">
                          ${Number(product.original_price).toFixed(2)}
                        </p>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span
                        className={`text-sm font-bold ${
                          product.stock_qty === 0
                            ? "text-red-400"
                            : product.stock_qty < 10
                            ? "text-amber-400"
                            : "text-white"
                        }`}
                      >
                        {product.stock_qty}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          product.is_active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400"
                            : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.is_active ? "bg-emerald-500 dark:bg-green-400" : "bg-red-500 dark:bg-red-400"
                          }`}
                        />
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/products/${product.id}`}
                          id={`view-${product.id}`}
                          title="View"
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-700 hover:text-white transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          id={`edit-${product.id}`}
                          title="Edit"
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-700 hover:text-white transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          id={`delete-${product.id}`}
                          onClick={() => setDeleteTarget(product)}
                          title="Deactivate"
                          className="p-2 rounded-lg text-slate-500 hover:bg-red-950/50 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-600">
            Showing {filtered.length} of {products.length} products
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteError(null);
            setDeleteTarget(null);
          }}
          loading={deleting}
        />
      )}
    </div>
  );
}
