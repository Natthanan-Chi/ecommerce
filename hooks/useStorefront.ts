"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import {
  createReview,
  fetchMyOrders,
  fetchProducts,
  type Product,
} from "../data/products";
import type { CompletedOrder } from "../components/ReceiptModal";

const CART_STORAGE_KEY = "zenith:cart-state";
const POST_LOGIN_ACTION_KEY = "zenith:post-login-action";

export type CartItem = { product: Product; qty: number };

interface StoredCartState {
  cart: CartItem[];
  promoDiscount: number;
  promoCodeText: string;
}

export function useStorefront() {
  const {
    isLoading: isAuthLoading,
    user,
    displayName,
    signOut,
  } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("featured");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeText, setPromoCodeText] = useState("");
  const [hasHydratedCart, setHasHydratedCart] = useState(false);

  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [currentOrder, setCurrentOrder] = useState<CompletedOrder | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [isDark, setIsDark] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [toastIcon, setToastIcon] = useState("info");
  const [toastVisible, setToastVisible] = useState(false);

  const triggerToast = (message: string, iconName = "info") => {
    setToastMessage(message);
    setToastIcon(iconName);
    setToastVisible(true);
  };

  useEffect(() => {
    const root = document.documentElement;
    const hasDarkClass = root.classList.contains("dark");
    const timer = setTimeout(() => {
      setIsDark(hasDarkClass);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Partial<StoredCartState>;
          if (Array.isArray(stored.cart)) {
            setCart(
              stored.cart.filter(
                (item): item is CartItem =>
                  Boolean(item?.product?.id) &&
                  Number.isFinite(item?.qty) &&
                  item.qty > 0
              )
            );
          }
          setPromoDiscount(
            typeof stored.promoDiscount === "number" ? stored.promoDiscount : 0
          );
          setPromoCodeText(
            typeof stored.promoCodeText === "string" ? stored.promoCodeText : ""
          );
        }
      } catch (err) {
        console.warn("[cart] Failed to restore saved cart:", err);
        localStorage.removeItem(CART_STORAGE_KEY);
      } finally {
        setHasHydratedCart(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasHydratedCart) return;

    const state: StoredCartState = {
      cart,
      promoDiscount,
      promoCodeText,
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [cart, hasHydratedCart, promoDiscount, promoCodeText]);

  useEffect(() => {
    if (!hasHydratedCart || isAuthLoading || !user || cart.length === 0) return;

    const timer = setTimeout(() => {
      if (localStorage.getItem(POST_LOGIN_ACTION_KEY) !== "checkout") return;
      localStorage.removeItem(POST_LOGIN_ACTION_KEY);
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
      triggerToast("Welcome back. Your bag is ready for checkout.", "shopping-bag");
    }, 0);

    return () => clearTimeout(timer);
  }, [cart.length, hasHydratedCart, isAuthLoading, user]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (isAuthLoading) return;

      if (!user) {
        setOrders([]);
        setOrdersError(null);
        setIsLoadingOrders(false);
        return;
      }

      setIsLoadingOrders(true);
      setOrdersError(null);

      void fetchMyOrders()
        .then((data) => {
          if (!cancelled) {
            setOrders(
              data.map((order) => ({
                ...order,
                recipient: displayName || "Customer",
              }))
            );
          }
        })
        .catch((err: Error) => {
          if (!cancelled) {
            setOrdersError(err.message ?? "Unable to load order history.");
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoadingOrders(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [displayName, isAuthLoading, user]);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setProductsError(err.message ?? "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      triggerToast("Signed out successfully", "log-out");
      router.push("/login");
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : "Unable to sign out", "alert-circle");
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
      }

      return [...prev, { product: targetProduct, qty }];
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
      setPromoDiscount(0.2);
      setPromoCodeText("ZENITH20");
      triggerToast("Promo code applied: 20% discount!", "gift");
    } else {
      setPromoDiscount(0);
      setPromoCodeText("");
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    if (isAuthLoading) {
      triggerToast("Checking your sign-in session. Please try again in a moment.", "loader");
      return;
    }
    if (!user) {
      localStorage.setItem(POST_LOGIN_ACTION_KEY, "checkout");
      setIsCartOpen(false);
      triggerToast("Please sign in before confirming your order.", "user-circle");
      handleSignIn();
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleHistoryClick = () => {
    if (isAuthLoading) {
      triggerToast("Checking your sign-in session. Please try again in a moment.", "loader");
      return;
    }

    if (!user) {
      triggerToast("Please sign in to view your purchase history.", "user-circle");
      handleSignIn();
      return;
    }

    setIsHistoryOpen(true);
  };

  const handleRequireSignInForOrder = () => {
    setIsCheckoutOpen(false);
    triggerToast("Please sign in before confirming your order.", "user-circle");
  };

  const handleCheckoutSuccess = (
    orderId: string,
    recipientName: string,
    recipientEmail: string,
    recipientAddress: string
  ) => {
    void recipientEmail;
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const discountVal = subtotal * promoDiscount;
    const finalSubtotal = subtotal - discountVal;
    const taxVal = finalSubtotal * 0.0825;
    const totalVal = finalSubtotal + taxVal;

    const receiptId = `#ZN-${orderId.slice(0, 8).toUpperCase()}`;
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
    setPromoDiscount(0);
    setPromoCodeText("");
    localStorage.removeItem(POST_LOGIN_ACTION_KEY);
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
    triggerToast("Payment Authorized. Order Confirmed!", "check-circle");
  };

  const handleAddReview = async (
    productId: string,
    reviewData: { rating: number; comment: string; displayName?: string | null }
  ) => {
    if (!user) {
      triggerToast("Please sign in before submitting a review.", "user-circle");
      handleSignIn();
      return;
    }

    const savedReview = await createReview({
      product_id: productId,
      user_id: user.id,
      rating: reviewData.rating,
      comment: reviewData.comment,
      display_name: reviewData.displayName,
    });
    const reviewAuthor = reviewData.displayName?.trim() || savedReview.author;

    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id !== productId) return p;

        const newReview = {
          ...savedReview,
          author: reviewAuthor,
        };
        const updatedReviews = [newReview, ...p.reviews];
        const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        const updatedRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));
        const updatedProduct = {
          ...p,
          reviews: updatedReviews,
          rating: updatedRating,
        };

        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(updatedProduct);
        }

        return updatedProduct;
      })
    );

    triggerToast("Review saved successfully!", "check-circle");
  };

  const handleResetFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
    setSortOption("featured");
    triggerToast("Catalog filters reset", "filter");
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return {
    auth: {
      isAuthLoading,
      user,
      displayName,
      handleSignInWithGitHub: handleSignIn,
      handleSignOut,
    },
    products,
    isLoadingProducts,
    productsError,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    cart,
    promoDiscount,
    promoCodeText,
    orders,
    currentOrder,
    isLoadingOrders,
    ordersError,
    selectedProduct,
    setSelectedProduct,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isSuccessOpen,
    setIsSuccessOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    isDark,
    toastMessage,
    toastIcon,
    toastVisible,
    setToastVisible,
    cartTotalItems,
    triggerToast,
    handleToggleTheme,
    handleAddToCart,
    handleAdjustCartQty,
    handleRemoveCartItem,
    handleApplyPromo,
    handleProceedToCheckout,
    handleHistoryClick,
    handleRequireSignInForOrder,
    handleCheckoutSuccess,
    handleAddReview,
    handleResetFilters,
  };
}
