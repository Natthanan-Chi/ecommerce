"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  Clipboard,
  MapPin,
  MessageCircle,
  PackageCheck,
  Star,
  Truck,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { AccountSkeleton, CustomerErrorState } from "../../components/customer/LoadingAndErrorStates";
import {
  fetchMyOrders,
  fetchMyReviews,
  type AccountReview,
  type CustomerOrder,
} from "../../data/products";

const OPEN_CHAT_EVENT = "zenith:open-chat";

function statusClass(status: CustomerOrder["status"]) {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "SHIPPED":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300";
    case "CANCELLED":
      return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
    case "PAID":
      return "bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300";
    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
  }
}

export default function AccountPage() {
  const router = useRouter();
  const { isLoading, user, displayName, avatarUrl, signOut } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [reviews, setReviews] = useState<AccountReview[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (isLoading || !user) return;

      setIsLoadingData(true);
      setOrdersError(null);
      setReviewsError(null);

      Promise.allSettled([fetchMyOrders(user.id), fetchMyReviews(user.id)])
        .then(([orderResult, reviewResult]) => {
          if (cancelled) return;

          if (orderResult.status === "fulfilled") {
            setOrders(orderResult.value);
          } else {
            setOrders([]);
            setOrdersError(orderResult.reason?.message ?? "Unable to load orders.");
          }

          if (reviewResult.status === "fulfilled") {
            setReviews(reviewResult.value);
          } else {
            setReviews([]);
            setReviewsError(reviewResult.reason?.message ?? "Unable to load reviews.");
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoadingData(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isLoading, reloadKey, user]);

  const handleAskAboutOrder = (order: CustomerOrder) => {
    window.dispatchEvent(
      new CustomEvent(OPEN_CHAT_EVENT, {
        detail: {
          orderId: order.id,
          orderLabel: order.id.slice(0, 8).toUpperCase(),
        },
      })
    );
  };

  const handleCopyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(orderId);
      window.setTimeout(() => setCopiedOrderId(null), 1800);
    } catch {
      return;
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <AccountSkeleton />
        </div>
      </main>
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
          <Link
            href="/login"
            className="block w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950"
          >
            Sign in or create account
          </Link>
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
            onClick={() => {
              void signOut().then(() => router.push("/login"));
            }}
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

        {isLoadingData ? (
          <AccountSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950 dark:text-white mb-4">
                <PackageCheck className="w-5 h-5 text-brand-500" /> Orders
              </h2>
              {ordersError ? (
                <CustomerErrorState
                  title="Orders unavailable"
                  message="Your order history could not be loaded right now."
                  detail={ordersError}
                  onAction={() => setReloadKey((current) => current + 1)}
                />
              ) : orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No orders yet.
                  </p>
                  <Link
                    href="/products"
                    className="mt-3 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-xs font-extrabold text-white"
                  >
                    Browse products
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
                    return (
                      <div
                        key={order.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                                {order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {order.date} • {itemCount} item{itemCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <p className="font-extrabold text-slate-950 dark:text-white">
                            ${order.total.toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-500 sm:grid-cols-2">
                          <p className="flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">{order.address}</span>
                          </p>
                          <p className="flex min-w-0 items-center gap-1.5">
                            <Truck className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {order.trackingNumber || "Tracking not available yet"}
                            </span>
                          </p>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div
                                  key={item.product.id}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/50"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                      {item.product.title}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Qty {item.qty} • {item.product.category}
                                    </p>
                                  </div>
                                  <p className="shrink-0 text-sm font-extrabold text-slate-900 dark:text-white">
                                    ${(item.product.price * item.qty).toFixed(2)}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                              <div>
                                <p className="text-slate-500">Subtotal</p>
                                <p className="font-extrabold text-slate-900 dark:text-white">
                                  ${order.subtotal.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">Discount</p>
                                <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                  -${order.discount.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">Tax</p>
                                <p className="font-extrabold text-slate-900 dark:text-white">
                                  ${order.tax.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">Shipping</p>
                                <p className="font-extrabold text-slate-900 dark:text-white">
                                  {order.shipping > 0 ? `$${order.shipping.toFixed(2)}` : "FREE"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrderId((current) =>
                                current === order.id ? null : order.id
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`}
                            />
                            {isExpanded ? "Hide details" : "View details"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleCopyOrderId(order.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Clipboard className="h-4 w-4" />
                            {copiedOrderId === order.id ? "Copied" : "Copy order ID"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAskAboutOrder(order)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-extrabold text-brand-700 transition hover:border-brand-400 hover:bg-brand-100 dark:border-brand-900/60 dark:bg-brand-950/40 dark:text-brand-300"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Ask about this order
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950 dark:text-white mb-4">
                  <Star className="w-5 h-5 text-amber-500" /> Reviews
                </h2>
                {reviewsError ? (
                  <CustomerErrorState
                    title="Reviews unavailable"
                    message="Your reviews could not be loaded right now."
                    detail={reviewsError}
                    onAction={() => setReloadKey((current) => current + 1)}
                  />
                ) : reviews.length === 0 ? (
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
