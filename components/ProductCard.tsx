"use client";

import React from "react";
import { Star, ShoppingCart } from "lucide-react";
import { Product } from "../data/products";

interface ProductCardProps {
  product: Product;
  onProductClick: (id: string) => void;
  onAddToCart: (id: string) => void;
}

export default function ProductCard({
  product,
  onProductClick,
  onAddToCart,
}: ProductCardProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
      {/* Image Frame */}
      <div
        className="relative bg-slate-50 dark:bg-slate-950/30 pt-[100%] overflow-hidden cursor-pointer"
        onClick={() => onProductClick(product.id)}
      >
        <img
          src={product.mainImage}
          alt={product.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x400/6366f1/ffffff?text=${encodeURIComponent(
              product.title
            )}`;
          }}
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition duration-500"
        />
        {/* Overlay Pill */}
        <div className="absolute top-3 left-3 flex gap-1">
          <span className="bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur text-white text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full">
            {product.category}
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating and reviews summary */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex text-amber-400 gap-0.5">{renderStars(product.rating)}</div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {product.rating.toFixed(1)}
            </span>
          </div>
          <h3
            className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1 hover:text-brand-600 dark:hover:text-brand-400 transition cursor-pointer"
            onClick={() => onProductClick(product.id)}
          >
            {product.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 mb-4 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div>
          {/* Pricing and checkout trigger */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[10px] text-slate-400 line-through font-medium">
                ${product.originalPrice.toFixed(2)}
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                ${product.price.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => onAddToCart(product.id)}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-700 dark:bg-slate-800 dark:hover:bg-brand-600 dark:text-slate-200 shadow-sm active:scale-95 transition-all cursor-pointer"
              aria-label="Quick Add to Bag"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
