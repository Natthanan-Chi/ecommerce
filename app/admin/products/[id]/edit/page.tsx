"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Loader2, Package } from "lucide-react";
import {
  fetchProductById,
  type AdminProduct,
  type ProductFormData,
} from "../../../../../data/products";
import ProductForm from "../../../../../components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchProductById(id)
      .then(setProduct)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40 text-slate-500 gap-3">
        <Loader2 className="w-7 h-7 animate-spin" />
        <span className="text-sm">Loading product…</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center space-y-3">
        <Package className="w-12 h-12 mx-auto text-slate-700" />
        <p className="text-red-400 font-semibold">Product not found</p>
        <p className="text-slate-500 text-sm">{error}</p>
        <Link href="/admin/products" className="text-brand-400 hover:text-brand-300 text-sm underline">
          Back to Products
        </Link>
      </div>
    );
  }

  // Map AdminProduct → ProductFormData for the form's initialData
  const initialData: ProductFormData = {
    sku: product.sku ?? "",
    title: product.title,
    slug: product.slug ?? "",
    description: product.description,
    price: Number(product.price),
    original_price: product.original_price ? Number(product.original_price) : null,
    stock_qty: product.stock_qty ?? 0,
    is_active: product.is_active,
    category_id: product.category_id,
    images: [...product.product_images]
      .sort((a, b) => {
        if (a.is_main) return -1;
        if (b.is_main) return 1;
        return a.sort_order - b.sort_order;
      })
      .map((img) => ({
        image_url: img.image_url,
        is_main: img.is_main,
        sort_order: img.sort_order,
      })),
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link href="/admin/products" className="hover:text-slate-300 transition-colors">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          href={`/admin/products/${id}`}
          className="hover:text-slate-300 transition-colors truncate max-w-[160px]"
        >
          {product.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-300">Edit</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Edit Product</h1>
        <p className="text-sm text-slate-400 mt-1">
          Update the details for{" "}
          <span className="text-slate-200 font-medium">{product.title}</span>
        </p>
      </div>

      <ProductForm mode="edit" productId={id} initialData={initialData} />
    </div>
  );
}
