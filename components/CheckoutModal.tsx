"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Truck, CreditCard, Lock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Product, createOrder } from "../data/products";

interface CartItem {
  product: Product;
  qty: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  promoDiscount: number;
  onCheckoutSuccess: (
    recipientName: string,
    recipientEmail: string,
    recipientAddress: string
  ) => void;
}

export default function CheckoutModal({
  isOpen,
  cart,
  onClose,
  promoDiscount,
  onCheckoutSuccess,
}: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [animateShow, setAnimateShow] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Sync animations asynchronously on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  }, [cart]);

  const discountVal = useMemo(() => {
    return subtotal * promoDiscount;
  }, [subtotal, promoDiscount]);

  const finalSubtotal = subtotal - discountVal;
  const taxVal = finalSubtotal * 0.0825;
  const totalVal = finalSubtotal + taxVal;

  if (!isOpen) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      await createOrder({
        subtotal: finalSubtotal,
        discount: discountVal,
        tax: taxVal,
        shipping_fee: 0,
        grand_total: totalVal,
        shipping_address: `${address}, ${city}, ${zip}`,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.qty,
          unit_price: item.product.price,
        })),
      });

      setIsProcessing(false);
      onCheckoutSuccess(name, email, `${address}, ${city}, ${zip}`);
    } catch (err) {
      console.error("[Checkout] Order placement failed:", err);
      setError(err instanceof Error ? err.message : "Failed to place order in database.");
      setIsProcessing(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          animateShow ? "opacity-100" : "opacity-0"
        }`}
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Card Content */}
      <div
        className={`relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden transition-all duration-300 transform ${
          animateShow ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close Checkout"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Column: Form details */}
        <div className="w-full md:w-3/5 p-6 sm:p-8">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-600" /> Shipping Details
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                disabled={isProcessing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={isProcessing}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Street Address
              </label>
              <input
                type="text"
                required
                disabled={isProcessing}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Design Blvd"
                className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  disabled={isProcessing}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco"
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Zip Code
                </label>
                <input
                  type="text"
                  required
                  disabled={isProcessing}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="94103"
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Payment Segment */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5 mb-2">
                <CreditCard className="w-4 h-4 text-brand-500" /> Dummy Payment Info
              </h4>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={isProcessing}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 2222 3333 4444"
                  className="w-full text-xs pl-3 pr-10 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  disabled={isProcessing}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
                <input
                  type="password"
                  required
                  disabled={isProcessing}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="CVV"
                  maxLength={4}
                  className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs bg-red-950/60 border border-red-900 text-red-300 mt-4 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg transition shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Secure Payment...</span>
                </>
              ) : (
                <>
                  <span>Place Dummy Order</span>
                  <CheckCircle className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order summary logs */}
        <div className="w-full md:w-2/5 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase mb-4 tracking-wider">
              Order Items
            </h4>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between items-center text-xs pb-1 border-b border-slate-100 dark:border-slate-800"
                >
                  <span className="text-slate-550 dark:text-slate-450 font-semibold truncate max-w-[140px]">
                    {item.product.title}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">x{item.qty}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">
                    ${(item.product.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 space-y-2 font-sans">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-700 dark:text-slate-350">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount</span>
                <span className="font-bold">-${discountVal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-500">
              <span>Tax</span>
              <span className="font-bold text-slate-700 dark:text-slate-350">
                ${taxVal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Final Total</span>
              <span>${totalVal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
