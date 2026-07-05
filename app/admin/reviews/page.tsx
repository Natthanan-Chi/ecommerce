"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquareText, RefreshCw, Star, Trash2 } from "lucide-react";
import {
  deleteReview,
  fetchAdminReviews,
  type AdminReview,
} from "../../../data/products";
import {
  AdminCardsSkeleton,
  AdminErrorState,
  AdminStatGridSkeleton,
} from "../../../components/admin/AdminLoadingAndErrorStates";

function userLabel(review: AdminReview) {
  const fullName = `${review.users?.first_name ?? ""} ${review.users?.last_name ?? ""}`.trim();
  return fullName || review.users?.email || review.user_id;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      total: reviews.length,
      avg:
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0,
      anonymous: reviews.filter((review) => !review.display_name?.trim()).length,
    }),
    [reviews]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setReviews(await fetchAdminReviews());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = async (review: AdminReview) => {
    const ok = window.confirm("Delete this review? This cannot be undone.");
    if (!ok) return;

    setDeletingId(review.id);
    setError(null);
    try {
      await deleteReview(review.id);
      setReviews((prev) => prev.filter((item) => item.id !== review.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-screen-2xl">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Reviews</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Audit public review names while keeping the real account visible to admins.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="mb-8">
        {loading ? (
          <AdminStatGridSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["Total Reviews", stats.total],
              ["Average Rating", stats.avg.toFixed(1)],
              ["Anonymous Public Names", stats.anonymous],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <MessageSquareText className="w-5 h-5 text-brand-400 mb-3" />
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && !loading && reviews.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <AdminCardsSkeleton count={4} />
      ) : error ? (
        <AdminErrorState
          title="Unable to load reviews"
          message="The review moderation list could not be loaded right now."
          detail={error}
          onAction={load}
        />
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-500">
          No reviews yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-extrabold text-white">
                    {review.products?.title ?? "Deleted product"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(review.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-sm font-bold">{review.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-600">
                    Public display
                  </p>
                  <p className="text-sm font-semibold text-slate-200">
                    {review.display_name?.trim() || "Anonymous"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-600">
                    Real account
                  </p>
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {userLabel(review)}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{review.users?.email}</p>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-300 mb-4">{review.comment}</p>

              <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
                {review.products ? (
                  <Link
                    href={`/admin/products/${review.products.id}`}
                    className="text-xs font-bold text-brand-400 hover:text-brand-300"
                  >
                    View product
                  </Link>
                ) : (
                  <span className="text-xs text-slate-600">Product unavailable</span>
                )}
                <button
                  onClick={() => void handleDelete(review)}
                  disabled={deletingId === review.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-950"
                >
                  {deletingId === review.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
