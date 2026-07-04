"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  Loader2,
  LogOut,
  Moon,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  UserCircle,
} from "lucide-react";

interface HeaderProps {
  searchVal: string;
  onSearchChange: (val: string) => void;
  cartCount: number;
  hasOrders: boolean;
  isDark: boolean;
  toggleTheme: () => void;
  onCartClick: () => void;
  onHistoryClick: () => void;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  authUserName: string;
  onSignInWithGitHub: () => void;
  onSignOut: () => void;
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
  isAuthLoading,
  isAuthenticated,
  authUserName,
  onSignInWithGitHub,
  onSignOut,
}: HeaderProps) {
  const pathname = usePathname();
  const isProductsActive = pathname === "/products";

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
        <Link
          href="/"
          className="flex items-center space-x-2 text-brand-600 dark:text-brand-500 hover:opacity-90 transition cursor-pointer"
          aria-label="Go to homepage"
        >
          <Sparkles className="w-8 h-8 text-brand-500 animate-pulse" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
            ZENITH
          </span>
        </Link>

          <nav className="hidden sm:flex items-center gap-1" aria-label="Main navigation">
            <Link
              href="/products"
              className={`px-3 py-2 rounded-full text-xs font-bold transition ${
                isProductsActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Products
            </Link>
          </nav>
        </div>

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
          {isAuthLoading ? (
            <div
              className="p-2 rounded-full text-slate-400 dark:text-slate-500"
              aria-label="Checking session"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 max-w-[150px] text-xs font-semibold text-slate-600 dark:text-slate-300">
                <UserCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{authUserName}</span>
              </div>
              <button
                onClick={onSignOut}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Sign Out"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInWithGitHub}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition text-xs font-bold cursor-pointer"
            >
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

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
