"use client";

import React, { useEffect } from "react";
import {
  Info,
  Gift,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ShoppingBag,
  Sun,
  Moon,
  Filter,
} from "lucide-react";

const iconMap = {
  info: Info,
  gift: Gift,
  "trash-2": Trash2,
  "check-circle": CheckCircle,
  "alert-triangle": AlertTriangle,
  "shopping-bag": ShoppingBag,
  sun: Sun,
  moon: Moon,
  filter: Filter,
};

type IconType = keyof typeof iconMap;

interface ToastProps {
  message: string;
  iconName: string;
  visible: boolean;
  onDismiss: () => void;
}

export default function Toast({ message, iconName, visible, onDismiss }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  const IconComponent = iconMap[iconName as IconType] || Info;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 pointer-events-none ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-10 opacity-0"
      }`}
    >
      <div className="p-1 rounded-full text-brand-400 dark:text-brand-600">
        <IconComponent className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold">{message}</p>
      </div>
    </div>
  );
}
