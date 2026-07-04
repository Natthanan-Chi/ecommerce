"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onShopCatalogClick: () => void;
  onExploreElectronicsClick: () => void;
}

export default function Hero({
  onShopCatalogClick,
  onExploreElectronicsClick,
}: HeroProps) {
  return (
    <section className="relative rounded-3xl overflow-hidden mb-10 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 text-white min-h-[320px] sm:min-h-[400px] flex items-center px-6 sm:px-12 md:px-16 py-12 shadow-xl border border-slate-800">
      {/* Background Accent SVGs */}
      <div className="absolute right-0 top-0 bottom-0 opacity-20 pointer-events-none overflow-hidden select-none">
        <svg width="450" height="400" viewBox="0 0 450 400" fill="none" className="h-full w-auto">
          <circle cx="250" cy="150" r="150" stroke="url(#paint0_linear)" strokeWidth="40" strokeDasharray="10 20" />
          <defs>
            <linearGradient id="paint0_linear" x1="100" y1="0" x2="400" y2="300" gradientUnits="userSpaceOnUse">
              <stop stop-color="#6366f1" />
              <stop offset="1" stop-color="#4f46e5" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 max-w-xl">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-4 animate-bounce">
          🚀 Summer Sale: 20% off with code &quot;ZENITH20&quot;
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">
          Upgrade Your Daily Lifestyle Essentials.
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-md leading-relaxed">
          Meticulously engineered products crafted with premium materials. Unleash peak productivity, ultimate comfort, and minimal aesthetics today.
        </p>
        <div className="flex flex-wrap gap-4 font-sans">
          <button
            onClick={onShopCatalogClick}
            className="px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg hover:shadow-brand-500/20 hover:-translate-y-0.5 transition flex items-center gap-2 cursor-pointer"
          >
            <span>Shop Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreElectronicsClick}
            className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium backdrop-blur border border-white/10 hover:-translate-y-0.5 transition cursor-pointer"
          >
            Explore Electronics
          </button>
        </div>
      </div>
    </section>
  );
}
