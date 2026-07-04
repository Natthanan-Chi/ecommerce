"use client";

import React, { useMemo } from "react";
import { Search, ChevronDown, PackageSearch } from "lucide-react";
import { Product } from "../data/products";
import ProductCard from "./ProductCard";

interface CatalogProps {
  products: Product[];
  onProductClick: (id: number) => void;
  onAddToCart: (id: number) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
  onResetFilters: () => void;
}

export default function Catalog({
  products,
  onProductClick,
  onAddToCart,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  onResetFilters,
}: CatalogProps) {
  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const list = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(list)];
  }, [products]);

  // Filter and sort items
  const processedProducts = useMemo(() => {
    const result = products.filter((p) => {
      const matchesCategory =
        activeCategory === "All" || p.category === activeCategory;
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (sortOption === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, activeCategory, searchQuery, sortOption]);

  return (
    <>
      {/* Mobile Search/Category Helper Bar */}
      <div className="md:hidden sticky top-16 z-30 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex space-x-2 backdrop-blur-md">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs transition-all dark:placeholder-slate-400 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Category Pill Bar & Sorting controls */}
      <section id="catalog-controls" className="mb-8 scroll-mt-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap select-none cursor-pointer ${
                    isActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-500/10"
                      : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sorting & Metrics */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing {processedProducts.length} products
            </span>

            <div className="relative inline-block text-left">
              <select
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 text-xs font-semibold rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer text-slate-800 dark:text-slate-200"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      {processedProducts.length > 0 ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {processedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
            />
          ))}
        </section>
      ) : (
        /* Empty State Container */
        <section className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 mb-4">
            <PackageSearch className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
            No products match your filters
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mt-1">
            Try resetting your search query or selecting a different category from above.
          </p>
          <button
            onClick={onResetFilters}
            className="mt-4 px-5 py-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition cursor-pointer"
          >
            Reset All Filters
          </button>
        </section>
      )}
    </>
  );
}
