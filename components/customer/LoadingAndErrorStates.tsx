"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, ShieldCheck } from "lucide-react";

type SkeletonBlockProps = {
  className?: string;
  rounded?: string;
};

export function SkeletonBlock({
  className = "",
  rounded = "rounded-xl",
}: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`${rounded} animate-pulse bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <SkeletonBlock className="aspect-[4/3] w-full" rounded="rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-5 w-12 rounded-full" />
        </div>
        <SkeletonBlock className="h-5 w-4/5" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-11/12" />
        <div className="flex items-center justify-between pt-2">
          <SkeletonBlock className="h-6 w-20" />
          <SkeletonBlock className="h-10 w-24" />
        </div>
      </div>
    </article>
  );
}

export function CatalogSkeleton({ showStats = false }: { showStats?: boolean }) {
  return (
    <section aria-busy="true" aria-live="polite" className="space-y-6">
      {showStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:ml-auto lg:w-[520px]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <SkeletonBlock className="mb-3 h-4 w-4" />
              <SkeletonBlock className="mb-2 h-7 w-16" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-10 w-24 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 w-44" />
            <SkeletonBlock className="h-10 w-32" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export function AccountSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-7 w-48" />
            <SkeletonBlock className="h-4 w-64 max-w-full" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <SkeletonBlock className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="flex justify-between gap-4">
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="h-3 w-36" />
                </div>
                <SkeletonBlock className="h-5 w-16" />
              </div>
              <SkeletonBlock className="h-4 w-4/5" />
              <SkeletonBlock className="h-9 w-40" />
            </div>
          ))}
        </section>

        <aside className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <section
              key={index}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <SkeletonBlock className="h-6 w-32" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-3/4" />
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}

export function AuthPanelSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-11 w-11" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3 w-56 max-w-full" />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="space-y-3">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-3">
      <div className="flex justify-start">
        <SkeletonBlock className="h-12 w-56 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <SkeletonBlock className="h-14 w-48 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <SkeletonBlock className="h-10 w-64 rounded-2xl" />
      </div>
    </div>
  );
}

type CustomerErrorStateProps = {
  title: string;
  message: string;
  detail?: string | null;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  tone?: "light" | "dark";
};

export function CustomerErrorState({
  title,
  message,
  detail,
  actionLabel = "Try again",
  onAction,
  href,
  tone = "light",
}: CustomerErrorStateProps) {
  const isDark = tone === "dark";
  const panelClass = isDark
    ? "border-red-900/60 bg-red-950/30 text-red-100"
    : "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100";
  const mutedClass = isDark ? "text-red-200/70" : "text-red-700/80 dark:text-red-200/70";

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-500";

  return (
    <div className={`rounded-2xl border p-5 text-center shadow-sm ${panelClass}`} role="alert">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15">
        <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-300" />
      </div>
      <h2 className="text-base font-extrabold">{title}</h2>
      <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${mutedClass}`}>{message}</p>
      {detail && (
        <p className={`mx-auto mt-2 max-w-md break-words text-xs ${mutedClass}`}>{detail}</p>
      )}
      {(onAction || href) && (
        <div className="mt-4">
          {href ? (
            <Link href={href} className={buttonClass}>
              <Home className="h-4 w-4" />
              {actionLabel}
            </Link>
          ) : (
            <button type="button" onClick={onAction} className={buttonClass}>
              <RefreshCw className="h-4 w-4" />
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type RouteErrorFallbackProps = {
  title?: string;
  message?: string;
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteErrorFallback({
  title = "Something went wrong",
  message = "This page hit an unexpected problem. You can retry the view or return to the store.",
  error,
  reset,
}: RouteErrorFallbackProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {message}
        </p>
        {error.digest && (
          <p className="mt-3 text-xs font-semibold text-slate-400 dark:text-slate-600">
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
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            Back to Store
          </Link>
        </div>
      </section>
    </main>
  );
}
