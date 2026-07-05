"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Clipboard,
  FolderOpen,
  MapPin,
  MessageCircle,
  Receipt,
  Truck,
  X,
} from "lucide-react";
import { CompletedOrder } from "./ReceiptModal";

interface OrderHistoryModalProps {
  isOpen: boolean;
  orders: CompletedOrder[];
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onAskAboutOrder?: (order: CompletedOrder) => void;
  onCopyOrderId?: (orderId: string) => void;
}

function statusClass(status: CompletedOrder["status"]) {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "SHIPPED":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300";
    case "CANCELLED":
      return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
    case "PAID":
      return "bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300";
    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
  }
}

function statusLabel(status: CompletedOrder["status"]) {
  return status ?? "PENDING";
}

export default function OrderHistoryModal({
  isOpen,
  orders,
  isLoading = false,
  error = null,
  onClose,
  onAskAboutOrder,
  onCopyOrderId,
}: OrderHistoryModalProps) {
  const [animateShow, setAnimateShow] = useState(false);

  // Sync animations asynchronously on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-350 ${
          animateShow ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Card Content */}
      <div
        className={`relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 transition-all duration-300 transform ${
          animateShow ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 transition cursor-pointer"
          aria-label="Close Order History"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5 pr-10">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-green-500" /> Your Purchase History
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track fulfillment, review items, and contact support about any order.
          </p>
        </div>

        {isLoading ? (
          <div aria-busy="true" aria-live="polite" className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <div className="mb-4 flex justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="h-16 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : orders.length === 0 ? (
          /* History Empty State */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="w-10 h-10 text-slate-305 dark:text-slate-700 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You haven&apos;t purchased anything yet.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-brand-500"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          /* Orders list */
          <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
            {orders.map((ord) => {
              const itemCount = ord.items.reduce((sum, item) => sum + item.qty, 0);
              const orderLabel = ord.id.startsWith("#") ? ord.id : `#${ord.id.slice(0, 8).toUpperCase()}`;
              const shipping = ord.shipping ?? 0;
              return (
                <div
                  key={ord.id}
                  className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-brand-600 dark:text-brand-400">
                          {orderLabel}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(ord.status)}`}>
                          {statusLabel(ord.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        Ordered {ord.date} • {itemCount} item{itemCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Grand Total
                      </p>
                      <p className="text-lg font-extrabold text-slate-950 dark:text-white">
                        ${ord.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_240px]">
                    <div className="space-y-2">
                      {ord.items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {item.product.title}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {item.product.category} • Qty {item.qty}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-extrabold text-slate-900 dark:text-white">
                            ${(item.product.price * item.qty).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-2 flex items-center gap-1.5 text-slate-500">
                          <Truck className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">
                            Tracking
                          </span>
                        </div>
                        <p className="break-words text-xs font-bold text-slate-800 dark:text-slate-200">
                          {ord.trackingNumber || "Tracking not available yet"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-2 flex items-center gap-1.5 text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">
                            Ship To
                          </span>
                        </div>
                        <p className="line-clamp-3 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                          {ord.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-4 text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase">Subtotal</p>
                      <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                        ${ord.subtotal.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase">Discount</p>
                      <p className="mt-1 font-extrabold text-emerald-600 dark:text-emerald-400">
                        -${ord.discount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase">Tax</p>
                      <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                        ${ord.tax.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase">Shipping</p>
                      <p className="mt-1 font-extrabold text-slate-900 dark:text-white">
                        {shipping > 0 ? `$${shipping.toFixed(2)}` : "FREE"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => onCopyOrderId?.(ord.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Clipboard className="h-4 w-4" />
                      Copy order ID
                    </button>
                    <button
                      type="button"
                      onClick={() => onAskAboutOrder?.(ord)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-extrabold text-brand-700 transition hover:border-brand-400 hover:bg-brand-100 dark:border-brand-900/60 dark:bg-brand-950/40 dark:text-brand-300"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Ask about this order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
