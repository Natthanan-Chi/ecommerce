"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, ShieldCheck } from "lucide-react";

type AdminSkeletonBlockProps = {
  className?: string;
  rounded?: string;
};

export function AdminSkeletonBlock({
  className = "",
  rounded = "rounded-xl",
}: AdminSkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`${rounded} animate-pulse bg-slate-800/80 ${className}`}
    />
  );
}

export function AdminStatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <AdminSkeletonBlock className="mb-3 h-5 w-5" />
          <AdminSkeletonBlock className="mb-2 h-7 w-16" />
          <AdminSkeletonBlock className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
    >
      <div className="grid grid-cols-4 gap-4 border-b border-slate-800 px-5 py-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <AdminSkeletonBlock key={index} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y divide-slate-800/70">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 items-center gap-4 px-5 py-4">
            <div className="space-y-2">
              <AdminSkeletonBlock className="h-4 w-24" />
              <AdminSkeletonBlock className="h-3 w-32" />
            </div>
            <AdminSkeletonBlock className="h-4 w-32" />
            <AdminSkeletonBlock className="h-6 w-20 rounded-full" />
            <AdminSkeletonBlock className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <AdminSkeletonBlock className="h-5 w-44" />
              <AdminSkeletonBlock className="h-3 w-28" />
            </div>
            <AdminSkeletonBlock className="h-6 w-14 rounded-full" />
          </div>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AdminSkeletonBlock className="h-20 w-full" />
            <AdminSkeletonBlock className="h-20 w-full" />
          </div>
          <AdminSkeletonBlock className="mb-2 h-4 w-full" />
          <AdminSkeletonBlock className="mb-5 h-4 w-4/5" />
          <div className="flex justify-between border-t border-slate-800 pt-4">
            <AdminSkeletonBlock className="h-4 w-24" />
            <AdminSkeletonBlock className="h-9 w-20" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminSplitPaneSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]"
    >
      <AdminTableSkeleton rows={5} />
      <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-5 flex items-center gap-3">
          <AdminSkeletonBlock className="h-5 w-5" />
          <AdminSkeletonBlock className="h-5 w-28" />
        </div>
        <div className="space-y-4">
          <AdminSkeletonBlock className="h-16 w-full" />
          <AdminSkeletonBlock className="h-16 w-full" />
          <AdminSkeletonBlock className="h-11 w-full" />
        </div>
        <div className="mt-6 space-y-3 border-t border-slate-800 pt-5">
          <AdminSkeletonBlock className="h-3 w-20" />
          <AdminSkeletonBlock className="h-4 w-full" />
          <AdminSkeletonBlock className="h-4 w-5/6" />
          <AdminSkeletonBlock className="h-16 w-full" />
        </div>
      </aside>
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-3"
    >
      <div className="space-y-6 lg:col-span-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <section key={index} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <AdminSkeletonBlock className="mb-5 h-5 w-40" />
            <div className="space-y-4">
              <AdminSkeletonBlock className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <AdminSkeletonBlock className="h-12 w-full" />
                <AdminSkeletonBlock className="h-12 w-full" />
              </div>
              <AdminSkeletonBlock className="h-32 w-full" />
            </div>
          </section>
        ))}
      </div>
      <aside className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <AdminSkeletonBlock className="mb-4 h-5 w-32" />
          <div className="space-y-4">
            <AdminSkeletonBlock className="h-10 w-full" />
            <AdminSkeletonBlock className="h-12 w-full" />
            <AdminSkeletonBlock className="h-12 w-full" />
          </div>
        </section>
        <AdminSkeletonBlock className="h-12 w-full" />
      </aside>
    </div>
  );
}

export function AdminProductDetailSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <AdminSkeletonBlock className="h-4 w-56" />
        <div className="flex gap-2">
          <AdminSkeletonBlock className="h-10 w-20" />
          <AdminSkeletonBlock className="h-10 w-28" />
        </div>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <AdminSkeletonBlock className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <AdminSkeletonBlock key={index} className="h-16 w-16" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="flex gap-2">
            <AdminSkeletonBlock className="h-7 w-20 rounded-full" />
            <AdminSkeletonBlock className="h-7 w-28 rounded-full" />
          </div>
          <AdminSkeletonBlock className="h-10 w-4/5" />
          <AdminSkeletonBlock className="h-4 w-32" />
          <AdminSkeletonBlock className="h-32 w-full rounded-2xl" />
          <AdminSkeletonBlock className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function AdminChatSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-[380px_1fr]"
    >
      <aside className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="grid grid-cols-3 border-b border-slate-800">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-slate-800 p-4">
              <AdminSkeletonBlock className="mx-auto mb-2 h-6 w-10" />
              <AdminSkeletonBlock className="mx-auto h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-3 border-b border-slate-800 p-4">
          <AdminSkeletonBlock className="h-10 w-full" />
          <AdminSkeletonBlock className="h-10 w-full" />
          <div className="grid grid-cols-3 gap-2">
            <AdminSkeletonBlock className="h-9 w-full" />
            <AdminSkeletonBlock className="h-9 w-full" />
            <AdminSkeletonBlock className="h-9 w-full" />
          </div>
        </div>
        <div className="divide-y divide-slate-800">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-4 py-4">
              <div className="mb-3 flex justify-between gap-3">
                <div className="space-y-2">
                  <AdminSkeletonBlock className="h-4 w-32" />
                  <AdminSkeletonBlock className="h-3 w-40" />
                </div>
                <AdminSkeletonBlock className="h-5 w-8 rounded-full" />
              </div>
              <AdminSkeletonBlock className="h-3 w-56" />
            </div>
          ))}
        </div>
      </aside>
      <section className="min-h-[620px] rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-5">
          <AdminSkeletonBlock className="mb-2 h-5 w-48" />
          <AdminSkeletonBlock className="h-3 w-72 max-w-full" />
        </div>
        <div className="space-y-4 p-6">
          <AdminSkeletonBlock className="h-16 w-72 rounded-2xl" />
          <AdminSkeletonBlock className="ml-auto h-14 w-64 rounded-2xl" />
          <AdminSkeletonBlock className="h-20 w-80 max-w-full rounded-2xl" />
        </div>
      </section>
    </div>
  );
}

type AdminErrorStateProps = {
  title: string;
  message: string;
  detail?: string | null;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
};

export function AdminErrorState({
  title,
  message,
  detail,
  actionLabel = "Try again",
  onAction,
  href,
}: AdminErrorStateProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-red-900/70 bg-red-950/30 p-6 text-center shadow-xl shadow-black/20"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-extrabold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-100/75">{message}</p>
      {detail && (
        <p className="mx-auto mt-2 max-w-lg break-words text-xs text-red-100/55">
          {detail}
        </p>
      )}
      {(onAction || href) && (
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-500"
            >
              <RefreshCw className="h-4 w-4" />
              {actionLabel}
            </button>
          )}
          {href && (
            <Link
              href={href}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-extrabold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <Home className="h-4 w-4" />
              Back to Admin
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

type AdminRouteErrorFallbackProps = {
  title?: string;
  message?: string;
  error: Error & { digest?: string };
  reset: () => void;
};

export function AdminRouteErrorFallback({
  title = "Admin view problem",
  message = "This admin page could not render. Retry the view or return to the admin dashboard.",
  error,
  reset,
}: AdminRouteErrorFallbackProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/20 text-brand-300">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
        {error.digest && (
          <p className="mt-3 text-xs font-semibold text-slate-600">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-brand-500"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-extrabold text-slate-300 transition hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            Back to Admin
          </Link>
        </div>
      </section>
    </main>
  );
}
