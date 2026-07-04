"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../AuthProvider";
import { fetchCurrentUserProfile, type UserProfile } from "../../data/products";

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isLoading: isAuthLoading, user, signInWithGitHub } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (isAuthLoading) return;

      if (!user) {
        setProfile(null);
        setIsLoadingProfile(false);
        setError(null);
        return;
      }

      setIsLoadingProfile(true);
      setError(null);

      void fetchCurrentUserProfile(user.id)
        .then((data) => {
          if (!cancelled) setProfile(data);
        })
        .catch((err: Error) => {
          if (!cancelled) {
            setError(err.message ?? "Unable to verify admin access.");
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoadingProfile(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAuthLoading, user]);

  const isLoading = isAuthLoading || isLoadingProfile;
  const isAllowed = profile?.role === "admin" || profile?.role === "staff";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-500" />
        <p className="text-xs font-semibold uppercase tracking-wide">
          Verifying admin access
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl">
          <ShieldCheck className="w-10 h-10 mx-auto mb-4 text-brand-500" />
          <h1 className="text-xl font-extrabold text-white mb-2">Admin Sign In Required</h1>
          <p className="text-sm text-slate-400 mb-5">
            Please sign in before managing products.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGitHub()}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-500 transition"
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl">
          <AlertCircle className="w-10 h-10 mx-auto mb-4 text-amber-400" />
          <h1 className="text-xl font-extrabold text-white mb-2">No Admin Access</h1>
          <p className="text-sm text-slate-400 mb-2">
            Your account is signed in, but it is not marked as admin or staff.
          </p>
          {error && <p className="text-xs text-red-300 mb-4">{error}</p>}
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 transition"
          >
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
