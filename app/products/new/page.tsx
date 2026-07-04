"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductForm from "../../../components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-slate-300 transition-colors">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-300">New Product</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Product</h1>
        <p className="text-sm text-slate-400 mt-1">
          Fill in the details below to add a new product to your catalog.
        </p>
      </div>

      <ProductForm mode="create" />
    </div>
  );
}
