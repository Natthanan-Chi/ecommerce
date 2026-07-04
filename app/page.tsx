"use client";

import React, { useState, useEffect } from "react";
import { fetchProducts, Product } from "../data/products";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Catalog from "../components/Catalog";
import ProductDetailModal from "../components/ProductDetailModal";
import CartDrawer from "../components/CartDrawer";
import CheckoutModal from "../components/CheckoutModal";
import ReceiptModal, { CompletedOrder } from "../components/ReceiptModal";
import OrderHistoryModal from "../components/OrderHistoryModal";
import Toast from "../components/Toast";
import { Sparkles, Loader2 } from "lucide-react";

export default function Home() {
  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("featured");

  // Cart State
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeText, setPromoCodeText] = useState("");

  // Orders State
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<CompletedOrder | null>(null);

  // Modals Visibility
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Theme State
  const [isDark, setIsDark] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState("");
  const [toastIcon, setToastIcon] = useState("info");
  const [toastVisible, setToastVisible] = useState(false);

  // Load theme on startup
  useEffect(() => {
    const root = document.documentElement;
    const hasDarkClass = root.classList.contains("dark");
    const timer = setTimeout(() => {
      setIsDark(hasDarkClass);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch products from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoadingProducts(true);
    setProductsError(null);
    fetchProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setProductsError(err.message ?? "Failed to load products");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const triggerToast = (message: string, iconName = "info") => {
    setToastMessage(message);
    setToastIcon(iconName);
    setToastVisible(true);
  };

  const handleDismissToast = () => {
    setToastVisible(false);
  };

  const handleToggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      triggerToast("Dark theme applied", "sun");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      triggerToast("Light theme applied", "moon");
    }
  };

  const handleAddToCart = (productId: string, qty = 1) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, qty: item.qty + qty }
            : item
        );
      } else {
        return [...prev, { product: targetProduct!, qty }];
      }
    });

    triggerToast(`Added ${qty}x ${targetProduct.title} to Bag`, "shopping-bag");
  };

  const handleAdjustCartQty = (productId: string, amount: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;

      const nextQty = item.qty + amount;
      if (nextQty <= 0) {
        triggerToast(`Removed ${item.product.title} from Bag`, "trash-2");
        return prev.filter((i) => i.product.id !== productId);
      }

      return prev.map((i) =>
        i.product.id === productId ? { ...i, qty: nextQty } : i
      );
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    triggerToast(`Removed ${item.product.title} from Bag`, "trash-2");
  };

  const handleApplyPromo = (code: string) => {
    if (code === "ZENITH20") {
      setPromoDiscount(0.2); // 20% off
      setPromoCodeText("ZENITH20");
      triggerToast("Promo code applied: 20% discount!", "gift");
    } else if (code === "") {
      setPromoDiscount(0);
      setPromoCodeText("");
    } else {
      setPromoDiscount(0);
      setPromoCodeText("");
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (
    recipientName: string,
    recipientEmail: string,
    recipientAddress: string
  ) => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const discountVal = subtotal * promoDiscount;
    const finalSubtotal = subtotal - discountVal;
    const taxVal = finalSubtotal * 0.0825;
    const totalVal = finalSubtotal + taxVal;

    const receiptId = "#ZN-" + Math.floor(10000 + Math.random() * 90000);
    const receiptDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const newOrder: CompletedOrder = {
      id: receiptId,
      date: receiptDate,
      recipient: recipientName,
      address: recipientAddress,
      items: [...cart],
      subtotal,
      discount: discountVal,
      tax: taxVal,
      total: totalVal,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
    triggerToast("Payment Authorized. Order Confirmed!", "check-circle");
  };

  const handleAddReview = (
    productId: string,
    reviewData: { author: string; rating: number; comment: string }
  ) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === productId) {
          const newReview = {
            author: reviewData.author,
            rating: reviewData.rating,
            date: new Date().toISOString().split("T")[0],
            comment: reviewData.comment,
          };
          const updatedReviews = [newReview, ...p.reviews];
          const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
          const updatedRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));

          const updatedProduct = {
            ...p,
            reviews: updatedReviews,
            rating: updatedRating,
          };

          // Synchronize details modal view immediately
          if (selectedProduct && selectedProduct.id === productId) {
            setSelectedProduct(updatedProduct);
          }

          return updatedProduct;
        }
        return p;
      })
    );

    triggerToast("Review published successfully!", "check-circle");
  };

  const handleResetFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
    setSortOption("featured");
    triggerToast("Catalog filters reset", "filter");
  };

  const handleShopCatalogClick = () => {
    document.getElementById("catalog-controls")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleExploreElectronicsClick = () => {
    setActiveCategory("Electronics");
    handleShopCatalogClick();
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      {/* Navigation Header */}
      <Header
        searchVal={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartTotalItems}
        hasOrders={orders.length > 0}
        isDark={isDark}
        toggleTheme={handleToggleTheme}
        onCartClick={() => setIsCartOpen(true)}
        onHistoryClick={() => setIsHistoryOpen(true)}
        onResetFilters={handleResetFilters}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <Hero
          onShopCatalogClick={handleShopCatalogClick}
          onExploreElectronicsClick={handleExploreElectronicsClick}
        />

        {/* Dynamic Products Catalog */}
        {isLoadingProducts ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-600">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading products&hellip;</p>
          </div>
        ) : productsError ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-red-500 font-semibold text-sm mb-2">Failed to load products</p>
            <p className="text-slate-400 text-xs">{productsError}</p>
          </div>
        ) : (
          <Catalog
            products={products}
            onProductClick={(id) => {
              const prod = products.find((p) => p.id === id) || null;
              setSelectedProduct(prod);
            }}
            onAddToCart={(id) => handleAddToCart(id, 1)}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onResetFilters={handleResetFilters}
          />
        )}
      </main>

      {/* Footer Details */}
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

      {/* Interactive Overlays/Modals */}
      {selectedProduct && (
        <ProductDetailModal
          key={selectedProduct.id}
          isOpen={selectedProduct !== null}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onAddReview={handleAddReview}
        />
      )}

      {isCartOpen && (
        <CartDrawer
          key="cart-drawer"
          isOpen={isCartOpen}
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onAdjustQty={handleAdjustCartQty}
          onRemoveItem={handleRemoveCartItem}
          promoDiscount={promoDiscount}
          promoCodeText={promoCodeText}
          onApplyPromo={handleApplyPromo}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal
          key="checkout-modal"
          isOpen={isCheckoutOpen}
          cart={cart}
          onClose={() => setIsCheckoutOpen(false)}
          promoDiscount={promoDiscount}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
      )}

      {isSuccessOpen && currentOrder && (
        <ReceiptModal
          key={currentOrder.id}
          isOpen={isSuccessOpen}
          order={currentOrder}
          onClose={() => setIsSuccessOpen(false)}
          onCopyReceipt={() => triggerToast("Receipt copied to clipboard!", "copy")}
        />
      )}

      {isHistoryOpen && (
        <OrderHistoryModal
          key="history-modal"
          isOpen={isHistoryOpen}
          orders={orders}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      {/* Custom Toast Notifications */}
      <Toast
        message={toastMessage}
        iconName={toastIcon}
        visible={toastVisible}
        onDismiss={handleDismissToast}
      />
    </>
  );
}
