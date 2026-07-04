"use client";

import React from "react";
import { Sparkles, Search, Moon, Sun, Receipt, ShoppingBag } from "lucide-react";

interface HeaderProps {
  searchVal: string;
  onSearchChange: (val: string) => void;
  cartCount: number;
  hasOrders: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  onCartClick: () => void;
  onHistoryClick: () => void;
  onResetFilters: () => void;
}

export default function Header({
  searchVal,
  onSearchChange,
  cartCount,
  hasOrders,
  isDark,
  toggleTheme,
  onCartClick,
  onHistoryClick,
  onResetFilters,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={onResetFilters}
          className="flex items-center space-x-2 text-brand-600 dark:text-brand-500 hover:opacity-90 transition cursor-pointer"
        >
          <Sparkles className="w-8 h-8 text-brand-500 animate-pulse" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
            ZENITH
          </span>
        </button>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for premium goods..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all dark:placeholder-slate-400 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Header Utilities */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Order History Trigger */}
          <button
            onClick={onHistoryClick}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative cursor-pointer"
            aria-label="View Order History"
          >
            <Receipt className="w-5 h-5" />
            {hasOrders && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full" />
            )}
          </button>

          {/* Cart Toggle */}
          <button
            onClick={onCartClick}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full scale-90">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
