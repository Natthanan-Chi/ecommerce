"use client";

import React, { useState, useEffect } from "react";
import { X, Receipt, Package, MapPin, FolderOpen } from "lucide-react";
import { CompletedOrder } from "./ReceiptModal";

interface OrderHistoryModalProps {
  isOpen: boolean;
  orders: CompletedOrder[];
  onClose: () => void;
}

export default function OrderHistoryModal({
  isOpen,
  orders,
  onClose,
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
        className={`relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 transition-all duration-300 transform ${
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

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-green-500" /> Your Purchase History
        </h3>

        {orders.length === 0 ? (
          /* History Empty State */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="w-10 h-10 text-slate-305 dark:text-slate-700 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You haven&apos;t purchased anything in this session yet.
            </p>
          </div>
        ) : (
          /* Orders list */
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {orders.map((ord) => {
              const itemSummary = ord.items
                .map((i) => `${i.product.title} (x${i.qty})`)
                .join(", ");
              return (
                <div
                  key={ord.id}
                  className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex justify-between items-center font-bold mb-2">
                    <span className="text-brand-600 dark:text-brand-400 font-extrabold">
                      {ord.id}
                    </span>
                    <span className="text-slate-400 font-semibold">{ord.date}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate" title={itemSummary}>
                      {itemSummary}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-300 font-medium mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate" title={ord.address}>
                      {ord.address}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200/50 dark:border-slate-800/50 pt-2 text-slate-900 dark:text-white font-extrabold text-sm font-sans">
                    <span>Grand Total</span>
                    <span>${ord.total.toFixed(2)}</span>
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
