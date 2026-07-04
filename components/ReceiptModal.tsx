"use client";

import React, { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { Product } from "../data/products";

export interface CompletedOrder {
  id: string;
  date: string;
  recipient: string;
  address: string;
  items: { product: Product; qty: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface ReceiptModalProps {
  isOpen: boolean;
  order: CompletedOrder | null;
  onClose: () => void;
  onCopyReceipt: () => void;
}

export default function ReceiptModal({
  isOpen,
  order,
  onClose,
  onCopyReceipt,
}: ReceiptModalProps) {
  const [animateShow, setAnimateShow] = useState(false);

  // Sync animations asynchronously on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || !order) return null;

  const copyReceiptToClipboard = () => {
    const text = `ZENITH E-COMMERCE MOCKUP RECEIPT\nOrder ID: ${
      order.id
    }\nRecipient: ${order.recipient}\nDate: ${order.date}\nTotal Paid: $${order.total.toFixed(
      2
    )}\nItems:\n${order.items
      .map(
        (i) =>
          `- ${i.product.title} x${i.qty} ($${(i.product.price * i.qty).toFixed(2)})`
      )
      .join("\n")}`;

    navigator.clipboard
      .writeText(text)
      .then(() => onCopyReceipt())
      .catch(() => {
        // Fallback for sandboxed or unsupported environments
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        onCopyReceipt();
      });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity" />

      {/* Success Card Content */}
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 text-center transition-all duration-300 transform ${
          animateShow ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Success icon circle */}
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <Check className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Order Confirmed!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Thank you for shopping. Below is your generated mockup receipt.
        </p>

        {/* Receipt Box */}
        <div className="my-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-left space-y-3 font-mono">
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase">
            <span>Receipt ID</span>
            <span>{order.id}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
            <span>Date</span>
            <span>{order.date}</span>
          </div>

          {/* Items List inside Receipt */}
          <div className="space-y-1.5 text-xs max-h-[120px] overflow-y-auto pr-1">
            {order.items.map((item) => (
              <div key={item.product.id} className="flex justify-between">
                <span className="text-slate-500 max-w-[185px] truncate">
                  {item.product.title} (x{item.qty})
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">
                  ${(item.product.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1 text-xs font-sans">
            <div className="flex justify-between text-slate-500">
              <span>Ship To</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {order.recipient}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span className="font-bold text-green-600">
                  -${order.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ${order.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-extrabold text-slate-900 dark:text-white text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Paid Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-full transition cursor-pointer"
          >
            Continue Shopping
          </button>
          <button
            onClick={copyReceiptToClipboard}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Copy Invoice Details"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
