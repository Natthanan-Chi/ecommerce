"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../../../components/AuthProvider";
import { fetchCurrentUserProfile, type UserProfile } from "../../../data/products";

function isAdminRole(profile: UserProfile | null) {
  return (
    profile?.role === "admin" ||
    profile?.role === "staff" ||
    profile?.role === "support"
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const {
    isLoading: isAuthLoading,
    user,
    displayName,
    signInWithGitHub,
    signOut,
  } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (isAuthLoading || !user) return;

      setIsCheckingRole(true);
      setError(null);

      void fetchCurrentUserProfile(user.id)
        .then((data) => {
          if (cancelled) return;
          setProfile(data);
          if (isAdminRole(data)) router.replace("/admin");
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message ?? "Unable to verify admin role.");
        })
        .finally(() => {
          if (!cancelled) setIsCheckingRole(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAuthLoading, router, user]);

  const handleAdminSignIn = async () => {
    try {
      await signInWithGitHub({ next: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start admin sign in.");
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await signOut();
      setProfile(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out.");
    }
  };

  const isLoading = isAuthLoading || isCheckingRole;
  const isBlocked = user && profile && !isAdminRole(profile);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/30">
          <div className="border-b border-slate-800 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-900/40">
                <LockKeyhole className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  Admin Sign In
                </h1>
                <p className="text-xs text-slate-500">
                  Restricted access for Zenith operations
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
                Admin Portal
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Use an account marked as admin, staff, or support in Supabase.
                Customer accounts can still sign in to the store, but cannot enter the admin panel.
              </p>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Checking admin access...</span>
              </div>
            ) : isBlocked ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-amber-200">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-extrabold">No Admin Access</p>
                  </div>
                  <p className="text-sm text-slate-400">
                    {displayName || user.email} is signed in, but this account role is
                    `{profile.role}`.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                  Sign out and switch account
                </button>
              </div>
            ) : user && isAdminRole(profile) ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2 text-emerald-200">
                    <ShieldCheck className="h-5 w-5" />
                    <p className="text-sm font-extrabold">Admin access verified</p>
                  </div>
                  <p className="text-sm text-slate-400">Redirecting to admin panel...</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-500"
                >
                  Continue to Admin
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdminSignIn}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 active:scale-[0.99]"
              >
                <UserCircle className="h-5 w-5" />
                Continue with GitHub
              </button>
            )}

            {error && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <Link
              href="/login"
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-800 px-4 py-3 text-sm font-bold text-slate-400 transition hover:border-slate-700 hover:text-white"
            >
              Customer sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
