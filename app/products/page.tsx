"use client";

import React from "react";
import Header from "../../components/Header";
import Catalog from "../../components/Catalog";
import StorefrontOverlays from "../../components/StorefrontOverlays";
import { Layers3, Loader2, PackageCheck, SlidersHorizontal, Sparkles, Tag } from "lucide-react";
import { useStorefront } from "../../hooks/useStorefront";

export default function ProductsPage() {
  const store = useStorefront();

  const catalogStats = React.useMemo(() => {
    const categories = new Set(store.products.map((product) => product.category));
    const prices = store.products.map((product) => product.price).filter(Number.isFinite);
    const saleCount = store.products.filter(
      (product) => product.originalPrice > product.price
    ).length;

    return {
      total: store.products.length,
      categories: categories.size,
      saleCount,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    };
  }, [store.products]);

  return (
    <>
      <Header
        searchVal={store.searchQuery}
        onSearchChange={store.setSearchQuery}
        cartCount={store.cartTotalItems}
        hasOrders={store.orders.length > 0}
        isDark={store.isDark}
        toggleTheme={store.handleToggleTheme}
        onCartClick={() => store.setIsCartOpen(true)}
        onHistoryClick={store.handleHistoryClick}
        isAuthLoading={store.auth.isAuthLoading}
        isAuthenticated={Boolean(store.auth.user)}
        authUserName={store.auth.displayName}
        onSignInWithGitHub={store.auth.handleSignInWithGitHub}
        onSignOut={store.auth.handleSignOut}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3">
                Customer Catalog
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Products
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-7 text-slate-600 dark:text-slate-400">
                Browse the full Zenith collection with live search, category filters,
                price sorting, quick view, and cart checkout.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:w-[520px] gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                <PackageCheck className="w-4 h-4 text-brand-500 mb-2" />
                <p className="text-xl font-extrabold text-slate-950 dark:text-white">
                  {catalogStats.total}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">Products</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                <Layers3 className="w-4 h-4 text-emerald-500 mb-2" />
                <p className="text-xl font-extrabold text-slate-950 dark:text-white">
                  {catalogStats.categories}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">Categories</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                <Tag className="w-4 h-4 text-rose-500 mb-2" />
                <p className="text-xl font-extrabold text-slate-950 dark:text-white">
                  {catalogStats.saleCount}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">On Sale</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                <SlidersHorizontal className="w-4 h-4 text-amber-500 mb-2" />
                <p className="text-xl font-extrabold text-slate-950 dark:text-white">
                  ${catalogStats.minPrice.toFixed(0)}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">From</p>
              </div>
            </div>
          </div>
        </section>

        {store.isLoadingProducts ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-600">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading products&hellip;</p>
          </div>
        ) : store.productsError ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-red-500 font-semibold text-sm mb-2">Failed to load products</p>
            <p className="text-slate-400 text-xs">{store.productsError}</p>
          </div>
        ) : (
          <Catalog
            products={store.products}
            onProductClick={(id) => {
              const prod = store.products.find((p) => p.id === id) || null;
              store.setSelectedProduct(prod);
            }}
            onAddToCart={(id) => store.handleAddToCart(id, 1)}
            activeCategory={store.activeCategory}
            onCategoryChange={store.setActiveCategory}
            searchQuery={store.searchQuery}
            onSearchChange={store.setSearchQuery}
            sortOption={store.sortOption}
            onSortChange={store.setSortOption}
            onResetFilters={store.handleResetFilters}
          />
        )}
      </main>

      <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-500 mb-4">
                <Sparkles className="w-6 h-6 text-brand-500" />
                <span className="text-lg font-bold tracking-tight text-brand-600 dark:text-brand-500">
                  ZENITH STORE
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed mb-4">
                A futuristic retail conceptual mockup offering a hyper-fluid buyer interface, dynamic real-time catalog generation, review systems, and realistic checkout pipelines.
              </p>
              <p className="text-slate-450 dark:text-slate-500 text-xs">
                &copy; 2026 Zenith Concepts. Built for modern high-performant web interfaces.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider text-slate-900 dark:text-white mb-4 uppercase">
                Technology Stack
              </h4>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li>Next.js (App Router v16)</li>
                <li>React 19 Hooks & Components</li>
                <li>Tailwind CSS (v4 Theme Config)</li>
                <li>Lucide Vector Icons</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wider text-slate-900 dark:text-white mb-4 uppercase">
                Demo Support
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                You can dynamically test adding products, viewing complex nested reviews, submitting real-time user-generated product ratings, running complete simulated billing procedures, and viewing receipts.
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300">
                  Demo Mode Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <StorefrontOverlays store={store} />
    </>
  );
}
