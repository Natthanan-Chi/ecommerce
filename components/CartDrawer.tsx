"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, ShoppingBag, Trash2, Minus, Plus, ShieldCheck } from "lucide-react";
import { Product } from "../data/products";

interface CartItem {
  product: Product;
  qty: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  onAdjustQty: (productId: number, amount: number) => void;
  onRemoveItem: (productId: number) => void;
  promoDiscount: number;
  promoCodeText: string;
  onApplyPromo: (code: string) => void;
  onProceedToCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  cart,
  onClose,
  onAdjustQty,
  onRemoveItem,
  promoDiscount,
  promoCodeText,
  onApplyPromo,
  onProceedToCheckout,
}: CartDrawerProps) {
  const [promoInput, setPromoInput] = useState(promoCodeText);
  const [promoError, setPromoError] = useState("");
  const [animateShow, setAnimateShow] = useState(false);

  // Sync animations asynchronously on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Keep promo input in sync with external promo code state asynchronously
  useEffect(() => {
    const timer = setTimeout(() => {
      setPromoInput(promoCodeText);
    }, 0);
    return () => clearTimeout(timer);
  }, [promoCodeText]);

  // Calculate prices
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  }, [cart]);

  const discountVal = useMemo(() => {
    return subtotal * promoDiscount;
  }, [subtotal, promoDiscount]);

  const finalSubtotal = subtotal - discountVal;
  const taxVal = finalSubtotal * 0.0825; // 8.25%
  const totalVal = finalSubtotal + taxVal;

  if (!isOpen) return null;

  const handleApplyPromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = promoInput.trim().toUpperCase();
    if (formattedCode === "ZENITH20") {
      onApplyPromo("ZENITH20");
      setPromoError("");
    } else if (formattedCode === "") {
      onApplyPromo("");
      setPromoError("");
    } else {
      setPromoError("Invalid coupon code.");
    }
  };

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300 ${
          animateShow ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sliding panel container */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full flex pl-10">
        {/* Panel Content */}
        <div
          className={`w-full bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800 transition-transform duration-300 transform ${
            animateShow ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <ShoppingBag className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-lg font-extrabold">Your Bag</h2>
              <span className="bg-slate-100 dark:bg-slate-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {totalQty} Item{totalQty === 1 ? "" : "s"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close Cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Products list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-650" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Your shopping bag is empty.
                </p>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Explore our futuristic premium goods catalog to load elements.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 transition"
                >
                  {/* Tiny preview image */}
                  <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200/60 dark:border-slate-800">
                    <img
                      src={item.product.mainImage}
                      alt={item.product.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/100x100/6366f1/ffffff?text=X";
                      }}
                      className="object-contain max-h-12 max-w-12"
                    />
                  </div>
                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 mr-2">
                          {item.product.title}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {item.product.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty controls */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-full py-0.5 px-2 bg-white dark:bg-slate-900">
                        <button
                          onClick={() => onAdjustQty(item.product.id, -1)}
                          className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => onAdjustQty(item.product.id, 1)}
                          className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Calculated individual price */}
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white font-sans">
                        ${(item.product.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-4">
            {/* Coupon Code Option */}
            <form onSubmit={handleApplyPromoSubmit} className="space-y-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Coupon Code (ZENITH20)"
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 uppercase placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {promoCodeText === "ZENITH20" && (
                <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold">
                  Promo Code ZENITH20 applied! (20% off)
                </p>
              )}
              {promoError && (
                <p className="text-[11px] text-red-500 font-semibold">{promoError}</p>
              )}
            </form>

            {/* Price Rows */}
            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              {promoDiscount > 0 && subtotal > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                  <span>Discount (Promo Code)</span>
                  <span>-${discountVal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Shipping (Simulated)</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {cart.length > 0 ? "FREE" : "$0.00"}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Estimated Tax</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ${taxVal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold border-t border-slate-200 dark:border-slate-800 pt-3 text-slate-900 dark:text-white">
                <span>Total Due</span>
                <span>${totalVal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-full font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                cart.length === 0
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-brand-600 hover:bg-brand-500 active:scale-[0.99] text-white shadow-brand-500/10"
              }`}
            >
              <span>Proceed to Secure Checkout</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
