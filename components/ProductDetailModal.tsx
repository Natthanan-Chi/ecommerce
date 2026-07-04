"use client";

import React, { useState, useEffect } from "react";
import { X, Minus, Plus, ShoppingCart, Edit3, Send, Star } from "lucide-react";
import { Product } from "../data/products";

interface ProductDetailModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (id: string, qty: number) => void;
  onAddReview: (
    productId: string,
    review: { author: string; rating: number; comment: string }
  ) => void;
}

export default function ProductDetailModal({
  isOpen,
  product,
  onClose,
  onAddToCart,
  onAddReview,
}: ProductDetailModalProps) {
  const [selectedImage, setSelectedImage] = useState(product?.mainImage || "");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "reviews">("specs");
  const [selectedStars, setSelectedStars] = useState(0);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [animateShow, setAnimateShow] = useState(false);

  // Sync animations asynchronously on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || !product) return null;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) {
      alert("Please supply your name and comment.");
      return;
    }
    if (selectedStars === 0) {
      alert("Please select a star rating.");
      return;
    }

    onAddReview(product.id, {
      author: author.trim(),
      rating: selectedStars,
      comment: comment.trim(),
    });

    // Reset review form inputs
    setAuthor("");
    setComment("");
    setSelectedStars(0);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star className="w-4 h-4 text-slate-300 dark:text-slate-700" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-slate-300 dark:text-slate-700" />
        );
      }
    }
    return stars;
  };

  const allImages = [product.mainImage, ...product.alternateImages];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 lg:p-8"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          animateShow ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Card Container */}
      <div
        className={`relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden transition-all duration-350 transform ${
          animateShow ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shadow hover:scale-105 transition cursor-pointer"
          aria-label="Close Details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Product Gallery */}
        <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-950/50 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
          <div className="flex-1 flex items-center justify-center min-h-[250px] sm:min-h-[350px]">
            <img
              src={selectedImage}
              alt={product.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/600x600/6366f1/ffffff?text=Image+Unavailable";
              }}
              className="max-h-[350px] object-contain rounded-xl hover:scale-105 transition duration-300"
            />
          </div>
          {/* Thumbnails Grid */}
          <div className="flex gap-2.5 mt-4 overflow-x-auto justify-center py-2 scrollbar-none">
            {allImages.map((img, index) => {
              const isSelected = selectedImage === img;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden focus:outline-none bg-white transition hover:opacity-90 cursor-pointer ${
                    isSelected
                      ? "border-brand-500"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/100x100/6366f1/ffffff?text=X";
                    }}
                    className="w-full h-full object-contain p-0.5"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Info, Purchase Actions, Reviews Tabs */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col max-h-[85vh] md:max-h-[80vh] overflow-y-auto">
          <span className="text-xs font-bold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
            {product.category}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 mb-2">
            {product.title}
          </h2>

          {/* Rating Summary */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center text-amber-400 gap-0.5">
              {renderStars(product.rating)}
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({product.reviews.length} Review{product.reviews.length === 1 ? "" : "s"})
            </span>
          </div>

          {/* Price Block */}
          <div className="flex items-baseline gap-3 mb-6 font-sans">
            <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-base text-slate-400 dark:text-slate-600 line-through font-medium">
              ${product.originalPrice.toFixed(2)}
            </span>
          </div>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Quantity Selector & Add Button */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-full py-1.5 px-3 bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => onAddToCart(product.id, quantity)}
              className="flex-1 py-3 px-6 rounded-full bg-brand-600 hover:bg-brand-500 active:scale-[0.98] text-white font-semibold text-sm transition shadow-lg shadow-brand-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add To Bag</span>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="border-b border-slate-200 dark:border-slate-800 mb-4 flex gap-4 text-sm font-medium">
            <button
              onClick={() => setActiveTab("specs")}
              className={`pb-2 transition cursor-pointer ${
                activeTab === "specs"
                  ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "reviews"
                  ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Customer Reviews{" "}
              <span className="bg-slate-100 dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {product.reviews.length}
              </span>
            </button>
          </div>

          {/* Specifications Content */}
          {activeTab === "specs" && (
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-3 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-medium">Warranty</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-semibold">
                  {product.specs.warranty}
                </span>
              </div>
              <div className="grid grid-cols-3 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-medium">Materials</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-semibold">
                  {product.specs.materials}
                </span>
              </div>
              <div className="grid grid-cols-3 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-medium">Dimensions</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-semibold">
                  {product.specs.dimensions}
                </span>
              </div>
            </div>
          )}

          {/* Reviews Content */}
          {activeTab === "reviews" && (
            <div className="space-y-6 mb-6">
              {/* Add Review Container */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase mb-3 flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" /> Add Your Review
                </h4>

                {/* Star Selector */}
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-xs text-slate-500 mr-2">Your Rating:</span>
                  <div className="flex items-center gap-0.5 text-slate-300">
                    {[1, 2, 3, 4, 5].map((starIndex) => {
                      const isHighlighted = starIndex <= selectedStars;
                      return (
                        <button
                          key={starIndex}
                          type="button"
                          onClick={() => setSelectedStars(starIndex)}
                          className="hover:scale-110 transition cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              isHighlighted
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-700"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment Inputs */}
                <form onSubmit={handleReviewSubmit} className="space-y-2 mb-3">
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Your name (e.g. Liam S.)"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                  />
                  <textarea
                    required
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell other buyers about your experience..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3" /> Submit Review
                  </button>
                </form>
              </div>

              {/* Existing Reviews List */}
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                {product.reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Be the first to review this outstanding piece!
                  </p>
                ) : (
                  product.reviews.map((rev, index) => (
                    <div
                      key={index}
                      className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {rev.author}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {rev.date}
                        </span>
                      </div>
                      <div className="flex gap-0.5 text-amber-400 mb-1.5">
                        {[1, 2, 3, 4, 5].map((starIdx) => {
                          const isFilled = starIdx <= rev.rating;
                          return (
                            <Star
                              key={starIdx}
                              className={`w-3 h-3 ${
                                isFilled
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300 dark:text-slate-700"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
