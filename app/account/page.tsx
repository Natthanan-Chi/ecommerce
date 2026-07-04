"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Loader2, MapPin, PackageCheck, Star, UserCircle } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import {
  fetchMyOrders,
  fetchMyReviews,
  type AccountReview,
  type CustomerOrder,
} from "../../data/products";

export default function AccountPage() {
  const { isLoading, user, displayName, avatarUrl, signInWithGitHub, signOut } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [reviews, setReviews] = useState<AccountReview[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (isLoading || !user) return;

      setIsLoadingData(true);
      setError(null);

      Promise.all([fetchMyOrders(), fetchMyReviews(user.id)])
        .then(([orderData, reviewData]) => {
          if (!cancelled) {
            setOrders(orderData);
            setReviews(reviewData);
          }
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message ?? "Unable to load account data.");
        })
        .finally(() => {
          if (!cancelled) setIsLoadingData(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-xl">
          <UserCircle className="w-12 h-12 mx-auto mb-4 text-brand-500" />
          <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white mb-2">
            Sign in to your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            View your orders, reviews, and saved checkout details.
          </p>
          <button
            onClick={() => void signInWithGitHub()}
            className="w-full rounded-xl bg-slate-950 dark:bg-white px-4 py-3 text-sm font-bold text-white dark:text-slate-950"
          >
            Sign in with GitHub
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link href="/" className="text-sm font-bold text-brand-600 dark:text-brand-400">
            Back to Store
          </Link>
          <button
            onClick={() => void signOut()}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300"
          >
            Sign out
          </button>
        </div>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-6">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full" />
            ) : (
              <UserCircle className="w-14 h-14 text-slate-400" />
            )}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                {displayName || "Customer"}
              </h1>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        {isLoadingData ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950 dark:text-white mb-4">
                <PackageCheck className="w-5 h-5 text-brand-500" /> Orders
              </h2>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                            {order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-500">{order.date}</p>
                        </div>
                        <p className="font-extrabold text-slate-950 dark:text-white">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                      <p className="mt-3 text-sm text-slate-500 truncate">{order.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950 dark:text-white mb-4">
                  <Star className="w-5 h-5 text-amber-500" /> Reviews
                </h2>
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {review.products?.title ?? "Deleted product"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Public name: {review.display_name?.trim() || "Anonymous"}
                        </p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950 dark:text-white mb-2">
                  <MapPin className="w-5 h-5 text-emerald-500" /> Saved Address
                </h2>
                <p className="text-sm text-slate-500">
                  Address book is reserved for the next checkout phase.
                </p>
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
