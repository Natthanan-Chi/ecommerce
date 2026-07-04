"use client";

import Header from "../components/Header";
import Hero from "../components/Hero";
import Catalog from "../components/Catalog";
import StorefrontOverlays from "../components/StorefrontOverlays";
import { Sparkles } from "lucide-react";
import { CatalogSkeleton, CustomerErrorState } from "../components/customer/LoadingAndErrorStates";
import { useStorefront } from "../hooks/useStorefront";

export default function Home() {
  const store = useStorefront();

  const handleShopCatalogClick = () => {
    document.getElementById("catalog-controls")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleExploreElectronicsClick = () => {
    store.setActiveCategory("Electronics");
    handleShopCatalogClick();
  };

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Hero
          onShopCatalogClick={handleShopCatalogClick}
          onExploreElectronicsClick={handleExploreElectronicsClick}
        />

        {store.isLoadingProducts ? (
          <CatalogSkeleton />
        ) : store.productsError ? (
          <div className="py-16">
            <CustomerErrorState
              title="Failed to load products"
              message="The catalog could not be loaded. Please retry the request."
              detail={store.productsError}
              onAction={() => void store.reloadProducts()}
            />
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
